/* ============================================================
   SOUNDMARKET — PAGAMENTO (fluido, senza rebuild del modale)
   Il modale si apre una volta sola: ogni cambio aggiorna il
   pannello in place. Nessun refresh, nessuno scroll perso.
   ============================================================ */
'use strict';

var SMPay = (function () {

  const TESTS = [
    { n:'4242424242424242', l:'Visa · successo', b:'success' },
    { n:'5555555555554444', l:'Mastercard · successo', b:'success' },
    { n:'378282246310005', l:'Amex · successo', b:'success' },
    { n:'4000002500003155', l:'3D Secure', b:'3ds' },
    { n:'4000000000000002', l:'Rifiutata', b:'decline', r:'carta' },
    { n:'4000000000009995', l:'Fondi insufficienti', b:'decline', r:'fondi' },
    { n:'4000000000000069', l:'Carta scaduta', b:'decline', r:'scaduta' },
    { n:'4000000000000127', l:'CVC errato', b:'decline', r:'cvc' }
  ];
  const DECL = {
    carta:'La carta è stata rifiutata dall\u2019emittente (generic_decline). Verifica i dati o utilizza un altro metodo.',
    fondi:'Fondi insufficienti sulla carta (insufficient_funds). Utilizza un altro metodo o una carta diversa.',
    scaduta:'La carta risulta scaduta (expired_card). Aggiorna la scadenza o usa un\u2019altra carta.',
    cvc:'Il codice CVC non è corretto (incorrect_cvc). Ricontrolla le cifre sul retro della carta.',
    auth:'Autenticazione 3D Secure non riuscita (authentication_failed). Pagamento non autorizzato.',
    pp:'Il saldo PayPal non è sufficiente a coprire l\u2019importo. Ricarica il conto o usa un altro metodo.',
    kl:'La valutazione creditizia Klarna non ha approvato il piano rateale per questo importo.',
    se:'Il mandato SEPA non è stato accettato dall\u2019istituto bancario (mandate_rejected).'
  };
  const METHODS = [
    { id:'card', l:'Carta', s:'Visa · MC · Amex' },
    { id:'paypal', l:'PayPal', s:'Saldo o conto' },
    { id:'applepay', l:'Apple Pay', s:'Face ID' },
    { id:'googlepay', l:'Google Pay', s:'Impronta' },
    { id:'klarna', l:'Klarna', s:'3 rate · TAEG 0%' },
    { id:'sepa', l:'SEPA', s:'Addebito IBAN' }
  ];
  const STAGES = {
    card:['Crittografia dei dati della carta','Autorizzazione con l\u2019emittente','Controllo antifrode','Acquisizione del pagamento'],
    paypal:['Reindirizzamento a PayPal','Autenticazione del conto','Autorizzazione dell\u2019addebito','Ritorno a SoundMarket'],
    applepay:['Tokenizzazione Secure Enclave','Verifica biometrica','Autorizzazione del network','Acquisizione del pagamento'],
    googlepay:['Tokenizzazione Titan M2','Verifica biometrica','Autorizzazione del network','Acquisizione del pagamento'],
    klarna:['Verifica dell\u2019identità','Valutazione creditizia','Attivazione del piano rateale','Addebito della prima rata'],
    sepa:['Validazione IBAN','Registrazione del mandato','Trasmissione alla banca','Prenotazione dell\u2019addebito']
  };

  let S = null, TMS = [], OTP = null, bound = false;
  const $ = (s) => SMU.$(s);
  const clr = () => { TMS.forEach(clearTimeout); TMS = []; if (OTP) { clearInterval(OTP); OTP = null; } };
  const later = (f, m) => TMS.push(setTimeout(f, m));

  const br = (d) => /^4/.test(d) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(d) ? 'Mastercard' : /^3[47]/.test(d) ? 'American Express' : /^6(011|5)/.test(d) ? 'Discover' : 'Carta';
  const len = (b) => b === 'American Express' ? 15 : 16;
  const cvl = (b) => b === 'American Express' ? 4 : 3;
  const grp = (d, b) => b === 'American Express' ? [d.slice(0,4),d.slice(4,10),d.slice(10,15)].filter(Boolean).join(' ') : (d.match(/.{1,4}/g)||[]).join(' ');
  const luhn = (d) => { if (!d) return false; let s=0,a=false; for (let i=d.length-1;i>=0;i--){ let n=+d[i]; if(a){n*=2; if(n>9)n-=9;} s+=n; a=!a; } return s%10===0; };
  const logo = (b) => b==='Visa' ? '<span style="font-style:italic;font-weight:900;font-size:1rem;color:#1A1F71">VISA</span>'
    : b==='Mastercard' ? '<svg width="34" height="22" viewBox="0 0 34 22"><circle cx="13" cy="11" r="9" fill="#EB001B"/><circle cx="21" cy="11" r="9" fill="#F79E1B" fill-opacity=".88"/></svg>'
    : b==='American Express' ? '<span style="font-weight:900;font-size:.7rem;background:#2E77BC;color:#fff;padding:3px 6px;border-radius:3px">AMEX</span>'
    : b==='Discover' ? '<span style="font-weight:800;font-size:.72rem;color:#FF6000">DISCOVER</span>' : SMIcons.get('card',20);
  const mLb = (p) => !p ? '—' : p.method==='card' ? p.brand+' •••• '+p.last4
    : p.method==='paypal' ? 'PayPal · '+(p.account||'')
    : p.method==='applepay' ? 'Apple Pay · Visa •••• 4242'
    : p.method==='googlepay' ? 'Google Pay · Visa •••• 4242'
    : p.method==='klarna' ? 'Klarna · 3 rate'
    : p.method==='sepa' ? 'SEPA · '+(p.ibanMasked||'') : 'Pagamento';

  const courier = () => SMData.COURIERS.find(c => c.id === S.courier) || SMData.COURIERS[0];
  const sellerName = () => typeof S.item.seller === 'object' ? S.item.seller.name : S.item.seller;

  /* ---------- apertura: un solo openModal ---------- */
  function openPayment(opts) {
    clr();
    const it = opts.item;
    if (!it) { SMU.toast('Articolo non disponibile.', { type:'error' }); return; }
    const u = SMAuth.current();
    if (!u) { SMU.toast('Accedi per procedere al pagamento.', { type:'warning' }); SMAuth.openAuth('login'); return; }
    S = {
      o:opts, item:it, m:'card', d:'', e:'', c:'', n:'',
      pp:false, kl:false, se:false, iban:'', mand:false,
      courier:SMData.COURIERS[0].id, err:'', step:'form', pay:null, dec:null,
      pi:'pi_'+Math.random().toString(36).slice(2,12)+Math.random().toString(36).slice(2,6),
      cb: typeof opts.onSuccess === 'function' ? opts.onSuccess : null
    };
    SMU.openModal('Pagamento sicuro', shell(), { wide:true, onClose:() => { clr(); S = null; } });
    bind();
    panel(formPanel());
    syncTotals();
  }

  function shell() {
    const it = S.item, o = S.o;
    return '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">' +
      '<img src="' + SMU.esc(it.images[0]) + '" alt="" style="width:50px;height:66px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(it.category,it.title) + '\'">' +
      '<div style="min-width:0"><div class="semi sm">' + SMU.esc(it.title) + '</div>' +
      '<div class="xs light">' + SMU.esc(it.grading) + ' · @' + SMU.esc(sellerName()) + '</div></div></div>' +
      '<div class="price-box" style="margin-bottom:16px"><div class="price-rows" style="border:none;padding:0;margin:0">' +
        '<div class="price-row"><span>Articolo' + (o.price !== it.price ? ' (concordato)' : '') + '</span><span class="tabular">' + SMU.fmtMoney(o.price) + '</span></div>' +
        '<div class="price-row"><span>Protezione Acquisti Musicista</span><span class="tabular">' + SMU.fmtMoney(o.fee) + '</span></div>' +
        '<div class="price-row"><span>Spedizione · <b id="payCourName">' + SMU.esc(courier().name) + '</b></span><span class="tabular" id="payShip">' + SMU.fmtMoney(o.ship) + '</span></div>' +
        '<div class="price-row total"><span>Totale</span><span class="tabular" id="payTotal">' + SMU.fmtMoney(o.total) + '</span></div>' +
      '</div></div>' +
      '<div id="payCtrl" class="pay-ctrl">' +
        '<div class="block-title">Corriere assicurato</div>' +
        '<div class="radio-row" style="margin-bottom:16px" id="payCouriers">' +
          SMData.COURIERS.map(c => '<label class="radio-opt' + (S.courier===c.id?' on':'') + '" data-cour="' + c.id + '"><input type="radio" name="xcour" value="' + c.id + '"' + (S.courier===c.id?' checked':'') + '><span>' + SMIcons.get('truck',17) + '</span><span><span class="ro-t">' + SMU.esc(c.name) + '</span><br><span class="ro-s">' + SMU.esc(c.eta) + ' · assicurazione fino a € 3.000</span></span></label>').join('') +
        '</div>' +
        '<div class="block-title">Metodo di pagamento</div>' +
        '<div class="pay-methods" id="payMethods">' +
          METHODS.map(m => '<button type="button" class="pm' + (S.m===m.id?' on':'') + '" data-pm="' + m.id + '"><span class="l">' + m.l + '</span><span class="s">' + m.s + '</span></button>').join('') +
        '</div>' +
      '</div>' +
      '<div id="payPanel" class="pay-panel"></div>' +
      '<div id="payErr"></div>' +
      '<div id="payTests"></div>' +
      '<div id="payActions"></div>';
  }

  function panel(html) {
    const p = $('#payPanel'); if (!p) return;
    p.innerHTML = html;
    p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
  }
  function ctrl(on) { const c = $('#payCtrl'); if (c) c.classList.toggle('off', !on); }
  function setErr(msg) {
    const e = $('#payErr'); if (!e) return;
    e.innerHTML = msg ? '<div class="f-err" style="margin:10px 0">' + SMIcons.get('alert',13,2) + SMU.esc(msg) + '</div>' : '';
  }
  function syncTotals() {
    const c = $('#payCourName'); if (c) c.textContent = courier().name;
    const t = $('#payTotal'); if (t) t.textContent = SMU.fmtMoney(S.o.total);
    const b = $('#payBtnLabel'); if (b) b.textContent = 'Paga ' + SMU.fmtMoney(S.o.total);
  }
  function tests() {
    const t = $('#payTests'); if (!t) return;
    t.innerHTML = S.m === 'card' && S.step === 'form'
      ? '<div class="block-title" style="margin-top:14px">Carte di test</div><div style="display:flex;flex-wrap:wrap;gap:6px">' +
        TESTS.map(x => '<button type="button" class="btn btn-outline btn-sm" data-xt="' + x.n + '">' + SMU.esc(x.l) + '</button>').join('') + '</div>'
      : '';
  }
  function actions(html) { const a = $('#payActions'); if (a) a.innerHTML = html; }
  function payBtn() {
    actions('<button type="button" class="btn btn-primary btn-lg btn-block" style="margin-top:14px" data-xpay>' + SMIcons.get('lock',16) + '<span id="payBtnLabel">Paga ' + SMU.fmtMoney(S.o.total) + '</span></button>' +
      '<div class="xs light" style="text-align:center;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px">' + SMIcons.get('lock',12) + 'TLS 1.3 · PCI-DSS Level 1 · nessun addebito reale</div>');
  }

  /* ---------- pannelli ---------- */
  function formPanel() {
    S.step = 'form'; ctrl(true); tests(); payBtn(); setErr(S.err);
    if (S.m === 'card') return cardPanel();
    if (S.m === 'paypal') return '<div class="escrow-note">' + SMIcons.get('wallet',15) + '<span>Conto <b>' + SMU.esc(S.o.email||'') + '</b> · saldo simulato ' + SMU.fmtMoney(S.o.total*3.4) + '. Autorizzazione reindirizzata a PayPal.</span></div>' +
      '<label class="xs muted" style="display:flex;gap:8px;align-items:center;margin-top:10px;cursor:pointer"><input type="checkbox" id="xpp"' + (S.pp?' checked':'') + ' style="accent-color:var(--danger)">Simula rifiuto per saldo insufficiente</label>';
    if (S.m === 'applepay' || S.m === 'googlepay') return '<div class="escrow-note">' + SMIcons.get(S.m==='applepay'?'face':'finger',15) + '<span>Carta collegata <b>Visa •••• 4242</b>. Conferma con ' + (S.m==='applepay'?'Face ID':'impronta digitale') + ' e tokenizzazione ' + (S.m==='applepay'?'Secure Enclave':'Titan M2') + '.</span></div>';
    if (S.m === 'klarna') return klarnaPanel();
    return sepaPanel();
  }
  function cardPanel() {
    const b = br(S.d);
    return '<div class="fg"><label>Numero carta</label><div style="position:relative">' +
      '<input class="f-in tabular" id="xd" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" value="' + SMU.esc(grp(S.d,b)) + '" style="padding-right:56px">' +
      '<span id="xdLogo" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex">' + logo(b) + '</span></div>' +
      '<div class="hint" id="xdHint">Brand rilevato: <b>' + b + '</b> · validazione Luhn in tempo reale</div></div>' +
      '<div class="f-row"><div class="fg"><label>Scadenza</label><input class="f-in tabular" id="xe" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" value="' + SMU.esc(S.e) + '"></div>' +
      '<div class="fg"><label id="xcLbl">' + (b==='American Express'?'CID':'CVC') + '</label><input class="f-in tabular" id="xc" inputmode="numeric" autocomplete="cc-csc" placeholder="' + cvl(b) + ' cifre" value="' + SMU.esc(S.c) + '"></div></div>' +
      '<div class="fg" style="margin-bottom:0"><label>Titolare carta</label><input class="f-in" id="xn" autocomplete="cc-name" placeholder="NOME COGNOME" value="' + SMU.esc(S.n) + '"></div>';
  }
  function klarnaPanel() {
    const t = S.o.total, a = SMU.round2(Math.floor((t/3)*100)/100), last = SMU.round2(t - a*2);
    const d = (n) => SMU.fmtDate(Date.now() + n*30*86400000);
    const row = (n, lbl, sub, amt, now) => '<div style="display:flex;align-items:center;gap:11px;background:' + (now?'var(--petrol-50)':'var(--surface)') + ';border:1px solid ' + (now?'var(--petrol-600)':'var(--border)') + ';border-radius:6px;padding:11px 13px;font-size:.84rem">' +
      '<span style="width:24px;height:24px;border-radius:50%;background:' + (now?'var(--petrol-800)':'var(--surface-2)') + ';color:' + (now?'#fff':'var(--slate)') + ';display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800">' + n + '</span>' +
      '<div><div class="semi">' + lbl + '</div><div class="xs muted">' + sub + '</div></div><span class="tabular" style="margin-left:auto;font-weight:700">' + SMU.fmtMoney(amt) + '</span></div>';
    return '<div class="escrow-note" style="background:var(--brass-100);border-color:#EFD9AE;color:var(--brass-700)">' + SMIcons.get('sparkles',15) + '<span><b>3 rate senza interessi · TAEG 0,00%</b></span></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">' +
      row(1,'Prima rata · oggi',d(0),a,true) + row(2,'Seconda rata',d(1),a,false) + row(3,'Terza rata',d(2),last,false) + '</div>' +
      '<label class="xs muted" style="display:flex;gap:8px;align-items:center;margin-top:10px;cursor:pointer"><input type="checkbox" id="xkl"' + (S.kl?' checked':'') + ' style="accent-color:var(--danger)">Simula valutazione creditizia negativa</label>';
  }
  function sepaPanel() {
    return '<div class="escrow-note">' + SMIcons.get('bank',15) + '<span><b>Addebito diretto SEPA Core</b> · Creditore SoundMarket S.r.l. · ID IT98ZZZ000000123456 · mandato ' + SMU.esc(S.pi.toUpperCase().replace('PI_','MND-')) + '</span></div>' +
      '<div class="fg" style="margin-top:12px"><label>IBAN del conto di addebito</label><input class="f-in tabular" id="xib" placeholder="IT60 X054 2811 1010 0000 0123 456" value="' + SMU.esc(S.iban) + '"><div class="hint">Validazione mod-97 automatica</div></div>' +
      '<label class="xs muted" style="display:flex;gap:9px;align-items:flex-start;line-height:1.5;border:1px solid var(--border);border-radius:6px;padding:11px;cursor:pointer"><input type="checkbox" id="xmand"' + (S.mand?' checked':'') + ' style="margin-top:2px;accent-color:var(--petrol-800)"><span>Autorizzo SoundMarket S.r.l. a inviare istruzioni alla mia banca per l\u2019addebito del conto e la mia banca ad addebitarlo conformemente alle istruzioni. Ho diritto al rimborso secondo le condizioni del mio contratto (8 settimane).</span></label>' +
      '<label class="xs muted" style="display:flex;gap:8px;align-items:center;margin-top:8px;cursor:pointer"><input type="checkbox" id="xse"' + (S.se?' checked':'') + ' style="accent-color:var(--danger)">Simula rifiuto del mandato</label>' +
      '<div style="display:flex;gap:6px;margin-top:10px"><button type="button" class="btn btn-outline btn-sm" data-xibanok>IBAN valido</button><button type="button" class="btn btn-outline btn-sm" data-xibanbad>IBAN non valido</button></div>';
  }

  /* ---------- validazione ---------- */
  function validate() {
    if (S.m === 'card') {
      const b = br(S.d);
      if (S.d.length !== len(b) || !luhn(S.d)) return 'Numero carta non valido. Verifica le cifre inserite.';
      const m = S.e.match(/^(\d{2})\/(\d{2})$/);
      if (!m) return 'Inserisci la scadenza nel formato MM/AA.';
      const mm = +m[1], yy = 2000 + +m[2];
      if (mm < 1 || mm > 12) return 'Mese di scadenza non valido.';
      if (new Date(yy, mm, 0) < new Date()) return 'La carta risulta scaduta.';
      if (S.c.length !== cvl(b)) return 'Il codice ' + (b==='American Express'?'CID':'CVC') + ' deve avere ' + cvl(b) + ' cifre.';
      if (S.n.trim().length < 3) return 'Indica il titolare della carta.';
    } else if (S.m === 'sepa') {
      if (!SMU.ibanValid(S.iban)) return 'IBAN non valido: controllo mod-97 non superato.';
      if (!S.mand) return 'È necessario accettare il mandato di addebito SEPA.';
    }
    return '';
  }
  function behavior() {
    if (S.m === 'card') { const t = TESTS.find(x => x.n === S.d); return t || { b:'success' }; }
    if (S.m === 'paypal' && S.pp) return { b:'decline', r:'pp' };
    if (S.m === 'klarna' && S.kl) return { b:'decline', r:'kl' };
    if (S.m === 'sepa' && S.se) return { b:'decline', r:'se' };
    return { b:'success' };
  }

  /* ---------- elaborazione: patch in place ---------- */
  function run() {
    const err = validate();
    if (err) { S.err = err; setErr(err); SMU.toast(err, { type:'error' }); return; }
    S.err = ''; setErr('');
    S.step = 'proc'; ctrl(false); tests(); actions('');
    const st = STAGES[S.m] || STAGES.card;
    panel('<div style="text-align:center;padding:20px 10px"><div class="pay-spin"></div>' +
      '<h3 style="font-size:1.02rem;margin-bottom:16px">Elaborazione del pagamento</h3>' +
      '<div class="pay-steps" id="paySteps">' + st.map((s,k) => '<div class="pay-step" data-ps="' + k + '"><span class="ps"></span>' + s + '</div>').join('') + '</div>' +
      '<div class="xs light" style="margin-top:16px">PaymentIntent ' + SMU.esc(S.pi) + '</div></div>');
    const mark = (k, ok) => {
      const el = SMU.$('[data-ps="' + k + '"]'); if (!el) return;
      el.classList.remove('act'); el.classList.add(ok ? 'ok' : 'act');
      if (ok) { const d = el.querySelector('.ps'); if (d) d.innerHTML = SMIcons.get('check',11,3); }
    };
    const beh = behavior();
    mark(0,false);
    later(() => { if (!S) return; mark(0,true); mark(1,false);
      later(() => { if (!S) return; mark(1,true);
        if (beh.b === '3ds') return threeDS();
        mark(2,false);
        later(() => { if (!S) return; mark(2,true); mark(3,false);
          later(() => { if (!S) return; mark(3,true);
            later(() => { if (!S) return; beh.b === 'decline' ? fail(beh.r) : succeed(false); }, 300);
          }, 640);
        }, 720);
      }, 950);
    }, 680);
  }

  function threeDS() {
    S.step = '3ds';
    panel('<div style="text-align:center;padding:8px 10px">' +
      '<div style="display:inline-flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 16px;font-weight:700;color:var(--petrol-800);margin-bottom:14px">' + SMIcons.get('shield',18) + 'SoundBank · 3D Secure 2</div>' +
      '<p class="sm muted" style="margin-bottom:14px">Per autorizzare <b>' + SMU.fmtMoney(S.o.total) + '</b> inserisci il codice monouso inviato al dispositivo registrato.</p>' +
      '<div class="fg" style="max-width:200px;margin:0 auto"><input class="f-in pay-otp" id="xotp" maxlength="6" inputmode="numeric" placeholder="______"></div>' +
      '<div class="xs" style="color:var(--info);background:var(--info-bg);border:1px solid #C7D7FE;border-radius:4px;padding:7px 12px;margin:12px auto;max-width:220px">Codice di test: <b>123456</b></div>' +
      '<div class="xs light" id="xTimer">Il codice scade tra 60 secondi</div></div>');
    actions('<div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button type="button" class="btn btn-primary" data-xotp>Verifica e paga</button><button type="button" class="btn btn-ghost" data-xcancel>Annulla</button></div>');
    let left = 60;
    OTP = setInterval(() => {
      left--;
      const el = $('#xTimer'); if (el) el.textContent = 'Il codice scade tra ' + left + ' secondi';
      if (left <= 0) { clr(); fail('auth'); }
    }, 1000);
    setTimeout(() => { const el = $('#xotp'); if (el) el.focus(); }, 120);
  }

  function succeed(t3) {
    clr();
    const b = br(S.d), t = S.o.total;
    const p = {
      id:S.pi, receipt:'rcpt_'+Math.random().toString(36).slice(2,10), method:S.m,
      brand:S.m==='card'?b:(METHODS.find(m=>m.id===S.m)||{}).l, last4:S.d.slice(-4)||'0000',
      account:S.o.email||'', ibanMasked:S.m==='sepa'?SMU.maskIban(S.iban):'',
      amount:t, created:Date.now(), status:'succeeded', threeDS:!!t3, installments:null, courier:courier().name
    };
    if (S.m === 'klarna') {
      const a = SMU.round2(Math.floor((t/3)*100)/100);
      p.installments = [{n:1,amount:a,due:Date.now(),charged:true},{n:2,amount:a,due:Date.now()+2592000000,charged:false},{n:3,amount:SMU.round2(t-a*2),due:Date.now()+5184000000,charged:false}];
    }
    S.pay = p; S.step = 'ok';
    panel('<div style="text-align:center;padding:8px 10px"><div class="pay-res-ico ok">' + SMIcons.get('check',34,3) + '</div>' +
      '<h3 style="font-size:1.16rem;margin-bottom:6px">Pagamento autorizzato</h3>' +
      '<div class="tabular" style="font-size:1.6rem;font-weight:800;color:var(--petrol-800);margin-bottom:8px;font-family:var(--font-display)">' + SMU.fmtMoney(t) + '</div>' +
      '<p class="sm muted" style="margin-bottom:14px">Importo vincolato in escrow · ' + SMU.esc(mLb(p)) + ' · ' + SMU.esc(p.courier) + '</p>' + receipt(p) + '</div>');
    actions('<div style="display:flex;gap:9px;justify-content:center;margin-top:16px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-primary btn-lg" data-xdone>' + SMIcons.get('truck',16) + 'Traccia la spedizione</button>' +
      '<button type="button" class="btn btn-outline" data-xprint>' + SMIcons.get('printer',15) + 'Stampa</button>' +
      '<button type="button" class="btn btn-outline" data-xdl>' + SMIcons.get('dl',15) + 'Scarica</button></div>');
  }

  function fail(r) {
    clr(); S.dec = r; S.step = 'no';
    panel('<div style="text-align:center;padding:8px 10px"><div class="pay-res-ico no">' + SMIcons.get('x',32,3) + '</div>' +
      '<h3 style="font-size:1.16rem;margin-bottom:6px">Pagamento non riuscito</h3>' +
      '<div class="tabular" style="font-size:1.6rem;font-weight:800;color:var(--danger);margin-bottom:8px;font-family:var(--font-display)">' + SMU.fmtMoney(S.o.total) + '</div>' +
      '<p class="sm muted" style="max-width:340px;margin:0 auto 12px">' + SMU.esc(DECL[r]||DECL.carta) + '</p>' +
      '<div class="xs light">Declino su ' + SMU.esc(S.pi) + '</div></div>');
    actions('<div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button type="button" class="btn btn-primary" data-xretry>' + SMIcons.get('refresh',15) + 'Riprova o cambia metodo</button><button type="button" class="btn btn-ghost" data-xcancel>Annulla</button></div>');
  }

  function receipt(p) {
    return '<div class="rcpt"><div class="rcpt-h"><span>Ricevuta</span><span>' + SMU.esc(p.receipt) + '</span></div><div class="rcpt-b">' +
      '<div class="rcpt-r"><span>PaymentIntent</span><span>' + SMU.esc(p.id) + '</span></div>' +
      '<div class="rcpt-r"><span>Metodo</span><span>' + SMU.esc(mLb(p)) + '</span></div>' +
      '<div class="rcpt-r"><span>Data</span><span>' + SMU.esc(SMU.fmtDateTime(p.created)) + '</span></div>' +
      (p.threeDS ? '<div class="rcpt-r"><span>Autenticazione</span><span style="color:var(--success)">3DS2 superata</span></div>' : '') +
      (p.installments ? '<div class="rcpt-r"><span>Piano</span><span>3 × ' + SMU.fmtMoney(p.installments[0].amount) + ' · TAEG 0%</span></div>' : '') +
      '<div class="rcpt-r"><span>Corriere</span><span>' + SMU.esc(p.courier||'BRT') + '</span></div>' +
      '<div class="rcpt-r"><span>Stato</span><span style="color:var(--success)">' + SMU.esc(p.status) + '</span></div>' +
      '<div class="rcpt-r" style="border-top:1px solid var(--border);padding-top:7px"><span><b>Totale</b></span><span style="color:var(--petrol-800);font-weight:800">' + SMU.fmtMoney(p.amount) + '</span></div>' +
      '</div></div>';
  }

  function receiptHTML(p, o) {
    let rows = '';
    if (o) {
      rows += '<tr><td>Articolo</td><td>' + SMU.esc(o.title) + '</td></tr><tr><td>Venditore</td><td>@' + SMU.esc(o.sellerName) + '</td></tr>' +
        '<tr><td>Prezzo articolo</td><td>' + SMU.fmtMoney(o.amount) + '</td></tr><tr><td>Protezione Acquisti</td><td>' + SMU.fmtMoney(o.fee) + '</td></tr>' +
        '<tr><td>Spedizione assicurata</td><td>' + SMU.fmtMoney(o.ship) + '</td></tr><tr><td>Tracking</td><td>' + SMU.esc(o.tracking) + '</td></tr>';
    }
    return '<div class="rh"><div class="rl">Sound<span>Market</span></div><div class="rm">SoundMarket S.r.l.<br>Via Montenapoleone 8<br>20121 Milano (MI)<br>P.IVA 04871220968</div></div>' +
      '<h1>Ricevuta di pagamento</h1><div class="sub">Documento generato il ' + SMU.fmtDateTime(Date.now()) + '</div>' +
      '<div class="badge">PAGAMENTO AUTORIZZATO · ESCROW ATTIVO</div><table>' +
      '<tr><td>PaymentIntent</td><td>' + SMU.esc(p.id) + '</td></tr><tr><td>Ricevuta n.</td><td>' + SMU.esc(p.receipt) + '</td></tr>' +
      '<tr><td>Metodo</td><td>' + SMU.esc(mLb(p)) + '</td></tr><tr><td>Data transazione</td><td>' + SMU.fmtDateTime(p.created) + '</td></tr>' +
      (p.threeDS ? '<tr><td>Autenticazione</td><td>3D Secure 2 superata</td></tr>' : '') + rows +
      '<tr class="tot"><td>TOTALE</td><td>' + SMU.fmtMoney(p.amount) + '</td></tr></table>' +
      (p.installments ? '<h3 style="font-size:14px;margin-top:20px">Piano Klarna · TAEG 0,00%</h3><table>' + p.installments.map(i => '<tr><td>Rata ' + i.n + ' · ' + SMU.fmtDate(i.due) + '</td><td>' + SMU.fmtMoney(i.amount) + (i.charged?' (addebitata)':' (programmata)') + '</td></tr>').join('') + '</table>' : '') +
      '<p style="font-size:12px;color:#475569;margin-top:20px">Importo detenuto in escrow fino alla conferma di ricezione. Finestra di contestazione: 48 ore. Protezione Acquisti Musicista attiva.</p>';
  }
  function download(p, o) {
    const L = ['SOUNDMARKET S.r.l. — RICEVUTA DI PAGAMENTO','==================================================',
      'Ricevuta n.      : ' + p.receipt, 'PaymentIntent    : ' + p.id, 'Data e ora       : ' + SMU.fmtDateTime(p.created),
      'Metodo           : ' + mLb(p), 'Corriere         : ' + (p.courier||'BRT'),
      'Autenticazione   : ' + (p.threeDS?'3D Secure 2 superata':'Esente'), 'Stato            : ' + p.status, '--------------------------------------------------'];
    if (o) L.push('Articolo         : ' + o.title, 'Venditore        : @' + o.sellerName, 'Tracking         : ' + o.tracking,
      'Prezzo articolo  : ' + SMU.fmtMoney(o.amount), 'Protezione Acq.  : ' + SMU.fmtMoney(o.fee), 'Spedizione       : ' + SMU.fmtMoney(o.ship));
    L.push('TOTALE           : ' + SMU.fmtMoney(p.amount));
    if (p.installments) { L.push('--------------------------------------------------','PIANO KLARNA (TAEG 0,00%)'); p.installments.forEach(i => L.push('  Rata ' + i.n + ' — ' + SMU.fmtMoney(i.amount) + ' — ' + SMU.fmtDate(i.due) + (i.charged?'  [addebitata]':'  [programmata]'))); }
    L.push('==================================================','Importo in escrow fino a conferma ricezione.','SoundMarket S.r.l. · P.IVA 04871220968 · Milano');
    SMU.downloadText('ricevuta-' + p.receipt + '.txt', L.join('\n'));
    SMU.toast('Ricevuta scaricata.', { type:'success' });
  }

  /* ---------- binding una sola volta ---------- */
  function bind() {
    const mr = document.getElementById('modalRoot');
    if (!mr || bound) return;
    bound = true;

    mr.addEventListener('click', (e) => {
      if (!S) return;
      const pm = e.target.closest('[data-pm]');
      if (pm && S.step === 'form') {
        S.m = pm.dataset.pm; S.err = '';
        SMU.$$('[data-pm]', mr).forEach(b => b.classList.toggle('on', b.dataset.pm === S.m));
        panel(formPanel());
        return;
      }
      const co = e.target.closest('[data-cour]');
      if (co && S.step === 'form') {
        S.courier = co.dataset.cour;
        SMU.$$('[data-cour]', mr).forEach(l => { l.classList.toggle('on', l.dataset.cour === S.courier); const r = l.querySelector('input'); if (r) r.checked = l.dataset.cour === S.courier; });
        syncTotals();
        return;
      }
      const xt = e.target.closest('[data-xt]');
      if (xt) {
        const n = xt.dataset.xt, b = br(n);
        S.d = n; S.e = '12/30'; S.c = b === 'American Express' ? '1234' : '123'; S.n = 'ANDREA DEMO'; S.err = '';
        const d = $('#xd'), ee = $('#xe'), c = $('#xc'), nn = $('#xn');
        if (d) d.value = grp(n, b); if (ee) ee.value = S.e; if (c) c.value = S.c; if (nn) nn.value = S.n;
        const lg = $('#xdLogo'); if (lg) lg.innerHTML = logo(b);
        const h = $('#xdHint'); if (h) h.innerHTML = 'Brand rilevato: <b>' + b + '</b> · validazione Luhn in tempo reale';
        const cl = $('#xcLbl'); if (cl) cl.textContent = b === 'American Express' ? 'CID' : 'CVC';
        setErr(''); SMU.toast('Carta di test compilata.', { type:'info' });
        return;
      }
      if (e.target.closest('[data-xibanok]')) { S.iban = 'IT60X0542811101000000123456'; const i = $('#xib'); if (i) i.value = SMU.fmtIban(S.iban); setErr(''); return; }
      if (e.target.closest('[data-xibanbad]')) { S.iban = 'IT00X0000000000000000000000'; const i = $('#xib'); if (i) i.value = SMU.fmtIban(S.iban); return; }
      if (e.target.closest('[data-xpay]')) { run(); return; }
      if (e.target.closest('[data-xotp]')) {
        const v = ($('#xotp')||{}).value || '';
        if (v === '123456') { clr(); S.step = 'proc'; panel('<div style="text-align:center;padding:24px 10px"><div class="pay-spin"></div><h3 style="font-size:1.02rem">Autenticazione completata</h3><p class="sm muted" style="margin-top:8px">Acquisizione del pagamento in corso…</p></div>'); actions(''); later(() => succeed(true), 900); }
        else { setErr('Codice non corretto. Per il test utilizza 123456.'); SMU.toast('Codice errato. Usa 123456.', { type:'error' }); }
        return;
      }
      if (e.target.closest('[data-xretry]')) { S.err = ''; panel(formPanel()); return; }
      if (e.target.closest('[data-xcancel]')) { SMU.closeModal(); clr(); S = null; return; }
      if (e.target.closest('[data-xprint]')) { SMU.printReceipt(receiptHTML(S.pay, S.order||null), 'Ricevuta SoundMarket'); return; }
      if (e.target.closest('[data-xdl]')) { download(S.pay, S.order||null); return; }
      if (e.target.closest('[data-xdone]')) { const p = S.pay, cb = S.cb; SMU.closeModal(); clr(); S = null; if (cb) cb(p); return; }
    });

    mr.addEventListener('input', (e) => {
      if (!S) return;
      const t = e.target;
      if (t.id === 'xd') {
        const raw = t.value.replace(/\D/g,''), b = br(raw), d = raw.slice(0, len(b));
        S.d = d; t.value = grp(d, b);
        S.c = S.c.slice(0, cvl(b));
        const c = $('#xc'); if (c) c.value = S.c;
        const lg = $('#xdLogo'); if (lg) lg.innerHTML = logo(b);
        const h = $('#xdHint'); if (h) h.innerHTML = 'Brand rilevato: <b>' + b + '</b> · validazione Luhn in tempo reale';
        const cl = $('#xcLbl'); if (cl) cl.textContent = b === 'American Express' ? 'CID' : 'CVC';
        if (S.err) { S.err = ''; setErr(''); }
      } else if (t.id === 'xe') { const x = t.value.replace(/\D/g,'').slice(0,4); S.e = x.length>2 ? x.slice(0,2)+'/'+x.slice(2) : x; t.value = S.e; }
      else if (t.id === 'xc') { S.c = t.value.replace(/\D/g,'').slice(0, cvl(br(S.d))); t.value = S.c; }
      else if (t.id === 'xn') { S.n = t.value.toUpperCase(); }
      else if (t.id === 'xib') { S.iban = SMU.fmtIban(t.value).slice(0,34); t.value = S.iban; }
      else if (t.id === 'xotp') { t.value = t.value.replace(/\D/g,'').slice(0,6); }
    });

    mr.addEventListener('change', (e) => {
      if (!S) return;
      const t = e.target;
      if (t.id === 'xpp') S.pp = t.checked;
      else if (t.id === 'xkl') S.kl = t.checked;
      else if (t.id === 'xse') S.se = t.checked;
      else if (t.id === 'xmand') { S.mand = t.checked; if (t.checked) setErr(''); }
    });

    mr.addEventListener('keydown', (e) => {
      if (!S) return;
      if (e.key === 'Enter' && e.target.id === 'xotp') { e.preventDefault(); const b = SMU.$('[data-xotp]'); if (b) b.click(); }
      if (e.key === 'Enter' && ['xd','xe','xc','xn','xib'].indexOf(e.target.id) >= 0) { e.preventDefault(); run(); }
    });
  }

  function showReceipt(p, title, order) {
    if (!p) { SMU.toast('Nessuna ricevuta disponibile.', { type:'error' }); return; }
    SMU.openModal('Ricevuta · ' + (title||'Pagamento'),
      '<div style="text-align:center;padding:4px"><div class="pay-res-ico ok" style="width:56px;height:56px">' + SMIcons.get('check',26,3) + '</div>' +
      '<h3 style="font-size:1rem;margin-bottom:4px">' + SMU.esc(title||'Pagamento') + '</h3>' +
      '<div class="tabular" style="font-size:1.4rem;font-weight:800;color:var(--petrol-800);margin-bottom:12px;font-family:var(--font-display)">' + SMU.fmtMoney(p.amount) + '</div>' +
      receipt(p) +
      (p.installments ? '<div class="rcpt" style="margin-top:10px"><div class="rcpt-h"><span>Piano rateale</span><span>TAEG 0%</span></div><div class="rcpt-b">' + p.installments.map(i => '<div class="rcpt-r"><span>Rata ' + i.n + ' · ' + SMU.fmtDate(i.due) + '</span><span>' + SMU.fmtMoney(i.amount) + (i.charged?' ✓':'') + '</span></div>').join('') + '</div></div>' : '') +
      '<div style="display:flex;gap:9px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-outline" id="rcP">' + SMIcons.get('printer',15) + 'Stampa</button>' +
      '<button type="button" class="btn btn-outline" id="rcD">' + SMIcons.get('dl',15) + 'Scarica</button>' +
      '<button type="button" class="btn btn-primary" data-action="modal-close">Chiudi</button></div></div>', { wide:false });
    const pb = document.getElementById('rcP'), db = document.getElementById('rcD');
    if (pb) pb.addEventListener('click', () => SMU.printReceipt(receiptHTML(p, order||null), 'Ricevuta SoundMarket'));
    if (db) db.addEventListener('click', () => download(p, order||null));
  }

  return { openPayment, isBusy:() => !!S && (S.step==='proc'||S.step==='3ds'), methodLabel:mLb, showReceipt };
})();