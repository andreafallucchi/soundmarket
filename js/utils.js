/* ============================================================
   SOUNDMARKET — UTILITÀ CONDIVISE
   Storage sicuro, formattazione, toast, modali, lightbox,
   compressione immagini, avatar, IBAN, stampa ricevute.
   API invariata per compatibilità con app/auth/chat/payments.
   ============================================================ */
'use strict';

const SMU = (() => {

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- Storage con fallback in memoria ---------- */
  const mem = new Map();
  let persistent = true;
  try { localStorage.setItem('__sm_test', '1'); localStorage.removeItem('__sm_test'); }
  catch (e) { persistent = false; }

  const store = {
    get(key, fallback) {
      try {
        const raw = persistent ? localStorage.getItem(key) : mem.get(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (persistent) localStorage.setItem(key, raw); else mem.set(key, raw);
        return true;
      } catch (e) { mem.set(key, raw); return false; }
    },
    del(key) {
      try { if (persistent) localStorage.removeItem(key); } catch (e) {}
      mem.delete(key);
    },
    isPersistent: () => persistent
  };

  /* ---------- Formattazione ---------- */
  const moneyFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const fmtMoney = (n) => moneyFmt.format(Number(n) || 0);
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const fmtDateTime = (ts) => fmtDate(ts) + ' · ' + fmtTime(ts);

  const timeAgo = (ts) => {
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return 'pochi secondi fa';
    const m = Math.floor(s / 60); if (m < 60) return m + (m === 1 ? ' minuto fa' : ' minuti fa');
    const h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? ' ora fa' : ' ore fa');
    const d = Math.floor(h / 24); if (d < 30) return d + (d === 1 ? ' giorno fa' : ' giorni fa');
    const mo = Math.floor(d / 30); if (mo < 12) return mo + (mo === 1 ? ' mese fa' : ' mesi fa');
    return fmtDate(ts);
  };

  const uid = (p) => (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const round2 = (n) => Math.round(n * 100) / 100;
  const initials = (name) => String(name || 'U').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const debounce = (fn, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); }; };

  const parseAmount = (raw) => {
    if (raw == null) return NaN;
    let s = String(raw).trim().replace(/[€\s]/g, '');
    if (s.indexOf('.') >= 0 && s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  };

  /* ---------- Avatar credibili (RandomUser + DiceBear fallback) ---------- */
  const avatarUrl = (seed, gender) => {
    const n = Math.abs(hashCode(String(seed))) % 99;
    const g = gender === 'f' ? 'women' : 'men';
    return 'https://randomuser.me/api/portraits/' + g + '/' + n + '.jpg';
  };
  const avatarFallback = (seed) => {
    return 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(String(seed || 'U')) +
      '&backgroundColor=0F4C5C&textColor=E8B04B&fontWeight=700';
  };
  const avatarImg = (seed, name, gender, cls) => {
    const primary = avatarUrl(seed, gender);
    const fb = avatarFallback(name || seed);
    return '<img src="' + esc(primary) + '" alt="' + esc(name || '') + '" class="' + (cls || '') +
      '" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + fb + '\'">';
  };

  function hashCode(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return h;
  }

  /* ---------- IBAN ---------- */
  const fmtIban = (v) => (String(v || '').replace(/\s/g, '').toUpperCase().match(/.{1,4}/g) || []).join(' ');
  const ibanValid = (raw) => {
    const s = String(raw || '').replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    const re = s.slice(4) + s.slice(0, 4);
    let rem = 0;
    for (let i = 0; i < re.length; i++) {
      const ch = re.charAt(i);
      const v = ch >= 'A' ? String(ch.charCodeAt(0) - 55) : ch;
      for (let j = 0; j < v.length; j++) rem = (rem * 10 + (+v.charAt(j))) % 97;
    }
    return rem === 1;
  };
  const maskIban = (raw) => {
    const s = String(raw || '').replace(/\s/g, '').toUpperCase();
    if (s.length < 8) return s;
    return s.slice(0, 4) + ' •••• •••• ' + s.slice(-4);
  };

  /* ---------- Toast (in alto a destra) ---------- */
  const toast = (msg, opts) => {
    opts = opts || {};
    const root = $('#toastRoot');
    if (!root) return function () {};
    const el = document.createElement('div');
    el.className = 'toast ' + (opts.type || '');
    const iconName = opts.type === 'success' ? 'checkCircle' : opts.type === 'error' ? 'alert' : opts.type === 'warning' ? 'alert' : 'info';
    el.innerHTML = (window.SMIcons ? SMIcons.get(iconName, 17, 2) : '') + '<span>' + esc(msg) + '</span>';
    let done = false;
    const dismiss = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 260); };
    if (opts.action) {
      const b = document.createElement('button');
      b.textContent = opts.action.label;
      b.addEventListener('click', () => { opts.action.fn(); dismiss(); });
      el.appendChild(b);
    }
    root.appendChild(el);
    setTimeout(dismiss, opts.duration || (opts.action ? 6000 : 3400));
    return dismiss;
  };

  /* ---------- Modale ---------- */
  let modalOnClose = null;
  const openModal = (title, bodyHTML, opts) => {
    opts = opts || {};
    const root = $('#modalRoot');
    if (!root) return;
    root.innerHTML =
      '<div class="overlay" data-overlay="1">' +
        '<div class="modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
          '<div class="modal-head"><h2>' + esc(title) + '</h2>' +
          '<button class="modal-x" data-action="modal-close" aria-label="Chiudi">' + (window.SMIcons ? SMIcons.get('x', 18, 2) : '×') + '</button></div>' +
          '<div class="modal-body">' + bodyHTML + '</div>' +
        '</div>' +
      '</div>';
    modalOnClose = opts.onClose || null;
    if (window.SMIcons && SMIcons.hydrate) SMIcons.hydrate(root);
    const first = root.querySelector('input,select,textarea,button.btn');
    if (first) setTimeout(() => first.focus(), 60);
  };
  const closeModal = () => {
    const root = $('#modalRoot');
    if (root) root.innerHTML = '';
    if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
  };
  const isModalOpen = () => !!$('#modalRoot .overlay');

  /* ---------- Lightbox ---------- */
  const openLightbox = (src, alt) => {
    const root = $('#lightboxRoot');
    if (!root) return;
    root.innerHTML =
      '<div class="lightbox" data-action="lightbox-close">' +
        '<button class="lightbox-x" aria-label="Chiudi anteprima">' + (window.SMIcons ? SMIcons.get('x', 20, 2) : '×') + '</button>' +
        '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '">' +
      '</div>';
  };
  const closeLightbox = () => { const root = $('#lightboxRoot'); if (root) root.innerHTML = ''; };
  const isLightboxOpen = () => !!$('#lightboxRoot .lightbox');

  /* ---------- Compressione immagini (canvas) ---------- */
  const compressImage = (file, maxDim, quality) => new Promise((resolve, reject) => {
    maxDim = maxDim || 1000; quality = quality || 0.82;
    if (!file || !/^image\//.test(file.type)) { reject(new Error('Formato non supportato. Caricare un file JPG o PNG.')); return; }
    if (file.size > 12 * 1024 * 1024) { reject(new Error('File troppo grande (max 12 MB).')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lettura del file non riuscita.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Immagine non valida o corrotta.'));
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------- Copia negli appunti ---------- */
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove(); return ok;
      } catch (e2) { return false; }
    }
  };

  /* ---------- Hash password (demo, non crittografico) ---------- */
  const hashPass = (s) => {
    let h = 5381;
    const str = 'sm::' + s;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(36) + '_' + str.length;
  };

  /* ---------- Stampa / download ricevuta ---------- */
  const printReceipt = (html, title) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) { toast('Consenti i popup per stampare la ricevuta.', { type: 'warning' }); return; }
    w.document.write(
      '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>' + esc(title || 'Ricevuta SoundMarket') + '</title>' +
      '<style>' +
      'body{font-family:Inter,system-ui,sans-serif;color:#0F172A;margin:0;padding:40px;line-height:1.6}' +
      '.rh{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0F4C5C;padding-bottom:20px;margin-bottom:24px}' +
      '.rl{font-size:24px;font-weight:800;color:#0F4C5C}.rl span{color:#B45309}' +
      '.rm{font-size:12px;color:#475569;text-align:right}' +
      'h1{font-size:18px;margin:0 0 4px}.sub{color:#475569;font-size:13px;margin-bottom:24px}' +
      'table{width:100%;border-collapse:collapse;margin:16px 0}' +
      'td{padding:10px 0;border-bottom:1px solid #E2E8F0;font-size:14px}' +
      'td:first-child{color:#475569}td:last-child{text-align:right;font-weight:600}' +
      '.tot td{border-top:2px solid #0F4C5C;border-bottom:none;font-size:18px;font-weight:800;color:#0F4C5C;padding-top:14px}' +
      '.badge{display:inline-block;background:#ECFDF3;color:#166534;border:1px solid #BBE5C8;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;margin:16px 0}' +
      '.foot{margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8}' +
      '@media print{body{padding:20px}}' +
      '</style></head><body>' + html +
      '<div class="foot">SoundMarket S.r.l. · Via Montenapoleone 8, 20121 Milano (MI) · P.IVA 04871220968 · REA MI-2784512<br>' +
      'Documento generato automaticamente. Conservare come prova d\u2019acquisto.</div>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const downloadText = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  /* ---------- Fallback immagine prodotto (SVG inline) ---------- */
  const productFallback = (category, label) => {
    const colors = {
      'Chitarre Elettriche': ['#0A3540', '#136276'], 'Chitarre Acustiche': ['#3E2C1C', '#8A5A12'],
      'Bassi': ['#062A33', '#0F4C5C'], 'Tastiere': ['#0F4C5C', '#177A93'],
      'Batterie': ['#4A1D15', '#8A3B22'], 'Vinili': ['#0B1220', '#212F3C'],
      'CD': ['#334155', '#64748B'], 'Pedali Effetto': ['#0A3540', '#B45309'],
      'Amplificatori': ['#1C1917', '#44403C'], 'Microfoni': ['#0F172A', '#334155'],
      'Archi': ['#3E2C1C', '#6D4C41']
    };
    const c = colors[category] || ['#0F4C5C', '#0A3540'];
    const safe = String(label || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 32);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect width="300" height="400" fill="url(#g)"/>' +
      '<g stroke="#E8B04B" stroke-opacity=".12" fill="none"><circle cx="150" cy="180" r="60"/><circle cx="150" cy="180" r="95"/><circle cx="150" cy="180" r="130"/></g>' +
      '<g stroke="#F5E9D2" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"><path d="M150 120V240"/><circle cx="150" cy="255" r="14"/><circle cx="180" cy="235" r="14"/></g>' +
      '<text x="150" y="345" font-family="Inter,sans-serif" font-size="13" font-weight="600" fill="#F5E9D2" text-anchor="middle">' + safe + '</text>' +
      '<text x="150" y="368" font-family="Inter,sans-serif" font-size="10" letter-spacing="2" fill="#E8B04B" text-anchor="middle">' + String(category || '').toUpperCase() + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  return {
    $: $, $$: $$, esc: esc, store: store,
    fmtMoney: fmtMoney, fmtDate: fmtDate, fmtTime: fmtTime, fmtDateTime: fmtDateTime, timeAgo: timeAgo,
    uid: uid, clamp: clamp, pick: pick, round2: round2, initials: initials, debounce: debounce, parseAmount: parseAmount,
    avatarUrl: avatarUrl, avatarFallback: avatarFallback, avatarImg: avatarImg,
    fmtIban: fmtIban, ibanValid: ibanValid, maskIban: maskIban,
    toast: toast, openModal: openModal, closeModal: closeModal, isModalOpen: isModalOpen,
    openLightbox: openLightbox, closeLightbox: closeLightbox, isLightboxOpen: isLightboxOpen,
    compressImage: compressImage, copyText: copyText, hashPass: hashPass,
    printReceipt: printReceipt, downloadText: downloadText, productFallback: productFallback
  };
})();