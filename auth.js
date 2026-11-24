/* ============================================================
   SOUNDMARKET — ACCOUNT E SESSIONE
   Avatar: solo iniziali. La foto la carica l'utente dalle
   impostazioni. Pannello completo: foto, nome, città, email,
   password, IBAN, preferenze, export dati, eliminazione.
   API invariata + nuove funzioni account.
   ============================================================ */
'use strict';

const SMAuth = (() => {

  const K_USERS = 'sm.users', K_SESSION = 'sm.session';
  const users = () => SMU.store.get(K_USERS, []);
  const saveUsers = (u) => SMU.store.set(K_USERS, u);
  const current = () => SMU.store.get(K_SESSION, null);
  const fullUser = () => { const s = current(); return s ? (users().find(x => x.id === s.id) || null) : null; };
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

  const setSession = (u) => SMU.store.set(K_SESSION, { id:u.id, name:u.name, email:u.email, city:u.city, photo:u.photo || '' });

  const seedDemo = () => {
    const u = users();
    if (!u.find(x => x.email === 'demo@soundmarket.it')) {
      u.push({ id:'u-demo', name:'Andrea Demo', email:'demo@soundmarket.it', pass:SMU.hashPass('demo123'),
        joined:Date.now() - 86400000*120, city:'Milano', iban:'IT60X0542811101000000123456',
        photo:'', verified:true, prefs:{ email:true, chat:true, price:true } });
      saveUsers(u);
      SMU.store.set('sm.favs.u-demo', ['VIN-001','STR-005','KEY-001']);
      SMU.store.set('sm.wallet.u-demo', { available:0, pending:0, movements:[] });
      if (window.SMChat && SMChat.seedDemoThread) SMChat.seedDemoThread('u-demo');
    }
  };

  const register = (name, email, password, city) => {
    name = String(name||'').trim(); email = String(email||'').trim().toLowerCase(); city = String(city||'').trim();
    if (name.length < 2) return { ok:false, msg:'Inserire un nome di almeno 2 caratteri.' };
    if (!validEmail(email)) return { ok:false, msg:'Formato email non valido.' };
    if (password.length < 6) return { ok:false, msg:'La password deve contenere almeno 6 caratteri.' };
    const u = users();
    if (u.find(x => x.email === email)) return { ok:false, msg:'Indirizzo email già registrato. Effettuare l\u2019accesso.' };
    const nu = { id:SMU.uid('u'), name, email, pass:SMU.hashPass(password), joined:Date.now(),
      city:city||'Milano', iban:'', photo:'', verified:false, prefs:{ email:true, chat:true, price:true } };
    u.push(nu); saveUsers(u); setSession(nu);
    SMU.store.set('sm.wallet.' + nu.id, { available:0, pending:0, movements:[] });
    return { ok:true, user:nu };
  };

  const login = (email, password) => {
    email = String(email||'').trim().toLowerCase();
    const u = users().find(x => x.email === email && x.pass === SMU.hashPass(password));
    if (!u) return { ok:false, msg:'Credenziali non valide. Verificare email e password.' };
    setSession(u);
    return { ok:true, user:u };
  };

  const logout = () => { SMU.store.del(K_SESSION); SMU.toast('Sessione terminata.', { type:'info' }); if (window.SMApp) SMApp.renderAll(); };

  const requireUser = (msg) => {
    if (current()) return true;
    SMU.toast(msg || 'Accesso richiesto per questa operazione.', { type:'warning' });
    openAuth('login');
    return false;
  };

  const updateProfile = (patch) => {
    const s = current(); if (!s) return false;
    const u = users(); const i = u.findIndex(x => x.id === s.id); if (i < 0) return false;
    Object.assign(u[i], patch); saveUsers(u); setSession(u[i]);
    return true;
  };

  const changePassword = (oldP, newP) => {
    const f = fullUser(); if (!f) return { ok:false, msg:'Sessione non valida.' };
    if (f.pass !== SMU.hashPass(oldP)) return { ok:false, msg:'Password attuale non corretta.' };
    if (String(newP||'').length < 6) return { ok:false, msg:'La nuova password deve avere almeno 6 caratteri.' };
    return updateProfile({ pass:SMU.hashPass(newP) }) ? { ok:true } : { ok:false, msg:'Aggiornamento non riuscito.' };
  };

  const changeEmail = (newE, pass) => {
    const f = fullUser(); if (!f) return { ok:false, msg:'Sessione non valida.' };
    newE = String(newE||'').trim().toLowerCase();
    if (!validEmail(newE)) return { ok:false, msg:'Formato email non valido.' };
    if (f.pass !== SMU.hashPass(pass)) return { ok:false, msg:'Password non corretta.' };
    if (users().find(x => x.email === newE && x.id !== f.id)) return { ok:false, msg:'Email già in uso da un altro account.' };
    const old = f.email;
    updateProfile({ email:newE });
    ['sm.favs.','sm.orders.','sm.threads.','sm.wallet.','sm.cart.','sm.savedSearches.'].forEach(p => {
      const v = SMU.store.get(p + f.id, null); if (v !== null) SMU.store.set(p + f.id, v);
    });
    const items = SMU.store.get('sm.userItems', []).map(it => it.sellerEmail === old ? Object.assign(it, { sellerEmail:newE }) : it);
    SMU.store.set('sm.userItems', items);
    return { ok:true };
  };

  const setPhoto = (dataUri) => updateProfile({ photo:dataUri || '' });

  const deleteAccount = () => {
    const f = fullUser(); if (!f) return;
    ['sm.favs.','sm.orders.','sm.threads.','sm.wallet.','sm.cart.','sm.savedSearches.'].forEach(p => SMU.store.del(p + f.id));
    SMU.store.set('sm.userItems', SMU.store.get('sm.userItems', []).filter(i => i.sellerEmail !== f.email));
    saveUsers(users().filter(x => x.id !== f.id));
    SMU.store.del(K_SESSION);
    SMU.toast('Account eliminato. Tutti i dati locali sono stati rimossi.', { type:'info', duration:6000 });
    if (window.SMApp) SMApp.navigate('home');
  };

  const exportData = () => {
    const f = fullUser(); if (!f) return;
    const pack = {
      profilo:{ nome:f.name, email:f.email, citta:f.city, iban:f.iban ? SMU.maskIban(f.iban) : '', iscrizione:SMU.fmtDate(f.joined) },
      annunci:SMU.store.get('sm.userItems', []).filter(i => i.sellerEmail === f.email).map(i => ({ sku:i.sku, titolo:i.title, prezzo:i.price, grading:i.grading })),
      ordini:SMU.store.get('sm.orders.' + f.id, []),
      preferiti:SMU.store.get('sm.favs.' + f.id, []),
      conversazioni:SMU.store.get('sm.threads.' + f.id, []),
      portafoglio:SMU.store.get('sm.wallet.' + f.id, {}),
      esportato:SMU.fmtDateTime(Date.now())
    };
    SMU.downloadText('soundmarket-dati-' + f.id + '.json', JSON.stringify(pack, null, 2));
    SMU.toast('Dati esportati in formato JSON.', { type:'success' });
  };

  /* ---------- avatar: iniziali o foto caricata dall'utente ---------- */
  const avatarHTML = (user, cls) => {
    const c = cls || '';
    if (!user) return '<span class="avatar ' + c + '">?</span>';
    const f = (user.id && current() && user.id === current().id) ? fullUser() : null;
    const photo = (f && f.photo) || user.photo || '';
    if (photo) return '<span class="avatar ' + c + '"><img src="' + SMU.esc(photo) + '" alt="' + SMU.esc(user.name || '') + '"></span>';
    return '<span class="avatar ' + c + '">' + SMU.esc(SMU.initials(user.name || 'U')) + '</span>';
  };

  /* ---------- modale accesso ---------- */
  const openAuth = (mode) => { mode = mode || 'login'; SMU.openModal(mode === 'login' ? 'Accesso alla piattaforma' : 'Creazione account', authBody(mode)); };

  const authBody = (mode) =>
    '<div class="auth-tabs">' +
      '<button class="auth-tab' + (mode==='login'?' on':'') + '" data-action="auth-tab" data-mode="login">Accedi</button>' +
      '<button class="auth-tab' + (mode==='register'?' on':'') + '" data-action="auth-tab" data-mode="register">Registrati</button>' +
    '</div>' +
    '<form id="authForm" data-mode="' + mode + '" novalidate>' +
      (mode==='register'
        ? '<div class="fg"><label for="aName">Nome e cognome</label><input class="f-in" id="aName" type="text" autocomplete="name" placeholder="Mario Rossi"></div>' +
          '<div class="fg"><label for="aCity">Città</label><input class="f-in" id="aCity" type="text" placeholder="Milano" value="Milano"></div>' : '') +
      '<div class="fg"><label for="aEmail">Indirizzo email</label><input class="f-in" id="aEmail" type="email" autocomplete="email" placeholder="utente@esempio.it"></div>' +
      '<div class="fg"><label for="aPass">Password</label><input class="f-in" id="aPass" type="password" autocomplete="' + (mode==='login'?'current-password':'new-password') + '" placeholder="' + (mode==='login'?'La tua password':'Minimo 6 caratteri') + '"></div>' +
      '<div class="f-err hidden" id="aErr"></div>' +
      '<button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top:14px">' + SMIcons.get('shieldCheck',18,2) + (mode==='login'?'Accedi':'Crea account') + '</button>' +
    '</form>' +
    '<div class="demo-hint">' + SMIcons.get('info',14,2) + ' Account dimostrativo: <code>demo@soundmarket.it</code> · password <code>demo123</code>. Dati archiviati localmente nel browser.</div>';

  const submitAuth = (form) => {
    const mode = form.dataset.mode;
    const email = SMU.$('#aEmail').value, pass = SMU.$('#aPass').value;
    const err = SMU.$('#aErr');
    const res = mode === 'login' ? login(email, pass)
      : register(SMU.$('#aName') ? SMU.$('#aName').value : '', email, pass, SMU.$('#aCity') ? SMU.$('#aCity').value : 'Milano');
    if (!res.ok) { err.innerHTML = SMIcons.get('alert',13,2) + ' ' + SMU.esc(res.msg); err.classList.remove('hidden'); return; }
    SMU.closeModal();
    SMU.toast(mode==='login' ? 'Accesso effettuato. Bentornato, ' + res.user.name.split(' ')[0] + '.' : 'Account creato. Benvenuto su SoundMarket.', { type:'success' });
    if (window.SMApp) SMApp.renderAll();
  };

  /* ==========================================================
     PANNELLO IMPOSTAZIONI ACCOUNT
     ========================================================== */
  const openSettings = () => {
    if (!requireUser('Accedere per gestire l\u2019account.')) return;
    const f = fullUser();
    const I = SMIcons;
    const prefs = f.prefs || { email:true, chat:true, price:true };
    const row = (k, label, desc) =>
      '<label style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer">' +
      '<input type="checkbox" data-pref="' + k + '"' + (prefs[k] ? ' checked' : '') + ' style="margin-top:3px;accent-color:var(--petrol-800)">' +
      '<span><span class="semi sm" style="display:block">' + label + '</span><span class="xs muted">' + desc + '</span></span></label>';

    SMU.openModal('Impostazioni account',
      '<div style="display:flex;gap:16px;align-items:center;padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);margin-bottom:18px">' +
        '<div id="accAv" style="flex-shrink:0">' + avatarHTML(f, 'avatar-lg') + '</div>' +
        '<div style="min-width:0;flex:1"><div class="semi">' + SMU.esc(f.name) + '</div><div class="xs muted">' + SMU.esc(f.email) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
          '<button class="btn btn-outline btn-sm" id="accPick">' + I.get('camera',14) + (f.photo ? 'Cambia foto' : 'Carica foto') + '</button>' +
          (f.photo ? '<button class="btn btn-ghost btn-sm" id="accDel">' + I.get('trash',14) + 'Rimuovi</button>' : '') +
        '</div><div class="xs light" style="margin-top:6px">JPG o PNG, max 12 MB. Viene ritagliata e compressa localmente.</div>' +
        '<input type="file" id="accFile" accept="image/*" hidden></div></div>' +

      '<div class="form-sec"><div class="form-sec-title">' + I.get('user',15) + 'Dati profilo</div>' +
      '<form id="accProfile"><div class="f-row"><div class="fg"><label>Nome e cognome</label><input class="f-in" id="accName" value="' + SMU.esc(f.name) + '"></div>' +
      '<div class="fg"><label>Città</label><input class="f-in" id="accCity" value="' + SMU.esc(f.city || '') + '" placeholder="Milano"></div></div>' +
      '<div class="fg"><label>IBAN per i trasferimenti</label><input class="f-in tabular" id="accIban" value="' + SMU.esc(f.iban ? SMU.fmtIban(f.iban) : '') + '" placeholder="IT60 X054 2811 1010 0000 0123 456"><div class="hint">Validazione mod-97. Lasciare vuoto per non configurarlo.</div></div>' +
      '<div class="f-err hidden" id="accPErr"></div><button type="submit" class="btn btn-primary btn-block">' + I.get('check',15,2.2) + 'Salva dati profilo</button></form></div>' +

      '<div class="form-sec"><div class="form-sec-title">' + I.get('mail',15) + 'Cambia email</div>' +
      '<form id="accEmail"><div class="f-row"><div class="fg"><label>Nuova email</label><input class="f-in" id="accNewEmail" type="email" placeholder="' + SMU.esc(f.email) + '"></div>' +
      '<div class="fg"><label>Password attuale</label><input class="f-in" id="accEmailPass" type="password"></div></div>' +
      '<div class="f-err hidden" id="accEErr"></div><button type="submit" class="btn btn-outline btn-block">Aggiorna email</button></form></div>' +

      '<div class="form-sec"><div class="form-sec-title">' + I.get('lock',15) + 'Sicurezza</div>' +
      '<form id="accPass"><div class="f-row"><div class="fg"><label>Password attuale</label><input class="f-in" id="accOldPass" type="password"></div>' +
      '<div class="fg"><label>Nuova password</label><input class="f-in" id="accNewPass" type="password" placeholder="Minimo 6 caratteri"></div></div>' +
      '<div class="f-err hidden" id="accSErr"></div><button type="submit" class="btn btn-outline btn-block">Aggiorna password</button></form></div>' +

      '<div class="form-sec"><div class="form-sec-title">' + I.get('settings',15) + 'Preferenze di notifica</div>' +
      row('chat','Messaggi dai venditori','Avviso quando ricevi una risposta in chat.') +
      row('price','Variazioni di prezzo','Avviso quando un articolo salvato cambia prezzo.') +
      row('email','Riepilogo attività','Riepilogo periodico di ordini e movimenti.') +
      '<button class="btn btn-outline btn-block btn-sm" id="accPrefs" style="margin-top:12px">Salva preferenze</button></div>' +

      '<div class="form-sec"><div class="form-sec-title">' + I.get('fileText',15) + 'I tuoi dati</div>' +
      '<div class="spec-table" style="display:block"><table class="spec-table">' +
      '<tr><td>Iscrizione</td><td>' + SMU.esc(SMU.fmtDate(f.joined)) + '</td></tr>' +
      '<tr><td>Stato account</td><td>' + (f.verified ? '<span style="color:var(--success)">Verificato</span>' : 'Standard') + '</td></tr>' +
      '<tr><td>Annunci pubblicati</td><td class="tabular">' + SMU.store.get('sm.userItems', []).filter(i => i.sellerEmail === f.email).length + '</td></tr>' +
      '<tr><td>Ordini</td><td class="tabular">' + SMU.store.get('sm.orders.' + f.id, []).length + '</td></tr>' +
      '</table></div><button class="btn btn-outline btn-block btn-sm" id="accExport" style="margin-top:12px">' + I.get('dl',14) + 'Esporta tutti i dati (JSON)</button></div>' +

      '<div class="form-sec" style="margin-bottom:0"><div class="form-sec-title" style="color:var(--danger);border-color:#F3C6C6">' + I.get('alert',15) + 'Zona sensibile</div>' +
      '<p class="xs muted" style="margin-bottom:10px">L\u2019eliminazione rimuove definitivamente profilo, annunci, ordini, conversazioni e portafoglio da questo browser.</p>' +
      '<button class="btn btn-danger btn-block btn-sm" id="accDelete">' + I.get('trash',14) + 'Elimina account</button></div>',
      { wide:true });

    wireSettings();
  };

  const wireSettings = () => {
    const root = SMU.$('#modalRoot');
    const f = fullUser();
    const file = SMU.$('#accFile', root);
    const pick = SMU.$('#accPick', root);
    const del = SMU.$('#accDel', root);

    if (pick) pick.addEventListener('click', () => file.click());
    if (file) file.addEventListener('change', async () => {
      const fl = file.files && file.files[0]; if (!fl) return;
      try {
        const uri = await SMU.compressImage(fl, 400, 0.85);
        setPhoto(uri);
        SMU.$('#accAv', root).innerHTML = avatarHTML(fullUser(), 'avatar-lg');
        SMU.toast('Foto profilo aggiornata.', { type:'success' });
        if (window.SMApp) SMApp.renderAll();
        openSettings();
      } catch (e) { SMU.toast(e.message, { type:'error' }); }
      file.value = '';
    });
    if (del) del.addEventListener('click', () => {
      setPhoto('');
      SMU.toast('Foto profilo rimossa. Tornate le iniziali.', { type:'info' });
      if (window.SMApp) SMApp.renderAll();
      openSettings();
    });

    const pf = SMU.$('#accProfile', root);
    if (pf) pf.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = SMU.$('#accPErr', root);
      const name = SMU.$('#accName', root).value.trim();
      const city = SMU.$('#accCity', root).value.trim();
      const iban = SMU.$('#accIban', root).value.replace(/\s/g, '').toUpperCase();
      if (name.length < 2) { err.textContent = 'Nome di almeno 2 caratteri.'; err.classList.remove('hidden'); return; }
      if (iban && !SMU.ibanValid(iban)) { err.textContent = 'IBAN non valido: controllo mod-97 non superato.'; err.classList.remove('hidden'); return; }
      err.classList.add('hidden');
      updateProfile({ name, city, iban });
      SMU.toast('Dati profilo aggiornati.', { type:'success' });
      if (window.SMApp) SMApp.renderAll();
      openSettings();
    });

    const ef = SMU.$('#accEmail', root);
    if (ef) ef.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = SMU.$('#accEErr', root);
      const r = changeEmail(SMU.$('#accNewEmail', root).value, SMU.$('#accEmailPass', root).value);
      if (!r.ok) { err.textContent = r.msg; err.classList.remove('hidden'); return; }
      SMU.toast('Email aggiornata.', { type:'success' });
      if (window.SMApp) SMApp.renderAll();
      openSettings();
    });

    const sf = SMU.$('#accPass', root);
    if (sf) sf.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = SMU.$('#accSErr', root);
      const r = changePassword(SMU.$('#accOldPass', root).value, SMU.$('#accNewPass', root).value);
      if (!r.ok) { err.textContent = r.msg; err.classList.remove('hidden'); return; }
      SMU.toast('Password aggiornata.', { type:'success' });
      openSettings();
    });

    const pr = SMU.$('#accPrefs', root);
    if (pr) pr.addEventListener('click', () => {
      const p = {};
      SMU.$$('[data-pref]', root).forEach(c => { p[c.dataset.pref] = c.checked; });
      updateProfile({ prefs:p });
      SMU.toast('Preferenze salvate.', { type:'success' });
    });

    const ex = SMU.$('#accExport', root);
    if (ex) ex.addEventListener('click', exportData);

    const dz = SMU.$('#accDelete', root);
    if (dz) dz.addEventListener('click', () => {
      SMU.openModal('Eliminare l\u2019account?',
        '<p class="sm muted" style="margin-bottom:16px">L\u2019operazione rimuove definitivamente profilo, annunci, ordini, conversazioni e portafoglio da questo browser. Non è reversibile.</p>' +
        '<div style="display:flex;gap:10px"><button class="btn btn-danger btn-block" id="accDelYes">Elimina definitivamente</button>' +
        '<button class="btn btn-outline btn-block" id="accDelNo">Annulla</button></div>');
      SMU.$('#accDelYes').addEventListener('click', () => { SMU.closeModal(); deleteAccount(); });
      SMU.$('#accDelNo').addEventListener('click', () => openSettings());
    });
  };

  /* ---------- aggancio: voce nel menu utente + tab Account ---------- */
  const hook = () => {
    document.addEventListener('click', (e) => {
      const s = e.target.closest('[data-action="account-settings"]');
      if (s) { e.preventDefault(); e.stopImmediatePropagation(); openSettings(); return; }
      const t = e.target.closest('[data-action="prof-tab"][data-tab="account"]');
      if (t) { e.preventDefault(); e.stopImmediatePropagation(); openSettings(); return; }
      const av = e.target.closest('.prof-head .avatar-lg');
      if (av && current()) { e.preventDefault(); e.stopImmediatePropagation(); openSettings(); }
    }, true);
    try {
      const mo = new MutationObserver(() => {
        SMU.$$('.dropdown').forEach(dd => {
          if (dd.dataset.smAcc) return;
          dd.dataset.smAcc = '1';
          const sep = dd.querySelector('.dd-sep');
          const b = document.createElement('button');
          b.className = 'dd-item';
          b.setAttribute('data-action', 'account-settings');
          b.innerHTML = SMIcons.get('settings', 16) + ' Impostazioni account';
          if (sep) dd.insertBefore(b, sep); else dd.appendChild(b);
        });
      });
      mo.observe(document.body, { childList:true, subtree:true });
    } catch (e) {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();

  return { seedDemo, current, fullUser, requireUser, openAuth, submitAuth, logout, register, login,
    updateProfile, changePassword, changeEmail, setPhoto, deleteAccount, exportData, openSettings, avatarHTML, users };
})();