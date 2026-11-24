/* ============================================================
   SOUNDMARKET — CHECKOUT AUTONOMO + RIPRISTINO ICONE
   Modulo indipendente. Non modifica nessun altro file.
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     1. LIBRERIA ICONE COMPLETA
     ========================================================== */
  var PATHS = {
    logo: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="m22 2-11 11"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    arrowLeft: '<path d="m15 18-6-6 6-6"/>',
    arrowRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/>',
    truck: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    tag: '<path d="M20.59 13.41 12 22l-9-9V3h10l7.59 7.59a2 2 0 0 1 0 2.82z"/><circle cx="7.5" cy="7.5" r="1"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    euro: '<path d="M18.5 5.5A8 8 0 0 0 6 12a8 8 0 0 0 12.5 6.5"/><path d="M3 10h9M3 14h9"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    zoom: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    play: '<path d="m5 3 14 9-14 9z"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4M8 23h8"/>',
    piano: '<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M6 6v7M10 6v7M14 6v7M18 6v7"/>',
    drum: '<ellipse cx="12" cy="8" rx="9" ry="3"/><path d="M3 8v8c0 1.66 4 3 9 3s9-1.34 9-3V8"/><path d="m7 10.5 3 4M17 10.5l-3 4"/>',
    guitar: '<path d="m11.9 12.1 6.4-6.4a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8l-6.4 6.4"/><path d="M11.9 12.1c-1.5-1.5-4.6-1.6-6.4.2-1 1-1.2 2.3-1.7 3.3-.5 1-1.6 1.4-2.1 2.4-.8 1.6.5 3.9 2.1 4.4 1.2.4 2-.4 2.9-.9 1-.5 2.3-.7 3.3-1.7 1.8-1.8 1.7-4.9.2-6.4z"/><circle cx="8" cy="16" r="1.5"/>',
    violin: '<path d="M14 3l7 7"/><path d="M17.5 6.5 9 15"/><path d="M9 15c-1.2-1.2-3.5-1.3-5 .2-.8.8-.9 1.8-1.3 2.6-.4.8-1.3 1.1-1.6 1.9-.6 1.3.4 3.1 1.7 3.5 1 .3 1.6-.3 2.3-.7.8-.4 1.8-.5 2.6-1.3 1.5-1.5 1.4-3.8.2-5z"/>',
    dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    bank: '<path d="M3 21h18"/><path d="M5 21V10M19 21V10M9 21v-7M15 21v-7"/><path d="m12 3 9 5H3z"/>',
    face: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M9 10v1M15 10v1M12 10v4h-1M9 16c1.8 1.2 4.2 1.2 6 0"/>',
    finger: '<path d="M12 3a7 7 0 0 0-7 7v4a9 9 0 0 0 1.5 5"/><path d="M12 6.5a3.5 3.5 0 0 0-3.5 3.5v4a6 6 0 0 0 1 3.4"/><path d="M12 10v4.5a4 4 0 0 0 .8 2.4"/><path d="M15.5 10a3.5 3.5 0 0 1 3.5 3.5V16"/><path d="M19 8.5A7 7 0 0 0 12 3"/>',
    wave: '<path d="M6 8a8 8 0 0 1 0 8"/><path d="M10 6a12 12 0 0 1 0 12"/><path d="M14 4a16 16 0 0 1 0 16"/>'
  };
  function svg(inner, s, w) {
    s = s || 20; w = w || 1.5;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  function ic(n, s, w) { return svg(PATHS[n] || PATHS.info, s, w); }
  function heartIc(f, s) {
    s = s || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + (f ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS.heart + '</svg>';
  }
  function starIc(f, s) {
    s = s || 13;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="' + (f ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">' + PATHS.star + '</svg>';
  }
  function starsIc(r) {
    var o = '<span class="stars" aria-label="Valutazione ' + r + ' su 5">';
    for (var i = 1; i <= 5; i++) o += starIc(i <= Math.round(r));
    return o + '</span>';
  }
  var CATMAP = {
    'Chitarre Elettriche': 'guitar', 'Chitarre Acustiche': 'guitar', 'Bassi': 'guitar',
    'Tastiere': 'piano', 'Batterie': 'drum', 'Vinili': 'disc', 'CD': 'disc',
    'Pedali Effetto': 'sliders', 'Amplificatori': 'headphones', 'Microfoni': 'mic', 'Archi': 'violin'
  };
  function catIc(c, s) { return ic(CATMAP[c] || 'music', s || 16); }
  if (window.SMIcons) {
    window.SMIcons.get = ic; window.SMIcons.heart = heartIc;
    window.SMIcons.star = starIc; window.SMIcons.stars = starsIc; window.SMIcons.catIcon = catIc;
  } else {
    window.SMIcons = { get: ic, heart: heartIc, star: starIc, stars: starsIc, catIcon: catIc };
  }

  /* ==========================================================
     2. UTILITÀ
     ========================================================== */
  var NF = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  function money(n) { return NF.format(Number(n) || 0); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dt(ts) { return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function tm(ts) { return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
  var MEM = {};
  function rd(k, f) { try { var v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) {} return (k in MEM) ? MEM[k] : f; }
  function wr(k, v) { MEM[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function hashPass(s) { var h = 5381, str = 'sm::' + s; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return 'h' + h.toString(36) + '_' + str.length; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function session() { return rd('sm.session', null); }
  function users() { return rd('sm.users', []); }
  function items() {
    var u = rd('sm.userItems', []);
    var seed = (window.SMData && window.SMData.ITEMS) ? window.SMData.ITEMS : [];
    return u.concat(seed);
  }
  function findItem(sku) { var l = items(); for (var i = 0; i < l.length; i++) if (l[i].sku === sku) return l[i]; return null; }
  function statusOf(sku) { return rd('sm.itemStatus', {})[sku] || 'available'; }
  function setStatus(sku, st) { var m = rd('sm.itemStatus', {}); if (st) m[sku] = st; else delete m[sku]; wr('sm.itemStatus', m); }
  function orders() { var u = session(); return u ? rd('sm.orders.' + u.id, []) : []; }
  function saveOrders(l) { var u = session(); if (u) wr('sm.orders.' + u.id, l); }
  function feeOf(p) { return (window.SMData && window.SMData.protectionFee) ? window.SMData.protectionFee(p) : r2(Math.max(0.70, p * 0.05 + 0.70)); }
  function shipOf(z) {
    if (window.SMData && window.SMData.shipCost) return window.SMData.shipCost(z);
    return z === 'P' ? 3.90 : z === 'G' ? 12.90 : 6.90;
  }
  function fallbackImg(it) {
    if (window.SMData && window.SMData.art) return window.SMData.art(it.category, it.title);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#0F4C5C"/><circle cx="150" cy="180" r="70" fill="none" stroke="#E8B04B" stroke-opacity=".4" stroke-width="3"/><text x="150" y="330" font-family="sans-serif" font-size="15" fill="#E8B04B" text-anchor="middle">SoundMarket</text></svg>');
  }
  function appRefresh() { try { if (window.SMApp && window.SMApp.renderAll) window.SMApp.renderAll(); } catch (e) {} }
  function appCloseModal() { try { if (window.SMU && window.SMU.closeModal) window.SMU.closeModal(); } catch (e) {} }

  /* ==========================================================
     3. CSS
     ========================================================== */
  var CSS = [
'#smxRoot{position:fixed;inset:0;z-index:9000;display:none;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0F172A;font-size:15px;line-height:1.5}',
'#smxRoot.on{display:block}',
'#smxRoot *{box-sizing:border-box}',
'#smxRoot button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;font-size:inherit}',
'#smxRoot input,#smxRoot select,#smxRoot textarea{font-family:inherit;font-size:inherit;color:inherit}',
'#smxRoot h3,#smxRoot p{margin:0}',
'#smxRoot .scrim{position:absolute;inset:0;background:rgba(6,42,51,.66);backdrop-filter:blur(4px);animation:sxfade .2s ease}',
'@keyframes sxfade{from{opacity:0}}',
'#smxRoot .wrap{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow:auto}',
'#smxRoot .wrap::-webkit-scrollbar{width:10px}',
'#smxRoot .wrap::-webkit-scrollbar-track{background:rgba(255,255,255,.08)}',
'#smxRoot .wrap::-webkit-scrollbar-thumb{background:#177A93;border-radius:6px;border:2px solid rgba(255,255,255,.12)}',
'#smxRoot .box{position:relative;width:100%;max-width:980px;margin:auto;background:#fff;border-radius:12px;box-shadow:0 30px 70px -18px rgba(6,42,51,.65);overflow:hidden;animation:sxpop .26s cubic-bezier(.22,.9,.3,1)}',
'#smxRoot .box.slim{max-width:520px}',
'@keyframes sxpop{from{opacity:0;transform:translateY(16px) scale(.97)}}',
'#smxRoot .head{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid #E2E8F0;background:#F8FAFC;color:#0F4C5C}',
'#smxRoot .head b{font-size:.96rem;font-weight:700;flex:1;color:#0F172A}',
'#smxRoot .hx{width:34px;height:34px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#475569}',
'#smxRoot .hx:hover{background:#E2E8F0;color:#0F172A}',
'#smxRoot .grid{display:grid;grid-template-columns:322px 1fr}',
'@media(max-width:880px){#smxRoot .grid{grid-template-columns:1fr}}',
'#smxRoot .side{background:linear-gradient(158deg,#062A33,#0F4C5C 60%,#136276);color:#fff;padding:24px 22px;display:flex;flex-direction:column;gap:15px;position:relative;overflow:hidden}',
'#smxRoot .side:before{content:"";position:absolute;inset:-40%;opacity:.55;background-image:repeating-radial-gradient(circle at 50% 45%,rgba(232,176,75,.13) 0 1px,transparent 1px 34px);animation:sxdrift 90s linear infinite}',
'@keyframes sxdrift{to{transform:translate(34px,17px)}}',
'#smxRoot .side:after{content:"";position:absolute;inset:0;background:radial-gradient(420px 220px at 88% 0%,rgba(232,176,75,.2),transparent 62%)}',
'#smxRoot .side>*{position:relative;z-index:1}',
'#smxRoot .merch{display:flex;align-items:center;gap:10px}',
'#smxRoot .merch .mk{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#E8B04B}',
'#smxRoot .merch b{display:block;font-size:1rem}',
'#smxRoot .merch i{display:block;font-style:normal;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:#E8B04B}',
'#smxRoot .tb{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#D97706;color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.11em;padding:4px 10px;border-radius:4px;text-transform:uppercase}',
'#smxRoot .it{display:flex;gap:11px;align-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:6px;padding:10px}',
'#smxRoot .it img{width:44px;height:58px;object-fit:cover;border-radius:4px;flex-shrink:0;background:rgba(0,0,0,.25)}',
'#smxRoot .it .t{font-size:.82rem;font-weight:600;line-height:1.3}',
'#smxRoot .it .s{font-size:.68rem;color:#B7CFD6;margin-top:2px}',
'#smxRoot .lines{display:flex;flex-direction:column;gap:6px;font-size:.8rem;color:#C9DDE3}',
'#smxRoot .ln{display:flex;justify-content:space-between;gap:10px;font-variant-numeric:tabular-nums}',
'#smxRoot .ln.tot{border-top:1px solid rgba(255,255,255,.24);margin-top:6px;padding-top:10px;color:#fff;font-weight:700}',
'#smxRoot .ln.tot span:last-child{color:#E8B04B;font-size:1.3rem}',
'#smxRoot .esc{display:flex;gap:9px;font-size:.7rem;line-height:1.5;color:#B7CFD6;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.14);border-radius:4px;padding:10px}',
'#smxRoot .esc svg{flex-shrink:0;color:#E8B04B;margin-top:1px}',
'#smxRoot .sec{margin-top:auto;display:flex;flex-wrap:wrap;gap:6px}',
'#smxRoot .sec span{display:inline-flex;align-items:center;gap:5px;font-size:.6rem;font-weight:600;border:1px solid rgba(255,255,255,.24);border-radius:12px;padding:4px 9px;color:#C9DDE3}',
'#smxRoot .main{padding:22px 26px 26px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;max-height:min(78vh,740px);background:#fff}',
'#smxRoot .main::-webkit-scrollbar{width:10px}',
'#smxRoot .main::-webkit-scrollbar-track{background:#F1F5F9}',
'#smxRoot .main::-webkit-scrollbar-thumb{background:#177A93;border-radius:6px;border:2px solid #F1F5F9}',
'#smxRoot .main::-webkit-scrollbar-thumb:hover{background:#0F4C5C}',
'@media(max-width:880px){#smxRoot .main{max-height:none}}',
'#smxRoot .ttl{font-size:1rem;font-weight:700;display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
'#smxRoot .ttl small{font-weight:600;font-size:.82rem;color:#0F4C5C;font-variant-numeric:tabular-nums}',
'#smxRoot .lbl{font-size:.67rem;letter-spacing:.11em;text-transform:uppercase;font-weight:800;color:#475569}',
'#smxRoot .mg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
'@media(max-width:560px){#smxRoot .mg{grid-template-columns:repeat(2,1fr)}}',
'#smxRoot .mt{position:relative;display:flex;flex-direction:column;gap:5px;align-items:flex-start;padding:11px 12px;border:1px solid #E2E8F0;border-radius:6px;background:#fff;text-align:left;min-height:78px;transition:.16s}',
'#smxRoot .mt:hover{border-color:#177A93;background:#EFF7F9;transform:translateY(-2px)}',
'#smxRoot .mt.on{border-color:#0F4C5C;background:#EFF7F9;box-shadow:0 0 0 1px #0F4C5C}',
'#smxRoot .mt.on:after{content:"";position:absolute;top:8px;right:8px;width:14px;height:14px;border-radius:50%;background:#0F4C5C;box-shadow:inset 0 0 0 3px #fff}',
'#smxRoot .mt .mk{height:20px;display:flex;align-items:center}',
'#smxRoot .mt .l{font-size:.8rem;font-weight:600;line-height:1.2}',
'#smxRoot .mt .s{font-size:.65rem;color:#475569;line-height:1.3}',
'#smxRoot .mt .tg{position:absolute;bottom:8px;right:8px;font-size:.55rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;background:#FBF0DC;color:#8A5A12;padding:2px 6px;border-radius:3px}',
'#smxRoot .fld label{display:block;font-size:.76rem;font-weight:600;margin-bottom:5px;color:#475569}',
'#smxRoot .in{width:100%;height:44px;padding:0 12px;border:1px solid #E2E8F0;border-radius:6px;background:#fff;font-size:.94rem;font-variant-numeric:tabular-nums;transition:.15s}',
'#smxRoot .in:focus{outline:none;border-color:#0F4C5C;box-shadow:0 0 0 3px #DCEEF2}',
'#smxRoot .in.bad{border-color:#991B1B;box-shadow:0 0 0 3px #FEF2F2}',
'#smxRoot .in[readonly]{background:#F8FAFC;color:#475569}',
'#smxRoot .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
'#smxRoot .nw{position:relative}.nw .in{padding-right:58px}',
'#smxRoot .bi{position:absolute;right:11px;top:50%;transform:translateY(-50%);display:flex;color:#475569}',
'#smxRoot .er{color:#991B1B;font-size:.72rem;margin-top:4px;display:flex;gap:5px;align-items:center}',
'#smxRoot .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:6px;font-weight:700;font-size:.92rem;transition:.16s;border:1px solid transparent}',
'#smxRoot .btn:active{transform:translateY(1px)}',
'#smxRoot .b1{background:#0F4C5C;color:#fff}#smxRoot .b1:hover{background:#0A3540}',
'#smxRoot .b2{border-color:#CBD5E1;background:#fff}#smxRoot .b2:hover{border-color:#0F4C5C;color:#0F4C5C;background:#EFF7F9}',
'#smxRoot .b3{color:#475569}#smxRoot .b3:hover{background:#F1F5F9;color:#0F172A}',
'#smxRoot .bb{width:100%}',
'#smxRoot .foot{font-size:.66rem;color:#94A3B8;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}',
'#smxRoot .card3{perspective:1300px;height:184px;max-width:326px;width:100%;margin:2px auto 4px}',
'#smxRoot .c3i{position:relative;width:100%;height:100%;transition:transform .65s cubic-bezier(.22,.9,.3,1);transform-style:preserve-3d}',
'#smxRoot .card3.flip .c3i{transform:rotateY(180deg)}',
'#smxRoot .face{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;padding:17px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 18px 38px -14px rgba(6,42,51,.6);overflow:hidden;background:linear-gradient(135deg,#1E293B,#0F172A)}',
'#smxRoot .face:after{content:"";position:absolute;inset:0;background:radial-gradient(230px 120px at 88% -12%,rgba(255,255,255,.3),transparent 62%)}',
'#smxRoot .card3.visa .front{background:linear-gradient(135deg,#16307F,#0F4C5C)}',
'#smxRoot .card3.mastercard .front{background:linear-gradient(135deg,#7F2410,#B45309)}',
'#smxRoot .card3.amex .front{background:linear-gradient(135deg,#0C5F51,#136276)}',
'#smxRoot .card3.discover .front{background:linear-gradient(135deg,#A8480A,#8A5A12)}',
'#smxRoot .ctop{display:flex;align-items:center;gap:10px;position:relative;z-index:1}',
'#smxRoot .chip{width:36px;height:27px;border-radius:5px;background:linear-gradient(135deg,#F0CE86,#B45309);position:relative;flex-shrink:0}',
'#smxRoot .chip:before{content:"";position:absolute;inset:5px 6px;border:1px solid rgba(0,0,0,.32);border-radius:3px}',
'#smxRoot .cbrand{margin-left:auto;display:flex;align-items:center;font-weight:800}',
'#smxRoot .cnum{font-size:1.15rem;letter-spacing:.07em;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px rgba(0,0,0,.45);white-space:nowrap;position:relative;z-index:1}',
'#smxRoot .cbot{display:flex;justify-content:space-between;gap:12px;position:relative;z-index:1}',
'#smxRoot .cl{display:block;font-size:.54rem;letter-spacing:.13em;text-transform:uppercase;opacity:.72}',
'#smxRoot .cv{font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}',
'#smxRoot .back{transform:rotateY(180deg);padding:0;justify-content:flex-start}',
'#smxRoot .stripe{height:38px;background:#080D16;margin-top:17px}',
'#smxRoot .cvcbar{margin:15px 17px;background:#fff;color:#0F172A;border-radius:4px;height:32px;display:flex;align-items:center;justify-content:flex-end;padding:0 12px;font-variant-numeric:tabular-nums;font-weight:700;letter-spacing:.18em}',
'#smxRoot .cbb{margin:auto 17px 15px auto;opacity:.85;position:relative;z-index:1}',
'#smxRoot .tc{border:1px dashed #CBD5E1;border-radius:6px;padding:11px 12px;background:#F8FAFC}',
'#smxRoot .tch{display:flex;align-items:center;gap:7px;font-size:.66rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#8A5A12;margin-bottom:8px}',
'#smxRoot .tcg{display:flex;flex-wrap:wrap;gap:6px}',
'#smxRoot .chipbtn{font-size:.69rem;font-weight:600;padding:5px 10px;border-radius:14px;border:1px solid #E2E8F0;background:#fff;color:#475569;font-variant-numeric:tabular-nums;transition:.15s}',
'#smxRoot .chipbtn:hover{transform:translateY(-1px);border-color:#177A93;color:#0F4C5C}',
'#smxRoot .chipbtn.ok{border-color:#BBE5C8;color:#166534}',
'#smxRoot .chipbtn.wa{border-color:#F1D9A8;color:#854D0E}',
'#smxRoot .chipbtn.ba{border-color:#F3C6C6;color:#991B1B}',
'#smxRoot .bp{border:1px solid #E2E8F0;border-radius:6px;overflow:hidden}',
'#smxRoot .bph{padding:13px 16px;display:flex;align-items:center;gap:9px;font-weight:800;font-size:1rem;color:#fff}',
'#smxRoot .bpb{padding:15px;display:flex;flex-direction:column;gap:10px;background:#F8FAFC}',
'#smxRoot .bpr{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.82rem;background:#fff;border:1px solid #E2E8F0;border-radius:4px;padding:10px 12px}',
'#smxRoot .bpr b{font-variant-numeric:tabular-nums}',
'#smxRoot .pp{background:#003087}.pp i{color:#009CDE;font-style:normal}',
'#smxRoot .ap{background:#000}.gp{background:#fff;color:#3C4043;border-bottom:1px solid #E2E8F0}',
'#smxRoot .kl{background:#FFB3C7;color:#17120F}.sp{background:#0F4C5C}',
'#smxRoot .bio{display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px 0}',
'#smxRoot .ring{width:74px;height:74px;border-radius:50%;border:3px solid #DCEEF2;display:flex;align-items:center;justify-content:center;color:#0F4C5C}',
'#smxRoot .ring.scan{border-color:#177A93;animation:sxpulse 1.1s ease-in-out infinite}',
'@keyframes sxpulse{0%,100%{box-shadow:0 0 0 0 rgba(23,122,147,.35)}50%{box-shadow:0 0 0 12px rgba(23,122,147,0)}}',
'#smxRoot .inst{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid #E2E8F0;border-radius:4px;padding:10px 12px;font-size:.82rem}',
'#smxRoot .inst.now{border-color:#177A93;background:#EFF7F9}',
'#smxRoot .inn{width:24px;height:24px;border-radius:50%;background:#F1F5F9;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#475569;flex-shrink:0}',
'#smxRoot .inst.now .inn{background:#0F4C5C;color:#fff}',
'#smxRoot .ind{font-size:.7rem;color:#475569}',
'#smxRoot .ina{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}',
'#smxRoot .mand{display:flex;gap:9px;align-items:flex-start;font-size:.73rem;color:#475569;line-height:1.5;background:#fff;border:1px solid #E2E8F0;border-radius:4px;padding:11px}',
'#smxRoot .mand input{margin-top:2px;accent-color:#0F4C5C;flex-shrink:0}',
'#smxRoot .sim{display:flex;align-items:center;gap:9px;font-size:.75rem;color:#475569;cursor:pointer}',
'#smxRoot .sim input{accent-color:#991B1B}',
'#smxRoot .ship{display:flex;flex-direction:column;gap:8px}',
'#smxRoot .so{display:flex;align-items:center;gap:11px;padding:11px 13px;border:1px solid #E2E8F0;border-radius:6px;cursor:pointer;transition:.15s}',
'#smxRoot .so:hover{border-color:#177A93}',
'#smxRoot .so.on{border-color:#0F4C5C;background:#EFF7F9;box-shadow:0 0 0 1px #0F4C5C}',
'#smxRoot .so input{accent-color:#0F4C5C}',
'#smxRoot .so .st{font-weight:600;font-size:.86rem}',
'#smxRoot .so .ss{font-size:.73rem;color:#475569}',
'#smxRoot .so .sp2{margin-left:auto;font-weight:700;font-size:.86rem;font-variant-numeric:tabular-nums}',
'#smxRoot .proc{display:flex;flex-direction:column;align-items:center;gap:18px;padding:34px 10px;text-align:center}',
'#smxRoot .spin{width:54px;height:54px;border-radius:50%;border:4px solid #DCEEF2;border-top-color:#0F4C5C;animation:sxspin 1s linear infinite}',
'@keyframes sxspin{to{transform:rotate(360deg)}}',
'#smxRoot .steps{width:100%;max-width:330px;display:flex;flex-direction:column;gap:11px;text-align:left}',
'#smxRoot .stp{display:flex;align-items:center;gap:10px;font-size:.83rem;color:#94A3B8}',
'#smxRoot .si{width:22px;height:22px;border-radius:50%;border:2px solid #E2E8F0;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}',
'#smxRoot .stp.act{color:#0F4C5C;font-weight:600}',
'#smxRoot .stp.act .si{border-color:#0F4C5C;border-top-color:transparent;animation:sxspin .9s linear infinite}',
'#smxRoot .stp.ok{color:#166534}#smxRoot .stp.ok .si{background:#166534;border-color:#166534;animation:none}',
'#smxRoot .pid{font-size:.66rem;color:#94A3B8;font-variant-numeric:tabular-nums}',
'#smxRoot .tds{display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;padding:16px 10px}',
'#smxRoot .bank{display:flex;align-items:center;gap:10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 16px;font-weight:700;color:#0F4C5C}',
'#smxRoot .otp{display:flex;gap:7px}',
'#smxRoot .otp input{width:42px;height:52px;text-align:center;font-size:1.28rem;font-weight:700;border:1px solid #E2E8F0;border-radius:6px;font-variant-numeric:tabular-nums}',
'#smxRoot .otp input:focus{outline:none;border-color:#0F4C5C;box-shadow:0 0 0 3px #DCEEF2}',
'#smxRoot .hint{font-size:.72rem;color:#1D4ED8;background:#EFF4FF;border:1px solid #C7D7FE;border-radius:4px;padding:7px 12px;display:flex;gap:6px;align-items:center;justify-content:center}',
'#smxRoot .res{display:flex;flex-direction:column;align-items:center;gap:13px;text-align:center;padding:22px 10px}',
'#smxRoot .rico{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}',
'#smxRoot .res.ok .rico{background:#166534;animation:sxpop2 .5s cubic-bezier(.22,.9,.3,1)}',
'#smxRoot .res.no .rico{background:#991B1B;animation:sxshake .42s}',
'@keyframes sxpop2{0%{transform:scale(.35);opacity:0}68%{transform:scale(1.14)}100%{transform:scale(1)}}',
'@keyframes sxshake{0%,100%{transform:none}22%{transform:translateX(-8px)}72%{transform:translateX(8px)}}',
'#smxRoot .amt{font-size:1.66rem;font-weight:800;color:#0F4C5C;font-variant-numeric:tabular-nums}',
'#smxRoot .res.no .amt{color:#991B1B}',
'#smxRoot .res p{font-size:.84rem;color:#475569;max-width:360px}',
'#smxRoot .rc{width:100%;max-width:380px;border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;text-align:left}',
'#smxRoot .rch{background:#F8FAFC;padding:9px 14px;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#475569;display:flex;justify-content:space-between;gap:8px}',
'#smxRoot .rcb{padding:11px 14px;display:flex;flex-direction:column;gap:7px;font-size:.81rem}',
'#smxRoot .rr{display:flex;justify-content:space-between;gap:12px}',
'#smxRoot .rr span:first-child{color:#475569}',
'#smxRoot .rr span:last-child{font-weight:600;font-variant-numeric:tabular-nums;text-align:right}',
'#smxRoot .acts{display:flex;gap:9px;flex-wrap:wrap;justify-content:center}',
'#smxRoot .olist{display:flex;flex-direction:column;gap:12px}',
'#smxRoot .oc{border:1px solid #E2E8F0;border-radius:6px;overflow:hidden}',
'#smxRoot .ocm{display:flex;gap:13px;padding:13px;flex-wrap:wrap}',
'#smxRoot .ocm img{width:58px;height:78px;object-fit:cover;border-radius:4px;background:#F1F5F9;flex-shrink:0}',
'#smxRoot .ocb{flex:1;min-width:190px}',
'#smxRoot .oct{font-weight:600;font-size:.9rem;line-height:1.3}',
'#smxRoot .oci{font-size:.69rem;color:#94A3B8;margin-top:3px;font-variant-numeric:tabular-nums}',
'#smxRoot .tag{display:inline-flex;align-items:center;gap:5px;font-size:.66rem;font-weight:700;padding:3px 9px;border-radius:12px;border:1px solid #E2E8F0;background:#F8FAFC;color:#475569;margin-top:7px;margin-right:5px}',
'#smxRoot .tag.e{background:#FEF9EC;border-color:#F1D9A8;color:#854D0E}',
'#smxRoot .tag.s{background:#EFF4FF;border-color:#C7D7FE;color:#1D4ED8}',
'#smxRoot .tag.d{background:#ECFDF3;border-color:#BBE5C8;color:#166534}',
'#smxRoot .ocs{text-align:right;display:flex;flex-direction:column;justify-content:center;gap:6px}',
'#smxRoot .octot{font-size:1.1rem;font-weight:800;font-variant-numeric:tabular-nums}',
'#smxRoot .bar{height:6px;border-radius:3px;background:#F1F5F9;overflow:hidden;margin:0 13px}',
'#smxRoot .bar i{display:block;height:100%;background:linear-gradient(90deg,#0F4C5C,#D97706);transition:width .6s}',
'#smxRoot .barn{display:flex;justify-content:space-between;font-size:.69rem;color:#475569;padding:6px 13px 12px}',
'#smxRoot .oca{display:flex;gap:8px;flex-wrap:wrap;padding:11px 13px;border-top:1px solid #E2E8F0;background:#F8FAFC}',
'#smxRoot .oca .btn{padding:7px 13px;font-size:.79rem}',
'#smxRoot .empty{text-align:center;padding:40px 16px;color:#475569}',
'#smxRoot .empty .ei{width:60px;height:60px;border-radius:50%;background:#F1F5F9;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:#94A3B8}',
'#smxRoot .empty h3{font-size:1.02rem;color:#0F172A;margin-bottom:6px}',
'#smxRoot .empty p{font-size:.85rem;margin-bottom:16px}',
'#smxRoot .fatal{margin:16px;border:1px solid #F3C6C6;background:#FEF2F2;border-radius:8px;padding:16px;color:#991B1B;font-size:.82rem}',
'#smxRoot .fatal b{display:block;margin-bottom:6px;font-size:.9rem}',
'#smxRoot .fatal code{display:block;margin-top:8px;background:#fff;border:1px solid #F3C6C6;border-radius:4px;padding:8px;font-size:.72rem;word-break:break-word;color:#7F1D1D}',
'#smxRoot .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#0F172A;color:#fff;padding:12px 20px;border-radius:6px;font-size:.86rem;font-weight:500;z-index:9100;box-shadow:0 12px 30px -8px rgba(0,0,0,.5);border-left:3px solid #177A93;animation:sxup .3s;display:flex;gap:9px;align-items:center;max-width:90vw}',
'#smxRoot .toast.ok{border-left-color:#22C55E}#smxRoot .toast.no{border-left-color:#EF4444}',
'@keyframes sxup{from{opacity:0;transform:translate(-50%,20px)}}'
  ].join('');

  /* ==========================================================
     4. METODI
     ========================================================== */
  var APPLE = '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1.1 2.6-2.2.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.6-1-2.6-3.6zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z"/></svg>';
  var GOOG = '<svg width="19" height="19" viewBox="0 0 24 24"><path fill="#4285F4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z"/><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z"/><path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3z"/><path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1z"/></svg>';
  var MARK = {
    card: ic('card', 20),
    paypal: '<span style="font-weight:800;font-style:italic;font-size:.95rem;color:#003087">Pay<span style="color:#009CDE">Pal</span></span>',
    applepay: APPLE + '<span style="font-weight:600;font-size:.9rem;margin-left:3px">Pay</span>',
    googlepay: GOOG + '<span style="font-weight:600;font-size:.9rem;margin-left:3px;color:#3C4043">Pay</span>',
    klarna: '<span style="background:#FFB3C7;color:#17120F;padding:3px 8px;border-radius:5px;font-weight:800;font-size:.76rem">Klarna</span>',
    sepa: ic('bank', 20)
  };
  var METHODS = [
    { id: 'card', l: 'Carta', s: 'Visa · MC · Amex', t: '' },
    { id: 'paypal', l: 'PayPal', s: 'Saldo o conto', t: '' },
    { id: 'applepay', l: 'Apple Pay', s: 'Face ID', t: 'Express' },
    { id: 'googlepay', l: 'Google Pay', s: 'Impronta', t: 'Express' },
    { id: 'klarna', l: 'Klarna', s: '3 rate senza interessi', t: '3 rate' },
    { id: 'sepa', l: 'Bonifico SEPA', s: 'Addebito IBAN', t: '' }
  ];
  var TESTS = [
    { n: '4242424242424242', l: 'Visa · successo', c: 'ok', b: 'success' },
    { n: '5555555555554444', l: 'MC · successo', c: 'ok', b: 'success' },
    { n: '378282246310005', l: 'Amex · successo', c: 'ok', b: 'success' },
    { n: '4000002500003155', l: '3D Secure', c: 'wa', b: '3ds' },
    { n: '4000000000000002', l: 'Rifiutata', c: 'ba', b: 'decline', r: 'carta' },
    { n: '4000000000009995', l: 'Fondi insuff.', c: 'ba', b: 'decline', r: 'fondi' },
    { n: '4000000000000069', l: 'Scaduta', c: 'ba', b: 'decline', r: 'scaduta' },
    { n: '4000000000000127', l: 'CVC errato', c: 'ba', b: 'decline', r: 'cvc' }
  ];
  var DECL = {
    carta: 'La carta è stata rifiutata dall\u2019emittente (generic_decline). Verifica i dati o usa un altro metodo.',
    fondi: 'Fondi insufficienti sulla carta (insufficient_funds). Usa un altro metodo di pagamento.',
    scaduta: 'La carta risulta scaduta (expired_card). Aggiorna la scadenza o usa un\u2019altra carta.',
    cvc: 'Il codice di sicurezza non è corretto (incorrect_cvc). Ricontrolla le cifre sul retro.',
    auth: 'Autenticazione 3D Secure non riuscita (authentication_failed). Pagamento non autorizzato.',
    pp: 'Il saldo PayPal non è sufficiente a coprire l\u2019importo (simulazione di rifiuto).',
    kl: 'La valutazione creditizia Klarna non ha approvato il piano rateale.',
    se: 'Il mandato SEPA non è stato accettato dall\u2019istituto bancario (mandate_rejected).'
  };
  var TEST_IBAN = 'IT60X0542811101000000123456';
  var STAGES = {
    card: ['Crittografia dei dati della carta', 'Autorizzazione con l\u2019emittente', 'Controllo antifrode', 'Acquisizione del pagamento'],
    paypal: ['Reindirizzamento a PayPal', 'Autenticazione del conto', 'Autorizzazione dell\u2019addebito', 'Ritorno a SoundMarket'],
    applepay: ['Tokenizzazione Secure Enclave', 'Verifica biometrica', 'Autorizzazione del network', 'Acquisizione del pagamento'],
    googlepay: ['Tokenizzazione Titan M2', 'Verifica biometrica', 'Autorizzazione del network', 'Acquisizione del pagamento'],
    klarna: ['Verifica dell\u2019identità', 'Valutazione creditizia istantanea', 'Attivazione del piano rateale', 'Addebito della prima rata'],
    sepa: ['Validazione IBAN', 'Registrazione del mandato', 'Trasmissione alla banca', 'Prenotazione dell\u2019addebito']
  };

  /* ==========================================================
     5. STATO
     ========================================================== */
  var S = null, timers = [], otpT = null, tick = null, root = null, hijackBusy = false;
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; if (otpT) { clearInterval(otpT); otpT = null; } }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function toast(msg, kind) {
    if (!root) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = ic(kind === 'ok' ? 'check' : kind === 'no' ? 'alert' : 'info', 16, 2.2) + '<span>' + esc(msg) + '</span>';
    root.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .25s'; t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); }, 2900);
  }

  /* ==========================================================
     6. VALIDATORI
     ========================================================== */
  function brandOf(d) {
    if (/^4/.test(d)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    if (/^6(011|5)/.test(d)) return 'discover';
    return 'generic';
  }
  function brandName(b) { return { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover' }[b] || 'Carta'; }
  function maxLen(b) { return b === 'amex' ? 15 : 16; }
  function cvcLen(b) { return b === 'amex' ? 4 : 3; }
  function grp(d, b) {
    if (b === 'amex') return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
    return (d.match(/.{1,4}/g) || []).join(' ');
  }
  function luhn(d) {
    if (!d) return false;
    var sum = 0, alt = false;
    for (var i = d.length - 1; i >= 0; i--) { var n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
    return sum % 10 === 0;
  }
  function logo(b) {
    if (b === 'visa') return '<span style="font-style:italic;font-weight:900;font-size:1rem">VISA</span>';
    if (b === 'mastercard') return '<svg width="34" height="22" viewBox="0 0 34 22"><circle cx="13" cy="11" r="9" fill="#EB001B"/><circle cx="21" cy="11" r="9" fill="#F79E1B" fill-opacity=".88"/></svg>';
    if (b === 'amex') return '<span style="font-weight:900;font-size:.72rem;background:#fff;color:#0C5F51;padding:3px 6px;border-radius:3px">AMEX</span>';
    if (b === 'discover') return '<span style="font-weight:800;font-size:.72rem">DISCOVER</span>';
    return ic('card', 20);
  }
  function ibanOk(raw) {
    var s = String(raw || '').replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    var re = s.slice(4) + s.slice(0, 4), rem = 0;
    for (var i = 0; i < re.length; i++) {
      var ch = re.charAt(i), v = ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch;
      for (var j = 0; j < v.length; j++) rem = (rem * 10 + (+v.charAt(j))) % 97;
    }
    return rem === 1;
  }
  function ibanFmt(v) { return (String(v).replace(/\s/g, '').toUpperCase().match(/.{1,4}/g) || []).join(' '); }
  function pad(d, n) { d = String(d); while (d.length < n) d += '\u2022'; return d; }

  /* ==========================================================
     7. DISPONIBILITÀ
     ========================================================== */
  function availability(it) {
    var u = session();
    if (u && it.sellerEmail === u.email) return { ok: false, why: 'own' };
    var st = statusOf(it.sku);
    if (st === 'available') return { ok: true };
    var os = orders(), active = null;
    for (var i = 0; i < os.length; i++) if (os[i].sku === it.sku && !os[i].confirmedAt && !os[i].refundedAt) { active = os[i]; break; }
    if (active) return { ok: false, why: 'active', order: active };
    if (st === 'sold') return { ok: false, why: 'sold' };
    setStatus(it.sku, null);
    return { ok: true, healed: true };
  }

  /* ==========================================================
     8. APERTURA
     ========================================================== */
  function ensureRoot() {
    if (root && root.parentNode) return;
    if (!$('#smxStyle')) {
      var st = document.createElement('style');
      st.id = 'smxStyle'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    root = document.createElement('div');
    root.id = 'smxRoot';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('focusin', onFocus);
    root.addEventListener('focusout', onBlur);
    root.addEventListener('keydown', onKey);
  }
  function close() {
    clearTimers();
    if (tick) { clearInterval(tick); tick = null; }
    if (root) { root.classList.remove('on'); root.innerHTML = ''; }
    S = null; hijackBusy = false;
    document.body.style.overflow = '';
  }
  function show() { ensureRoot(); root.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function fatal(err) {
    clearTimers(); show();
    root.innerHTML = '<div class="scrim" data-x="close"></div><div class="wrap"><div class="box slim">' +
      '<div class="head">' + ic('alert', 16, 2) + '<b>Segnalazione tecnica</b><button class="hx" data-x="close">' + ic('x', 18, 2) + '</button></div>' +
      '<div class="fatal"><b>Il checkout ha intercettato un errore e lo ha bloccato in sicurezza.</b>Nessun addebito è stato effettuato.' +
      '<code>' + esc(err && err.message ? err.message : String(err)) + '</code></div>' +
      '<div style="padding:0 16px 16px"><button class="btn b1 bb" data-x="close">Chiudi</button></div></div></div>';
  }
  function blankState(it) {
    return {
      item: it, price: it ? it.price : 0, ship: 'pickup', method: 'card',
      card: { d: '', e: '', c: '', n: '' }, pp: { decline: false },
      kl: { phone: '', decline: false }, se: { iban: '', holder: '', mand: false, decline: false },
      err: {}, flip: false, authMode: 'login', authErr: '',
      intent: 'pi_' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6),
      payment: null, decline: null, step: 'form'
    };
  }
  function open(sku, agreed, shipMethod) {
    try {
      clearTimers();
      if (tick) { clearInterval(tick); tick = null; }
      appCloseModal();
      var it = findItem(sku);
      if (!it) { blocked('missing', null, null); return; }
      var av = availability(it);
      if (!av.ok) { blocked(av.why, it, av.order || null); return; }
      S = blankState(it);
      S.price = (agreed != null && !isNaN(agreed) && Number(agreed) > 0) ? Number(agreed) : it.price;
      if (shipMethod === 'home' || shipMethod === 'pickup') S.ship = shipMethod;
      S.step = session() ? 'form' : 'auth';
      show(); paint();
      if (av.healed) { appRefresh(); toast('Disponibilità dell\u2019articolo ripristinata.', 'ok'); }
    } catch (e) { fatal(e); }
  }
  function blocked(why, it, order) {
    show();
    var head = '<div class="head">' + ic('info', 16, 2) + '<b>Stato dell\u2019articolo</b><button class="hx" data-x="close">' + ic('x', 18, 2) + '</button></div>';
    var body, acts;
    if (why === 'missing') {
      body = '<div class="ei">' + ic('alert', 26) + '</div><h3>Inserzione non trovata</h3><p>L\u2019articolo è stato rimosso dal catalogo o il link non è più valido.</p>';
      acts = '<button class="btn b1" data-x="close">Torna al catalogo</button>';
    } else if (why === 'own') {
      body = '<div class="ei">' + ic('user', 26) + '</div><h3>Questo è un tuo annuncio</h3><p>Non puoi acquistare un articolo che hai pubblicato. Gestiscilo dalla tua area personale.</p>';
      acts = '<button class="btn b1" data-x="close">Ho capito</button>';
    } else if (why === 'active') {
      body = '<div class="ei">' + ic('box', 26) + '</div><h3>Hai già un ordine attivo</h3><p>' + esc(it.title) + ' è riservato per il tuo ordine <b>' + esc(order.id) + '</b>.</p>';
      acts = '<button class="btn b1" data-x="orders">' + ic('box', 15) + 'Apri i miei acquisti</button><button class="btn b2" data-x="close">Chiudi</button>';
    } else {
      body = '<div class="ei">' + ic('check', 26) + '</div><h3>Articolo già venduto</h3><p>La transazione per questo articolo è conclusa.</p>';
      acts = '<button class="btn b1" data-x="orders">' + ic('box', 15) + 'I miei acquisti</button><button class="btn b2" data-x="close">Torna al catalogo</button>';
    }
    root.innerHTML = '<div class="scrim" data-x="close"></div><div class="wrap"><div class="box slim">' + head +
      '<div class="empty">' + body + '<div class="acts">' + acts + '</div></div></div></div>';
  }
  function totals() {
    var fee = feeOf(S.price), base = shipOf(S.item.size);
    var sh = S.ship === 'home' ? r2(base + 2) : base;
    return { fee: fee, ship: sh, total: r2(S.price + fee + sh) };
  }

  /* ==========================================================
     9. RENDER
     ========================================================== */
  function paint() {
    if (!S || !root) return;
    var t = totals(), body;
    if (S.step === 'auth') body = authView();
    else if (S.step === 'processing') body = procView();
    else if (S.step === '3ds') body = tdsView();
    else if (S.step === 'success') body = okView();
    else if (S.step === 'decline') body = noView();
    else if (S.step === 'orders') body = ordersView();
    else body = formView();
    var title = S.step === 'orders' ? 'I miei acquisti' : 'Checkout protetto · SoundMarket';
    var canClose = !(S.step === 'processing' || S.step === '3ds');
    root.innerHTML = '<div class="scrim"' + (canClose ? ' data-x="close"' : '') + '></div><div class="wrap"><div class="box">' +
      '<div class="head">' + ic(S.step === 'orders' ? 'box' : 'lock', 16, 2) + '<b>' + title + '</b>' +
      (canClose ? '<button class="hx" data-x="close" aria-label="Chiudi">' + ic('x', 18, 2) + '</button>' : '') + '</div>' +
      '<div class="grid">' + sideHTML(t) + '<section class="main" id="smxMain">' + body + '</section></div></div></div>';
    if (S.step === 'form' && S.method === 'card') visual();
    if (S.step === '3ds') { var f = $('.otp input', root); if (f) f.focus(); }
    var m = $('#smxMain', root); if (m) m.scrollTop = 0;
  }
  function sideHTML(t) {
    var it = S.item;
    return '<aside class="side">' +
      '<div class="merch"><span class="mk">' + ic('logo', 18, 1.8) + '</span><div><b>SoundMarket</b><i>Transazione tutelata</i></div></div>' +
      '<span class="tb">' + ic('alert', 11, 2.4) + 'Modalità test</span>' +
      '<div class="it"><img src="' + esc(it.images[0]) + '" alt="" data-smximg="1" referrerpolicy="no-referrer">' +
      '<div><div class="t">' + esc(it.title) + '</div><div class="s">@' + esc(it.seller.name) + ' · ' + esc(it.grading) + '</div></div></div>' +
      '<div class="lines">' +
      '<div class="ln"><span>Articolo</span><span>' + money(S.price) + '</span></div>' +
      '<div class="ln"><span>Protezione Acquisti</span><span>' + money(t.fee) + '</span></div>' +
      '<div class="ln"><span>Spedizione</span><span>' + money(t.ship) + '</span></div>' +
      '<div class="ln tot"><span>Totale</span><span>' + money(t.total) + '</span></div></div>' +
      '<div class="esc">' + ic('lock', 15) + '<span>Importo vincolato in escrow e sbloccato al venditore solo dopo la tua conferma di ricezione. Finestra di contestazione: 48 ore.</span></div>' +
      '<div class="sec"><span>' + ic('lock', 11, 2) + 'TLS 1.3</span><span>' + ic('shieldCheck', 11, 2) + 'PCI-DSS</span><span>' + ic('shield', 11, 2) + '3DS2</span></div>' +
      '</aside>';
  }
  function authView() {
    var m = S.authMode;
    return '<div class="ttl">Accedi per completare l\u2019acquisto</div>' +
      '<p style="font-size:.84rem;color:#475569">L\u2019ordine viene associato al tuo account per garantire ricevuta, tracking e Protezione Acquisti.</p>' +
      '<div style="display:flex;background:#F1F5F9;border-radius:6px;padding:4px;gap:4px">' +
      '<button class="btn ' + (m === 'login' ? 'b2' : 'b3') + '" style="flex:1;padding:8px" data-x="authmode" data-m="login">Accedi</button>' +
      '<button class="btn ' + (m === 'register' ? 'b2' : 'b3') + '" style="flex:1;padding:8px" data-x="authmode" data-m="register">Registrati</button></div>' +
      (m === 'register' ? '<div class="fld"><label>Nome e cognome</label><input class="in" id="smxName" placeholder="Mario Rossi"></div>' : '') +
      '<div class="fld"><label>Email</label><input class="in" id="smxEmail" type="email" placeholder="utente@esempio.it"></div>' +
      '<div class="fld"><label>Password</label><input class="in" id="smxPass" type="password" placeholder="' + (m === 'login' ? 'La tua password' : 'Minimo 6 caratteri') + '"></div>' +
      (S.authErr ? '<div class="er">' + ic('alert', 13, 2) + esc(S.authErr) + '</div>' : '') +
      '<button class="btn b1 bb" data-x="authgo">' + ic('lock', 16) + (m === 'login' ? 'Accedi e continua' : 'Crea account e continua') + '</button>' +
      '<div class="hint">' + ic('info', 13, 2) + 'Account demo: <b>demo@soundmarket.it</b> · password <b>demo123</b></div>';
  }
  function formView() {
    var t = totals();
    var head = '<div class="ttl">Scegli come pagare<small>' + money(t.total) + '</small></div>' +
      '<div class="mg">' + METHODS.map(function (m) {
        return '<button class="mt' + (S.method === m.id ? ' on' : '') + '" data-x="method" data-m="' + m.id + '">' +
          '<span class="mk">' + MARK[m.id] + '</span><span class="l">' + m.l + '</span><span class="s">' + m.s + '</span>' +
          (m.t ? '<span class="tg">' + m.t + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="lbl">Consegna</div><div class="ship">' +
      shipOpt('pickup', 'Punto di ritiro convenzionato', 'Poste · InPost · Fermopoint — 2–4 giorni', shipOf(S.item.size)) +
      shipOpt('home', 'Consegna a domicilio', 'Corriere espresso con firma', r2(shipOf(S.item.size) + 2)) +
      '</div><div class="lbl">Dati di pagamento</div>';
    if (S.method === 'card') return head + cardForm();
    if (S.method === 'paypal') return head + ppForm();
    if (S.method === 'applepay' || S.method === 'googlepay') return head + walletForm();
    if (S.method === 'klarna') return head + klForm();
    return head + seForm();
  }
  function shipOpt(id, t, s, cost) {
    return '<label class="so' + (S.ship === id ? ' on' : '') + '"><input type="radio" name="smxShip" value="' + id + '"' + (S.ship === id ? ' checked' : '') + '>' +
      '<span>' + ic(id === 'home' ? 'truck' : 'pin', 17) + '</span><span><span class="st">' + t + '</span><br><span class="ss">' + s + '</span></span>' +
      '<span class="sp2">' + money(cost) + '</span></label>';
  }
  function payBtn(label) {
    return '<button class="btn b1 bb" data-x="pay">' + ic('lock', 16) + label + '</button>' +
      '<div class="foot">' + ic('lock', 12) + 'Cifratura end-to-end · nessun addebito reale · simulazione didattica</div>';
  }
  function cardForm() {
    var b = brandOf(S.card.d), e = S.err;
    return card3(b) +
      '<div class="fld"><label>Email per la ricevuta</label><input class="in" value="' + esc((session() || {}).email || '') + '" readonly></div>' +
      '<div class="fld"><label>Numero carta</label><div class="nw">' +
      '<input class="in' + (e.num ? ' bad' : '') + '" id="smxNum" inputmode="numeric" placeholder="1234 1234 1234 1234" value="' + esc(grp(S.card.d, b)) + '">' +
      '<span class="bi">' + logo(b) + '</span></div>' + (e.num ? '<div class="er">' + ic('alert', 12, 2) + esc(e.num) + '</div>' : '') + '</div>' +
      '<div class="row">' +
      '<div class="fld"><label>Scadenza</label><input class="in' + (e.exp ? ' bad' : '') + '" id="smxExp" inputmode="numeric" placeholder="MM/AA" value="' + esc(S.card.e) + '">' + (e.exp ? '<div class="er">' + ic('alert', 12, 2) + esc(e.exp) + '</div>' : '') + '</div>' +
      '<div class="fld"><label>' + (b === 'amex' ? 'CID' : 'CVC') + '</label><input class="in' + (e.cvc ? ' bad' : '') + '" id="smxCvc" inputmode="numeric" placeholder="' + (b === 'amex' ? '1234' : '123') + '" value="' + esc(S.card.c) + '">' + (e.cvc ? '<div class="er">' + ic('alert', 12, 2) + esc(e.cvc) + '</div>' : '') + '</div></div>' +
      '<div class="fld"><label>Titolare</label><input class="in' + (e.name ? ' bad' : '') + '" id="smxHolderCard" placeholder="NOME COGNOME" value="' + esc(S.card.n) + '">' + (e.name ? '<div class="er">' + ic('alert', 12, 2) + esc(e.name) + '</div>' : '') + '</div>' +
      '<div class="tc"><div class="tch">' + ic('alert', 12, 2.2) + 'Carte di test — clicca per compilare</div><div class="tcg">' +
      TESTS.map(function (c) { return '<button class="chipbtn ' + c.c + '" data-x="test" data-n="' + c.n + '">' + esc(c.l) + '</button>'; }).join('') + '</div></div>' +
      payBtn('Paga ' + money(totals().total));
  }
  function card3(b) {
    return '<div class="card3 ' + b + (S.flip ? ' flip' : '') + '" id="smxCard"><div class="c3i">' +
      '<div class="face front"><div class="ctop"><span class="chip"></span>' +
      '<span style="color:rgba(255,255,255,.82);display:flex">' + ic('wave', 17, 2) + '</span>' +
      '<span class="cbrand">' + logo(b) + '</span></div>' +
      '<div class="cnum" id="smxPN">' + esc(grp(pad(S.card.d, maxLen(b)), b)) + '</div>' +
      '<div class="cbot"><div><span class="cl">Titolare</span><span class="cv" id="smxPNm">' + esc(S.card.n || 'NOME COGNOME') + '</span></div>' +
      '<div><span class="cl">Scadenza</span><span class="cv" id="smxPE">' + esc(S.card.e || 'MM/AA') + '</span></div></div></div>' +
      '<div class="face back"><div class="stripe"></div><div class="cvcbar"><span id="smxPC">' + esc(S.card.c || '\u2022\u2022\u2022') + '</span></div>' +
      '<div class="cbb">' + logo(b) + '</div></div></div></div>';
  }
  function ppForm() {
    var t = totals();
    return '<div class="bp"><div class="bph pp">Pay<i>Pal</i></div><div class="bpb">' +
      '<div class="bpr"><span>Conto</span><b>' + esc((session() || {}).email || 'utente@esempio.it') + '</b></div>' +
      '<div class="bpr"><span>Saldo disponibile</span><b>' + money(r2(t.total * 3.4)) + '</b></div>' +
      '<div class="bpr"><span>Fonte</span><span>Saldo PayPal · conto verificato</span></div>' +
      '<label class="sim"><input type="checkbox" id="smxPPd"' + (S.pp.decline ? ' checked' : '') + '>Simula rifiuto per saldo insufficiente</label>' +
      '</div></div>' + payBtn('Accedi a PayPal e paga ' + money(t.total));
  }
  function walletForm() {
    var apple = S.method === 'applepay', t = totals();
    return '<div class="bp"><div class="bph ' + (apple ? 'ap' : 'gp') + '">' + MARK[S.method] + '</div><div class="bpb">' +
      '<div class="bio"><div class="ring" id="smxRing">' + ic(apple ? 'face' : 'finger', 34, 1.5) + '</div>' +
      '<div style="font-size:.75rem;color:#475569">' + (apple ? 'Conferma con Face ID' : 'Conferma con impronta') + '</div></div>' +
      '<div class="bpr"><span>Carta collegata</span><b>Visa \u2022\u2022\u2022\u2022 4242</b></div>' +
      '<div class="bpr"><span>Dispositivo</span><span>' + (apple ? 'iPhone · Secure Enclave' : 'Android · Titan M2') + '</span></div>' +
      '</div></div>' + payBtn((apple ? 'Paga con Face ID · ' : 'Conferma con impronta · ') + money(t.total));
  }
  function klForm() {
    var t = totals().total, a = r2(Math.floor((t / 3) * 100) / 100), last = r2(t - a * 2);
    function d(n) { return dt(Date.now() + n * 30 * 86400000); }
    return '<div class="bp"><div class="bph kl">' + MARK.klarna + '<span style="font-size:.82rem;font-weight:600">3 rate senza interessi</span></div><div class="bpb">' +
      '<div class="inst now"><span class="inn">1</span><div><div>Prima rata</div><div class="ind">Oggi · ' + d(0) + '</div></div><span class="ina">' + money(a) + '</span></div>' +
      '<div class="inst"><span class="inn">2</span><div><div>Seconda rata</div><div class="ind">' + d(1) + '</div></div><span class="ina">' + money(a) + '</span></div>' +
      '<div class="inst"><span class="inn">3</span><div><div>Terza rata</div><div class="ind">' + d(2) + '</div></div><span class="ina">' + money(last) + '</span></div>' +
      '<div class="bpr"><span>TAEG</span><b>0,00%</b></div><div class="bpr"><span>Totale dovuto</span><b>' + money(t) + '</b></div></div></div>' +
      '<div class="fld"><label>Numero di cellulare</label><input class="in' + (S.err.phone ? ' bad' : '') + '" id="smxPhone" inputmode="tel" placeholder="+39 333 1234567" value="' + esc(S.kl.phone) + '">' +
      (S.err.phone ? '<div class="er">' + ic('alert', 12, 2) + esc(S.err.phone) + '</div>' : '') + '</div>' +
      '<label class="sim"><input type="checkbox" id="smxKLd"' + (S.kl.decline ? ' checked' : '') + '>Simula valutazione creditizia negativa</label>' +
      payBtn('Paga la prima rata · ' + money(a));
  }
  function seForm() {
    return '<div class="bp"><div class="bph sp">' + ic('bank', 18) + 'Addebito diretto SEPA Core</div><div class="bpb">' +
      '<div class="bpr"><span>Creditore</span><b>SoundMarket S.r.l.</b></div>' +
      '<div class="bpr"><span>ID creditore</span><b>IT98ZZZ000000123456</b></div>' +
      '<div class="bpr"><span>Mandato</span><b>' + esc(S.intent.toUpperCase().replace('PI_', 'MND-')) + '</b></div></div></div>' +
      '<div class="fld"><label>IBAN del conto di addebito</label><input class="in' + (S.err.iban ? ' bad' : '') + '" id="smxIban" placeholder="IT60 X054 2811 1010 0000 0123 456" value="' + esc(S.se.iban) + '">' +
      (S.err.iban ? '<div class="er">' + ic('alert', 12, 2) + esc(S.err.iban) + '</div>' : '') + '</div>' +
      '<div class="fld"><label>Intestatario del conto</label><input class="in' + (S.err.holder ? ' bad' : '') + '" id="smxHolder" placeholder="NOME COGNOME" value="' + esc(S.se.holder) + '">' +
      (S.err.holder ? '<div class="er">' + ic('alert', 12, 2) + esc(S.err.holder) + '</div>' : '') + '</div>' +
      '<div class="tc"><div class="tch">' + ic('alert', 12, 2.2) + 'IBAN di test</div><div class="tcg">' +
      '<button class="chipbtn ok" data-x="ibanok">IT60X0542811101000000123456 · valido</button>' +
      '<button class="chipbtn ba" data-x="ibanbad">IT00X0000000000000000000000 · non valido</button></div></div>' +
      '<label class="mand"><input type="checkbox" id="smxMand"' + (S.se.mand ? ' checked' : '') + '><span>Autorizzo SoundMarket S.r.l. a inviare istruzioni alla mia banca per l\u2019addebito del conto e la mia banca ad addebitarlo conformemente alle istruzioni. Ho diritto al rimborso secondo le condizioni del mio contratto (8 settimane dalla data di addebito).</span></label>' +
      (S.err.mand ? '<div class="er">' + ic('alert', 12, 2) + esc(S.err.mand) + '</div>' : '') +
      '<label class="sim"><input type="checkbox" id="smxSEd"' + (S.se.decline ? ' checked' : '') + '>Simula rifiuto del mandato dalla banca</label>' +
      payBtn('Autorizza addebito · ' + money(totals().total));
  }
  function procView() {
    return '<div class="proc"><div class="spin"></div><h3 style="font-size:1.02rem">Elaborazione del pagamento</h3>' +
      '<div class="steps" id="smxSteps">' + (STAGES[S.method] || STAGES.card).map(function (t, k) {
        return '<div class="stp" data-k="' + k + '"><span class="si"></span>' + t + '</div>';
      }).join('') + '</div><div class="pid">PaymentIntent ' + esc(S.intent) + '</div></div>';
  }
  function tdsView() {
    return '<div class="tds"><div class="bank">' + ic('shield', 18) + 'SoundBank · 3D Secure 2</div>' +
      '<p style="font-size:.84rem;color:#475569;max-width:330px">Per autorizzare <b>' + money(totals().total) + '</b> a favore di SoundMarket inserisci il codice monouso inviato al tuo dispositivo.</p>' +
      '<div class="otp">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<input inputmode="numeric" maxlength="1" data-otp="' + k + '" aria-label="Cifra ' + (k + 1) + '">'; }).join('') + '</div>' +
      '<div style="font-size:.73rem;color:#94A3B8" id="smxTimer">Il codice scade tra 60 s</div>' +
      '<div class="hint">' + ic('info', 13, 2) + 'Codice di test: <b>123456</b></div>' +
      '<div style="display:flex;gap:9px"><button class="btn b1" data-x="otp">Verifica e paga</button><button class="btn b3" data-x="otpcancel">Annulla</button></div></div>';
  }
  function mLabel(p) {
    if (p.method === 'card') return p.brand + ' \u2022\u2022\u2022\u2022 ' + p.last4;
    if (p.method === 'paypal') return 'PayPal · ' + p.account;
    if (p.method === 'applepay') return 'Apple Pay · Visa \u2022\u2022\u2022\u2022 4242';
    if (p.method === 'googlepay') return 'Google Pay · Visa \u2022\u2022\u2022\u2022 4242';
    if (p.method === 'klarna') return 'Klarna · 3 rate';
    return 'SEPA · ' + p.ibanMasked;
  }
  function rcHTML(p) {
    return '<div class="rc"><div class="rch"><span>Ricevuta</span><span>' + esc(p.receipt) + '</span></div><div class="rcb">' +
      '<div class="rr"><span>PaymentIntent</span><span>' + esc(p.id) + '</span></div>' +
      '<div class="rr"><span>Metodo</span><span>' + esc(mLabel(p)) + '</span></div>' +
      '<div class="rr"><span>Data</span><span>' + esc(dt(p.created) + ' · ' + tm(p.created)) + '</span></div>' +
      (p.threeDS ? '<div class="rr"><span>Autenticazione</span><span style="color:#166534">3DS2 superata</span></div>' : '') +
      (p.installments ? '<div class="rr"><span>Piano</span><span>3 × ' + money(p.installments[0].amount) + '</span></div>' : '') +
      '<div class="rr"><span>Stato</span><span style="color:#166534">' + esc(p.status) + '</span></div>' +
      '<div class="rr"><span>Importo</span><span>' + money(p.amount) + '</span></div></div></div>';
  }
  function okView() {
    var p = S.payment;
    return '<div class="res ok"><div class="rico">' + ic('check', 34, 3) + '</div>' +
      '<h3 style="font-size:1.16rem">Pagamento autorizzato</h3><div class="amt">' + money(p.amount) + '</div>' +
      '<p>' + (p.method === 'klarna' ? 'Prima rata addebitata, piano rateale attivo.' : p.method === 'sepa' ? 'Mandato registrato: addebito contabilizzato in 1–2 giorni lavorativi.' : 'Importo vincolato in escrow.') + ' Ricevuta inviata a ' + esc((session() || {}).email || 'la tua email') + '.</p>' +
      rcHTML(p) +
      '<div class="acts"><button class="btn b1" data-x="finish">' + ic('box', 16) + 'Vedi il mio acquisto</button>' +
      '<button class="btn b2" data-x="dl">' + ic('dl', 15) + 'Scarica ricevuta</button></div></div>';
  }
  function noView() {
    return '<div class="res no"><div class="rico">' + ic('x', 32, 3) + '</div>' +
      '<h3 style="font-size:1.16rem">Pagamento non riuscito</h3><div class="amt">' + money(totals().total) + '</div>' +
      '<p>' + esc(DECL[S.decline] || DECL.carta) + '</p><div class="pid">Declino su ' + esc(S.intent) + '</div>' +
      '<div class="acts"><button class="btn b1" data-x="retry">' + ic('refresh', 16) + 'Riprova o cambia metodo</button>' +
      '<button class="btn b3" data-x="close">Annulla</button></div></div>';
  }

  var SHIP_AT = 14000, DEL_AT = 34000;
  function stageOf(o) {
    if (o.refundedAt) return -1;
    if (o.confirmedAt) return 4;
    if (o.dispute) return 5;
    var el = Date.now() - o.createdAt;
    if (el > DEL_AT) return 3;
    if (el > SHIP_AT) return 2;
    return 1;
  }
  function tagOf(o) {
    var s = stageOf(o);
    if (s === -1) return '<span class="tag">' + ic('refresh', 11, 2.4) + 'Rimborsato</span>';
    if (s === 5) return '<span class="tag">' + ic('alert', 11, 2.4) + 'Contestazione</span>';
    if (s === 4) return '<span class="tag d">' + ic('check', 11, 3) + 'Completato</span>';
    if (s === 3) return '<span class="tag d">' + ic('box', 11, 2.4) + 'Consegnato</span>';
    if (s === 2) return '<span class="tag s">' + ic('truck', 11, 2.4) + 'Spedito</span>';
    return '<span class="tag e">' + ic('lock', 11, 2.4) + 'In escrow</span>';
  }
  function pctOf(o) { var s = stageOf(o); if (s >= 4 || s < 0) return 100; return Math.max(4, Math.min(99, Math.round((Date.now() - o.createdAt) / DEL_AT * 100))); }
  function hintOf(o) {
    var s = stageOf(o), el = Date.now() - o.createdAt;
    if (s === 1) return 'Spedizione tra ' + Math.max(0, Math.ceil((SHIP_AT - el) / 1000)) + ' s';
    if (s === 2) return 'Consegna tra ' + Math.max(0, Math.ceil((DEL_AT - el) / 1000)) + ' s';
    if (s === 3) return 'In attesa della tua conferma di ricezione';
    if (s === 5) return 'Verifica della contestazione in corso';
    if (s === -1) return 'Importo rimborsato sul metodo originale';
    return 'Fondi sbloccati al venditore';
  }
  function ordersView() {
    var l = orders().slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    if (!l.length) return '<div class="empty"><div class="ei">' + ic('box', 26) + '</div><h3>Nessun acquisto</h3><p>Gli articoli pagati compariranno qui con ricevuta e tracking.</p><button class="btn b1" data-x="close">Torna al catalogo</button></div>';
    var spent = l.filter(function (o) { return !o.refundedAt; }).reduce(function (s, o) { return s + o.total; }, 0);
    return '<div class="ttl">I miei acquisti<small>' + l.length + ' ordini · ' + money(spent) + '</small></div><div class="olist">' +
      l.map(function (o) {
        var s = stageOf(o), pct = pctOf(o);
        return '<article class="oc"><div class="ocm"><img src="' + esc(o.img) + '" alt="" data-smximg="1" referrerpolicy="no-referrer">' +
          '<div class="ocb"><div class="oct">' + esc(o.title) + '</div><div class="oci">' + esc(o.id) + ' · ' + esc(dt(o.createdAt)) + ' · ' + esc(o.methodLabel) + '</div>' +
          '<div>' + tagOf(o) + '<span class="tag">' + ic('truck', 11, 2.2) + esc(o.tracking) + '</span></div></div>' +
          '<div class="ocs"><div class="octot">' + money(o.total) + '</div></div></div>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="barn"><span>' + esc(hintOf(o)) + '</span><span>' + pct + '%</span></div>' +
          '<div class="oca">' +
          (s === 3 ? '<button class="btn b1" data-x="confirm" data-id="' + esc(o.id) + '">' + ic('check', 13, 2.5) + 'Conferma ricezione</button>' : '') +
          '<button class="btn b2" data-x="dlo" data-id="' + esc(o.id) + '">' + ic('dl', 13) + 'Ricevuta</button>' +
          '</div></article>';
      }).join('') + '</div><button class="btn b3 bb" data-x="close">Chiudi</button>';
  }
  function openOrders() {
    clearTimers();
    if (!session()) { S = blankState(items()[0] || null); S.step = 'auth'; show(); paint(); return; }
    S = blankState(items()[0] || { images: [''], title: '', seller: { name: '' }, size: 'M', price: 0, grading: '' });
    S.step = 'orders'; show(); paint();
    if (tick) clearInterval(tick);
    tick = setInterval(function () { if (S && S.step === 'orders') paint(); }, 2500);
  }

  /* ==========================================================
     10. MOTORE
     ========================================================== */
  function visual() {
    var c = $('#smxCard', root); if (!c || !S) return;
    var b = brandOf(S.card.d);
    c.className = 'card3 ' + b + (S.flip ? ' flip' : '');
    var set = function (sel, v) { var e = $(sel, root); if (e) e.textContent = v; };
    set('#smxPN', grp(pad(S.card.d, maxLen(b)), b));
    set('#smxPNm', S.card.n || 'NOME COGNOME');
    set('#smxPE', S.card.e || 'MM/AA');
    set('#smxPC', S.card.c || '\u2022\u2022\u2022');
    var h = function (sel, v) { var e = $(sel, root); if (e) e.innerHTML = v; };
    h('.bi', logo(b)); h('.front .cbrand', logo(b)); h('.cbb', logo(b));
  }
  function validate() {
    var e = {};
    if (S.method === 'card') {
      var b = brandOf(S.card.d);
      if (S.card.d.length !== maxLen(b) || !luhn(S.card.d)) e.num = 'Numero carta non valido.';
      var m = S.card.e.match(/^(\d{2})\/(\d{2})$/);
      if (!m) e.exp = 'Usare il formato MM/AA.';
      else {
        var mm = +m[1], yy = 2000 + +m[2];
        if (mm < 1 || mm > 12) e.exp = 'Mese non valido.';
        else if (new Date(yy, mm, 0) < new Date()) e.exp = 'Carta scaduta.';
      }
      if (S.card.c.length !== cvcLen(b)) e.cvc = 'Servono ' + cvcLen(b) + ' cifre.';
      if (S.card.n.trim().length < 3) e.name = 'Indicare il titolare della carta.';
    } else if (S.method === 'klarna') {
      if (S.kl.phone.replace(/\D/g, '').length < 9) e.phone = 'Inserire un numero di cellulare valido.';
    } else if (S.method === 'sepa') {
      if (!ibanOk(S.se.iban)) e.iban = 'IBAN non valido (controllo mod-97 non superato).';
      if (S.se.holder.trim().length < 3) e.holder = 'Indicare l\u2019intestatario del conto.';
      if (!S.se.mand) e.mand = 'È necessario accettare il mandato di addebito.';
    }
    S.err = e;
    return Object.keys(e).length === 0;
  }
  function behavior() {
    if (S.method === 'card') { for (var i = 0; i < TESTS.length; i++) if (TESTS[i].n === S.card.d) return TESTS[i]; return { b: 'success' }; }
    if (S.method === 'paypal' && S.pp.decline) return { b: 'decline', r: 'pp' };
    if (S.method === 'klarna' && S.kl.decline) return { b: 'decline', r: 'kl' };
    if (S.method === 'sepa' && S.se.decline) return { b: 'decline', r: 'se' };
    return { b: 'success' };
  }
  function run() {
    S.step = 'processing'; paint();
    var steps = $$('#smxSteps .stp', root);
    function mark(k, cls) {
      var el = steps[k]; if (!el) return;
      el.className = 'stp ' + cls;
      if (cls === 'ok') { var i = $('.si', el); if (i) i.innerHTML = ic('check', 11, 3); }
    }
    var beh = behavior();
    mark(0, 'act');
    later(function () {
      mark(0, 'ok'); mark(1, 'act');
      var r = $('#smxRing', root); if (r) r.className = 'ring scan';
      later(function () {
        mark(1, 'ok');
        if (beh.b === '3ds') { S.step = '3ds'; paint(); startOtp(); return; }
        mark(2, 'act');
        later(function () {
          mark(2, 'ok'); mark(3, 'act');
          later(function () {
            mark(3, 'ok');
            later(function () {
              if (!S) return;
              if (beh.b === 'decline') { S.decline = beh.r; S.step = 'decline'; paint(); }
              else succeed(false);
            }, 300);
          }, 640);
        }, 720);
      }, 950);
    }, 680);
  }
  function succeed(threeDS) {
    if (!S) return;
    var b = brandOf(S.card.d), t = totals().total, mm = null;
    for (var i = 0; i < METHODS.length; i++) if (METHODS[i].id === S.method) mm = METHODS[i];
    var raw = S.se.iban.replace(/\s/g, '');
    var p = {
      id: S.intent, receipt: 'rcpt_' + Math.random().toString(36).slice(2, 10),
      method: S.method, brand: S.method === 'card' ? brandName(b) : (mm ? mm.l : 'Carta'),
      last4: S.card.d.slice(-4), account: (session() || {}).email || 'utente@esempio.it',
      ibanMasked: S.method === 'sepa' ? raw.slice(0, 4) + '\u2022\u2022\u2022\u2022' + raw.slice(-4) : '',
      amount: t, created: Date.now(), status: 'succeeded', threeDS: !!threeDS, installments: null
    };
    if (S.method === 'klarna') {
      var a = r2(Math.floor((t / 3) * 100) / 100);
      p.installments = [
        { n: 1, amount: a, due: Date.now(), charged: true },
        { n: 2, amount: a, due: Date.now() + 30 * 86400000, charged: false },
        { n: 3, amount: r2(t - a * 2), due: Date.now() + 60 * 86400000, charged: false }
      ];
    }
    S.payment = p; S.step = 'success'; paint();
  }
  function startOtp() {
    var left = 60;
    otpT = setInterval(function () {
      left--;
      var e = $('#smxTimer', root);
      if (e) e.textContent = 'Il codice scade tra ' + left + ' s';
      if (left <= 0) { clearInterval(otpT); otpT = null; if (S) { S.decline = 'auth'; S.step = 'decline'; paint(); } }
    }, 1000);
  }
  function verifyOtp() {
    var code = $$('.otp input', root).map(function (i) { return i.value; }).join('');
    if (code !== '123456') {
      toast('Codice non corretto. Per il test usa 123456.', 'no');
      $$('.otp input', root).forEach(function (i) { i.value = ''; });
      var f = $('.otp input', root); if (f) f.focus();
      return;
    }
    if (otpT) { clearInterval(otpT); otpT = null; }
    S.step = 'processing'; paint();
    $$('#smxSteps .stp', root).forEach(function (el) { el.className = 'stp ok'; var i = $('.si', el); if (i) i.innerHTML = ic('check', 11, 3); });
    later(function () { succeed(true); }, 700);
  }
  function finalize() {
    var p = S.payment, it = S.item, t = totals();
    var order = {
      id: 'SM-' + Date.now().toString(36).toUpperCase(),
      sku: it.sku, title: it.title, img: it.images[0], category: it.category,
      sellerName: it.seller.name, amount: S.price, fee: t.fee, ship: t.ship, total: t.total,
      shipLabel: S.ship === 'home' ? 'Domicilio · corriere espresso' : 'Punto di ritiro convenzionato',
      methodLabel: mLabel(p), tracking: 'TRK' + Math.random().toString().slice(2, 12),
      createdAt: Date.now(), confirmedAt: null, refundedAt: null, dispute: null, payment: p
    };
    var l = orders(); l.unshift(order); saveOrders(l);
    setStatus(it.sku, 'reserved');
    try {
      if (window.SMChat && window.SMChat.ensureThread && window.SMChat.systemMsg) {
        var th = window.SMChat.ensureThread(it);
        window.SMChat.systemMsg(th.id, 'Ordine ' + order.id + ' confermato. Pagamento ' + p.id + ' di ' + money(t.total) + ' vincolato in escrow. Tracking: ' + order.tracking + '.');
      }
    } catch (e) {}
    return order;
  }
  function download(p, o) {
    var rows = [
      'SOUNDMARKET S.r.l. — RICEVUTA DI PAGAMENTO',
      '(ambiente dimostrativo — nessun addebito reale)',
      '==================================================',
      'Ricevuta n.      : ' + p.receipt,
      'PaymentIntent    : ' + p.id,
      'Data e ora       : ' + dt(p.created) + ' ' + tm(p.created),
      'Metodo           : ' + mLabel(p),
      'Autenticazione   : ' + (p.threeDS ? '3D Secure 2 superata' : 'Esente / non richiesta'),
      'Stato            : ' + p.status,
      '--------------------------------------------------'
    ];
    if (o) {
      rows.push('Articolo         : ' + o.title);
      rows.push('Venditore        : @' + o.sellerName);
      rows.push('Prezzo articolo  : ' + money(o.amount));
      rows.push('Protezione Acq.  : ' + money(o.fee));
      rows.push('Spedizione       : ' + money(o.ship));
    }
    rows.push('TOTALE           : ' + money(p.amount));
    if (p.installments) {
      rows.push('--------------------------------------------------');
      rows.push('PIANO RATEALE KLARNA (TAEG 0,00%)');
      p.installments.forEach(function (i) { rows.push('  Rata ' + i.n + ' — ' + money(i.amount) + ' — ' + dt(i.due) + (i.charged ? '  [addebitata]' : '  [programmata]')); });
    }
    rows.push('==================================================');
    rows.push('Importo detenuto in escrow fino a conferma ricezione.');
    var blob = new Blob([rows.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'ricevuta-' + p.receipt + '.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast('Ricevuta scaricata.', 'ok');
  }
  function doAuth() {
    var email = (($('#smxEmail', root) || {}).value || '').trim().toLowerCase();
    var pass = ($('#smxPass', root) || {}).value || '';
    var list = users(), i;
    if (S.authMode === 'login') {
      var found = null;
      for (i = 0; i < list.length; i++) if (list[i].email === email && list[i].pass === hashPass(pass)) found = list[i];
      if (!found) { S.authErr = 'Credenziali non valide. Verifica email e password.'; paint(); return; }
      wr('sm.session', { id: found.id, name: found.name, email: found.email });
    } else {
      var name = (($('#smxName', root) || {}).value || '').trim();
      if (name.length < 2) { S.authErr = 'Inserire un nome di almeno 2 caratteri.'; paint(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { S.authErr = 'Formato email non valido.'; paint(); return; }
      if (pass.length < 6) { S.authErr = 'La password deve contenere almeno 6 caratteri.'; paint(); return; }
      for (i = 0; i < list.length; i++) if (list[i].email === email) { S.authErr = 'Email già registrata. Usa la scheda Accedi.'; paint(); return; }
      var u = { id: 'u-' + Date.now().toString(36), name: name, email: email, pass: hashPass(pass), joined: Date.now() };
      list.push(u); wr('sm.users', list);
      wr('sm.session', { id: u.id, name: u.name, email: u.email });
    }
    S.authErr = '';
    if (S.item && S.item.sku) S.step = 'form';
    else { openOrders(); appRefresh(); return; }
    paint(); appRefresh(); toast('Accesso effettuato.', 'ok');
  }

  /* ==========================================================
     11. EVENTI INTERNI
     ========================================================== */
  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-x]') : null;
    if (!el) return;
    var a = el.getAttribute('data-x');
    try {
      if (a === 'close') { close(); appRefresh(); return; }
      if (a === 'orders') { openOrders(); return; }
      if (!S) return;
      if (a === 'authmode') { S.authMode = el.getAttribute('data-m'); S.authErr = ''; paint(); }
      else if (a === 'authgo') doAuth();
      else if (a === 'method') { S.method = el.getAttribute('data-m'); S.err = {}; paint(); }
      else if (a === 'test') {
        var d = el.getAttribute('data-n'), b = brandOf(d);
        S.card = { d: d, e: '12/30', c: b === 'amex' ? '1234' : '123', n: 'ANDREA DEMO' };
        S.err = {}; paint(); toast('Carta di test compilata.', '');
      }
      else if (a === 'ibanok') { S.se.iban = ibanFmt(TEST_IBAN); S.se.holder = S.se.holder || 'ANDREA DEMO'; S.err.iban = ''; paint(); }
      else if (a === 'ibanbad') { S.se.iban = ibanFmt('IT00X0000000000000000000000'); paint(); }
      else if (a === 'pay') { if (!validate()) { paint(); toast('Controlla i campi evidenziati.', 'no'); return; } run(); }
      else if (a === 'otp') verifyOtp();
      else if (a === 'otpcancel') { if (otpT) { clearInterval(otpT); otpT = null; } S.step = 'form'; paint(); }
      else if (a === 'retry') { S.step = 'form'; S.err = {}; S.decline = null; paint(); }
      else if (a === 'dl') { var tt = totals(); download(S.payment, { title: S.item.title, sellerName: S.item.seller.name, amount: S.price, fee: tt.fee, ship: tt.ship }); }
      else if (a === 'finish') {
        var o = finalize();
        clearTimers(); S.step = 'orders'; paint();
        if (tick) clearInterval(tick);
        tick = setInterval(function () { if (S && S.step === 'orders') paint(); }, 2500);
        appRefresh(); toast('Ordine ' + o.id + ' registrato.', 'ok');
      }
      else if (a === 'confirm') {
        var id = el.getAttribute('data-id'), ll = orders();
        for (var k = 0; k < ll.length; k++) if (ll[k].id === id && !ll[k].confirmedAt) {
          ll[k].confirmedAt = Date.now(); ll[k].dispute = null;
          saveOrders(ll); setStatus(ll[k].sku, 'sold');
          try {
            if (window.SMChat && window.SMChat.bySku && window.SMChat.systemMsg) {
              var th = window.SMChat.bySku(ll[k].sku);
              if (th) window.SMChat.systemMsg(th.id, 'Ricezione confermata. Fondi sbloccati al venditore. Transazione ' + id + ' completata.');
            }
          } catch (err) {}
        }
        paint(); appRefresh(); toast('Ricezione confermata. Fondi sbloccati.', 'ok');
      }
      else if (a === 'dlo') {
        var oid = el.getAttribute('data-id'), ls = orders();
        for (var q = 0; q < ls.length; q++) if (ls[q].id === oid) { download(ls[q].payment, ls[q]); break; }
      }
    } catch (err) { fatal(err); }
  }
  function onInput(e) {
    if (!S) return;
    var t = e.target;
    try {
      if (t.id === 'smxNum') {
        var raw = t.value.replace(/\D/g, ''), b = brandOf(raw), d = raw.slice(0, maxLen(b));
        S.card.d = d; t.value = grp(d, b);
        S.card.c = S.card.c.slice(0, cvcLen(b));
        var cv = $('#smxCvc', root); if (cv) cv.value = S.card.c;
        S.err.num = ''; visual();
      } else if (t.id === 'smxExp') {
        var dd = t.value.replace(/\D/g, '').slice(0, 4);
        S.card.e = dd.length > 2 ? dd.slice(0, 2) + '/' + dd.slice(2) : dd;
        t.value = S.card.e; S.err.exp = ''; visual();
      } else if (t.id === 'smxCvc') {
        S.card.c = t.value.replace(/\D/g, '').slice(0, cvcLen(brandOf(S.card.d)));
        t.value = S.card.c; S.err.cvc = ''; visual();
      } else if (t.id === 'smxHolderCard') { S.card.n = t.value.toUpperCase(); S.err.name = ''; visual(); }
      else if (t.id === 'smxPhone') { S.kl.phone = t.value; S.err.phone = ''; }
      else if (t.id === 'smxIban') { S.se.iban = ibanFmt(t.value).slice(0, 34); t.value = S.se.iban; S.err.iban = ''; }
      else if (t.id === 'smxHolder') { S.se.holder = t.value.toUpperCase(); S.err.holder = ''; }
      else if (t.hasAttribute && t.hasAttribute('data-otp')) {
        t.value = t.value.replace(/\D/g, '').slice(0, 1);
        if (t.value && t.nextElementSibling) t.nextElementSibling.focus();
      }
    } catch (err) { fatal(err); }
  }
  function onChange(e) {
    if (!S) return;
    var t = e.target;
    if (t.name === 'smxShip') { S.ship = t.value; paint(); return; }
    if (t.id === 'smxPPd') S.pp.decline = t.checked;
    else if (t.id === 'smxKLd') S.kl.decline = t.checked;
    else if (t.id === 'smxSEd') S.se.decline = t.checked;
    else if (t.id === 'smxMand') { S.se.mand = t.checked; S.err.mand = ''; }
  }
  function onFocus(e) { if (S && e.target.id === 'smxCvc') { S.flip = true; visual(); } }
  function onBlur(e) { if (S && e.target.id === 'smxCvc') { S.flip = false; visual(); } }
  function onKey(e) {
    if (!S) return;
    if (e.target.hasAttribute && e.target.hasAttribute('data-otp')) {
      if (e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) {
        e.target.previousElementSibling.focus(); e.target.previousElementSibling.value = ''; e.preventDefault();
      }
      if (e.key === 'Enter') { e.preventDefault(); verifyOtp(); }
    }
    if (e.key === 'Enter' && S.step === 'auth') { e.preventDefault(); doAuth(); }
  }

  /* ==========================================================
     12. AGGANCIO — triplo sistema ridondante
     ========================================================== */
  function intercept(e) {
    if (e.button != null && e.button !== 0) return;
    var el = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    var a = el.getAttribute('data-action');
    if (a === 'buy' || a === 'checkout-offer') {
      e.preventDefault(); e.stopImmediatePropagation();
      var amt = el.getAttribute('data-amount');
      open(el.getAttribute('data-sku'), amt != null ? Number(amt) : null);
    } else if (a === 'checkout-pay') {
      e.preventDefault(); e.stopImmediatePropagation();
      hijack(true);
    }
  }

  function hijack(force) {
    if (hijackBusy) return;
    var mr = document.getElementById('modalRoot');
    if (!mr) return;
    var btn = mr.querySelector('[data-action="checkout-pay"]');
    if (!btn) return;
    var st = (window.SMApp && window.SMApp.state && window.SMApp.state.checkout) ? window.SMApp.state.checkout : null;
    var sku = st && st.sku ? st.sku : null;
    var price = st ? st.price : null;
    var sm = st ? st.shipMethod : 'pickup';
    if (!sku) {
      var r = (window.SMApp && window.SMApp.state) ? window.SMApp.state.route : null;
      if (r && r.name === 'articolo' && r.param) sku = r.param;
    }
    if (!sku) {
      var img = mr.querySelector('.modal-body img');
      if (img) {
        var t = mr.querySelector('.modal-body .semi');
        if (t) {
          var title = t.textContent.trim(), all = items();
          for (var i = 0; i < all.length; i++) if (all[i].title === title) { sku = all[i].sku; break; }
        }
      }
    }
    if (!sku) { if (force) toast('Impossibile identificare l\u2019articolo. Apri la scheda e riprova.', 'no'); return; }
    hijackBusy = true;
    open(sku, price, sm);
    setTimeout(function () { hijackBusy = false; }, 600);
  }

  function watchModals() {
    var mr = document.getElementById('modalRoot');
    if (!mr) return;
    try {
      var mo = new MutationObserver(function () { setTimeout(function () { hijack(false); }, 30); });
      mo.observe(mr, { childList: true, subtree: true });
    } catch (e) {}
    setInterval(function () { hijack(false); }, 400);
  }

  document.addEventListener('error', function (e) {
    var im = e.target;
    if (im && im.tagName === 'IMG' && im.getAttribute && im.getAttribute('data-smximg') && !im.dataset.smxDone) {
      im.dataset.smxDone = '1';
      im.src = (S && S.item) ? fallbackImg(S.item) : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><rect width="60" height="80" fill="#0F4C5C"/></svg>');
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root && root.classList.contains('on') && (!S || (S.step !== 'processing' && S.step !== '3ds'))) {
      e.preventDefault(); e.stopImmediatePropagation(); close(); appRefresh();
    }
  }, true);

  /* registrazione immediata: non dipende dal boot */
  document.addEventListener('click', intercept, true);
  window.addEventListener('click', intercept, true);

  function boot() {
    try { ensureRoot(); } catch (e) {}
    try { watchModals(); } catch (e) {}
    appRefresh();
    window.SMXCheckout = { open: open, orders: openOrders, close: close };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();