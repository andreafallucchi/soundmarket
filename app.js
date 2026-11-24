/* ============================================================
   SOUNDMARKET — CONTROLLER
   Catalogo · Scheda · Recensioni reali · Tracking spedizione
   Aggiornamenti live in place (nessun refresh della pagina)
   ============================================================ */
'use strict';

const SMApp = (() => {
  const { $, $$, esc, store, fmtMoney, fmtDate, fmtTime, fmtDateTime, timeAgo, uid, round2, debounce, parseAmount } = SMU;
  const I = SMIcons;

  const state = {
    route:{ name:'home', param:null, query:{} }, cat:'Tutte',
    filters:{ q:'', brand:'', grade:'', min:'', max:'', sort:'recent' },
    galleryIdx:0, sellPhotos:[], editSku:null, menuOpen:false,
    profTab:'annunci', checkout:null, typingThread:null,
    acqFilter:'tutti', drawerOrder:null, justPaid:null, revSort:'recent'
  };

  /* ---------- store ---------- */
  const K = { st:'sm.itemStatus', it:'sm.userItems', or:'sm.orders.', sv:'sm.savedSearches.', ca:'sm.cart.', rv:'sm.reviews', wa:'sm.wallet.' };
  const statusMap = () => store.get(K.st, {});
  const setStatus = (sku, v) => { const m = statusMap(); if (v) m[sku] = v; else delete m[sku]; store.set(K.st, m); };
  const userItems = () => store.get(K.it, []);
  const saveItems = (l) => store.set(K.it, l);
  const orders = () => { const u = SMAuth.current(); return u ? store.get(K.or + u.id, []) : []; };
  const saveOrders = (l) => { const u = SMAuth.current(); if (u) store.set(K.or + u.id, l); };
  const favs = () => { const u = SMAuth.current(); return u ? store.get('sm.favs.' + u.id, []) : []; };
  const saveFavs = (l) => { const u = SMAuth.current(); if (u) store.set('sm.favs.' + u.id, l); };
  const saved = () => { const u = SMAuth.current(); return u ? store.get(K.sv + u.id, []) : []; };
  const saveSaved = (l) => { const u = SMAuth.current(); if (u) store.set(K.sv + u.id, l); };
  const cart = () => { const u = SMAuth.current(); return u ? store.get(K.ca + u.id, []) : []; };
  const saveCart = (l) => { const u = SMAuth.current(); if (u) store.set(K.ca + u.id, l); };
  const wallet = () => { const u = SMAuth.current(); return u ? store.get(K.wa + u.id, { available:0, pending:0, movements:[] }) : { available:0, pending:0, movements:[] }; };
  const saveWallet = (w) => { const u = SMAuth.current(); if (u) store.set(K.wa + u.id, w); };
  const reviews = () => store.get(K.rv, []);
  const saveReviews = (l) => store.set(K.rv, l);

  const allItems = () => [...userItems(), ...SMData.ITEMS];
  const findItem = (sku) => allItems().find(i => i.sku === sku) || null;
  const itemStatus = (it) => statusMap()[it.sku] || 'available';
  const isMine = (it) => { const u = SMAuth.current(); return !!u && it.sellerEmail === u.email; };
  const sName = (s) => !s ? 'Venditore' : (typeof s === 'object' ? (s.name||'Venditore') : String(s));

  /* ---------- recensioni ---------- */
  const seedReviews = () => {
    if (store.get('sm.rev.seeded', false)) return;
    const out = [];
    const titles = ['Acquisto verificato','Esperienza positiva','Tutto come descritto','Consigliato'];
    Object.values(SMData.SELLERS).forEach(s => {
      const its = SMData.ITEMS.filter(i => i.seller && i.seller.name === s.name);
      (s.reviews||[]).forEach((r, k) => {
        const it = its[k % Math.max(1, its.length)]; if (!it) return;
        out.push({ id:'rv-seed-'+s.name+'-'+k, sku:it.sku, orderId:null, userId:null, userName:r.author,
          rating:r.rating, title:titles[k % titles.length], text:r.text,
          sub:{ comunicazione:r.rating, imballaggio:r.rating, conformita:r.rating },
          at:Date.now() - (k+2)*9*86400000, helpful:[], reply:null, verified:true, seed:true });
      });
    });
    saveReviews(out); store.set('sm.rev.seeded', true);
  };
  const revFor = (sku) => reviews().filter(r => r.sku === sku);
  const revAgg = (sku) => {
    const l = revFor(sku), n = l.length;
    return { n, avg: n ? l.reduce((s,r) => s+r.rating, 0)/n : 0, dist:[5,4,3,2,1].map(k => l.filter(r => r.rating === k).length) };
  };
  const sellerAgg = (name) => {
    const skus = allItems().filter(i => sName(i.seller) === name).map(i => i.sku);
    const l = reviews().filter(r => skus.indexOf(r.sku) >= 0);
    return { n:l.length, avg: l.length ? l.reduce((s,r)=>s+r.rating,0)/l.length : 0 };
  };
  const myRev = (oid) => reviews().find(r => r.orderId === oid) || null;
  const reviewableOrder = (sku) => {
    const u = SMAuth.current(); if (!u) return null;
    return orders().find(o => o.sku === sku && (o.confirmedAt || stageOf(o) >= 5) && !o.refundedAt && !myRev(o.id)) || null;
  };

  /* ---------- spedizione: 5 fasi reali ---------- */
  const SHIP = [
    { id:'elaborato', short:'Elaborato', label:'Ordine elaborato', at:0 },
    { id:'spedito', short:'Spedito', label:'Spedito', at:15000 },
    { id:'transito', short:'Transito', label:'In transito', at:34000 },
    { id:'consegna', short:'In consegna', label:'In consegna', at:56000 },
    { id:'consegnato', short:'Consegnato', label:'Consegnato', at:78000 }
  ];
  const DELIVERED = 5, COMPLETE = 6, REFUND = -1, DISPUTE = -2;
  const stageOf = (o) => {
    if (o.refundedAt) return REFUND;
    if (o.confirmedAt) return COMPLETE;
    if (o.dispute) return DISPUTE;
    const el = Date.now() - o.createdAt;
    let s = 1;
    for (let i = 0; i < SHIP.length; i++) if (el >= SHIP[i].at) s = i + 1;
    return s;
  };
  const isHome = (o) => /Domicilio/i.test(o.shipLabel || '');
  const shipLabel = (o, i) => i === 4 ? (isHome(o) ? 'Consegnato a casa' : 'Consegnato al punto di ritiro') : SHIP[i].label;
  const shipDesc = (o, i) => {
    const home = isHome(o);
    return [
      'Pagamento vincolato in escrow. Etichetta di spedizione generata e pacco in preparazione.',
      'Pacco affidato al corriere. Ritiro effettuato presso il venditore.',
      'Trasferimento in corso tra gli hub del corriere. Scansione di transito registrata.',
      'Ultimo miglio: il corriere è in zona di consegna. Finestra prevista entro la giornata.',
      home ? 'Consegna al domicilio completata. Firma del destinatario acquisita.' : 'Pacco depositato presso il punto di ritiro. Disponibile per il ritiro con documento e codice.'
    ][i];
  };
  const shipPlace = (o, i) => {
    const c = (o.payment && o.payment.courier) || 'BRT';
    const from = o.sellerCity || 'Milano', to = o.buyerCity || 'Milano';
    const hub = /DHL/i.test(c) ? 'Hub DHL Milano Linate' : /Poste/i.test(c) ? 'CMP Poste Peschiera Borromeo' : 'Hub BRT Piacenza';
    const last = isHome(o) ? ('Domicilio acquirente — ' + to) : ('Fermopoint — Via Torino 14, ' + to);
    return ['Centro logistico SoundMarket — Milano', 'Filiale ' + c + ' — ' + from, hub, 'Sede ' + c + ' — ' + to, last][i];
  };
  const shipTime = (o, i) => o.createdAt + SHIP[i].at;
  const progressOf = (o) => {
    const s = stageOf(o);
    if (s === COMPLETE || s === REFUND) return 100;
    if (s === DISPUTE) return Math.min(99, Math.round((Date.now()-o.createdAt)/SHIP[4].at*100));
    const el = Date.now() - o.createdAt;
    return Math.max(3, Math.min(99, Math.round(el / SHIP[4].at * 100)));
  };
  const routePos = (o) => {
    const s = stageOf(o);
    if (s === COMPLETE || s === REFUND) return 100;
    const el = Date.now() - o.createdAt, tot = SHIP[4].at;
    return Math.max(0, Math.min(100, (el/tot)*100));
  };
  const nextHint = (o) => {
    const s = stageOf(o);
    if (s === REFUND) return 'Importo rimborsato sul metodo originale';
    if (s === DISPUTE) return 'Contestazione in verifica · fondi bloccati';
    if (s === COMPLETE) return 'Transazione completata · fondi sbloccati';
    const el = Date.now() - o.createdAt;
    if (s >= DELIVERED) return isHome(o) ? 'Consegnato a casa · conferma la ricezione' : 'Disponibile al punto di ritiro · conferma il ritiro';
    const nx = SHIP[s]; return nx ? (shipLabel(o, s) + ' tra ' + Math.max(0, Math.ceil((nx.at - el)/1000)) + ' s') : '';
  };
  const stageTag = (o) => {
    const s = stageOf(o);
    if (s === REFUND) return '<span class="otag ref">' + I.get('refresh',11,2.4) + 'Rimborsato</span>';
    if (s === DISPUTE) return '<span class="otag ref">' + I.get('alert',11,2.4) + 'Contestazione</span>';
    if (s === COMPLETE) return '<span class="otag done">' + I.get('check',11,3) + 'Completato</span>';
    if (s === DELIVERED) return '<span class="otag deliv">' + I.get('box',11,2.4) + esc(shipLabel(o,4)) + '</span>';
    if (s >= 3) return '<span class="otag ship">' + I.get('truck',11,2.4) + esc(SHIP[s-1].label) + '</span>';
    if (s === 2) return '<span class="otag ship">' + I.get('truck',11,2.4) + 'Spedito</span>';
    return '<span class="otag escrow">' + I.get('lock',11,2.4) + 'In elaborazione</span>';
  };
  const etaOf = (o) => o.createdAt + 3*86400000;
  const pkg = (o) => {
    const it = findItem(o.sku);
    const z = (it && it.size) || 'M';
    return z === 'P' ? { w:'1,2 kg', d:'30 × 22 × 8 cm' } : z === 'G' ? { w:'18,5 kg', d:'115 × 45 × 22 cm' } : { w:'6,4 kg', d:'70 × 40 × 18 cm' };
  };

  /* ---------- routing ---------- */
  const parseHash = () => {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const seg = path.split('/').filter(Boolean);
    const query = {};
    if (qs) qs.split('&').forEach(p => { const [k,v] = p.split('='); if (k) query[decodeURIComponent(k)] = decodeURIComponent(v||''); });
    return { name:seg[0]||'home', param:seg[1]?decodeURIComponent(seg[1]):null, query };
  };
  const navigate = (name, param = null, query = null) => {
    let h = '#/' + name;
    if (param) h += '/' + encodeURIComponent(param);
    if (query && Object.keys(query).length) h += '?' + Object.entries(query).map(([k,v]) => encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
    if (location.hash === h) renderAll(); else location.hash = h;
  };
  const isViewingThread = (id) => state.route.name === 'chat' && state.route.param === id;
  const imgTag = (src, it, extra) => '<img src="' + esc(src) + '" alt="' + esc(it.title) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(it.category,it.title) + '\'" ' + (extra||'') + '>';

  /* ---------- header ---------- */
  const activeOrders = () => orders().filter(o => !o.confirmedAt && !o.refundedAt).length;
  const renderHeader = () => {
    const u = SMAuth.current();
    const nf = favs().length, nc = SMChat.unreadTotal(), na = activeOrders(), ncart = cart().length;
    $('#appHeader').innerHTML =
      '<div class="logo" data-action="route" data-route="home" role="button" tabindex="0" aria-label="SoundMarket home">' +
        '<span class="logo-mark">' + I.get('logo',19,1.8) + '</span>' +
        '<span><span class="logo-word">Sound<em>Market</em></span><span class="logo-sub">Marketplace certificato</span></span></div>' +
      '<div class="searchbox"><span class="s-ico">' + I.get('search',17) + '</span>' +
        '<input id="globalSearch" type="text" placeholder="Cerca strumenti, vinili, hardware…" autocomplete="off" aria-label="Ricerca"><span class="s-kbd">/</span><div id="suggestBox"></div></div>' +
      '<div class="h-actions">' +
        '<button class="btn btn-brass" data-action="route" data-route="vendi">' + I.get('plus',15,2.2) + '<span>Vendi</span></button>' +
        '<button class="icon-btn" data-action="route" data-route="carrello" aria-label="Carrello">' + I.get('box',20) + (ncart?'<span class="dot">'+ncart+'</span>':'') + '</button>' +
        (u ? '<button class="icon-btn" data-action="route" data-route="acquisti" aria-label="Spedizioni e acquisti">' + I.get('truck',20) + (na?'<span class="dot" data-hdr-orders>'+na+'</span>':'') + '</button>' : '') +
        '<button class="icon-btn" data-action="route" data-route="chat" aria-label="Messaggi">' + I.get('chat',20) + (nc?'<span class="dot">'+nc+'</span>':'') + '</button>' +
        '<button class="icon-btn" data-action="route" data-route="preferiti" aria-label="Preferiti">' + I.heart(false,20) + (nf?'<span class="dot">'+nf+'</span>':'') + '</button>' +
        (u ? '<div class="usermenu"><button class="user-trigger" data-action="menu" aria-haspopup="true">' + SMAuth.avatarHTML(u) + '<span class="semi sm hide-mobile">' + esc(u.name.split(' ')[0]) + '</span>' + I.get('chevronDown',14,2) + '</button>' + (state.menuOpen?dropdown(u,nf,nc,na):'') + '</div>'
           : '<button class="btn btn-ghost hide-mobile" data-action="auth" data-mode="login">Accedi</button><button class="btn btn-primary" data-action="auth" data-mode="register">Registrati</button>') +
      '</div>';
    I.hydrate($('#appHeader'));
  };
  const dropdown = (u, nf, nc, na) =>
    '<div class="dropdown" role="menu"><div class="dd-head"><div class="semi sm">' + esc(u.name) + '</div><div class="xs light">' + esc(u.email) + '</div></div>' +
    '<button class="dd-item" data-action="route" data-route="acquisti">' + I.get('truck',16) + ' Spedizioni e acquisti' + (na?'<span class="dd-badge">'+na+'</span>':'') + '</button>' +
    '<button class="dd-item" data-action="route" data-route="profilo">' + I.get('wallet',16) + ' Dashboard venditore</button>' +
    '<button class="dd-item" data-action="prof-go" data-tab="recensioni">' + I.get('star',16) + ' Le mie recensioni</button>' +
    '<button class="dd-item" data-action="route" data-route="chat">' + I.get('chat',16) + ' Messaggi' + (nc?'<span class="dd-badge">'+nc+'</span>':'') + '</button>' +
    '<button class="dd-item" data-action="route" data-route="preferiti">' + I.get('heart',16) + ' Preferiti' + (nf?'<span class="dd-badge">'+nf+'</span>':'') + '</button>' +
    '<div class="dd-sep"></div><button class="dd-item danger" data-action="logout">' + I.get('logout',16) + ' Esci</button></div>';
  const renderCats = () => {
    $('#catBar').innerHTML = '<button class="cat' + (state.cat==='Tutte'?' active':'') + '" data-action="cat" data-cat="Tutte">' + I.get('music',15) + 'Tutte</button>' +
      SMData.CATEGORIES.map(c => '<button class="cat' + (state.cat===c?' active':'') + '" data-action="cat" data-cat="' + esc(c) + '">' + I.catIcon(c,15) + esc(c) + '</button>').join('');
    I.hydrate($('#catBar'));
  };

  /* ---------- card ---------- */
  const cardHTML = (it, i = 0) => {
    const st = itemStatus(it), fav = favs().includes(it.sku), fee = SMData.protectionFee(it.price), mine = isMine(it);
    const a = revAgg(it.sku);
    return '<article class="card" style="--i:' + Math.min(i,11) + '" data-action="item" data-sku="' + esc(it.sku) + '" tabindex="0" role="button" aria-label="' + esc(it.title) + '">' +
      '<div class="card-img">' + imgTag(it.images[0], it) +
        '<span class="badge' + ((it.grading==='Mint'||it.grading==='Near Mint')?' mint':'') + '">' + esc(it.grading) + '</span>' +
        (it.verified ? '<span class="badge-verified">' + I.get('verified',11,2) + 'Verificato</span>' : '') +
        (mine ? '<span class="badge-status st-mine">Tuo annuncio</span>' : st==='reserved' ? '<span class="badge-status st-reserved">Riservato</span>' : st==='sold' ? '<span class="badge-status st-sold">Venduto</span>' : '') +
        '<button class="fav-btn' + (fav?' on':'') + '" data-action="fav" data-sku="' + esc(it.sku) + '" aria-label="Preferiti">' + I.heart(fav,16) + '</button></div>' +
      '<div class="card-body"><h3 class="card-title">' + esc(it.title) + '</h3>' +
        '<div class="card-meta"><span>' + esc(it.brand) + '</span><span>' + esc(timeAgo(it.createdAt)) + '</span></div>' +
        (a.n ? '<div class="card-rate">' + I.star(true,12) + '<b class="tabular">' + a.avg.toFixed(1) + '</b><span>· ' + a.n + ' recension' + (a.n===1?'e':'i') + '</span></div>' : '') +
        '<div class="card-price-row"><div class="card-price tabular">' + fmtMoney(it.price) + '</div>' +
        '<div class="card-total tabular"><b>' + fmtMoney(it.price+fee) + '</b> incl. Protezione Acquisti</div></div></div></article>';
  };
  const emptyHTML = (icon, title, text, btn='') => '<div class="empty"><div class="empty-ico">' + I.get(icon,26) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + btn + '</div>';
  const guardHTML = (t, p) => '<div class="guard view"><div class="empty-ico">' + I.get('lock',26) + '</div><h2>' + esc(t) + '</h2><p>' + esc(p) + '</p><div class="guard-btns"><button class="btn btn-primary btn-lg" data-action="auth" data-mode="login">Accedi</button><button class="btn btn-outline btn-lg" data-action="auth" data-mode="register">Registrati</button></div></div>';

  /* ---------- home ---------- */
  const trust = (icon,t,s) => '<div class="trust"><span class="trust-ico">' + I.get(icon,18) + '</span><div><b>' + t + '</b><span>' + s + '</span></div></div>';
  const sortOpt = (v,l) => '<option value="' + v + '"' + (state.filters.sort===v?' selected':'') + '>' + l + '</option>';
  const sortItems = (arr) => {
    const a = [...arr], s = state.filters.sort;
    if (s==='price-asc') a.sort((x,y)=>x.price-y.price);
    else if (s==='price-desc') a.sort((x,y)=>y.price-x.price);
    else if (s==='name') a.sort((x,y)=>x.title.localeCompare(y.title));
    else if (s==='rating') a.sort((x,y)=>revAgg(y.sku).avg-revAgg(x.sku).avg);
    else a.sort((x,y)=>y.createdAt-x.createdAt);
    return a;
  };
  const viewHome = () => {
    let items = allItems();
    if (state.cat !== 'Tutte') items = items.filter(i => i.category === state.cat);
    if (state.filters.max !== '') items = items.filter(i => i.price <= Number(state.filters.max));
    items = sortItems(items);
    const feat = ['Chitarre Elettriche','Vinili','Tastiere','Pedali Effetto'];
    const counts = {}; allItems().forEach(i => counts[i.category] = (counts[i.category]||0)+1);
    const nrev = reviews().length;
    return '<div class="view">' +
      (state.cat==='Tutte' ?
        '<section class="hero"><div class="hero-in"><div><div class="hero-eyebrow">' + I.get('shieldCheck',14,2) + 'Grading certificato · Escrow · Tracking live</div>' +
        '<h1>Il marketplace certificato per la musica usata</h1><p>Strumenti, vinili e hardware di seconda mano con stato di conservazione verificato, anteprima audio, recensioni reali e tracciamento della spedizione in tempo reale.</p>' +
        '<div class="hero-cta"><button class="btn btn-brass btn-lg" data-action="route" data-route="vendi">' + I.get('plus',16,2.2) + 'Pubblica inserzione</button>' +
        '<button class="btn btn-lg" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.3);color:#fff" data-action="modal" data-modal="protezione">Come funziona la tutela</button></div></div>' +
        '<div class="hero-stats"><div class="hstat"><b class="tabular">' + allItems().length + '</b><span>Inserzioni attive</span></div><div class="hstat"><b class="tabular">' + nrev + '</b><span>Recensioni verificate</span></div><div class="hstat"><b class="tabular">48 h</b><span>Finestra contestazione</span></div></div></div></section>' +
        '<div class="trustbar">' + trust('shieldCheck','Protezione Acquisti','Rimborso integrale su non conformità') + trust('truck','Tracking in tempo reale','Elaborato · spedito · transito · consegna') + trust('star','Recensioni verificate','Solo da acquirenti con ordine completato') + trust('lock','Deposito in escrow','Fondi vincolati fino alla conferma') + '</div>' +
        '<div class="sec-head"><h2 class="sec-title">Categorie in evidenza</h2></div><div class="tiles">' + feat.map(c =>
          '<div class="tile" data-action="cat" data-cat="' + esc(c) + '" role="button" tabindex="0"><img src="' + esc(SMData.imagesFor(c,0)[0]) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(c,c) + '\'"><div class="tile-in"><b>' + esc(c) + '</b><span class="tabular">' + (counts[c]||0) + ' inserzioni</span></div></div>').join('') + '</div>' : '') +
      '<div class="sec-head"><h2 class="sec-title">' + (state.cat==='Tutte'?'Tutte le inserzioni':esc(state.cat)) + '</h2><span class="sec-count tabular">' + items.length + ' risultati</span></div>' +
      '<div class="filters"><select class="f-select" data-filter="sort">' + sortOpt('recent','Più recenti') + sortOpt('price-asc','Prezzo crescente') + sortOpt('price-desc','Prezzo decrescente') + sortOpt('rating','Più votati') + sortOpt('name','Nome A–Z') + '</select>' +
      '<input class="f-input tabular" type="number" min="0" placeholder="Prezzo max €" data-filter="max" value="' + esc(state.filters.max) + '">' +
      '<button class="f-chip" data-action="route" data-route="cerca">' + I.get('sliders',14) + 'Filtri avanzati</button></div>' +
      '<div class="grid">' + (items.length ? items.map((it,i)=>cardHTML(it,i)).join('') : emptyHTML('search','Nessun risultato','Nessuna inserzione corrisponde ai criteri selezionati.','<button class="btn btn-outline" data-action="cat" data-cat="Tutte">Mostra tutto</button>')) + '</div></div>';
  };

  /* ---------- ricerca ---------- */
  const viewSearch = () => {
    const f = state.filters;
    let items = allItems();
    if (state.cat !== 'Tutte') items = items.filter(i => i.category === state.cat);
    if (f.q) { const q = f.q.toLowerCase(); items = items.filter(i => (i.title+' '+i.brand+' '+i.category+' '+i.desc).toLowerCase().includes(q)); }
    if (f.brand) items = items.filter(i => i.brand === f.brand);
    if (f.grade) items = items.filter(i => i.grading === f.grade);
    if (f.min !== '') items = items.filter(i => i.price >= Number(f.min));
    if (f.max !== '') items = items.filter(i => i.price <= Number(f.max));
    items = sortItems(items);
    const sv = saved(), brands = Array.from(new Set(allItems().map(i=>i.brand))).sort();
    return '<div class="view"><div class="sec-head"><h2 class="sec-title">Ricerca avanzata</h2><span class="sec-count tabular">' + items.length + ' risultati' + (f.q?' per «'+esc(f.q)+'»':'') + '</span></div>' +
      (sv.length ? '<div class="saved-row">' + sv.map(s => '<span class="f-chip" data-action="apply-saved" data-id="' + esc(s.id) + '">' + I.get('bookmark',13) + esc(s.label) + '<button class="x" data-action="remove-saved" data-id="' + esc(s.id) + '">' + I.get('x',12,2) + '</button></span>').join('') + '</div>' : '') +
      '<div class="search-layout"><aside class="fside"><h3>Categoria</h3><select data-filter="cat"><option value="Tutte">Tutte le categorie</option>' + SMData.CATEGORIES.map(c => '<option' + (state.cat===c?' selected':'') + '>' + esc(c) + '</option>').join('') + '</select>' +
      '<h3>Brand</h3><select data-filter="brand"><option value="">Tutti i brand</option>' + brands.map(b => '<option' + (f.brand===b?' selected':'') + '>' + esc(b) + '</option>').join('') + '</select>' +
      '<h3>Grading</h3><select data-filter="grade"><option value="">Tutti i gradi</option>' + SMData.GRADING.map(g => '<option' + (f.grade===g.id?' selected':'') + '>' + esc(g.id) + '</option>').join('') + '</select>' +
      '<h3>Prezzo (€)</h3><div class="pair"><input type="number" min="0" placeholder="Min" data-filter="min" value="' + esc(f.min) + '"><input type="number" min="0" placeholder="Max" data-filter="max" value="' + esc(f.max) + '"></div>' +
      '<h3>Ordinamento</h3><select data-filter="sort">' + sortOpt('recent','Più recenti') + sortOpt('price-asc','Prezzo crescente') + sortOpt('price-desc','Prezzo decrescente') + sortOpt('rating','Più votati') + sortOpt('name','Nome A–Z') + '</select>' +
      '<button class="btn btn-outline btn-block btn-sm" data-action="save-search">' + I.get('bookmark',14) + 'Salva questa ricerca</button>' +
      '<button class="btn btn-ghost btn-block btn-sm" data-action="reset-filters">' + I.get('refresh',14) + 'Azzera filtri</button></aside>' +
      '<div><div class="grid">' + (items.length ? items.map((it,i)=>cardHTML(it,i)).join('') : emptyHTML('search','Nessun risultato','Modificare i filtri o ampliare l\u2019intervallo di prezzo.','<button class="btn btn-outline" data-action="reset-filters">Azzera filtri</button>')) + '</div></div></div></div>';
  };

  /* ---------- scheda prodotto ---------- */
  const condItem = (l,v) => '<div class="cond-item"><div class="cond-label">' + l + '</div><div class="cond-val tabular">' + v + '%</div><div class="cond-bar"><i style="width:' + v + '%"></i></div></div>';
  const viewItem = () => {
    const it = findItem(state.route.param);
    if (!it) return '<div class="view">' + emptyHTML('alert','Articolo non trovato','L\u2019inserzione è stata rimossa o non esiste.','<button class="btn btn-primary" data-action="route" data-route="home">Torna al catalogo</button>') + '</div>';
    const st = itemStatus(it), mine = isMine(it), fav = favs().includes(it.sku);
    const fee = SMData.protectionFee(it.price), ship = SMData.shipCost(it.size);
    const idx = Math.min(state.galleryIdx, it.images.length-1);
    const specs = Object.entries(it.specs||{}).map(([k,v]) => '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>').join('');
    const myOrder = orders().find(o => o.sku === it.sku && !o.confirmedAt && !o.refundedAt);
    const cond = it.condition || { estetica:90, meccanica:95, elettronica:98, difetti:'Nessun difetto rilevante' };
    const sel = typeof it.seller === 'object' ? it.seller : { name:it.seller, rating:5, sales:1, city:'Italia', response:'2 h', verified:true };
    const sa = sellerAgg(sel.name);
    const rating = sa.n ? sa.avg : (sel.rating||5);
    const inCart = cart().includes(it.sku);
    return '<div class="view"><button class="crumb" data-action="route" data-route="home">' + I.get('arrowLeft',15,2) + 'Torna al catalogo</button><div class="pdp">' +
      '<div><div class="gallery"><div class="g-thumbs">' + it.images.map((src,k) => '<button class="g-thumb' + (k===idx?' on':'') + '" data-action="thumb" data-idx="' + k + '">' + imgTag(src,it) + '</button>').join('') + '</div>' +
      '<div class="g-main" data-action="zoom" data-src="' + esc(it.images[idx]) + '" data-label="' + esc(it.title) + '">' + imgTag(it.images[idx],it) + '<span class="g-zoom">' + I.get('zoom',14) + 'Ispeziona</span></div></div>' +
      '<div style="margin-top:22px"><div class="block-title">Descrizione del venditore</div><p class="desc-p">' + esc(it.desc) + '</p></div>' +
      '<div class="block-title" style="margin-top:22px">Valutazione stato d\u2019uso</div><div class="condition-grid">' + condItem('Estetica',cond.estetica) + condItem('Meccanica',cond.meccanica) + condItem('Elettronica',cond.elettronica) + '</div>' +
      '<div class="escrow-note" style="margin-top:10px;background:var(--warning-bg);border-color:#F1D9A8;color:var(--warning)">' + I.get('info',15) + '<span><b>Difetti segnalati:</b> ' + esc(cond.difetti) + '</span></div>' +
      '<div class="sc-player"><div class="block-title" style="margin:0;display:flex;align-items:center;gap:7px">' + I.get('headphones',14) + 'Anteprima audio · ' + esc((it.audioProfile||SMData.audioProfile(it.category)).label) + '</div>' +
      '<div class="sc-wave" id="scWave"></div><div class="sc-controls"><button class="sc-play" data-action="audio-play" data-sku="' + esc(it.sku) + '" id="scPlayBtn">' + I.get('play',18) + '</button><span class="sc-time" id="scTime">0:00 / 0:08</span><span class="xs light" style="margin-left:auto">Sintesi Web Audio</span></div></div>' +
      '<div class="price-chart-box"><div class="block-title" style="display:flex;align-items:center;gap:7px">' + I.get('trending',14) + 'Andamento prezzo usato · 12 mesi</div><canvas id="priceChart"></canvas></div>' +
      '<div style="margin-top:22px"><div class="block-title">Specifiche tecniche</div><table class="spec-table">' + specs +
      '<tr><td>Categoria</td><td>' + esc(it.category) + '</td></tr><tr><td>Grading dichiarato</td><td>' + esc(it.grading) + '</td></tr>' +
      '<tr><td>Fascia spedizione</td><td>' + esc((SMData.SIZES.find(s=>s.id===it.size)||{}).label||'Medio') + '</td></tr><tr><td>Codice SKU</td><td class="tabular">' + esc(it.sku) + '</td></tr></table></div>' +
      '<div id="revSection">' + reviewsSection(it) + '</div></div>' +
      '<div class="pdp-panel"><div><h1 class="pdp-title">' + esc(it.title) + '</h1><div class="pdp-sub"><span class="grade-pill">' + I.get('shieldCheck',12,2) + esc(it.grading) + '</span><span>' + esc(it.brand) + '</span><span>·</span><span>' + esc(timeAgo(it.createdAt)) + '</span></div></div>' +
      (st==='sold' ? '<div class="status-banner sold">' + I.get('alert',16) + 'Articolo venduto. Transazione conclusa.</div>'
        : st==='reserved' ? '<div class="status-banner reserved">' + I.get('clock',16) + (myOrder ? '<span>Hai riservato questo articolo. <b style="cursor:pointer;text-decoration:underline" data-action="track" data-id="' + esc(myOrder.id) + '">Traccia la spedizione</b>.</span>' : 'Articolo riservato: transazione in corso.') + '</div>' : '') +
      '<div class="price-box"><div class="price-main tabular">' + fmtMoney(it.price) + '</div><div class="price-rows">' +
      '<div class="price-row"><span>Protezione Acquisti Musicista</span><span class="tabular">' + fmtMoney(fee) + '</span></div>' +
      '<div class="price-row"><span>Spedizione assicurata</span><span class="tabular">' + fmtMoney(ship) + '</span></div>' +
      '<div class="price-row total"><span>Totale stimato</span><span class="tabular">' + fmtMoney(it.price+fee+ship) + '</span></div></div>' +
      '<div class="escrow-note">' + I.get('lock',15) + '<span>Importo in escrow finché non confermi la ricezione. Tracking live dalla lavorazione alla consegna.</span></div></div>' +
      '<div class="seller-card">' + SMAuth.avatarHTML({ name:sel.name, email:sel.name }, 'avatar-lg') + '<div><div class="s-name">' + esc(sel.name) + (sel.verified?' ' + I.get('verified',14,2):'') + '</div>' +
      '<div class="s-meta">' + I.stars(rating) + '<span class="tabular">' + rating.toFixed(1) + '</span><span>·</span><span class="tabular">' + (sa.n||sel.sales||1) + (sa.n?' recension'+(sa.n===1?'e':'i'):' vendite') + '</span></div>' +
      '<div class="s-meta">' + I.get('pin',12) + esc(sel.city||'Italia') + '<span>·</span>' + I.get('clock',12) + 'risponde in ' + esc(sel.response||'2 h') + '</div></div></div>' +
      '<div class="pdp-actions">' +
      (mine ? '<button class="btn btn-primary btn-lg" data-action="edit-item" data-sku="' + esc(it.sku) + '">' + I.get('edit',16) + 'Modifica inserzione</button><button class="btn btn-outline btn-lg" data-action="delete-item" data-sku="' + esc(it.sku) + '">' + I.get('trash',16) + 'Rimuovi inserzione</button>'
        : '<button class="btn btn-primary btn-lg" data-action="buy" data-sku="' + esc(it.sku) + '"' + (st!=='available'?' disabled':'') + '>' + I.get('card',16) + 'Acquista ora</button>' +
          '<button class="btn btn-outline btn-lg" data-action="add-cart" data-sku="' + esc(it.sku) + '"' + (st!=='available'?' disabled':'') + '>' + I.get(inCart?'check':'box',16) + (inCart?'Nel carrello':'Aggiungi al carrello') + '</button>' +
          '<button class="btn btn-outline btn-lg" data-action="offer" data-sku="' + esc(it.sku) + '"' + (st!=='available'?' disabled':'') + '>' + I.get('euro',16) + 'Fai un\u2019offerta</button>' +
          '<button class="btn btn-outline btn-lg" data-action="contact" data-sku="' + esc(it.sku) + '">' + I.get('chat',16) + 'Chiedi al venditore</button>') +
      '<button class="btn btn-ghost" data-action="fav" data-sku="' + esc(it.sku) + '" style="justify-content:flex-start">' + I.heart(fav,16) + (fav?'Salvato nei preferiti':'Salva nei preferiti') + '</button></div>' +
      '<div class="pdp-meta-row"><span>' + I.get('truck',14) + 'BRT/DHL 2–4 gg</span><span>' + I.get('shieldCheck',14) + 'Rimborso garantito</span><button class="crumb" style="margin:0" data-action="share" data-sku="' + esc(it.sku) + '">' + I.get('share',13) + 'Condividi</button></div></div></div></div>';
  };

  /* ---------- sezione recensioni ---------- */
  const reviewsSection = (it) => {
    const a = revAgg(it.sku);
    let list = revFor(it.sku);
    const u = SMAuth.current();
    if (state.revSort === 'helpful') list = [...list].sort((x,y) => (y.helpful||[]).length - (x.helpful||[]).length);
    else if (state.revSort === 'high') list = [...list].sort((x,y) => y.rating - x.rating);
    else if (state.revSort === 'low') list = [...list].sort((x,y) => x.rating - y.rating);
    else list = [...list].sort((x,y) => y.at - x.at);
    const eligible = reviewableOrder(it.sku);
    const mine = isMine(it);
    const cta = eligible
      ? '<button class="btn btn-brass btn-sm" data-action="write-rev" data-sku="' + esc(it.sku) + '" data-order="' + esc(eligible.id) + '">' + I.get('star',14) + 'Scrivi una recensione</button>'
      : (u ? '<span class="xs light" style="display:inline-flex;align-items:center;gap:6px">' + I.get('info',13) + 'Puoi recensire dopo aver ricevuto l\u2019articolo.</span>' : '<button class="btn btn-outline btn-sm" data-action="auth" data-mode="login">Accedi per recensire</button>');
    const dist = a.dist.map((n,i) => {
      const star = 5-i, pct = a.n ? Math.round(n/a.n*100) : 0;
      return '<div class="rev-drow"><span class="lbl">' + star + I.star(true,11) + '</span><span class="rev-bar"><i style="width:' + pct + '%"></i></span><span class="n">' + n + '</span></div>';
    }).join('');
    return '<div class="rev-wrap"><div class="sec-head" style="margin:0 0 14px"><h2 class="sec-title" style="font-size:1.15rem">Recensioni verificate</h2><span class="sec-count tabular">' + a.n + ' recension' + (a.n===1?'e':'i') + '</span></div>' +
      (a.n ? '<div class="rev-summary"><div class="rev-avg"><b class="tabular">' + a.avg.toFixed(1) + '</b>' + I.stars(a.avg) + '<span>su ' + a.n + ' acquist' + (a.n===1?'o':'i') + ' verificat' + (a.n===1?'o':'i') + '</span></div><div class="rev-dist">' + dist + '</div></div>' : '') +
      '<div class="rev-toolbar">' + cta +
      (a.n > 1 ? '<select class="f-select" data-revsort style="margin-left:auto"><option value="recent"' + (state.revSort==='recent'?' selected':'') + '>Più recenti</option><option value="helpful"' + (state.revSort==='helpful'?' selected':'') + '>Più utili</option><option value="high"' + (state.revSort==='high'?' selected':'') + '>Voto più alto</option><option value="low"' + (state.revSort==='low'?' selected':'') + '>Voto più basso</option></select>' : '') +
      '</div>' +
      (list.length ? list.map(r => revCard(r, mine, u)).join('') : '<div class="rev-empty">' + I.get('star',22) + '<p class="sm" style="margin-top:8px">Nessuna recensione per questo articolo. Le recensioni sono riservate agli acquirenti con ordine consegnato.</p></div>') +
      '</div>';
  };
  const revCard = (r, mineListing, u) => {
    const own = u && r.userId === u.id;
    const helped = u && (r.helpful||[]).indexOf(u.id) >= 0;
    const sub = r.sub || {};
    return '<article class="rev-card" data-rev="' + esc(r.id) + '"><div class="rev-head">' +
      SMAuth.avatarHTML({ name:r.userName, email:r.userName, photo: own && u ? (SMAuth.fullUser()||{}).photo : '' }) +
      '<div><div class="rv-name">' + esc(r.userName) + '</div><div class="xs light">' + I.stars(r.rating) + '</div></div>' +
      (r.verified ? '<span class="rev-verified">' + I.get('verified',11,2) + 'Acquisto verificato</span>' : '') +
      '<span class="rv-date">' + esc(fmtDate(r.at)) + '</span></div>' +
      (r.title ? '<div class="rev-title">' + esc(r.title) + '</div>' : '') +
      '<p class="rev-text">' + esc(r.text) + '</p>' +
      '<div class="rev-sub">' +
        '<span class="rev-chip">Comunicazione <b>' + (sub.comunicazione||r.rating) + '/5</b></span>' +
        '<span class="rev-chip">Imballaggio <b>' + (sub.imballaggio||r.rating) + '/5</b></span>' +
        '<span class="rev-chip">Conformità <b>' + (sub.conformita||r.rating) + '/5</b></span>' +
      '</div>' +
      (r.reply ? '<div class="rev-reply"><div class="rr-h">' + I.get('chat',12,2) + 'Risposta del venditore</div><p>' + esc(r.reply.text) + '</p><div class="xs light" style="margin-top:5px">' + esc(fmtDate(r.reply.at)) + '</div></div>' : '') +
      '<div class="rev-foot">' +
        '<button class="rev-help' + (helped?' on':'') + '" data-action="rev-help" data-id="' + esc(r.id) + '">' + I.get('check',13,2.4) + 'Utile <span class="tabular">(' + (r.helpful||[]).length + ')</span></button>' +
        (own ? '<button class="btn btn-ghost btn-sm" data-action="rev-edit" data-id="' + esc(r.id) + '">' + I.get('edit',13) + 'Modifica</button><button class="btn btn-ghost btn-sm" data-action="rev-del" data-id="' + esc(r.id) + '">' + I.get('trash',13) + 'Elimina</button>' : '') +
        (mineListing && !r.reply ? '<button class="btn btn-outline btn-sm" data-action="rev-reply" data-id="' + esc(r.id) + '">' + I.get('chat',13) + 'Rispondi</button>' : '') +
      '</div></article>';
  };
  const patchReviews = (sku) => {
    const box = $('#revSection'); if (!box) return;
    const it = findItem(sku); if (!it) return;
    box.innerHTML = reviewsSection(it);
    I.hydrate(box);
  };

  /* ---------- form recensione ---------- */
  const openReviewForm = (sku, orderId, editId) => {
    if (!SMAuth.requireUser('Accedere per scrivere una recensione.')) return;
    const it = findItem(sku); if (!it) return;
    const u = SMAuth.current();
    const ex = editId ? reviews().find(r => r.id === editId) : null;
    const draft = { rating: ex?ex.rating:5, sub:{ comunicazione: ex?(ex.sub||{}).comunicazione||5:5, imballaggio: ex?(ex.sub||{}).imballaggio||5:5, conformita: ex?(ex.sub||{}).conformita||5:5 } };
    const picker = (key, val, small) => '<div class="star-picker' + (small?' sm':'') + '" data-pick="' + key + '">' +
      [1,2,3,4,5].map(n => '<button type="button" data-val="' + n + '" class="' + (n<=val?'on':'') + '" aria-label="' + n + ' stelle">' + I.star(n<=val, small?16:20) + '</button>').join('') + '</div>';
    SMU.openModal(ex ? 'Modifica recensione' : 'Scrivi una recensione',
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px"><img src="' + esc(it.images[0]) + '" alt="" style="width:46px;height:60px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(it.category,it.title) + '\'">' +
      '<div style="min-width:0"><div class="semi sm">' + esc(it.title) + '</div><div class="xs light">@' + esc(sName(it.seller)) + (orderId?' · ordine ' + esc(orderId):'') + '</div></div></div>' +
      '<form id="revForm" data-sku="' + esc(sku) + '" data-order="' + esc(orderId||'') + '" data-edit="' + esc(editId||'') + '" novalidate>' +
      '<div class="rev-rate-row" style="border-top:1px solid var(--border)"><span class="rl">Valutazione complessiva</span>' + picker('rating', draft.rating, false) + '</div>' +
      '<div class="rev-rate-row"><span class="rl">Comunicazione con il venditore</span>' + picker('comunicazione', draft.sub.comunicazione, true) + '</div>' +
      '<div class="rev-rate-row"><span class="rl">Qualità dell\u2019imballaggio</span>' + picker('imballaggio', draft.sub.imballaggio, true) + '</div>' +
      '<div class="rev-rate-row"><span class="rl">Conformità alla descrizione</span>' + picker('conformita', draft.sub.conformita, true) + '</div>' +
      '<div class="fg" style="margin-top:16px"><label for="rvTitle">Titolo</label><input class="f-in" id="rvTitle" maxlength="70" placeholder="Es. Strumento impeccabile, spedizione rapida" value="' + esc(ex?ex.title:'') + '"></div>' +
      '<div class="fg"><label for="rvText">La tua esperienza *</label><textarea class="f-ta" id="rvText" maxlength="900" placeholder="Descrivi condizioni reali, imballaggio, tempi di consegna e comunicazione con il venditore. Minimo 20 caratteri.">' + esc(ex?ex.text:'') + '</textarea><div class="hint">La recensione è pubblicata come acquisto verificato e visibile a tutti gli utenti.</div></div>' +
      '<div class="f-err hidden" id="rvErr"></div>' +
      '<button type="submit" class="btn btn-primary btn-lg btn-block">' + I.get('check',16,2.2) + (ex?'Salva modifiche':'Pubblica recensione') + '</button></form>', { wide:true });
    const root = $('#modalRoot');
    $$('[data-pick]', root).forEach(p => {
      const key = p.dataset.pick;
      const paint = (v) => $$('button', p).forEach(b => { const n = Number(b.dataset.val); b.classList.toggle('on', n<=v); b.innerHTML = I.star(n<=v, key==='rating'?20:16); });
      p.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b) paint(Number(b.dataset.val)); });
      p.addEventListener('mouseleave', () => paint(key==='rating'?draft.rating:draft.sub[key]));
      p.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const v = Number(b.dataset.val);
        if (key === 'rating') draft.rating = v; else draft.sub[key] = v;
        paint(v);
      });
    });
    root.__revDraft = draft;
    I.hydrate(root);
  };
  const submitReview = (form) => {
    const u = SMAuth.current(); if (!u) return;
    const sku = form.dataset.sku, orderId = form.dataset.order, editId = form.dataset.edit;
    const title = $('#rvTitle').value.trim(), text = $('#rvText').value.trim(), err = $('#rvErr');
    if (text.length < 20) { err.innerHTML = I.get('alert',13,2) + 'Descrivi l\u2019esperienza in almeno 20 caratteri.'; err.classList.remove('hidden'); return; }
    const d = $('#modalRoot').__revDraft || { rating:5, sub:{ comunicazione:5, imballaggio:5, conformita:5 } };
    const list = reviews();
    if (editId) {
      const r = list.find(x => x.id === editId && x.userId === u.id);
      if (!r) { SMU.closeModal(); return; }
      Object.assign(r, { rating:d.rating, sub:{ ...d.sub }, title, text, edited:Date.now() });
      saveReviews(list); SMU.closeModal(); SMU.toast('Recensione aggiornata.', { type:'success' });
    } else {
      if (orderId && myRev(orderId)) { SMU.closeModal(); SMU.toast('Hai già recensito questo ordine.', { type:'info' }); return; }
      list.unshift({ id:uid('rv'), sku, orderId:orderId||null, userId:u.id, userName:u.name,
        rating:d.rating, sub:{ ...d.sub }, title, text, at:Date.now(), helpful:[], reply:null, verified:true, seed:false });
      saveReviews(list); SMU.closeModal(); SMU.toast('Recensione pubblicata. Grazie per il contributo.', { type:'success' });
    }
    patchReviews(sku); renderHeader();
    if (state.route.name === 'profilo' && state.profTab === 'recensioni') renderMain();
  };
  const toggleHelpful = (id) => {
    if (!SMAuth.requireUser('Accedere per votare una recensione.')) return;
    const u = SMAuth.current(), list = reviews(), r = list.find(x => x.id === id);
    if (!r) return;
    r.helpful = r.helpful || [];
    const i = r.helpful.indexOf(u.id);
    if (i >= 0) r.helpful.splice(i,1); else r.helpful.push(u.id);
    saveReviews(list);
    const card = SMU.$('[data-rev="' + id + '"]');
    if (card) {
      const b = card.querySelector('[data-action="rev-help"]');
      if (b) { const on = r.helpful.indexOf(u.id) >= 0; b.classList.toggle('on', on); b.innerHTML = I.get('check',13,2.4) + 'Utile <span class="tabular">(' + r.helpful.length + ')</span>'; }
    }
  };
  const deleteReview = (id) => {
    const u = SMAuth.current(); if (!u) return;
    const list = reviews(), i = list.findIndex(r => r.id === id && r.userId === u.id);
    if (i < 0) return;
    const sku = list[i].sku, removed = list[i];
    SMU.openModal('Eliminare la recensione?', '<p class="sm muted" style="margin-bottom:16px">La recensione verrà rimossa definitivamente. Puoi annullare subito dopo.</p><div style="display:flex;gap:10px"><button class="btn btn-danger btn-block" id="rvDelYes">Elimina</button><button class="btn btn-outline btn-block" data-action="modal-close">Annulla</button></div>');
    $('#rvDelYes').addEventListener('click', () => {
      const l = reviews(), j = l.findIndex(r => r.id === id);
      if (j >= 0) l.splice(j,1);
      saveReviews(l); SMU.closeModal(); patchReviews(sku);
      if (state.route.name === 'profilo' && state.profTab === 'recensioni') renderMain();
      SMU.toast('Recensione eliminata.', { type:'info', action:{ label:'Annulla', fn:() => { const a = reviews(); a.unshift(removed); saveReviews(a); patchReviews(sku); SMU.toast('Recensione ripristinata.', { type:'success' }); } } });
    });
  };
  const replyReview = (id) => {
    const r = reviews().find(x => x.id === id); if (!r) return;
    SMU.openModal('Rispondi alla recensione',
      '<p class="sm muted" style="margin-bottom:12px">' + esc(r.userName) + ' · ' + I.stars(r.rating) + '</p>' +
      '<p class="sm" style="padding:11px 13px;background:var(--surface);border-radius:6px;margin-bottom:14px">' + esc(r.text) + '</p>' +
      '<form id="revReplyForm" data-id="' + esc(id) + '"><div class="fg"><label>La tua risposta pubblica *</label><textarea class="f-ta" id="rrText" maxlength="600" placeholder="Rispondi in modo professionale e costruttivo. Minimo 10 caratteri."></textarea></div>' +
      '<div class="f-err hidden" id="rrErr"></div><button type="submit" class="btn btn-primary btn-lg btn-block">Pubblica risposta</button></form>');
  };
  const submitReply = (form) => {
    const id = form.dataset.id, text = $('#rrText').value.trim(), err = $('#rrErr');
    if (text.length < 10) { err.textContent = 'La risposta deve avere almeno 10 caratteri.'; err.classList.remove('hidden'); return; }
    const list = reviews(), r = list.find(x => x.id === id); if (!r) { SMU.closeModal(); return; }
    r.reply = { text, at:Date.now() }; saveReviews(list);
    SMU.closeModal(); patchReviews(r.sku); SMU.toast('Risposta pubblicata.', { type:'success' });
  };

  /* ---------- audio ---------- */
  let audioCtx = null, audioNodes = [], audioPlaying = false, audioTimer = null;
  const stopAudio = () => {
    audioNodes.forEach(n => { try { n.stop(); } catch(e){} });
    audioNodes = []; audioPlaying = false;
    if (audioTimer) { clearInterval(audioTimer); audioTimer = null; }
    const b = $('#scPlayBtn'); if (b) b.innerHTML = I.get('play',18);
    const w = $('#scWave'); if (w) Array.from(w.children).forEach(x => x.classList.remove('played'));
    const t = $('#scTime'); if (t) t.textContent = '0:00 / 0:08';
  };
  const playAudio = (sku) => {
    const it = findItem(sku); if (!it) return;
    if (audioPlaying) { stopAudio(); return; }
    const p = it.audioProfile || SMData.audioProfile(it.category);
    try { if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
    catch(e) { SMU.toast('Audio non supportato dal browser.', { type:'warning' }); return; }
    audioPlaying = true;
    const b = $('#scPlayBtn'); if (b) b.innerHTML = I.get('pause',18);
    const wave = $('#scWave');
    if (wave) { wave.innerHTML = ''; for (let i=0;i<48;i++){ const x=document.createElement('i'); x.style.height=(20+Math.abs(Math.sin(i*.7)*28)+Math.random()*8)+'px'; wave.appendChild(x); } }
    const master = audioCtx.createGain(); master.gain.value = .22;
    const filter = audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=p.filter;
    filter.connect(master); master.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (p.type === 'noise') {
      for (let beat=0;beat<8;beat++){
        const t = now + beat*.5, n = audioCtx.sampleRate*.15;
        const buf = audioCtx.createBuffer(1,n,audioCtx.sampleRate), d = buf.getChannelData(0);
        for (let i=0;i<n;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/n,2);
        const s = audioCtx.createBufferSource(); s.buffer = buf;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(beat%2===0?.5:.25,t);
        const f = audioCtx.createBiquadFilter(); f.type = beat%2===0?'lowpass':'highpass'; f.frequency.value = beat%2===0?200:4000;
        s.connect(f); f.connect(g); g.connect(master); s.start(t); audioNodes.push(s);
      }
    } else {
      p.notes.forEach((fr,ni) => {
        const o = audioCtx.createOscillator(); o.type=p.type; o.frequency.value=fr;
        const g = audioCtx.createGain(), st = now + ni*.12;
        g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(.3,st+.02); g.gain.exponentialRampToValueAtTime(.001,st+p.decay);
        o.connect(g); g.connect(filter); o.start(st); o.stop(st+p.decay+.1); audioNodes.push(o);
      });
      for (let s=0;s<12;s++){
        const fr = p.notes[s%p.notes.length]*(s>=6?2:1);
        const o = audioCtx.createOscillator(); o.type=p.type; o.frequency.value=fr;
        const g = audioCtx.createGain(), st = now+2.5+s*.4;
        g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(.2,st+.02); g.gain.exponentialRampToValueAtTime(.001,st+.5);
        o.connect(g); g.connect(filter); o.start(st); o.stop(st+.6); audioNodes.push(o);
      }
    }
    let el = 0;
    audioTimer = setInterval(() => {
      el += .1;
      const bars = wave ? wave.children.length : 48, played = Math.floor(el/8*bars);
      if (wave) Array.from(wave.children).forEach((x,i) => x.classList.toggle('played', i<played));
      const t = $('#scTime'); if (t) t.textContent = '0:0' + Math.min(8,Math.floor(el)) + ' / 0:08';
      if (el >= 8) stopAudio();
    }, 100);
  };

  /* ---------- grafico ---------- */
  let chart = null;
  const renderChart = (it) => {
    const c = $('#priceChart'); if (!c || !window.Chart) return;
    if (chart) { chart.destroy(); chart = null; }
    const h = SMData.priceHistory(it), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,0,180);
    g.addColorStop(0,'rgba(15,76,92,.25)'); g.addColorStop(1,'rgba(15,76,92,0)');
    chart = new Chart(ctx, { type:'line',
      data:{ labels:h.labels, datasets:[{ label:'Prezzo medio usato', data:h.data, borderColor:'#0F4C5C', backgroundColor:g, fill:true, tension:.35, pointRadius:2, pointBackgroundColor:'#E8B04B', borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, animation:{ duration:600 },
        plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(x)=>fmtMoney(x.parsed.y) }, backgroundColor:'#0F172A', padding:10, cornerRadius:6 } },
        scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10, family:'Inter' }, color:'#94A3B8', maxRotation:0 } },
                 y:{ grid:{ color:'#F1F5F9' }, ticks:{ font:{ size:10, family:'Inter' }, color:'#94A3B8', callback:(v)=>'€'+v } } } } });
  };

  /* ---------- chat ---------- */
  const quick = (t) => '<button class="quick" data-action="quick" data-text="' + esc(t) + '">' + esc(t) + '</button>';
  const msgHTML = (m, th) => {
    if (m.f === 'sys') return '<div class="msg sys">' + esc(m.t) + '<time>' + esc(m.d) + '</time></div>';
    if (m.kind === 'photos') return '<div class="msg them">' + esc(m.t) + '<div class="msg-photos">' + m.srcs.map(s => '<img src="' + esc(s) + '" alt="Dettaglio" data-action="zoom" data-src="' + esc(s) + '" data-label="' + esc(th.title) + '" referrerpolicy="no-referrer" onerror="this.style.opacity=.3">').join('') + '</div><time>' + esc(m.d) + '</time></div>';
    if (m.kind === 'offer') {
      const mineO = m.from === 'me';
      const cls = m.status==='accepted'?'accepted':m.status==='declined'?'declined':'pending';
      const txt = m.status==='accepted'?'Accettata':m.status==='declined'?'Rifiutata':'In attesa';
      let act = '';
      if (m.status==='pending' && !mineO) act = '<div class="offer-actions"><button class="btn btn-primary btn-sm" data-action="offer-accept" data-id="' + esc(th.id) + '" data-ts="' + m.ts + '">Accetta</button><button class="btn btn-outline btn-sm" data-action="offer-counter" data-id="' + esc(th.id) + '" data-ts="' + m.ts + '">Controfferta</button><button class="btn btn-ghost btn-sm" data-action="offer-decline" data-id="' + esc(th.id) + '" data-ts="' + m.ts + '">Rifiuta</button></div>';
      else if (m.status==='accepted') act = '<div class="offer-actions"><button class="btn btn-brass btn-sm" data-action="checkout-offer" data-sku="' + esc(th.sku) + '" data-amount="' + m.amount + '">' + I.get('card',13) + 'Procedi al pagamento</button></div>';
      return '<div class="offer-card' + (mineO?' mine':'') + '"><div class="offer-head"><span>' + (mineO?'Tua offerta vincolante':'Offerta del venditore') + '</span>' + I.get('euro',13,2) + '</div><div class="offer-body"><div class="offer-amt tabular">' + fmtMoney(m.amount) + '</div><div class="offer-txt">' + esc(m.t) + '</div><span class="offer-state ' + cls + '">' + (m.status==='accepted'?I.get('check',12,2.5):m.status==='declined'?I.get('x',12,2.5):I.get('clock',12,2)) + txt + '</span>' + act + '<time class="xs light" style="display:block;margin-top:8px;text-align:right">' + esc(m.d) + '</time></div></div>';
    }
    return '<div class="msg ' + (m.f==='me'?'me':'them') + '">' + esc(m.t) + '<time>' + esc(m.d) + '</time></div>';
  };
  const viewChat = () => {
    if (!SMAuth.current()) return guardHTML('Messaggistica riservata','Accedere per contattare i venditori e gestire le trattative.');
    const list = SMChat.threads().slice().sort((a,b) => b.updatedAt-a.updatedAt);
    if (!list.length) return '<div class="view"><div class="sec-head"><h2 class="sec-title">Messaggistica</h2></div>' + emptyHTML('chat','Nessuna conversazione','Apri una scheda articolo e seleziona «Chiedi al venditore».','<button class="btn btn-primary" data-action="route" data-route="home">Esplora il catalogo</button>') + '</div>';
    let act = state.route.param ? list.find(t => t.id === state.route.param) : null;
    if (!act) act = list[0];
    SMChat.markRead(act.id);
    const th = list.map(t => {
      const last = t.msgs[t.msgs.length-1];
      const prev = last ? (last.kind==='offer'?'Offerta: '+fmtMoney(last.amount):last.kind==='photos'?'Galleria fotografica':last.t) : 'Nuova conversazione';
      return '<div class="thread' + (t.id===act.id?' on':'') + '" data-action="thread" data-id="' + esc(t.id) + '" role="button" tabindex="0"><img src="' + esc(t.img) + '" alt="" referrerpolicy="no-referrer" onerror="this.style.opacity=.3"><div class="thread-b"><div class="thread-t"><span>@' + esc(t.seller) + '</span><time>' + esc(last?last.d:'') + '</time></div><div class="thread-p">' + esc(t.title) + '</div><div class="thread-p">' + esc(prev) + '</div>' + (t.unread?'<span class="thread-u tabular">'+t.unread+'</span>':'') + '</div></div>';
    }).join('');
    const msgs = act.msgs.map(m => msgHTML(m,act)).join('') + (state.typingThread===act.id?'<div class="typing" id="typingDots"><i></i><i></i><i></i></div>':'');
    return '<div class="view"><div class="sec-head"><h2 class="sec-title">Messaggistica e negoziazione</h2><span class="sec-count">Le conversazioni sono registrate e costituiscono prova in caso di contestazione.</span></div>' +
      '<div class="chat-wrap' + (state.route.param?' in-thread':'') + '"><aside class="chat-list"><div class="chat-list-head">Conversazioni (' + list.length + ')</div>' + th + '</aside>' +
      '<section class="chat-main"><div class="chat-head"><button class="icon-btn chat-back" data-action="chat-back">' + I.get('arrowLeft',18) + '</button><img src="' + esc(act.img) + '" alt="" data-action="item" data-sku="' + esc(act.sku) + '" referrerpolicy="no-referrer" onerror="this.style.opacity=.3"><div style="min-width:0"><div class="ch-t" data-action="item" data-sku="' + esc(act.sku) + '">' + esc(act.title) + '</div><div class="ch-s">@' + esc(act.seller) + ' · trattativa tutelata</div></div><button class="btn btn-outline btn-sm" style="margin-left:auto" data-action="offer" data-sku="' + esc(act.sku) + '">' + I.get('euro',14) + 'Offerta</button></div>' +
      '<div class="msgs" id="msgsBox">' + msgs + '</div><div class="quick-row">' + quick('È ancora disponibile?') + quick('Puoi fare uno sconto?') + quick('Mi invii altre foto?') + quick('Tempi di spedizione?') + quick('Com\u2019è il setup?') + '</div>' +
      '<div class="chat-input"><input id="msgInput" type="text" placeholder="Scrivi un messaggio…" autocomplete="off"><button class="chat-send" data-action="send" data-id="' + esc(act.id) + '">' + I.get('send',17) + '</button></div></section></div></div>';
  };

  /* ---------- preferiti / carrello ---------- */
  const viewFavs = () => {
    if (!SMAuth.current()) return guardHTML('Preferiti riservati','Accedere per salvare articoli e ritrovarli su ogni sessione.');
    const items = allItems().filter(i => favs().includes(i.sku));
    return '<div class="view"><div class="sec-head"><h2 class="sec-title">Articoli salvati</h2><span class="sec-count tabular">' + items.length + ' elementi</span></div><div class="grid">' + (items.length?items.map((it,i)=>cardHTML(it,i)).join(''):emptyHTML('heart','Nessun preferito','Salva gli articoli di interesse con l\u2019icona a cuore.','<button class="btn btn-primary" data-action="route" data-route="home">Esplora il catalogo</button>')) + '</div></div>';
  };
  const viewCart = () => {
    if (!SMAuth.current()) return guardHTML('Carrello riservato','Accedere per gestire il carrello.');
    const items = allItems().filter(i => cart().includes(i.sku) && itemStatus(i)==='available');
    if (!items.length) return '<div class="view"><div class="sec-head"><h2 class="sec-title">Carrello</h2></div>' + emptyHTML('box','Carrello vuoto','Aggiungi articoli dal catalogo per acquistarli.','<button class="btn btn-primary" data-action="route" data-route="home">Esplora il catalogo</button>') + '</div>';
    const sub = items.reduce((s,i)=>s+i.price,0), fe = items.reduce((s,i)=>s+SMData.protectionFee(i.price),0), sh = items.reduce((s,i)=>s+SMData.shipCost(i.size),0);
    return '<div class="view"><div class="sec-head"><h2 class="sec-title">Carrello</h2><span class="sec-count tabular">' + items.length + ' articoli</span></div>' +
      '<div class="search-layout"><div>' + items.map(it => '<div class="order"><img src="' + esc(it.images[0]) + '" alt="" data-action="item" data-sku="' + esc(it.sku) + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(it.category,it.title) + '\'"><div class="order-b"><div class="order-t" data-action="item" data-sku="' + esc(it.sku) + '">' + esc(it.title) + '</div><div class="order-id">' + esc(it.brand) + ' · ' + esc(it.grading) + ' · @' + esc(sName(it.seller)) + '</div></div><div class="order-side"><div class="order-total tabular">' + fmtMoney(it.price) + '</div><button class="btn btn-ghost btn-sm" data-action="remove-cart" data-sku="' + esc(it.sku) + '">' + I.get('trash',13) + 'Rimuovi</button></div></div>').join('') + '</div>' +
      '<aside class="fside"><h3>Riepilogo</h3><div class="price-rows" style="border:none;padding:0;margin:0"><div class="price-row"><span>Subtotale</span><span class="tabular">' + fmtMoney(sub) + '</span></div><div class="price-row"><span>Protezione Acquisti</span><span class="tabular">' + fmtMoney(fe) + '</span></div><div class="price-row"><span>Spedizioni</span><span class="tabular">' + fmtMoney(sh) + '</span></div><div class="price-row total"><span>Totale</span><span class="tabular">' + fmtMoney(sub+fe+sh) + '</span></div></div><button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" data-action="checkout-cart">' + I.get('card',16) + 'Procedi al pagamento</button><div class="xs light" style="margin-top:10px;text-align:center">Ogni articolo ha escrow e tracking dedicati.</div></aside></div></div>';
  };

  /* ---------- vendita ---------- */
  const viewSell = () => {
    if (!SMAuth.current()) return guardHTML('Pubblicazione riservata','Accedere per pubblicare un\u2019inserzione soggetta a verifica.');
    const ed = state.editSku ? findItem(state.editSku) : null, ph = state.sellPhotos;
    return '<div class="view"><div class="sec-head"><h2 class="sec-title">' + (ed?'Modifica inserzione':'Pubblica nuova inserzione') + '</h2><button class="crumb" style="margin:0" data-action="modal" data-modal="grading">' + I.get('info',14) + 'Guida al grading</button></div>' +
      '<div class="form-card"><form id="sellForm" novalidate>' +
      '<div class="form-sec"><div class="form-sec-title">' + I.get('camera',15) + 'Documentazione fotografica</div>' +
      '<div class="dropzone" id="dropZone" data-action="pick-photos" role="button" tabindex="0">' + I.get('image',30) + '<div class="semi sm">Trascina qui le foto oppure clicca per selezionare</div><div class="xs light" style="margin-top:4px">Fino a 6 immagini · JPG/PNG · la prima è la copertina · trascina per riordinare</div><input type="file" id="photoInput" accept="image/*" multiple hidden></div>' +
      '<div class="ph-grid" id="phGrid">' + ph.map((p,k) => '<div class="ph" draggable="true" data-ph="' + k + '"><img src="' + esc(p) + '" alt="Foto ' + (k+1) + '">' + (k===0?'<span class="ph-cover">COPERTINA</span>':'') + '<div class="ph-tools">' + (k>0?'<button type="button" data-action="ph-cover" data-k="' + k + '">' + I.get('star',12) + '</button>':'<span></span>') + '<button type="button" class="del" data-action="ph-remove" data-k="' + k + '">' + I.get('trash',12) + '</button></div></div>').join('') + '</div><div class="f-err hidden" id="phErr"></div></div>' +
      '<div class="form-sec"><div class="form-sec-title">' + I.get('tag',15) + 'Identificazione articolo</div>' +
      '<div class="fg"><label for="sTitle">Titolo inserzione *</label><input class="f-in" id="sTitle" maxlength="90" placeholder="Es. Fender Player Stratocaster MIM 2019" value="' + esc(ed?ed.title:'') + '"><div class="hint">Marca, modello e versione. Massimo 90 caratteri.</div></div>' +
      '<div class="f-row"><div class="fg"><label for="sCat">Categoria *</label><select class="f-sel" id="sCat">' + SMData.CATEGORIES.map(c => '<option' + (ed&&ed.category===c?' selected':'') + '>' + esc(c) + '</option>').join('') + '</select></div><div class="fg"><label for="sBrand">Brand / Etichetta *</label><input class="f-in" id="sBrand" placeholder="Es. Fender, Harvest, Roland" value="' + esc(ed?ed.brand:'') + '"></div></div>' +
      '<div class="f-row-3"><div class="fg"><label for="sGrade">Grading *</label><select class="f-sel" id="sGrade">' + SMData.GRADING.map(g => '<option' + (ed&&ed.grading===g.id?' selected':'') + ' value="' + esc(g.id) + '">' + esc(g.id) + '</option>').join('') + '</select><div class="hint" id="gradeHint">' + esc(SMData.GRADING[0].desc) + '</div></div><div class="fg"><label for="sYear">Anno</label><input class="f-in tabular" id="sYear" type="number" min="1900" max="2026" placeholder="Es. 2019" value="' + esc(ed&&ed.year?ed.year:'') + '"></div><div class="fg"><label for="sSize">Fascia spedizione *</label><select class="f-sel" id="sSize">' + SMData.SIZES.map(s => '<option value="' + s.id + '"' + (ed&&ed.size===s.id?' selected':'') + '>' + esc(s.label) + ' — ' + fmtMoney(s.cost) + '</option>').join('') + '</select></div></div></div>' +
      '<div class="form-sec"><div class="form-sec-title">' + I.get('edit',15) + 'Descrizione tecnica</div><div class="fg"><label for="sDesc">Descrizione *</label><textarea class="f-ta" id="sDesc" maxlength="1200" placeholder="Dettagli costruttivi, setup, difetti dichiarati, accessori…">' + esc(ed?ed.desc:'') + '</textarea><div class="hint">Difetti non dichiarati comportano rimborso integrale in caso di contestazione.</div></div></div>' +
      '<div class="form-sec"><div class="form-sec-title">' + I.get('euro',15) + 'Prezzo e ricavo</div><div class="f-row"><div class="fg"><label for="sPrice">Prezzo di vendita (€) *</label><input class="f-in tabular" id="sPrice" type="number" min="1" step="0.01" placeholder="0,00" value="' + esc(ed?ed.price:'') + '"></div><div class="fg"><label>&nbsp;</label><div class="earn-box"><span>Ricavo netto stimato<br><span class="xs light">al netto della commissione (5%)</span></span><b class="tabular" id="earnOut">—</b></div></div></div></div>' +
      '<div class="f-err hidden" id="sellErr"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="submit" class="btn btn-primary btn-lg" style="flex:1">' + I.get('check',16,2.2) + (ed?'Salva modifiche':'Pubblica inserzione') + '</button>' + (ed?'<button type="button" class="btn btn-ghost btn-lg" data-action="cancel-edit">Annulla</button>':'') + '</div></form></div></div>';
  };

  /* ---------- ordini: card ---------- */
  const miniTrack = (o) => {
    const s = stageOf(o), pct = progressOf(o);
    return '<div class="mini-track"><div class="mt-bar"><i data-tk-bar="' + esc(o.id) + '" style="width:' + pct + '%"></i></div>' +
      '<div class="mt-steps">' + SHIP.map((x,i) => {
        const n = i+1, cls = (s===COMPLETE||n<s)?'done':n===s?'now':'';
        return '<span class="mt-step ' + cls + '" data-tk-ms="' + esc(o.id) + ':' + i + '">' + esc(i===4?(isHome(o)?'A casa':'Al punto'):x.short) + '</span>';
      }).join('') + '</div>' +
      '<div class="mt-next"><span data-tk-next="' + esc(o.id) + '">' + esc(nextHint(o)) + '</span><span class="tabular" data-tk-pct="' + esc(o.id) + '">' + pct + '%</span></div></div>';
  };
  const orderActions = (o) => {
    const s = stageOf(o);
    let h = '<button class="btn btn-primary btn-sm" data-action="track" data-id="' + esc(o.id) + '">' + I.get('truck',13) + 'Traccia spedizione</button>';
    if (s === DELIVERED) h += '<button class="btn btn-brass btn-sm" data-action="confirm-order" data-id="' + esc(o.id) + '">' + I.get('check',13,2.5) + (isHome(o)?'Conferma ricezione':'Conferma ritiro') + '</button>';
    if (s === COMPLETE && !myRev(o.id)) h += '<button class="btn btn-brass btn-sm" data-action="write-rev" data-sku="' + esc(o.sku) + '" data-order="' + esc(o.id) + '">' + I.get('star',13) + 'Scrivi recensione</button>';
    if (s === COMPLETE && myRev(o.id)) h += '<span class="otag done">' + I.get('check',11,3) + 'Recensione pubblicata</span>';
    if (s >= 2 && s <= DELIVERED) h += '<button class="btn btn-outline btn-sm" data-action="dispute" data-id="' + esc(o.id) + '">' + I.get('alert',13,2.2) + 'Contestazione</button>';
    h += '<button class="btn btn-outline btn-sm" data-action="receipt" data-id="' + esc(o.id) + '">' + I.get('printer',13) + 'Ricevuta</button>';
    return h;
  };
  const orderCard = (o) =>
    '<article class="ocard" data-ocard="' + esc(o.id) + '"><div class="oc-main" data-action="track" data-id="' + esc(o.id) + '" role="button" tabindex="0">' +
      '<img src="' + esc(o.img) + '" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(o.category,o.title) + '\'">' +
      '<div class="oc-b"><div class="oc-t">' + esc(o.title) + '</div><div class="oc-id">' + esc(o.id) + ' · ' + esc(fmtDate(o.createdAt)) + ' · ' + esc(o.methodLabel) + '</div>' +
      '<div class="oc-tags" data-tk-badge="' + esc(o.id) + '">' + stageTag(o) + '<span class="otag">' + I.get('truck',11,2.2) + esc(o.tracking) + '</span></div></div>' +
      '<div class="oc-side"><div class="oc-total tabular">' + fmtMoney(o.total) + '</div><span class="xs light">Tracking live ›</span></div></div>' +
      miniTrack(o) + '<div class="oc-actions" data-tk-act="' + esc(o.id) + '">' + orderActions(o) + '</div></article>';
  const filterOrders = (l) => {
    const f = state.acqFilter;
    if (f==='corso') return l.filter(o => { const s = stageOf(o); return s>=1 && s<DELIVERED; });
    if (f==='consegnati') return l.filter(o => stageOf(o)===DELIVERED);
    if (f==='completati') return l.filter(o => stageOf(o)===COMPLETE);
    if (f==='rimborsi') return l.filter(o => [REFUND,DISPUTE].includes(stageOf(o)));
    return l;
  };
  const ordersBlock = () => {
    const all = orders().slice().sort((a,b) => b.createdAt-a.createdAt);
    if (!all.length) return emptyHTML('box','Nessun acquisto','Gli articoli pagati compaiono qui con tracking live, ricevuta e stato escrow.','<button class="btn btn-primary" data-action="route" data-route="home">Esplora il catalogo</button>');
    const list = filterOrders(all);
    const chip = (id,l,n) => '<button class="f-chip' + (state.acqFilter===id?' on':'') + '" data-action="acq-filter" data-f="' + id + '">' + l + '<span class="tabular" data-acq-n="' + id + '" style="opacity:.7">' + n + '</span></button>';
    const cnt = (fn) => all.filter(fn).length;
    return '<div class="filters">' + chip('tutti','Tutti',all.length) +
      chip('corso','In viaggio',cnt(o=>{const s=stageOf(o);return s>=1&&s<DELIVERED;})) +
      chip('consegnati','Da confermare',cnt(o=>stageOf(o)===DELIVERED)) +
      chip('completati','Completati',cnt(o=>stageOf(o)===COMPLETE)) +
      chip('rimborsi','Contestazioni',cnt(o=>[REFUND,DISPUTE].includes(stageOf(o)))) + '</div>' +
      '<div class="olist">' + (list.length?list.map(orderCard).join(''):emptyHTML('filter','Nessun ordine in questo stato','Cambia filtro per vedere gli altri ordini.')) + '</div>';
  };
  const viewAcquisti = () => {
    if (!SMAuth.current()) return guardHTML('Spedizioni e acquisti','Accedere per visualizzare tracking, ricevute e stato escrow.');
    const all = orders();
    const live = all.filter(o => { const s = stageOf(o); return s>=1 && s<=DELIVERED; }).length;
    const done = all.filter(o => stageOf(o)===COMPLETE).length;
    const ref = all.filter(o => stageOf(o)===REFUND).length;
    const spent = all.filter(o => !o.refundedAt).reduce((s,o)=>s+o.total,0);
    const jp = state.justPaid ? all.find(o => o.id === state.justPaid) : null;
    return '<div class="view">' +
      (jp ? '<div class="paid-banner"><span class="pb-ico">' + I.get('check',24,3) + '</span><div><h3>Pagamento confermato</h3><p>' + esc(jp.title) + ' · ' + esc(jp.methodLabel) + ' · ricevuta <b>' + esc(jp.payment.receipt) + '</b></p><div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" data-action="track" data-id="' + esc(jp.id) + '">' + I.get('truck',13) + 'Traccia la spedizione</button><button class="btn btn-outline btn-sm" data-action="receipt" data-id="' + esc(jp.id) + '">' + I.get('printer',13) + 'Ricevuta</button></div></div><div class="pb-amt"><b class="tabular">' + fmtMoney(jp.total) + '</b><span class="xs muted">vincolati in escrow</span></div></div>' : '') +
      '<div class="sec-head"><h2 class="sec-title">Spedizioni e acquisti</h2><span class="sec-count">Tracking aggiornato in tempo reale, senza ricaricare la pagina.</span></div>' +
      '<div class="acq-stats"><div class="acq-stat a"><span>In viaggio</span><b class="tabular" data-acq-stat="live">' + live + '</b></div><div class="acq-stat b"><span>Completati</span><b class="tabular" data-acq-stat="done">' + done + '</b></div><div class="acq-stat c"><span>Rimborsati</span><b class="tabular" data-acq-stat="ref">' + ref + '</b></div><div class="acq-stat d"><span>Totale speso</span><b class="tabular">' + fmtMoney(spent) + '</b></div></div>' + ordersBlock() + '</div>';
  };

  /* ---------- pagina tracking dedicata ---------- */
  const viewTrack = () => {
    if (!SMAuth.current()) return guardHTML('Tracking riservato','Accedere per visualizzare la spedizione.');
    const o = orders().find(x => x.id === state.route.param);
    if (!o) return '<div class="view">' + emptyHTML('alert','Ordine non trovato','L\u2019ordine non esiste o è stato rimosso.','<button class="btn btn-primary" data-action="route" data-route="acquisti">I miei acquisti</button>') + '</div>';
    const s = stageOf(o), pct = progressOf(o), pos = routePos(o);
    const cour = (o.payment && o.payment.courier) || 'BRT';
    const p = pkg(o), it = findItem(o.sku);
    const nodes = SHIP.map((x,i) => {
      const n = i+1, cls = (s===COMPLETE||n<s)?'done':n===s?'now':'';
      const icon = ['box','truck','refresh','pin','check'][i];
      return '<div class="tr-node ' + cls + '" data-tk-node="' + esc(o.id) + ':' + i + '"><span class="tr-dot">' + I.get(icon,15,2) + '</span><span>' + esc(i===4?(isHome(o)?'A casa':'Al punto ritiro'):x.short) + '</span></div>';
    }).join('');
    const events = SHIP.map((x,i) => {
      const n = i+1, done = (s===COMPLETE||n<s), now = n===s && s!==COMPLETE;
      const cls = done?'done':now?'now':'pending';
      const reached = done||now;
      return '<div class="tl-ev ' + cls + '" data-tk-ev="' + esc(o.id) + ':' + i + '"><div class="tl-rail"><span class="tl-dot">' + (done?I.get('check',12,3):'') + '</span><span class="tl-line"></span></div>' +
        '<div class="tl-body"><div class="tl-t">' + esc(shipLabel(o,i)) + (now?'<span class="tl-badge">IN CORSO</span>':'') + '</div>' +
        '<div class="tl-d">' + esc(shipDesc(o,i)) + '</div>' +
        '<div class="tl-meta"><span>' + I.get('pin',11) + esc(shipPlace(o,i)) + '</span><span data-tk-time="' + esc(o.id) + ':' + i + '">' + (reached ? I.get('clock',11) + esc(fmtDateTime(shipTime(o,i))) : I.get('clock',11) + 'in attesa') + '</span></div></div></div>';
    }).join('');
    const finalEv = '<div class="tl-ev ' + (s===COMPLETE?'done':'pending') + '" data-tk-ev="' + esc(o.id) + ':5"><div class="tl-rail"><span class="tl-dot">' + (s===COMPLETE?I.get('check',12,3):'') + '</span><span class="tl-line"></span></div>' +
      '<div class="tl-body"><div class="tl-t">Transazione completata</div><div class="tl-d">Ricezione confermata dall\u2019acquirente. Fondi sbloccati al venditore, recensione abilitata.</div>' +
      '<div class="tl-meta"><span data-tk-time="' + esc(o.id) + ':5">' + (o.confirmedAt ? I.get('clock',11) + esc(fmtDateTime(o.confirmedAt)) : I.get('clock',11) + 'in attesa di conferma') + '</span></div></div></div>';
    return '<div class="view"><button class="crumb" data-action="route" data-route="acquisti">' + I.get('arrowLeft',15,2) + 'Spedizioni e acquisti</button>' +
      '<section class="track-hero"><div class="th-top"><div class="th-courier"><span class="th-logo">' + I.get('truck',22,1.8) + '</span><div><b>' + esc(cour) + '</b><span>Spedizione assicurata · fino a € 3.000</span></div></div>' +
      '<div class="th-num"><div class="lbl">Codice di tracciamento</div><div class="val"><span>' + esc(o.tracking) + '</span><button data-action="copy-track" data-track="' + esc(o.tracking) + '" aria-label="Copia">' + I.get('share',13,2) + '</button></div></div></div>' +
      '<div class="th-state"><span class="live-dot" data-tk-live="' + esc(o.id) + '"></span><h2 data-tk-state="' + esc(o.id) + '">' + esc(s===COMPLETE?'Transazione completata':s===REFUND?'Ordine rimborsato':s===DISPUTE?'Contestazione in corso':shipLabel(o,s-1)) + '</h2></div>' +
      '<div class="th-sub" data-tk-sub="' + esc(o.id) + '">' + esc(s===COMPLETE?'Fondi sbloccati al venditore. Puoi lasciare una recensione.':s===REFUND?'Importo rimborsato sul metodo di pagamento originale.':s===DISPUTE?'Fondi bloccati in escrow fino all\u2019esito della verifica.':shipDesc(o,s-1)) + '</div>' +
      '<div class="th-upd" data-tk-upd="' + esc(o.id) + '">Ultimo aggiornamento: adesso</div>' +
      '<div class="track-route"><div class="tr-line"></div><div class="tr-fill" data-tk-fill="' + esc(o.id) + '" style="width:' + pos + '%"></div>' +
      '<div class="tr-truck" data-tk-truck="' + esc(o.id) + '" style="left:' + pos + '%">' + I.get('truck',24,2) + '</div>' +
      '<div class="tr-nodes">' + nodes + '</div></div></section>' +
      '<div class="track-grid"><div class="track-log"><div class="block-title" style="display:flex;align-items:center;gap:7px">' + I.get('clock',14) + 'Cronologia della spedizione</div>' + events + finalEv + '</div>' +
      '<aside class="track-side"><div class="tk-eta"><div class="lbl">Consegna stimata</div><b>' + esc(fmtDate(etaOf(o))) + '</b><div class="sub" data-tk-next="' + esc(o.id) + '">' + esc(nextHint(o)) + '</div><div class="tk-prog"><i data-tk-bar="' + esc(o.id) + '" style="width:' + pct + '%"></i></div><div class="xs muted tabular" style="margin-top:6px;text-align:right" data-tk-pct="' + esc(o.id) + '">' + pct + '%</div></div>' +
      '<div class="tk-card"><div class="tk-card-h">' + I.get('box',12,2.2) + 'Pacco</div><div class="tk-card-b">' +
      '<div class="tk-r"><span>Corriere</span><span>' + esc(cour) + '</span></div><div class="tk-r"><span>Peso</span><span>' + esc(p.w) + '</span></div>' +
      '<div class="tk-r"><span>Dimensioni</span><span>' + esc(p.d) + '</span></div><div class="tk-r"><span>Valore assicurato</span><span>' + fmtMoney(o.total) + '</span></div>' +
      '<div class="tk-r"><span>Modalità</span><span>' + esc(o.shipLabel) + '</span></div><div class="tk-r"><span>Destinazione</span><span>' + esc(shipPlace(o,4)) + '</span></div></div></div>' +
      '<div class="tk-card"><div class="tk-card-h">' + I.get('tag',12,2.2) + 'Articolo</div><div class="tk-item">' +
      (it ? imgTag(it.images[0], it, 'data-action="item" data-sku="' + esc(it.sku) + '"') : '<img src="' + esc(o.img) + '" alt="">') +
      '<div style="min-width:0"><div class="t"' + (it?' data-action="item" data-sku="' + esc(it.sku) + '"':'') + '>' + esc(o.title) + '</div><div class="xs muted" style="margin-top:3px">@' + esc(o.sellerName) + '</div><div class="semi sm tabular" style="margin-top:5px">' + fmtMoney(o.total) + '</div></div></div></div>' +
      '<div class="tk-card"><div class="tk-card-h">' + I.get('lock',12,2.2) + 'Deposito escrow</div><div class="tk-card-b">' +
      '<div class="tk-r"><span>Stato fondi</span><span data-tk-escrow="' + esc(o.id) + '" style="color:' + (o.refundedAt?'var(--danger)':o.confirmedAt?'var(--success)':'var(--warning)') + '">' + (o.refundedAt?'Rimborsati':o.confirmedAt?'Sbloccati':'Vincolati') + '</span></div>' +
      '<div class="tk-r"><span>PaymentIntent</span><span>' + esc(o.payment.id) + '</span></div><div class="tk-r"><span>Metodo</span><span>' + esc(o.methodLabel) + '</span></div>' +
      '<div class="tk-r"><span>Contestazione entro</span><span>' + esc(fmtDate(etaOf(o)+2*86400000)) + '</span></div></div></div>' +
      '<div class="tk-actions" data-tk-act="' + esc(o.id) + '">' + orderActions(o) + '</div></aside></div></div>';
  };

  /* ---------- profilo ---------- */
  const profTab = (id,l,n,icon) => '<button class="tab' + (state.profTab===id?' on':'') + '" data-action="prof-tab" data-tab="' + id + '">' + I.get(icon,15) + l + (n!=null?'<span class="n tabular">'+n+'</span>':'') + '</button>';
  const viewProfile = () => {
    const u = SMAuth.current();
    if (!u) return guardHTML('Dashboard venditore','Accedere per gestire inserzioni, portafoglio, recensioni e ordini.');
    if (state.route.query.tab) state.profTab = state.route.query.tab;
    const full = SMAuth.fullUser() || u;
    const mine = userItems().filter(i => i.sellerEmail === u.email);
    const my = orders(), w = wallet();
    const sold = mine.filter(i => itemStatus(i)==='sold').length;
    const myRevs = reviews().filter(r => r.userId === u.id);
    const earned = my.filter(o => o.confirmedAt).reduce((s,o)=>s+o.amount,0);
    let body = '';
    if (state.profTab === 'annunci') {
      body = '<div class="grid">' + (mine.length?mine.map((it,i)=>cardHTML(it,i)).join(''):emptyHTML('box','Nessuna inserzione','Pubblica il primo articolo: bastano foto reali, grading dichiarato e prezzo.','<button class="btn btn-brass" data-action="route" data-route="vendi">' + I.get('plus',15,2.2) + 'Pubblica ora</button>')) + '</div>';
    } else if (state.profTab === 'ordini') {
      body = ordersBlock();
    } else if (state.profTab === 'recensioni') {
      const received = reviews().filter(r => mine.some(i => i.sku === r.sku));
      body = '<div class="sec-head" style="margin-top:0"><h2 class="sec-title" style="font-size:1.1rem">Recensioni scritte</h2><span class="sec-count tabular">' + myRevs.length + '</span></div>' +
        (myRevs.length ? myRevs.sort((a,b)=>b.at-a.at).map(r => {
          const it = findItem(r.sku);
          return '<div class="rev-card"><div class="rev-head"><div><div class="rv-name">' + esc(it?it.title:r.sku) + '</div><div class="xs light">' + I.stars(r.rating) + '</div></div><span class="rev-verified">' + I.get('verified',11,2) + 'Verificato</span><span class="rv-date">' + esc(fmtDate(r.at)) + '</span></div>' +
            (r.title?'<div class="rev-title">' + esc(r.title) + '</div>':'') + '<p class="rev-text">' + esc(r.text) + '</p>' +
            '<div class="rev-foot"><button class="btn btn-outline btn-sm" data-action="rev-edit" data-id="' + esc(r.id) + '">' + I.get('edit',13) + 'Modifica</button><button class="btn btn-ghost btn-sm" data-action="rev-del" data-id="' + esc(r.id) + '">' + I.get('trash',13) + 'Elimina</button>' + (it?'<button class="btn btn-ghost btn-sm" data-action="item" data-sku="' + esc(it.sku) + '">' + I.get('eye',13) + 'Vedi articolo</button>':'') + '</div></div>';
        }).join('') : emptyHTML('star','Nessuna recensione scritta','Dopo aver ricevuto un articolo puoi pubblicare una recensione verificata.','<button class="btn btn-primary" data-action="route" data-route="acquisti">I miei acquisti</button>')) +
        '<div class="sec-head"><h2 class="sec-title" style="font-size:1.1rem">Recensioni ricevute</h2><span class="sec-count tabular">' + received.length + '</span></div>' +
        (received.length ? received.sort((a,b)=>b.at-a.at).map(r => revCard(r,true,u)).join('') : '<div class="rev-empty">' + I.get('star',22) + '<p class="sm" style="margin-top:8px">Non hai ancora ricevuto recensioni sui tuoi annunci.</p></div>');
    } else if (state.profTab === 'wallet') {
      const movs = (w.movements||[]).slice().sort((a,b)=>b.at-a.at);
      body = '<div class="wallet-grid"><div class="wallet-card free"><span>Saldo disponibile</span><b class="tabular">' + fmtMoney(w.available||0) + '</b><p class="xs muted" style="margin-top:6px">Fondi sbloccati e trasferibili su IBAN.</p></div><div class="wallet-card held"><span>Saldo in sospeso</span><b class="tabular">' + fmtMoney(w.pending||0) + '</b><p class="xs muted" style="margin-top:6px">Importi in escrow in attesa di conferma.</p></div></div>' +
        '<div class="iban-box"><div class="block-title" style="display:flex;align-items:center;gap:7px">' + I.get('bank',14) + 'Trasferisci su IBAN</div><div class="iban-row"><div class="fg"><label>IBAN di destinazione</label><input class="f-in tabular" id="withdrawIban" placeholder="IT60 X054 2811 1010 0000 0123 456" value="' + esc(full.iban?SMU.fmtIban(full.iban):'') + '"></div><div class="fg" style="max-width:140px"><label>Importo (€)</label><input class="f-in tabular" id="withdrawAmt" type="number" min="1" step="0.01" value="' + (w.available||0) + '"></div><button class="btn btn-primary" data-action="withdraw" style="height:44px">' + I.get('arrowRight',15) + 'Trasferisci</button></div><div class="xs light" style="margin-top:8px">Bonifico SEPA · accredito 1–2 giorni lavorativi.</div></div>' +
        '<div class="block-title" style="margin-top:22px">Storico movimenti</div>' +
        (movs.length?movs.map(m => '<div class="mov"><div><div class="m-t">' + esc(m.label) + '</div><div class="m-d">' + esc(fmtDateTime(m.at)) + ' · ' + esc(m.ref||'') + '</div></div><div class="m-a ' + (m.amount<0?'neg':'pos') + ' tabular">' + (m.amount<0?'−':'+') + fmtMoney(Math.abs(m.amount)) + '</div></div>').join(''):'<p class="sm muted">Nessun movimento registrato.</p>');
    } else {
      body = '<div class="wallet-grid"><div class="wallet-card free"><span>Ricavi totali</span><b class="tabular">' + fmtMoney(earned) + '</b></div><div class="wallet-card held"><span>Annunci attivi</span><b class="tabular">' + mine.length + '</b></div></div>' +
        '<div class="block-title">Account</div><table class="spec-table"><tr><td>Nome</td><td>' + esc(full.name) + '</td></tr><tr><td>Email</td><td>' + esc(full.email) + '</td></tr><tr><td>Città</td><td>' + esc(full.city||'Milano') + '</td></tr><tr><td>IBAN</td><td class="tabular">' + esc(full.iban?SMU.maskIban(full.iban):'Non configurato') + '</td></tr><tr><td>Stato</td><td>' + (full.verified?'<span style="color:var(--success)">Verificato</span>':'Standard') + '</td></tr><tr><td>Iscrizione</td><td>' + esc(fmtDate(full.joined)) + '</td></tr></table>' +
        '<button class="btn btn-outline btn-block" style="margin-top:16px" data-action="account-settings">' + I.get('settings',15) + 'Impostazioni account</button>';
    }
    return '<div class="view"><div class="prof-head">' + SMAuth.avatarHTML(full,'avatar-lg') + '<div><h2>' + esc(u.name) + '</h2><p>' + esc(u.email) + ' · ' + (full.verified?'venditore verificato':'account standard') + '</p></div>' +
      '<div class="prof-stats"><div class="pstat"><b class="tabular">' + mine.length + '</b><span>Annunci</span></div><div class="pstat"><b class="tabular">' + sold + '</b><span>Venduti</span></div><div class="pstat"><b class="tabular">' + myRevs.length + '</b><span>Recensioni</span></div><div class="pstat"><b class="tabular">' + fmtMoney(w.available||0) + '</b><span>Saldo</span></div></div></div>' +
      '<div class="tabs">' + profTab('annunci','I miei annunci',mine.length,'tag') + profTab('ordini','Acquisti',my.length,'truck') + profTab('recensioni','Recensioni',myRevs.length,'star') + profTab('wallet','Portafoglio',null,'wallet') + profTab('account','Account',null,'settings') + '</div>' + body + '</div>';
  };

  /* ---------- drawer ---------- */
  const renderDrawer = () => {
    const root = $('#drawerRoot'); if (!root) return;
    const o = orders().find(x => x.id === state.drawerOrder);
    if (!o) { root.innerHTML = ''; return; }
    const s = stageOf(o), p = o.payment;
    const tl = SHIP.map((x,i) => {
      const n = i+1, cls = (s===COMPLETE||n<s)?'done':n===s?'now':'';
      const reached = cls==='done'||cls==='now';
      return '<div class="tl-ev ' + cls + '" data-tk-ev="' + esc(o.id) + ':' + i + '"><div class="tl-rail"><span class="tl-dot">' + (cls==='done'?I.get('check',10,3):'') + '</span><span class="tl-line"></span></div><div class="tl-body"><div class="tl-t">' + esc(shipLabel(o,i)) + '</div><div class="tl-d">' + esc(shipPlace(o,i)) + '</div><div class="tl-meta"><span data-tk-time="' + esc(o.id) + ':' + i + '">' + (reached?esc(fmtDateTime(shipTime(o,i))):'in attesa') + '</span></div></div></div>';
    }).join('');
    root.innerHTML = '<div class="drawer-scrim" data-action="drawer-close"></div><aside class="drawer" role="dialog" aria-label="Dettaglio ordine">' +
      '<div class="dw-head"><div style="flex:1"><h3>Ordine ' + esc(o.id) + '</h3><div class="xs">' + esc(fmtDateTime(o.createdAt)) + '</div></div><button class="icon-btn" data-action="drawer-close">' + I.get('x',18,2) + '</button></div>' +
      '<div class="dw-body"><div class="dw-item"><img src="' + esc(o.img) + '" alt="" data-action="item" data-sku="' + esc(o.sku) + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + SMData.art(o.category,o.title) + '\'"><div><div class="di-t" data-action="item" data-sku="' + esc(o.sku) + '">' + esc(o.title) + '</div><div class="xs muted" style="margin-top:3px">' + esc(o.category) + '</div><div style="margin-top:7px" data-tk-badge="' + esc(o.id) + '">' + stageTag(o) + '</div></div></div>' +
      (o.refundedAt?'<div class="refund-note">' + I.get('refresh',15) + '<span>Rimborso di ' + fmtMoney(o.total) + ' disposto il ' + esc(fmtDate(o.refundedAt)) + '.</span></div>':'') +
      (o.dispute&&!o.refundedAt?'<div class="refund-note">' + I.get('alert',15) + '<span>Contestazione: ' + esc(o.dispute.reasonLabel) + '. Fondi bloccati.</span></div>':'') +
      '<div class="dw-sec"><div class="dw-sec-h">' + I.get('truck',12,2.2) + 'Spedizione</div><div class="dw-sec-b">' + tl + '</div></div>' +
      '<div class="dw-sec"><div class="dw-sec-h">' + I.get('card',12,2.2) + 'Pagamento</div><div class="dw-sec-b">' +
      '<div class="dw-r"><span>Metodo</span><span>' + esc(SMPay.methodLabel(p)) + '</span></div><div class="dw-r"><span>PaymentIntent</span><span>' + esc(p.id) + '</span></div>' +
      '<div class="dw-r"><span>Ricevuta</span><span>' + esc(p.receipt) + '</span></div><div class="dw-r"><span>Articolo</span><span>' + fmtMoney(o.amount) + '</span></div>' +
      '<div class="dw-r"><span>Protezione</span><span>' + fmtMoney(o.fee) + '</span></div><div class="dw-r"><span>Spedizione</span><span>' + fmtMoney(o.ship) + '</span></div>' +
      '<div class="dw-r" style="border-top:1px solid var(--border);padding-top:8px"><span><b>Totale</b></span><span style="color:var(--petrol-800);font-size:1.05rem">' + fmtMoney(o.total) + '</span></div></div></div></div>' +
      '<div class="dw-foot" data-tk-act="' + esc(o.id) + '">' + orderActions(o) + '</div></aside>';
    I.hydrate(root);
  };
  const openOrder = (id) => { state.drawerOrder = id; renderDrawer(); };
  const closeDrawer = () => { state.drawerOrder = null; const r = $('#drawerRoot'); if (r) r.innerHTML = ''; };

  /* ---------- render ---------- */
  const renderMain = () => {
    const r = state.route; let html;
    if (r.name==='cerca') html = viewSearch();
    else if (r.name==='articolo') html = viewItem();
    else if (r.name==='chat') html = viewChat();
    else if (r.name==='preferiti') html = viewFavs();
    else if (r.name==='carrello') html = viewCart();
    else if (r.name==='vendi') html = viewSell();
    else if (r.name==='acquisti') html = viewAcquisti();
    else if (r.name==='spedizione') html = viewTrack();
    else if (r.name==='profilo') html = viewProfile();
    else html = viewHome();
    $('#app').innerHTML = html;
    I.hydrate($('#app'));
    afterRender();
  };
  const renderAll = () => { renderHeader(); renderCats(); renderMain(); if (state.drawerOrder) renderDrawer(); };
  const afterRender = () => {
    if (state.route.name==='chat') { const b=$('#msgsBox'); if(b) b.scrollTop=b.scrollHeight; const i=$('#msgInput'); if(i&&state.route.param) i.focus(); }
    if (state.route.name==='vendi') { updateEarn(); const gh=$('#gradeHint'), gs=$('#sGrade'); if(gs&&gh){const g=SMData.GRADING.find(x=>x.id===gs.value); gh.textContent=g?g.desc:'';} bindDrop(); bindDnd(); }
    if (state.route.name==='articolo') {
      const it = findItem(state.route.param);
      if (it) { renderChart(it); const w=$('#scWave'); if(w&&!w.children.length){for(let i=0;i<48;i++){const b=document.createElement('i');b.style.height=(20+Math.abs(Math.sin(i*.7)*28))+'px';w.appendChild(b);}} }
    }
    lastStage.clear();
    orders().forEach(o => lastStage.set(o.id, stageOf(o)));
    tickNow = 0;
  };

  /* ---------- ticker fluido: patch, mai re-render ---------- */
  const lastStage = new Map();
  let rafId = null, lastText = 0, tickNow = 0;
  const patchOrder = (o, stageChanged) => {
    const id = o.id, s = stageOf(o), pct = progressOf(o), pos = routePos(o);
    $$('[data-tk-bar="' + id + '"]').forEach(e => e.style.width = pct + '%');
    $$('[data-tk-fill="' + id + '"]').forEach(e => e.style.width = pos + '%');
    $$('[data-tk-truck="' + id + '"]').forEach(e => e.style.left = pos + '%');
    $$('[data-tk-pct="' + id + '"]').forEach(e => e.textContent = pct + '%');
    $$('[data-tk-next="' + id + '"]').forEach(e => e.textContent = nextHint(o));
    const secs = Math.floor((Date.now() - (o.createdAt + SHIP[Math.min(s-1,4)].at)) / 1000);
    $$('[data-tk-upd="' + id + '"]').forEach(e => e.textContent = 'Ultimo aggiornamento: ' + (secs < 2 ? 'adesso' : secs + ' secondi fa'));
    if (!stageChanged) return;
    $$('[data-tk-state="' + id + '"]').forEach(e => e.textContent = s===COMPLETE?'Transazione completata':s===REFUND?'Ordine rimborsato':s===DISPUTE?'Contestazione in corso':shipLabel(o,s-1));
    $$('[data-tk-sub="' + id + '"]').forEach(e => e.textContent = s===COMPLETE?'Fondi sbloccati al venditore. Puoi lasciare una recensione.':s===REFUND?'Importo rimborsato sul metodo originale.':s===DISPUTE?'Fondi bloccati in escrow fino all\u2019esito.':shipDesc(o,s-1));
    $$('[data-tk-escrow="' + id + '"]').forEach(e => { e.textContent = o.refundedAt?'Rimborsati':o.confirmedAt?'Sbloccati':'Vincolati'; e.style.color = o.refundedAt?'var(--danger)':o.confirmedAt?'var(--success)':'var(--warning)'; });
    $$('[data-tk-badge="' + id + '"]').forEach(e => {
      const keep = e.querySelector('.otag:last-child');
      e.innerHTML = stageTag(o) + (e.closest('.oc-tags') && keep ? '<span class="otag">' + I.get('truck',11,2.2) + esc(o.tracking) + '</span>' : '');
    });
    $$('[data-tk-act="' + id + '"]').forEach(e => { e.innerHTML = orderActions(o); I.hydrate(e); });
    for (let i = 0; i < 6; i++) {
      const n = i+1, done = (s===COMPLETE||n<s), now = n===s && s!==COMPLETE;
      const cls = done?'done':now?'now':'pending';
      $$('[data-tk-ev="' + id + ':' + i + '"]').forEach(e => {
        if (e.className.indexOf(cls) >= 0 && !now) return;
        e.className = 'tl-ev ' + cls;
        const dot = e.querySelector('.tl-dot'); if (dot) dot.innerHTML = done?I.get('check',12,3):'';
        const t = e.querySelector('.tl-t');
        if (t && i < 5) t.innerHTML = esc(shipLabel(o,i)) + (now?'<span class="tl-badge">IN CORSO</span>':'');
        const tm = e.querySelector('[data-tk-time]');
        if (tm) tm.innerHTML = i===5
          ? (o.confirmedAt ? I.get('clock',11) + esc(fmtDateTime(o.confirmedAt)) : I.get('clock',11) + 'in attesa di conferma')
          : ((done||now) ? I.get('clock',11) + esc(fmtDateTime(shipTime(o,i))) : I.get('clock',11) + 'in attesa');
      });
      $$('[data-tk-node="' + id + ':' + i + '"]').forEach(e => e.className = 'tr-node ' + (done?'done':now?'now':''));
      $$('[data-tk-ms="' + id + ':' + i + '"]').forEach(e => e.className = 'mt-step ' + (done?'done':now?'now':''));
    }
    const card = SMU.$('[data-ocard="' + id + '"]');
    if (card) { card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
    if (s === DELIVERED) SMU.toast((isHome(o)?'Pacco consegnato a casa':'Pacco disponibile al punto di ritiro') + ' · ' + o.title, { type:'success', duration:5000 });
    else if (s > 1 && s < DELIVERED) SMU.toast('Spedizione aggiornata: ' + SHIP[s-1].label.toLowerCase() + ' · ' + o.tracking, { type:'info' });
  };
  const patchCounts = () => {
    const all = orders();
    const c = (fn) => all.filter(fn).length;
    const map = { tutti:all.length, corso:c(o=>{const s=stageOf(o);return s>=1&&s<DELIVERED;}), consegnati:c(o=>stageOf(o)===DELIVERED), completati:c(o=>stageOf(o)===COMPLETE), rimborsi:c(o=>[REFUND,DISPUTE].includes(stageOf(o))) };
    Object.keys(map).forEach(k => $$('[data-acq-n="' + k + '"]').forEach(e => e.textContent = map[k]));
    const st = { live:c(o=>{const s=stageOf(o);return s>=1&&s<=DELIVERED;}), done:c(o=>stageOf(o)===COMPLETE), ref:c(o=>stageOf(o)===REFUND) };
    Object.keys(st).forEach(k => $$('[data-acq-stat="' + k + '"]').forEach(e => e.textContent = st[k]));
    const hd = SMU.$('[data-hdr-orders]'); if (hd) hd.textContent = activeOrders();
  };
  const loop = (ts) => {
    rafId = requestAnimationFrame(loop);
    if (document.hidden) return;
    const l = orders().filter(o => !o.confirmedAt && !o.refundedAt);
    if (!l.length) return;
    let changed = false;
    l.forEach(o => {
      const s = stageOf(o), prev = lastStage.get(o.id);
      const ch = prev !== undefined && prev !== s;
      if (ch) { lastStage.set(o.id, s); changed = true; }
      const pos = routePos(o);
      $$('[data-tk-truck="' + o.id + '"]').forEach(e => e.style.left = pos + '%');
      $$('[data-tk-fill="' + o.id + '"]').forEach(e => e.style.width = pos + '%');
      if (ch) patchOrder(o, true);
      if (o.dispute && Date.now() - o.dispute.at > 9000) resolveDispute(o.id);
    });
    if (ts - lastText > 500) { lastText = ts; l.forEach(o => patchOrder(o, false)); if (changed) patchCounts(); }
  };

  /* ---------- suggerimenti ---------- */
  const renderSuggest = (q) => {
    const box = $('#suggestBox'); if (!box) return;
    if (!q || q.length < 2) { box.innerHTML = ''; return; }
    const ql = q.toLowerCase();
    const m = allItems().filter(i => (i.title+' '+i.brand+' '+i.category).toLowerCase().includes(ql)).slice(0,6);
    const cm = SMData.CATEGORIES.filter(c => c.toLowerCase().includes(ql)).slice(0,2);
    if (!m.length && !cm.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="suggest"><div class="suggest-head">Suggerimenti</div>' +
      cm.map(c => '<button class="suggest-item" data-action="cat" data-cat="' + esc(c) + '">' + I.catIcon(c,18) + '<span><span class="si-t">' + esc(c) + '</span><br><span class="si-m">Categoria</span></span></button>').join('') +
      m.map(i => '<button class="suggest-item" data-action="item" data-sku="' + esc(i.sku) + '"><img src="' + esc(i.images[0]) + '" alt="" referrerpolicy="no-referrer" onerror="this.style.opacity=.3"><span style="min-width:0"><span class="si-t">' + esc(i.title) + '</span><br><span class="si-m">' + esc(i.brand) + ' · ' + esc(i.grading) + '</span></span><span class="si-p tabular">' + fmtMoney(i.price) + '</span></button>').join('') +
      '<button class="suggest-item" data-action="search-go" data-q="' + esc(q) + '">' + I.get('search',17) + '<span class="si-t">Vedi tutti i risultati per «' + esc(q) + '»</span></button></div>';
    I.hydrate(box);
  };
  const closeSuggest = () => { const b = $('#suggestBox'); if (b) b.innerHTML = ''; };

  /* ---------- azioni ---------- */
  const toggleFav = (sku, btn) => {
    if (!SMAuth.requireUser('Accedere per salvare nei preferiti.')) return;
    let l = favs(); const on = l.includes(sku);
    l = on ? l.filter(s=>s!==sku) : [...l, sku]; saveFavs(l);
    SMU.toast(on?'Rimosso dai preferiti.':'Articolo salvato nei preferiti.', { type:on?'info':'success' });
    if (btn && btn.classList.contains('fav-btn')) { btn.classList.toggle('on',!on); btn.classList.add('pop'); btn.innerHTML = I.heart(!on,16); setTimeout(()=>btn.classList.remove('pop'),400); renderHeader(); }
    else renderAll();
  };
  const addCart = (sku) => {
    if (!SMAuth.requireUser('Accedere per usare il carrello.')) return;
    const c = cart();
    if (c.includes(sku)) { SMU.toast('Articolo già nel carrello.', { type:'info' }); navigate('carrello'); return; }
    c.push(sku); saveCart(c); SMU.toast('Aggiunto al carrello.', { type:'success' }); renderAll();
  };
  const bindDrop = () => {
    const dz = $('#dropZone'), inp = $('#photoInput'); if (!dz||!inp) return;
    inp.addEventListener('change', () => { addPhotos(Array.from(inp.files)); inp.value=''; });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); addPhotos(Array.from(e.dataTransfer.files)); });
  };
  const addPhotos = async (files) => {
    const err = $('#phErr'), imgs = files.filter(f => /^image\//.test(f.type));
    if (!imgs.length) { if(err){err.textContent='Selezionare file immagine JPG o PNG.';err.classList.remove('hidden');} return; }
    const room = 6 - state.sellPhotos.length;
    if (room <= 0) { SMU.toast('Limite di 6 foto raggiunto.', { type:'warning' }); return; }
    if (imgs.length > room) SMU.toast('Verranno caricate ' + room + ' foto (limite 6).', { type:'warning' });
    for (const f of imgs.slice(0,room)) { try { state.sellPhotos.push(await SMU.compressImage(f)); } catch(e) { SMU.toast(e.message,{type:'error'}); } }
    if (err) err.classList.add('hidden');
    renderMain(); SMU.toast(state.sellPhotos.length + ' foto pronte.', { type:'success' });
  };
  const bindDnd = () => {
    const g = $('#phGrid'); if (!g) return; let from = null;
    g.addEventListener('dragstart', e => { const p=e.target.closest('.ph'); if(!p)return; from=Number(p.dataset.ph); p.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    g.addEventListener('dragend', e => { const p=e.target.closest('.ph'); if(p)p.classList.remove('dragging'); });
    g.addEventListener('dragover', e => e.preventDefault());
    g.addEventListener('drop', e => { e.preventDefault(); const p=e.target.closest('.ph'); if(!p||from==null)return; const to=Number(p.dataset.ph); if(to===from)return; const [m]=state.sellPhotos.splice(from,1); state.sellPhotos.splice(to,0,m); from=null; renderMain(); });
  };
  const updateEarn = () => { const p=$('#sPrice'), o=$('#earnOut'); if(!p||!o)return; const v=parseAmount(p.value); o.textContent = isFinite(v)&&v>0 ? fmtMoney(round2(v*.95)) : '—'; };
  const submitSell = () => {
    const u = SMAuth.current(); if (!u) { SMAuth.openAuth('login'); return; }
    const err = $('#sellErr');
    const title=$('#sTitle').value.trim(), brand=$('#sBrand').value.trim(), desc=$('#sDesc').value.trim();
    const price=parseAmount($('#sPrice').value), year=$('#sYear').value?Number($('#sYear').value):null;
    const cat=$('#sCat').value, grade=$('#sGrade').value, size=$('#sSize').value;
    const pb = [];
    if (!state.sellPhotos.length) pb.push('Caricare almeno una foto reale dell\u2019articolo.');
    if (title.length < 6) pb.push('Titolo troppo breve (minimo 6 caratteri).');
    if (!brand) pb.push('Indicare brand o etichetta.');
    if (desc.length < 20) pb.push('Descrizione troppo breve (minimo 20 caratteri).');
    if (!isFinite(price)||price<1) pb.push('Prezzo non valido.');
    if (year && (year<1900||year>2026)) pb.push('Anno non plausibile.');
    if (pb.length) { err.innerHTML = I.get('alert',13,2)+' '+esc(pb[0]); err.classList.remove('hidden'); SMU.toast(pb[0],{type:'error'}); return; }
    err.classList.add('hidden');
    const list = userItems();
    if (state.editSku) {
      const it = list.find(x => x.sku === state.editSku);
      if (it) { Object.assign(it,{title,brand,desc,price:round2(price),year,category:cat,grading:grade,size,images:[...state.sellPhotos]}); saveItems(list); SMU.toast('Inserzione aggiornata.',{type:'success'}); const sku=state.editSku; state.editSku=null; state.sellPhotos=[]; navigate('articolo',sku); return; }
    }
    const item = { sku:'USR-'+Date.now().toString(36).toUpperCase(), category:cat, title, brand, year, grading:grade, price:round2(price), size,
      seller:{ name:u.name, city:u.city||'Milano', rating:5, sales:0, response:'1 h', verified:false, reviews:[] }, sellerEmail:u.email, desc,
      specs:{ 'Brand':brand, 'Grading':grade, 'Anno':year?String(year):'Non dichiarato', 'Pubblicato':fmtDate(Date.now()) },
      condition:{ estetica:90, meccanica:95, elettronica:98, difetti:'Nessun difetto dichiarato oltre a quanto descritto' },
      images:[...state.sellPhotos], audioProfile:SMData.audioProfile(cat), createdAt:Date.now(), verified:false, seed:false };
    list.unshift(item);
    if (!saveItems(list)) SMU.toast('Spazio locale quasi esaurito: rimuovere foto da altri annunci.',{type:'warning'});
    state.sellPhotos=[]; state.editSku=null;
    SMU.toast('Inserzione pubblicata nel catalogo.',{type:'success'});
    navigate('articolo',item.sku);
  };
  const startEdit = (sku) => { const it=findItem(sku); if(!it||!isMine(it))return; state.editSku=sku; state.sellPhotos=[...it.images]; navigate('vendi'); };
  const deleteItem = (sku) => {
    const it = findItem(sku); if (!it||!isMine(it)) return;
    SMU.openModal('Rimuovi inserzione','<p class="sm muted" style="margin-bottom:18px">Confermare la rimozione di <b>'+esc(it.title)+'</b>? Potrai annullare entro pochi secondi.</p><div style="display:flex;gap:10px"><button class="btn btn-danger btn-block" data-action="delete-confirm" data-sku="'+esc(sku)+'">'+I.get('trash',15)+'Rimuovi</button><button class="btn btn-outline btn-block" data-action="modal-close">Annulla</button></div>');
  };
  const confirmDelete = (sku) => {
    const l = userItems(), i = l.findIndex(x => x.sku === sku); if (i<0) { SMU.closeModal(); return; }
    const [rm] = l.splice(i,1); saveItems(l); SMU.closeModal(); navigate('profilo');
    SMU.toast('Inserzione rimossa.',{type:'info',action:{label:'Annulla',fn:()=>{const a=userItems();a.splice(Math.min(i,a.length),0,rm);saveItems(a);SMU.toast('Inserzione ripristinata.',{type:'success'});renderAll();}}});
  };

  /* ---------- chat ---------- */
  const contactSeller = (sku) => {
    if (!SMAuth.requireUser('Accedere per contattare il venditore.')) return;
    const it = findItem(sku); if (!it) return;
    if (isMine(it)) { SMU.toast('Questo è un tuo annuncio.',{type:'info'}); return; }
    closeDrawer();
    const t = SMChat.ensureThread(it);
    if (!t.msgs.length) { SMChat.push(t.id,{f:'me',t:'Buongiorno. Sono interessato a «'+it.title+'». È ancora disponibile?',d:SMU.fmtTime(Date.now()),ts:Date.now()}); navigate('chat',t.id); SMChat.sendUser(t.id,'È ancora disponibile?'); return; }
    navigate('chat',t.id);
  };
  const sendMessage = (id) => { const i=$('#msgInput'); if(!i)return; const t=i.value.trim(); if(!t)return; i.value=''; SMChat.sendUser(id,t); };
  const openOffer = (sku) => {
    if (!SMAuth.requireUser('Accedere per inviare un\u2019offerta.')) return;
    const it = findItem(sku);
    if (!it||itemStatus(it)!=='available') { SMU.toast('Articolo non disponibile per offerte.',{type:'warning'}); return; }
    SMU.openModal('Offerta vincolante','<p class="sm muted" style="margin-bottom:6px">'+esc(it.title)+'</p><p class="semi tabular" style="font-size:1.2rem;margin-bottom:16px">Prezzo richiesto: '+fmtMoney(it.price)+'</p><form id="offerForm" data-sku="'+esc(sku)+'"><div class="fg"><label for="oAmt">La tua proposta (€)</label><input class="f-in tabular" id="oAmt" type="number" min="1" step="0.01" value="'+Math.round(it.price*.9)+'"></div><div class="f-err hidden" id="oErr"></div><div class="escrow-note" style="margin:12px 0">'+I.get('info',15)+'<span>Se accettata, completerai il pagamento all\u2019importo concordato.</span></div><button type="submit" class="btn btn-primary btn-lg btn-block">'+I.get('send',15)+'Invia offerta</button></form>');
  };
  const submitOffer = (f) => {
    const it = findItem(f.dataset.sku), amt = parseAmount($('#oAmt').value), err = $('#oErr');
    if (!isFinite(amt)||amt<1) { err.textContent='Importo non valido.'; err.classList.remove('hidden'); return; }
    if (amt >= it.price) { err.textContent='L\u2019offerta deve essere inferiore al prezzo richiesto.'; err.classList.remove('hidden'); return; }
    SMU.closeModal(); const t = SMChat.ensureThread(it); navigate('chat',t.id); SMChat.sendOffer(t.id,round2(amt));
    SMU.toast('Offerta di '+fmtMoney(amt)+' inviata.',{type:'success'});
  };
  const counterOffer = (id, ts) => {
    const t = SMChat.byId(id); if (!t) return;
    const of = t.msgs.find(m => m.kind==='offer'&&m.ts===ts); if (!of) return;
    const it = findItem(t.sku), sug = it ? Math.round((of.amount+it.price)/2) : of.amount;
    SMU.openModal('Controfferta','<p class="sm muted" style="margin-bottom:14px">Proposta del venditore: <b class="tabular">'+fmtMoney(of.amount)+'</b>.</p><form id="counterForm" data-id="'+esc(id)+'" data-ts="'+ts+'"><div class="fg"><label for="cAmt">Importo (€)</label><input class="f-in tabular" id="cAmt" type="number" min="1" step="0.01" value="'+sug+'"></div><button type="submit" class="btn btn-primary btn-lg btn-block">Invia controfferta</button></form>');
  };
  const submitCounter = (f) => {
    const amt = parseAmount($('#cAmt').value);
    if (!isFinite(amt)||amt<1) { SMU.toast('Importo non valido.',{type:'error'}); return; }
    SMU.closeModal(); SMChat.respondSellerOffer(f.dataset.id,Number(f.dataset.ts),'decline'); SMChat.sendOffer(f.dataset.id,round2(amt));
  };

  /* ---------- checkout ---------- */
  const openCheckout = (sku, agreed = null) => {
    if (!SMAuth.requireUser('Accedere per acquistare.')) return;
    const it = findItem(sku); if (!it) return;
    if (itemStatus(it)!=='available') { SMU.toast('Articolo non più disponibile.',{type:'warning'}); return; }
    if (isMine(it)) { SMU.toast('Non puoi acquistare un tuo annuncio.',{type:'info'}); return; }
    closeDrawer();
    state.checkout = { sku, price: agreed!=null?agreed:it.price, shipMethod:'pickup' };
    checkoutModal(it);
  };
  const shipOpt = (id,t,s,cost,cur) => '<label class="radio-opt'+(cur===id?' on':'')+'"><input type="radio" name="shipMethod" value="'+id+'"'+(cur===id?' checked':'')+' data-checkout="ship"><span>'+I.get(id==='home'?'truck':'pin',17)+'</span><span><span class="ro-t">'+t+'</span><br><span class="ro-s">'+s+'</span></span><span class="ro-p tabular">'+fmtMoney(cost)+'</span></label>';
  const checkoutModal = (it) => {
    const c = state.checkout, fee = SMData.protectionFee(c.price), base = SMData.shipCost(it.size);
    const ship = c.shipMethod==='home'?round2(base+2):base, total = round2(c.price+fee+ship);
    SMU.openModal('Riepilogo ordine',
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px"><img src="'+esc(it.images[0])+'" alt="" style="width:52px;height:68px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\''+SMData.art(it.category,it.title)+'\'"><div><div class="semi sm">'+esc(it.title)+'</div><div class="xs light">@'+esc(sName(it.seller))+' · '+esc(it.grading)+'</div></div></div>' +
      '<div class="block-title">Modalità di consegna</div><div class="radio-row" style="margin-bottom:16px">'+shipOpt('pickup','Punto di ritiro convenzionato','Fermopoint · Poste · InPost — 2–4 giorni',base,c.shipMethod)+shipOpt('home','Consegna a domicilio','Corriere espresso con firma alla consegna',round2(base+2),c.shipMethod)+'</div>' +
      '<div class="price-box" style="margin-bottom:14px"><div class="price-rows" style="border:none;padding:0;margin:0"><div class="price-row"><span>Articolo'+(c.price!==it.price?' (concordato)':'')+'</span><span class="tabular">'+fmtMoney(c.price)+'</span></div><div class="price-row"><span>Protezione Acquisti Musicista</span><span class="tabular">'+fmtMoney(fee)+'</span></div><div class="price-row"><span>Spedizione assicurata</span><span class="tabular">'+fmtMoney(ship)+'</span></div><div class="price-row total"><span>Totale</span><span class="tabular">'+fmtMoney(total)+'</span></div></div></div>' +
      '<div class="escrow-note" style="margin-bottom:16px">'+I.get('lock',15)+'<span>Nel passaggio successivo scegli carta, PayPal, Apple Pay, Google Pay, Klarna o SEPA. Il pannello si aggiorna senza ricaricare.</span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" data-action="checkout-pay">'+I.get('card',16)+'Scegli come pagare · '+fmtMoney(total)+'</button>',
      { wide:true, onClose:()=>{ state.checkout=null; } });
    I.hydrate($('#modalRoot'));
  };
  const startPayment = () => {
    const c = state.checkout; if (!c) return;
    const it = findItem(c.sku); if (!it) return;
    const fee = SMData.protectionFee(c.price), base = SMData.shipCost(it.size);
    const ship = c.shipMethod==='home'?round2(base+2):base;
    const payload = { item:it, price:c.price, fee, ship, total:round2(c.price+fee+ship), shipMethod:c.shipMethod };
    state.checkout = null; SMU.closeModal();
    SMPay.openPayment({ ...payload, email:SMAuth.current().email, onSuccess:(p)=>finalizeOrder(payload,p) });
  };
  const finalizeOrder = (p, payment) => {
    const it = p.item, u = SMAuth.fullUser() || SMAuth.current();
    const order = {
      id:'SM-'+Date.now().toString(36).toUpperCase(), sku:it.sku, title:it.title, img:it.images[0], category:it.category,
      sellerName:sName(it.seller), sellerCity:(typeof it.seller==='object'&&it.seller.city)||'Milano', buyerCity:(u&&u.city)||'Milano',
      amount:p.price, fee:p.fee, ship:p.ship, total:p.total,
      shipLabel:p.shipMethod==='home'?'Domicilio · corriere espresso':'Punto di ritiro convenzionato',
      methodLabel:SMPay.methodLabel(payment), tracking:'TRK'+Math.random().toString().slice(2,12),
      createdAt:Date.now(), confirmedAt:null, refundedAt:null, dispute:null, payment
    };
    const l = orders(); l.unshift(order); saveOrders(l);
    setStatus(it.sku,'reserved'); saveCart(cart().filter(s=>s!==it.sku));
    const w = wallet(); w.pending = round2((w.pending||0)+p.total);
    w.movements = w.movements||[]; w.movements.unshift({ label:'Acquisto · '+it.title, amount:-p.total, at:Date.now(), ref:order.id });
    saveWallet(w);
    const t = SMChat.ensureThread(it);
    SMChat.systemMsg(t.id,'Ordine '+order.id+' confermato. Pagamento '+payment.id+' di '+fmtMoney(p.total)+' vincolato in escrow. Tracking '+order.tracking+' · '+order.shipLabel+'.');
    state.justPaid = order.id; state.acqFilter = 'tutti';
    lastStage.set(order.id, 1);
    SMU.toast('Pagamento riuscito: '+fmtMoney(p.total)+'.',{type:'success'});
    navigate('spedizione', order.id);
  };
  const confirmOrder = (id) => {
    const l = orders(), o = l.find(x=>x.id===id); if (!o||o.confirmedAt||o.refundedAt) return;
    o.confirmedAt = Date.now(); o.dispute = null; saveOrders(l); setStatus(o.sku,'sold');
    const w = wallet(); w.pending = round2(Math.max(0,(w.pending||0)-o.total));
    w.movements = w.movements||[]; w.movements.unshift({ label:'Ricezione confermata · '+o.title, amount:0, at:Date.now(), ref:o.id+' · fondi sbloccati' });
    saveWallet(w);
    const t = SMChat.bySku(o.sku);
    if (t) SMChat.systemMsg(t.id,'Ricezione confermata. Fondi sbloccati al venditore. Transazione '+o.id+' completata. Recensione abilitata.');
    lastStage.set(o.id, COMPLETE);
    patchOrder(o,true); patchCounts(); renderHeader();
    SMU.toast('Ricezione confermata. Fondi sbloccati. Ora puoi recensire l\u2019acquisto.',{type:'success',duration:5500});
  };
  const showReceipt = (id) => { const o = orders().find(x=>x.id===id); if (o) SMPay.showReceipt(o.payment,o.title,o); };

  /* ---------- contestazioni ---------- */
  const REASONS = [
    { id:'non_conforme', label:'Articolo non conforme al grading dichiarato' },
    { id:'danneggiato', label:'Danni da trasporto o imballo inadeguato' },
    { id:'non_ricevuto', label:'Articolo non ricevuto' },
    { id:'mancante', label:'Componente o accessorio mancante non dichiarato' }
  ];
  const openDispute = (id) => {
    const o = orders().find(x=>x.id===id); if (!o) return;
    SMU.openModal('Apri contestazione',
      '<p class="sm muted" style="margin-bottom:14px">Ordine <b>'+esc(o.id)+'</b> · '+esc(o.title)+'. I fondi restano bloccati in escrow fino all\u2019esito.</p>' +
      '<form id="disputeForm" data-id="'+esc(id)+'"><div class="fg"><label for="dReason">Motivazione *</label><select class="f-sel" id="dReason">'+REASONS.map(r=>'<option value="'+r.id+'">'+esc(r.label)+'</option>').join('')+'</select></div>' +
      '<div class="fg"><label for="dNote">Descrizione dettagliata *</label><textarea class="f-ta" id="dNote" placeholder="Descrivi la difformità riscontrata…"></textarea></div><div class="f-err hidden" id="dErr"></div>' +
      '<div class="escrow-note" style="margin:12px 0">'+I.get('shieldCheck',15)+'<span>Se fondata, la Protezione Acquisti dispone il rimborso integrale sul metodo originale.</span></div>' +
      '<button type="submit" class="btn btn-danger btn-lg btn-block">'+I.get('alert',15,2.2)+'Invia contestazione</button></form>',{wide:true});
    I.hydrate($('#modalRoot'));
  };
  const submitDispute = (f) => {
    const id=f.dataset.id, note=$('#dNote').value.trim(), err=$('#dErr');
    if (note.length<15) { err.textContent='Descrivere la difformità in almeno 15 caratteri.'; err.classList.remove('hidden'); return; }
    const rid=$('#dReason').value, reason=REASONS.find(r=>r.id===rid);
    const l=orders(), o=l.find(x=>x.id===id); if(!o){SMU.closeModal();return;}
    o.dispute={ reason:rid, reasonLabel:reason.label, note, at:Date.now() }; saveOrders(l);
    SMU.closeModal();
    const t=SMChat.bySku(o.sku); if(t) SMChat.systemMsg(t.id,'Contestazione aperta sull\u2019ordine '+o.id+': '+reason.label+'. Fondi bloccati in escrow.');
    lastStage.set(o.id,DISPUTE); patchOrder(o,true); patchCounts();
    SMU.toast('Contestazione registrata. Verifica in corso.',{type:'warning'});
  };
  const resolveDispute = (id) => {
    const l=orders(), o=l.find(x=>x.id===id);
    if (!o||!o.dispute||o.refundedAt||o.confirmedAt) return;
    o.refundedAt=Date.now(); if(o.payment)o.payment.status='refunded'; saveOrders(l);
    setStatus(o.sku,'available');
    const w=wallet(); w.pending=round2(Math.max(0,(w.pending||0)-o.total));
    w.movements=w.movements||[]; w.movements.unshift({ label:'Rimborso · '+o.title, amount:o.total, at:Date.now(), ref:o.id });
    saveWallet(w);
    const t=SMChat.bySku(o.sku); if(t) SMChat.systemMsg(t.id,'Contestazione accolta. Rimborso di '+fmtMoney(o.total)+' disposto sul metodo originale.');
    lastStage.set(o.id,REFUND); patchOrder(o,true); patchCounts(); renderHeader();
    SMU.toast('Contestazione accolta: rimborso di '+fmtMoney(o.total)+' disposto.',{type:'success',duration:6000});
  };
  const doWithdraw = () => {
    const u=SMAuth.current(); if(!u)return;
    const iban=($('#withdrawIban')||{}).value||'', amt=parseAmount(($('#withdrawAmt')||{}).value), w=wallet();
    if (!SMU.ibanValid(iban)) { SMU.toast('IBAN non valido: controllo mod-97 non superato.',{type:'error'}); return; }
    if (!isFinite(amt)||amt<1) { SMU.toast('Importo non valido.',{type:'error'}); return; }
    if (amt>(w.available||0)) { SMU.toast('Saldo disponibile insufficiente.',{type:'error'}); return; }
    SMAuth.updateProfile({ iban:iban.replace(/\s/g,'').toUpperCase() });
    w.available=round2(w.available-amt); w.movements=w.movements||[];
    w.movements.unshift({ label:'Trasferimento su IBAN', amount:-amt, at:Date.now(), ref:SMU.maskIban(iban) });
    saveWallet(w);
    SMU.toast('Bonifico SEPA di '+fmtMoney(amt)+' disposto verso '+SMU.maskIban(iban)+'.',{type:'success',duration:5000});
    renderMain();
  };
  const saveSearch = () => {
    if (!SMAuth.requireUser('Accedere per salvare le ricerche.')) return;
    const f=state.filters, parts=[];
    if (state.cat!=='Tutte') parts.push(state.cat);
    if (f.q) parts.push('«'+f.q+'»');
    if (f.brand) parts.push(f.brand);
    if (f.grade) parts.push(f.grade);
    if (f.min!==''||f.max!=='') parts.push('€ '+(f.min||'0')+'–'+(f.max||'∞'));
    const label = parts.length?parts.join(' · '):'Tutto il catalogo';
    const l=saved(); l.unshift({ id:uid('sv'), label, cat:state.cat, filters:{...f} }); saveSaved(l.slice(0,8));
    SMU.toast('Ricerca salvata: '+label,{type:'success'}); renderMain();
  };
  const openLegal = (t) => { const x=SMData.INFO[t]; if(x){SMU.openModal(x.title,'<div class="info-body">'+x.html+'</div>',{wide:true});I.hydrate($('#modalRoot'));} };

  /* ---------- eventi ---------- */
  const bind = () => {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) { if (state.menuOpen && !e.target.closest('.usermenu')) { state.menuOpen=false; renderHeader(); } if (!e.target.closest('.searchbox')) closeSuggest(); return; }
      const a = el.dataset.action;
      if (a!=='menu' && state.menuOpen) state.menuOpen=false;
      switch (a) {
        case 'route': { const q=el.dataset.query?Object.fromEntries(el.dataset.query.split('&').map(p=>p.split('='))):null; if(el.dataset.route!=='acquisti')state.justPaid=null; closeDrawer(); stopAudio(); navigate(el.dataset.route,null,q); closeSuggest(); break; }
        case 'prof-go': state.profTab=el.dataset.tab; closeDrawer(); navigate('profilo',null,{tab:el.dataset.tab}); break;
        case 'cat': state.cat=el.dataset.cat; closeSuggest(); navigate(state.route.name==='cerca'?'cerca':'home'); break;
        case 'item': closeSuggest(); closeDrawer(); stopAudio(); state.galleryIdx=0; state.revSort='recent'; navigate('articolo',el.dataset.sku); break;
        case 'fav': e.preventDefault(); e.stopPropagation(); toggleFav(el.dataset.sku,el); break;
        case 'add-cart': e.preventDefault(); e.stopPropagation(); addCart(el.dataset.sku); break;
        case 'remove-cart': saveCart(cart().filter(s=>s!==el.dataset.sku)); SMU.toast('Rimosso dal carrello.',{type:'info'}); renderAll(); break;
        case 'checkout-cart': { const c=cart(); if(c.length) openCheckout(c[0]); break; }
        case 'auth': SMAuth.openAuth(el.dataset.mode||'login'); break;
        case 'auth-tab': SMAuth.openAuth(el.dataset.mode); break;
        case 'logout': closeDrawer(); stopAudio(); SMAuth.logout(); break;
        case 'menu': e.stopPropagation(); state.menuOpen=!state.menuOpen; renderHeader(); break;
        case 'modal': openLegal(el.dataset.modal); break;
        case 'modal-close': SMU.closeModal(); break;
        case 'lightbox-close': SMU.closeLightbox(); break;
        case 'drawer-close': closeDrawer(); break;
        case 'zoom': SMU.openLightbox(el.dataset.src,el.dataset.label||''); break;
        case 'thumb': state.galleryIdx=Number(el.dataset.idx); renderMain(); break;
        case 'audio-play': playAudio(el.dataset.sku); break;
        case 'share': SMU.copyText(location.href.split('#')[0]+'#/articolo/'+el.dataset.sku).then(ok=>SMU.toast(ok?'Link copiato.':'Copia non riuscita.',{type:ok?'success':'error'})); break;
        case 'copy-track': SMU.copyText(el.dataset.track).then(ok=>SMU.toast(ok?'Tracking copiato: '+el.dataset.track:'Copia non riuscita.',{type:ok?'success':'error'})); break;
        case 'thread': navigate('chat',el.dataset.id); break;
        case 'chat-back': navigate('chat'); break;
        case 'send': sendMessage(el.dataset.id); break;
        case 'quick': { const t=SMChat.byId(state.route.param)||SMChat.threads()[0]; if(t) SMChat.sendUser(t.id,el.dataset.text); break; }
        case 'contact': contactSeller(el.dataset.sku); break;
        case 'offer': openOffer(el.dataset.sku); break;
        case 'offer-accept': { const of=SMChat.respondSellerOffer(el.dataset.id,Number(el.dataset.ts),'accept'); if(of){const t=SMChat.byId(el.dataset.id); setTimeout(()=>openCheckout(t.sku,of.amount),350);} break; }
        case 'offer-decline': SMChat.respondSellerOffer(el.dataset.id,Number(el.dataset.ts),'decline'); break;
        case 'offer-counter': counterOffer(el.dataset.id,Number(el.dataset.ts)); break;
        case 'checkout-offer': openCheckout(el.dataset.sku,Number(el.dataset.amount)); break;
        case 'buy': openCheckout(el.dataset.sku); break;
        case 'checkout-pay': startPayment(); break;
        case 'track': closeDrawer(); navigate('spedizione',el.dataset.id); break;
        case 'open-order': openOrder(el.dataset.id); break;
        case 'confirm-order': confirmOrder(el.dataset.id); break;
        case 'receipt': showReceipt(el.dataset.id); break;
        case 'dispute': openDispute(el.dataset.id); break;
        case 'acq-filter': state.acqFilter=el.dataset.f; renderMain(); break;
        case 'prof-tab': state.profTab=el.dataset.tab; renderMain(); break;
        case 'withdraw': doWithdraw(); break;
        case 'write-rev': openReviewForm(el.dataset.sku,el.dataset.order,null); break;
        case 'rev-edit': { const r=reviews().find(x=>x.id===el.dataset.id); if(r) openReviewForm(r.sku,r.orderId,r.id); break; }
        case 'rev-del': deleteReview(el.dataset.id); break;
        case 'rev-help': toggleHelpful(el.dataset.id); break;
        case 'rev-reply': replyReview(el.dataset.id); break;
        case 'pick-photos': $('#photoInput').click(); break;
        case 'ph-remove': state.sellPhotos.splice(Number(el.dataset.k),1); renderMain(); break;
        case 'ph-cover': { const k=Number(el.dataset.k); const [p]=state.sellPhotos.splice(k,1); state.sellPhotos.unshift(p); renderMain(); break; }
        case 'edit-item': startEdit(el.dataset.sku); break;
        case 'delete-item': deleteItem(el.dataset.sku); break;
        case 'delete-confirm': confirmDelete(el.dataset.sku); break;
        case 'cancel-edit': state.editSku=null; state.sellPhotos=[]; navigate('profilo'); break;
        case 'save-search': saveSearch(); break;
        case 'apply-saved': { const s=saved().find(x=>x.id===el.dataset.id); if(s){state.cat=s.cat;state.filters={...s.filters};renderAll();} break; }
        case 'remove-saved': e.stopPropagation(); saveSaved(saved().filter(x=>x.id!==el.dataset.id)); renderMain(); break;
        case 'reset-filters': state.filters={q:'',brand:'',grade:'',min:'',max:'',sort:'recent'}; state.cat='Tutte'; renderAll(); break;
        case 'search-go': state.filters.q=el.dataset.q; closeSuggest(); navigate('cerca'); break;
      }
    });
    document.addEventListener('click', (e) => { if (e.target.dataset && e.target.dataset.overlay && !SMPay.isBusy()) SMU.closeModal(); });
    document.addEventListener('submit', (e) => {
      const f = e.target;
      if (f.id==='authForm') { e.preventDefault(); SMAuth.submitAuth(f); }
      else if (f.id==='sellForm') { e.preventDefault(); submitSell(); }
      else if (f.id==='offerForm') { e.preventDefault(); submitOffer(f); }
      else if (f.id==='counterForm') { e.preventDefault(); submitCounter(f); }
      else if (f.id==='disputeForm') { e.preventDefault(); submitDispute(f); }
      else if (f.id==='revForm') { e.preventDefault(); submitReview(f); }
      else if (f.id==='revReplyForm') { e.preventDefault(); submitReply(f); }
    });
    document.addEventListener('input', debounce((e) => { if (e.target.id==='globalSearch') renderSuggest(e.target.value.trim()); },140));
    document.addEventListener('input', (e) => { if (e.target.id==='sPrice') updateEarn(); });
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.filter) { const k=t.dataset.filter; if(k==='cat')state.cat=t.value; else state.filters[k]=t.value; renderAll(); }
      if (t.hasAttribute('data-revsort')) { state.revSort=t.value; if(state.route.name==='articolo') patchReviews(state.route.param); }
      if (t.id==='sGrade') { const g=SMData.GRADING.find(x=>x.id===t.value), h=$('#gradeHint'); if(g&&h)h.textContent=g.desc; }
      if (t.dataset.checkout && state.checkout) {
        state.checkout.shipMethod = t.value;
        const it = findItem(state.checkout.sku); if (!it) return;
        const c = state.checkout, fee=SMData.protectionFee(c.price), base=SMData.shipCost(it.size);
        const ship = c.shipMethod==='home'?round2(base+2):base;
        $$('[data-checkout="ship"]').forEach(r => { const l=r.closest('.radio-opt'); if(l) l.classList.toggle('on', r.value===c.shipMethod); });
        const rows = $$('#modalRoot .price-row');
        if (rows.length >= 4) { rows[2].querySelector('span:last-child').textContent = fmtMoney(ship); rows[3].querySelector('span:last-child').textContent = fmtMoney(round2(c.price+fee+ship)); }
        const btn = SMU.$('[data-action="checkout-pay"]');
        if (btn) btn.innerHTML = I.get('card',16)+'Scegli come pagare · '+fmtMoney(round2(c.price+fee+ship));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key==='Escape') { if(SMU.isLightboxOpen())SMU.closeLightbox(); else if(SMU.isModalOpen()){if(!SMPay.isBusy())SMU.closeModal();} else if(state.drawerOrder)closeDrawer(); else if(state.menuOpen){state.menuOpen=false;renderHeader();} else closeSuggest(); }
      if (e.key==='/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); const s=$('#globalSearch'); if(s)s.focus(); }
      if (e.key==='Enter' && e.target.id==='globalSearch') { const q=e.target.value.trim(); if(q){state.filters.q=q;closeSuggest();navigate('cerca');} }
      if (e.key==='Enter' && e.target.id==='msgInput') { const t=SMChat.byId(state.route.param)||SMChat.threads()[0]; if(t)sendMessage(t.id); }
      if ((e.key==='Enter'||e.key===' ') && e.target.dataset && e.target.dataset.action==='item' && e.target.classList.contains('card')) { e.preventDefault(); stopAudio(); state.galleryIdx=0; navigate('articolo',e.target.dataset.sku); }
    });
    document.addEventListener('load', (e) => { const im=e.target; if(im.tagName==='IMG'){const w=im.closest('.card-img'); if(w)w.classList.add('loaded');} }, true);
    document.addEventListener('sm:chat', () => { renderHeader(); if(state.route.name==='chat')renderMain(); });
    document.addEventListener('sm:typing', (e) => {
      state.typingThread = e.detail.on ? e.detail.threadId : null;
      if (state.route.name==='chat') { const b=$('#msgsBox'), o=$('#typingDots'); if(o)o.remove(); if(e.detail.on&&isViewingThread(e.detail.threadId)&&b){const d=document.createElement('div');d.className='typing';d.id='typingDots';d.innerHTML='<i></i><i></i><i></i>';b.appendChild(d);b.scrollTop=b.scrollHeight;} }
    });
    window.addEventListener('hashchange', () => {
      state.route=parseHash(); state.menuOpen=false; stopAudio();
      if (state.route.name!=='vendi'&&!state.editSku) state.sellPhotos=[];
      if (state.route.name!=='acquisti'&&state.route.name!=='spedizione') state.justPaid=null;
      closeDrawer(); renderAll(); window.scrollTo({top:0});
    });
  };

  const renderFooter = () => {
    const fl=$('#footerLogo'); if(fl) fl.innerHTML='<span class="logo-mark" style="width:30px;height:30px">'+I.get('logo',16,1.8)+'</span> SoundMarket';
    const ft=$('#footerTrust'); if(ft) ft.innerHTML='<span class="ft-pill">'+I.get('shieldCheck',12,2)+'Protezione Acquisti</span><span class="ft-pill">'+I.get('lock',12,2)+'Escrow</span><span class="ft-pill">'+I.get('truck',12,2)+'Tracking live</span><span class="ft-pill">'+I.get('star',12,2)+'Recensioni verificate</span>';
    I.hydrate($('.footer'));
  };

  const init = () => {
    SMAuth.seedDemo(); seedReviews();
    if (!$('#drawerRoot')) document.body.insertAdjacentHTML('beforeend','<div id="drawerRoot"></div>');
    renderFooter();
    state.route = parseHash();
    bind(); renderAll();
    orders().forEach(o => lastStage.set(o.id, stageOf(o)));
    if (!rafId) rafId = requestAnimationFrame(loop);
    if (!store.isPersistent()) SMU.toast('Persistenza locale non disponibile: i dati dureranno solo per questa sessione.',{type:'warning',duration:6000});
  };
  document.addEventListener('DOMContentLoaded', init);

  return { navigate, renderAll, renderHeader, findItem, isViewingThread, state };
})();