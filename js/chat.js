/* ============================================================
   SOUNDMARKET — MESSAGGISTICA E NEGOZIAZIONE
   Store conversazioni per utente · Motore NLP a 12 intenti
   Risposte variabili da musicista · Invio foto reale in chat
   Offerte vincolanti con negoziazione · Typing indicator
   Notifiche non lette · Persistenza localStorage completa
   API invariata per compatibilità con app/auth/payments.
   ============================================================ */
'use strict';

const SMChat = (() => {

  const key = (uid) => 'sm.threads.' + uid;
  const timers = new Map();

  const threads = () => {
    const u = SMAuth.current();
    return u ? SMU.store.get(key(u.id), []) : [];
  };
  const save = (list) => {
    const u = SMAuth.current();
    if (u) SMU.store.set(key(u.id), list);
  };
  const byId = (id) => threads().find(t => t.id === id) || null;
  const bySku = (sku) => threads().find(t => t.sku === sku) || null;
  const unreadTotal = () => threads().reduce((n, t) => n + (t.unread || 0), 0);

  const now = () => Date.now();
  const stamp = () => SMU.fmtTime(now());

  const push = (threadId, msg) => {
    const list = threads();
    const t = list.find(x => x.id === threadId);
    if (!t) return null;
    t.msgs.push(msg);
    t.updatedAt = now();
    save(list);
    return t;
  };

  const markRead = (id) => {
    const list = threads();
    const t = list.find(x => x.id === id);
    if (t && t.unread) { t.unread = 0; save(list); }
  };

  const ensureThread = (item) => {
    const existing = bySku(item.sku);
    if (existing) return existing;
    const t = {
      id: SMU.uid('t'),
      sku: item.sku,
      title: item.title,
      seller: typeof item.seller === 'object' ? item.seller.name : item.seller,
      sellerGender: typeof item.seller === 'object' ? item.seller.gender : 'm',
      img: item.images[0],
      category: item.category,
      msgs: [],
      unread: 0,
      createdAt: now(),
      updatedAt: now()
    };
    const list = threads();
    list.unshift(t);
    save(list);
    return t;
  };

  /* ---------- Conversazione demo pre-popolata ---------- */
  const seedDemoThread = (uid) => {
    const item = SMData.ITEMS.find(i => i.sku === 'STR-001');
    if (!item) return;
    const base = now() - 3600000 * 5;
    const t = {
      id: 't-demo-1',
      sku: item.sku,
      title: item.title,
      seller: item.seller.name,
      sellerGender: item.seller.gender,
      img: item.images[0],
      category: item.category,
      unread: 1,
      createdAt: base,
      updatedAt: base + 240000,
      msgs: [
        { f: 'me', t: 'Buongiorno. Sono interessato alla Player Stratocaster. È ancora disponibile?', d: SMU.fmtTime(base), ts: base },
        { f: 'them', t: 'Buongiorno! Sì, confermo la disponibilità. Lo strumento è in condizioni eccellenti come da scheda: setup fatto a marzo, pickup Alnico 5 silenziosissimi.', d: SMU.fmtTime(base + 120000), ts: base + 120000 },
        { f: 'them', t: 'Se vuoi ti mando qualche scatto in più del manico e del vano molle, così vedi tutto nel dettaglio.', d: SMU.fmtTime(base + 240000), ts: base + 240000 }
      ]
    };
    SMU.store.set(key(uid), [t]);
  };

  /* ==========================================================
     MOTORE NLP — 12 intenti con risposte da musicista vero
     ========================================================== */
  const norm = (s) => String(s || '').toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/['’]/g, ' ');

  const extractAmount = (text) => {
    const m = norm(text).match(/(\d[\d.,]*)\s*(euro|eur|€)?/);
    if (!m) return NaN;
    const n = SMU.parseAmount(m[1]);
    return (n >= 5 && n <= 100000) ? n : NaN;
  };

  const INTENTS = [
    { id: 'photos', p: 10, test: t => /(foto|immagin|scatt|vedere meglio|dettagli visivi|gallery|galleria|mandami|inviami)/.test(t) },
    { id: 'discount', p: 9, test: t => /(scont|trattab|prezzo (finale|minimo|ultimo)|accett|offerta|ribass|limare|venire incontro|ultimo prezzo|quanto puoi scendere)/.test(t) },
    { id: 'shipping', p: 8, test: t => /(spediz|corriere|consegn|tracking|imball|pacco|ritiro a mano|quando arriva|giorni|brt|dhl|poste)/.test(t) },
    { id: 'condition', p: 8, test: t => /(condizion|difett|graffi|usura|stato|grading|funziona|problemi|tasti|corde|setup|action|intonazion)/.test(t) },
    { id: 'payment', p: 8, test: t => /(pagament|pagare|carta|paypal|bonifico|escrow|protezione|rimborso|garanzia|rate|klarna)/.test(t) },
    { id: 'audio', p: 8, test: t => /(suono|audio|prova|demo|ascoltare|sample|registrazione|timbro|video|sentire)/.test(t) },
    { id: 'specs', p: 7, test: t => /(specific|scheda tecnica|legno|pickup|scala|tasti|anno|serie|modello|made in|peso|potenza|valvole)/.test(t) },
    { id: 'availability', p: 7, test: t => /(disponibil|ancora|venduto|riservato|libero|in vendita|ce l hai)/.test(t) },
    { id: 'location', p: 7, test: t => /(dove|citta|zona|ritiro|provenienza|spedisci da|vieni a|consegna a mano)/.test(t) },
    { id: 'bundle', p: 7, test: t => /(bundle|pacchetto|insieme|altri articoli|sconto se prendo|piu cose|due articoli)/.test(t) },
    { id: 'accessories', p: 6, test: t => /(custodia|case|astuccio|accessori|incluso|compreso|alimentatore|pedale|corde|tracolla|borsa)/.test(t) },
    { id: 'greeting', p: 3, test: t => /^(ciao|salve|buongiorno|buonasera|ehi|hello|hi)\b/.test(t) },
    { id: 'thanks', p: 3, test: t => /(grazie|perfetto|ottimo|gentilissimo|ti ringrazio|alla prossima)/.test(t) }
  ];

  const REPLIES = {
    greeting: [
      'Ciao! Sì, lo strumento è ancora disponibile. Dimmi pure cosa vuoi sapere, sono qui.',
      'Buongiorno! Confermo che è in vendita. Se hai domande su condizioni o setup chiedi tranquillamente.',
      'Ciao, grazie per il messaggio. L\u2019annuncio è attivo, sono a disposizione per qualsiasi dettaglio.'
    ],
    thanks: [
      'Figurati! Se decidi di procedere puoi acquistare direttamente dalla scheda, la Protezione Acquisti copre tutto.',
      'Grazie a te. Resto a disposizione, se cambi idea o vuoi altre info scrivimi pure.',
      'Di nulla! Buona musica, e se serve altro sono qui.'
    ],
    availability: [
      'Sì, confermo: è ancora disponibile e non ho trattative aperte al momento.',
      'Disponibile, nessuna offerta vincolante in corso. Puoi procedere quando vuoi.',
      'Ce l\u2019ho ancora, nessun altro acquirente ha confermato. Se ti interessa direi di non aspettare troppo però.'
    ],
    condition: [
      'Le condizioni sono quelle dichiarate in scheda: setup recente, elettronica originale verificata, nessun difetto funzionale. L\u2019usura estetica è documentata nelle foto.',
      'L\u2019ho fatto settare da un liutaio prima di metterlo in vendita: action bassa, intonazione perfetta su tutta la tastiera, nessun fruscio sui potenziometri.',
      'Ti confermo che suona perfettamente. I micro-segni che vedi sono solo estetici, nulla che influisca sulla suonabilità. Posso mandarti un video se vuoi sentirlo.'
    ],
    shipping: [
      'Spedisco con BRT o DHL entro 24 ore dal pagamento, imballo professionale con doppio cartone e angolari. Tracking ti arriva in chat appena parte.',
      'Imballo da musicista: custodia rigida dentro scatola rinforzata, manico immobilizzato, corde allentate di un tono. Assicurazione inclusa fino a 3000 euro.',
      'Consegna in 2-3 giorni lavorativi con corriere assicurato. Se preferisci il ritiro a mano sono disponibile, così risparmi la spedizione e lo provi di persona.'
    ],
    payment: [
      'Il pagamento passa dalla piattaforma con escrow: i tuoi soldi restano bloccati finché non confermi che è tutto ok. Hai 48 ore per verificare con calma.',
      'Accetto carta, PayPal, Apple Pay e anche Klarna in 3 rate se preferisci. Tutto gestito da SoundMarket, io non vedo i dati della tua carta.',
      'La Protezione Acquisti copre tutto: se arriva diverso da come descritto o danneggiato, rimborso integrale. Transazione sicura al 100%.'
    ],
    audio: [
      'Nella scheda c\u2019è il player con una demo registrata direttamente dallo strumento, senza post-produzione. Sentilo e dimmi che ne pensi.',
      'Ho caricato un sample pulito: quello che senti è esattamente il timbro dello strumento. Se vuoi una prova specifica su un genere dimmelo che registro qualcosa.',
      'Il suono è quello che ti aspetti da questo modello. Il player in scheda è fedele, registrato con setup standard. Per prove live posso organizzare una videochiamata.'
    ],
    specs: [
      'Tutte le specifiche sono in scheda, stile Thomann: legno, pickup, scala, tasti, anno e paese di produzione. Se ti serve un dato particolare che non trovi, chiedimi.',
      'È la versione esatta indicata nel titolo, con quella configurazione di fabbrica. Nessuna modifica aftermarket, tutto originale.',
      'Ti confermo i dati tecnici: sono quelli riportati nella tabella. Ho verificato personalmente numero di serie e anno di produzione.'
    ],
    location: [
      'Spedisco da {city}. Per il ritiro a mano sono disponibile in zona, previo appuntamento: così lo provi con calma e risparmi la spedizione.',
      'Sono a {city}. Consegna a mano volentieri in centro, oppure spedizione assicurata in tutta Italia.',
      'Zona {city}. Se sei vicino possiamo vederci, altrimenti corriere tracciato in 2-3 giorni.'
    ],
    bundle: [
      'Se prendi più articoli dal mio profilo ti faccio uno sconto sulla spedizione combinata e limo qualcosa sul totale. Dimmi cosa ti interessa.',
      'Per acquisti multipli sono flessibile: scrivimi quali pezzi vuoi abbinare e ti preparo un\u2019offerta dedicata.',
      'I bundle li gestisco volentieri. Aggiungi gli altri articoli ai preferiti e ne parliamo, sicuramente troviamo un accordo.'
    ],
    accessories: [
      'Sì, tutto quello che vedi elencato in descrizione è incluso: custodia, accessori originali e documentazione. Nulla di extra rispetto a quanto scritto.',
      'La custodia è compresa nel prezzo, così come gli accessori originali. Se ti serve altro (tracolla, corde di ricambio) posso aggiungerlo a costo simbolico.',
      'Confermo: alimentatore originale, custodia e manuale inclusi. Lo vendo completo, esattamente come quando l\u2019ho comprato.'
    ],
    fallback: [
      'Bella domanda. Ti rispondo con precisione: fammi verificare un attimo e torno da te.',
      'Su questo punto ti dico la mia: lo strumento è in ordine, ma se vuoi un dettaglio specifico dimmelo che controllo.',
      'Preferisco essere trasparente: quello che so te lo dico subito, quello che devo verificare te lo confermo a breve.'
    ]
  };

  const detect = (text) => {
    const t = norm(text);
    let best = null;
    for (const it of INTENTS) if (it.test(t) && (!best || it.p > best.p)) best = it;
    return best ? best.id : 'fallback';
  };

  const discountDecision = (amount, price) => {
    if (!isFinite(amount)) return SMU.pick(['soft-yes', 'no', 'counter-ask']);
    const r = amount / price;
    if (r >= 0.93) return 'accept';
    if (r >= 0.80) return 'counter';
    return 'reject';
  };

  const buildReply = (userText, item) => {
    const intent = detect(userText);
    const price = item ? item.price : 0;
    const city = item && item.seller ? (item.seller.city || 'Milano') : 'Milano';

    /* Foto: risposta + invio immagini reali */
    if (intent === 'photos') {
      const srcs = item ? item.images.slice(0, 3) : [];
      return { msgs: [
        { f: 'them', t: SMU.pick([
          'Certo, ecco qualche scatto in più. Guarda i dettagli di tastiera, hardware e finitura, così vedi tutto.',
          'Ti mando la galleria completa. Le foto sono recenti, fatte con luce naturale per non falsare i colori.',
          'Ecco le foto ravvicinate che mi hai chiesto. Se vuoi un\u2019angolazione particolare dimmelo che ne faccio altre.'
        ]), d: stamp(), ts: now() },
        { f: 'them', kind: 'photos', srcs: srcs, t: 'Galleria fotografica dell\u2019articolo', d: stamp(), ts: now() + 1 }
      ]};
    }

    /* Sconto: negoziazione reale con offerta strutturata */
    if (intent === 'discount') {
      const amount = extractAmount(userText);
      const decision = discountDecision(amount, price);
      if (decision === 'accept') {
        return { msgs: [
          { f: 'them', t: 'Dai, ' + SMU.fmtMoney(amount) + ' ci può stare. Accetto: procedi pure al checkout con l\u2019importo concordato, ti spedisco domani.', d: stamp(), ts: now() },
          { f: 'them', kind: 'offer', from: 'seller', amount: amount, status: 'pending', t: 'Prezzo concordato in trattativa', d: stamp(), ts: now() + 1 }
        ]};
      }
      if (decision === 'counter') {
        const counter = SMU.round2(Math.round((amount + price) / 2));
        return { msgs: [
          { f: 'them', t: 'A ' + SMU.fmtMoney(amount) + ' proprio non riesco, ci rimetto troppo. Facciamo ' + SMU.fmtMoney(counter) + ' e chiudiamo: è il mio ultimo prezzo, spedizione inclusa.', d: stamp(), ts: now() },
          { f: 'them', kind: 'offer', from: 'seller', amount: counter, status: 'pending', t: 'Controfferta del venditore', d: stamp(), ts: now() + 1 }
        ]};
      }
      if (decision === 'reject') {
        return { msgs: [
          { f: 'them', t: SMU.pick([
            'Capisco la proposta ma ' + SMU.fmtMoney(amount) + ' è troppo sotto il valore di mercato per queste condizioni. Resto a ' + SMU.fmtMoney(price) + ', che è già onesto.',
            'No, a quella cifra non me la sento. Lo strumento vale ' + SMU.fmtMoney(price) + ' e ho già avuto interesse a quel prezzo. Se ripensi fammi un fischio.'
          ]), d: stamp(), ts: now() }
        ]};
      }
      const d = SMU.pick(['soft-yes', 'no', 'counter-ask']);
      if (d === 'soft-yes') {
        const offer = SMU.round2(Math.round(price * 0.94));
        return { msgs: [
          { f: 'them', t: 'Un piccolo margine ce l\u2019ho. Posso scendere a ' + SMU.fmtMoney(offer) + ' se confermi oggi. Ti va?', d: stamp(), ts: now() },
          { f: 'them', kind: 'offer', from: 'seller', amount: offer, status: 'pending', t: 'Proposta del venditore', d: stamp(), ts: now() + 1 }
        ]};
      }
      if (d === 'no') {
        return { msgs: [{ f: 'them', t: SMU.pick([
          'Il prezzo è già calibrato sul mercato dell\u2019usato per questo grading, non ho margine di trattativa. Preferisco essere trasparente fin da subito.',
          'Guarda, ho già messo il prezzo minimo sostenibile. Setup e verifica hanno un costo, quindi resto a ' + SMU.fmtMoney(price) + '.'
        ]), d: stamp(), ts: now() }]};
      }
      return { msgs: [{ f: 'them', t: 'Sono aperto a valutare una proposta seria. Dimmi la tua cifra e ti rispondo sinceramente, senza giri di parole.', d: stamp(), ts: now() }]};
    }

    const pool = REPLIES[intent] || REPLIES.fallback;
    return { msgs: [{ f: 'them', t: SMU.pick(pool).replace(/\{city\}/g, city), d: stamp(), ts: now() }]};
  };

  /* ==========================================================
     INVIO E RISPOSTA AUTOMATICA
     ========================================================== */
  const sendUser = (threadId, text) => {
    const t = push(threadId, { f: 'me', t: text, d: stamp(), ts: now() });
    if (!t) return;
    scheduleBot(threadId, text);
    document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
  };

  const scheduleBot = (threadId, userText) => {
    if (timers.has(threadId)) { clearTimeout(timers.get(threadId)); timers.delete(threadId); }
    document.dispatchEvent(new CustomEvent('sm:typing', { detail: { threadId: threadId, on: true } }));
    const delay = 1200 + Math.random() * 1600;
    const timer = setTimeout(() => {
      timers.delete(threadId);
      document.dispatchEvent(new CustomEvent('sm:typing', { detail: { threadId: threadId, on: false } }));
      const t = byId(threadId);
      if (!t) return;
      const item = window.SMApp && SMApp.findItem ? SMApp.findItem(t.sku) : null;
      const reply = buildReply(userText, item);
      const list = threads();
      const th = list.find(x => x.id === threadId);
      reply.msgs.forEach(m => th.msgs.push(m));
      th.updatedAt = now();
      if (!(window.SMApp && SMApp.isViewingThread && SMApp.isViewingThread(threadId))) th.unread = (th.unread || 0) + 1;
      save(list);
      document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
    }, delay);
    timers.set(threadId, timer);
  };

  /* ---------- Offerte vincolanti ---------- */
  const sendOffer = (threadId, amount) => {
    const t = push(threadId, { f: 'me', kind: 'offer', from: 'me', amount: amount, status: 'pending', t: 'Offerta vincolante inviata', d: stamp(), ts: now() });
    if (!t) return;
    document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
    if (timers.has(threadId)) { clearTimeout(timers.get(threadId)); timers.delete(threadId); }
    document.dispatchEvent(new CustomEvent('sm:typing', { detail: { threadId: threadId, on: true } }));
    const timer = setTimeout(() => {
      timers.delete(threadId);
      document.dispatchEvent(new CustomEvent('sm:typing', { detail: { threadId: threadId, on: false } }));
      const list = threads();
      const th = list.find(x => x.id === threadId);
      if (!th) return;
      const item = window.SMApp && SMApp.findItem ? SMApp.findItem(th.sku) : null;
      const price = item ? item.price : amount;
      const mine = [...th.msgs].reverse().find(m => m.kind === 'offer' && m.from === 'me' && m.status === 'pending');
      const decision = discountDecision(amount, price);
      if (decision === 'accept') {
        if (mine) mine.status = 'accepted';
        th.msgs.push({ f: 'them', t: 'Affare fatto. Accetto ' + SMU.fmtMoney(amount) + '. Vai al checkout e finalizziamo, ti spedisco entro domani.', d: stamp(), ts: now() });
      } else if (decision === 'counter') {
        if (mine) mine.status = 'declined';
        const counter = SMU.round2(Math.round((amount + price) / 2));
        th.msgs.push({ f: 'them', t: 'Quella cifra è troppo bassa, ci rimetto. Posso fare ' + SMU.fmtMoney(counter) + ': è davvero il massimo che posso scendere.', d: stamp(), ts: now() });
        th.msgs.push({ f: 'them', kind: 'offer', from: 'seller', amount: counter, status: 'pending', t: 'Controfferta del venditore', d: stamp(), ts: now() + 1 });
      } else {
        if (mine) mine.status = 'declined';
        th.msgs.push({ f: 'them', t: 'Mi dispiace, ' + SMU.fmtMoney(amount) + ' non è fattibile. Il prezzo resta ' + SMU.fmtMoney(price) + ', che è già competitivo per queste condizioni.', d: stamp(), ts: now() });
      }
      th.updatedAt = now();
      if (!(window.SMApp && SMApp.isViewingThread && SMApp.isViewingThread(threadId))) th.unread = (th.unread || 0) + 1;
      save(list);
      document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
    }, 1600 + Math.random() * 1000);
    timers.set(threadId, timer);
  };

  const respondSellerOffer = (threadId, msgTs, action) => {
    const list = threads();
    const th = list.find(x => x.id === threadId);
    if (!th) return null;
    const offer = th.msgs.find(m => m.kind === 'offer' && m.ts === msgTs);
    if (!offer || offer.status !== 'pending') return null;
    if (action === 'accept') {
      offer.status = 'accepted';
      th.msgs.push({ f: 'me', t: 'Perfetto, accetto ' + SMU.fmtMoney(offer.amount) + '. Procedo al checkout.', d: stamp(), ts: now() });
      th.msgs.push({ f: 'sys', t: 'Offerta accettata a ' + SMU.fmtMoney(offer.amount) + '. Checkout disponibile con importo concordato.', d: stamp(), ts: now() + 1 });
    } else {
      offer.status = 'declined';
      th.msgs.push({ f: 'me', t: 'Ti ringrazio ma preferisco non accettare questa proposta.', d: stamp(), ts: now() });
      th.msgs.push({ f: 'them', t: 'Nessun problema, capisco. Se cambi idea sono qui, lo strumento resta disponibile.', d: stamp(), ts: now() + 1 });
    }
    th.updatedAt = now();
    save(list);
    document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
    return action === 'accept' ? offer : null;
  };

  const systemMsg = (threadId, text) => {
    push(threadId, { f: 'sys', t: text, d: stamp(), ts: now() });
    document.dispatchEvent(new CustomEvent('sm:chat', { detail: { threadId: threadId } }));
  };

  return {
    threads: threads,
    byId: byId,
    bySku: bySku,
    unreadTotal: unreadTotal,
    ensureThread: ensureThread,
    markRead: markRead,
    sendUser: sendUser,
    sendOffer: sendOffer,
    respondSellerOffer: respondSellerOffer,
    systemMsg: systemMsg,
    seedDemoThread: seedDemoThread,
    push: push
  };
})();