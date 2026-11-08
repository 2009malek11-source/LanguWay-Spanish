// Guarda el aviso de instalación del navegador para usarlo desde el botón «Instalar»
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__bip = e; });
window.addEventListener('appinstalled', function () { window.__bip = null; window.__installed = true; });
if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.innerHTML = ''; } }
// Introducción clásica: dura 3 segundos desde que empieza la carga
(function () {
  function hide() { var e = document.getElementById('splash'); if (!e) return; e.className = 'out'; setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 600); }
  var wait = Math.max(0, 3000 - (window.performance && performance.now ? performance.now() : 0));
  setTimeout(hide, wait);
  setTimeout(hide, 6000);
})();

;
window.LWS = window.LWS || {};
(function (L) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
  const raw = (s) => new Raw(s);
  const BAD = new Set(['__proto__', 'constructor', 'prototype']);
  const safeParse = (t) => JSON.parse(t, (k, v) => (BAD.has(k) ? undefined : v));
  function html(strings, ...vals) {
    let out = strings[0];
    vals.forEach((v, i) => {
      let t;
      if (v instanceof Raw) t = v.s;
      else if (Array.isArray(v)) t = v.map((x) => (x instanceof Raw ? x.s : esc(x))).join('');
      else t = esc(v);
      out += t + strings[i + 1];
    });
    return new Raw(out);
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (k) => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) return k.forEach(add);
      el.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
    };
    kids.forEach(add);
    return el;
  }
  function mount(container, content) {
    container.innerHTML = '';
    if (content instanceof Raw) container.innerHTML = content.s;
    else if (content) container.appendChild(content);
    return container;
  }

  // ---- texto ----
  function stripAcc(s) {
    return String(s).replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ');
  }
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[¿?¡!.,;:"“”«»()…]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  // Compara una respuesta escrita con la lista de respuestas válidas.
  function checkText(input, answers, opts) {
    opts = opts || {};
    const list = Array.isArray(answers) ? answers : [answers];
    const x = norm(input);
    if (!x) return { ok: false, kind: 'empty', expected: list[0] };
    for (const a of list) if (norm(a) === x) return { ok: true, kind: 'exact', expected: a };
    for (const a of list) if (stripAcc(norm(a)) === stripAcc(x)) return { ok: !opts.strictAccents, kind: 'tilde', expected: a };
    for (const a of list) {
      const na = stripAcc(norm(a)), nx = stripAcc(x);
      if (na.length >= 5 && lev(na, nx) <= 1) return { ok: false, kind: 'ortografia', expected: a };
    }
    return { ok: false, kind: 'wrong', expected: list[0] };
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function hash(str) { let x = 5381; for (let i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
  // slug conserva las tildes (cómo ≠ como) para ids de palabras estables y distintos
  function slug(s) { return String(s).toLowerCase().normalize('NFC').replace(/[^a-z0-9áéíóúüñ]+/g, '-').replace(/^-|-$/g, ''); }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(ts) { try { return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return dayKey(new Date(ts)); } }
  function fmtDateTime(ts) { try { return new Date(ts).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(ts); } }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function b64(buf) { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(str) { const s = atob(str); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }

  function toast(msg, kind, ms) {
    let box = $('#toasts');
    if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite', role: 'status' }); document.body.appendChild(box); }
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms || 3200);
    return t;
  }
  // modal({title, body(Node|Raw|string), actions:[{label,value,primary,danger}]}) → Promise(value)
  function modal(o) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const back = h('div', { class: 'modal-back' });
      const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || '' });
      const esc_ = o.escValue === undefined ? null : o.escValue;
      const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') close(esc_); };
      document.addEventListener('keydown', onKey);
      box.appendChild(h('button', { class: 'modal-x', 'aria-label': o.closeLabel || 'Cerrar', onclick: () => close(esc_) }, '×'));
      if (o.title) box.appendChild(h('h2', null, o.title));
      const body = h('div', { class: 'modal-body' });
      if (o.body instanceof Raw) body.innerHTML = o.body.s; else if (o.body && o.body.nodeType) body.appendChild(o.body); else if (o.body) body.textContent = o.body;
      box.appendChild(body);
      const acts = h('div', { class: 'modal-actions' });
      (o.actions || [{ label: 'Cerrar', value: true, primary: true }]).forEach((a) => {
        acts.appendChild(h('button', { class: 'btn ' + (a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'), onclick: () => close(a.value) }, a.label));
      });
      box.appendChild(acts);
      back.appendChild(box);
      back.addEventListener('mousedown', (e) => { if (e.target === back) close(esc_); });
      document.body.appendChild(back);
      const first = $('input,button.btn-primary,button.btn', box) || box;
      setTimeout(() => first.focus && first.focus(), 30);
      o.onOpen && o.onOpen(box, close);
    });
  }
  function reducedMotion() {
    if (document.documentElement.getAttribute('data-motion') === 'reduce') return true;
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  Object.assign(L, { $, $$, esc, html, raw, Raw, h, mount, stripAcc, norm, lev, checkText, shuffle, sample, hash, slug, uid, dayKey, fmtDate, fmtDateTime, pct, debounce, b64, unb64, safeParse, toast, modal, reducedMotion, pad });
  // Registro de rutas (las vistas lo usan antes de que cargue app.js)
  L.routes = [];
  L.route = function (pattern, fn, title) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (m, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    L.routes.push({ re, keys, fn, title });
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const NAME = 'languway-spanish';
  const VERSION = 1;
  let dbp = null;

  // Migraciones: añade un bloque `if (old < N)` por cada versión nueva.
  // Nunca borres stores existentes; solo crea/añade campos con valores por defecto.
  function migrate(db, old, tx) {
    if (old < 1) {
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('email', 'email', { unique: true });
      db.createObjectStore('progress', { keyPath: 'userId' });
      const words = db.createObjectStore('words', { keyPath: ['userId', 'id'] });
      words.createIndex('byUser', 'userId');
      const att = db.createObjectStore('attempts', { keyPath: 'aid', autoIncrement: true });
      att.createIndex('byUser', 'userId');
      const qs = db.createObjectStore('qstats', { keyPath: ['userId', 'qid'] });
      qs.createIndex('byUser', 'userId');
      db.createObjectStore('meta', { keyPath: 'key' });
    }
    // if (old < 2) { /* ejemplo: tx.objectStore('progress') ... añadir campos nuevos */ }
  }

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('IndexedDB no disponible'));
      const r = indexedDB.open(NAME, VERSION);
      r.onupgradeneeded = (e) => migrate(r.result, e.oldVersion, r.transaction);
      r.onsuccess = () => {
        const db = r.result;
        db.onversionchange = () => { db.close(); dbp = null; };
        res(db);
      };
      r.onerror = () => { dbp = null; rej(r.error); };
      r.onblocked = () => { dbp = null; rej(new Error('Base de datos bloqueada por otra pestaña')); };
    });
    return dbp;
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  async function get(store, key) { const db = await open(); return reqP(db.transaction(store).objectStore(store).get(key)); }
  async function all(store) { const db = await open(); return reqP(db.transaction(store).objectStore(store).getAll()); }
  async function byIndex(store, index, key) { const db = await open(); return reqP(db.transaction(store).objectStore(store).index(index).getAll(key)); }

  // Transacción atómica: ops = [{store, put:obj} | {store, del:key} | {store, add:obj}]
  // Se resuelve SOLO cuando la transacción se confirma (oncomplete) → guardado verificado.
  async function commit(ops) {
    if (!ops.length) return true;
    const db = await open();
    const names = Array.from(new Set(ops.map((o) => o.store)));
    return new Promise((res, rej) => {
      let t;
      try { t = db.transaction(names, 'readwrite'); } catch (e) { return rej(e); }
      ops.forEach((o) => {
        const s = t.objectStore(o.store);
        if (o.put) s.put(o.put); else if (o.add) s.add(o.add); else if (o.del !== undefined) s.delete(o.del);
      });
      t.oncomplete = () => res(true);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Transacción cancelada'));
    });
  }
  async function put(store, obj) { return commit([{ store, put: obj }]); }

  // Borra todos los datos de un usuario (cuenta local).
  async function deleteUser(userId) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(['users', 'progress', 'words', 'attempts', 'qstats'], 'readwrite');
      t.objectStore('users').delete(userId);
      t.objectStore('progress').delete(userId);
      ['words', 'attempts', 'qstats'].forEach((s) => {
        const idx = t.objectStore(s).index('byUser');
        idx.openKeyCursor(IDBKeyRange.only(userId)).onsuccess = (e) => {
          const c = e.target.result; if (c) { t.objectStore(s).delete(c.primaryKey); c.continue(); }
        };
      });
      t.oncomplete = () => res(true);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('abort'));
    });
  }

  L.db = { open, get, all, byIndex, commit, put, deleteUser, VERSION, NAME };
})(window.LWS);

;
(function (L) {
  'use strict';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const ITER = 150000;

  function available() { return !!(window.crypto && crypto.subtle); }
  async function deriveBits(pass, salt, iters) {
    const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters }, key, 256);
  }
  async function hashPassword(pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await deriveBits(pass, salt, ITER);
    return { salt: L.b64(salt), iters: ITER, hash: L.b64(bits) };
  }
  async function verifyPassword(pass, rec) {
    const bits = await deriveBits(pass, L.unb64(rec.salt), rec.iters);
    const a = new Uint8Array(bits), b = L.unb64(rec.hash);
    if (a.length !== b.length) return false;
    let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  }
  async function aesKey(pass, salt, iters) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encryptJSON(obj, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await aesKey(pass, salt, ITER);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { encrypted: true, iters: ITER, salt: L.b64(salt), iv: L.b64(iv), data: L.b64(ct) };
  }
  async function decryptJSON(pkg, pass) {
    const key = await aesKey(pass, L.unb64(pkg.salt), pkg.iters);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: L.unb64(pkg.iv) }, key, L.unb64(pkg.data));
    return L.safeParse(dec.decode(pt));
  }
  L.crypto = { available, hashPassword, verifyPassword, encryptJSON, decryptJSON, ITER };
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = (L.C = { levels: [], lessons: {}, grammar: [], pron: [], stories: [], dialogs: [], reading: [], listening: [], writing: [], sentences: [], placement: [], extraWords: [], verbs: [] });

  // ---------- constructores de preguntas ----------
  const Q = (L.Q = {});
  Q.mc = (q, a, wrongs, why, o) => Object.assign({ t: 'mc', q, a, o: [a].concat(wrongs), why }, o);
  Q.fill = (q, a, why, o) => Object.assign({ t: 'fill', q, a: Array.isArray(a) ? a : [a], why }, o);
  Q.write = (q, a, why, o) => Object.assign({ t: 'fill', q, a: Array.isArray(a) ? a : [a], why, s: 'escritura' }, o);
  Q.order = (a, why, o) => Object.assign({ t: 'order', a, why }, o);
  Q.listen = (say, q, a, wrongs, why, o) => Object.assign({ t: 'listen', say, q, a, o: [a].concat(wrongs), why }, o);
  Q.dict = (say, why, o) => Object.assign({ t: 'dict', say, a: say, why }, o);
  Q.match = (pairs, why, o) => Object.assign({ t: 'match', pairs, why }, o);
  Q.read = (ctx, q, a, wrongs, why, o) => Object.assign({ t: 'read', ctx, q, a, o: [a].concat(wrongs), why }, o);

  const defaultSkill = { listen: 'escucha', dict: 'escucha', read: 'lectura', match: 'vocabulario', fill: 'gramática', mc: 'gramática', order: 'gramática' };
  // Normaliza: asigna id estable (hash del contenido), habilidad y etiqueta.
  Q.prep = function (q, ctxId, level) {
    if (q._p) return q;
    q._p = true;
    q.s = q.s || defaultSkill[q.t] || 'gramática';
    q.tag = q.tag || ctxId || 'general';
    q.level = q.level || level || 'A1';
    const key = q.t + '|' + (q.q || '') + '|' + (q.say || '') + '|' + (Array.isArray(q.a) ? q.a[0] : q.a || '') + '|' + (q.pairs ? q.pairs.map((p) => p[0]).join(',') : '');
    q.id = q.id || 'q' + L.hash(key);
    return q;
  };

  C.addLevel = (lv) => C.levels.push(lv);
  C.addLesson = function (les) {
    C.lessons[les.id] = les;
    les.practice = (les.practice || []).map((q) => Q.prep(q, les.id, les.level));
    les.quiz = (les.quiz || []).map((q) => Q.prep(q, les.id, les.level));
    return les;
  };
  C.lessonList = (levelId) => {
    const lv = C.levels.find((x) => x.id === levelId);
    const out = [];
    lv.units.forEach((u) => u.lessons.forEach((l) => out.push(l)));
    return out;
  };
  C.level = (id) => C.levels.find((x) => x.id === id);
  C.levelIdx = (id) => C.levels.findIndex((x) => x.id === id);
  C.unitOfLesson = (lessonId) => {
    for (const lv of C.levels) for (const u of lv.units) if (u.lessons.some((l) => l.id === lessonId)) return { level: lv, unit: u };
    return null;
  };
  C.lessonReady = (id) => !!C.lessons[id];
  C.unitReady = (u) => u.lessons.every((l) => !!C.lessons[l.id]);
  C.levelReady = (lv) => lv.units.every(C.unitReady);

  const wid = (w) => 'w:' + L.slug(w);
  C.wordId = wid;
  // Preguntas autogeneradas a partir del vocabulario de una lección
  C.vocabQuestions = function (les, n) {
    const vs = les.vocab || [];
    const pool = C.allVocabDefs();
    const out = [];
    L.sample(vs, Math.min(n, vs.length)).forEach((v) => {
      let wrongs = L.sample(vs.filter((x) => x[0] !== v[0]).map((x) => x[0]), 3);
      while (wrongs.length < 3 && pool.length > 4) { const p = pool[Math.floor(Math.random() * pool.length)]; if (p.w !== v[0] && !wrongs.includes(p.w)) wrongs.push(p.w); }
      out.push(Q.prep(Q.mc('¿Qué palabra corresponde a esta definición? «' + v[2] + '»', v[0], wrongs, 'La palabra «' + v[0] + '» significa: ' + v[2], { s: 'vocabulario', tag: 'vocab:' + les.id }), les.id, les.level));
    });
    return out;
  };
  C._defs = null;
  C.allVocabDefs = function () {
    if (C._defs) return C._defs;
    const r = [];
    Object.values(C.lessons).forEach((les) => (les.vocab || []).forEach((v) => r.push({ w: v[0], def: v[2] })));
    return (C._defs = r);
  };
  C.listenQuestions = function (les, n) {
    const ls = les.listen || [];
    const out = [];
    L.sample(ls, Math.min(n, ls.length)).forEach((s, i) => {
      if (i % 2 === 0 && ls.length >= 3) {
        const wrongs = L.sample(ls.filter((x) => x !== s), 2);
        out.push(Q.prep(Q.listen(s, 'Escucha y elige la frase que oyes.', s, wrongs, 'La frase correcta era: «' + s + '».', { tag: 'escucha:' + les.id }), les.id, les.level));
      } else out.push(Q.prep(Q.dict(s, 'Escribe exactamente lo que oyes. Era: «' + s + '».', { tag: 'dictado:' + les.id }), les.id, les.level));
    });
    return out;
  };
  C.lessonBank = (id) => { const les = C.lessons[id]; return les ? les.practice.concat(les.quiz) : []; };
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  const u = (n, title, lessons) => ({ n, title, lessons: lessons.map((t) => ({ id: null, title: t })) });
  function lv(id, name, desc, skills, units) {
    units.forEach((un) => un.lessons.forEach((les, i) => { les.id = id.toLowerCase() + '.u' + un.n + '.l' + (i + 1); }));
    C.addLevel({ id, name, desc, skills, units });
  }
  lv('A1', 'Principiante', 'Primeros pasos: saludar, presentarte, hablar de tu familia y pedir cosas sencillas.',
    ['Saludos y presentaciones', 'Números, fechas y hora', 'Vocabulario cotidiano', 'Presente de verbos básicos', 'Frases cortas y preguntas simples'], [
      u(1, 'Primeros contactos', ['Saludos y despedidas', 'Presentarse', 'Los números']),
      u(2, 'Mi mundo', ['La familia', 'Los días y los meses', 'La hora']),
      u(3, 'Comida y ciudad', ['Comida y bebida', 'Colores y objetos', 'Lugares de la ciudad']),
      u(4, 'Acciones diarias', ['Verbos en -ar', 'Verbos en -er e -ir', 'Preguntas y frases cortas']),
    ]);
  lv('A2', 'Elemental', 'Situaciones cotidianas: rutina, compras, viajes, restaurantes y primeras narraciones en pasado.',
    ['Rutina y vida diaria', 'Compras, viajes y restaurantes', 'Describir personas y lugares', 'Pasado básico', 'Planes cercanos y comparaciones'], [
      u(1, 'Vida diaria', ['La rutina diaria', 'De compras', 'En el restaurante']),
      u(2, 'Viajar y describir', ['Viajes y transporte', 'En el hotel', 'Describir personas y lugares']),
      u(3, 'El pasado', ['Pretérito perfecto', 'Pretérito indefinido regular', 'Pretérito indefinido irregular']),
      u(4, 'Planes y comparaciones', ['Planes con ir a', 'Comparar', 'Salud y ayuda']),
    ]);
  lv('B1', 'Intermedio', 'Contar experiencias, dar opiniones, hablar de planes y entender conversaciones y textos de tema conocido.',
    ['Narrar con el pasado', 'Dar opiniones y consejos', 'Conectar ideas', 'Causas y consecuencias', 'Entender textos de longitud media'], [
      u(1, 'Contar historias', ['Pretérito imperfecto', 'Imperfecto e indefinido', 'Conectores del discurso']),
      u(2, 'Opiniones y planes', ['El futuro simple', 'Opinar y aconsejar', 'Causa y consecuencia']),
      u(3, 'Trabajo y estudios', ['El subjuntivo para deseos', 'Cartas y correos formales', 'La entrevista de trabajo']),
      u(4, 'Hipótesis y relatos', ['Condicional y cortesía', 'Hipótesis con si', 'Estilo indirecto']),
    ]);
  lv('B2', 'Intermedio alto', 'Discutir temas diversos, escribir textos claros y detallados y entender hablantes de distintos registros.',
    ['Argumentar y debatir', 'Textos claros y detallados', 'Estructuras variadas', 'Registros y variedades', 'Trabajo y estudio'], [
      u(1, 'Argumentar', ['Expresar acuerdo y desacuerdo', 'Subjuntivo en opiniones', 'Conectores argumentativos']),
      u(2, 'Textos escritos', ['El correo profesional', 'El artículo de opinión', 'Resumir un texto']),
      u(3, 'Registros y variedades', ['Formal e informal', 'Variedades del español', 'Humor e ironía']),
      u(4, 'Mundo laboral y académico', ['Reuniones y presentaciones', 'Exponer datos', 'Negociar y persuadir']),
    ]);
  lv('C1', 'Avanzado', 'Comprender textos largos y exigentes, expresarte con fluidez y precisión y usar el idioma con flexibilidad.',
    ['Textos complejos', 'Fluidez y precisión', 'Expresiones idiomáticas', 'Matices de estilo', 'Escritura académica y profesional'], [
      u(1, 'Fluidez y matiz', ['Perífrasis y matices verbales', 'Expresiones idiomáticas', 'Registro y tono']),
      u(2, 'Textos exigentes', ['Lectura de prensa', 'Textos literarios breves', 'Cohesión y coherencia']),
      u(3, 'Escribir con rigor', ['El ensayo académico', 'El informe profesional', 'La reseña crítica']),
      u(4, 'Debate avanzado', ['Argumentación compleja', 'Debates y tertulias', 'Hablar en público']),
    ]);
  lv('C2', 'Maestría', 'Comprender sin esfuerzo casi todo lo que se lee o se oye y expresarte con naturalidad y precisión en situaciones complejas.',
    ['Matices finos de significado', 'Estilos y registros', 'Escritura avanzada', 'Flexibilidad en situaciones complejas', 'Lectura crítica'], [
      u(1, 'Matices de significado', ['Sinónimos y connotación', 'Ambigüedad y doble sentido', 'Refranes y modismos']),
      u(2, 'Estilos', ['Lenguaje literario', 'Lenguaje jurídico y administrativo', 'Lenguaje periodístico']),
      u(3, 'Escritura avanzada', ['Síntesis y paráfrasis', 'Texto argumentativo extenso', 'Corrección y estilo']),
      u(4, 'Dominio del discurso', ['Interpretar el tono', 'Improvisar con precisión', 'Mediar entre registros']),
    ]);
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;

  C.addLesson({
    id: 'a1.u1.l1', level: 'A1', unit: 1, n: 1, title: 'Saludos y despedidas', topic: 'Conversación',
    goal: 'Al terminar esta lección, podrás saludar y despedirte según la hora y según la persona.',
    vocab: [
      ['hola', 'interjección', 'Palabra que usamos para saludar.', 'Hola, ¿cómo estás?', 'Hello, how are you?'],
      ['buenos días', 'expresión', 'Saludo que se usa por la mañana.', 'Buenos días, profesora.', 'Good morning, teacher.'],
      ['buenas tardes', 'expresión', 'Saludo que se usa después del mediodía y hasta que anochece.', 'Buenas tardes, señor López.', 'Good afternoon, Mr. López.'],
      ['buenas noches', 'expresión', 'Saludo o despedida que se usa por la noche.', 'Buenas noches, hasta mañana.', 'Good night, see you tomorrow.'],
      ['adiós', 'interjección', 'Palabra que usamos para despedirnos.', 'Adiós, hasta pronto.', 'Goodbye, see you soon.'],
      ['hasta luego', 'expresión', 'Despedida que usamos cuando vamos a ver a la persona dentro de poco tiempo.', 'Hasta luego, nos vemos en clase.', "See you later, we'll meet in class."],
      ['por favor', 'expresión', 'Palabras que usamos para pedir algo con educación.', 'Un café, por favor.', 'A coffee, please.'],
      ['gracias', 'interjección', 'Palabra que usamos para agradecer algo.', 'Muchas gracias por tu ayuda.', 'Thank you very much for your help.'],
    ],
    explain: {
      title: 'Saludar según la hora y el trato',
      body: [
        'En español el saludo cambia según la <b>hora del día</b>. «Hola» sirve a cualquier hora.',
        { t: 'table', head: ['Momento', 'Saludo'], rows: [['Por la mañana', 'Buenos días'], ['Por la tarde', 'Buenas tardes'], ['Por la noche', 'Buenas noches'], ['A cualquier hora', 'Hola']] },
        'También cambia según la <b>persona</b>. Con amigos y familia usamos <b>tú</b> (trato informal); con personas mayores o en situaciones formales usamos <b>usted</b>.',
        { t: 'ex', list: ['¿Cómo estás? (tú)', '¿Cómo está usted? (usted)', 'Muy bien, gracias. ¿Y tú?', 'Así, así.'] },
        { t: 'tip', text: 'La pregunta «¿Cómo estás?» lleva signos de interrogación al principio y al final: ¿...?' },
      ],
    },
    listen: ['Hola, buenos días.', 'Buenas tardes, ¿cómo está usted?', 'Muy bien, gracias. ¿Y tú?', 'Adiós, hasta luego.', 'Buenas noches, hasta mañana.'],
    practice: [
      mc('Son las nueve de la mañana. ¿Qué saludo usas?', 'Buenos días', ['Buenas noches', 'Hasta luego', 'Adiós'], 'Por la mañana decimos «buenos días».', { tag: 'saludos' }),
      fill('Buenas ___, señora García. (Son las cuatro de la tarde).', 'tardes', 'Después del mediodía decimos «buenas tardes».', { tag: 'saludos' }),
      mc('¿Cuál de estas palabras es una despedida?', 'Hasta luego', ['Hola', 'Por favor', 'Buenos días'], '«Hasta luego» sirve para despedirse.', { tag: 'saludos', s: 'vocabulario' }),
      order('¿Cómo está usted?', 'Con «usted» el verbo está en tercera persona: «está».', { tag: 'tu-usted' }),
    ],
    quiz: [
      mc('Quieres pedir algo con educación. ¿Qué dices?', 'Por favor', ['Adiós', 'Buenas noches', 'Hasta luego'], '«Por favor» se usa para pedir con educación.', { tag: 'saludos', s: 'vocabulario' }),
      fill('Un té, ___ favor.', 'por', 'La expresión completa es «por favor».', { tag: 'saludos' }),
      listen('Buenas noches, hasta mañana.', 'Escucha: ¿qué saludo oyes?', 'Buenas noches', ['Buenos días', 'Buenas tardes'], 'Se oye «buenas noches».', { tag: 'saludos' }),
      order('Muy bien, gracias', 'Respuesta habitual a «¿Cómo estás?».', { tag: 'saludos' }),
      mc('Hablas con tu profesor. ¿Qué pregunta es más formal?', '¿Cómo está usted?', ['¿Cómo estás?', '¿Qué tal?', '¿Cómo andas?'], 'Con «usted» usamos el trato formal: «está».', { tag: 'tu-usted' }),
      match([['gracias', 'Palabra que usamos para agradecer.'], ['adiós', 'Palabra para despedirnos.'], ['hola', 'Palabra para saludar.'], ['por favor', 'Palabras para pedir con educación.']], 'Repasa el vocabulario de la lección.', { tag: 'saludos' }),
    ],
  });

  C.addLesson({
    id: 'a1.u1.l2', level: 'A1', unit: 1, n: 2, title: 'Presentarse', topic: 'Conversación',
    goal: 'Al terminar esta lección, podrás decir tu nombre, tu país y tu ocupación con el verbo «ser».',
    vocab: [
      ['me llamo', 'expresión', 'Frase que usamos para decir cuál es nuestro nombre.', 'Me llamo Lucía.', 'My name is Lucía.'],
      ['soy', 'verbo', 'Forma del verbo «ser» para «yo». Sirve para decir quién eres.', 'Soy estudiante.', 'I am a student.'],
      ['de', 'preposición', 'Palabra que indica el origen de una persona o de una cosa.', 'Soy de México.', 'I am from Mexico.'],
      ['encantado', 'adjetivo', 'Palabra que decimos al conocer a una persona. Una mujer dice «encantada».', 'Encantado de conocerte.', 'Nice to meet you.'],
      ['el nombre', 'sustantivo', 'La palabra con la que llamamos a una persona.', 'Mi nombre es Pablo.', 'My name is Pablo.'],
      ['el país', 'sustantivo', 'Territorio con su propio gobierno, como España o Chile.', 'Mi país es Perú.', 'My country is Peru.'],
      ['el estudiante', 'sustantivo', 'Persona que estudia. Para hombre y mujer se dice igual: «estudiante».', 'Ella es estudiante de medicina.', 'She is a medical student.'],
      ['vivir', 'verbo', 'Tener tu casa en un lugar.', 'Vivo en Madrid.', 'I live in Madrid.'],
    ],
    explain: {
      title: 'El verbo «ser» en presente',
      body: [
        'Usamos <b>ser</b> para decir quién eres: tu nombre, tu origen y tu profesión.',
        { t: 'table', head: ['Persona', 'Ser'], rows: [['yo', 'soy'], ['tú', 'eres'], ['él / ella / usted', 'es'], ['nosotros / nosotras', 'somos'], ['vosotros / vosotras', 'sois'], ['ellos / ellas / ustedes', 'son']] },
        { t: 'ex', list: ['Yo soy de Chile.', 'Tú eres estudiante.', 'Ella es profesora.', 'Nosotros somos de España.'] },
        'Preguntas muy útiles para conocer a alguien:',
        { t: 'ex', list: ['¿Cómo te llamas?', '¿De dónde eres?', '¿Dónde vives?'] },
        { t: 'tip', text: 'Con «me llamo» no usamos «ser»: decimos «Me llamo Ana» o «Mi nombre es Ana».' },
      ],
    },
    listen: ['Hola, me llamo Ana.', 'Soy de Colombia.', '¿Cómo te llamas?', 'Mucho gusto, encantado.', 'Ella es profesora y vive en Madrid.'],
    practice: [
      fill('Yo ___ de Chile.', 'soy', '«Yo» lleva «soy».', { tag: 'ser-presente' }),
      mc('Tú ___ estudiante.', 'eres', ['soy', 'es', 'son'], 'Con «tú» usamos «eres».', { tag: 'ser-presente' }),
      order('Me llamo Carlos', 'Así decimos nuestro nombre.', { tag: 'presentarse' }),
      mc('Quieres saber el nombre de un amigo. ¿Qué preguntas?', '¿Cómo te llamas?', ['¿De dónde eres?', '¿Dónde vives?', '¿Cómo estás?'], 'Para preguntar el nombre decimos «¿Cómo te llamas?».', { tag: 'presentarse' }),
    ],
    quiz: [
      fill('Ella ___ profesora.', 'es', 'Con «ella» usamos «es».', { tag: 'ser-presente' }),
      fill('Nosotros ___ de España.', 'somos', 'Con «nosotros» usamos «somos».', { tag: 'ser-presente' }),
      mc('¿Qué respondes a «¿De dónde eres?»?', 'Soy de Argentina.', ['Me llamo Argentina.', 'Muy bien, gracias.', 'Buenas tardes, señor.'], 'Para el origen usamos «ser + de + país».', { tag: 'presentarse' }),
      listen('Me llamo Lucía y soy de Perú.', 'Escucha: ¿de dónde es Lucía?', 'De Perú', ['De Chile', 'De España'], 'Lucía dice «soy de Perú».', { tag: 'presentarse' }),
      dict('Soy estudiante y vivo en Madrid.', 'Practica la escritura de «soy» y «vivo».', { tag: 'presentarse' }),
      mc('¿Qué frase es incorrecta?', 'Ellos es de México.', ['Ellos son de México.', 'Ella es de México.', 'Yo soy de México.'], 'Con «ellos» usamos «son», no «es».', { tag: 'ser-presente' }),
    ],
  });

  C.addLesson({
    id: 'a1.u1.l3', level: 'A1', unit: 1, n: 3, title: 'Los números', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás contar hasta cien y decir tu edad y tu número de teléfono.',
    vocab: [
      ['cero', 'numeral', 'El número 0. No hay ninguna cosa.', 'Hay cero problemas.', 'There are zero problems.'],
      ['uno', 'numeral', 'El número 1.', 'Tengo un hermano.', 'I have one brother.'],
      ['cinco', 'numeral', 'El número 5.', 'Tengo cinco libros.', 'I have five books.'],
      ['diez', 'numeral', 'El número 10.', 'Mi clase empieza en diez minutos.', 'My class starts in ten minutes.'],
      ['quince', 'numeral', 'El número 15.', 'Hay quince estudiantes.', 'There are fifteen students.'],
      ['veinte', 'numeral', 'El número 20.', 'Tengo veinte años.', 'I am twenty years old.'],
      ['treinta', 'numeral', 'El número 30.', 'Mi padre tiene treinta y ocho años.', 'My father is thirty-eight years old.'],
      ['cien', 'numeral', 'El número 100.', 'El libro tiene cien páginas.', 'The book has one hundred pages.'],
    ],
    explain: {
      title: 'Contar de 0 a 100',
      body: [
        { t: 'table', head: ['Números', 'Palabras'], rows: [['0–5', 'cero, uno, dos, tres, cuatro, cinco'], ['6–10', 'seis, siete, ocho, nueve, diez'], ['11–15', 'once, doce, trece, catorce, quince'], ['16–20', 'dieciséis, diecisiete, dieciocho, diecinueve, veinte']] },
        'Las decenas son: <b>treinta, cuarenta, cincuenta, sesenta, setenta, ochenta, noventa, cien</b>.',
        'Desde el 31 se forma con <b>y</b>: treinta <b>y</b> uno, cuarenta <b>y</b> cinco. Del 21 al 29 se escribe en una palabra: veintiuno, veintidós, veintitrés...',
        { t: 'ex', list: ['Tengo veinte años.', 'Mi número es el seis, uno, dos, tres.', 'Hay treinta y cinco estudiantes.'] },
        { t: 'tip', text: 'Para preguntar la edad: «¿Cuántos años tienes?». Respuesta: «Tengo veinte años».' },
      ],
    },
    listen: ['Tengo veinte años.', 'Mi número es el cinco, tres, dos, uno.', 'Hay treinta y cinco estudiantes.', '¿Cuántos años tienes?', 'El libro tiene cien páginas.'],
    practice: [
      fill('Escribe con letras: 15', 'quince', 'El 15 se escribe «quince».', { tag: 'numeros' }),
      mc('¿Qué número es «treinta y cuatro»?', '34', ['43', '24', '14'], 'Treinta = 30, y cuatro = 4: 34.', { tag: 'numeros' }),
      fill('¿Cuántos años ___? (tú)', 'tienes', 'Preguntamos la edad con el verbo «tener».', { tag: 'tener' }),
      order('Tengo veinte años', 'La edad se dice con «tener», no con «ser».', { tag: 'tener' }),
    ],
    quiz: [
      fill('Escribe con letras: 10', 'diez', 'El 10 se escribe «diez».', { tag: 'numeros' }),
      fill('Escribe con letras: 100', 'cien', 'El 100 se escribe «cien».', { tag: 'numeros' }),
      mc('¿Cómo se escribe 21?', 'veintiuno', ['veinte uno', 'veinte y uno', 'dosuno'], 'Del 21 al 29 se escribe en una sola palabra.', { tag: 'numeros' }),
      listen('Tengo veinte años.', 'Escucha: ¿cuántos años tiene la persona?', '20', ['12', '30'], 'Se oye «veinte»: 20.', { tag: 'numeros' }),
      dict('Hay treinta y cinco estudiantes.', 'Del 31 en adelante se usa «y».', { tag: 'numeros' }),
      match([['cero', 'El número 0. No hay ninguna cosa.'], ['cinco', 'El número 5.'], ['quince', 'El número 15.'], ['treinta', 'El número 30.']], 'Repasa los números.', { tag: 'numeros' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;

  C.addLesson({
    id: 'a1.u2.l1', level: 'A1', unit: 2, n: 1, title: 'La familia', topic: 'Familia',
    goal: 'Al terminar esta lección, podrás hablar de tu familia con el verbo «tener» y con mi, tu y su.',
    vocab: [
      ['la familia', 'sustantivo', 'Grupo de personas unidas por parentesco: padres, hijos, hermanos.', 'Mi familia es grande.', 'My family is big.'],
      ['la madre', 'sustantivo', 'Mujer que tiene un hijo o una hija.', 'Mi madre se llama Rosa.', "My mother's name is Rosa."],
      ['el padre', 'sustantivo', 'Hombre que tiene un hijo o una hija.', 'Mi padre trabaja en un banco.', 'My father works at a bank.'],
      ['el hermano', 'sustantivo', 'Hijo de tus mismos padres. Si es mujer, es «la hermana».', 'Tengo un hermano mayor.', 'I have an older brother.'],
      ['la hermana', 'sustantivo', 'Hija de tus mismos padres.', 'Mi hermana estudia música.', 'My sister studies music.'],
      ['los abuelos', 'sustantivo', 'Los padres de tu padre o de tu madre.', 'Mis abuelos viven en Sevilla.', 'My grandparents live in Seville.'],
      ['el hijo', 'sustantivo', 'Persona que tiene padres. Si es mujer, es «la hija».', 'Ellos tienen dos hijos.', 'They have two children.'],
      ['tener', 'verbo', 'Poseer algo o tener una relación con alguien. También sirve para decir la edad.', 'Tengo dos hermanas.', 'I have two sisters.'],
    ],
    explain: {
      title: 'El verbo «tener» y los posesivos',
      body: [
        '<b>Tener</b> es un verbo irregular. Lo usamos para hablar de la familia, de las cosas y de la edad.',
        { t: 'table', head: ['Persona', 'Tener'], rows: [['yo', 'tengo'], ['tú', 'tienes'], ['él / ella / usted', 'tiene'], ['nosotros', 'tenemos'], ['vosotros', 'tenéis'], ['ellos / ustedes', 'tienen']] },
        'Los posesivos indican a quién pertenece algo. Cambian si el sustantivo es plural:',
        { t: 'table', head: ['Persona', 'Un solo objeto', 'Varios objetos'], rows: [['mío', 'mi madre', 'mis padres'], ['tuyo', 'tu hermano', 'tus hermanos'], ['suyo', 'su abuela', 'sus abuelos']] },
        { t: 'ex', list: ['Tengo dos hermanos y una hermana.', 'Mis abuelos viven en Sevilla.', '¿Tienes hermanos?'] },
        { t: 'tip', text: 'Los posesivos «mi, tu, su» no cambian con el género: «mi padre», «mi madre».' },
      ],
    },
    listen: ['Mi familia es grande.', 'Tengo dos hermanos y una hermana.', 'Mi madre se llama Rosa.', 'Mis abuelos viven en Sevilla.', '¿Tienes hermanos?'],
    practice: [
      fill('Yo ___ dos hermanos.', 'tengo', 'Con «yo» usamos «tengo».', { tag: 'tener' }),
      mc('Mi hermana ___ veinte años.', 'tiene', ['tengo', 'tienes', 'tienen'], 'Con «ella» usamos «tiene».', { tag: 'tener' }),
      mc('Los padres de mi madre son mis...', 'abuelos', ['hermanos', 'hijos', 'primos'], 'Los padres de tus padres son tus abuelos.', { tag: 'familia', s: 'vocabulario' }),
      order('Mis padres se llaman Ana y Luis', 'Con varios sustantivos usamos «mis».', { tag: 'posesivos' }),
    ],
    quiz: [
      fill('Ellos ___ tres hijos.', 'tienen', 'Con «ellos» usamos «tienen».', { tag: 'tener' }),
      fill('Tengo tres hermanas. ___ hermanas viven en Lima.', 'mis', 'El sustantivo es plural: «mis hermanas».', { tag: 'posesivos' }),
      mc('¿Qué frase es correcta?', 'Mis abuelos son simpáticos.', ['Mi abuelos son simpáticos.', 'Mis abuelo es simpático.', 'Mi abuelos es simpáticos.'], 'El posesivo concuerda en número: «mis abuelos».', { tag: 'posesivos' }),
      listen('Tengo dos hermanos y una hermana.', 'Escucha: ¿cuántas hermanas tiene la persona?', 'Una', ['Dos', 'Ninguna'], 'Se oye «una hermana».', { tag: 'familia' }),
      dict('Mi madre se llama Rosa.', 'Escribe la frase completa.', { tag: 'familia' }),
      match([['la madre', 'Mujer que tiene un hijo o una hija.'], ['el padre', 'Hombre que tiene un hijo o una hija.'], ['los abuelos', 'Los padres de tu padre o de tu madre.'], ['la familia', 'Grupo de personas unidas por parentesco.']], 'Repasa el vocabulario de la familia.', { tag: 'familia' }),
    ],
  });

  C.addLesson({
    id: 'a1.u2.l2', level: 'A1', unit: 2, n: 2, title: 'Los días y los meses', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás decir qué día es, el mes y tu fecha de cumpleaños.',
    vocab: [
      ['el lunes', 'sustantivo', 'Primer día de la semana laboral.', 'El lunes tengo clase.', 'On Monday I have class.'],
      ['el sábado', 'sustantivo', 'Sexto día de la semana. Muchas personas no trabajan.', 'El sábado no hay clase.', 'On Saturday there is no class.'],
      ['el domingo', 'sustantivo', 'Último día de la semana.', 'El domingo como con mi familia.', 'On Sunday I eat with my family.'],
      ['la semana', 'sustantivo', 'Período de siete días.', 'Una semana tiene siete días.', 'A week has seven days.'],
      ['el mes', 'sustantivo', 'Cada una de las doce partes del año.', 'Mayo es el quinto mes del año.', 'May is the fifth month of the year.'],
      ['enero', 'sustantivo', 'Primer mes del año.', 'Mi cumpleaños es en enero.', 'My birthday is in January.'],
      ['hoy', 'adverbio', 'El día en el que estamos ahora.', 'Hoy es martes.', 'Today is Tuesday.'],
      ['mañana', 'adverbio', 'El día siguiente a hoy.', 'Mañana tengo un examen.', 'Tomorrow I have an exam.'],
    ],
    explain: {
      title: 'Los días, los meses y la fecha',
      body: [
        { t: 'table', head: ['Días de la semana', 'Meses del año'], rows: [['lunes, martes, miércoles', 'enero, febrero, marzo'], ['jueves, viernes', 'abril, mayo, junio'], ['sábado, domingo', 'julio, agosto, septiembre'], ['', 'octubre, noviembre, diciembre']] },
        'En español los días y los meses se escriben con <b>minúscula</b>: «hoy es martes», «mi cumpleaños es en mayo».',
        'Para decir la fecha: <b>día + de + mes</b>.',
        { t: 'ex', list: ['Hoy es martes, 4 de junio.', '¿Qué día es hoy?', 'Mi cumpleaños es el cinco de mayo.', 'El sábado no hay clase.'] },
        { t: 'tip', text: 'Con los días usamos «el»: el lunes (= este lunes), los lunes (= siempre).' },
      ],
    },
    listen: ['Hoy es lunes.', 'Mi cumpleaños es el cinco de mayo.', '¿Qué día es hoy?', 'El sábado no hay clase.', 'Hay doce meses en un año.'],
    practice: [
      fill('Escribe el día que sigue a lunes:', 'martes', 'Después de lunes viene martes.', { tag: 'dias' }),
      mc('¿Cuántos días tiene una semana?', 'siete', ['cinco', 'seis', 'diez'], 'Una semana tiene siete días.', { tag: 'dias', s: 'vocabulario' }),
      order('Mi cumpleaños es el cinco de mayo', 'Fecha: día + de + mes.', { tag: 'fechas' }),
      mc('Después de miércoles viene...', 'jueves', ['martes', 'viernes', 'domingo'], 'El orden es lunes, martes, miércoles, jueves, viernes...', { tag: 'dias' }),
    ],
    quiz: [
      fill('Escribe el mes que viene después de enero:', 'febrero', 'Enero, febrero, marzo...', { tag: 'meses' }),
      mc('¿Qué frase está bien escrita?', 'Hoy es martes, 4 de junio.', ['Hoy es Martes, 4 de Junio.', 'Hoy es martes, 4 junio.', 'Hoy es el martes de 4 junio.'], 'Los días y los meses van en minúscula y la fecha lleva «de».', { tag: 'fechas' }),
      listen('Mi cumpleaños es el cinco de mayo.', 'Escucha: ¿en qué mes es el cumpleaños?', 'Mayo', ['Marzo', 'Junio'], 'Se oye «de mayo».', { tag: 'meses' }),
      dict('El sábado no hay clase.', 'Practica «sábado» con tilde.', { tag: 'dias' }),
      mc('Hoy es lunes. ¿Qué día es mañana?', 'Martes', ['Domingo', 'Miércoles', 'Viernes'], 'Mañana es el día siguiente a hoy.', { tag: 'dias' }),
      match([['la semana', 'Período de siete días.'], ['el mes', 'Cada una de las doce partes del año.'], ['hoy', 'El día en el que estamos ahora.'], ['mañana', 'El día siguiente a hoy.']], 'Repasa el vocabulario del tiempo.', { tag: 'dias' }),
    ],
  });

  C.addLesson({
    id: 'a1.u2.l3', level: 'A1', unit: 2, n: 3, title: 'La hora', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás preguntar y decir la hora y a qué hora empiezan las cosas.',
    vocab: [
      ['la hora', 'sustantivo', 'Cada una de las 24 partes del día. También es el momento exacto del día.', '¿Qué hora es?', 'What time is it?'],
      ['el minuto', 'sustantivo', 'Cada una de las 60 partes de una hora.', 'Espera cinco minutos, por favor.', 'Wait five minutes, please.'],
      ['el reloj', 'sustantivo', 'Objeto que sirve para saber la hora.', 'Mi reloj es nuevo.', 'My watch is new.'],
      ['en punto', 'expresión', 'Cuando la hora es exacta, sin minutos de más.', 'Son las tres en punto.', "It's three o'clock sharp."],
      ['y media', 'expresión', 'Treinta minutos después de una hora.', 'Es la una y media.', "It's half past one."],
      ['la mañana', 'sustantivo', 'Parte del día desde que sale el sol hasta el mediodía.', 'Estudio por la mañana.', 'I study in the morning.'],
      ['la tarde', 'sustantivo', 'Parte del día entre el mediodía y la noche.', 'Como a las dos de la tarde.', 'I eat at two in the afternoon.'],
      ['la noche', 'sustantivo', 'Parte del día cuando no hay sol.', 'Duermo por la noche.', 'I sleep at night.'],
    ],
    explain: {
      title: 'Preguntar y decir la hora',
      body: [
        'Para preguntar: <b>¿Qué hora es?</b> Para preguntar el momento de algo: <b>¿A qué hora...?</b>',
        'Con la una usamos <b>es</b>; con las demás horas usamos <b>son</b>.',
        { t: 'table', head: ['Hora', 'Se dice'], rows: [['1:00', 'Es la una (en punto)'], ['3:00', 'Son las tres en punto'], ['3:15', 'Son las tres y cuarto'], ['3:30', 'Son las tres y media'], ['2:45', 'Son las tres menos cuarto']] },
        { t: 'ex', list: ['¿Qué hora es?', 'La clase empieza a las ocho de la mañana.', 'Son las seis menos cuarto.'] },
        { t: 'tip', text: 'Para saber si es de día o de noche decimos: de la mañana, de la tarde, de la noche.' },
      ],
    },
    listen: ['Son las tres en punto.', 'Es la una y media.', 'La clase empieza a las ocho de la mañana.', '¿Qué hora es?', 'Son las seis menos cuarto.'],
    practice: [
      fill('¿Qué hora es? ___ la una.', 'Es', 'Con «la una» el verbo está en singular: «es».', { tag: 'hora' }),
      fill('Son las cinco ___ media.', 'y', 'Treinta minutos después: «y media».', { tag: 'hora' }),
      mc('¿Cómo se dice 3:15?', 'Son las tres y cuarto.', ['Son las tres y media.', 'Son las tres menos cuarto.', 'Es la tres y cuarto.'], 'Quince minutos después: «y cuarto».', { tag: 'hora' }),
      order('La clase empieza a las ocho', 'Para el momento de una actividad usamos «a las».', { tag: 'hora' }),
    ],
    quiz: [
      fill('¿A ___ hora empieza la clase?', 'qué', 'La pregunta correcta es «¿A qué hora...?». «Qué» lleva tilde.', { tag: 'interrogativos', hint: 'palabra interrogativa' }),
      mc('¿Cómo se dice 7:45?', 'Son las ocho menos cuarto.', ['Son las siete y cuarto.', 'Son las ocho y cuarto.', 'Son las siete menos cuarto.'], 'Quince minutos antes de las ocho: «las ocho menos cuarto».', { tag: 'hora' }),
      listen('Es la una y media.', 'Escucha: ¿qué hora es?', '1:30', ['2:30', '1:15'], 'Se oye «la una y media»: 1:30.', { tag: 'hora' }),
      dict('Son las seis menos cuarto.', 'Escribe la hora.', { tag: 'hora' }),
      mc('¿Qué frase es correcta?', 'Es la una.', ['Son la una.', 'Es las una.', 'Son las una.'], 'Con «la una» usamos «es».', { tag: 'hora' }),
      match([['el reloj', 'Objeto que sirve para saber la hora.'], ['el minuto', 'Cada una de las 60 partes de una hora.'], ['en punto', 'Cuando la hora es exacta, sin minutos de más.'], ['y media', 'Treinta minutos después de una hora.']], 'Repasa el vocabulario de la hora.', { tag: 'hora' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;

  C.addLesson({
    id: 'a1.u3.l1', level: 'A1', unit: 3, n: 1, title: 'Comida y bebida', topic: 'Comida',
    goal: 'Al terminar esta lección, podrás pedir comida y bebida y decir qué te gusta con «querer» y «gustar».',
    vocab: [
      ['el agua', 'sustantivo', 'Líquido transparente que bebemos para vivir.', 'Quiero un vaso de agua.', 'I want a glass of water.'],
      ['el pan', 'sustantivo', 'Alimento que se hace con harina y se come en el desayuno o con la comida.', 'Me gusta el pan con aceite.', 'I like bread with olive oil.'],
      ['la leche', 'sustantivo', 'Bebida blanca que producen las vacas.', 'Bebo leche por la mañana.', 'I drink milk in the morning.'],
      ['el café', 'sustantivo', 'Bebida caliente y oscura que se prepara con granos tostados.', 'Quiero un café, por favor.', 'I would like a coffee, please.'],
      ['la manzana', 'sustantivo', 'Fruta redonda que puede ser roja, verde o amarilla.', 'La manzana es roja.', 'The apple is red.'],
      ['el pollo', 'sustantivo', 'Carne del ave que se llama gallina o gallo.', 'Hoy comemos pollo con arroz.', 'Today we eat chicken with rice.'],
      ['querer', 'verbo', 'Tener el deseo de conseguir o hacer algo. También sirve para decir que amas a alguien.', 'Quiero comer una manzana.', 'I want to eat an apple.'],
      ['gustar', 'verbo', 'Producir placer o agrado. Decimos «me gusta» cuando algo nos agrada.', 'Me gusta el café.', 'I like coffee.'],
    ],
    explain: {
      title: 'Querer y gustar',
      body: [
        '<b>Querer</b> es un verbo irregular (e → ie en casi todas las personas).',
        { t: 'table', head: ['Persona', 'Querer'], rows: [['yo', 'quiero'], ['tú', 'quieres'], ['él / ella / usted', 'quiere'], ['nosotros', 'queremos'], ['vosotros', 'queréis'], ['ellos / ustedes', 'quieren']] },
        'Con <b>gustar</b> la cosa que nos gusta es el sujeto: usamos «gusta» con una cosa y «gustan» con varias.',
        { t: 'table', head: ['Me gusta...', 'Me gustan...'], rows: [['el café', 'las manzanas'], ['la leche', 'los tomates'], ['comer pan', 'los plátanos']] },
        { t: 'ex', list: ['Quiero un café, por favor.', 'Me gusta el pan.', 'No me gustan las manzanas verdes.', '¿Qué quieres beber?'] },
        { t: 'tip', text: 'Para pedir en un bar o restaurante: «Quiero...» o «Quisiera... , por favor».' },
      ],
    },
    listen: ['Quiero un café, por favor.', 'Me gusta el pan.', 'No me gustan las manzanas.', '¿Qué quieres comer?', 'Ella quiere agua y arroz con pollo.'],
    practice: [
      fill('Yo ___ un café. (querer)', 'quiero', 'Con «yo»: quiero.', { tag: 'querer' }),
      mc('Me ___ las manzanas.', 'gustan', ['gusta', 'gusto', 'gustas'], 'Las manzanas es plural: «gustan».', { tag: 'gustar' }),
      mc('Me ___ el pan.', 'gusta', ['gustan', 'gusto', 'gustas'], 'El pan es singular: «gusta».', { tag: 'gustar' }),
      order('Quiero agua, por favor', 'Así pedimos algo con educación.', { tag: 'querer' }),
    ],
    quiz: [
      fill('Ellos ___ pollo con arroz. (querer)', 'quieren', 'Con «ellos»: quieren.', { tag: 'querer' }),
      fill('Me ___ la leche.', 'gusta', 'La leche es singular: «gusta».', { tag: 'gustar' }),
      mc('¿Qué frase es correcta?', 'Me gustan los tomates.', ['Me gusta los tomates.', 'Me gustan el tomate.', 'Yo gusto los tomates.'], 'Con un sustantivo plural usamos «gustan».', { tag: 'gustar' }),
      listen('Quiero un café, por favor.', 'Escucha: ¿qué quiere beber la persona?', 'Café', ['Leche', 'Agua'], 'Se oye «un café».', { tag: 'querer' }),
      dict('Me gusta el pan con leche.', 'Escribe la frase completa.', { tag: 'gustar' }),
      match([['el agua', 'Líquido transparente que bebemos para vivir.'], ['la leche', 'Bebida blanca que producen las vacas.'], ['la manzana', 'Fruta redonda que puede ser roja, verde o amarilla.'], ['el pan', 'Alimento que se hace con harina y se come en el desayuno o con la comida.']], 'Repasa el vocabulario de comida.', { tag: 'comida' }),
    ],
  });

  C.addLesson({
    id: 'a1.u3.l2', level: 'A1', unit: 3, n: 2, title: 'Colores y objetos', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás describir objetos con colores y usar bien artículos, género y número.',
    vocab: [
      ['el color', 'sustantivo', 'Lo que vemos en un objeto: rojo, azul, verde...', 'Mi color favorito es el azul.', 'My favorite color is blue.'],
      ['rojo', 'adjetivo', 'Color de la sangre o del tomate.', 'Tengo un coche rojo.', 'I have a red car.'],
      ['azul', 'adjetivo', 'Color del cielo cuando no hay nubes.', 'El cielo es azul.', 'The sky is blue.'],
      ['verde', 'adjetivo', 'Color de la hierba.', 'La manzana es verde.', 'The apple is green.'],
      ['la mesa', 'sustantivo', 'Mueble con patas y una superficie plana.', 'El libro está sobre la mesa.', 'The book is on the table.'],
      ['el libro', 'sustantivo', 'Conjunto de hojas con texto para leer.', 'Leo un libro interesante.', 'I am reading an interesting book.'],
      ['la casa', 'sustantivo', 'Edificio donde vive una persona o una familia.', 'Mi casa es pequeña.', 'My house is small.'],
      ['grande', 'adjetivo', 'De tamaño mayor que lo normal.', 'La ciudad es muy grande.', 'The city is very big.'],
    ],
    explain: {
      title: 'Género, número y adjetivos',
      body: [
        'Los sustantivos en español tienen <b>género</b> (masculino o femenino) y <b>número</b> (singular o plural).',
        { t: 'table', head: ['', 'Masculino', 'Femenino'], rows: [['Artículo definido', 'el libro', 'la casa'], ['Artículo indefinido', 'un libro', 'una casa'], ['Plural definido', 'los libros', 'las casas'], ['Plural indefinido', 'unos libros', 'unas casas']] },
        'Plural: si termina en vocal, añadimos <b>-s</b> (libro → libros). Si termina en consonante, añadimos <b>-es</b> (color → colores).',
        'Los adjetivos <b>concuerdan</b> con el sustantivo: «un libro rojo», «una casa roja», «unas casas rojas». Los adjetivos que terminan en -e o en consonante (grande, azul) no cambian de género: «una casa grande», «un libro azul».',
        { t: 'ex', list: ['La casa es grande.', 'Tengo dos libros azules.', 'Las mesas son verdes.'] },
      ],
    },
    listen: ['El libro es rojo.', 'La casa es grande.', 'Tengo dos libros azules.', 'Mi color favorito es el verde.', 'Las mesas son grandes.'],
    practice: [
      mc('___ casa es grande.', 'La', ['El', 'Los', 'Un'], '«Casa» es femenino singular: «la casa».', { tag: 'articulos' }),
      fill('Los libros son ___. (azul, plural)', 'azules', 'Azul termina en consonante: plural «azules».', { tag: 'plural' }),
      mc('Tengo ___ mesa verde.', 'una', ['un', 'unos', 'el'], '«Mesa» es femenina: «una mesa».', { tag: 'articulos' }),
      order('La casa verde es grande', 'El adjetivo va después del sustantivo.', { tag: 'adjetivos' }),
    ],
    quiz: [
      fill('El plural de «libro» es:', 'libros', 'Termina en vocal: añadimos -s.', { tag: 'plural' }),
      fill('La manzana es ___. (rojo)', 'roja', 'Concordancia con «manzana» (femenino): «roja».', { tag: 'adjetivos' }),
      mc('¿Qué frase es correcta?', 'Las casas son grandes.', ['Las casas es grande.', 'Los casas son grandes.', 'Las casas son grande.'], 'Artículo, verbo y adjetivo concuerdan con «casas».', { tag: 'adjetivos' }),
      listen('Tengo dos libros azules.', 'Escucha: ¿de qué color son los libros?', 'Azules', ['Rojos', 'Verdes'], 'Se oye «azules».', { tag: 'adjetivos' }),
      dict('La casa es grande y verde.', 'Escribe la frase completa.', { tag: 'adjetivos' }),
      match([['el color', 'Lo que vemos en un objeto: rojo, azul, verde...'], ['la mesa', 'Mueble con patas y una superficie plana.'], ['el libro', 'Conjunto de hojas con texto para leer.'], ['la casa', 'Edificio donde vive una persona o una familia.']], 'Repasa el vocabulario de objetos.', { tag: 'objetos' }),
    ],
  });

  C.addLesson({
    id: 'a1.u3.l3', level: 'A1', unit: 3, n: 3, title: 'Lugares de la ciudad', topic: 'Viajes',
    goal: 'Al terminar esta lección, podrás decir dónde está algo y qué hay en tu ciudad con «estar» y «hay».',
    vocab: [
      ['la ciudad', 'sustantivo', 'Lugar grande donde viven muchas personas.', 'Mi ciudad tiene un parque grande.', 'My city has a big park.'],
      ['la calle', 'sustantivo', 'Camino con casas a los lados por donde pasan personas y coches.', 'La farmacia está en la calle Mayor.', 'The pharmacy is on Mayor Street.'],
      ['el parque', 'sustantivo', 'Lugar con árboles y plantas donde las personas pasean.', 'Hay un parque cerca de mi casa.', 'There is a park near my house.'],
      ['el supermercado', 'sustantivo', 'Tienda grande donde compramos comida y otras cosas.', 'Compro fruta en el supermercado.', 'I buy fruit at the supermarket.'],
      ['la farmacia', 'sustantivo', 'Tienda donde se compran medicinas.', 'La farmacia está abierta.', 'The pharmacy is open.'],
      ['el hospital', 'sustantivo', 'Lugar donde los médicos cuidan a los enfermos.', 'El hospital está en el centro.', 'The hospital is downtown.'],
      ['estar', 'verbo', 'Verbo que usamos para decir dónde está algo o cómo se encuentra alguien.', 'Estoy en la escuela.', 'I am at school.'],
      ['hay', 'verbo', 'Forma de «haber» que usamos para decir que algo existe.', 'En mi ciudad hay un hospital.', 'In my city there is a hospital.'],
    ],
    explain: {
      title: '«Estar» para el lugar y «hay» para lo que existe',
      body: [
        '<b>Estar</b> en presente:',
        { t: 'table', head: ['Persona', 'Estar'], rows: [['yo', 'estoy'], ['tú', 'estás'], ['él / ella / usted', 'está'], ['nosotros', 'estamos'], ['vosotros', 'estáis'], ['ellos / ustedes', 'están']] },
        'Usamos <b>estar</b> para decir dónde está algo que ya conocemos: «La farmacia está en la calle Mayor». Usamos <b>hay</b> para decir que algo existe: «Hay una farmacia en mi calle». «Hay» no cambia en plural: «hay un parque», «hay dos parques».',
        'Palabras para el lugar: <b>en, cerca de, lejos de, al lado de, enfrente de, entre</b>.',
        { t: 'ex', list: ['¿Dónde está la farmacia?', 'El supermercado está al lado del banco.', 'En mi ciudad hay un hospital grande.'] },
        { t: 'tip', text: 'a + el = al; de + el = del: «al lado del parque».' },
      ],
    },
    listen: ['¿Dónde está la farmacia?', 'La farmacia está en la calle Mayor.', 'Hay un parque cerca de mi casa.', 'El supermercado está al lado del banco.', 'En mi ciudad hay un hospital grande.'],
    practice: [
      fill('¿Dónde ___ el parque?', 'está', 'Preguntamos el lugar de algo conocido con «estar».', { tag: 'estar-hay' }),
      mc('En mi ciudad ___ un hospital.', 'hay', ['está', 'es', 'están'], 'Para decir que algo existe usamos «hay».', { tag: 'estar-hay' }),
      mc('Mi casa está muy ___ del parque. (a pocos metros)', 'cerca', ['lejos', 'entre', 'sobre'], '«Cerca de» indica poca distancia.', { tag: 'lugar', s: 'vocabulario' }),
      order('La farmacia está en la calle Mayor', 'Estar + en + lugar.', { tag: 'estar-hay' }),
    ],
    quiz: [
      fill('Nosotros ___ en el parque. (estar)', 'estamos', 'Con «nosotros»: estamos.', { tag: 'estar-hay' }),
      mc('¿Qué frase es correcta?', 'Hay dos parques en mi ciudad.', ['Están dos parques en mi ciudad.', 'Es dos parques en mi ciudad.', 'Hay dos parque en mi ciudad.'], '«Hay» sirve para singular y plural.', { tag: 'estar-hay' }),
      listen('La farmacia está en la calle Mayor.', 'Escucha: ¿dónde está la farmacia?', 'En la calle Mayor', ['En el parque', 'Al lado del hospital'], 'Se oye «en la calle Mayor».', { tag: 'lugar' }),
      dict('En mi ciudad hay un hospital grande.', 'Escribe la frase completa.', { tag: 'estar-hay' }),
      mc('«El supermercado está al lado del banco» significa que el supermercado está...', 'junto al banco', ['lejos del banco', 'encima del banco', 'dentro del banco'], '«Al lado de» significa «junto a».', { tag: 'lugar', s: 'vocabulario' }),
      match([['la ciudad', 'Lugar grande donde viven muchas personas.'], ['el parque', 'Lugar con árboles y plantas donde las personas pasean.'], ['la farmacia', 'Tienda donde se compran medicinas.'], ['el hospital', 'Lugar donde los médicos cuidan a los enfermos.']], 'Repasa el vocabulario de lugares.', { tag: 'lugar' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;

  C.addLesson({
    id: 'a1.u4.l1', level: 'A1', unit: 4, n: 1, title: 'Verbos en -ar', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás conjugar verbos regulares en -ar en presente y hablar de lo que haces.',
    vocab: [
      ['hablar', 'verbo', 'Decir palabras para comunicarte con otras personas.', 'Hablo español con mis amigos.', 'I speak Spanish with my friends.'],
      ['trabajar', 'verbo', 'Hacer una actividad por la que recibes dinero.', 'Mi padre trabaja en un banco.', 'My father works at a bank.'],
      ['estudiar', 'verbo', 'Dedicar tiempo a aprender algo.', 'Estudiamos por la tarde.', 'We study in the afternoon.'],
      ['caminar', 'verbo', 'Moverte de un lugar a otro con los pies.', 'Camino al trabajo todos los días.', 'I walk to work every day.'],
      ['comprar', 'verbo', 'Dar dinero a cambio de un producto.', 'Compro pan en el supermercado.', 'I buy bread at the supermarket.'],
      ['necesitar', 'verbo', 'Tener falta de algo que es importante.', 'Necesito un libro nuevo.', 'I need a new book.'],
      ['escuchar', 'verbo', 'Poner atención para oír algo.', 'Escucho música por la noche.', 'I listen to music at night.'],
      ['el español', 'sustantivo', 'Lengua que se habla en España y en muchos países de América.', 'Estudio español todos los días.', 'I study Spanish every day.'],
    ],
    explain: {
      title: 'El presente de los verbos en -ar',
      body: [
        'Los verbos regulares en -ar tienen la misma terminación. Quita <b>-ar</b> y añade estas terminaciones:',
        { t: 'table', head: ['Persona', 'Terminación', 'hablar'], rows: [['yo', '-o', 'hablo'], ['tú', '-as', 'hablas'], ['él / ella / usted', '-a', 'habla'], ['nosotros', '-amos', 'hablamos'], ['vosotros', '-áis', 'habláis'], ['ellos / ustedes', '-an', 'hablan']] },
        'En español casi siempre omitimos el pronombre: la terminación ya dice quién hace la acción. «Hablo español» (no «yo hablo» salvo que queramos destacar).',
        'Para negar ponemos <b>no</b> antes del verbo: «No hablo inglés».',
        { t: 'ex', list: ['Trabajo en un banco.', 'Ella estudia español.', 'Nosotros compramos pan.', 'No necesito el libro.'] },
      ],
    },
    listen: ['Hablo español y un poco de inglés.', 'Ella trabaja en una escuela.', 'Nosotros estudiamos por la tarde.', '¿Qué compras en el supermercado?', 'No necesito el libro.'],
    practice: [
      fill('Yo ___ español. (hablar)', 'hablo', 'Con «yo»: -o.', { tag: 'presente-ar' }),
      fill('Tú ___ en un banco. (trabajar)', 'trabajas', 'Con «tú»: -as.', { tag: 'presente-ar' }),
      mc('Nosotros ___ por la mañana. (estudiar)', 'estudiamos', ['estudio', 'estudian', 'estudias'], 'Con «nosotros»: -amos.', { tag: 'presente-ar' }),
      order('Ella compra pan en el supermercado', 'Verbo en tercera persona: «compra».', { tag: 'presente-ar' }),
    ],
    quiz: [
      fill('Ellos ___ mucho. (caminar)', 'caminan', 'Con «ellos»: -an.', { tag: 'presente-ar' }),
      fill('Usted ___ un café. (necesitar)', 'necesita', 'Con «usted»: -a.', { tag: 'presente-ar' }),
      mc('¿Qué frase es correcta?', 'Nosotros trabajamos en la ciudad.', ['Nosotros trabajan en la ciudad.', 'Nosotros trabajo en la ciudad.', 'Nosotros trabajas en la ciudad.'], 'Con «nosotros»: trabaj + amos.', { tag: 'presente-ar' }),
      listen('Ella trabaja en una escuela.', 'Escucha: ¿dónde trabaja ella?', 'En una escuela', ['En un banco', 'En un hospital'], 'Se oye «en una escuela».', { tag: 'presente-ar' }),
      dict('Nosotros estudiamos por la tarde.', 'Escribe la frase completa.', { tag: 'presente-ar' }),
      match([['hablar', 'Decir palabras para comunicarte con otras personas.'], ['comprar', 'Dar dinero a cambio de un producto.'], ['escuchar', 'Poner atención para oír algo.'], ['caminar', 'Moverte de un lugar a otro con los pies.']], 'Repasa los verbos en -ar.', { tag: 'verbos-ar' }),
    ],
  });

  C.addLesson({
    id: 'a1.u4.l2', level: 'A1', unit: 4, n: 2, title: 'Verbos en -er e -ir', topic: 'Vida cotidiana',
    goal: 'Al terminar esta lección, podrás conjugar verbos regulares en -er e -ir y describir tu rutina.',
    vocab: [
      ['comer', 'verbo', 'Tomar alimentos sólidos.', 'Como pan por la mañana.', 'I eat bread in the morning.'],
      ['beber', 'verbo', 'Tomar un líquido.', 'Bebo agua todos los días.', 'I drink water every day.'],
      ['leer', 'verbo', 'Mirar un texto y entender lo que dice.', 'Ella lee un libro por la noche.', 'She reads a book at night.'],
      ['aprender', 'verbo', 'Adquirir un conocimiento nuevo con el estudio o la práctica.', 'Aprendo español.', 'I am learning Spanish.'],
      ['escribir', 'verbo', 'Poner palabras en un papel o en una pantalla.', 'Escribo una carta.', 'I am writing a letter.'],
      ['abrir', 'verbo', 'Quitar lo que cierra una puerta o una ventana.', 'Abro la ventana.', 'I am opening the window.'],
      ['correr', 'verbo', 'Moverte muy rápido con los pies.', 'Corro en el parque.', 'I run in the park.'],
      ['recibir', 'verbo', 'Obtener algo que alguien te envía o te da.', 'Recibo un correo.', 'I receive an email.'],
    ],
    explain: {
      title: 'El presente de los verbos en -er y en -ir',
      body: [
        'Los verbos en -er e -ir tienen terminaciones muy parecidas. Solo cambian en <b>nosotros</b> y <b>vosotros</b>.',
        { t: 'table', head: ['Persona', 'comer (-er)', 'vivir (-ir)'], rows: [['yo', 'como', 'vivo'], ['tú', 'comes', 'vives'], ['él / ella / usted', 'come', 'vive'], ['nosotros', 'comemos', 'vivimos'], ['vosotros', 'coméis', 'vivís'], ['ellos / ustedes', 'comen', 'viven']] },
        'Para hablar de la rutina usamos expresiones como <b>todos los días</b>, <b>por la mañana</b>, <b>por la tarde</b> y <b>por la noche</b>.',
        { t: 'ex', list: ['Como pan y bebo leche por la mañana.', 'Ella lee un libro todos los días.', 'Nosotros vivimos en una ciudad grande.'] },
      ],
    },
    listen: ['Como pan y bebo leche por la mañana.', 'Ella lee un libro todos los días.', 'Nosotros vivimos en una ciudad grande.', '¿Qué escribes?', 'Ellos aprenden español.'],
    practice: [
      fill('Yo ___ pan. (comer)', 'como', 'Con «yo»: -o.', { tag: 'presente-er-ir' }),
      fill('Nosotros ___ en Madrid. (vivir)', 'vivimos', 'En -ir, «nosotros» termina en -imos.', { tag: 'presente-er-ir' }),
      mc('Tú ___ un libro. (leer)', 'lees', ['leo', 'lee', 'leen'], 'Con «tú»: -es.', { tag: 'presente-er-ir' }),
      order('Ellos beben agua todos los días', 'Con «ellos»: -en.', { tag: 'presente-er-ir' }),
    ],
    quiz: [
      fill('Ella ___ una carta. (escribir)', 'escribe', 'Con «ella»: -e.', { tag: 'presente-er-ir' }),
      fill('Vosotros ___ español. (aprender)', 'aprendéis', 'Con «vosotros» en -er: -éis.', { tag: 'presente-er-ir' }),
      mc('¿Qué frase es correcta?', 'Nosotros vivimos aquí.', ['Nosotros viven aquí.', 'Nosotros vivís aquí.', 'Nosotros vivo aquí.'], 'Con «nosotros» en -ir: -imos.', { tag: 'presente-er-ir' }),
      listen('Ella lee un libro todos los días.', 'Escucha: ¿qué hace ella todos los días?', 'Lee un libro', ['Escribe una carta', 'Come pan'], 'Se oye «lee un libro».', { tag: 'presente-er-ir' }),
      dict('Como pan y bebo leche por la mañana.', 'Escribe la frase completa.', { tag: 'presente-er-ir' }),
      match([['comer', 'Tomar alimentos sólidos.'], ['beber', 'Tomar un líquido.'], ['leer', 'Mirar un texto y entender lo que dice.'], ['abrir', 'Quitar lo que cierra una puerta o una ventana.']], 'Repasa los verbos en -er e -ir.', { tag: 'verbos-er-ir' }),
    ],
  });

  C.addLesson({
    id: 'a1.u4.l3', level: 'A1', unit: 4, n: 3, title: 'Preguntas y frases cortas', topic: 'Conversación',
    goal: 'Al terminar esta lección, podrás hacer preguntas simples, responder y decir adónde vas con el verbo «ir».',
    vocab: [
      ['qué', 'pronombre interrogativo', 'Palabra que usamos para preguntar por una cosa.', '¿Qué quieres beber?', 'What do you want to drink?'],
      ['quién', 'pronombre interrogativo', 'Palabra que usamos para preguntar por una persona.', '¿Quién es ella?', 'Who is she?'],
      ['dónde', 'adverbio interrogativo', 'Palabra que usamos para preguntar por el lugar.', '¿Dónde vives?', 'Where do you live?'],
      ['cuándo', 'adverbio interrogativo', 'Palabra que usamos para preguntar por el tiempo.', '¿Cuándo es tu cumpleaños?', 'When is your birthday?'],
      ['cómo', 'adverbio interrogativo', 'Palabra que usamos para preguntar por la manera o el estado.', '¿Cómo estás?', 'How are you?'],
      ['por qué', 'expresión', 'Pregunta que usamos para pedir el motivo de algo. Se responde con «porque».', '¿Por qué estudias español?', 'Why do you study Spanish?'],
      ['cuánto', 'adverbio interrogativo', 'Palabra que usamos para preguntar por la cantidad.', '¿Cuánto cuesta el pan?', 'How much does the bread cost?'],
      ['ir', 'verbo', 'Moverte de un lugar a otro.', 'Voy al parque con mi hermano.', 'I go to the park with my brother.'],
    ],
    explain: {
      title: 'Preguntar y responder; el verbo «ir»',
      body: [
        'Las palabras interrogativas siempre llevan <b>tilde</b> y la pregunta lleva dos signos: <b>¿ ... ?</b>',
        { t: 'table', head: ['Pregunta', 'Qué pregunta'], rows: [['¿Qué?', 'una cosa'], ['¿Quién?', 'una persona'], ['¿Dónde?', 'un lugar'], ['¿Cuándo?', 'el tiempo'], ['¿Cómo?', 'la manera'], ['¿Cuánto? / ¿Cuántos?', 'la cantidad'], ['¿Por qué?', 'el motivo («porque...»)']] },
        '<b>Ir</b> es irregular: voy, vas, va, vamos, vais, van. Después de «ir» usamos <b>a</b>: «Voy <b>a</b>l parque» (a + el = al).',
        { t: 'ex', list: ['¿Dónde vives?', '¿Por qué estudias español? — Porque me gusta el idioma.', 'Voy al parque con mi hermano.', '¿Cuándo vas al supermercado?'] },
        { t: 'tip', text: 'Una pregunta de sí o no no necesita palabra interrogativa: «¿Vives en Madrid?» — «Sí, vivo en Madrid» / «No, vivo en Sevilla».' },
      ],
    },
    listen: ['¿Dónde vives?', '¿Quién es ella?', 'Voy al parque con mi hermano.', '¿Por qué estudias español?', 'Porque me gusta el idioma.'],
    practice: [
      fill('¿___ vives? (el lugar)', 'Dónde', 'Preguntamos por el lugar con «dónde».', { tag: 'interrogativos' }),
      fill('Yo ___ al parque. (ir)', 'voy', 'Con «yo»: voy.', { tag: 'ir' }),
      mc('¿Qué pregunta pide el motivo?', '¿Por qué?', ['¿Quién?', '¿Cuándo?', '¿Dónde?'], '«¿Por qué?» pregunta el motivo.', { tag: 'interrogativos' }),
      order('¿Cuándo vas al supermercado?', 'La palabra interrogativa va al principio.', { tag: 'interrogativos' }),
    ],
    quiz: [
      fill('Nosotros ___ a la escuela. (ir)', 'vamos', 'Con «nosotros»: vamos.', { tag: 'ir' }),
      fill('¿___ años tienes?', 'Cuántos', '«Años» es plural masculino: «cuántos».', { tag: 'interrogativos' }),
      mc('Respondes: «Porque me gusta». ¿Qué pregunta te hicieron?', '¿Por qué estudias español?', ['¿Dónde estudias español?', '¿Quién estudia español?', '¿Cuándo estudias español?'], '«Porque» responde a «¿por qué?».', { tag: 'interrogativos' }),
      listen('Voy al parque con mi hermano.', 'Escucha: ¿con quién va al parque?', 'Con su hermano', ['Con su madre', 'Con su amigo'], 'Se oye «con mi hermano».', { tag: 'ir' }),
      dict('¿Por qué estudias español?', 'Escribe la pregunta completa.', { tag: 'interrogativos' }),
      match([['dónde', 'Palabra que usamos para preguntar por el lugar.'], ['quién', 'Palabra que usamos para preguntar por una persona.'], ['cuándo', 'Palabra que usamos para preguntar por el tiempo.'], ['cómo', 'Palabra que usamos para preguntar por la manera o el estado.']], 'Repasa los interrogativos.', { tag: 'interrogativos' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'levantarse': 'to get up', 'ducharse': 'to take a shower', 'desayunar': 'to have breakfast', 'vestirse': 'to get dressed', 'acostarse': 'to go to bed',
    'normalmente': 'usually; normally', 'a veces': 'sometimes', 'nunca': 'never',
    'la tienda': 'shop; store', 'la talla': 'size (clothes)', 'probarse': 'to try on', 'el precio': 'price', 'la tarjeta': 'card', 'el descuento': 'discount',
    'demasiado': 'too; too much', 'costar': 'to cost',
    'la carta': 'menu; letter', 'el camarero': 'waiter', 'la cuenta': 'bill; check; account', 'el plato': 'dish; plate', 'pedir': 'to ask for; to order',
    'recomendar': 'to recommend', 'el postre': 'dessert', 'la propina': 'tip (money)'
  });

  C.addLesson({
    id: 'a2.u1.l1', level: 'A2', unit: 1, n: 1, title: 'La rutina diaria', topic: 'Rutina',
    goal: 'Al terminar esta lección, podrás contar tu rutina de un día normal con verbos reflexivos, horas y adverbios de frecuencia.',
    vocab: [
      ['levantarse', 'verbo', 'Salir de la cama después de dormir.', 'Me levanto a las siete.', 'I get up at seven.'],
      ['ducharse', 'verbo', 'Lavarte el cuerpo con agua en la ducha.', 'Me ducho antes de desayunar.', 'I take a shower before having breakfast.'],
      ['desayunar', 'verbo', 'Tomar la primera comida del día.', 'Desayuno café y pan tostado.', 'I have coffee and toast for breakfast.'],
      ['vestirse', 'verbo', 'Ponerte la ropa.', 'Me visto en cinco minutos.', 'I get dressed in five minutes.'],
      ['acostarse', 'verbo', 'Meterte en la cama para dormir.', 'Me acuesto a las once.', 'I go to bed at eleven.'],
      ['normalmente', 'adverbio', 'Casi siempre, de manera habitual.', 'Normalmente ceno en casa.', 'I usually have dinner at home.', ['habitualmente']],
      ['a veces', 'expresión', 'No siempre; de vez en cuando.', 'A veces voy al gimnasio.', 'Sometimes I go to the gym.'],
      ['nunca', 'adverbio', 'En ningún momento.', 'Nunca llego tarde.', 'I never arrive late.'],
    ],
    explain: { title: 'Verbos reflexivos, horas y frecuencia', body: [
      'Los <b>verbos reflexivos</b> llevan un pronombre (me, te, se, nos, os, se) porque la acción recae sobre la misma persona que la hace.',
      { t: 'table', head: ['Persona', 'Pronombre', 'levantarse'], rows: [['yo', 'me', 'me levanto'], ['tú', 'te', 'te levantas'], ['él / ella / usted', 'se', 'se levanta'], ['nosotros', 'nos', 'nos levantamos'], ['vosotros', 'os', 'os levantáis'], ['ellos / ustedes', 'se', 'se levantan']] },
      'Para decir la hora de una actividad usamos <b>a las</b> + hora: «Me levanto a las siete». Con la una: <b>a la una</b>.',
      '<b>Adverbios de frecuencia:</b> siempre, normalmente, a veces, casi nunca, nunca. «Nunca» puede ir antes del verbo: «Nunca desayuno fuera». Con «no», el verbo va antes: «No desayuno nunca».',
      { t: 'ex', list: ['Me levanto a las siete y me ducho.', 'Normalmente desayuno en casa.', 'Mi hermano se acuesta tarde.', 'A veces nos vestimos rápido.'] },
      { t: 'tip', text: 'Cambio de raíz: en «acostarse» la «o» pasa a «ue» en yo, tú, él y ellos: me acuesto, te acuestas, se acuesta, nos acostamos, se acuestan.' },
    ] },
    listen: ['Me levanto a las siete y media.', 'Normalmente desayuno café con tostadas.', 'Mi hermana se ducha por la noche.', 'Nunca me acuesto antes de las once.', 'A veces vamos al gimnasio después del trabajo.'],
    practice: [
      fill('Yo ___ a las siete. (levantarse)', 'me levanto', 'Con «yo» el pronombre es «me».', { tag: 'reflexivos' }),
      fill('Mi padre ___ a las once. (acostarse)', 'se acuesta', 'Con «él»: pronombre «se» y cambio o → ue.', { tag: 'reflexivos' }),
      mc('¿Qué frase es correcta?', 'Nos duchamos por la mañana.', ['Nos duchan por la mañana.', 'Se duchamos por la mañana.', 'Me duchamos por la mañana.'], 'Con «nosotros»: nos + ducha + mos.', { tag: 'reflexivos' }),
      order('Normalmente me levanto a las siete', 'Primero la frecuencia, después el verbo reflexivo.', { tag: 'reflexivos', alts: ['Me levanto a las siete normalmente'] }),
    ],
    quiz: [
      fill('Tú ___ muy temprano. (levantarse)', 'te levantas', 'Con «tú»: te + levantas.', { tag: 'reflexivos' }),
      fill('Ellos ___ a las doce. (acostarse)', 'se acuestan', 'Con «ellos»: se + acuestan.', { tag: 'reflexivos' }),
      mc('«No desayuno nunca» significa...', 'Siempre me salto el desayuno', ['Siempre desayuno', 'A veces desayuno', 'Desayuno dos veces'], 'Con «no ... nunca» negamos la acción en cualquier momento.', { tag: 'frecuencia' }),
      mc('¿Cómo se dice 1:00 en una frase?', 'Me levanto a la una.', ['Me levanto a las una.', 'Me levanto en la una.', 'Me levanto la una.'], 'La una es singular: «a la una».', { tag: 'horas' }),
      listen('Nunca me acuesto antes de las once.', 'Escucha: ¿a qué hora no se acuesta nunca?', 'Antes de las once', ['Después de las once', 'Antes de las diez', 'A las doce'], 'Dice «antes de las once».', { tag: 'reflexivos' }),
      dict('Normalmente desayuno en casa.', 'Revisa los acentos y la doble «n» de «normalmente».', { tag: 'dictado' }),
      match([['levantarse', 'Salir de la cama'], ['ducharse', 'Lavarte con agua'], ['vestirse', 'Ponerte la ropa'], ['acostarse', 'Meterte en la cama']], 'Revisa el significado de cada verbo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u1.l2', level: 'A2', unit: 1, n: 2, title: 'De compras', topic: 'Compras',
    goal: 'Al terminar esta lección, podrás comprar ropa y otros productos: preguntar precios, tallas y formas de pago.',
    vocab: [
      ['la tienda', 'sustantivo', 'Lugar donde se venden productos.', 'Esta tienda abre a las diez.', 'This shop opens at ten.'],
      ['la talla', 'sustantivo', 'Medida de una prenda de ropa.', '¿Qué talla usas?', 'What size do you wear?'],
      ['probarse', 'verbo', 'Ponerte una prenda para ver si te queda bien.', '¿Puedo probarme esta camisa?', 'Can I try on this shirt?'],
      ['el precio', 'sustantivo', 'Cantidad de dinero que cuesta algo.', 'El precio es muy bueno.', 'The price is very good.'],
      ['la tarjeta', 'sustantivo', 'Pieza de plástico que sirve para pagar.', 'Pago con tarjeta.', 'I pay by card.'],
      ['el descuento', 'sustantivo', 'Rebaja en el precio de algo.', 'Hoy hay un descuento del veinte por ciento.', 'Today there is a twenty percent discount.', ['la rebaja']],
      ['demasiado', 'adverbio', 'Más de lo necesario o de lo conveniente.', 'Este abrigo es demasiado caro.', 'This coat is too expensive.'],
      ['costar', 'verbo', 'Tener un precio determinado.', '¿Cuánto cuestan estos zapatos?', 'How much do these shoes cost?'],
    ],
    explain: { title: 'Preguntar precios y usar los demostrativos', body: [
      'Para preguntar el precio usamos <b>¿Cuánto cuesta?</b> (singular) o <b>¿Cuánto cuestan?</b> (plural). Otras frases útiles: «¿Tiene esta camisa en una talla más grande?», «¿Puedo pagar con tarjeta?».',
      { t: 'table', head: ['', 'masculino', 'femenino', 'neutro'], rows: [['este (cerca de mí)', 'este / estos', 'esta / estas', 'esto'], ['ese (cerca de ti)', 'ese / esos', 'esa / esas', 'eso'], ['aquel (lejos)', 'aquel / aquellos', 'aquella / aquellas', 'aquello']] },
      'Los demostrativos concuerdan con el sustantivo: «esta camisa», «estos zapatos».',
      '<b>Demasiado</b> expresa exceso: «demasiado caro». No lo confundas con <b>muy</b>: «muy caro» solo da énfasis.',
      { t: 'ex', list: ['¿Cuánto cuesta esta chaqueta?', 'Estos pantalones me quedan grandes.', '¿Puedo probarme aquel vestido?', 'Es demasiado caro para mí.'] },
    ] },
    listen: ['¿Cuánto cuesta esta camisa?', 'Busco una talla mediana, por favor.', '¿Puedo pagar con tarjeta?', 'Este abrigo es demasiado caro.', 'Hoy hay un descuento del veinte por ciento.'],
    practice: [
      fill('¿Cuánto ___ estos zapatos? (costar)', 'cuestan', 'Sujeto plural → «cuestan».', { tag: 'compras' }),
      mc('___ camisa es muy bonita. (cerca de mí)', 'Esta', ['Este', 'Estas', 'Esos'], 'Camisa es femenino singular: «esta».', { tag: 'demostrativos' }),
      mc('¿Cómo preguntas si puedes ponerte una prenda?', '¿Puedo probármelo?', ['¿Puedo comprarlo?', '¿Puedo lavarlo?', '¿Puedo venderlo?'], 'Probarse = ponerte algo para ver cómo te queda.', { tag: 'compras' }),
      order('¿Puedo pagar con tarjeta', 'Estructura: «Puedo» + infinitivo + complemento.', { tag: 'compras', alts: [] }),
    ],
    quiz: [
      mc('Este pantalón ___ grande. (me queda)', 'me queda', ['me quedan', 'te queda', 'se quedan'], 'Pantalón es singular: «me queda».', { tag: 'compras' }),
      fill('Estos zapatos son ___ caros. (exceso)', 'demasiado', '«Demasiado» indica exceso.', { tag: 'compras' }),
      mc('¿Qué palabra usas para un objeto lejos de los dos?', 'aquel', ['este', 'ese', 'esto'], '«Aquel» señala algo lejos.', { tag: 'demostrativos' }),
      listen('Busco una talla mediana, por favor.', 'Escucha: ¿qué busca la persona?', 'Una talla mediana', ['Una talla pequeña', 'Un descuento', 'Una tarjeta'], 'Dice «una talla mediana».', { tag: 'compras' }),
      dict('¿Cuánto cuesta esta camisa?', 'Revisa los signos de interrogación y las tildes.', { tag: 'dictado' }),
      mc('¿Qué significa «un descuento del veinte por ciento»?', 'El precio baja un veinte por ciento', ['El precio sube', 'Hay veinte productos', 'La tienda cierra'], 'Descuento = rebaja del precio.', { tag: 'vocabulario' }),
      match([['la tienda', 'Lugar donde se venden productos'], ['la talla', 'Medida de una prenda'], ['el precio', 'Cantidad de dinero que cuesta algo'], ['la tarjeta', 'Sirve para pagar']], 'Repasa el vocabulario de compras.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u1.l3', level: 'A2', unit: 1, n: 3, title: 'En el restaurante', topic: 'Restaurante',
    goal: 'Al terminar esta lección, podrás pedir una mesa, elegir platos, hacer peticiones corteses y pedir la cuenta.',
    vocab: [
      ['la carta', 'sustantivo', 'Lista de platos y bebidas de un restaurante.', '¿Nos trae la carta, por favor?', 'Could you bring us the menu, please?', ['el menú']],
      ['el camarero', 'sustantivo', 'Persona que sirve la comida en un restaurante.', 'El camarero es muy amable.', 'The waiter is very kind.'],
      ['la cuenta', 'sustantivo', 'Papel que indica lo que hay que pagar.', 'La cuenta, por favor.', 'The bill, please.'],
      ['el plato', 'sustantivo', 'Cada una de las comidas que se sirven en una comida; también, el recipiente donde se come.', 'De primer plato quiero una sopa.', 'For my first course I would like a soup.'],
      ['pedir', 'verbo', 'Decir lo que quieres que te den.', 'Pido una ensalada y pescado.', 'I order a salad and fish.'],
      ['recomendar', 'verbo', 'Aconsejar algo a alguien porque es bueno.', '¿Qué me recomienda?', 'What do you recommend?'],
      ['el postre', 'sustantivo', 'Comida dulce que se toma al final.', 'De postre quiero fruta.', 'For dessert I would like fruit.'],
      ['la propina', 'sustantivo', 'Dinero extra que se deja a quien te sirve.', 'Dejamos una propina al camarero.', 'We left the waiter a tip.'],
    ],
    explain: { title: 'Pedir con cortesía', body: [
      'En un restaurante usamos fórmulas corteses. Con <b>usted</b> al camarero: «¿Me puede traer la carta?», «¿Qué me recomienda?». Para pedir: <b>quisiera</b> (más formal que «quiero») o «Voy a tomar...».',
      { t: 'table', head: ['Situación', 'Frase'], rows: [['Pedir mesa', 'Una mesa para dos, por favor.'], ['Pedir la carta', '¿Nos trae la carta, por favor?'], ['Pedir comida', 'Quisiera la sopa y el pescado.'], ['Pedir una recomendación', '¿Qué nos recomienda?'], ['Pedir la cuenta', 'La cuenta, por favor.']] },
      '<b>Pedir</b> es un verbo con cambio de raíz e → i: pido, pides, pide, pedimos, pedís, piden. Igual: «servir» y «repetir».',
      'Para decir qué quieres comer usamos los números ordinales abreviados: «de primero» (primer plato), «de segundo» (segundo plato) y «de postre».',
      { t: 'ex', list: ['Quisiera una mesa para cuatro personas.', '¿Me puede traer agua sin gas?', 'De primero pido sopa y de segundo, pescado.', '¿Nos trae la cuenta, por favor?'] },
    ] },
    listen: ['Buenas noches, ¿tienen una mesa para dos?', 'Quisiera la sopa y el pescado a la plancha.', '¿Qué nos recomienda de postre?', '¿Me puede traer la cuenta, por favor?', 'Dejamos una propina al camarero.'],
    practice: [
      fill('Yo ___ una ensalada. (pedir)', 'pido', 'Cambio e → i en la forma «yo»: pido.', { tag: 'pedir' }),
      fill('Ellos ___ pescado. (pedir)', 'piden', 'Con «ellos»: piden.', { tag: 'pedir' }),
      mc('¿Cuál es la forma más cortés de pedir?', 'Quisiera una mesa.', ['Quiero una mesa ya.', 'Dame una mesa.', 'Mesa para dos.'], '«Quisiera» es cortés y formal.', { tag: 'cortesía' }),
      order('¿Me puede traer la cuenta', 'Para pedir algo con cortesía: «¿Me puede traer...?».', { tag: 'cortesía' }),
    ],
    quiz: [
      fill('Tú ___ siempre lo mismo. (pedir)', 'pides', 'Con «tú»: pides.', { tag: 'pedir' }),
      mc('El camarero pregunta: «¿Qué desean beber?» Tú respondes...', 'Agua sin gas, por favor.', ['Estoy bien, gracias.', 'Son las dos.', 'Vivo en Madrid.'], 'Responde con la bebida que quieres.', { tag: 'cortesía' }),
      mc('«De segundo» se refiere a...', 'el segundo plato', ['la segunda persona', 'el segundo día', 'el segundo piso'], 'En un menú: primero, segundo y postre.', { tag: 'restaurante' }),
      listen('¿Qué nos recomienda de postre?', 'Escucha: ¿qué pregunta la persona?', 'Qué postre recomienda', ['Cuánto cuesta', 'A qué hora cierran', 'Dónde está el baño'], 'Pregunta qué recomienda de postre.', { tag: 'restaurante' }),
      dict('La cuenta, por favor.', 'Revisa la coma y la tilde.', { tag: 'dictado' }),
      mc('¿Qué es una «propina»?', 'Dinero extra para quien te sirve', ['El precio de un plato', 'Una bebida', 'Un tipo de postre'], 'La propina es un dinero extra voluntario.', { tag: 'vocabulario' }),
      match([['la carta', 'Lista de platos'], ['el camarero', 'Persona que sirve'], ['el postre', 'Comida dulce final'], ['la cuenta', 'Lo que hay que pagar']], 'Repasa el vocabulario del restaurante.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'el billete': 'ticket (transport)', 'la estación': 'station; season', 'el andén': 'platform (train)', 'la maleta': 'suitcase', 'el viaje': 'trip; journey',
    'salir': 'to leave; to go out', 'llegar': 'to arrive', 'el retraso': 'delay',
    'la reserva': 'reservation; booking', 'la habitación': 'room', 'la llave': 'key', 'el desayuno': 'breakfast', 'incluido': 'included', 'la noche (de hotel)': 'night (hotel stay)',
    'alto': 'tall; high', 'bajo': 'short; low', 'delgado': 'thin; slim', 'simpático': 'friendly; nice', 'tranquilo': 'calm; quiet', 'moreno': 'dark-haired; dark-skinned', 'rubio': 'blond', 'ruidoso': 'noisy'
  });

  C.addLesson({
    id: 'a2.u2.l1', level: 'A2', unit: 2, n: 1, title: 'Viajes y transporte', topic: 'Viajes',
    goal: 'Al terminar esta lección, podrás comprar un billete, preguntar horarios y hablar de un viaje.',
    vocab: [
      ['el billete', 'sustantivo', 'Papel o documento que te permite viajar en un transporte.', 'Compro un billete de tren.', 'I buy a train ticket.', ['el boleto']],
      ['la estación', 'sustantivo', 'Lugar donde paran los trenes o los autobuses.', 'La estación está en el centro.', 'The station is in the center.'],
      ['el andén', 'sustantivo', 'Zona de la estación donde esperas el tren.', 'El tren sale del andén cuatro.', 'The train leaves from platform four.'],
      ['la maleta', 'sustantivo', 'Bolsa grande donde llevas tu ropa en un viaje.', 'Mi maleta es muy pesada.', 'My suitcase is very heavy.'],
      ['el viaje', 'sustantivo', 'Desplazamiento de un lugar a otro, normalmente largo.', 'El viaje dura tres horas.', 'The trip lasts three hours.'],
      ['salir', 'verbo', 'Ir desde dentro hacia fuera; partir de un lugar.', '¿A qué hora sale el tren?', 'What time does the train leave?'],
      ['llegar', 'verbo', 'Alcanzar un lugar al terminar un camino.', 'Llegamos a las cinco.', 'We arrive at five.'],
      ['el retraso', 'sustantivo', 'Tiempo que algo tarda más de lo previsto.', 'El tren lleva diez minutos de retraso.', 'The train is ten minutes late.'],
    ],
    explain: { title: 'Preguntar y dar información de viaje', body: [
      'Preguntas útiles en la estación: <b>¿A qué hora sale el tren a Sevilla?</b>, <b>¿De qué andén sale?</b>, <b>¿Cuánto dura el viaje?</b>, <b>¿Cuánto cuesta un billete de ida y vuelta?</b>',
      { t: 'table', head: ['Para...', 'Preposición', 'Ejemplo'], rows: [['destino', 'a', 'Voy a Madrid.'], ['origen', 'de', 'Salgo de Sevilla.'], ['transporte', 'en', 'Viajo en tren.'], ['duración', 'durante / (sin preposición)', 'El viaje dura dos horas.']] },
      '<b>Ir a</b> + lugar; <b>llegar a</b> + lugar; <b>salir de</b> + lugar. No usamos «en» con «ir a»: «Voy a la estación» (no «Voy en la estación»).',
      'Billete de <b>ida</b> (solo un trayecto) y de <b>ida y vuelta</b> (con regreso).',
      { t: 'ex', list: ['Un billete de ida y vuelta a Valencia, por favor.', 'El tren sale a las nueve y llega a las doce.', 'Viajo en autobús al trabajo.', 'El tren lleva retraso.'] },
    ] },
    listen: ['¿A qué hora sale el tren a Sevilla?', 'Un billete de ida y vuelta, por favor.', 'El tren sale del andén cuatro.', 'El viaje dura dos horas y media.', 'Llevamos veinte minutos de retraso.'],
    practice: [
      mc('Salgo ___ Madrid a las nueve.', 'de', ['a', 'en', 'por'], 'Origen: «salir de».', { tag: 'preposiciones-viaje' }),
      mc('Voy ___ la estación.', 'a', ['de', 'en', 'con'], 'Destino: «ir a».', { tag: 'preposiciones-viaje' }),
      fill('Viajo ___ tren. (transporte)', 'en', 'Con medios de transporte: «en».', { tag: 'preposiciones-viaje' }),
      order('¿A qué hora sale el tren', 'Pregunta con «a qué hora».', { tag: 'viajes' }),
    ],
    quiz: [
      mc('Quieres regresar al mismo lugar. Pides un billete de...', 'ida y vuelta', ['solo ida', 'solo vuelta', 'media hora'], 'Ida y vuelta incluye regreso.', { tag: 'viajes' }),
      fill('Llegamos ___ Sevilla a las cinco.', 'a', 'Destino: «llegar a».', { tag: 'preposiciones-viaje' }),
      mc('«El tren lleva retraso» significa...', 'llega más tarde de lo previsto', ['llega antes', 'no sale nunca', 'es muy rápido'], 'Retraso = tiempo extra de espera.', { tag: 'vocabulario' }),
      listen('El tren sale del andén cuatro.', 'Escucha: ¿de qué andén sale?', 'Del cuatro', ['Del tres', 'Del cinco', 'Del catorce'], 'Se oye «cuatro».', { tag: 'viajes' }),
      dict('Un billete de ida y vuelta, por favor.', 'Revisa las tildes y la coma.', { tag: 'dictado' }),
      mc('¿Dónde esperas el tren?', 'En el andén', ['En la carta', 'En la talla', 'En la propina'], 'El andén es la zona de espera del tren.', { tag: 'vocabulario' }),
      match([['el billete', 'Permite viajar'], ['la maleta', 'Lleva tu ropa'], ['el andén', 'Donde esperas el tren'], ['el retraso', 'Tiempo extra']], 'Repasa el vocabulario de viajes.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u2.l2', level: 'A2', unit: 2, n: 2, title: 'En el hotel', topic: 'Hotel',
    goal: 'Al terminar esta lección, podrás reservar una habitación, preguntar por los servicios y resolver problemas sencillos.',
    vocab: [
      ['la reserva', 'sustantivo', 'Acuerdo para tener algo preparado para ti en una fecha.', 'Tengo una reserva a nombre de Pérez.', 'I have a reservation under the name Pérez.'],
      ['la habitación', 'sustantivo', 'Cada espacio cerrado de un hotel o de una casa.', 'Mi habitación está en el tercer piso.', 'My room is on the third floor.', ['el cuarto']],
      ['la llave', 'sustantivo', 'Objeto que sirve para abrir una puerta.', 'Aquí tiene la llave de su habitación.', 'Here is the key to your room.'],
      ['el desayuno', 'sustantivo', 'Primera comida del día.', 'El desayuno se sirve de siete a diez.', 'Breakfast is served from seven to ten.'],
      ['incluido', 'adjetivo', 'Que forma parte de algo sin coste adicional.', 'El desayuno está incluido.', 'Breakfast is included.'],
      ['la noche (de hotel)', 'sustantivo', 'Cada día de alojamiento en un hotel.', 'Reservo una habitación para tres noches.', 'I reserve a room for three nights.'],
    ],
    explain: { title: 'Reservar y pedir en el hotel', body: [
      'Para reservar usamos <b>quisiera</b> o <b>necesito</b> + habitación: «Quisiera una habitación doble para dos noches.» Tipos: <b>individual</b> (una persona), <b>doble</b> (dos personas), <b>con vistas al mar</b>.',
      { t: 'table', head: ['Situación', 'Frase'], rows: [['Reservar', 'Quisiera reservar una habitación doble.'], ['Preguntar por servicios', '¿El desayuno está incluido?'], ['Pedir algo', '¿Me puede dar otra toalla?'], ['Decir un problema', 'No funciona el aire acondicionado.'], ['Salir del hotel', 'Quisiera dejar la habitación.']] },
      '<b>Funcionar</b> + sujeto: «No funciona la televisión.» Para varias cosas: «No funcionan las luces».',
      '<b>Estar incluido</b> concuerda con lo que se incluye: «El desayuno está incluido» / «Las toallas están incluidas».',
      { t: 'ex', list: ['Tengo una reserva a nombre de López.', '¿A qué hora se sirve el desayuno?', 'No funciona el wifi.', 'La habitación es la 204.'] },
    ] },
    listen: ['Tengo una reserva a nombre de Rivera.', '¿El desayuno está incluido?', 'Su habitación es la doscientos cuatro.', 'No funciona el aire acondicionado.', 'Quisiera dejar la habitación a las doce.'],
    practice: [
      fill('El desayuno está ___ en el precio. (incluir)', 'incluido', 'Concuerda con «desayuno»: incluido.', { tag: 'hotel' }),
      mc('Las toallas están ___.', 'incluidas', ['incluido', 'incluidos', 'incluida'], 'Toallas es femenino plural.', { tag: 'hotel' }),
      mc('Quieres una habitación para una persona. Pides una habitación...', 'individual', ['doble', 'incluida', 'ruidosa'], 'Individual = una persona.', { tag: 'hotel' }),
      order('Tengo una reserva a nombre de Ruiz', 'Frase para presentar tu reserva.', { tag: 'hotel' }),
    ],
    quiz: [
      mc('El wifi no funciona. ¿Qué dices?', 'No funciona el wifi.', ['No funcionan el wifi.', 'No funcionas el wifi.', 'Funciona no el wifi.'], 'Wifi es singular: «funciona».', { tag: 'hotel' }),
      fill('Reservo una habitación para tres ___. (días de alojamiento)', 'noches', 'En hoteles contamos las noches.', { tag: 'hotel' }),
      mc('¿Qué abre la puerta de la habitación?', 'La llave', ['La reserva', 'El desayuno', 'La noche'], 'La llave abre la puerta.', { tag: 'vocabulario' }),
      listen('Su habitación es la doscientos cuatro.', 'Escucha: ¿cuál es el número de la habitación?', '204', ['240', '214', '104'], 'Doscientos cuatro = 204.', { tag: 'hotel' }),
      dict('El desayuno está incluido.', 'Revisa la tilde de «desayuno» (no lleva) y la de «incluido».', { tag: 'dictado' }),
      mc('¿Qué significa «a nombre de»?', 'con el nombre de una persona', ['con el precio de', 'con el número de', 'en la ciudad de'], 'La reserva está registrada con ese nombre.', { tag: 'hotel' }),
      match([['la reserva', 'Acuerdo previo'], ['la llave', 'Abre la puerta'], ['el desayuno', 'Primera comida'], ['incluido', 'Sin coste extra']], 'Repasa el vocabulario del hotel.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u2.l3', level: 'A2', unit: 2, n: 3, title: 'Describir personas y lugares', topic: 'Descripción',
    goal: 'Al terminar esta lección, podrás describir el aspecto y el carácter de personas y cómo es un lugar.',
    vocab: [
      ['alto', 'adjetivo', 'Que mide más de lo normal.', 'Mi hermano es muy alto.', 'My brother is very tall.'],
      ['bajo', 'adjetivo', 'Que mide menos de lo normal.', 'Mi abuela es baja.', 'My grandmother is short.'],
      ['delgado', 'adjetivo', 'Que tiene poco peso para su altura.', 'Es una persona delgada.', 'He is a thin person.'],
      ['simpático', 'adjetivo', 'Que cae bien a los demás porque es amable.', 'Mi vecina es muy simpática.', 'My neighbor is very friendly.', ['amable']],
      ['tranquilo', 'adjetivo', 'Sin ruido o sin nervios.', 'Mi barrio es muy tranquilo.', 'My neighborhood is very quiet.'],
      ['moreno', 'adjetivo', 'Que tiene el pelo oscuro o la piel oscura.', 'Mi padre es moreno.', 'My father is dark-haired.'],
      ['rubio', 'adjetivo', 'Que tiene el pelo de color amarillo claro.', 'Ana es rubia y tiene los ojos azules.', 'Ana is blond and has blue eyes.'],
      ['ruidoso', 'adjetivo', 'Que hace mucho ruido.', 'La calle es muy ruidosa.', 'The street is very noisy.'],
    ],
    explain: { title: 'Ser, tener y la concordancia', body: [
      'Para describir personas usamos <b>ser</b> (aspecto y carácter) y <b>tener</b> (rasgos físicos): «Es alta», «Tiene el pelo largo y los ojos verdes».',
      { t: 'table', head: ['Tipo', 'Estructura', 'Ejemplo'], rows: [['Aspecto', 'ser + adjetivo', 'Es alto y delgado.'], ['Pelo y ojos', 'tener + sustantivo + adjetivo', 'Tiene el pelo rubio y los ojos azules.'], ['Carácter', 'ser + adjetivo', 'Es simpática y tranquila.'], ['Lugares', 'ser / estar / haber', 'La ciudad es grande. Hay muchos parques.']] },
      'Los adjetivos <b>concuerdan</b> en género y número: alto, alta, altos, altas. Los adjetivos en -e o en consonante tienen una sola forma de género: «un chico amable, una chica amable»; «un libro fácil, una prueba fácil».',
      'Para lugares: «La plaza es grande y está en el centro.» «En mi barrio hay un parque y no hay cine.»',
      { t: 'ex', list: ['Mi madre es baja y delgada.', 'Mi hermano tiene el pelo moreno.', 'Es una chica muy simpática.', 'Mi barrio es tranquilo pero no hay cine.'] },
    ] },
    listen: ['Mi hermano es alto y delgado.', 'Tiene el pelo moreno y los ojos verdes.', 'Mi vecina es muy simpática.', 'Mi barrio es tranquilo.', 'La calle es muy ruidosa por la noche.'],
    practice: [
      fill('Mi madre es ___. (alto)', 'alta', 'Madre es femenino: alta.', { tag: 'concordancia' }),
      mc('Mis hermanos son ___.', 'simpáticos', ['simpático', 'simpática', 'simpáticas'], 'Hermanos es masculino plural.', { tag: 'concordancia' }),
      mc('Para el color del pelo usamos...', 'tener', ['hay', 'estar', 'gustar'], 'Con el pelo y los ojos: «tener».', { tag: 'descripcion' }),
      order('Mi hermano tiene el pelo moreno', 'Con el pelo usamos «tener».', { tag: 'descripcion' }),
    ],
    quiz: [
      mc('Ana ___ rubia y ___ los ojos azules.', 'es / tiene', ['está / tiene', 'es / es', 'tiene / es'], 'Ser para el aspecto y tener para los ojos.', { tag: 'descripcion' }),
      mc('¿Cuál es el contrario de «alto»?', 'bajo', ['moreno', 'ruidoso', 'rubio'], 'Alto ↔ bajo.', { tag: 'vocabulario' }),
      mc('Una calle con mucho ruido es...', 'ruidosa', ['tranquila', 'delgada', 'morena'], 'Ruidosa = con mucho ruido.', { tag: 'vocabulario' }),
      listen('Tiene el pelo moreno y los ojos verdes.', 'Escucha: ¿de qué color tiene los ojos?', 'Verdes', ['Azules', 'Marrones', 'Negros'], 'Dice «los ojos verdes».', { tag: 'descripcion' }),
      dict('Mi barrio es muy tranquilo.', 'Revisa la ortografía de «tranquilo».', { tag: 'dictado' }),
      mc('«Un chico amable, una chica amable» muestra que «amable»...', 'tiene una sola forma para masculino y femenino', ['solo es masculino', 'solo es plural', 'es un verbo'], 'Los adjetivos en -e no cambian por género.', { tag: 'concordancia' }),
      match([['alto', 'Mide más de lo normal'], ['tranquilo', 'Sin ruido'], ['simpático', 'Cae bien a los demás'], ['rubio', 'Pelo amarillo claro']], 'Repasa los adjetivos de descripción.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'ya': 'already; now', 'todavía': 'still; yet', 'alguna vez': 'ever; at some time', 'esta mañana': 'this morning', 'hoy mismo': 'today (emphasis)', 'el participio': 'participle',
    'ayer': 'yesterday', 'anoche': 'last night', 'el año pasado': 'last year', 'la semana pasada': 'last week', 'hace': 'ago; makes', 'terminar': 'to finish; to end',
    'estuvo': 'was (past of «estar»)', 'fue': 'was; went', 'tuvo': 'had (past of «tener»)', 'hizo': 'did; made', 'dijo': 'said', 'vino': 'came', 'quiso': 'wanted', 'pudo': 'was able to', 'puso': 'put', 'supo': 'found out; knew'
  });

  C.addLesson({
    id: 'a2.u3.l1', level: 'A2', unit: 3, n: 1, title: 'Pretérito perfecto', topic: 'Pasado',
    goal: 'Al terminar esta lección, podrás hablar de acciones recientes y de experiencias con el pretérito perfecto (he + participio).',
    vocab: [
      ['ya', 'adverbio', 'Antes del momento en que hablamos.', 'Ya he comido.', 'I have already eaten.'],
      ['todavía', 'adverbio', 'Hasta este momento y sigue sin ocurrir (con «no»).', 'Todavía no he terminado.', 'I have not finished yet.', ['aún']],
      ['alguna vez', 'expresión', 'En cualquier momento de la vida hasta ahora.', '¿Has viajado alguna vez a Perú?', 'Have you ever traveled to Peru?'],
      ['esta mañana', 'expresión', 'La mañana del día de hoy.', 'Esta mañana he corrido media hora.', 'This morning I ran for half an hour.'],
      ['hoy mismo', 'expresión', 'Hoy y no otro día (enfatiza).', 'Lo he hecho hoy mismo.', 'I did it today, in fact.'],
      ['el participio', 'sustantivo', 'Forma del verbo que acaba en -ado o -ido y se usa con «haber».', '«Hablado» es el participio de «hablar».', '«Hablado» is the participle of «hablar».'],
    ],
    explain: { title: 'He + participio', body: [
      'El <b>pretérito perfecto</b> se forma con el presente de <b>haber</b> + <b>participio</b>. Se usa para acciones terminadas en un tiempo que aún continúa (hoy, esta semana, este año) y para experiencias de la vida.',
      { t: 'table', head: ['Persona', 'haber', 'Ejemplo'], rows: [['yo', 'he', 'he hablado'], ['tú', 'has', 'has comido'], ['él / ella / usted', 'ha', 'ha vivido'], ['nosotros', 'hemos', 'hemos hablado'], ['vosotros', 'habéis', 'habéis comido'], ['ellos / ustedes', 'han', 'han vivido']] },
      '<b>Participio regular:</b> -ar → -ado (hablar → hablado); -er / -ir → -ido (comer → comido, vivir → vivido).',
      '<b>Participios irregulares</b> frecuentes: hacer → hecho; decir → dicho; ver → visto; escribir → escrito; poner → puesto; abrir → abierto; volver → vuelto.',
      'Marcadores: <b>hoy, esta mañana, esta semana, este año, ya, todavía no, alguna vez, nunca</b>. Con «no» y «ya» el auxiliar y el participio no se separan: «No he comido». «Ya he terminado».',
      { t: 'ex', list: ['Esta mañana he desayunado fruta.', '¿Has estado alguna vez en México?', 'Todavía no hemos terminado.', 'Mi hermano ha escrito un correo.'] },
    ] },
    listen: ['Esta mañana he desayunado muy temprano.', '¿Has estado alguna vez en México?', 'Todavía no hemos terminado el trabajo.', 'Mi hermano ha escrito un correo.', 'Ya he comido, gracias.'],
    practice: [
      fill('Yo ___ ___ mucho hoy. (trabajar)', ['he trabajado'], 'he + trabajado.', { tag: 'perfecto' }),
      fill('Ellos ___ ___ ya. (comer)', ['han comido'], 'han + comido.', { tag: 'perfecto' }),
      mc('El participio de «escribir» es...', 'escrito', ['escribido', 'escribado', 'escriben'], 'Escribir tiene participio irregular: escrito.', { tag: 'participios' }),
      order('Todavía no he terminado el informe', '«Todavía no» + he + participio.', { tag: 'perfecto' }),
    ],
    quiz: [
      mc('¿Qué frase usa bien el perfecto?', 'Esta semana he estudiado mucho.', ['Esta semana estudié ha mucho.', 'Esta semana he estudio mucho.', 'Esta semana estudiado he.'], 'Estructura: he + estudiado.', { tag: 'perfecto' }),
      fill('Tú ___ ___ la puerta. (abrir)', ['has abierto'], 'Participio irregular: abierto.', { tag: 'participios' }),
      mc('El participio de «hacer» es...', 'hecho', ['hacido', 'hacado', 'hago'], 'Hacer → hecho.', { tag: 'participios' }),
      mc('¿Cuál es la pregunta de experiencia?', '¿Has viajado alguna vez a Perú?', ['¿Viajas mañana a Perú?', '¿Viajaste ayer a Perú?', '¿Viajarás en un año a Perú?'], 'Experiencias de vida: has + participio + alguna vez.', { tag: 'perfecto' }),
      listen('Ya he comido, gracias.', 'Escucha: ¿qué dice la persona?', 'Que ya comió', ['Que va a comer', 'Que tiene hambre', 'Que no quiere agua'], 'Dice «Ya he comido».', { tag: 'perfecto' }),
      dict('Esta mañana he desayunado muy temprano.', 'Revisa la «h» de «he» y las tildes.', { tag: 'dictado' }),
      match([['ya', 'Antes de ahora'], ['todavía', 'Hasta ahora, sigue sin pasar'], ['alguna vez', 'En cualquier momento de tu vida'], ['el participio', 'Forma con -ado / -ido']], 'Repasa el vocabulario del perfecto.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u3.l2', level: 'A2', unit: 3, n: 2, title: 'Pretérito indefinido regular', topic: 'Pasado',
    goal: 'Al terminar esta lección, podrás contar acciones terminadas en el pasado con verbos regulares.',
    vocab: [
      ['ayer', 'adverbio', 'El día anterior a hoy.', 'Ayer comí con mi hermana.', 'Yesterday I had lunch with my sister.'],
      ['anoche', 'adverbio', 'La noche de ayer.', 'Anoche dormí muy bien.', 'Last night I slept very well.'],
      ['el año pasado', 'expresión', 'El año anterior a este.', 'El año pasado viajé a Chile.', 'Last year I traveled to Chile.'],
      ['la semana pasada', 'expresión', 'La semana anterior a esta.', 'La semana pasada visité a mis abuelos.', 'Last week I visited my grandparents.'],
      ['hace', 'adverbio', 'Indica cuánto tiempo ha pasado desde algo.', 'Llegué hace dos horas.', 'I arrived two hours ago.'],
      ['terminar', 'verbo', 'Llegar al final de algo.', 'Terminé el trabajo a las seis.', 'I finished work at six.'],
    ],
    explain: { title: 'El pretérito indefinido de verbos regulares', body: [
      'El <b>indefinido</b> (o pretérito perfecto simple) cuenta acciones <b>terminadas</b> en el pasado, con un momento concreto: ayer, anoche, el año pasado, hace dos días.',
      { t: 'table', head: ['Persona', '-ar (hablar)', '-er / -ir (comer, vivir)'], rows: [['yo', 'hablé', 'comí / viví'], ['tú', 'hablaste', 'comiste / viviste'], ['él / ella / usted', 'habló', 'comió / vivió'], ['nosotros', 'hablamos', 'comimos / vivimos'], ['vosotros', 'hablasteis', 'comisteis / vivisteis'], ['ellos / ustedes', 'hablaron', 'comieron / vivieron']] },
      '<b>Atención a la tilde:</b> «habló» (él) frente a «hablo» (yo, presente); «hablé» (yo, pasado) frente a «hable». Los verbos en -ar y -ir tienen «nosotros» igual en presente e indefinido: «hablamos», «vivimos»; el contexto aclara el tiempo.',
      '<b>Hace + tiempo</b> indica cuánto pasó desde un hecho: «Llegué hace dos horas».',
      { t: 'ex', list: ['Ayer comí con mi hermana.', 'Anoche vimos una película.', 'El año pasado viajaron a Chile.', 'Terminé el trabajo hace una hora.'] },
    ] },
    listen: ['Ayer comí con mi hermana.', 'Anoche dormí muy bien.', 'El año pasado viajaron a Chile.', 'Llegué hace dos horas.', 'Terminamos el trabajo a las seis.'],
    practice: [
      fill('Ayer yo ___ en un restaurante. (comer)', 'comí', 'Yo, indefinido de -er: comí.', { tag: 'indefinido' }),
      fill('Ella ___ la puerta. (cerrar)', 'cerró', 'Él/ella, -ar: cerró, con tilde.', { tag: 'indefinido' }),
      mc('Nosotros ___ a Chile el año pasado. (viajar)', 'viajamos', ['viajaron', 'viajé', 'viajas'], 'Con «nosotros»: viajamos.', { tag: 'indefinido' }),
      order('Anoche dormí muy bien', 'Marcador de pasado + verbo en indefinido.', { tag: 'indefinido' }),
    ],
    quiz: [
      fill('Tú ___ mucho ayer. (trabajar)', 'trabajaste', 'Tú, -ar: trabajaste.', { tag: 'indefinido' }),
      fill('Ellos ___ en Madrid dos años. (vivir)', 'vivieron', 'Ellos, -ir: vivieron.', { tag: 'indefinido' }),
      mc('¿Qué frase está en indefinido?', 'Ayer terminé el trabajo.', ['Hoy termino el trabajo.', 'Mañana termino el trabajo.', 'Siempre termino el trabajo.'], '«Ayer» + indefinido.', { tag: 'indefinido' }),
      mc('«Llegué hace dos horas» significa que...', 'llegué dos horas antes de ahora', ['voy a llegar en dos horas', 'llego siempre a esa hora', 'no llegué'], '«Hace» + tiempo indica cuánto pasó.', { tag: 'indefinido' }),
      listen('Anoche dormí muy bien.', 'Escucha: ¿cuándo durmió bien?', 'Anoche', ['Ayer por la mañana', 'Hace una semana', 'Mañana'], 'Se oye «anoche».', { tag: 'indefinido' }),
      dict('Ayer comí con mi hermana.', 'Revisa la tilde de «comí».', { tag: 'dictado' }),
      match([['ayer', 'El día anterior a hoy'], ['anoche', 'La noche de ayer'], ['hace', 'Indica cuánto tiempo pasó'], ['terminar', 'Llegar al final']], 'Repasa los marcadores del pasado.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u3.l3', level: 'A2', unit: 3, n: 3, title: 'Pretérito indefinido irregular', topic: 'Pasado',
    goal: 'Al terminar esta lección, podrás usar las formas irregulares más frecuentes del indefinido: ser, ir, estar, tener, hacer y otros.',
    vocab: [
      ['estuvo', 'verbo', 'Forma de «estar» en pasado: él, ella o usted.', 'Ella estuvo en Madrid.', 'She was in Madrid.'],
      ['fue', 'verbo', 'Forma de «ser» o «ir» en pasado: él, ella o usted.', 'Fue un viaje largo.', 'It was a long trip.'],
      ['tuvo', 'verbo', 'Forma de «tener» en pasado: él, ella o usted.', 'Tuvo mucha suerte.', 'He was very lucky.'],
      ['hizo', 'verbo', 'Forma de «hacer» en pasado: él, ella o usted.', 'Hizo la cena.', 'She made dinner.'],
      ['dijo', 'verbo', 'Forma de «decir» en pasado: él, ella o usted.', 'Dijo la verdad.', 'He told the truth.'],
      ['vino', 'verbo', 'Forma de «venir» en pasado: él, ella o usted.', 'Vino a mi fiesta.', 'He came to my party.'],
      ['pudo', 'verbo', 'Forma de «poder» en pasado: él, ella o usted.', 'No pudo venir.', 'He could not come.'],
      ['puso', 'verbo', 'Forma de «poner» en pasado: él, ella o usted.', 'Puso la mesa.', 'She set the table.'],
    ],
    explain: { title: 'Los irregulares más comunes', body: [
      'Algunos verbos muy frecuentes tienen formas <b>irregulares</b> en el indefinido. Las terminaciones son especiales: <b>-e, -iste, -o, -imos, -isteis, -ieron</b> (sin tilde) sobre una raíz irregular.',
      { t: 'table', head: ['Infinitivo', 'Raíz', 'yo', 'tú', 'él / ella', 'nosotros', 'ellos'], rows: [['estar', 'estuv-', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvieron'], ['tener', 'tuv-', 'tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvieron'], ['hacer', 'hic-', 'hice', 'hiciste', 'hizo', 'hicimos', 'hicieron'], ['poder', 'pud-', 'pude', 'pudiste', 'pudo', 'pudimos', 'pudieron'], ['poner', 'pus-', 'puse', 'pusiste', 'puso', 'pusimos', 'pusieron'], ['venir', 'vin-', 'vine', 'viniste', 'vino', 'vinimos', 'vinieron'], ['decir', 'dij-', 'dije', 'dijiste', 'dijo', 'dijimos', 'dijeron']] },
      '<b>Ser</b> e <b>ir</b> comparten las mismas formas en el indefinido: fui, fuiste, fue, fuimos, fuisteis, fueron. El contexto aclara: «Fui a Madrid» (ir) / «Fue un viaje largo» (ser).',
      'Para decir «hizo» se escribe con <b>z</b> (hizo) y no con c: hic- → hizo para mantener el sonido.',
      { t: 'ex', list: ['Estuve en Sevilla tres días.', 'Ayer tuvimos un examen.', 'Mi madre hizo una tarta.', 'Anoche fuimos al cine.'] },
    ] },
    listen: ['Estuve en Sevilla tres días.', 'Ayer tuvimos un examen muy difícil.', 'Mi madre hizo una tarta.', 'Anoche fuimos al cine.', 'No pudo venir a la fiesta.'],
    practice: [
      fill('Yo ___ en casa todo el día. (estar)', 'estuve', 'Estar, yo: estuve.', { tag: 'irregulares' }),
      fill('Ayer nosotros ___ un examen. (tener)', 'tuvimos', 'Tener, nosotros: tuvimos.', { tag: 'irregulares' }),
      mc('Mi madre ___ una tarta. (hacer)', 'hizo', ['hace', 'hacío', 'hico'], 'Hacer, ella: hizo.', { tag: 'irregulares' }),
      order('Anoche fuimos al cine', '«Fuimos» viene de «ir».', { tag: 'irregulares' }),
    ],
    quiz: [
      fill('Tú ___ la verdad. (decir)', 'dijiste', 'Decir, tú: dijiste.', { tag: 'irregulares' }),
      mc('«Fue un viaje largo» usa el verbo...', 'ser', ['ir', 'estar', 'tener'], 'Fue = ser (descripción).', { tag: 'irregulares' }),
      mc('«Ayer fui al médico» usa el verbo...', 'ir', ['ser', 'estar', 'hacer'], 'Fui = ir (movimiento).', { tag: 'irregulares' }),
      fill('Ellos no ___ venir. (poder)', 'pudieron', 'Poder, ellos: pudieron.', { tag: 'irregulares' }),
      listen('No pudo venir a la fiesta.', 'Escucha: ¿qué pasó?', 'No pudo ir a la fiesta', ['Llegó tarde', 'Organizó la fiesta', 'Bailó mucho'], 'Dice «no pudo venir».', { tag: 'irregulares' }),
      dict('Anoche fuimos al cine.', 'Revisa la ortografía de «fuimos» y «cine».', { tag: 'dictado' }),
      match([['estuvo', 'estar (él)'], ['tuvo', 'tener (él)'], ['hizo', 'hacer (él)'], ['dijo', 'decir (él)']], 'Repasa los infinitivos de las formas irregulares.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'el plan': 'plan', 'el fin de semana': 'weekend', 'las vacaciones': 'vacation; holidays', 'quedar': 'to meet up; to remain; to fit', 'visitar': 'to visit', 'próximo': 'next',
    'más': 'more; plus', 'menos': 'less; fewer; minus', 'tan': 'so; as', 'mejor': 'better; best', 'peor': 'worse; worst', 'rápido': 'fast; quick',
    'doler': 'to hurt; to ache', 'la cabeza': 'head', 'el estómago': 'stomach', 'la fiebre': 'fever', 'descansar': 'to rest', 'la receta': 'prescription; recipe', 'la medicina': 'medicine; medication', 'enfermo': 'sick; ill'
  });

  C.addLesson({
    id: 'a2.u4.l1', level: 'A2', unit: 4, n: 1, title: 'Planes con ir a', topic: 'Planes',
    goal: 'Al terminar esta lección, podrás hablar de planes y del futuro cercano con «ir a + infinitivo».',
    vocab: [
      ['el plan', 'sustantivo', 'Idea de lo que vas a hacer.', '¿Qué planes tienes para el sábado?', 'What plans do you have for Saturday?'],
      ['el fin de semana', 'sustantivo', 'El sábado y el domingo.', 'El fin de semana voy a descansar.', 'This weekend I am going to rest.'],
      ['las vacaciones', 'sustantivo', 'Período de días libres del trabajo o de la escuela.', 'En las vacaciones voy a viajar.', 'On vacation I am going to travel.'],
      ['quedar', 'verbo', 'Acordar un encuentro con alguien.', '¿Quedamos a las seis?', 'Shall we meet at six?'],
      ['visitar', 'verbo', 'Ir a ver a una persona o un lugar.', 'Voy a visitar a mi abuela.', 'I am going to visit my grandmother.'],
      ['próximo', 'adjetivo', 'Que viene después, en el tiempo.', 'El próximo lunes tengo examen.', 'Next Monday I have an exam.'],
    ],
    explain: { title: 'Ir a + infinitivo', body: [
      'Para hablar de planes e intenciones usamos <b>ir a + infinitivo</b>: «Voy a estudiar esta noche.»',
      { t: 'table', head: ['Persona', 'ir', 'Ejemplo'], rows: [['yo', 'voy a', 'voy a viajar'], ['tú', 'vas a', 'vas a comer'], ['él / ella / usted', 'va a', 'va a venir'], ['nosotros', 'vamos a', 'vamos a salir'], ['vosotros', 'vais a', 'vais a leer'], ['ellos / ustedes', 'van a', 'van a bailar']] },
      'Los marcadores de futuro: <b>mañana, esta noche, el sábado, el próximo mes, el año que viene, en las vacaciones</b>.',
      'Para proponer un plan: «¿Vamos al cine?», «¿Quedamos a las siete?». Para aceptar: «¡Claro!», «Vale, perfecto». Para rechazar con cortesía: «Lo siento, no puedo. Tengo que estudiar».',
      { t: 'ex', list: ['Mañana voy a visitar a mis abuelos.', 'El próximo verano vamos a viajar a Cádiz.', '¿Qué vas a hacer el sábado?', 'No voy a salir esta noche.'] },
    ] },
    listen: ['El sábado voy a ir a la playa.', '¿Qué vas a hacer en las vacaciones?', '¿Quedamos a las seis delante del cine?', 'Mañana vamos a visitar a mis abuelos.', 'No voy a salir esta noche.'],
    practice: [
      fill('Yo ___ ___ estudiar esta noche. (ir)', ['voy a'], 'Yo → voy a + infinitivo.', { tag: 'ir-a' }),
      fill('Nosotros ___ ___ viajar en verano. (ir)', ['vamos a'], 'Nosotros → vamos a.', { tag: 'ir-a' }),
      mc('¿Qué frase habla del futuro?', 'Mañana voy a visitar a mi tía.', ['Ayer visité a mi tía.', 'Visito a mi tía siempre.', 'He visitado a mi tía.'], '«Mañana» + ir a + infinitivo.', { tag: 'ir-a' }),
      order('El sábado voy a ir a la playa', '«Voy a» + infinitivo.', { tag: 'ir-a' }),
    ],
    quiz: [
      fill('Ellos ___ ___ bailar. (ir)', ['van a'], 'Ellos → van a.', { tag: 'ir-a' }),
      mc('Quieres proponer un encuentro a las seis. Dices...', '¿Quedamos a las seis?', ['¿Quedó a las seis?', '¿Queda las seis?', '¿Quedarán seis?'], 'Quedar = acordar un encuentro.', { tag: 'planes' }),
      mc('«El próximo lunes» significa...', 'el lunes que viene', ['el lunes pasado', 'todos los lunes', 'ningún lunes'], 'Próximo = el siguiente.', { tag: 'planes' }),
      listen('¿Quedamos a las seis delante del cine?', 'Escucha: ¿dónde propone quedar?', 'Delante del cine', ['En casa', 'En la playa', 'En el parque'], 'Dice «delante del cine».', { tag: 'planes' }),
      dict('Mañana voy a visitar a mis abuelos.', 'Revisa la tilde de «mañana».', { tag: 'dictado' }),
      mc('Para rechazar con cortesía puedes decir:', 'Lo siento, no puedo.', ['No quiero nada.', '¡Claro que no!', 'Déjame en paz.'], 'Lo cortés es disculparte y explicar.', { tag: 'planes' }),
      match([['el plan', 'Idea de lo que vas a hacer'], ['las vacaciones', 'Días libres'], ['quedar', 'Acordar un encuentro'], ['visitar', 'Ir a ver']], 'Repasa el vocabulario de planes.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u4.l2', level: 'A2', unit: 4, n: 2, title: 'Comparar', topic: 'Comparaciones',
    goal: 'Al terminar esta lección, podrás comparar personas, cosas y lugares con más ... que, menos ... que y tan ... como.',
    vocab: [
      ['más', 'adverbio', 'En mayor cantidad o grado.', 'Madrid es más grande que Toledo.', 'Madrid is bigger than Toledo.'],
      ['menos', 'adverbio', 'En menor cantidad o grado.', 'Este libro es menos caro.', 'This book is less expensive.'],
      ['tan', 'adverbio', 'Tanto, en igual grado (con «como»).', 'Eres tan alto como tu padre.', 'You are as tall as your father.'],
      ['mejor', 'adjetivo', 'Más bueno; de mayor calidad.', 'Este restaurante es mejor que ese.', 'This restaurant is better than that one.'],
      ['peor', 'adjetivo', 'Más malo; de menor calidad.', 'Hoy me siento peor que ayer.', 'Today I feel worse than yesterday.'],
      ['rápido', 'adjetivo', 'Que va o se hace en poco tiempo.', 'El tren es más rápido que el autobús.', 'The train is faster than the bus.'],
    ],
    explain: { title: 'Comparativos', body: [
      'Para comparar usamos tres estructuras:',
      { t: 'table', head: ['Comparación', 'Estructura', 'Ejemplo'], rows: [['Superioridad', 'más + adjetivo + que', 'Ana es más alta que Eva.'], ['Inferioridad', 'menos + adjetivo + que', 'El tren es menos barato que el autobús.'], ['Igualdad', 'tan + adjetivo + como', 'Pablo es tan simpático como su hermano.'], ['Con verbos', 'verbo + más / menos que', 'Corro más que tú.'], ['Con sustantivos', 'más / menos / tanto(s) + sustantivo + que / como', 'Tengo más libros que tú. / Tengo tantos libros como tú.']] },
      '<b>Irregulares:</b> bueno → <b>mejor</b>; malo → <b>peor</b>; grande → <b>mayor</b> (edad); pequeño → <b>menor</b> (edad). No decimos «más bueno» ni «más mejor».',
      'Con números usamos <b>más de</b> / <b>menos de</b>: «Tengo más de veinte libros».',
      { t: 'ex', list: ['Mi casa es más grande que la tuya.', 'Este café es tan bueno como ese.', 'Mi hermana es mayor que yo.', 'Hoy hace menos calor que ayer.'] },
    ] },
    listen: ['Mi casa es más grande que la tuya.', 'Este restaurante es mejor que ese.', 'El tren es más rápido que el autobús.', 'Pablo es tan simpático como su hermano.', 'Hoy hace menos calor que ayer.'],
    practice: [
      mc('Madrid es ___ grande que Toledo.', 'más', ['tan', 'mejor', 'menos de'], 'Superioridad: más ... que.', { tag: 'comparativos' }),
      fill('Eres ___ alto ___ tu padre. (igualdad)', ['tan como', 'tan alto como'], 'Igualdad: tan ... como.', { tag: 'comparativos' }),
      mc('Esta película es ___ que la otra. (bueno)', 'mejor', ['más buena', 'más mejor', 'bueno'], 'Bueno → mejor.', { tag: 'comparativos' }),
      order('El tren es más rápido que el autobús', 'Estructura: más + adjetivo + que.', { tag: 'comparativos' }),
    ],
    quiz: [
      fill('Mi hermano tiene ___ libros que yo. (más)', 'más', 'Con sustantivos: más ... que.', { tag: 'comparativos' }),
      mc('«Tengo más de veinte libros» significa que tengo...', 'veintiuno o más', ['menos de veinte', 'exactamente veinte', 'ningún libro'], '«Más de» + número indica un límite mínimo.', { tag: 'comparativos' }),
      mc('El comparativo de «malo» es...', 'peor', ['más malo', 'malo', 'menos bueno'], 'Malo → peor.', { tag: 'comparativos' }),
      listen('Pablo es tan simpático como su hermano.', 'Escucha: ¿qué dice la frase?', 'Los dos hermanos son igual de simpáticos', ['Pablo es más simpático', 'Pablo es menos simpático', 'No se conocen'], 'Tan ... como indica igualdad.', { tag: 'comparativos' }),
      dict('Este restaurante es mejor que ese.', 'Revisa la tilde de «mejor» (no lleva).', { tag: 'dictado' }),
      mc('Mi hermana nació antes que yo. Entonces es...', 'mayor que yo', ['menor que yo', 'más grande que yo', 'peor que yo'], 'Mayor/menor se usan para la edad.', { tag: 'comparativos' }),
      match([['más', 'Mayor cantidad'], ['menos', 'Menor cantidad'], ['mejor', 'Más bueno'], ['peor', 'Más malo']], 'Repasa los comparativos.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'a2.u4.l3', level: 'A2', unit: 4, n: 3, title: 'Salud y ayuda', topic: 'Salud',
    goal: 'Al terminar esta lección, podrás explicar un problema de salud sencillo y pedir ayuda.',
    vocab: [
      ['doler', 'verbo', 'Sentir dolor en una parte del cuerpo.', 'Me duele la cabeza.', 'I have a headache.'],
      ['la cabeza', 'sustantivo', 'Parte del cuerpo donde están los ojos, la nariz y la boca.', 'Tengo dolor de cabeza.', 'I have a headache.'],
      ['el estómago', 'sustantivo', 'Órgano del cuerpo donde llega la comida.', 'Me duele el estómago.', 'My stomach hurts.'],
      ['la fiebre', 'sustantivo', 'Temperatura del cuerpo más alta de lo normal.', 'Tengo fiebre desde ayer.', 'I have had a fever since yesterday.'],
      ['descansar', 'verbo', 'Parar para recuperar fuerzas.', 'Tienes que descansar.', 'You have to rest.'],
      ['la receta', 'sustantivo', 'Papel del médico con los medicamentos que debes tomar.', 'El médico me da una receta.', 'The doctor gives me a prescription.'],
      ['la medicina', 'sustantivo', 'Sustancia que se toma para curar una enfermedad.', 'Tomo la medicina por la noche.', 'I take the medicine at night.', ['el medicamento']],
      ['enfermo', 'adjetivo', 'Que tiene una enfermedad.', 'Estoy enfermo desde el lunes.', 'I have been sick since Monday.'],
    ],
    explain: { title: 'Doler, tener que y consejos', body: [
      'Con <b>doler</b> usamos un pronombre y concordamos con lo que duele: «<b>Me duele</b> la cabeza» (singular), «<b>Me duelen</b> las piernas» (plural). Es como «gustar».',
      { t: 'table', head: ['Problema', 'Frase'], rows: [['Dolor', 'Me duele la cabeza / Me duelen los pies.'], ['Dolor de...', 'Tengo dolor de estómago.'], ['Síntomas', 'Tengo fiebre / tos / frío.'], ['Estado', 'Estoy enfermo / cansado.'], ['Consejos', 'Tienes que descansar. Debes beber agua. Es mejor tomar la medicina.']] },
      '<b>Tener que + infinitivo</b> expresa obligación o necesidad: «Tengo que ir al médico». <b>Deber + infinitivo</b> da un consejo: «Debes descansar».',
      'En una emergencia llama al número de emergencias de tu país y di: «Necesito ayuda», «Es una emergencia», «Estoy en la calle...».',
      { t: 'ex', list: ['Me duele la cabeza desde ayer.', 'Tengo fiebre y me duele el estómago.', 'Tienes que descansar.', 'El médico me da una receta.'] },
    ] },
    listen: ['Me duele la cabeza desde ayer.', 'Tengo fiebre y me duele el estómago.', 'Tienes que descansar y beber agua.', 'El médico me da una receta.', 'Necesito ayuda, por favor.'],
    practice: [
      fill('Me ___ la cabeza. (doler)', 'duele', 'Cabeza es singular: duele.', { tag: 'doler' }),
      fill('Me ___ los pies. (doler)', 'duelen', 'Pies es plural: duelen.', { tag: 'doler' }),
      mc('Tengo que ___ al médico.', 'ir', ['voy', 'va', 'fui'], 'Tener que + infinitivo.', { tag: 'consejos' }),
      order('Me duele la cabeza desde ayer', 'Pronombre + doler + sujeto.', { tag: 'doler' }),
    ],
    quiz: [
      mc('¿Cómo dices que el estómago te molesta?', 'Me duele el estómago.', ['Me duelen el estómago.', 'Duelo el estómago.', 'Tengo duele el estómago.'], 'Singular: me duele.', { tag: 'doler' }),
      mc('Un consejo amable es...', 'Debes descansar.', ['Nunca descansas.', 'Descansé ayer.', 'No descansar.'], 'Deber + infinitivo da consejos.', { tag: 'consejos' }),
      mc('Tengo ___ de cabeza.', 'dolor', ['duele', 'doler', 'duelen'], 'Con «tengo» usamos el sustantivo: tengo dolor de cabeza.', { tag: 'doler' }),
      listen('Tengo fiebre y me duele el estómago.', 'Escucha: ¿qué síntomas tiene?', 'Fiebre y dolor de estómago', ['Tos y frío', 'Dolor de cabeza', 'Cansancio y sueño'], 'Menciona fiebre y estómago.', { tag: 'salud' }),
      dict('Necesito ayuda, por favor.', 'Revisa la coma antes de «por favor».', { tag: 'dictado' }),
      mc('¿Qué te da el médico para comprar medicinas?', 'Una receta', ['Una propina', 'Un billete', 'Una llave'], 'La receta indica qué medicinas tomar.', { tag: 'vocabulario' }),
      match([['la fiebre', 'Temperatura alta'], ['la receta', 'Papel con medicinas'], ['descansar', 'Parar para recuperar fuerzas'], ['enfermo', 'Con una enfermedad']], 'Repasa el vocabulario de salud.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'soler': 'to usually do; to tend to', 'mientras': 'while; whereas', 'cuando era pequeño': 'when I was little', 'antes': 'before; formerly', 'solía': 'used to', 'de niño': 'as a child',
    'de repente (B1)': 'suddenly', 'entonces': 'then; so', 'después de': 'after', 'finalmente': 'finally; at last', 'al principio': 'at first; in the beginning', 'en cambio': 'on the other hand; instead',
    'prometer': 'to promise', 'el futuro': 'future', 'tal vez': 'maybe; perhaps', 'la predicción': 'prediction', 'dentro de': 'within; in (time)', 'seguro': 'sure; safe; certain',
    'opinar': 'to have an opinion; to think', 'aconsejar': 'to advise', 'la opinión': 'opinion', 'estar a favor': 'to be in favor', 'estar en contra': 'to be against', 'depender': 'to depend', 'el consejo': 'advice; piece of advice',
    'la causa': 'cause', 'la consecuencia': 'consequence', 'por lo tanto': 'therefore', 'debido a': 'due to; because of', 'ya que': 'since; given that', 'así que': 'so; therefore', 'provocar': 'to cause; to provoke', 'resultar': 'to turn out; to result'
  });

  C.addLesson({
    id: 'b1.u1.l1', level: 'B1', unit: 1, n: 1, title: 'Pretérito imperfecto', topic: 'Narración',
    goal: 'Al terminar esta lección, podrás describir cómo era algo en el pasado y hablar de hábitos pasados con el imperfecto.',
    vocab: [
      ['soler', 'verbo', 'Hacer algo habitualmente.', 'Suelo levantarme a las siete.', 'I usually get up at seven.'],
      ['mientras', 'conector', 'Durante el tiempo en que algo ocurre.', 'Leía mientras esperaba el tren.', 'I was reading while I waited for the train.'],
      ['de niño', 'expresión', 'Cuando eras un niño.', 'De niño vivía en un pueblo.', 'As a child I lived in a village.'],
      ['antes', 'adverbio', 'En un tiempo anterior.', 'Antes vivíamos en el campo.', 'We used to live in the countryside.'],
      ['entonces', 'adverbio', 'En ese momento o por esa razón.', 'Entonces no había teléfonos móviles.', 'Back then there were no mobile phones.'],
      ['al principio', 'expresión', 'En los primeros momentos.', 'Al principio todo era difícil.', 'At first everything was difficult.'],
    ],
    explain: { title: 'El imperfecto: descripciones y hábitos', body: [
      'El <b>imperfecto</b> habla del pasado sin marcar su principio ni su final. Lo usamos para <b>describir</b> (cómo era algo), para <b>hábitos</b> pasados y para <b>acciones en desarrollo</b>.',
      { t: 'table', head: ['Persona', '-ar (hablar)', '-er / -ir (comer, vivir)'], rows: [['yo', 'hablaba', 'comía / vivía'], ['tú', 'hablabas', 'comías / vivías'], ['él / ella / usted', 'hablaba', 'comía / vivía'], ['nosotros', 'hablábamos', 'comíamos / vivíamos'], ['vosotros', 'hablabais', 'comíais / vivíais'], ['ellos / ustedes', 'hablaban', 'comían / vivían']] },
      '<b>Solo tres verbos son irregulares:</b> <b>ser</b> (era, eras, era, éramos, erais, eran), <b>ir</b> (iba, ibas, iba, íbamos, ibais, iban) y <b>ver</b> (veía, veías, veía...).',
      'Marcadores: <b>de niño, antes, entonces, siempre, todos los días, mientras, cuando era pequeño</b>. «De niño jugaba en la calle todos los días.»',
      { t: 'tip', text: 'Con «soler» describes costumbre: «Solíamos cenar tarde» = «Cenábamos tarde normalmente».' },
      { t: 'ex', list: ['De niño vivía en un pueblo pequeño.', 'Mi abuela siempre cocinaba los domingos.', 'Entonces no había móviles.', 'Éramos cinco hermanos.'] },
    ] },
    listen: ['De niño vivía en un pueblo muy pequeño.', 'Mi abuela cocinaba todos los domingos.', 'Antes no había teléfonos móviles.', 'Éramos cinco hermanos.', 'Leía mientras esperaba el tren.'],
    practice: [
      fill('Cuando yo ___ pequeño, vivía en un pueblo. (ser)', 'era', 'Ser en imperfecto, yo: era.', { tag: 'imperfecto' }),
      fill('Nosotros ___ en el campo. (vivir)', 'vivíamos', 'Nosotros: vivíamos.', { tag: 'imperfecto' }),
      mc('Antes ellos ___ muy lejos. (ir)', 'iban', ['van', 'fueron', 'irán'], 'Ir, imperfecto, ellos: iban.', { tag: 'imperfecto' }),
      order('De niño jugaba en la calle todos los días', 'Marcador + imperfecto de hábito.', { tag: 'imperfecto' }),
    ],
    quiz: [
      fill('Mi abuela siempre ___ los domingos. (cocinar)', 'cocinaba', 'Hábito pasado: cocinaba.', { tag: 'imperfecto' }),
      mc('¿Qué frase habla de un hábito pasado?', 'De niño iba a la playa cada verano.', ['Ayer fui a la playa.', 'Mañana voy a la playa.', 'He ido a la playa hoy.'], 'Cada verano + imperfecto = hábito.', { tag: 'imperfecto' }),
      mc('El imperfecto de «ver» (yo) es...', 'veía', ['vi', 'veo', 'veré'], 'Ver es irregular: veía.', { tag: 'imperfecto' }),
      listen('Éramos cinco hermanos.', 'Escucha: ¿cuántos hermanos eran?', 'Cinco', ['Cuatro', 'Seis', 'Tres'], 'Dice «éramos cinco».', { tag: 'imperfecto' }),
      dict('Antes no había teléfonos móviles.', 'Revisa la «h» de «había» y la tilde de «móviles».', { tag: 'dictado' }),
      mc('«Solía levantarme temprano» significa...', 'Normalmente me levantaba temprano', ['Me levanté una vez temprano', 'Nunca me levantaba', 'Me voy a levantar temprano'], 'Soler = hacer algo habitualmente.', { tag: 'imperfecto' }),
      match([['soler', 'Hacer algo habitualmente'], ['de niño', 'Cuando eras pequeño'], ['mientras', 'Durante el tiempo en que...'], ['entonces', 'En ese momento']], 'Repasa el vocabulario del imperfecto.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u1.l2', level: 'B1', unit: 1, n: 2, title: 'Imperfecto e indefinido', topic: 'Narración',
    goal: 'Al terminar esta lección, podrás combinar ambos pasados: describir el escenario con el imperfecto y contar los hechos con el indefinido.',
    vocab: [
      ['de repente', 'expresión', 'De forma inesperada.', 'De repente sonó el teléfono.', 'Suddenly the phone rang.'],
      ['después de', 'preposición', 'En un momento posterior a algo.', 'Después de cenar, salimos.', 'After dinner, we went out.'],
      ['finalmente', 'adverbio', 'Al final, después de todo lo anterior.', 'Finalmente llegamos a casa.', 'Finally we got home.', ['por fin']],
      ['en cambio', 'expresión', 'Al contrario; por otro lado.', 'Yo salí; en cambio, mi hermano se quedó.', 'I went out; my brother, on the other hand, stayed.'],
    ],
    explain: { title: 'Decorado y acción', body: [
      'En una narración, el <b>imperfecto</b> crea el <b>decorado</b> (el tiempo, el lugar, cómo era todo) y el <b>indefinido</b> cuenta las <b>acciones</b> que hacen avanzar la historia.',
      { t: 'table', head: ['Imperfecto (decorado)', 'Indefinido (acción)'], rows: [['Llovía y hacía frío.', 'Entré en un café.'], ['Eran las ocho.', 'Sonó el despertador.'], ['Yo leía un libro.', 'De repente, se apagó la luz.']] },
      'Una <b>acción larga</b> (imperfecto) puede ser interrumpida por una <b>acción corta</b> (indefinido): «Cenábamos cuando llegó Juan».',
      'Conectores de relato: <b>primero, después, entonces, de repente, al final, finalmente</b>.',
      { t: 'ex', list: ['Era de noche y llovía cuando salí de casa.', 'Dormía cuando sonó el teléfono.', 'Después de cenar, vimos una película.', 'Finalmente llegamos a casa.'] },
    ] },
    listen: ['Era de noche y llovía cuando salí de casa.', 'Dormía cuando sonó el teléfono.', 'Después de cenar, vimos una película.', 'De repente se apagó la luz.', 'Finalmente llegamos a casa.'],
    practice: [
      mc('Mientras yo ___, sonó el teléfono. (dormir)', 'dormía', ['dormí', 'duermo', 'dormiré'], 'Acción en desarrollo: imperfecto.', { tag: 'pasados' }),
      mc('De repente ___ la luz. (apagarse)', 'se apagó', ['se apagaba', 'se apaga', 'se apagará'], 'Acción puntual: indefinido.', { tag: 'pasados' }),
      mc('Elige la frase correcta:', 'Hacía sol y salimos a pasear.', ['Hizo sol y salíamos a pasear.', 'Hacía sol y salíamos a pasear.', 'Hizo sol y salimos a pasear.'], 'Decorado → imperfecto; acción → indefinido.', { tag: 'pasados' }),
      order('Era de noche y llovía cuando salí de casa', 'Primero el decorado, después la acción.', { tag: 'pasados' }),
    ],
    quiz: [
      fill('Cenábamos cuando ___ Juan. (llegar)', 'llegó', 'La acción corta interrumpe: llegó.', { tag: 'pasados' }),
      mc('¿Qué tiempo describe un escenario?', 'El imperfecto', ['El indefinido', 'El futuro', 'El perfecto'], 'El imperfecto crea el decorado.', { tag: 'pasados' }),
      mc('«En cambio» sirve para...', 'contrastar', ['sumar', 'dar una razón', 'terminar la historia'], 'Introduce una oposición.', { tag: 'conectores' }),
      listen('Dormía cuando sonó el teléfono.', 'Escucha: ¿qué hacía cuando sonó el teléfono?', 'Dormía', ['Comía', 'Leía', 'Caminaba'], 'Dice «dormía».', { tag: 'pasados' }),
      dict('Después de cenar, vimos una película.', 'Revisa la tilde de «después».', { tag: 'dictado' }),
      mc('¿Cuál es el conector de cierre de un relato?', 'finalmente', ['de repente', 'mientras', 'en cambio'], 'Finalmente = al final.', { tag: 'conectores' }),
      match([['de repente', 'De forma inesperada'], ['después de', 'En un momento posterior'], ['finalmente', 'Al final'], ['en cambio', 'Al contrario']], 'Repasa los conectores de narración.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u1.l3', level: 'B1', unit: 1, n: 3, title: 'Conectores del discurso', topic: 'Cohesión',
    goal: 'Al terminar esta lección, podrás ordenar ideas con conectores de adición, contraste, causa y consecuencia.',
    vocab: [
      ['además', 'conector', 'Añade una idea más.', 'Es barato y, además, muy bueno.', 'It is cheap and, moreover, very good.'],
      ['sin embargo', 'conector', 'Introduce una idea contraria.', 'Estudié mucho; sin embargo, suspendí.', 'I studied a lot; however, I failed.'],
      ['por un lado', 'expresión', 'Introduce el primer aspecto de una comparación.', 'Por un lado, es barato.', 'On the one hand, it is cheap.'],
      ['por otro lado', 'expresión', 'Introduce el segundo aspecto.', 'Por otro lado, está lejos.', 'On the other hand, it is far.'],
      ['por eso', 'conector', 'Introduce una consecuencia.', 'Llovía; por eso nos quedamos.', 'It was raining; that is why we stayed.'],
      ['aunque', 'conector', 'Introduce una dificultad que no impide algo.', 'Aunque estaba cansado, salió.', 'Although he was tired, he went out.'],
    ],
    explain: { title: 'Organizar tus ideas', body: [
      'Los <b>conectores</b> unen frases y marcan la relación entre ellas. Son esenciales para hablar y escribir con claridad.',
      { t: 'table', head: ['Función', 'Conectores', 'Ejemplo'], rows: [['Añadir', 'además, también, y', 'Es barato; además, está cerca.'], ['Oponer', 'pero, sin embargo, en cambio', 'Es caro; sin embargo, merece la pena.'], ['Concesión', 'aunque', 'Aunque llovía, salimos.'], ['Causa', 'porque, ya que, como', 'No salí porque estaba enfermo.'], ['Consecuencia', 'por eso, así que, por lo tanto', 'Estaba enfermo, por eso no salí.'], ['Orden', 'primero, después, finalmente', 'Primero comimos; después, paseamos.']] },
      'Tras «<b>sin embargo</b>» y «<b>por eso</b>» ponemos coma si están dentro de la frase: «Estudié mucho; sin embargo, suspendí».',
      'Con <b>aunque</b> + indicativo hablamos de un hecho real; con subjuntivo, de algo hipotético (lo verás en otro nivel).',
      { t: 'ex', list: ['Es barato y, además, está muy cerca.', 'Estudié mucho; sin embargo, no aprobé.', 'Aunque llovía, salimos a pasear.', 'Por un lado me gusta; por otro, es caro.'] },
    ] },
    listen: ['Es barato y, además, está muy cerca.', 'Estudié mucho; sin embargo, no aprobé.', 'Aunque llovía, salimos a pasear.', 'Por un lado me gusta, pero por otro, es caro.', 'Estaba enfermo; por eso no salí.'],
    practice: [
      mc('Estudié mucho; ___, suspendí.', 'sin embargo', ['por eso', 'además', 'porque'], 'Hay contraste.', { tag: 'conectores' }),
      mc('Estaba enfermo; ___ no salí.', 'por eso', ['aunque', 'sin embargo', 'en cambio'], 'Consecuencia.', { tag: 'conectores' }),
      fill('___ llovía, salimos a pasear. (concesión)', 'aunque', 'Aunque introduce una dificultad que no impide.', { tag: 'conectores' }),
      order('Es barato y además está cerca', 'Conector de adición: además.', { tag: 'conectores', alts: ['Es barato y, además, está cerca'] }),
    ],
    quiz: [
      mc('«Primero, después, finalmente» sirven para...', 'ordenar las acciones', ['oponer ideas', 'dar una causa', 'comparar'], 'Son conectores de orden.', { tag: 'conectores' }),
      mc('¿Cuál es un conector de causa?', 'ya que', ['por eso', 'aunque', 'sin embargo'], '«Ya que» introduce la causa.', { tag: 'conectores' }),
      mc('¿Cuál es un conector de consecuencia?', 'por lo tanto', ['porque', 'ya que', 'como'], 'Por lo tanto introduce la consecuencia.', { tag: 'conectores' }),
      listen('Aunque llovía, salimos a pasear.', 'Escucha: ¿qué hicieron?', 'Salieron a pasear', ['Se quedaron en casa', 'Fueron a trabajar', 'Cenaron'], 'Dice «salimos a pasear».', { tag: 'conectores' }),
      dict('Estudié mucho; sin embargo, no aprobé.', 'Revisa el punto y coma y la coma.', { tag: 'dictado' }),
      mc('«Por un lado..., por otro...» se usa para...', 'presentar dos aspectos', ['dar una orden', 'contar un sueño', 'pedir algo'], 'Contrasta dos aspectos.', { tag: 'conectores' }),
      match([['además', 'Añade una idea'], ['sin embargo', 'Contrasta'], ['por eso', 'Consecuencia'], ['aunque', 'Concesión']], 'Repasa las funciones de los conectores.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u2.l1', level: 'B1', unit: 2, n: 1, title: 'El futuro simple', topic: 'Futuro',
    goal: 'Al terminar esta lección, podrás hacer predicciones, promesas y suposiciones con el futuro simple.',
    vocab: [
      ['prometer', 'verbo', 'Decir que harás algo seguro.', 'Te prometo que te llamaré.', 'I promise I will call you.'],
      ['tal vez', 'adverbio', 'Puede ser; quizá.', 'Tal vez llueva mañana.', 'Maybe it will rain tomorrow.', ['quizá', 'a lo mejor']],
      ['dentro de', 'preposición', 'Al final de un período de tiempo desde ahora.', 'Llegaré dentro de una hora.', 'I will arrive in an hour.'],
      ['seguro', 'adjetivo', 'Que no tiene dudas; también, sin peligro.', 'Estoy seguro de que vendrá.', 'I am sure he will come.'],
      ['la predicción', 'sustantivo', 'Lo que se dice que ocurrirá en el futuro.', 'La predicción del tiempo es buena.', 'The weather forecast is good.'],
    ],
    explain: { title: 'Formar y usar el futuro', body: [
      'El <b>futuro simple</b> se forma con el <b>infinitivo completo + terminaciones</b>: -é, -ás, -á, -emos, -éis, -án. Son iguales para -ar, -er e -ir.',
      { t: 'table', head: ['Persona', 'hablar', 'comer', 'vivir'], rows: [['yo', 'hablaré', 'comeré', 'viviré'], ['tú', 'hablarás', 'comerás', 'vivirás'], ['él / ella / usted', 'hablará', 'comerá', 'vivirá'], ['nosotros', 'hablaremos', 'comeremos', 'viviremos'], ['vosotros', 'hablaréis', 'comeréis', 'viviréis'], ['ellos / ustedes', 'hablarán', 'comerán', 'vivirán']] },
      '<b>Irregulares frecuentes:</b> tener → tendré; poder → podré; hacer → haré; decir → diré; venir → vendré; salir → saldré; poner → pondré; saber → sabré; querer → querré; haber → habrá.',
      'Usos: <b>predicciones</b> («Mañana lloverá»), <b>promesas</b> («Te llamaré»), <b>suposiciones</b> sobre el presente («Serán las ocho»). Para planes cercanos, usamos más «ir a + infinitivo».',
      'Con <b>tal vez, quizá</b> + subjuntivo hablamos de una posibilidad: «Tal vez llueva».',
      { t: 'ex', list: ['Mañana lloverá en el norte.', 'Te prometo que te llamaré.', 'El próximo año viajaremos a Perú.', '¿Quién será a estas horas?'] },
    ] },
    listen: ['Mañana lloverá en el norte del país.', 'Te prometo que te llamaré esta noche.', 'El próximo año viajaremos a Perú.', 'Dentro de una hora llegaremos a casa.', 'Tendré que estudiar mucho.'],
    practice: [
      fill('Mañana yo ___ a casa. (volver)', 'volveré', 'Futuro: infinitivo + é.', { tag: 'futuro' }),
      fill('Ellos ___ a las ocho. (llegar)', 'llegarán', 'Futuro: llegar + án.', { tag: 'futuro' }),
      mc('El futuro de «tener» (yo) es...', 'tendré', ['teneré', 'tenderé', 'tengaré'], 'Tener es irregular: tendré.', { tag: 'futuro' }),
      order('Mañana lloverá en el norte', 'Futuro de predicción: lloverá.', { tag: 'futuro' }),
    ],
    quiz: [
      fill('Tú ___ muy feliz. (ser)', 'serás', 'Ser en futuro: serás.', { tag: 'futuro' }),
      mc('El futuro de «hacer» (nosotros) es...', 'haremos', ['hacemos', 'haceremos', 'hagamos'], 'Hacer es irregular: haremos.', { tag: 'futuro' }),
      mc('«Serán las ocho» expresa...', 'una suposición', ['una orden', 'un recuerdo', 'un deseo'], 'El futuro puede expresar suposición.', { tag: 'futuro' }),
      listen('Dentro de una hora llegaremos a casa.', 'Escucha: ¿cuándo llegarán?', 'En una hora', ['Ayer', 'Mañana por la mañana', 'En una semana'], '«Dentro de una hora» = en una hora.', { tag: 'futuro' }),
      dict('Te prometo que te llamaré esta noche.', 'Revisa las tildes de «llamaré» y «noche».', { tag: 'dictado' }),
      mc('«Tal vez» indica...', 'posibilidad', ['obligación', 'prohibición', 'seguridad total'], 'Tal vez = quizá.', { tag: 'vocabulario' }),
      match([['prometer', 'Decir que harás algo'], ['tal vez', 'Puede ser'], ['dentro de', 'Al final de un período'], ['seguro', 'Sin dudas']], 'Repasa el vocabulario del futuro.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u2.l2', level: 'B1', unit: 2, n: 2, title: 'Opinar y aconsejar', topic: 'Opiniones',
    goal: 'Al terminar esta lección, podrás dar tu opinión, mostrarte de acuerdo o en desacuerdo y dar consejos.',
    vocab: [
      ['opinar', 'verbo', 'Tener y decir una idea sobre algo.', '¿Qué opinas de esta idea?', 'What do you think of this idea?'],
      ['aconsejar', 'verbo', 'Decir a alguien lo que le conviene hacer.', 'Te aconsejo que descanses.', 'I advise you to rest.'],
      ['la opinión', 'sustantivo', 'Idea que tienes sobre algo.', 'En mi opinión, es una buena idea.', 'In my opinion, it is a good idea.'],
      ['estar a favor', 'expresión', 'Apoyar una idea.', 'Estoy a favor de la propuesta.', 'I am in favor of the proposal.'],
      ['estar en contra', 'expresión', 'No apoyar una idea.', 'Estoy en contra del cambio.', 'I am against the change.'],
      ['depender', 'verbo', 'Estar condicionado por otra cosa.', 'Depende del tiempo que haga.', 'It depends on the weather.'],
      ['el consejo', 'sustantivo', 'Palabra o recomendación que damos a alguien.', 'Te voy a dar un consejo.', 'I am going to give you a piece of advice.'],
    ],
    explain: { title: 'Opinar, estar de acuerdo y aconsejar', body: [
      '<b>Opinar:</b> «Creo que...», «Pienso que...», «En mi opinión...», «Me parece que...» + indicativo. En negativo, <b>subjuntivo</b>: «No creo que sea una buena idea».',
      { t: 'table', head: ['Función', 'Expresiones'], rows: [['Estar de acuerdo', 'Estoy de acuerdo. / Tienes razón. / Exacto.'], ['No estar de acuerdo', 'No estoy de acuerdo. / No creo que sea así.'], ['Dudar', 'No estoy seguro. / Depende.'], ['Aconsejar', 'Deberías + infinitivo. / Te aconsejo que + subjuntivo. / Lo mejor es + infinitivo.'], ['Prohibir con suavidad', 'Es mejor no + infinitivo.']] },
      '<b>Deberías</b> (condicional de «deber») es un consejo suave: «Deberías descansar».',
      'Después de «<b>te aconsejo que</b>» usamos subjuntivo: «Te aconsejo que hables con tu jefe».',
      { t: 'ex', list: ['Creo que es una buena idea.', 'No creo que sea fácil.', 'Deberías hablar con ella.', 'Te aconsejo que descanses.'] },
    ] },
    listen: ['Creo que es una buena idea.', 'No creo que sea fácil.', 'Deberías hablar con ella.', 'Te aconsejo que descanses un poco.', 'Estoy de acuerdo contigo.'],
    practice: [
      mc('Creo que ___ una buena idea.', 'es', ['sea', 'fuera', 'será'], 'Con «creo que» afirmativo: indicativo.', { tag: 'opinión' }),
      mc('No creo que ___ fácil.', 'sea', ['es', 'era', 'será'], 'Con «no creo que»: subjuntivo.', { tag: 'opinión' }),
      mc('Quieres dar un consejo suave. Dices:', 'Deberías descansar.', ['Descansas.', 'Descansé.', 'Descansaré.'], 'Deberías + infinitivo.', { tag: 'consejos' }),
      order('En mi opinión es una buena idea', 'Frase de opinión.', { tag: 'opinión', alts: ['En mi opinión, es una buena idea'] }),
    ],
    quiz: [
      mc('«Estoy a favor» significa...', 'Apoyo la idea', ['Rechazo la idea', 'No sé nada', 'No entiendo'], 'A favor = apoyar.', { tag: 'opinión' }),
      mc('«Depende» se usa para...', 'decir que no hay una respuesta única', ['decir que sí', 'decir que no', 'pedir perdón'], 'Depende = condicionado por algo.', { tag: 'opinión' }),
      mc('Te aconsejo que ___ con tu jefe. (hablar)', 'hables', ['hablas', 'hablarás', 'hablaste'], 'Aconsejar que + subjuntivo.', { tag: 'consejos' }),
      listen('No creo que sea fácil.', 'Escucha: ¿qué opina la persona?', 'Que no es fácil', ['Que es muy fácil', 'Que no sabe', 'Que es caro'], 'Dice «no creo que sea fácil».', { tag: 'opinión' }),
      dict('Estoy de acuerdo contigo.', 'Revisa «contigo» (con + ti).', { tag: 'dictado' }),
      mc('¿Qué expresión muestra desacuerdo?', 'No estoy de acuerdo.', ['Tienes razón.', 'Exacto.', 'Estoy de acuerdo.'], 'Es la negación del acuerdo.', { tag: 'opinión' }),
      match([['opinar', 'Decir lo que piensas'], ['aconsejar', 'Decir lo que conviene'], ['estar en contra', 'No apoyar'], ['depender', 'Estar condicionado']], 'Repasa el vocabulario de opiniones.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u2.l3', level: 'B1', unit: 2, n: 3, title: 'Causa y consecuencia', topic: 'Argumentación',
    goal: 'Al terminar esta lección, podrás explicar causas y consecuencias con porque, ya que, debido a, por lo tanto y así que.',
    vocab: [
      ['la causa', 'sustantivo', 'Razón por la que algo ocurre.', 'La causa del retraso fue la lluvia.', 'The cause of the delay was the rain.'],
      ['la consecuencia', 'sustantivo', 'Resultado de algo.', 'La consecuencia fue un gran atasco.', 'The consequence was a huge traffic jam.'],
      ['por lo tanto', 'conector', 'Introduce una conclusión lógica.', 'Llueve; por lo tanto, no iremos.', 'It is raining; therefore, we will not go.'],
      ['debido a', 'preposición', 'Por causa de.', 'Debido a la lluvia, cancelaron el partido.', 'Due to the rain, they canceled the game.'],
      ['ya que', 'conector', 'Introduce la causa conocida.', 'No fui, ya que estaba enfermo.', 'I did not go, since I was sick.'],
      ['así que', 'conector', 'Introduce una consecuencia en lenguaje común.', 'Estaba cansado, así que me acosté.', 'I was tired, so I went to bed.'],
      ['provocar', 'verbo', 'Hacer que algo ocurra.', 'La lluvia provocó inundaciones.', 'The rain caused flooding.'],
    ],
    explain: { title: 'Causas y consecuencias', body: [
      '<b>Causa:</b> responde a «¿por qué?». Conectores: <b>porque</b>, <b>ya que</b>, <b>como</b> (al principio de la frase), <b>debido a</b> + sustantivo, <b>por</b> + sustantivo.',
      { t: 'table', head: ['Causa', 'Consecuencia'], rows: [['Como llovía, nos quedamos.', 'Llovía, así que nos quedamos.'], ['No fui porque estaba enfermo.', 'Estaba enfermo; por eso no fui.'], ['Debido al tráfico, llegué tarde.', 'Había tráfico; por lo tanto, llegué tarde.']] },
      '<b>Como</b> (causa) va siempre al principio: «Como estaba cansado, me acosté». <b>Porque</b> va después: «Me acosté porque estaba cansado». No uses «porque» al inicio de una pregunta (usa «por qué»).',
      '<b>Debido a</b> y <b>por</b> se usan con sustantivos: «debido a la lluvia», «por el tráfico». Con verbos: «porque llovía».',
      { t: 'ex', list: ['Como llovía, nos quedamos en casa.', 'Debido al tráfico, llegué tarde.', 'Estaba cansado, así que me acosté.', 'La lluvia provocó inundaciones.'] },
    ] },
    listen: ['Como llovía, nos quedamos en casa.', 'Debido al tráfico, llegué tarde.', 'Estaba cansado, así que me acosté.', 'La lluvia provocó inundaciones.', 'No fui, ya que estaba enfermo.'],
    practice: [
      mc('___ llovía, nos quedamos en casa. (causa al principio)', 'Como', ['Porque', 'Aunque', 'Por qué'], 'Como + causa al principio.', { tag: 'causa' }),
      mc('No fui ___ estaba enfermo.', 'porque', ['como', 'por qué', 'así que'], 'Porque va después del resultado.', { tag: 'causa' }),
      fill('Llegué tarde ___ al tráfico. (debido)', 'debido', 'Debido a + sustantivo.', { tag: 'causa' }),
      order('Estaba cansado así que me acosté', 'Consecuencia con «así que».', { tag: 'causa', alts: ['Estaba cansado, así que me acosté'] }),
    ],
    quiz: [
      mc('«Por lo tanto» introduce...', 'una consecuencia', ['una causa', 'una duda', 'una pregunta'], 'Por lo tanto = conclusión lógica.', { tag: 'causa' }),
      mc('¿Qué frase expresa causa?', 'Llegué tarde porque había tráfico.', ['Había tráfico; así que llegué tarde.', 'Llegué tarde; por lo tanto, no comí.', 'Aunque llegué tarde, comí.'], 'Porque introduce la causa.', { tag: 'causa' }),
      mc('La lluvia ___ inundaciones. (provocar, pasado)', 'provocó', ['provoca', 'provocaba', 'provocará'], 'Hecho puntual en el pasado: provocó.', { tag: 'causa' }),
      listen('Debido al tráfico, llegué tarde.', 'Escucha: ¿por qué llegó tarde?', 'Por el tráfico', ['Por la lluvia', 'Por el despertador', 'Por un accidente'], 'Dice «debido al tráfico».', { tag: 'causa' }),
      dict('Como llovía, nos quedamos en casa.', 'Revisa la coma después de «llovía».', { tag: 'dictado' }),
      mc('¿Cuál es la causa en «Perdí el tren porque me desperté tarde»?', 'Me desperté tarde', ['Perdí el tren', 'El tren salió', 'Llegué a la estación'], 'La causa va después de «porque».', { tag: 'causa' }),
      match([['la causa', 'Razón por la que algo ocurre'], ['la consecuencia', 'Resultado'], ['provocar', 'Hacer que ocurra'], ['ya que', 'Introduce la causa']], 'Repasa el vocabulario de causa y consecuencia.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'esperar que': 'to hope that', 'ojalá': 'I hope; if only', 'desear': 'to wish; to want', 'espero que': 'I hope that', 'recomendar que': 'to recommend that', 'es importante que': 'it is important that',
    'estimado': 'dear (formal)', 'atentamente': 'sincerely; yours faithfully', 'adjuntar': 'to attach', 'solicitar': 'to apply for; to request', 'el puesto': 'position; job post', 'el currículum': 'résumé; CV', 'agradecer': 'to thank; to be grateful',
    'la entrevista': 'interview', 'la experiencia': 'experience', 'el candidato': 'candidate', 'contratar': 'to hire', 'el sueldo': 'salary', 'la empresa': 'company; business', 'el horario': 'schedule; timetable', 'cualificado': 'qualified',
    'la cortesía': 'courtesy; politeness', 'quisiera': 'I would like (polite)', 'podría': 'could; would be able to', 'sería': 'would be', 'le importaría': 'would you mind', 'disculpe': 'excuse me; sorry (formal)',
    'si tuviera': 'if I had', 'la hipótesis': 'hypothesis', 'ganar la lotería': 'to win the lottery', 'imaginar': 'to imagine', 'viviría': 'would live', 'si fuera': 'if I were',
    'el estilo indirecto': 'reported speech', 'contar que': 'to say that; to tell that', 'preguntar si': 'to ask whether', 'explicar': 'to explain', 'responder': 'to answer; to reply', 'avisar': 'to warn; to let know', 'comentar': 'to comment; to mention'
  });

  C.addLesson({
    id: 'b1.u3.l1', level: 'B1', unit: 3, n: 1, title: 'El subjuntivo para deseos', topic: 'Subjuntivo',
    goal: 'Al terminar esta lección, podrás expresar deseos, esperanzas y recomendaciones con el presente de subjuntivo.',
    vocab: [
      ['ojalá', 'interjección', 'Se usa para expresar un deseo.', 'Ojalá haga buen tiempo mañana.', 'I hope the weather is good tomorrow.'],
      ['esperar que', 'expresión', 'Desear que algo ocurra.', 'Espero que vengas a mi fiesta.', 'I hope you come to my party.'],
      ['desear', 'verbo', 'Querer con fuerza que algo ocurra.', 'Deseo que seas muy feliz.', 'I wish you to be very happy.'],
      ['recomendar que', 'expresión', 'Aconsejar algo a alguien.', 'Te recomiendo que pruebes la sopa.', 'I recommend that you try the soup.'],
      ['es importante que', 'expresión', 'Se usa para decir que algo es necesario.', 'Es importante que duermas bien.', 'It is important that you sleep well.'],
    ],
    explain: { title: 'Formar el presente de subjuntivo', body: [
      'El <b>presente de subjuntivo</b> se usa tras verbos de deseo, esperanza, recomendación y tras «ojalá». Se forma con la <b>raíz de la forma «yo» del presente</b> y las <b>terminaciones contrarias</b>: los verbos en -ar toman -e; los verbos en -er / -ir toman -a.',
      { t: 'table', head: ['Persona', 'hablar', 'comer', 'vivir'], rows: [['yo', 'hable', 'coma', 'viva'], ['tú', 'hables', 'comas', 'vivas'], ['él / ella / usted', 'hable', 'coma', 'viva'], ['nosotros', 'hablemos', 'comamos', 'vivamos'], ['vosotros', 'habléis', 'comáis', 'viváis'], ['ellos / ustedes', 'hablen', 'coman', 'vivan']] },
      '<b>Irregulares:</b> ser → sea; ir → vaya; estar → esté; haber → haya; saber → sepa; tener → tenga; hacer → haga; venir → venga; poner → ponga; decir → diga; salir → salga.',
      '<b>Estructura:</b> verbo de deseo + <b>que</b> + subjuntivo, siempre con <b>sujetos distintos</b>: «Quiero que vengas». Si el sujeto es el mismo, usamos infinitivo: «Quiero venir».',
      { t: 'ex', list: ['Espero que vengas a mi fiesta.', 'Ojalá haga buen tiempo.', 'Te recomiendo que pruebes la sopa.', 'Es importante que duermas bien.'] },
    ] },
    listen: ['Espero que vengas a mi fiesta.', 'Ojalá haga buen tiempo mañana.', 'Te recomiendo que pruebes la sopa.', 'Es importante que duermas bien.', 'Quiero que seas feliz.'],
    practice: [
      mc('Espero que tú ___ a mi fiesta. (venir)', 'vengas', ['vienes', 'vendrás', 'viniste'], 'Esperar que + subjuntivo: vengas.', { tag: 'subjuntivo' }),
      fill('Ojalá ___ buen tiempo. (hacer)', 'haga', 'Hacer en subjuntivo: haga.', { tag: 'subjuntivo' }),
      mc('Quiero ___ al cine. (mismo sujeto)', 'ir', ['que vaya', 'que voy', 'que iba'], 'Con el mismo sujeto: infinitivo.', { tag: 'subjuntivo' }),
      order('Es importante que duermas bien', 'Es importante que + subjuntivo.', { tag: 'subjuntivo' }),
    ],
    quiz: [
      fill('Te recomiendo que ___ la sopa. (probar)', 'pruebes', 'Probar: o → ue; -ar → -es: pruebes.', { tag: 'subjuntivo' }),
      mc('El subjuntivo de «ser» (yo) es...', 'sea', ['soy', 'sería', 'fuera'], 'Ser → sea.', { tag: 'subjuntivo' }),
      mc('Quiero que tú ___ feliz. (ser)', 'seas', ['eres', 'serás', 'fuiste'], 'Querer que + subjuntivo: seas.', { tag: 'subjuntivo' }),
      listen('Quiero que seas feliz.', 'Escucha: ¿qué desea la persona?', 'Que la otra persona sea feliz', ['Ir al cine', 'Comer', 'Viajar'], 'Dice «quiero que seas feliz».', { tag: 'subjuntivo' }),
      dict('Espero que vengas a mi fiesta.', 'Revisa la «v» y la «g» de «vengas».', { tag: 'dictado' }),
      mc('«Ojalá» se usa para...', 'expresar un deseo', ['dar una orden', 'contar el pasado', 'preguntar'], 'Ojalá = deseo.', { tag: 'subjuntivo' }),
      match([['ojalá', 'Expresa un deseo'], ['desear', 'Querer con fuerza'], ['esperar que', 'Desear que algo ocurra'], ['recomendar que', 'Aconsejar']], 'Repasa el vocabulario del subjuntivo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u3.l2', level: 'B1', unit: 3, n: 2, title: 'Cartas y correos formales', topic: 'Escritura formal',
    goal: 'Al terminar esta lección, podrás escribir un correo o una carta formal con saludo, motivo, petición y despedida.',
    vocab: [
      ['estimado', 'adjetivo', 'Palabra de cortesía al empezar una carta formal.', 'Estimado señor García:', 'Dear Mr. García:'],
      ['atentamente', 'adverbio', 'Fórmula de despedida formal.', 'Atentamente, Ana López.', 'Sincerely, Ana López.', ['cordialmente']],
      ['adjuntar', 'verbo', 'Añadir un archivo a un mensaje.', 'Adjunto mi currículum.', 'I attach my résumé.'],
      ['solicitar', 'verbo', 'Pedir algo formalmente.', 'Solicito información sobre el curso.', 'I request information about the course.'],
      ['el puesto', 'sustantivo', 'Trabajo o cargo que ocupas o buscas.', 'Solicito el puesto de recepcionista.', 'I apply for the position of receptionist.'],
      ['el currículum', 'sustantivo', 'Documento con tu formación y experiencia.', 'Le envío mi currículum.', 'I am sending you my résumé.'],
      ['agradecer', 'verbo', 'Dar las gracias.', 'Le agradezco su atención.', 'I thank you for your attention.'],
    ],
    explain: { title: 'Estructura de un correo formal', body: [
      'Un correo formal tiene cinco partes: <b>asunto</b>, <b>saludo</b>, <b>motivo</b>, <b>petición o información</b> y <b>despedida</b>. Se usa <b>usted</b> y se evitan las abreviaturas.',
      { t: 'table', head: ['Parte', 'Fórmulas'], rows: [['Saludo', 'Estimado señor García: / Estimada señora López: / Muy señores míos:'], ['Motivo', 'Me dirijo a usted para solicitar... / Le escribo para informarle de...'], ['Petición', 'Le agradecería que me enviara... / Quisiera saber si...'], ['Adjuntos', 'Adjunto mi currículum. / Le envío adjunto el formulario.'], ['Despedida', 'Atentamente, / Cordialmente, / Un cordial saludo,']] },
      'Tras el saludo se escriben dos puntos (<b>:</b>) y el texto empieza con mayúscula en la línea siguiente.',
      '<b>Le agradecería que + subjuntivo imperfecto</b> es una petición muy cortés: «Le agradecería que me respondiera lo antes posible».',
      { t: 'ex', list: ['Estimada señora López:', 'Me dirijo a usted para solicitar información.', 'Adjunto mi currículum.', 'Atentamente, Pablo Ruiz.'] },
    ] },
    listen: ['Estimada señora López, le escribo para solicitar información.', 'Adjunto mi currículum.', 'Le agradezco su atención.', 'Quedo a su disposición para cualquier duda.', 'Atentamente, Pablo Ruiz.'],
    practice: [
      mc('¿Cuál es un saludo formal?', 'Estimada señora López:', ['Hola, Laura!', 'Ey, ¿qué tal?', 'Buenas, tía'], 'Estimado/a + apellido: formal.', { tag: 'correo-formal' }),
      mc('¿Cuál es una despedida formal?', 'Atentamente,', ['Chao', 'Hasta luego, majo', 'Nos vemos'], 'Atentamente es formal.', { tag: 'correo-formal' }),
      fill('___ mi currículum. (adjuntar, yo)', 'adjunto', 'Adjuntar, yo: adjunto.', { tag: 'correo-formal' }),
      order('Le escribo para solicitar información', 'Fórmula de motivo.', { tag: 'correo-formal' }),
    ],
    quiz: [
      mc('Después del saludo se escribe...', 'dos puntos', ['coma', 'punto y coma', 'nada'], 'Estimado señor García:', { tag: 'correo-formal' }),
      mc('«Solicitar» significa...', 'pedir formalmente', ['dar las gracias', 'adjuntar', 'contratar'], 'Solicitar = pedir formalmente.', { tag: 'vocabulario' }),
      mc('¿Qué trato usas en un correo formal?', 'usted', ['tú', 'vosotros', 'vos'], 'Con «usted».', { tag: 'correo-formal' }),
      listen('Le agradezco su atención.', 'Escucha: ¿qué hace la persona?', 'Da las gracias', ['Pide dinero', 'Rechaza', 'Saluda'], 'Dice «le agradezco».', { tag: 'correo-formal' }),
      dict('Adjunto mi currículum.', 'Revisa la tilde de «currículum».', { tag: 'dictado' }),
      mc('El «asunto» de un correo es...', 'el título que resume el tema', ['la firma', 'el saludo', 'el adjunto'], 'El asunto resume el tema.', { tag: 'correo-formal' }),
      match([['estimado', 'Cortesía al empezar'], ['adjuntar', 'Añadir un archivo'], ['solicitar', 'Pedir formalmente'], ['agradecer', 'Dar las gracias']], 'Repasa el vocabulario del correo formal.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u3.l3', level: 'B1', unit: 3, n: 3, title: 'La entrevista de trabajo', topic: 'Trabajo',
    goal: 'Al terminar esta lección, podrás hablar de tu experiencia y responder preguntas habituales en una entrevista.',
    vocab: [
      ['la entrevista', 'sustantivo', 'Conversación para evaluar a una persona.', 'Mañana tengo una entrevista de trabajo.', 'Tomorrow I have a job interview.'],
      ['la experiencia', 'sustantivo', 'Conocimiento que se adquiere con el tiempo.', 'Tengo tres años de experiencia.', 'I have three years of experience.'],
      ['el candidato', 'sustantivo', 'Persona que aspira a un puesto.', 'Hay cinco candidatos.', 'There are five candidates.'],
      ['contratar', 'verbo', 'Dar un empleo a alguien.', 'La empresa va a contratar a dos personas.', 'The company is going to hire two people.'],
      ['el sueldo', 'sustantivo', 'Dinero que cobras por tu trabajo.', 'El sueldo es mensual.', 'The salary is monthly.', ['el salario']],
      ['la empresa', 'sustantivo', 'Organización que produce o vende algo.', 'Trabajo en una empresa pequeña.', 'I work at a small company.'],
      ['el horario', 'sustantivo', 'Horas en que se trabaja o se hace algo.', 'El horario es de nueve a cinco.', 'The schedule is nine to five.'],
    ],
    explain: { title: 'Hablar de ti en una entrevista', body: [
      'En una entrevista hablas de tu <b>experiencia</b> (pretérito perfecto: «he trabajado»), de tu <b>situación actual</b> (presente) y de tus <b>planes</b> (futuro o condicional).',
      { t: 'table', head: ['Pregunta', 'Posible respuesta'], rows: [['Cuénteme sobre usted.', 'Me llamo Ana. He trabajado tres años como diseñadora.'], ['¿Por qué quiere este puesto?', 'Porque busco un trabajo con más responsabilidad.'], ['¿Cuáles son sus puntos fuertes?', 'Soy organizada y trabajo bien en equipo.'], ['¿Cuándo podría empezar?', 'Podría empezar el próximo lunes.']] },
      '<b>Llevar + tiempo + gerundio</b> expresa duración: «Llevo tres años trabajando en una empresa». Con «desde» + fecha: «Trabajo aquí desde 2022».',
      'Usa el <b>condicional</b> para sonar cortés: «Me gustaría...», «Podría empezar...».',
      { t: 'ex', list: ['Llevo tres años trabajando en una empresa pequeña.', 'Soy organizada y trabajo bien en equipo.', 'Me gustaría trabajar con ustedes.', '¿Cuál es el horario?'] },
    ] },
    listen: ['Llevo tres años trabajando en una empresa pequeña.', 'Soy organizada y trabajo bien en equipo.', 'Me gustaría trabajar con ustedes.', '¿Cuál es el horario del puesto?', 'Podría empezar el próximo lunes.'],
    practice: [
      mc('«Llevo tres años trabajando aquí» expresa...', 'duración hasta ahora', ['una acción terminada', 'un plan', 'una orden'], 'Llevar + tiempo + gerundio.', { tag: 'trabajo' }),
      fill('Me ___ trabajar con ustedes. (gustar, condicional)', 'gustaría', 'Condicional: gustaría.', { tag: 'trabajo' }),
      mc('¿Qué tiempo usas para hablar de experiencia hasta ahora?', 'El pretérito perfecto', ['El futuro', 'El imperfecto', 'El subjuntivo'], 'He trabajado = experiencia.', { tag: 'trabajo' }),
      order('Llevo tres años trabajando en una empresa', 'Llevar + tiempo + gerundio.', { tag: 'trabajo' }),
    ],
    quiz: [
      mc('El «sueldo» es...', 'el dinero que cobras por tu trabajo', ['la hora de entrada', 'una entrevista', 'un contrato'], 'Sueldo = salario.', { tag: 'vocabulario' }),
      mc('¿Cómo respondes a «¿Cuándo podría empezar?»', 'Podría empezar el lunes.', ['Empecé ayer.', 'Empezaré nunca.', 'No tengo empresa.'], 'Condicional cortés.', { tag: 'trabajo' }),
      mc('Un «candidato» es...', 'una persona que aspira a un puesto', ['un jefe', 'un horario', 'un sueldo'], 'Candidato = aspirante.', { tag: 'vocabulario' }),
      listen('Soy organizada y trabajo bien en equipo.', 'Escucha: ¿qué cualidad menciona?', 'Trabaja bien en equipo', ['Habla cuatro idiomas', 'Vive lejos', 'Tiene mucha experiencia'], 'Dice «trabajo bien en equipo».', { tag: 'trabajo' }),
      dict('Mañana tengo una entrevista de trabajo.', 'Revisa la tilde de «mañana».', { tag: 'dictado' }),
      mc('«Contratar» significa...', 'dar un empleo a alguien', ['buscar un empleo', 'dejar un empleo', 'cobrar el sueldo'], 'Contratar = dar trabajo.', { tag: 'vocabulario' }),
      match([['la entrevista', 'Conversación para evaluar'], ['la experiencia', 'Conocimiento con el tiempo'], ['el sueldo', 'Dinero por el trabajo'], ['el horario', 'Horas de trabajo']], 'Repasa el vocabulario del trabajo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u4.l1', level: 'B1', unit: 4, n: 1, title: 'Condicional y cortesía', topic: 'Condicional',
    goal: 'Al terminar esta lección, podrás formar el condicional simple y usarlo para pedir, ofrecer y aconsejar con cortesía.',
    vocab: [
      ['quisiera', 'verbo', 'Forma cortés de «querer».', 'Quisiera una mesa para dos.', 'I would like a table for two.'],
      ['podría', 'verbo', 'Forma cortés de «poder».', '¿Podría ayudarme?', 'Could you help me?'],
      ['sería', 'verbo', 'Condicional de «ser».', 'Sería perfecto.', 'It would be perfect.'],
      ['le importaría', 'expresión', 'Fórmula muy cortés para pedir algo.', '¿Le importaría abrir la ventana?', 'Would you mind opening the window?'],
      ['disculpe', 'interjección', 'Se usa para pedir perdón o llamar la atención con cortesía.', 'Disculpe, ¿tiene hora?', 'Excuse me, do you have the time?'],
    ],
    explain: { title: 'El condicional simple', body: [
      'El <b>condicional simple</b> se forma con el <b>infinitivo + terminaciones</b>: -ía, -ías, -ía, -íamos, -íais, -ían (las mismas que el imperfecto de -er/-ir).',
      { t: 'table', head: ['Persona', 'hablar', 'comer', 'vivir'], rows: [['yo', 'hablaría', 'comería', 'viviría'], ['tú', 'hablarías', 'comerías', 'vivirías'], ['él / ella / usted', 'hablaría', 'comería', 'viviría'], ['nosotros', 'hablaríamos', 'comeríamos', 'viviríamos'], ['vosotros', 'hablaríais', 'comeríais', 'viviríais'], ['ellos / ustedes', 'hablarían', 'comerían', 'vivirían']] },
      'Tienen las <b>mismas raíces irregulares que el futuro</b>: tener → tendría; poder → podría; hacer → haría; decir → diría; venir → vendría; salir → saldría; poner → pondría; querer → querría.',
      'Usos principales: <b>cortesía</b> («¿Podría ayudarme?»), <b>consejo</b> («Yo en tu lugar iría al médico»), <b>deseo</b> («Me gustaría viajar») e <b>hipótesis</b> («Sería mejor esperar»).',
      { t: 'ex', list: ['¿Podría ayudarme, por favor?', 'Me gustaría viajar a Perú.', 'Yo en tu lugar hablaría con él.', 'Sería mejor esperar.'] },
    ] },
    listen: ['¿Podría ayudarme, por favor?', 'Me gustaría viajar a Perú.', 'Yo en tu lugar hablaría con él.', '¿Le importaría abrir la ventana?', 'Sería mejor esperar un poco.'],
    practice: [
      fill('¿Me ___ ayudar? (poder, usted)', 'podría', 'Poder, usted: podría.', { tag: 'condicional' }),
      fill('Yo ___ con él. (hablar, consejo)', 'hablaría', 'Hablar + ía: hablaría.', { tag: 'condicional' }),
      mc('El condicional de «tener» (yo) es...', 'tendría', ['teneria', 'tengaría', 'tuviera'], 'Tener → tendría.', { tag: 'condicional' }),
      order('Me gustaría viajar a Perú', '«Me gustaría» + infinitivo.', { tag: 'condicional' }),
    ],
    quiz: [
      mc('¿Cuál es la petición más cortés?', '¿Le importaría abrir la ventana?', ['Abre la ventana.', 'Ventana, ya.', 'Abres la ventana.'], 'Le importaría + infinitivo.', { tag: 'condicional' }),
      mc('«Yo en tu lugar iría» es...', 'un consejo', ['una orden', 'un recuerdo', 'una pregunta'], 'Yo en tu lugar + condicional = consejo.', { tag: 'condicional' }),
      fill('Ellos ___ muy contentos. (estar, condicional)', 'estarían', 'Estar + ían: estarían.', { tag: 'condicional' }),
      listen('¿Le importaría abrir la ventana?', 'Escucha: ¿qué pide la persona?', 'Que abran la ventana', ['Que cierren la puerta', 'Que apaguen la luz', 'Que llamen a alguien'], 'Pide abrir la ventana.', { tag: 'condicional' }),
      dict('Me gustaría viajar a Perú.', 'Revisa la tilde de «gustaría».', { tag: 'dictado' }),
      mc('El condicional de «hacer» (él) es...', 'haría', ['hacería', 'hace', 'hiciera'], 'Hacer → haría.', { tag: 'condicional' }),
      match([['quisiera', 'Forma cortés de querer'], ['podría', 'Forma cortés de poder'], ['disculpe', 'Pide perdón o atención'], ['sería', 'Condicional de ser']], 'Repasa el vocabulario de cortesía.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u4.l2', level: 'B1', unit: 4, n: 2, title: 'Hipótesis con si', topic: 'Condicionales',
    goal: 'Al terminar esta lección, podrás expresar condiciones reales con «si + presente» e hipótesis con «si + imperfecto de subjuntivo».',
    vocab: [
      ['la hipótesis', 'sustantivo', 'Suposición de algo posible o imaginario.', 'Es solo una hipótesis.', 'It is only a hypothesis.'],
      ['imaginar', 'verbo', 'Crear una idea en tu mente.', 'Imagina que vives en la playa.', 'Imagine that you live on the beach.'],
      ['ganar la lotería', 'expresión', 'Conseguir el premio de un sorteo de dinero.', 'Si ganara la lotería, viajaría.', 'If I won the lottery, I would travel.'],
      ['viviría', 'verbo', 'Condicional de «vivir».', 'Viviría en el campo.', 'I would live in the countryside.'],
    ],
    explain: { title: 'Si + presente y si + imperfecto de subjuntivo', body: [
      '<b>Condición real o posible:</b> si + presente de indicativo → presente, futuro o imperativo. «Si llueve, me quedo en casa.» «Si estudias, aprobarás.»',
      '<b>Condición irreal o poco probable:</b> si + <b>imperfecto de subjuntivo</b> → <b>condicional</b>. «Si tuviera más tiempo, viajaría más.»',
      { t: 'table', head: ['Persona', 'hablar', 'comer', 'ser', 'tener'], rows: [['yo', 'hablara', 'comiera', 'fuera', 'tuviera'], ['tú', 'hablaras', 'comieras', 'fueras', 'tuvieras'], ['él / ella', 'hablara', 'comiera', 'fuera', 'tuviera'], ['nosotros', 'habláramos', 'comiéramos', 'fuéramos', 'tuviéramos'], ['ellos', 'hablaran', 'comieran', 'fueran', 'tuvieran']] },
      'Se forma con la <b>3.ª persona plural del indefinido</b> quitando -ron: hablaron → habla- + ra; comieron → comie- + ra; fueron → fue- + ra.',
      '<b>Nunca</b> uses «si + condicional». Es incorrecto decir «Si tendría dinero, compraría un coche». Lo correcto: «Si tuviera dinero, compraría un coche».',
      { t: 'ex', list: ['Si llueve, me quedo en casa.', 'Si tuviera más tiempo, viajaría más.', 'Si fuera rico, no trabajaría.', 'Si ganaras la lotería, ¿qué harías?'] },
    ] },
    listen: ['Si llueve, me quedo en casa.', 'Si tuviera más tiempo, viajaría más.', 'Si fuera rico, no trabajaría.', 'Si ganaras la lotería, ¿qué harías?', 'Si viviera en el campo, tendría un huerto.'],
    practice: [
      mc('Si llueve, ___ en casa.', 'me quedo', ['me quedaría', 'me quedara', 'me quedé'], 'Condición real: si + presente → presente.', { tag: 'condicional-si' }),
      mc('Si ___ más tiempo, viajaría más. (tener)', 'tuviera', ['tengo', 'tendría', 'tenga'], 'Hipótesis: si + imperfecto de subjuntivo.', { tag: 'condicional-si' }),
      fill('Si yo ___ rico, no trabajaría. (ser)', 'fuera', 'Ser en imperfecto de subjuntivo: fuera.', { tag: 'condicional-si' }),
      order('Si tuviera más tiempo viajaría más', 'Si + subjuntivo imperfecto + condicional.', { tag: 'condicional-si', alts: ['Si tuviera más tiempo, viajaría más'] }),
    ],
    quiz: [
      mc('¿Qué frase es correcta?', 'Si tuviera dinero, compraría un coche.', ['Si tendría dinero, compraría un coche.', 'Si tengo dinero, compraría un coche.', 'Si tuviera dinero, compro un coche.'], 'Nunca se usa «si + condicional».', { tag: 'condicional-si' }),
      fill('Si ganaras la lotería, ¿qué ___? (hacer)', 'harías', 'Hacer, condicional, tú: harías.', { tag: 'condicional-si' }),
      mc('El imperfecto de subjuntivo de «hablar» (yo) es...', 'hablara', ['hable', 'hablaría', 'hablé'], 'Hablaron → habla- + ra.', { tag: 'condicional-si' }),
      listen('Si fuera rico, no trabajaría.', 'Escucha: ¿qué haría?', 'No trabajaría', ['Viajaría', 'Estudiaría', 'Compraría una casa'], 'Dice «no trabajaría».', { tag: 'condicional-si' }),
      dict('Si tuviera más tiempo, viajaría más.', 'Revisa la tilde de «viajaría».', { tag: 'dictado' }),
      mc('Una condición real usa...', 'si + presente', ['si + condicional', 'si + futuro', 'si + indefinido'], 'Si + presente → presente o futuro.', { tag: 'condicional-si' }),
      match([['la hipótesis', 'Suposición'], ['imaginar', 'Crear una idea'], ['ganar la lotería', 'Conseguir un premio'], ['viviría', 'Condicional de vivir']], 'Repasa el vocabulario de hipótesis.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b1.u4.l3', level: 'B1', unit: 4, n: 3, title: 'Estilo indirecto', topic: 'Contar lo que alguien dijo',
    goal: 'Al terminar esta lección, podrás contar lo que otra persona dijo o preguntó, cambiando tiempos y pronombres.',
    vocab: [
      ['contar que', 'expresión', 'Informar de algo a alguien.', 'Me contó que se mudaba.', 'He told me that he was moving.'],
      ['preguntar si', 'expresión', 'Hacer una pregunta de sí o no.', 'Me preguntó si tenía hora.', 'He asked me if I had the time.'],
      ['explicar', 'verbo', 'Hacer que algo se entienda.', 'Me explicó cómo funciona.', 'He explained how it works to me.'],
      ['responder', 'verbo', 'Dar una respuesta.', 'Respondió que no sabía.', 'He answered that he did not know.'],
      ['avisar', 'verbo', 'Informar a alguien de algo con anticipación.', 'Me avisó de que llegaría tarde.', 'He let me know he would arrive late.'],
      ['comentar', 'verbo', 'Decir algo sobre un tema.', 'Comentó que hacía frío.', 'He mentioned it was cold.'],
    ],
    explain: { title: 'Del estilo directo al indirecto', body: [
      'Con el <b>estilo directo</b> repetimos las palabras exactas: «Estoy cansado», dijo. Con el <b>indirecto</b> las contamos: Dijo <b>que</b> estaba cansado.',
      { t: 'table', head: ['Estilo directo', 'Estilo indirecto (verbo introductor en pasado)'], rows: [['Estoy cansado.', 'Dijo que estaba cansado.'], ['Trabajo mucho.', 'Dijo que trabajaba mucho.'], ['Llegué ayer.', 'Dijo que había llegado el día anterior.'], ['Iré mañana.', 'Dijo que iría al día siguiente.'], ['¿Tienes hora?', 'Preguntó si tenía hora.'], ['¿Dónde vives?', 'Preguntó dónde vivía.'], ['Ven aquí.', 'Dijo que fuera allí.']] },
      'Cuando el verbo introductor está en pasado, los tiempos «retroceden»: presente → imperfecto; indefinido → pluscuamperfecto (había + participio); futuro → condicional. Los marcadores también cambian: hoy → ese día; ayer → el día anterior; mañana → al día siguiente; aquí → allí.',
      'Las preguntas de sí/no se introducen con <b>si</b>; las demás con la palabra interrogativa (dónde, qué...), <b>sin tilde ni signos</b> en la frase indirecta... pero con tilde en la palabra interrogativa: «preguntó dónde vivía».',
      { t: 'ex', list: ['Dijo que estaba cansada.', 'Me preguntó si tenía hora.', 'Respondió que no lo sabía.', 'Me avisó de que llegaría tarde.'] },
    ] },
    listen: ['Dijo que estaba cansada.', 'Me preguntó si tenía hora.', 'Respondió que no lo sabía.', 'Me avisó de que llegaría tarde.', 'Comentó que hacía mucho frío.'],
    practice: [
      mc('«Estoy cansado», dijo. → Dijo que ___ cansado.', 'estaba', ['estoy', 'estuve', 'estaré'], 'Presente → imperfecto.', { tag: 'indirecto' }),
      mc('«Iré mañana», dijo. → Dijo que ___ al día siguiente.', 'iría', ['iré', 'iba', 'fuera'], 'Futuro → condicional.', { tag: 'indirecto' }),
      mc('«¿Tienes hora?», preguntó. → Preguntó ___ tenía hora.', 'si', ['que', 'qué', 'cómo'], 'Pregunta de sí/no → si.', { tag: 'indirecto' }),
      order('Me preguntó si tenía hora', 'Verbo introductor + si + imperfecto.', { tag: 'indirecto' }),
    ],
    quiz: [
      mc('Hoy → en estilo indirecto en pasado:', 'ese día', ['hoy', 'mañana', 'ayer'], 'Hoy → ese día.', { tag: 'indirecto' }),
      mc('Ayer → en estilo indirecto en pasado:', 'el día anterior', ['ese día', 'mañana', 'ahora'], 'Ayer → el día anterior.', { tag: 'indirecto' }),
      mc('«Trabajo mucho», dijo. → Dijo que ___ mucho.', 'trabajaba', ['trabajo', 'trabajé', 'trabajaré'], 'Presente → imperfecto.', { tag: 'indirecto' }),
      listen('Me avisó de que llegaría tarde.', 'Escucha: ¿qué avisó?', 'Que llegaría tarde', ['Que no iría', 'Que ya llegó', 'Que estaba enfermo'], 'Dice «llegaría tarde».', { tag: 'indirecto' }),
      dict('Me preguntó si tenía hora.', 'Revisa la tilde de «si» (no lleva).', { tag: 'dictado' }),
      mc('«Dónde vives», en estilo indirecto, es...', 'Preguntó dónde vivía.', ['Preguntó que dónde vives.', 'Preguntó si dónde vivía.', 'Preguntó dónde vives.'], 'Presente → imperfecto y sin «que».', { tag: 'indirecto' }),
      match([['contar que', 'Informar de algo'], ['preguntar si', 'Pregunta de sí o no'], ['responder', 'Dar una respuesta'], ['avisar', 'Informar con anticipación']], 'Repasa el vocabulario del estilo indirecto.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'rotundamente': 'categorically; flatly', 'coincidir con': 'to agree with; to coincide with', 'discrepar': 'to disagree; to differ', 'matizar': 'to qualify; to add nuance', 'rebatir': 'to refute; to counter', 'en parte': 'partly; in part',
    'a mi juicio': 'in my judgment', 'dudar que': 'to doubt that', 'no creer que': 'not to believe that', 'resulta que': 'it turns out that', 'sostener que': 'to maintain that', 'cuestionable': 'questionable; debatable',
    'no obstante': 'nevertheless; however', 'por consiguiente': 'consequently; therefore', 'a pesar de': 'despite; in spite of', 'puesto que': 'since; given that', 'por ende': 'hence; therefore', 'por ello': 'for that reason; hence',
    'dirigirse a': 'to address; to get in touch with', 'quedar a la espera': 'to await (a reply)', 'con copia a': 'cc; copied to', 'a la atención de': 'for the attention of', 'ponerse en contacto': 'to get in touch', 'cordial saludo': 'kind regards',
    'el columnista': 'columnist', 'la tesis': 'thesis; central claim', 'el contraargumento': 'counterargument', 'rotundo': 'emphatic; resounding', 'polémico': 'controversial', 'el encabezado': 'headline; heading',
    'la idea principal': 'main idea', 'sintetizar': 'to synthesize; to sum up', 'parafrasear': 'to paraphrase', 'omitir': 'to omit; to leave out', 'en resumidas cuentas': 'in short; all in all', 'el fragmento': 'excerpt; fragment'
  });

  C.addLesson({
    id: 'b2.u1.l1', level: 'B2', unit: 1, n: 1, title: 'Expresar acuerdo y desacuerdo', topic: 'Opinión',
    goal: 'Al terminar esta lección, podrás mostrar acuerdo total, parcial o desacuerdo con distintos grados de firmeza y cortesía.',
    vocab: [
      ['rotundamente', 'adverbio', 'De manera clara y sin ninguna duda.', 'Rechazó rotundamente la propuesta.', 'He flatly rejected the proposal.'],
      ['coincidir con', 'expresión', 'Tener la misma opinión que otra persona.', 'Coincido contigo en que hay que actuar ya.', 'I agree with you that we must act now.'],
      ['discrepar', 'verbo', 'No estar de acuerdo con algo o con alguien.', 'Discrepo de tu análisis en un punto.', 'I disagree with your analysis on one point.'],
      ['matizar', 'verbo', 'Añadir detalles para precisar lo que se ha dicho.', 'Me gustaría matizar lo que acabas de decir.', 'I would like to qualify what you have just said.'],
      ['rebatir', 'verbo', 'Contestar con argumentos a lo que otro afirma.', 'Es difícil rebatir esos datos.', 'It is hard to refute that data.'],
      ['en parte', 'expresión', 'Solo hasta cierto punto, no del todo.', 'En parte tienes razón, pero falta algo.', 'In part you are right, but something is missing.'],
    ],
    explain: { title: 'Grados de acuerdo y desacuerdo', body: [
      'En un debate rara vez basta con «sí» o «no». El español ofrece una <b>escala de grados</b>, desde el acuerdo total hasta el rechazo, y cada grado tiene sus fórmulas y su nivel de cortesía.',
      { t: 'table', head: ['Grado', 'Fórmulas'], rows: [['Acuerdo total', 'Estoy totalmente de acuerdo. / Coincido plenamente contigo. / No podría estar más de acuerdo.'], ['Acuerdo parcial', 'En parte tienes razón, pero... / Hasta cierto punto sí. / Estoy de acuerdo, aunque con matices.'], ['Desacuerdo suave', 'No lo veo del todo así. / Permíteme discrepar. / Me temo que no comparto esa opinión.'], ['Desacuerdo firme', 'Discrepo rotundamente. / De ninguna manera. / Eso no se sostiene.']] },
      '<b>Atención con el subjuntivo:</b> las fórmulas de acuerdo con «que» suelen llevar indicativo si afirman («Estoy de acuerdo en que es necesario»), pero las negativas piden subjuntivo («No estoy de acuerdo en que sea necesario»).',
      'Para suavizar un desacuerdo se usa el <b>condicional de cortesía</b> y los atenuantes: «Yo diría que no es tan sencillo», «Quizá habría que matizar eso». Para reforzar el acuerdo: «¡Exacto!», «Totalmente», «Eso es».',
      'Para <b>interrumpir o pedir la palabra</b> con educación: «Perdona que te interrumpa, pero...», «¿Me permites una objeción?».',
      { t: 'ex', list: ['Coincido contigo en que hay que actuar ya.', 'En parte tienes razón, pero falta un dato.', 'No estoy de acuerdo en que sea la mejor opción.', 'Me temo que no comparto esa opinión.'] },
    ] },
    listen: ['Coincido contigo en que hay que actuar ya.', 'En parte tienes razón, pero me gustaría matizar algo.', 'Discrepo rotundamente de esa conclusión.', 'Perdona que te interrumpa, pero creo que no es así.', 'Es difícil rebatir esos datos.'],
    practice: [
      mc('¿Qué frase expresa un desacuerdo suave?', 'Me temo que no comparto esa opinión.', ['Estoy totalmente de acuerdo contigo.', 'No podría estar más de acuerdo con eso.', 'Coincido plenamente con tu análisis.'], 'Me temo que... suaviza el desacuerdo; las otras tres frases expresan acuerdo.', { tag: 'acuerdo' }),
      mc('No estoy de acuerdo en que ___ la mejor opción. (ser)', 'sea', ['es', 'será', 'fue'], 'Fórmula negativa de opinión: subjuntivo.', { tag: 'acuerdo' }),
      fill('Estoy de acuerdo en que ___ necesario actuar. (ser, indicativo)', 'es', 'Fórmula afirmativa: indicativo.', { tag: 'acuerdo' }),
      order('En parte tienes razón pero falta algo', 'Acuerdo parcial.', { tag: 'acuerdo', alts: ['Tienes razón en parte, pero falta algo'] }),
    ],
    quiz: [
      mc('«Discrepar» significa...', 'no estar de acuerdo', ['estar de acuerdo del todo', 'interrumpir con educación', 'resumir lo dicho antes'], 'Discrepar = no coincidir.', { tag: 'vocabulario' }),
      mc('¿Qué expresión indica acuerdo parcial?', 'Hasta cierto punto sí.', ['De ninguna manera.', 'Discrepo rotundamente.', 'Eso no se sostiene.'], 'Hasta cierto punto = parcial.', { tag: 'acuerdo' }),
      mc('No creo que Ana ___ razón. (tener)', 'tenga', ['tiene', 'tendrá', 'tenía'], 'No creer que + subjuntivo.', { tag: 'acuerdo' }),
      listen('Discrepo rotundamente de esa conclusión.', 'Escucha: ¿qué actitud muestra?', 'Desacuerdo firme', ['Acuerdo total', 'Duda', 'Agradecimiento'], 'Dice «discrepo rotundamente».', { tag: 'acuerdo' }),
      dict('Coincido contigo en que hay que actuar ya.', 'Cuidado con «coincido» (con «c» y luego «i») y con «hay» (con «h»).', { tag: 'dictado' }),
      mc('«Matizar» sirve para...', 'precisar lo que se ha dicho', ['rechazar lo que dice otro', 'cambiar de tema con cortesía', 'terminar la reunión pronto'], 'Matizar = precisar.', { tag: 'vocabulario' }),
      match([['rotundamente', 'Sin ninguna duda'], ['coincidir con', 'Tener la misma opinión'], ['rebatir', 'Contestar con argumentos'], ['en parte', 'No del todo']], 'Repasa el vocabulario del acuerdo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u1.l2', level: 'B2', unit: 1, n: 2, title: 'Subjuntivo en opiniones', topic: 'Subjuntivo',
    goal: 'Al terminar esta lección, podrás elegir entre indicativo y subjuntivo al dar opiniones, expresar duda y valorar hechos.',
    vocab: [
      ['a mi juicio', 'expresión', 'Según mi opinión personal.', 'A mi juicio, la medida llega tarde.', 'In my judgment, the measure comes too late.'],
      ['dudar que', 'expresión', 'No estar seguro de que algo sea cierto.', 'Dudo que lleguen a tiempo.', 'I doubt they will arrive on time.'],
      ['no creer que', 'expresión', 'Pensar que algo no es cierto o no es probable.', 'No creo que sea una buena idea.', 'I do not think it is a good idea.'],
      ['resulta que', 'expresión', 'Introduce un dato nuevo o sorprendente.', 'Resulta que el museo estaba cerrado.', 'It turns out the museum was closed.'],
      ['sostener que', 'expresión', 'Afirmar algo con firmeza.', 'Sostiene que la culpa fue del sistema.', 'He maintains that the system was to blame.'],
      ['cuestionable', 'adjetivo', 'Que se puede poner en duda.', 'Es una decisión cuestionable.', 'It is a debatable decision.', ['discutible']],
    ],
    explain: { title: 'Indicativo o subjuntivo al opinar', body: [
      'La regla de fondo: el <b>indicativo</b> presenta algo como información o certeza; el <b>subjuntivo</b> lo presenta como duda, valoración o algo no afirmado.',
      { t: 'table', head: ['Estructura', 'Modo', 'Ejemplo'], rows: [['Creo / Pienso / Opino que', 'indicativo', 'Creo que tienes razón.'], ['No creo / No pienso que', 'subjuntivo', 'No creo que tengas razón.'], ['Dudo que / No estoy seguro de que', 'subjuntivo', 'Dudo que sea cierto.'], ['Es evidente / Está claro / Es verdad que', 'indicativo', 'Es evidente que hay un problema.'], ['No es evidente / No es verdad que', 'subjuntivo', 'No es verdad que todos estén de acuerdo.'], ['Es increíble / Es lógico / Es una pena que', 'subjuntivo', 'Es lógico que se queje.'], ['Me parece que', 'indicativo', 'Me parece que es tarde.'], ['No me parece que', 'subjuntivo', 'No me parece que sea justo.']] },
      '<b>Valoraciones:</b> con «es + adjetivo de valor + que» (importante, necesario, injusto, lógico, raro, una lástima) se usa subjuntivo aunque el hecho sea real: «Es raro que no haya llamado».',
      '<b>Matiz con creer:</b> en las negativas («No creo que sea posible») se usa subjuntivo. En las preguntas lo normal es el indicativo («¿Crees que es posible?»); el subjuntivo es posible cuando quien pregunta expresa duda o escepticismo («¿De verdad crees que sea posible?»).',
      '<b>Tiempo del subjuntivo:</b> con verbo principal en presente, se usa el presente de subjuntivo para el presente o el futuro («No creo que venga») y el pretérito perfecto para una acción ya terminada («No creo que haya llegado»). Con verbo principal en pasado, se usa el imperfecto («No creía que llegara»).',
      { t: 'ex', list: ['Creo que tienes razón.', 'No creo que tengas razón.', 'Es evidente que hay un problema.', 'Es una pena que no hayas venido.'] },
    ] },
    listen: ['Creo que tienes razón.', 'No creo que sea una buena idea.', 'Dudo que lleguen a tiempo.', 'Es evidente que hay un problema.', 'Es una pena que no hayas venido.'],
    practice: [
      mc('No creo que ___ razón. (tener, tú)', 'tengas', ['tienes', 'tendrás', 'tenías'], 'No creer que + subjuntivo.', { tag: 'subjuntivo-opinion' }),
      mc('Es evidente que el plan ___. (fallar)', 'falla', ['falle', 'fallara', 'fallase'], 'Es evidente que + indicativo.', { tag: 'subjuntivo-opinion' }),
      fill('Dudo que ellos ___ a tiempo. (llegar)', 'lleguen', 'Dudar que + subjuntivo: lleguen.', { tag: 'subjuntivo-opinion' }),
      order('No me parece que sea justo', 'No parecer que + subjuntivo.', { tag: 'subjuntivo-opinion' }),
    ],
    quiz: [
      mc('Es lógico que ___ cansado. (estar, él)', 'esté', ['está', 'estará', 'estaba'], 'Valoración: es lógico que + subjuntivo.', { tag: 'subjuntivo-opinion' }),
      mc('No creo que Pedro ___ ayer. (venir, pasado)', 'haya venido', ['ha venido', 'vendrá', 'habría venido'], 'No creer que + pretérito perfecto de subjuntivo.', { tag: 'subjuntivo-opinion' }),
      mc('¿Qué frase es correcta?', 'Está claro que hay un error.', ['Está claro que haya un error.', 'No está claro que hay un error.', 'Está claro que hubiera un error.'], 'Está claro que + indicativo.', { tag: 'subjuntivo-opinion' }),
      listen('Es una pena que no hayas venido.', 'Escucha: ¿qué lamenta la persona?', 'Que el otro no haya venido', ['Que el tren salga con retraso', 'Que ella no haya llegado a tiempo', 'Que llueva todo el fin de semana'], 'Dice «es una pena que no hayas venido».', { tag: 'subjuntivo-opinion' }),
      dict('Dudo que lleguen a tiempo.', 'Revisa la «ll» de «lleguen».', { tag: 'dictado' }),
      mc('«Cuestionable» significa...', 'que se puede poner en duda', ['que no admite ninguna duda', 'que resulta muy fácil de hacer', 'que se exige por ley'], 'Cuestionable = discutible.', { tag: 'vocabulario' }),
      match([['a mi juicio', 'Según mi opinión'], ['dudar que', 'No estar seguro de algo'], ['resulta que', 'Introduce un dato nuevo'], ['sostener que', 'Afirmar con firmeza']], 'Repasa el vocabulario de opinión.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u1.l3', level: 'B2', unit: 1, n: 3, title: 'Conectores argumentativos', topic: 'Cohesión',
    goal: 'Al terminar esta lección, podrás organizar un argumento con conectores de oposición, causa, consecuencia y concesión.',
    vocab: [
      ['no obstante', 'locución', 'Introduce una idea que se opone a la anterior.', 'El plan es bueno; no obstante, es caro.', 'The plan is good; however, it is expensive.', ['sin embargo']],
      ['por consiguiente', 'locución', 'Introduce una consecuencia lógica.', 'Hubo errores; por consiguiente, se repetirá el examen.', 'There were errors; consequently, the exam will be repeated.'],
      ['a pesar de', 'locución', 'Indica una dificultad que no impide algo.', 'A pesar de la lluvia, salimos.', 'Despite the rain, we went out.'],
      ['puesto que', 'locución', 'Introduce una causa ya conocida.', 'Puesto que ya lo sabes, no insisto.', 'Since you already know, I will not insist.'],
      ['por ende', 'locución', 'Por eso; como consecuencia.', 'Subieron los precios; por ende, compramos menos.', 'Prices rose; hence, we buy less.'],
      ['por ello', 'locución', 'Por la razón que se acaba de mencionar.', 'Hay mucho tráfico; por ello, llegaremos tarde.', 'There is heavy traffic; for that reason, we will arrive late.'],
    ],
    explain: { title: 'Conectores y su modo verbal', body: [
      'Un buen argumento no es una lista de ideas: los <b>conectores</b> muestran cómo se relacionan. Cada tipo tiene sus formas y, a veces, exige un modo verbal concreto.',
      { t: 'table', head: ['Función', 'Conectores', 'Modo'], rows: [['Oposición', 'sin embargo, no obstante, en cambio, ahora bien', 'indicativo'], ['Concesión', 'aunque, a pesar de que, si bien', 'aunque: indicativo (hecho) / subjuntivo (hipótesis); si bien: indicativo'], ['Causa', 'porque, puesto que, ya que, dado que', 'indicativo'], ['Consecuencia', 'por tanto, por consiguiente, así que, de ahí que', 'indicativo; «de ahí que» + subjuntivo'], ['Finalidad', 'para que, a fin de que', 'subjuntivo'], ['Adición', 'además, asimismo, incluso', 'indicativo'], ['Condición', 'siempre que, a menos que, con tal de que', 'subjuntivo']] },
      '<b>Aunque:</b> con indicativo expresa un hecho conocido («Aunque llueve, saldré»); con subjuntivo, una posibilidad o un obstáculo que no importa («Aunque llueva, saldré»).',
      '<b>A pesar de</b> va con sustantivo o infinitivo («A pesar de estar cansado»); con verbo conjugado se dice «a pesar de que».',
      '<b>Orden del discurso:</b> en primer lugar, en segundo lugar, por último; por una parte... por otra parte; en conclusión, en definitiva.',
      { t: 'ex', list: ['El plan es bueno; no obstante, es caro.', 'Aunque llueva, saldremos.', 'Puesto que ya lo sabes, no insisto.', 'Hay mucho tráfico, de ahí que lleguemos tarde.'] },
    ] },
    listen: ['El plan es bueno; no obstante, es caro.', 'A pesar de la lluvia, salimos de excursión.', 'Puesto que ya lo sabes, no insisto.', 'Ella ahorra; él, en cambio, gasta todo.', 'Hay mucho tráfico, de ahí que lleguemos tarde.'],
    practice: [
      mc('«No obstante» expresa...', 'oposición', ['consecuencia', 'finalidad', 'adición'], 'No obstante = sin embargo.', { tag: 'conectores' }),
      mc('Aunque ___ mañana, iremos. (llover; posibilidad)', 'llueva', ['llueve', 'llovió', 'lloverá'], 'Aunque + subjuntivo: obstáculo hipotético.', { tag: 'conectores' }),
      fill('Hay mucho tráfico, de ahí que ___ tarde. (llegar, nosotros)', 'lleguemos', 'De ahí que + subjuntivo.', { tag: 'conectores' }),
      order('A pesar de la lluvia salimos', 'A pesar de + sustantivo.', { tag: 'conectores', alts: ['Salimos a pesar de la lluvia'] }),
    ],
    quiz: [
      mc('Estudio mucho ___ que apruebe. (finalidad)', 'para', ['porque', 'aunque', 'sin embargo'], 'Para que + subjuntivo = finalidad.', { tag: 'conectores' }),
      mc('¿Qué conector indica consecuencia?', 'por tanto', ['puesto que', 'aunque', 'en cambio'], 'Por tanto expresa consecuencia; puesto que, causa; aunque, concesión; en cambio, contraste.', { tag: 'conectores' }),
      mc('Iré ___ tú me acompañes. (condición)', 'siempre que', ['puesto que', 'por consiguiente', 'dado que'], 'Siempre que + subjuntivo expresa condición; los otros conectores no admiten este subjuntivo.', { tag: 'conectores' }),
      listen('Ella ahorra; él, en cambio, gasta todo.', 'Escucha: ¿qué relación hay entre las dos personas?', 'Contraste', ['Causa', 'Igualdad', 'Finalidad'], '«En cambio» marca contraste.', { tag: 'conectores' }),
      dict('El plan es bueno; no obstante, es caro.', 'Revisa el punto y coma y la coma.', { tag: 'dictado' }),
      mc('«Puesto que» introduce...', 'una causa conocida', ['una consecuencia lógica', 'una finalidad clara', 'una oposición fuerte'], 'Puesto que = ya que.', { tag: 'vocabulario' }),
      match([['no obstante', 'Oposición'], ['por consiguiente', 'Consecuencia'], ['puesto que', 'Causa conocida'], ['a pesar de', 'Dificultad que no impide algo']], 'Repasa los conectores.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u2.l1', level: 'B2', unit: 2, n: 1, title: 'El correo profesional', topic: 'Escritura profesional',
    goal: 'Al terminar esta lección, podrás redactar correos profesionales claros con asunto, petición, seguimiento y cierre adecuados.',
    vocab: [
      ['dirigirse a', 'expresión', 'Hablar o escribir a alguien en particular.', 'Me dirijo a usted para consultarle un plazo.', 'I am writing to ask you about a deadline.'],
      ['quedar a la espera', 'expresión', 'Esperar una respuesta o una acción.', 'Quedo a la espera de sus noticias.', 'I look forward to hearing from you.'],
      ['con copia a', 'expresión', 'Indica quién recibe también el mensaje.', 'Escribo a Marta con copia a Luis.', 'I am writing to Marta, copying Luis.'],
      ['a la atención de', 'expresión', 'Indica a quién va dirigido un documento.', 'A la atención de la Dirección de Personal.', 'For the attention of the Personnel Department.'],
      ['ponerse en contacto', 'expresión', 'Comunicarse con alguien.', 'Puede ponerse en contacto conmigo por teléfono.', 'You can get in touch with me by phone.'],
      ['cordial saludo', 'expresión', 'Fórmula de despedida profesional.', 'Reciba un cordial saludo.', 'Kind regards.'],
    ],
    explain: { title: 'Correos que se leen y se responden', body: [
      'Un correo profesional eficaz es <b>breve, claro y accionable</b>: el lector debe saber en segundos qué se le pide y para cuándo.',
      { t: 'table', head: ['Parte', 'Recomendación', 'Ejemplo'], rows: [['Asunto', 'Concreto, con la acción', 'Solicitud de presupuesto: reforma de la oficina'], ['Saludo', 'Según la relación', 'Estimada Sra. Ruiz: / Hola, Marta:'], ['Apertura', 'Motivo en la primera frase', 'Le escribo para confirmar la reunión del jueves.'], ['Cuerpo', 'Un tema por párrafo', 'Adjunto el informe. Falta revisar el punto tres.'], ['Petición', 'Verbo claro y plazo', '¿Podría enviarme los datos antes del viernes?'], ['Cierre', 'Disponibilidad y despedida', 'Quedo a la espera de sus noticias. Un cordial saludo,']] },
      '<b>Peticiones corteses:</b> «¿Podría + infinitivo?», «Le agradecería que + imperfecto de subjuntivo», «Le ruego que + presente de subjuntivo» (más formal): «Le ruego que confirme su asistencia».',
      '<b>Seguimiento:</b> «Le escribo de nuevo en relación con mi correo del día 5», «Como le comenté en mi mensaje anterior...», «Solo quería recordarle que...».',
      '<b>Registro:</b> evita abreviaturas de chat, mayúsculas continuas y signos de exclamación repetidos. Revisa los adjuntos antes de enviar: es muy habitual escribir «adjunto» y olvidar el archivo.',
      { t: 'ex', list: ['Me dirijo a usted para consultarle un plazo.', 'Le ruego que confirme su asistencia.', 'Quedo a la espera de sus noticias.', 'Puede ponerse en contacto conmigo por teléfono.'] },
    ] },
    listen: ['Me dirijo a usted para consultarle un plazo.', 'Le ruego que confirme su asistencia antes del viernes.', 'Quedo a la espera de sus noticias.', 'Escribo a Marta con copia a Luis.', 'Reciba un cordial saludo.'],
    practice: [
      mc('¿Qué asunto es más claro?', 'Presupuesto: confirmar antes del lunes', ['Información muy importante para usted', 'URGENTE!!! Leer este mensaje ya', 'Quería preguntarle una cosa sobre lo de ayer'], 'El asunto debe ser concreto.', { tag: 'correo-profesional' }),
      mc('Le ruego que ___ su asistencia. (confirmar)', 'confirme', ['confirma', 'confirmará', 'confirmó'], 'Rogar que + subjuntivo.', { tag: 'correo-profesional' }),
      fill('Le agradecería que me ___ lo antes posible. (responder)', ['respondiera', 'respondiese'], 'Le agradecería que + imperfecto de subjuntivo.', { tag: 'correo-profesional' }),
      order('Quedo a la espera de sus noticias', 'Fórmula de cierre.', { tag: 'correo-profesional' }),
    ],
    quiz: [
      mc('«Con copia a» sirve para...', 'indicar quién recibe también el mensaje', ['pedir disculpas por el retraso en responder', 'añadir un archivo al mensaje que se envía', 'cambiar el asunto del correo anterior'], 'Con copia a = CC.', { tag: 'correo-profesional' }),
      mc('¿Cuál es una apertura profesional?', 'Le escribo para confirmar la reunión.', ['Oye, te cuento una cosa sobre la reunión.', 'Hola!!! ¿Qué tal todo por ahí?', 'Buenas, tío, a ver si me echas un cable'], 'El motivo va en la primera frase.', { tag: 'correo-profesional' }),
      mc('¿Cuál es el cierre más profesional?', 'Quedo a su disposición. Atentamente,', ['Cuando puedas me contestas, ¿vale? Bss', 'Nada más por hoy. Un besote y chao.', 'Hasta la vista, ya hablamos pronto.'], 'Fórmula de cierre profesional.', { tag: 'correo-profesional' }),
      listen('Le ruego que confirme su asistencia antes del viernes.', 'Escucha: ¿qué se pide?', 'Confirmar la asistencia', ['Enviar un archivo adjunto', 'Cambiar la fecha de la cita', 'Cancelar la reunión del viernes'], 'Dice «confirme su asistencia».', { tag: 'correo-profesional' }),
      dict('Quedo a la espera de sus noticias.', 'Revisa la «q» de «quedo».', { tag: 'dictado' }),
      mc('Un buen correo profesional tiene...', 'un tema por párrafo y un plazo claro', ['párrafos largos con varios temas mezclados', 'abreviaturas de chat para ir más rápido', 'muchos signos de exclamación'], 'Claro y accionable.', { tag: 'correo-profesional' }),
      match([['dirigirse a', 'Escribir a alguien en concreto'], ['con copia a', 'Otro destinatario del mensaje'], ['cordial saludo', 'Despedida profesional'], ['quedar a la espera', 'Esperar una respuesta']], 'Repasa el vocabulario del correo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u2.l2', level: 'B2', unit: 2, n: 2, title: 'El artículo de opinión', topic: 'Escritura argumentativa',
    goal: 'Al terminar esta lección, podrás reconocer y escribir un artículo de opinión con tesis, argumentos y contraargumentos.',
    vocab: [
      ['el columnista', 'sustantivo', 'Persona que escribe una columna de opinión en un periódico.', 'El columnista critica la nueva ley.', 'The columnist criticizes the new law.'],
      ['la tesis', 'sustantivo', 'Idea central que se defiende en un texto.', 'La tesis del artículo es clara.', 'The thesis of the article is clear.'],
      ['el contraargumento', 'sustantivo', 'Argumento que se opone a otro.', 'Conviene anticipar un contraargumento.', 'It is useful to anticipate a counterargument.'],
      ['rotundo', 'adjetivo', 'Claro, firme y sin dudas.', 'Su rechazo fue rotundo.', 'His rejection was emphatic.'],
      ['polémico', 'adjetivo', 'Que provoca discusión.', 'Es un tema muy polémico.', 'It is a very controversial subject.'],
      ['el encabezado', 'sustantivo', 'Título de una noticia o de un artículo en la prensa.', 'El encabezado llamó mi atención.', 'The headline caught my attention.', ['titular']],
    ],
    explain: { title: 'Estructura de un artículo de opinión', body: [
      'El artículo de opinión defiende un <b>punto de vista</b> con argumentos. A diferencia de la noticia, es subjetivo; a diferencia del ensayo, es breve y está pensado para el lector general.',
      { t: 'table', head: ['Parte', 'Función', 'Recursos'], rows: [['Titular', 'Atraer y adelantar el tema', 'pregunta, afirmación rotunda, juego de palabras'], ['Introducción', 'Plantear el tema y la tesis', 'Cada vez más personas..., Se habla mucho de...'], ['Desarrollo', 'Argumentar con datos y ejemplos', 'En primer lugar, Además, Por ejemplo, Según un estudio...'], ['Contraargumento', 'Reconocer la postura contraria y rebatirla', 'Es cierto que... pero; Se dirá que...; Sin duda... aunque'], ['Conclusión', 'Cerrar y reforzar la tesis', 'En definitiva, Por todo ello']] },
      '<b>Concesión y refutación:</b> «Es cierto que + indicativo, pero...» y «Es verdad que + indicativo, sin embargo...» reconocen al adversario antes de rebatirlo. «Aunque + subjuntivo» presenta la objeción como un obstáculo poco decisivo.',
      '<b>Recursos retóricos:</b> la pregunta retórica («¿Hasta cuándo vamos a tolerarlo?»), el uso de la primera persona del plural para implicar al lector («Debemos pensar...»), la enumeración y el contraste.',
      '<b>Verbos para citar fuentes:</b> sostener, afirmar, señalar, advertir, subrayar. «Según + fuente» no lleva verbo: «Según la OMS, ...».',
      { t: 'ex', list: ['Es cierto que el plan es caro, pero merece la pena.', 'Se dirá que es utópico; sin embargo, ya funciona en otros países.', '¿Hasta cuándo vamos a tolerarlo?', 'En definitiva, necesitamos actuar.'] },
    ] },
    listen: ['El columnista defiende una tesis muy polémica.', 'Es cierto que el plan es caro, pero merece la pena.', 'Se dirá que es utópico; sin embargo, ya funciona en otros países.', '¿Hasta cuándo vamos a tolerarlo?', 'En definitiva, necesitamos actuar ya.'],
    practice: [
      mc('¿Dónde se plantea normalmente la tesis?', 'En la introducción', ['En la firma', 'Solo en el titular', 'Al final de la página'], 'La tesis se plantea al inicio.', { tag: 'opinion-escrita' }),
      mc('Es cierto que el plan ___ caro, pero útil. (ser)', 'es', ['sea', 'fuera', 'sido'], 'Es cierto que + indicativo: es.', { tag: 'opinion-escrita' }),
      fill('Aunque ___ difícil, merece la pena. (ser, hipótesis)', 'sea', 'Aunque + subjuntivo: obstáculo no decisivo.', { tag: 'opinion-escrita' }),
      order('En definitiva necesitamos actuar ya', 'Conclusión.', { tag: 'opinion-escrita', alts: ['Necesitamos actuar ya, en definitiva'] }),
    ],
    quiz: [
      mc('Un contraargumento sirve para...', 'reconocer y rebatir la postura contraria', ['repetir la tesis en cada párrafo del texto', 'citar la fuente de un dato concreto', 'resumir todo el texto para el lector'], 'Anticipa la objeción.', { tag: 'opinion-escrita' }),
      mc('¿Qué es una pregunta retórica?', 'Una pregunta que no espera respuesta', ['Una pregunta que el lector debe contestar', 'Una pregunta de examen oral', 'Una duda que el autor no resuelve'], 'Es un recurso expresivo.', { tag: 'opinion-escrita' }),
      mc('¿Cuál NO es verbo para citar fuentes?', 'ocultar', ['afirmar', 'señalar', 'advertir'], 'Ocultar no introduce citas; afirmar, señalar y advertir sí.', { tag: 'opinion-escrita' }),
      listen('Es cierto que el plan es caro, pero merece la pena.', 'Escucha: ¿qué hace el autor?', 'Reconoce un punto contrario y lo rebate', ['Pide ayuda a los lectores del periódico', 'Cuenta un recuerdo de su infancia lejana', 'Agradece el apoyo que ha recibido de todos'], 'Concesión + refutación.', { tag: 'opinion-escrita' }),
      dict('Se dirá que es utópico; sin embargo, ya funciona.', 'Revisa la tilde de «utópico», el punto y coma y la coma tras «sin embargo».', { tag: 'dictado' }),
      mc('Un tema «polémico» es...', 'un tema que provoca discusión', ['un tema que casi nadie conoce todavía', 'un tema que interesa solo a expertos', 'un tema que todos aceptan sin dudar'], 'Polémico = genera debate.', { tag: 'vocabulario' }),
      match([['el columnista', 'Escribe opinión en prensa'], ['la tesis', 'Idea central'], ['el encabezado', 'Título de la noticia'], ['rotundo', 'Firme y sin dudas']], 'Repasa el vocabulario del artículo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u2.l3', level: 'B2', unit: 2, n: 3, title: 'Resumir un texto', topic: 'Síntesis',
    goal: 'Al terminar esta lección, podrás resumir un texto con tus propias palabras, conservando la idea principal y omitiendo lo accesorio.',
    vocab: [
      ['la idea principal', 'expresión', 'Mensaje más importante de un texto.', 'Subraya la idea principal de cada párrafo.', 'Underline the main idea of each paragraph.'],
      ['sintetizar', 'verbo', 'Reducir algo a lo esencial.', 'Sintetiza el artículo en tres líneas.', 'Sum up the article in three lines.'],
      ['parafrasear', 'verbo', 'Decir lo mismo con otras palabras.', 'No copies: parafrasea el fragmento.', 'Do not copy: paraphrase the excerpt.'],
      ['omitir', 'verbo', 'No incluir algo.', 'Omite los ejemplos y los detalles.', 'Leave out the examples and the details.'],
      ['en resumidas cuentas', 'expresión', 'Introduce una conclusión breve.', 'En resumidas cuentas, no hay solución fácil.', 'In short, there is no easy solution.', ['en suma']],
      ['el fragmento', 'sustantivo', 'Parte de un texto.', 'Lee este fragmento y resúmelo.', 'Read this excerpt and summarize it.'],
    ],
    explain: { title: 'Cómo resumir sin copiar', body: [
      'Resumir es <b>comprender, seleccionar y reformular</b>. Un buen resumen es mucho más corto que el original, fiel a sus ideas y escrito con tus palabras.',
      { t: 'table', head: ['Paso', 'Qué hacer'], rows: [['1. Leer', 'Lee todo el texto una vez para entender el tema general.'], ['2. Subrayar', 'Marca la idea principal de cada párrafo.'], ['3. Descartar', 'Omite ejemplos, repeticiones y detalles.'], ['4. Reformular', 'Escribe con tus palabras, usando sinónimos y otra estructura.'], ['5. Revisar', 'Comprueba que no añades opiniones propias y que conservas el orden lógico.']] },
      '<b>Verbos para referirse al autor:</b> El autor <b>sostiene</b> / <b>señala</b> / <b>plantea</b> / <b>concluye</b> que + indicativo. Usa el presente: «El texto explica que...».',
      '<b>Recursos de reformulación:</b> nominalización («Los precios suben» → «la subida de los precios»), construcciones impersonales con «se» («Se concluye que...»), cambio de categoría gramatical y sinónimos.',
      '<b>Conectores de cierre:</b> en definitiva, en suma, en resumidas cuentas, en síntesis. Como orientación, un resumen suele ocupar un tercio o menos del original, salvo que la tarea indique otra extensión.',
      { t: 'ex', list: ['El autor sostiene que el transporte público debe mejorar.', 'Los precios suben → la subida de los precios.', 'En resumidas cuentas, no hay solución fácil.', 'Se concluye que la medida es insuficiente.'] },
    ] },
    listen: ['Subraya la idea principal de cada párrafo.', 'El autor sostiene que el transporte público debe mejorar.', 'No copies: parafrasea el fragmento.', 'En resumidas cuentas, no hay solución fácil.', 'Se concluye que la medida es insuficiente.'],
    practice: [
      mc('Un resumen debe...', 'conservar las ideas con tus palabras', ['copiar frases enteras del original', 'añadir tu opinión personal al final', 'reproducir los párrafos con pequeños cambios'], 'Resumir es reformular.', { tag: 'resumen' }),
      mc('Parafrasear significa...', 'decir lo mismo con otras palabras', ['repetir las ideas palabra por palabra', 'explicar el texto con ejemplos nuevos', 'traducir el texto a otro idioma'], 'Parafrasear = reformular.', { tag: 'resumen' }),
      fill('El autor ___ que el plan es insuficiente. (concluir, presente)', 'concluye', 'Concluir, él: concluye.', { tag: 'resumen' }),
      order('En resumidas cuentas no hay solución fácil', 'Conector de cierre.', { tag: 'resumen', alts: ['No hay solución fácil, en resumidas cuentas'] }),
    ],
    quiz: [
      mc('¿Qué conviene omitir en un resumen?', 'ejemplos y detalles', ['la tesis del autor', 'las ideas principales', 'la conclusión del texto'], 'Lo accesorio se descarta.', { tag: 'resumen' }),
      mc('Nominalizar «Los precios suben» da...', 'la subida de los precios', ['los precios que están subiendo', 'han subido los precios', 'el precio que subió'], 'Verbo → sustantivo.', { tag: 'resumen' }),
      mc('¿Qué tiempo se usa para referirse al texto?', 'El presente', ['El futuro', 'El condicional', 'El pluscuamperfecto'], 'El texto explica...', { tag: 'resumen' }),
      listen('No copies: parafrasea el fragmento.', 'Escucha: ¿qué se pide?', 'Decirlo con otras palabras', ['Copiar el texto literalmente', 'Traducir el texto al inglés', 'Leer el texto en voz alta'], 'Dice «parafrasea».', { tag: 'resumen' }),
      dict('Subraya la idea principal de cada párrafo.', 'Revisa la tilde de «párrafo».', { tag: 'dictado' }),
      mc('«Sintetizar» significa...', 'reducir a lo esencial', ['ampliar con más detalles', 'copiar sin cambiar nada', 'valorar con espíritu crítico'], 'Sintetizar = condensar.', { tag: 'vocabulario' }),
      match([['la idea principal', 'Mensaje más importante'], ['omitir', 'No incluir'], ['el fragmento', 'Parte de un texto'], ['en resumidas cuentas', 'Conclusión breve']], 'Repasa el vocabulario del resumen.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'tratar de tú': 'to address as «tú»', 'el registro': ['register (formal or informal)', 'record; entry'], 'informal': 'informal; colloquial', 'de tú a tú': 'on equal terms; as equals', 'esmerado': 'careful; polished', 'el tratamiento': ['form of address', 'treatment'],
    'el voseo': 'use of «vos» instead of «tú»', 'el seseo': 'pronouncing «z» and «c» as «s»', 'el vosotros': 'the «vosotros» form (Spain)', 'el latinismo': 'Latin-derived word', 'el regionalismo': 'regional expression', 'la variedad': 'variety; variant',
    'la ironía': 'irony', 'el sarcasmo': 'sarcasm', 'gastar una broma': 'to play a joke on', 'el doble sentido': 'double meaning; innuendo', 'el chiste': 'joke', 'tener gracia': 'to be funny',
    'el orden del día': 'agenda', 'tomar la palabra': 'to take the floor', 'la ponencia': 'presentation; paper; talk', 'el turno de preguntas': 'question time', 'pasar a': 'to move on to', 'dar paso a': 'to hand over to',
    'el porcentaje': 'percentage', 'la tendencia': 'trend; tendency', 'el gráfico': 'chart; graph', 'aumentar': 'to increase', 'descender': 'to fall; to descend', 'según los datos': 'according to the data',
    'la concesión': 'concession', 'llegar a un acuerdo': 'to reach an agreement', 'la contraoferta': 'counteroffer', 'convencer': 'to convince', 'a cambio de': 'in exchange for', 'ceder': 'to give way; to concede'
  });

  C.addLesson({
    id: 'b2.u3.l1', level: 'B2', unit: 3, n: 1, title: 'Formal e informal', topic: 'Registro',
    goal: 'Al terminar esta lección, podrás adaptar tu forma de hablar y escribir al registro formal o informal según la situación.',
    vocab: [
      ['tratar de tú', 'expresión', 'Dirigirse a alguien con «tú» y no con «usted».', 'Mi jefe me pidió que lo tratara de tú.', 'My boss asked me to address him as «tú».'],
      ['el registro', 'sustantivo', 'Nivel de formalidad del lenguaje en una situación.', 'Cambio de registro según con quién hablo.', 'I change register depending on whom I am talking to.'],
      ['informal', 'adjetivo', 'Propio de la conversación familiar y espontánea.', '«Currar» es una palabra informal.', '«Currar» is an informal word.'],
      ['de tú a tú', 'expresión', 'En igualdad de condiciones.', 'Hablamos de tú a tú, sin jerarquías.', 'We spoke as equals, without hierarchy.'],
      ['esmerado', 'adjetivo', 'Hecho con mucho cuidado y atención.', 'Escribió con un lenguaje esmerado.', 'He wrote in careful, polished language.'],
      ['el tratamiento', 'sustantivo', 'Forma de dirigirse a una persona (tú, usted, don, doña...).', 'El tratamiento de usted muestra respeto.', 'Using «usted» shows respect.'],
    ],
    explain: { title: 'Cambiar de registro con naturalidad', body: [
      'El <b>registro</b> es el nivel de formalidad. Depende de la relación con la otra persona, del contexto, del canal (oral o escrito) y del propósito. Un hablante competente pasa de uno a otro sin esfuerzo.',
      { t: 'table', head: ['Situación', 'Informal', 'Formal'], rows: [['Saludar', 'Hola, ¿qué tal?', 'Buenos días, ¿cómo está usted?'], ['Pedir', 'Oye, ¿me pasas la sal?', '¿Sería tan amable de pasarme la sal?'], ['Rechazar', 'Paso, no me apetece.', 'Lamentablemente, no podré asistir.'], ['Despedirse', 'Nos vemos, ¡un abrazo!', 'Quedo a su disposición. Atentamente.'], ['Acordar', 'Vale, genial.', 'De acuerdo, perfecto.'], ['Quejarse', 'Esto es un rollo.', 'Esta situación resulta bastante inconveniente.']] },
      '<b>Tú / usted / vos:</b> «usted» marca respeto o distancia; «tú» confianza. En países con voseo (Argentina, Uruguay, Centroamérica) «vos» sustituye a «tú» en el trato de confianza, con matices según el país. En algunas zonas, como partes de Colombia, «usted» se usa incluso entre amigos o en familia.',
      '<b>Marcas del registro formal:</b> subjuntivo y condicional de cortesía, léxico preciso («solicitar», «abonar»), construcciones impersonales («se ruega»), ausencia de muletillas. <b>Marcas del informal:</b> diminutivos, interjecciones (¡madre mía!), contracciones («pa» por «para»), léxico coloquial.',
      '<b>Error frecuente:</b> mezclar registros. «Estimado señor: ¡Qué pasa, tío!» suena absurdo. Mantén coherencia en pronombres, léxico y despedida.',
      { t: 'ex', list: ['¿Sería tan amable de pasarme la sal?', 'Lamentablemente, no podré asistir.', 'Hablamos de tú a tú.', 'Oye, ¿me pasas la sal?'] },
    ] },
    listen: ['¿Sería tan amable de pasarme la sal?', 'Oye, ¿me pasas la sal?', 'Lamentablemente, no podré asistir a la reunión.', 'Mi jefe me pidió que lo tuteara.', 'Hablamos de tú a tú, sin jerarquías.'],
    practice: [
      mc('¿Qué frase es formal?', 'Lamentablemente, no podré asistir.', ['Oye, paso de ir, no me apetece.', 'Vale, genial, ya me pasaré por allí.', 'Nos vemos mañana, ¡un abrazo!'], 'El adverbio «lamentablemente» y la negativa cortés dan tono formal; las otras son coloquiales.', { tag: 'registro' }),
      mc('El «voseo» es el uso de...', 'vos en lugar de tú', ['vosotros en América', 'usted en familia', 'él y ella'], 'Voseo = vos.', { tag: 'registro' }),
      fill('Mi jefe me pidió que lo ___. (tutear, imperfecto de subjuntivo)', ['tuteara', 'tutease'], 'Pedir que + imperfecto de subjuntivo.', { tag: 'registro' }),
      order('Sería tan amable de pasarme la sal', 'Petición formal.', { tag: 'registro' }),
    ],
    quiz: [
      mc('«Coloquial» describe un lenguaje...', 'propio de la conversación informal', ['propio de los textos científicos y técnicos', 'propio de las leyes y de los contratos', 'propio de la poesía y la literatura antigua'], 'Coloquial = informal.', { tag: 'vocabulario' }),
      mc('¿Qué es incoherente en una carta formal?', 'Estimado señor: ¡Qué pasa, tío!', ['Estimado señor: Le escribo en relación con su oferta.', 'Atentamente,', 'Quedo a su disposición.'], 'Se mezclan registros.', { tag: 'registro' }),
      mc('¿Qué pronombre indica más distancia?', 'usted', ['tú', 'vos', 'vosotros'], 'Usted = respeto o distancia.', { tag: 'registro' }),
      listen('Oye, ¿me pasas la sal?', 'Escucha: ¿qué registro usa?', 'Informal', ['Formal', 'Jurídico', 'Literario'], 'Oye + tú = informal.', { tag: 'registro' }),
      dict('Lamentablemente, no podré asistir a la reunión.', 'Revisa la «bl» de «lamentablemente» y la tilde de «podré».', { tag: 'dictado' }),
      mc('«De tú a tú» significa...', 'en igualdad de condiciones', ['con mucho respeto y distancia', 'a través de un intermediario', 'sin que nadie más se entere'], 'De tú a tú = entre iguales.', { tag: 'vocabulario' }),
      match([['tratar de tú', 'Usar «tú» y no «usted»'], ['el registro', 'Nivel de formalidad'], ['informal', 'Propio de la conversación familiar'], ['esmerado', 'Cuidado con atención']], 'Repasa el vocabulario del registro.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u3.l2', level: 'B2', unit: 3, n: 2, title: 'Variedades del español', topic: 'Dialectos',
    goal: 'Al terminar esta lección, podrás reconocer las diferencias principales entre el español de España y el de América.',
    vocab: [
      ['el voseo', 'sustantivo', 'Uso de «vos» como pronombre de segunda persona singular.', 'En Argentina el voseo es general.', 'In Argentina, «voseo» is the general norm.'],
      ['el seseo', 'sustantivo', 'Pronunciación de «z» y «c» como «s».', 'El seseo es normal en Canarias y América.', 'Seseo is normal in the Canaries and in the Americas.'],
      ['el vosotros', 'sustantivo', 'Forma de segunda persona del plural que se usa sobre todo en España.', 'En España se dice «vosotros»; en América, «ustedes».', 'In Spain people say «vosotros»; in the Americas, «ustedes».'],
      ['el latinismo', 'sustantivo', 'Palabra o expresión tomada del latín.', '«Ad hoc» es un latinismo.', '«Ad hoc» is a Latinism.'],
      ['el regionalismo', 'sustantivo', 'Palabra o expresión propia de una región.', '«Chévere» es un regionalismo caribeño y andino.', '«Chévere» is a Caribbean and Andean regionalism.'],
      ['la variedad', 'sustantivo', 'Forma particular de una lengua según la zona.', 'El español tiene muchas variedades.', 'Spanish has many varieties.'],
    ],
    explain: { title: 'Un idioma, muchas voces', body: [
      'El español lo hablan más de 500 millones de personas y es lengua oficial en unos veinte países. No existe una «forma correcta» única: la <b>norma culta</b> es policéntrica y todas las variedades son válidas. Las diferencias afectan a la pronunciación, la gramática y el léxico.',
      { t: 'table', head: ['Rasgo', 'España (centro-norte)', 'América / Canarias / sur de España'], rows: [['Pronunciación de z, c', 'distinción: «cena» ≠ «sena»', 'seseo: «cena» = «sena»'], ['Pronombre plural (2.ª pers.)', 'vosotros coméis', 'ustedes comen'], ['Pasado reciente', 'pretérito perfecto: «Hoy he comido»', 'más indefinido: «Hoy comí»'], ['Trato singular', 'tú', 'tú, vos o usted según el país'], ['Leísmo', 'frecuente: «Le vi ayer»', 'menos frecuente: «Lo vi ayer»']] },
      '<b>Léxico:</b> la misma cosa recibe nombres distintos. Coche (España) / carro (Colombia, México) / auto (Cono Sur); ordenador / computadora; móvil / celular; zumo / jugo; aparcar / estacionar; autobús / guagua (Canarias, Caribe) / colectivo / camión (México).',
      '<b>Voseo:</b> conjugación propia en presente: «vos tenés», «vos querés», «vos sos»; imperativo: «vení», «decime». Es normal en Argentina y Uruguay y común en Centroamérica, Paraguay y partes de Colombia.',
      '<b>Falsos amigos regionales:</b> «coger» es corriente en España pero vulgar en varios países de América (se prefiere «tomar», «agarrar»). Ante la duda, elige verbos neutros.',
      { t: 'ex', list: ['En España se usa vosotros; en América, ustedes.', 'Vos tenés razón, che.', 'El carro nuevo es de mi hermano.', 'En Canarias y América hay seseo.'] },
    ] },
    listen: ['En España se dice vosotros; en América, ustedes.', 'Vos tenés razón, che.', 'Mi hermano compró un carro nuevo.', 'En Canarias y en América hay seseo.', 'El español tiene muchas variedades.'],
    practice: [
      mc('«Vos tenés» es un ejemplo de...', 'voseo', ['seseo', 'leísmo', 'latinismo'], 'Vos + verbo propio = voseo.', { tag: 'variedades' }),
      mc('En México y Colombia, «carro» equivale a...', 'coche', ['casa', 'moto', 'tren'], 'Carro = coche.', { tag: 'variedades' }),
      fill('En España se dice «vosotros» y en América «___».', 'ustedes', 'Ustedes en América.', { tag: 'variedades' }),
      order('El español tiene muchas variedades', 'Frase simple.', { tag: 'variedades' }),
    ],
    quiz: [
      mc('El seseo consiste en...', 'pronunciar z y c como s', ['pronunciar la s final como una h', 'usar vos en vez de tú', 'decir «ustedes» en vez de «vosotros»'], 'Seseo = z/c como s.', { tag: 'variedades' }),
      mc('¿Qué país usa mucho el voseo?', 'Argentina', ['España', 'Cuba', 'Puerto Rico'], 'Voseo rioplatense.', { tag: 'variedades' }),
      mc('Hoy ___ al cine. (preferencia mayoritaria en América)', 'fui', ['he ido', 'iré', 'iría'], 'En buena parte de América predomina el indefinido para lo ocurrido hoy; en el centro y norte de España, el pretérito perfecto (aunque ambos existen en las dos zonas).', { tag: 'variedades' }),
      listen('Vos tenés razón, che.', 'Escucha: ¿qué variedad se oye?', 'Rioplatense', ['Castellana norteña', 'Canaria', 'Andaluza'], 'Vos tenés y che son rioplatenses.', { tag: 'variedades' }),
      dict('El español tiene muchas variedades.', 'Revisa la tilde de «español».', { tag: 'dictado' }),
      mc('Un regionalismo es...', 'una palabra propia de una región', ['un error que conviene evitar siempre', 'una palabra de origen latino clásico', 'una abreviatura de uso muy común'], 'Regionalismo = propio de una zona.', { tag: 'vocabulario' }),
      match([['el voseo', 'Uso de vos'], ['el seseo', 'z y c como s'], ['el latinismo', 'Palabra del latín'], ['la variedad', 'Forma según la zona']], 'Repasa el vocabulario de las variedades.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u3.l3', level: 'B2', unit: 3, n: 3, title: 'Humor e ironía', topic: 'Pragmática',
    goal: 'Al terminar esta lección, podrás reconocer la ironía, el sarcasmo y los dobles sentidos y reaccionar con naturalidad.',
    vocab: [
      ['la ironía', 'sustantivo', 'Decir lo contrario de lo que se piensa para dar a entender algo.', 'Dijo «qué buen día» bajo la tormenta, con ironía.', 'He said «what a nice day» in the storm, ironically.'],
      ['el sarcasmo', 'sustantivo', 'Ironía cruel o burlona.', 'Su sarcasmo hirió a todos.', 'His sarcasm hurt everyone.'],
      ['gastar una broma', 'expresión', 'Hacer algo divertido a alguien para sorprenderlo.', 'Me gastaron una broma en mi cumpleaños.', 'They played a joke on me on my birthday.'],
      ['el doble sentido', 'expresión', 'Frase con dos interpretaciones, a menudo pícara.', 'Ese chiste tiene doble sentido.', 'That joke has a double meaning.'],
      ['el chiste', 'sustantivo', 'Historia breve que hace reír.', 'Cuéntame un chiste.', 'Tell me a joke.'],
      ['tener gracia', 'expresión', 'Ser divertido o ingenioso.', 'Tiene gracia que lo diga él.', 'It is funny that he of all people says it.'],
    ],
    explain: { title: 'Entender lo que no se dice', body: [
      'El humor y la ironía dependen del contexto, del tono y de lo que los hablantes comparten. En la ironía, <b>el significado literal suele ser contrario al intencional</b>.',
      { t: 'table', head: ['Recurso', 'Qué es', 'Ejemplo'], rows: [['Ironía', 'Decir lo contrario de lo que se piensa', 'Con 40 grados: «¡Qué día más fresquito!»'], ['Sarcasmo', 'Ironía hiriente', '«Qué inteligente eres, de verdad.» (tras un error)'], ['Hipérbole', 'Exageración', 'Te lo he dicho mil veces.'], ['Eufemismo', 'Suavizar lo desagradable', 'Se nos ha ido (= ha muerto).'], ['Doble sentido', 'Dos lecturas posibles', 'juegos de palabras, chistes pícaros'], ['Retintín', 'Tono burlón al hablar', 'tono + frase aparentemente neutra']] },
      '<b>Pistas para detectar la ironía:</b> un tono exagerado o plano, un elogio incoherente con la situación («¡Qué puntual!» a quien llega tarde), exclamaciones, risas o pausas. En la escritura se señala con comillas o con la puntuación.',
      '<b>Reaccionar:</b> «¡Qué bueno!» (de verdad), «Ja, ja, muy gracioso» (irónico), «No me lo puedo creer», «Eso tiene gracia», «Estás de broma» o «Te estás quedando conmigo» (esta última, coloquial y más propia de América), «¿Me estás tomando el pelo?».',
      '<b>Cuidado intercultural:</b> el humor es muy cultural. Lo que hace reír en un país puede ofender en otro. Evita el sarcasmo con personas que no conoces y en el trabajo.',
      { t: 'ex', list: ['¡Qué día más fresquito! (con 40 grados)', 'No me tomes el pelo.', 'Ese chiste tiene doble sentido.', 'Tiene gracia que lo diga él.'] },
    ] },
    listen: ['Con cuarenta grados, dijo: «¡qué día más fresquito!».', 'No me tomes el pelo, ¿de verdad ganaste?', 'Ese chiste tiene doble sentido.', 'Tiene gracia que lo diga precisamente él.', 'Su sarcasmo hirió a todos en la reunión.'],
    practice: [
      mc('Con 40 grados, «¡Qué día más fresquito!» es...', 'una ironía', ['una disculpa', 'una orden', 'un dato'], 'Significado contrario a la realidad.', { tag: 'ironia' }),
      mc('El sarcasmo se diferencia de la ironía porque...', 'es más hiriente', ['siempre se dice en broma', 'no tiene doble intención', 'se usa solo por escrito'], 'Sarcasmo = ironía cruel.', { tag: 'ironia' }),
      fill('No me ___ el pelo. (tomar, imperativo negativo, tú)', 'tomes', 'Imperativo negativo: no tomes.', { tag: 'ironia' }),
      order('Ese chiste tiene doble sentido', 'Frase sobre humor.', { tag: 'ironia' }),
    ],
    quiz: [
      mc('«Qué puntual», dicho a quien llega tarde, es...', 'irónico', ['literal', 'formal', 'una pregunta'], 'Elogio incoherente.', { tag: 'ironia' }),
      mc('Una hipérbole es...', 'una exageración', ['un modo de suavizar algo', 'un juego de palabras', 'un elogio sincero'], 'Te lo he dicho mil veces.', { tag: 'ironia' }),
      mc('Un eufemismo sirve para...', 'suavizar algo desagradable', ['exagerar lo que se dice', 'dar una orden con firmeza', 'hacer reír con un doble sentido'], 'Se nos ha ido.', { tag: 'ironia' }),
      listen('No me tomes el pelo, ¿de verdad ganaste?', 'Escucha: ¿qué siente la persona?', 'Sorpresa e incredulidad', ['Enfado con la otra persona', 'Aburrimiento y cansancio', 'Miedo a perder el premio'], 'Dice «no me tomes el pelo».', { tag: 'ironia' }),
      dict('Tiene gracia que lo diga precisamente él.', 'Revisa la tilde de «gracia» (no lleva) y la «c» de «precisamente».', { tag: 'dictado' }),
      mc('«Tomar el pelo» significa...', 'bromear a costa de alguien', ['cortar el pelo a alguien', 'ayudar a alguien con un problema', 'elogiar mucho a alguien'], 'Tomar el pelo = gastar una broma o engañar en broma.', { tag: 'vocabulario' }),
      match([['la ironía', 'Decir lo contrario'], ['el sarcasmo', 'Ironía burlona'], ['el chiste', 'Historia que hace reír'], ['tener gracia', 'Ser divertido']], 'Repasa el vocabulario del humor.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u4.l1', level: 'B2', unit: 4, n: 1, title: 'Reuniones y presentaciones', topic: 'Trabajo',
    goal: 'Al terminar esta lección, podrás participar en reuniones y hacer una presentación breve con estructura clara.',
    vocab: [
      ['el orden del día', 'expresión', 'Lista de temas que se tratarán en una reunión.', 'El orden del día tiene cuatro puntos.', 'The agenda has four items.'],
      ['tomar la palabra', 'expresión', 'Empezar a hablar en una reunión.', 'Quisiera tomar la palabra un momento.', 'I would like to take the floor for a moment.'],
      ['la ponencia', 'sustantivo', 'Exposición oral ante un público.', 'Su ponencia duró veinte minutos.', 'His talk lasted twenty minutes.'],
      ['el turno de preguntas', 'expresión', 'Momento para preguntar al final de una exposición.', 'Habrá turno de preguntas al final.', 'There will be question time at the end.'],
      ['pasar a', 'expresión', 'Cambiar al punto siguiente.', 'Pasemos al segundo punto.', 'Let us move on to the second item.'],
      ['dar paso a', 'expresión', 'Ceder la palabra a otra persona.', 'Doy paso a mi compañera.', 'I hand over to my colleague.'],
    ],
    explain: { title: 'Dirigir y seguir una reunión', body: [
      'Una reunión eficaz tiene <b>orden del día, tiempos y conclusiones</b>. En una presentación, la estructura se anuncia: el público debe saber dónde está en todo momento.',
      { t: 'table', head: ['Momento', 'Fórmulas'], rows: [['Abrir', 'Buenos días a todos. Gracias por venir. Vamos a empezar.'], ['Presentar el tema', 'El objetivo de hoy es... / Quisiera hablarles de...'], ['Estructurar', 'Primero... Después... Para terminar... / Mi exposición consta de tres partes.'], ['Pasar a otro punto', 'Pasemos al siguiente punto. / Dicho esto, quisiera pasar a...'], ['Dar la palabra', 'Doy paso a Marta. / ¿Quieres añadir algo, Luis?'], ['Pedir la palabra', '¿Puedo añadir algo? / Quisiera tomar la palabra.'], ['Cerrar', 'En resumen... Si no hay más preguntas, damos por terminada la reunión.']] },
      '<b>Primera persona del plural para proponer acciones conjuntas</b> (<i>vamos a</i> + infinitivo o el subjuntivo exhortativo): «Pasemos al siguiente punto», «Veamos los resultados», «Empecemos».',
      '<b>Para opinar con cortesía:</b> «Yo propondría que + imperfecto de subjuntivo» o «Sugiero que + presente de subjuntivo»: «Sugiero que dejemos este punto para la próxima reunión».',
      '<b>Acta de la reunión:</b> se redacta en pasado o presente histórico, con impersonales: «Se acordó que...», «Quedó pendiente...», «Se aprobó por unanimidad...».',
      { t: 'ex', list: ['Pasemos al segundo punto del orden del día.', 'Quisiera tomar la palabra un momento.', 'Sugiero que dejemos este punto para la próxima reunión.', 'Habrá turno de preguntas al final.'] },
    ] },
    listen: ['Buenos días a todos. Vamos a empezar con el orden del día.', 'Pasemos al segundo punto.', 'Quisiera tomar la palabra un momento.', 'Doy paso a mi compañera Marta.', 'Habrá turno de preguntas al final de la ponencia.'],
    practice: [
      mc('¿Qué frase sirve para pedir la palabra?', 'Quisiera tomar la palabra.', ['Doy paso a Marta.', 'Pasemos al siguiente punto.', 'Se aprobó por unanimidad.'], 'Pedir la palabra.', { tag: 'reuniones' }),
      fill('___ al siguiente punto. (pasar, nosotros, exhortativo)', 'Pasemos', 'Subjuntivo exhortativo: pasemos.', { tag: 'reuniones' }),
      mc('Sugiero que ___ este punto para mañana. (dejar, nosotros)', 'dejemos', ['dejamos', 'dejaremos', 'dejábamos'], 'Sugerir que + subjuntivo.', { tag: 'reuniones' }),
      order('Pasemos al segundo punto', 'Reunión.', { tag: 'reuniones' }),
    ],
    quiz: [
      mc('El «orden del día» es...', 'la lista de temas de la reunión', ['el texto que recoge lo acordado', 'la hora de inicio y de final', 'el resumen de la presentación'], 'Orden del día = agenda.', { tag: 'vocabulario' }),
      mc('¿Cuál es el estilo típico de un acta?', 'Se acordó que...', ['Te cuento que...', 'Ya veremos...', 'Ojalá...'], 'Impersonal en pasado.', { tag: 'reuniones' }),
      mc('«Doy paso a Marta» significa...', 'Marta va a hablar ahora', ['Marta se va de la reunión', 'Marta hace una pregunta', 'Marta termina su informe'], 'Dar paso = ceder la palabra.', { tag: 'reuniones' }),
      listen('Habrá turno de preguntas al final de la ponencia.', 'Escucha: ¿cuándo podrás preguntar?', 'Al final', ['Al principio', 'En el descanso', 'Nunca'], 'Turno de preguntas = al final.', { tag: 'reuniones' }),
      dict('Pasemos al segundo punto del orden del día.', 'Revisa las «s» de «pasemos».', { tag: 'dictado' }),
      mc('Una «ponencia» es...', 'una exposición oral ante un público', ['un contrato entre dos empresas socias', 'una lista de tareas pendientes de hacer', 'un correo enviado a toda la plantilla'], 'Ponencia = charla formal.', { tag: 'vocabulario' }),
      match([['el orden del día', 'Temas de la reunión'], ['tomar la palabra', 'Empezar a hablar'], ['dar paso a', 'Ceder la palabra'], ['pasar a', 'Ir al siguiente punto']], 'Repasa el vocabulario de las reuniones.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u4.l2', level: 'B2', unit: 4, n: 2, title: 'Exponer datos', topic: 'Datos y gráficos',
    goal: 'Al terminar esta lección, podrás describir cifras, porcentajes, tendencias y gráficos con vocabulario preciso.',
    vocab: [
      ['el porcentaje', 'sustantivo', 'Cantidad expresada por cada cien.', 'El porcentaje de paro bajó al 8 %.', 'The unemployment percentage fell to 8%.'],
      ['la tendencia', 'sustantivo', 'Dirección en que evoluciona algo.', 'La tendencia es claramente positiva.', 'The trend is clearly positive.'],
      ['el gráfico', 'sustantivo', 'Dibujo que representa datos.', 'El gráfico muestra las ventas por mes.', 'The chart shows sales by month.'],
      ['aumentar', 'verbo', 'Hacerse más grande o más numeroso.', 'Las ventas aumentaron un 15 %.', 'Sales increased by 15%.', ['incrementar']],
      ['descender', 'verbo', 'Bajar o disminuir.', 'La temperatura descendió diez grados.', 'The temperature dropped ten degrees.'],
      ['según los datos', 'expresión', 'Introduce una fuente de información.', 'Según los datos oficiales, hay más turistas.', 'According to official data, there are more tourists.'],
    ],
    explain: { title: 'Describir cifras y tendencias', body: [
      'Al exponer datos, el reto es ser <b>preciso y neutral</b>: decir qué dato, cuánto, en qué periodo y con qué comparación. Después se interpreta.',
      { t: 'table', head: ['Tendencia', 'Verbos', 'Ejemplo'], rows: [['Subida', 'aumentar, subir, crecer, incrementarse, dispararse', 'Las ventas aumentaron un 15 %.'], ['Bajada', 'descender, bajar, disminuir, reducirse, desplomarse', 'El paro descendió al 8 %.'], ['Estabilidad', 'mantenerse, estabilizarse, permanecer', 'Los precios se mantuvieron.'], ['Fluctuación', 'oscilar, fluctuar', 'La cifra osciló entre 40 y 50.'], ['Máximo / mínimo', 'alcanzar un máximo / tocar fondo', 'Alcanzó su máximo en julio.']] },
      '<b>Preposiciones con cifras:</b> aumentar <b>en</b> 200 unidades (diferencia) / aumentar <b>un</b> 10 % (proporción) / pasar <b>de</b> 50 <b>a</b> 80 / situarse <b>en</b> el 20 % / oscilar <b>entre</b> 10 <b>y</b> 15.',
      '<b>Fracciones y porcentajes:</b> la mitad, un tercio, dos tercios, un cuarto, tres cuartos; «el 25 % de la población» (cifra referida a un conjunto conocido), «un 25 %» (cifra presentada como dato nuevo, a veces aproximado); concordancia: «El 30 % de los encuestados <b>afirma</b> / <b>afirman</b>» (ambas aceptadas).',
      '<b>Comparar:</b> el doble de, el triple de, el X % más que, casi, aproximadamente, algo más de, menos de. <b>Citar fuentes:</b> según los datos del INE..., de acuerdo con el informe..., los datos revelan que...',
      { t: 'ex', list: ['Las ventas aumentaron un 15 % respecto al año anterior.', 'El paro pasó del 12 % al 8 %.', 'La cifra osciló entre 40 y 50.', 'Según los datos, la tendencia es positiva.'] },
    ] },
    listen: ['Las ventas aumentaron un quince por ciento.', 'El paro pasó del doce por ciento al ocho por ciento.', 'Según los datos, la tendencia es positiva.', 'La cifra osciló entre cuarenta y cincuenta.', 'El gráfico muestra las ventas de cada mes.'],
    practice: [
      mc('Las ventas ___ un 15 %. (subir, pretérito)', 'aumentaron', ['descendieron', 'se mantuvieron', 'desaparecieron'], 'Aumentaron = subida.', { tag: 'datos' }),
      mc('El paro pasó ___ 12 % al 8 %.', 'del', ['en el', 'por el', 'sobre el'], 'Pasar de... a...', { tag: 'datos' }),
      fill('La cifra ___ entre 40 y 50. (oscilar, pretérito, ella)', 'osciló', 'Oscilar, ella: osciló.', { tag: 'datos' }),
      order('Según los datos la tendencia es positiva', 'Fuente + dato.', { tag: 'datos', alts: ['La tendencia es positiva según los datos'] }),
    ],
    quiz: [
      mc('«Descender» significa...', 'bajar o disminuir', ['subir o aumentar', 'mantenerse sin cambios', 'oscilar sin rumbo fijo'], 'Descender = bajar.', { tag: 'vocabulario' }),
      mc('«La mitad» equivale a...', '50 %', ['25 %', '75 %', '100 %'], 'Mitad = 50 %.', { tag: 'datos' }),
      mc('¿Qué verbo expresa estabilidad?', 'mantenerse', ['dispararse', 'desplomarse', 'crecer'], 'Mantenerse = no cambia.', { tag: 'datos' }),
      listen('El paro pasó del doce por ciento al ocho por ciento.', 'Escucha: ¿qué ocurre con el paro?', 'Baja', ['Sube', 'Se mantiene', 'Desaparece'], 'De 12 a 8: baja.', { tag: 'datos' }),
      dict('Según los datos, la tendencia es positiva.', 'Revisa las tildes de «según» y «tendencia» (esta no lleva).', { tag: 'dictado' }),
      mc('Un «gráfico» sirve para...', 'representar datos visualmente', ['firmar acuerdos con clientes', 'redactar cartas formales', 'saludar al público al empezar'], 'Gráfico = representación.', { tag: 'vocabulario' }),
      match([['el porcentaje', 'Cantidad por cada cien'], ['la tendencia', 'Dirección de la evolución'], ['aumentar', 'Hacerse más grande'], ['según los datos', 'Introduce una fuente']], 'Repasa el vocabulario de los datos.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'b2.u4.l3', level: 'B2', unit: 4, n: 3, title: 'Negociar y persuadir', topic: 'Negociación',
    goal: 'Al terminar esta lección, podrás negociar condiciones, hacer concesiones y persuadir con argumentos y cortesía.',
    vocab: [
      ['la concesión', 'sustantivo', 'Cosa a la que se renuncia para lograr un acuerdo.', 'Cada parte hizo una concesión.', 'Each side made a concession.'],
      ['llegar a un acuerdo', 'expresión', 'Ponerse de acuerdo tras negociar.', 'Por fin llegamos a un acuerdo.', 'We finally reached an agreement.'],
      ['la contraoferta', 'sustantivo', 'Propuesta que se hace en respuesta a otra oferta.', 'Presentaron una contraoferta del 10 %.', 'They submitted a 10% counteroffer.'],
      ['convencer', 'verbo', 'Lograr que alguien piense o haga algo mediante razones.', 'Me convenció con buenos argumentos.', 'He convinced me with good arguments.'],
      ['a cambio de', 'expresión', 'Como compensación por algo.', 'Te lo dejo a cambio de un favor.', 'I will let you have it in exchange for a favor.'],
      ['ceder', 'verbo', 'Renunciar a algo para lograr un acuerdo.', 'Ninguna de las partes quiso ceder.', 'Neither side wanted to give way.'],
    ],
    explain: { title: 'Condiciones, concesiones y persuasión', body: [
      'Negociar es <b>buscar un acuerdo útil para ambas partes</b>. Se combinan firmeza y cortesía: pedir claro, escuchar, ceder en lo secundario y mantener lo esencial.',
      { t: 'table', head: ['Función', 'Fórmulas'], rows: [['Proponer', 'Lo que proponemos es... / Estaríamos dispuestos a...'], ['Condicionar', 'Aceptaríamos siempre que + subjuntivo / a condición de que + subjuntivo / en caso de que + subjuntivo'], ['Ceder', 'Podríamos flexibilizar... / Estamos dispuestos a ceder en... / A cambio de...'], ['Rechazar', 'Me temo que eso no nos es posible. / No podemos aceptar esas condiciones.'], ['Contraofertar', 'Lo que podemos ofrecer es... / Nuestra contraoferta es...'], ['Cerrar', 'Entonces, ¿quedamos así? / Estamos de acuerdo. / Trato hecho.']] },
      '<b>Condicionales de negociación:</b> «Si + presente, presente o futuro» (condición real): «Si firman hoy, les damos un 5 % de descuento». «Si + imperfecto de subjuntivo, condicional» (hipótesis): «Si pudieran adelantar el pago, podríamos reducir el precio».',
      '<b>Persuadir:</b> apela a la razón (datos, ejemplos), a la relación (confianza, beneficio mutuo) y a la emoción con medida. Fórmulas: «Piense en lo que ganaría...», «Le propongo que lo pruebe durante un mes», «Seguro que usted también ve que...».',
      '<b>Gestionar el desacuerdo:</b> reformula lo que dice la otra parte («Si lo he entendido bien, ustedes quieren...»), identifica los puntos comunes y deja las cuestiones difíciles para el final.',
      { t: 'ex', list: ['Si firman hoy, les damos un cinco por ciento de descuento.', 'Aceptaríamos siempre que entreguen antes de mayo.', 'A cambio de un pago anticipado, ofrecemos un descuento.', 'Si lo he entendido bien, ustedes quieren un plazo más largo.'] },
    ] },
    listen: ['Si firman hoy, les damos un cinco por ciento de descuento.', 'Aceptaríamos siempre que entreguen antes de mayo.', 'Me temo que eso no nos es posible.', 'A cambio de un pago anticipado, ofrecemos un descuento.', 'Por fin llegamos a un acuerdo.'],
    practice: [
      mc('Aceptaríamos siempre que ___ antes de mayo. (entregar, ustedes)', 'entreguen', ['entregan', 'entregarán', 'entregaron'], 'Siempre que + subjuntivo = condición.', { tag: 'negociacion' }),
      mc('Si firman hoy, les ___ un descuento.', 'damos', ['diéramos', 'daríamos', 'dimos'], 'Si + presente → presente o futuro.', { tag: 'negociacion' }),
      fill('Si pudieran adelantar el pago, ___ reducir el precio. (poder, nosotros, condicional)', 'podríamos', 'Si + imperfecto de subjuntivo → condicional.', { tag: 'negociacion' }),
      order('Me temo que eso no nos es posible', 'Rechazo cortés.', { tag: 'negociacion' }),
    ],
    quiz: [
      mc('«Ceder» significa...', 'renunciar a algo para llegar a un acuerdo', ['ganar todo lo que se pide en la mesa', 'insistir hasta el final sin escuchar', 'abandonar la sala muy enfadado y callado'], 'Ceder = hacer concesiones.', { tag: 'vocabulario' }),
      mc('¿Qué frase es un rechazo cortés?', 'Me temo que eso no nos es posible.', ['No, de ninguna manera, ni hablar.', 'Eso es ridículo, no lo aceptamos.', 'Qué disparate, no pienso ceder nada.'], 'Me temo que suaviza el rechazo; las otras opciones son bruscas.', { tag: 'negociacion' }),
      mc('Una «contraoferta» es...', 'una propuesta en respuesta a otra', ['un contrato ya firmado por todos', 'un rechazo sin ofrecer nada a cambio', 'una despedida muy cordial al final'], 'Contraoferta = respuesta con otra oferta.', { tag: 'vocabulario' }),
      listen('A cambio de un pago anticipado, ofrecemos un descuento.', 'Escucha: ¿qué ofrecen?', 'Un descuento', ['Un pago anticipado', 'Un plazo más largo', 'Un regalo gratis'], 'Dice «ofrecemos un descuento».', { tag: 'negociacion' }),
      dict('Por fin llegamos a un acuerdo.', 'Revisa la «ll» de «llegamos».', { tag: 'dictado' }),
      mc('«Si lo he entendido bien...» sirve para...', 'reformular lo que dijo la otra parte', ['dar por terminada la reunión ya mismo', 'rechazar la oferta que se ha recibido', 'proponer otro asunto muy distinto al actual'], 'Reformular evita malentendidos.', { tag: 'negociacion' }),
      match([['la concesión', 'Renuncia para acordar'], ['la contraoferta', 'Respuesta a una oferta'], ['convencer', 'Persuadir con razones'], ['a cambio de', 'Como compensación']], 'Repasa el vocabulario de la negociación.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'echarse a': 'to burst out (laughing, crying)', 'no dejar de': 'to keep (doing); to not stop', 'venir a': 'to amount to; to come to (mean)', 'estar por': 'to be yet to; to be inclined to', 'acabar por': 'to end up (doing)',
    'tomar el pelo': 'to pull (someone\'s) leg', 'meter la pata': 'to put one\'s foot in it', 'costar un ojo de la cara': 'to cost an arm and a leg', 'estar en las nubes': 'to have one\'s head in the clouds', 'ponerse las pilas': 'to get one\'s act together', 'dar en el clavo': 'to hit the nail on the head',
    'tutear': 'to address as «tú»', 'coloquial': 'colloquial; informal', 'solemne': 'solemn; formal', 'campechano': 'easygoing; down-to-earth', 'el eufemismo': 'euphemism', 'cortante': 'curt; sharp',
    'el titular': 'headline', 'la crónica': 'chronicle; feature report', 'el editorial': 'editorial', 'la fuente': 'source; fountain', 'desmentir': 'to deny; to refute', 'el sesgo': 'bias; slant',
    'el narrador': 'narrator', 'la alusión': 'allusion; hint', 'el desenlace': 'outcome; ending', 'la metáfora': 'metaphor', 'evocar': 'to evoke; to call to mind', 'la prosa': 'prose',
    'el conector': 'connector; linking word', 'ahora bien': 'however; that said', 'de ahí que': 'hence; which is why', 'cabe señalar': 'it should be noted', 'a su vez': 'in turn; for its part', 'la coherencia': 'coherence; consistency'
  });

  C.addLesson({
    id: 'c1.u1.l1', level: 'C1', unit: 1, n: 1, title: 'Perífrasis y matices verbales', topic: 'Perífrasis verbales',
    goal: 'Al terminar esta lección, podrás matizar el inicio, la continuidad, el final y la aproximación de una acción con perífrasis verbales.',
    vocab: [
      ['echarse a', 'perífrasis', 'Empezar de repente una acción, casi siempre llorar, reír o correr.', 'Al oír la noticia, se echó a llorar.', 'On hearing the news, she burst into tears.'],
      ['no dejar de', 'perífrasis', 'Seguir haciendo algo con insistencia.', 'No deja de preguntar por ti.', 'He keeps asking about you.'],
      ['venir a', 'perífrasis', 'Expresar una equivalencia aproximada.', 'Esto viene a costar unos cien euros.', 'This comes to about a hundred euros.'],
      ['estar por', 'perífrasis', 'Indicar que una acción está pendiente de realizarse o que se tiene inclinación a realizarla.', 'El informe está por escribir.', 'The report is yet to be written.'],
      ['acabar por', 'perífrasis', 'Expresar el resultado final de un proceso.', 'Acabó por aceptar la oferta.', 'He ended up accepting the offer.', ['terminar por']],
    ],
    explain: { title: 'Perífrasis verbales: el matiz que cambia el sentido', body: [
      'Una <b>perífrasis verbal</b> une un verbo auxiliar con un infinitivo, un gerundio o un participio. El auxiliar pierde su significado literal y aporta un <b>matiz aspectual</b>: inicio, duración, repetición, final u obligación. En el nivel C1 se espera que elijas la perífrasis que mejor refleje tu intención.',
      { t: 'table', head: ['Matiz', 'Perífrasis', 'Ejemplo'], rows: [['Inicio', 'ponerse a / echarse a / romper a + inf.', 'Se echó a reír.'], ['Continuidad', 'seguir / continuar / ir / andar + gerundio; no dejar de + inf.', 'Sigue trabajando.'], ['Repetición', 'volver a + inf.', 'Volvió a llamar.'], ['Final', 'terminar de / dejar de / acabar por + inf.', 'Acabó por rendirse.'], ['Aproximación', 'venir a + inf.', 'Viene a ser lo mismo.'], ['Obligación', 'tener que / haber de / deber + inf.', 'Has de saberlo.'], ['Probabilidad', 'deber de + inf.','Deben de ser las diez.']] },
      '<b>Deber</b> frente a <b>deber de</b>: «Debes estudiar» expresa obligación; «Debe de estar enfermo» expresa suposición. En el uso actual muchos hablantes dicen «debe estar enfermo», pero en un texto cuidado conviene distinguirlos.',
      '<b>Llevar + gerundio</b> y <b>llevar + participio</b> no significan lo mismo: «Llevo tres horas esperando» (duración) frente a «Llevo escritas tres páginas» (resultado acumulado).',
      '<b>Estar por + infinitivo</b> expresa algo pendiente («La cena está por hacer») o una inclinación («Estoy por quedarme»). <b>Acabar por</b> y <b>terminar por</b> señalan el desenlace de un proceso largo: «Tantas dudas acabaron por agotarlo».',
      { t: 'ex', list: ['Al ver el regalo, se echó a llorar.', 'No deja de quejarse del ruido.', 'Esto viene a costar unos cien euros.', 'Acabó por aceptar la oferta.', 'Deben de ser las diez.'] },
    ] },
    listen: ['Al ver el regalo, se echó a llorar.', 'No deja de quejarse del ruido.', 'Esto viene a costar unos cien euros.', 'Tanta insistencia acabó por convencerme.', 'El informe todavía está por escribir.'],
    practice: [
      mc('Al oír la noticia, ___ a llorar.', 'se echó', ['se dejó', 'se vino', 'se estuvo'], 'Echarse a + infinitivo expresa un inicio repentino.', { tag: 'perífrasis' }),
      mc('«Debe de estar enfermo» expresa...', 'una suposición', ['una obligación', 'un deseo', 'una prohibición'], 'Deber de + infinitivo = probabilidad.', { tag: 'perífrasis' }),
      fill('Tantas dudas ___ por agotarlo. (acabar, pretérito indefinido, ellas)', 'acabaron', 'Acabar por + infinitivo, en pretérito indefinido.', { tag: 'perífrasis' }),
      order('Esto viene a costar unos cien euros', 'Venir a + infinitivo indica una cantidad aproximada.', { tag: 'perífrasis' }),
    ],
    quiz: [
      mc('¿Qué frase expresa un resultado acumulado?', 'Llevo escritas tres páginas.', ['Llevo tres horas escribiendo.', 'Sigo escribiendo.', 'Estoy por escribir.'], 'Llevar + participio expresa resultado acumulado.', { tag: 'perífrasis' }),
      mc('«El informe está por escribir» significa que...', 'todavía no se ha escrito', ['ya está terminado', 'se escribe a diario', 'alguien lo ha corregido'], 'Estar por + infinitivo = acción pendiente.', { tag: 'perífrasis' }),
      fill('No ___ de quejarse del ruido. (dejar, presente, él)', 'deja', 'No dejar de + infinitivo: insistencia.', { tag: 'perífrasis' }),
      listen('Tanta insistencia acabó por convencerme.', 'Escucha: ¿cuál fue el resultado?', 'Al final quedó convencido', ['Se negó a escuchar', 'Dejó de insistir', 'Se echó a reír'], 'Acabó por convencerme = resultado final.', { tag: 'perífrasis' }),
      dict('Al ver el regalo, se echó a llorar.', 'Revisa la tilde de «echó».', { tag: 'dictado' }),
      mc('La perífrasis que expresa aproximación es...', 'venir a + infinitivo', ['echarse a + infinitivo', 'acabar de + infinitivo', 'volver a + infinitivo'], 'Viene a ser = es, más o menos.', { tag: 'perífrasis' }),
      match([['echarse a', 'Inicio repentino'], ['no dejar de', 'Insistencia'], ['venir a', 'Equivalencia aproximada'], ['acabar por', 'Resultado final']], 'Repasa las perífrasis de la lección.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u1.l2', level: 'C1', unit: 1, n: 2, title: 'Expresiones idiomáticas', topic: 'Modismos',
    goal: 'Al terminar esta lección, podrás comprender y usar con naturalidad modismos frecuentes del español.',
    vocab: [
      ['tomar el pelo', 'modismo', 'Engañar a alguien en broma o burlarse de él.', 'No me tomes el pelo, ¿de verdad te han dado el puesto?', 'Don\'t pull my leg, did they really give you the job?'],
      ['meter la pata', 'modismo', 'Cometer un error o decir algo inoportuno.', 'Metí la pata al preguntarle por su ex.', 'I put my foot in it by asking about his ex.'],
      ['costar un ojo de la cara', 'modismo', 'Ser carísimo.', 'Ese reloj cuesta un ojo de la cara.', 'That watch costs an arm and a leg.'],
      ['estar en las nubes', 'modismo', 'Estar distraído, sin atender a lo que ocurre.', 'Perdona, estaba en las nubes.', 'Sorry, I had my head in the clouds.'],
      ['ponerse las pilas', 'modismo', 'Reaccionar y esforzarse más.', 'Tienes que ponerte las pilas si quieres aprobar.', 'You need to get your act together if you want to pass.'],
      ['dar en el clavo', 'modismo', 'Acertar plenamente.', 'Con ese diagnóstico diste en el clavo.', 'With that diagnosis you hit the nail on the head.'],
    ],
    explain: { title: 'Modismos: significado figurado, forma fija', body: [
      'Un <b>modismo</b> (o expresión idiomática) es una combinación fija de palabras cuyo significado <b>no se deduce</b> de sus componentes. No se pueden traducir literalmente ni cambiar sus elementos: no decimos «meter la mano» por «meter la pata».',
      { t: 'table', head: ['Modismo', 'Significado', 'Registro'], rows: [['tomar el pelo', 'burlarse / engañar en broma', 'coloquial'], ['meter la pata', 'cometer un error', 'coloquial'], ['costar un ojo de la cara', 'ser muy caro', 'coloquial'], ['estar en las nubes', 'estar distraído', 'neutro-coloquial'], ['ponerse las pilas', 'esforzarse más', 'coloquial'], ['dar en el clavo', 'acertar', 'neutro']] },
      '<b>Se conjugan:</b> el verbo cambia, pero el resto de la expresión se mantiene. «Metió la pata», «Estoy metiendo la pata», «No metas la pata». Con «tomar el pelo» el pronombre indirecto aparece: «Me estás tomando el pelo».',
      '<b>Registro:</b> la mayoría de los modismos pertenecen al lenguaje oral y coloquial. En un informe o un ensayo conviene sustituirlos: «metió la pata» por «cometió un error»; «dio en el clavo» por «acertó».',
      '<b>Variación geográfica:</b> «ponerse las pilas» es muy habitual en México y en otros países de América, y también se oye en España, donde son frecuentes alternativas como «espabilarse». Un modismo muy local puede no entenderse en otras regiones.',
      { t: 'ex', list: ['No me tomes el pelo.', 'Metí la pata sin querer.', 'Ese coche cuesta un ojo de la cara.', 'Estás en las nubes desde esta mañana.', 'Con esa respuesta diste en el clavo.'] },
    ] },
    listen: ['No me tomes el pelo, por favor.', 'Metí la pata sin querer.', 'Ese coche cuesta un ojo de la cara.', 'Perdona, estaba en las nubes.', 'Si quieres aprobar, tienes que ponerte las pilas.'],
    practice: [
      mc('«Ese bolso cuesta un ojo de la cara» significa que es...', 'muy caro', ['muy feo', 'muy pesado', 'muy pequeño'], 'Costar un ojo de la cara = ser carísimo.', { tag: 'modismos' }),
      mc('¿Qué modismo significa «acertar»?', 'dar en el clavo', ['meter la pata', 'tomar el pelo', 'estar en las nubes'], 'Dar en el clavo = acertar plenamente.', { tag: 'modismos' }),
      fill('Perdona, no te he oído; estaba ___ las nubes.', 'en', 'Estar en las nubes.', { tag: 'modismos' }),
      order('Si quieres aprobar tienes que ponerte las pilas', 'Ponerse las pilas = esforzarse más.', { tag: 'modismos' }),
    ],
    quiz: [
      mc('«Me estás tomando el pelo» significa...', 'Te estás burlando de mí', ['Me estás peinando', 'Me estás ayudando', 'Me estás regalando algo'], 'Tomar el pelo = burlarse o engañar en broma.', { tag: 'modismos' }),
      mc('En un informe formal, «metió la pata» se sustituye mejor por...', 'cometió un error', ['se equivocó de pie', 'dio en el clavo', 'se puso las pilas'], 'Registro neutro: cometió un error.', { tag: 'modismos' }),
      fill('Con ese comentario ___ la pata. (meter, pretérito indefinido, tú)', 'metiste', 'Meter, indefinido, tú: metiste.', { tag: 'modismos' }),
      listen('Si quieres aprobar, tienes que ponerte las pilas.', 'Escucha: ¿qué le recomiendan?', 'Esforzarse más', ['Cambiar las pilas', 'Descansar', 'Abandonar el curso'], 'Ponerse las pilas = esforzarse.', { tag: 'modismos' }),
      dict('Ese coche cuesta un ojo de la cara.', 'Revisa la «j» de «ojo».', { tag: 'dictado' }),
      mc('Un modismo se caracteriza por...', 'tener un significado figurado y una forma fija', ['poder traducirse palabra por palabra sin cambiar el sentido', 'usarse únicamente en textos escritos formales', 'no admitir ninguna conjugación del verbo'], 'Su sentido no se deduce de las palabras.', { tag: 'modismos' }),
      match([['tomar el pelo', 'Burlarse en broma'], ['meter la pata', 'Cometer un error'], ['estar en las nubes', 'Estar distraído'], ['dar en el clavo', 'Acertar']], 'Repasa los modismos de la lección.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u1.l3', level: 'C1', unit: 1, n: 3, title: 'Registro y tono', topic: 'Registro lingüístico',
    goal: 'Al terminar esta lección, podrás adaptar el registro y el tono de un mensaje a la situación y al interlocutor.',
    vocab: [
      ['tutear', 'verbo', 'Tratar a alguien de «tú».', 'Mi jefe me pidió que lo tuteara.', 'My boss asked me to address him as «tú».'],
      ['coloquial', 'adjetivo', 'Propio de la conversación informal.', '«Chaval» es una palabra coloquial.', '«Chaval» is a colloquial word.'],
      ['solemne', 'adjetivo', 'Formal y con gran dignidad, propio de actos importantes.', 'El presidente pronunció un discurso solemne.', 'The president gave a solemn speech.'],
      ['campechano', 'adjetivo', 'Sencillo, cercano y sin formalidades.', 'Es un ministro muy campechano.', 'He is a very down-to-earth minister.'],
      ['el eufemismo', 'sustantivo', 'Palabra suave que sustituye a otra considerada dura.', '«Pasar a mejor vida» es un eufemismo de «morir».', '«Pasar a mejor vida» is a euphemism for «to die».'],
      ['cortante', 'adjetivo', 'Seco y poco amable al hablar.', 'Su respuesta fue tan cortante que nadie preguntó más.', 'His answer was so curt that nobody asked more.', ['seco']],
    ],
    explain: { title: 'Registro y tono: cómo se dice lo que se dice', body: [
      'El <b>registro</b> es la variedad de lengua que elegimos según la situación (formal, neutro, coloquial). El <b>tono</b> es la actitud que transmite el mensaje (amable, irónico, cortante, solemne). Dos frases pueden informar de lo mismo y producir un efecto muy distinto.',
      { t: 'table', head: ['Registro', 'Rasgos', 'Ejemplo'], rows: [['Formal', 'usted, léxico culto, frases largas, subjuntivo cortés', 'Le ruego que disculpe el retraso.'], ['Neutro', 'tú o usted, léxico general', 'Perdona el retraso.'], ['Coloquial', 'tú, muletillas, exclamaciones, elipsis', 'Perdona, ¡es que se me han pegado las sábanas!'], ['Vulgar', 'palabrotas, incorrecciones', 'Evítalo en contextos profesionales.']] },
      '<b>Tuteo y ustedeo:</b> en España se tutea cada vez más en el trabajo y entre jóvenes; en Colombia o Costa Rica existe incluso el «ustedeo» entre familiares. Ante la duda, empieza con «usted» y deja que el interlocutor proponga: «¿Podemos tutearnos?».',
      '<b>Mitigar y atenuar:</b> los eufemismos y los atenuantes suavizan: «Creo que quizá habría que revisar el plan» frente al directo «El plan está mal». Con el condicional, el imperfecto o fórmulas como «me temo que» sonarás más diplomático.',
      '<b>Tono y puntuación:</b> por escrito, las exclamaciones, los puntos suspensivos y los adverbios intensificadores (francamente, sencillamente) modifican el tono. Un correo con frases muy breves puede parecer <b>cortante</b> aunque no lo pretendas.',
      { t: 'ex', list: ['Le ruego que disculpe el retraso.', '¿Podemos tutearnos?', 'Me temo que habría que revisar el plan.', 'Fue un acto solemne, pero el ambiente era campechano.'] },
    ] },
    listen: ['Le ruego que disculpe el retraso.', '¿Podemos tutearnos, si no le importa?', 'Me temo que habría que revisar el plan.', 'Pasar a mejor vida es un eufemismo de morir.', 'Su respuesta fue tan cortante que nadie preguntó más.'],
    practice: [
      mc('¿Qué frase pertenece al registro formal?', 'Le ruego que disculpe el retraso.', ['Perdona, que llego tardísimo.', 'Siento llegar tarde, tío.', 'Uy, se me pasó la hora.'], 'Le ruego que + subjuntivo = formal.', { tag: 'registro' }),
      mc('«Pasar a mejor vida» es...', 'un eufemismo', ['un insulto', 'un refrán', 'una pregunta'], 'Suaviza la palabra «morir».', { tag: 'registro' }),
      fill('¿Podemos ___? (tratarnos de tú)', 'tutearnos', 'Tutear + nos.', { tag: 'registro' }),
      order('Me temo que habría que revisar el plan', 'Fórmula de atenuación diplomática.', { tag: 'registro' }),
    ],
    quiz: [
      mc('Un tono «cortante» es...', 'seco y poco amable', ['muy cariñoso', 'muy solemne', 'irónico y divertido'], 'Cortante = seco.', { tag: 'registro' }),
      mc('Para suavizar una crítica en una reunión dirías...', 'Quizá habría que revisar este punto.', ['Esto está fatal, hay que cambiarlo todo.', 'Eso no vale nada, rehazlo cuanto antes.', 'Nadie va a entender este apartado.'], 'El condicional y «quizá» atenúan.', { tag: 'registro' }),
      mc('Un ministro «campechano» es...', 'cercano y sin formalidades', ['distante y frío con la gente', 'muy joven para el cargo', 'poco inteligente para el puesto'], 'Campechano = sencillo y cercano.', { tag: 'registro' }),
      listen('Me temo que habría que revisar el plan.', 'Escucha: ¿cómo es el tono?', 'Diplomático', ['Agresivo', 'Alegre', 'Indiferente'], 'Me temo que + condicional atenúa.', { tag: 'registro' }),
      dict('Pasar a mejor vida es un eufemismo.', 'Revisa la tilde de «eufemismo» (no lleva).', { tag: 'dictado' }),
      mc('Ante la duda sobre tutear o no a alguien, lo más prudente es...', 'empezar con «usted»', ['empezar tuteando a esa persona', 'no saludar hasta conocerla bien', 'usar «vos» con todo el mundo'], 'Se empieza con «usted» y se espera.', { tag: 'registro' }),
      match([['tutear', 'Tratar de «tú»'], ['coloquial', 'Propio de la conversación informal'], ['solemne', 'Formal y digno'], ['el eufemismo', 'Palabra suave por otra dura']], 'Repasa el vocabulario de registro.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u2.l1', level: 'C1', unit: 2, n: 1, title: 'Lectura de prensa', topic: 'Prensa',
    goal: 'Al terminar esta lección, podrás leer críticamente textos periodísticos y distinguir información, opinión y sesgo.',
    vocab: [
      ['el titular', 'sustantivo', 'Título destacado de una noticia.', 'El titular prometía más de lo que decía el artículo.', 'The headline promised more than the article said.'],
      ['la crónica', 'sustantivo', 'Texto periodístico que narra un hecho con estilo personal.', 'Leí una crónica del partido en el diario deportivo.', 'I read a match report in the sports daily.'],
      ['el editorial', 'sustantivo', 'Artículo sin firma que expresa la opinión del periódico.', 'El editorial critica la reforma.', 'The editorial criticizes the reform.'],
      ['la fuente', 'sustantivo', 'Persona o documento de donde procede una información.', 'El periodista citó fuentes oficiales.', 'The journalist cited official sources.'],
      ['desmentir', 'verbo', 'Negar públicamente que algo sea cierto.', 'El ministerio desmintió la noticia.', 'The ministry denied the story.'],
      ['el sesgo', 'sustantivo', 'Inclinación que desvía un enfoque de la objetividad.', 'La cobertura muestra un claro sesgo político.', 'The coverage shows a clear political bias.'],
    ],
    explain: { title: 'Cómo se lee la prensa', body: [
      'Un periódico mezcla <b>géneros informativos</b> (noticia, reportaje, crónica), <b>géneros de opinión</b> (editorial, columna, artículo de opinión) y <b>géneros mixtos</b> (entrevista, crítica). Reconocerlos evita confundir un hecho con un juicio.',
      { t: 'table', head: ['Género', 'Función', 'Rasgos'], rows: [['Noticia', 'informar', 'Estructura de pirámide invertida: lo esencial va primero.'], ['Crónica', 'narrar con estilo', 'Tiempo ordenado, voz personal del autor.'], ['Editorial', 'opinar', 'Sin firma; refleja la postura del medio.'], ['Columna', 'opinar', 'Firmada; tono subjetivo.'], ['Reportaje', 'profundizar', 'Datos, testimonios, contexto.']] },
      '<b>Lenguaje de la prensa:</b> condicional de rumor («El presidente <i>habría</i> dimitido», un uso muy extendido en prensa, pero que la RAE desaconseja por considerarlo un galicismo), pasivas reflejas («se dio a conocer el acuerdo»), nominalizaciones («la puesta en marcha», «el desmentido») y verbos de declaración variados: afirmar, señalar, subrayar, matizar, desmentir.',
      '<b>Atribución de fuentes:</b> «según fuentes cercanas», «de acuerdo con el informe», «a decir de los expertos». Una noticia sin fuentes identificables debe leerse con cautela.',
      '<b>Detectar el sesgo:</b> fíjate en el titular, en los adjetivos valorativos, en qué voces se citan y en cuáles faltan. «Polémica reforma» orienta al lector; «reforma aprobada por 180 votos» informa.',
      { t: 'ex', list: ['El titular prometía más de lo que decía el artículo.', 'Según fuentes oficiales, el acuerdo se firmará el lunes.', 'El ministerio desmintió la noticia.', 'El presidente habría dimitido, según el diario.'] },
    ] },
    listen: ['El titular prometía más de lo que decía el artículo.', 'Según fuentes oficiales, el acuerdo se firmará el lunes.', 'El ministerio desmintió la noticia esta mañana.', 'El editorial critica duramente la reforma.', 'El presidente habría dimitido, según el diario.'],
    practice: [
      mc('Un artículo sin firma que expresa la opinión del periódico es...', 'un editorial', ['una crónica', 'un titular', 'una noticia'], 'El editorial refleja la postura del medio.', { tag: 'prensa' }),
      mc('«El presidente habría dimitido» expresa...', 'una información no confirmada', ['una orden dada a sus ministros', 'un hecho completamente seguro', 'un deseo de la oposición'], 'El condicional de rumor señala información sin confirmar.', { tag: 'prensa' }),
      fill('El ministerio ___ la noticia. (desmentir, pretérito indefinido)', 'desmintió', 'Desmentir: e → i en la tercera persona.', { tag: 'prensa' }),
      order('Según fuentes oficiales el acuerdo se firmará el lunes', 'Atribución de la fuente al inicio.', { tag: 'prensa' }),
    ],
    quiz: [
      mc('En una noticia, la estructura de «pirámide invertida» coloca primero...', 'lo más importante', ['los detalles menores', 'la opinión del autor', 'la conclusión'], 'Lo esencial va al principio.', { tag: 'prensa' }),
      mc('«Sesgo» significa...', 'inclinación que resta objetividad', ['dato verificado por varias fuentes', 'título llamativo para atraer lectores', 'fuente oficial de la noticia'], 'Un sesgo desvía la objetividad.', { tag: 'prensa' }),
      mc('¿Qué titular es más neutro?', 'La reforma fue aprobada por 180 votos', ['La polémica reforma sale adelante', 'El golpe final a la clase media', 'Triunfo arrollador del Gobierno'], 'Evita adjetivos valorativos.', { tag: 'prensa' }),
      listen('El ministerio desmintió la noticia esta mañana.', 'Escucha: ¿qué hizo el ministerio?', 'Negó la noticia', ['Confirmó la noticia', 'Publicó un editorial', 'Cambió el titular'], 'Desmentir = negar públicamente.', { tag: 'prensa' }),
      dict('El titular prometía más de lo que decía.', 'Cuida la estructura «más de lo que».', { tag: 'dictado' }),
      mc('Una «columna» es un género...', 'de opinión, con firma', ['informativo, sin firma', 'publicitario', 'meteorológico'], 'La columna es personal y firmada.', { tag: 'prensa' }),
      match([['el titular', 'Título destacado'], ['la crónica', 'Relato con estilo personal'], ['la fuente', 'Origen de la información'], ['desmentir', 'Negar públicamente']], 'Repasa el vocabulario de prensa.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u2.l2', level: 'C1', unit: 2, n: 2, title: 'Textos literarios breves', topic: 'Literatura',
    goal: 'Al terminar esta lección, podrás analizar un texto literario breve: voz narrativa, recursos y sentido.',
    vocab: [
      ['el narrador', 'sustantivo', 'Voz que cuenta la historia en un texto.', 'El narrador cuenta los hechos en primera persona.', 'The narrator tells the events in the first person.'],
      ['la alusión', 'sustantivo', 'Referencia indirecta a algo o a alguien.', 'El poema contiene una alusión a Cervantes.', 'The poem contains an allusion to Cervantes.'],
      ['el desenlace', 'sustantivo', 'Parte final de una historia en que se resuelve el conflicto.', 'El desenlace del cuento sorprendió a todos.', 'The ending of the story surprised everyone.'],
      ['la metáfora', 'sustantivo', 'Figura que identifica una cosa con otra por semejanza.', '«Tus ojos son dos luceros» es una metáfora.', '«Your eyes are two bright stars» is a metaphor.'],
      ['evocar', 'verbo', 'Traer a la memoria o a la imaginación.', 'El olor a pan evoca mi infancia.', 'The smell of bread evokes my childhood.'],
      ['la prosa', 'sustantivo', 'Forma de escribir sin verso.', 'Su prosa es sobria y precisa.', 'His prose is sober and precise.'],
    ],
    explain: { title: 'Leer un texto literario', body: [
      'Un texto literario no solo cuenta algo: <b>cuenta cómo se cuenta</b>. Para analizarlo, observa quién habla, qué recursos usa el autor y qué efecto producen.',
      { t: 'table', head: ['Aspecto', 'Pregunta', 'Ejemplo'], rows: [['Narrador', '¿Quién cuenta? ¿Con qué punto de vista?', 'Primera persona; tercera omnisciente'], ['Tiempo', '¿Cómo se organiza la cronología?', 'Analepsis (retroceso), prolepsis (anticipo)'], ['Recursos', '¿Qué figuras retóricas hay?', 'metáfora, comparación, hipérbole, personificación'], ['Tono', '¿Qué actitud transmite?', 'nostálgico, irónico, lírico'], ['Tema', '¿De qué trata en el fondo?', 'la memoria, la pérdida, la identidad']] },
      '<b>Pretérito imperfecto y pretérito indefinido en la narración:</b> el imperfecto describe el escenario y las acciones de fondo («Llovía y la calle estaba vacía»); el indefinido hace avanzar la trama («De pronto sonó el teléfono»). El <b>presente histórico</b> acerca el pasado al lector.',
      '<b>Figuras frecuentes:</b> la <b>metáfora</b> identifica («Su sonrisa es un amanecer»); la <b>comparación</b> usa «como» («rápido como el viento»); la <b>hipérbole</b> exagera («Te lo he dicho mil veces»); la <b>personificación</b> da rasgos humanos («El mar susurraba»).',
      '<b>Léxico para comentar:</b> «el autor evoca», «se percibe un tono», «el texto sugiere», «cabe interpretar que». Evita el simple resumen: explica el efecto de cada recurso.',
      { t: 'ex', list: ['El narrador cuenta los hechos en primera persona.', 'Llovía y la calle estaba vacía cuando sonó el teléfono.', 'El olor a pan evoca su infancia.', 'La metáfora sugiere que la vida es un viaje.'] },
    ] },
    listen: ['El narrador cuenta los hechos en primera persona.', 'Llovía y la calle estaba vacía cuando sonó el teléfono.', 'El olor a pan evoca mi infancia.', 'El desenlace del cuento sorprendió a todos.', 'Su prosa es sobria y precisa.'],
    practice: [
      mc('«Tus ojos son dos luceros» es...', 'una metáfora', ['una comparación', 'un desenlace', 'una alusión histórica'], 'No usa «como»: identifica directamente.', { tag: 'literatura' }),
      mc('En una narración, el pretérito imperfecto suele...', 'describir el escenario', ['hacer avanzar la trama', 'expresar órdenes', 'anunciar el futuro'], 'El imperfecto describe el fondo.', { tag: 'literatura' }),
      fill('El olor a pan ___ mi infancia. (evocar, presente)', 'evoca', 'Evocar, presente, él: evoca.', { tag: 'literatura' }),
      order('El narrador cuenta los hechos en primera persona', 'Punto de vista del narrador.', { tag: 'literatura' }),
    ],
    quiz: [
      mc('«Rápido como el viento» es...', 'una comparación', ['una metáfora', 'una personificación', 'un desenlace'], 'Usa «como».', { tag: 'literatura' }),
      mc('El «desenlace» es...', 'la parte en que se resuelve el conflicto', ['el principio de la historia contada', 'el título que encabeza el texto', 'una figura retórica del lenguaje'], 'Desenlace = final.', { tag: 'literatura' }),
      mc('«El mar susurraba» es un ejemplo de...', 'personificación', ['hipérbole de la naturaleza marina', 'comparación con un animal', 'alusión a un libro conocido'], 'Da rasgos humanos al mar.', { tag: 'literatura' }),
      listen('Su prosa es sobria y precisa.', 'Escucha: ¿qué se elogia?', 'El estilo de escritura', ['El argumento', 'La portada', 'El precio'], 'Prosa = manera de escribir.', { tag: 'literatura' }),
      dict('El desenlace del cuento sorprendió a todos.', 'Revisa la tilde de «desenlace» (no lleva).', { tag: 'dictado' }),
      mc('«Te lo he dicho mil veces» es una...', 'hipérbole', ['metáfora', 'personificación', 'alusión'], 'Exagera para enfatizar.', { tag: 'literatura' }),
      match([['el narrador', 'Voz que cuenta'], ['la alusión', 'Referencia indirecta'], ['evocar', 'Traer a la memoria'], ['la prosa', 'Escritura sin verso']], 'Repasa el vocabulario literario.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u2.l3', level: 'C1', unit: 2, n: 3, title: 'Cohesión y coherencia', topic: 'Conectores y estructura',
    goal: 'Al terminar esta lección, podrás ordenar las ideas de un texto y enlazarlas con conectores y mecanismos de cohesión.',
    vocab: [
      ['el conector', 'sustantivo', 'Palabra o expresión que une ideas o frases.', '«Sin embargo» es un conector de contraste.', '«Sin embargo» is a contrast connector.'],
      ['ahora bien', 'expresión', 'Introduce una matización o una objeción a lo anterior.', 'El plan es ambicioso; ahora bien, falta financiación.', 'The plan is ambitious; that said, funding is lacking.'],
      ['de ahí que', 'expresión', 'Introduce una consecuencia y exige subjuntivo.', 'Los precios subieron, de ahí que haya menos ventas.', 'Prices rose, hence sales are lower.'],
      ['cabe señalar', 'expresión', 'Fórmula para introducir un dato relevante.', 'Cabe señalar que los datos son provisionales.', 'It should be noted that the data are provisional.'],
      ['a su vez', 'expresión', 'Indica que algo ocurre por su parte, como efecto o complemento de lo anterior.', 'El paro creció y, a su vez, cayó el consumo.', 'Unemployment grew and, in turn, consumption fell.'],
      ['la coherencia', 'sustantivo', 'Relación lógica entre las ideas de un texto.', 'El texto carece de coherencia.', 'The text lacks coherence.'],
    ],
    explain: { title: 'Un texto bien tejido', body: [
      'La <b>coherencia</b> es la lógica global del texto: un tema, un orden y ninguna contradicción. La <b>cohesión</b> es la trama lingüística que une las frases: conectores, pronombres, sinónimos y signos de puntuación. Un texto puede ser cohesionado pero incoherente si enlaza ideas sin sentido.',
      { t: 'table', head: ['Función', 'Conectores'], rows: [['Adición', 'además, asimismo, a su vez, incluso'], ['Contraste', 'sin embargo, ahora bien, en cambio, no obstante'], ['Causa', 'puesto que, dado que, ya que, debido a'], ['Consecuencia', 'por lo tanto, de ahí que + subjuntivo, así pues'], ['Ejemplo', 'por ejemplo, a saber, en concreto'], ['Orden', 'en primer lugar, a continuación, por último'], ['Conclusión', 'en definitiva, en suma, a modo de resumen']] },
      '<b>De ahí que + subjuntivo</b>, a diferencia de «por lo tanto» (indicativo): «Es muy caro, por lo tanto no lo compro» frente a «Es muy caro, de ahí que no lo compre».',
      '<b>Mecanismos de cohesión:</b> la <b>sustitución léxica</b> (el presidente → el mandatario → el político), los <b>pronombres</b> («lo anterior», «esto»), la <b>elipsis</b> y la <b>progresión temática</b>: cada frase parte de lo conocido para aportar algo nuevo.',
      '<b>Evita la repetición</b> con sinónimos e hiperónimos, pero no abuses de los conectores: poner uno en cada frase resulta artificial. Fíjate también en la <b>puntuación</b>: el punto y coma separa ideas relacionadas; los dos puntos introducen una explicación.',
      { t: 'ex', list: ['El plan es ambicioso; ahora bien, falta financiación.', 'Cabe señalar que los datos son provisionales.', 'Los precios subieron, de ahí que haya menos ventas.', 'En definitiva, la propuesta es viable.'] },
    ] },
    listen: ['El plan es ambicioso; ahora bien, falta financiación.', 'Cabe señalar que los datos son provisionales.', 'Los precios subieron, de ahí que haya menos ventas.', 'El paro creció y, a su vez, cayó el consumo.', 'En definitiva, la propuesta es viable.'],
    practice: [
      mc('Los precios subieron; de ahí que las ventas ___.', 'bajen', ['bajan', 'bajarán', 'bajaron'], 'De ahí que + subjuntivo.', { tag: 'cohesión' }),
      mc('¿Qué conector introduce un contraste?', 'ahora bien', ['por ejemplo', 'además', 'puesto que'], 'Ahora bien introduce una objeción.', { tag: 'cohesión' }),
      fill('___ señalar que los datos son provisionales. (Caber, presente)', 'Cabe', 'Caber, presente: cabe.', { tag: 'cohesión' }),
      order('En definitiva la propuesta es viable', 'Conector de conclusión.', { tag: 'cohesión' }),
    ],
    quiz: [
      mc('La coherencia de un texto es...', 'la lógica entre sus ideas', ['el número de conectores', 'la longitud de las frases', 'el uso de sinónimos'], 'Coherencia = lógica global.', { tag: 'cohesión' }),
      mc('«Por lo tanto» se construye con...', 'indicativo', ['siempre subjuntivo', 'infinitivo', 'gerundio'], 'Por lo tanto + indicativo; de ahí que + subjuntivo.', { tag: 'cohesión' }),
      mc('¿Cuál NO es un conector de causa?', 'sin embargo', ['puesto que', 'dado que', 'ya que'], 'Sin embargo expresa contraste.', { tag: 'cohesión' }),
      listen('El paro creció y, a su vez, cayó el consumo.', 'Escucha: ¿qué cayó?', 'El consumo', ['El paro', 'Los precios', 'Las ventas del año pasado'], 'Dice «cayó el consumo».', { tag: 'cohesión' }),
      dict('Cabe señalar que los datos son provisionales.', 'Revisa la tilde de «señalar» (no lleva) y la «ñ».', { tag: 'dictado' }),
      mc('Sustituir «el presidente» por «el mandatario» es un recurso de...', 'sustitución léxica', ['elipsis del sujeto en la oración', 'signo de puntuación enfático', 'contraste entre dos ideas'], 'Se evita repetir con un sinónimo.', { tag: 'cohesión' }),
      match([['el conector', 'Une ideas'], ['ahora bien', 'Introduce una matización'], ['de ahí que', 'Consecuencia con subjuntivo'], ['la coherencia', 'Lógica del texto']], 'Repasa el vocabulario de cohesión.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'la idea rectora': 'guiding idea; central thesis', 'esgrimir': 'to put forward (an argument); to wield', 'corroborar': 'to corroborate; to confirm', 'el planteamiento': 'approach; framing of an issue', 'a modo de conclusión': 'by way of conclusion', 'la premisa': 'premise',
    'los hallazgos': 'findings', 'el apartado': 'section; subsection', 'recopilar': 'to gather; to compile', 'el plazo': 'deadline; time limit', 'la viabilidad': 'feasibility', 'se desprende que': 'it follows that; it can be inferred that',
    'la reseña': 'review (of a book, film)', 'la trama': 'plot', 'el reparto': 'cast', 'adolecer de': 'to suffer from; to be flawed by', 'la puesta en escena': 'staging; production', 'logrado': 'successful; well executed',
    'desmontar': 'to dismantle (an argument)', 'la falacia': 'fallacy', 'puntualizar': 'to clarify; to specify', 'cuestionar': 'to question; to challenge', 'la objeción': 'objection', 'por otra parte': 'on the other hand; moreover',
    'la tertulia': 'talk show; discussion group', 'el moderador': 'moderator; chair', 'el turno de palabra': 'turn to speak', 'interrumpir': 'to interrupt', 'disentir': 'to dissent; to disagree', 'ceder la palabra': 'to give the floor',
    'el orador': 'speaker; orator', 'el auditorio': 'audience; auditorium', 'la entonación': 'intonation', 'la pausa': 'pause', 'captar la atención': 'to capture attention', 'el discurso': 'speech; discourse'
  });

  C.addLesson({
    id: 'c1.u3.l1', level: 'C1', unit: 3, n: 1, title: 'El ensayo académico', topic: 'Escritura académica',
    goal: 'Al terminar esta lección, podrás estructurar un ensayo académico con tesis, argumentos y conclusión, usando un estilo impersonal y riguroso.',
    vocab: [
      ['la idea rectora', 'expresión', 'Idea principal que da unidad a todo un texto.', 'La idea rectora del ensayo es que la lectura mejora el pensamiento crítico.', 'The guiding idea of the essay is that reading improves critical thinking.'],
      ['esgrimir', 'verbo', 'Usar un argumento para defender una postura.', 'La autora esgrimió tres argumentos de peso.', 'The author put forward three weighty arguments.', ['alegar']],
      ['corroborar', 'verbo', 'Confirmar una idea con datos o pruebas.', 'Los resultados corroboran la hipótesis inicial.', 'The results corroborate the initial hypothesis.', ['confirmar']],
      ['el planteamiento', 'sustantivo', 'Modo de presentar un problema o una cuestión.', 'El planteamiento del problema es muy claro.', 'The way the problem is set out is very clear.'],
      ['a modo de conclusión', 'expresión', 'Fórmula para introducir el cierre de un texto.', 'A modo de conclusión, conviene recordar los límites del estudio.', 'By way of conclusion, the limits of the study should be remembered.'],
      ['la premisa', 'sustantivo', 'Idea de partida de la que se deduce una conclusión.', 'Toda la argumentación parte de una premisa discutible.', 'The whole argument starts from a debatable premise.'],
    ],
    explain: { title: 'Cómo se construye un ensayo académico', body: [
      'El <b>ensayo académico</b> defiende una <b>tesis</b> con argumentos organizados y fuentes fiables. Su estructura habitual es: <b>introducción</b> (contexto y tesis), <b>desarrollo</b> (argumentos y contraargumentos) y <b>conclusión</b> (síntesis y alcance). Cada párrafo desarrolla una sola idea.',
      { t: 'table', head: ['Parte', 'Función', 'Fórmulas útiles'], rows: [['Introducción', 'Presentar el tema y la tesis', 'Este trabajo analiza... / Se sostiene aquí que...'], ['Desarrollo', 'Argumentar con datos y citas', 'En primer lugar... / Asimismo... / Cabe matizar que...'], ['Contraste', 'Considerar otras posturas', 'Si bien es cierto que... / Frente a esta postura...'], ['Conclusión', 'Cerrar y valorar', 'A modo de conclusión... / En definitiva... / Todo ello permite afirmar que...']] },
      '<b>Estilo impersonal:</b> se prefieren la pasiva refleja y las formas sin sujeto personal. En lugar de «Yo pienso que», escribimos «Se considera que», «Cabe afirmar que», «Puede sostenerse que». La primera persona del plural de modestia («Veremos que...») es aceptable en muchos ámbitos.',
      '<b>Citar y atribuir:</b> «Según Vidal (2018), ...», «Como señala Martín (2015), ...». Los verbos de atribución matizan la postura del autor: <i>afirmar</i>, <i>sostener</i>, <i>apuntar</i>, <i>reconocer</i>, <i>negar</i>.',
      '<b>Evita</b> las generalizaciones vacías («Desde el principio de los tiempos...»), el registro coloquial y las valoraciones sin pruebas. Cada afirmación importante debe apoyarse en un dato, una cita o un razonamiento.',
      { t: 'ex', list: ['Este trabajo analiza el impacto de las redes sociales en los jóvenes.', 'Se sostiene aquí que la educación es un derecho irrenunciable.', 'Si bien es cierto que el estudio es limitado, sus resultados son relevantes.', 'A modo de conclusión, conviene replantear el modelo actual.'] },
    ] },
    listen: ['Este trabajo analiza el impacto de las redes sociales.', 'La autora sostiene que el cambio es inevitable.', 'Los resultados corroboran la hipótesis inicial.', 'Si bien es cierto que el estudio es limitado, sus resultados son relevantes.', 'A modo de conclusión, conviene replantear el modelo actual.'],
    practice: [
      mc('¿Qué fórmula es más adecuada en un ensayo académico?', 'Se considera que el problema es estructural.', ['Yo creo que el problema es gordo.', 'La verdad es que el problema es un rollo.', 'Pues mira, el problema es grave.'], 'El estilo académico es impersonal y formal.', { tag: 'ensayo' }),
      mc('La «tesis» de un ensayo es...', 'la idea principal que se defiende', ['la lista de fuentes consultadas', 'el título que lleva el texto', 'el resumen final de las ideas'], 'La tesis es lo que el autor defiende.', { tag: 'ensayo' }),
      fill('A modo de ___, conviene replantear el modelo. (expresión de la lección)', ['conclusión', 'cierre', 'resumen'], 'A modo de conclusión: fórmula para introducir el cierre.', { tag: 'ensayo' }),
      order('Se sostiene aquí que la educación es un derecho', 'Fórmula impersonal con «se» + sostener.', { tag: 'ensayo' }),
    ],
    quiz: [
      mc('El orden habitual de un ensayo es...', 'introducción, desarrollo y conclusión', ['conclusión, tesis y lista de fuentes', 'desarrollo, saludo y despedida formal', 'título, anécdota y chiste final'], 'Introducción, desarrollo y conclusión.', { tag: 'ensayo' }),
      mc('«Corroborar» significa...', 'confirmar con pruebas', ['negar con rotundidad', 'resumir un texto', 'citar a un autor'], 'Corroborar = confirmar con datos.', { tag: 'vocabulario' }),
      mc('¿Qué verbo introduce la postura de un autor con matiz de defensa?', 'sostener', ['olvidar', 'tropezar', 'preparar'], 'Sostener = defender una opinión.', { tag: 'ensayo' }),
      listen('La autora sostiene que el cambio es inevitable.', 'Escucha: ¿qué defiende la autora?', 'Que el cambio es inevitable', ['Que el cambio es imposible', 'Que nada cambia', 'Que el cambio es reciente'], 'Dice «sostiene que el cambio es inevitable».', { tag: 'ensayo' }),
      dict('Los resultados corroboran la hipótesis inicial.', 'Revisa la doble «rr» de «corroboran» y la tilde de «hipótesis».', { tag: 'dictado' }),
      mc('La «premisa» es...', 'la idea de partida de un razonamiento', ['la última frase de todo el texto', 'una cita textual de un autor', 'un error de ortografía frecuente'], 'La premisa es el punto de partida.', { tag: 'vocabulario' }),
      match([['la idea rectora', 'Da unidad al texto'], ['esgrimir', 'Usar un argumento'], ['corroborar', 'Confirmar con pruebas'], ['la premisa', 'Idea de partida']], 'Repasa el vocabulario del ensayo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u3.l2', level: 'C1', unit: 3, n: 2, title: 'El informe profesional', topic: 'Escritura profesional',
    goal: 'Al terminar esta lección, podrás redactar un informe profesional claro, con apartados, datos, conclusiones y recomendaciones.',
    vocab: [
      ['los hallazgos', 'sustantivo', 'Resultados importantes que se descubren en una investigación.', 'Los hallazgos del estudio son preocupantes.', 'The findings of the study are worrying.', ['los resultados']],
      ['el apartado', 'sustantivo', 'Cada una de las partes en que se divide un texto.', 'En el siguiente apartado se explican los costes.', 'The costs are explained in the next section.'],
      ['recopilar', 'verbo', 'Reunir datos o documentos sobre un tema.', 'Hemos recopilado datos de cincuenta empresas.', 'We have gathered data from fifty companies.'],
      ['el plazo', 'sustantivo', 'Tiempo máximo para hacer algo.', 'El plazo de entrega termina el viernes.', 'The delivery deadline ends on Friday.'],
      ['la viabilidad', 'sustantivo', 'Posibilidad real de que un proyecto se realice.', 'El informe analiza la viabilidad del proyecto.', 'The report analyses the feasibility of the project.'],
      ['se desprende que', 'expresión', 'Se deduce lógicamente de lo anterior.', 'De los datos se desprende que las ventas han caído.', 'It can be inferred from the data that sales have fallen.'],
    ],
    explain: { title: 'Estructura y lenguaje del informe', body: [
      'Un <b>informe profesional</b> comunica información objetiva a un lector que debe tomar una decisión. Debe ser <b>claro, breve y verificable</b>. El lector suele tener poco tiempo: lo esencial va al principio.',
      { t: 'table', head: ['Apartado', 'Contenido', 'Ejemplo de formulación'], rows: [['Resumen ejecutivo', 'Conclusiones y recomendaciones en pocas líneas', 'El presente informe concluye que...'], ['Introducción', 'Objetivo y alcance', 'El objetivo de este informe es evaluar...'], ['Metodología', 'Cómo se recopilaron los datos', 'Se han recopilado datos mediante encuestas.'], ['Resultados', 'Hallazgos con cifras', 'Los hallazgos muestran que el 62 % de los clientes...'], ['Conclusiones', 'Lo que se deduce', 'De los datos se desprende que...'], ['Recomendaciones', 'Acciones, responsables y plazos', 'Se recomienda que se revise el contrato antes del 30 de junio.']] },
      '<b>Objetividad:</b> usa la voz pasiva refleja y datos concretos. Mejor «Las ventas descendieron un 8 %» que «Las ventas fueron muy malas». Evita adjetivos valorativos sin respaldo numérico.',
      '<b>Recomendar:</b> «Se recomienda + infinitivo» o «Se recomienda que + subjuntivo». Fíjate: «Se recomienda revisar el presupuesto» frente a «Se recomienda que el equipo revise el presupuesto». También son habituales «Sería aconsejable...» y «Convendría...».',
      '<b>Cifras y referencias:</b> «un 62 %», «el 62 por ciento»; «véase el apartado 3», «como se indica en el anexo». Los títulos y las listas facilitan la lectura rápida.',
      { t: 'ex', list: ['El objetivo de este informe es evaluar la viabilidad del proyecto.', 'Los hallazgos muestran que el 62 % de los clientes está satisfecho.', 'De los datos se desprende que las ventas han caído.', 'Se recomienda que el equipo revise el presupuesto antes del plazo.'] },
    ] },
    listen: ['El objetivo de este informe es evaluar la viabilidad del proyecto.', 'Hemos recopilado datos de cincuenta empresas.', 'De los datos se desprende que las ventas han caído.', 'Se recomienda que el equipo revise el presupuesto.', 'El plazo de entrega termina el viernes.'],
    practice: [
      mc('¿Qué apartado va al principio de un informe para lectores con poco tiempo?', 'El resumen ejecutivo', ['El anexo', 'La bibliografía', 'Los agradecimientos'], 'El resumen ejecutivo adelanta lo esencial.', { tag: 'informe' }),
      mc('¿Qué frase es más objetiva?', 'Las ventas descendieron un 8 %.', ['Las ventas fueron fatales.', 'Las ventas fueron un desastre total.', 'Las ventas iban muy mal, la verdad.'], 'Un dato concreto es más objetivo.', { tag: 'informe' }),
      fill('Se recomienda que el equipo ___ el presupuesto. (revisar)', 'revise', 'Se recomienda que + presente de subjuntivo.', { tag: 'informe' }),
      order('De los datos se desprende que las ventas han caído', 'Se desprende que + indicativo.', { tag: 'informe' }),
    ],
    quiz: [
      mc('Los «hallazgos» de un estudio son...', 'los resultados importantes que se descubren', ['los errores de redacción detectados', 'las fuentes que se citan al final', 'los autores que firman el trabajo'], 'Hallazgo = descubrimiento.', { tag: 'vocabulario' }),
      mc('«Recopilar datos» significa...', 'reunir datos', ['inventar datos', 'ocultar datos', 'borrar datos'], 'Recopilar = reunir.', { tag: 'informe' }),
      mc('¿Qué construcción es correcta?', 'Se recomienda revisar el presupuesto.', ['Se recomienda de revisar el presupuesto.', 'Se recomienda a revisar el presupuesto.', 'Se recomienda revisando el presupuesto.'], 'Se recomienda + infinitivo.', { tag: 'informe' }),
      listen('Hemos recopilado datos de cincuenta empresas.', 'Escucha: ¿qué han hecho?', 'Han reunido datos de empresas', ['Han cerrado cincuenta empresas', 'Han vendido datos', 'Han perdido un informe'], 'Dice «hemos recopilado datos».', { tag: 'informe' }),
      dict('El plazo de entrega termina el viernes.', 'Revisa la «z» de «plazo» y la tilde de «viernes» (no lleva).', { tag: 'dictado' }),
      mc('La «viabilidad» de un proyecto es...', 'la posibilidad real de realizarlo', ['su coste total en euros al año', 'su nombre oficial ante el público', 'su fecha de inicio prevista'], 'Viabilidad = que se pueda llevar a cabo.', { tag: 'vocabulario' }),
      match([['los hallazgos', 'Resultados descubiertos'], ['el apartado', 'Parte de un texto'], ['el plazo', 'Tiempo máximo'], ['recopilar', 'Reunir datos']], 'Repasa el vocabulario del informe.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u3.l3', level: 'C1', unit: 3, n: 3, title: 'La reseña crítica', topic: 'Crítica cultural',
    goal: 'Al terminar esta lección, podrás escribir una reseña crítica equilibrada, que describa una obra y la valore con argumentos.',
    vocab: [
      ['la reseña', 'sustantivo', 'Texto breve que describe y valora una obra.', 'Escribió una reseña muy elogiosa de la novela.', 'She wrote a very laudatory review of the novel.', ['la crítica']],
      ['la trama', 'sustantivo', 'Conjunto de hechos que forman el argumento de una obra.', 'La trama es sencilla, pero está bien construida.', 'The plot is simple but well built.', ['el argumento']],
      ['el reparto', 'sustantivo', 'Conjunto de actores de una película o de una obra.', 'El reparto está formado por actores jóvenes.', 'The cast is made up of young actors.'],
      ['adolecer de', 'expresión', 'Tener un defecto o una carencia.', 'La película adolece de un ritmo demasiado lento.', 'The film suffers from a pace that is too slow.'],
      ['la puesta en escena', 'expresión', 'Forma de presentar una obra: decorados, luz, movimiento.', 'La puesta en escena es sobria y elegante.', 'The staging is sober and elegant.'],
      ['logrado', 'adjetivo', 'Que está bien conseguido o bien ejecutado.', 'El final es el momento más logrado del libro.', 'The ending is the most successful moment of the book.'],
    ],
    explain: { title: 'Describir, valorar y matizar', body: [
      'Una <b>reseña crítica</b> combina tres funciones: <b>informar</b> (de qué trata la obra), <b>analizar</b> (cómo está hecha) y <b>valorar</b> (qué opinión merece). Una buena reseña no cuenta el final ni se queda en un «me gustó» o «no me gustó»: justifica cada juicio.',
      { t: 'table', head: ['Función', 'Recursos', 'Ejemplo'], rows: [['Presentar', 'ficha técnica, resumen sin desvelar el final', 'La novela narra la vida de una familia en los años cuarenta.'], ['Analizar', 'trama, personajes, estilo, ritmo', 'La trama está bien construida, aunque el ritmo decae.'], ['Valorar positivamente', 'destacar, resultar + adjetivo, logrado', 'Destaca la puesta en escena. El final resulta muy logrado.'], ['Valorar negativamente', 'adolecer de, carecer de, flojear', 'La película adolece de un guion previsible.'], ['Concluir', 'recomendación matizada', 'En suma, una obra irregular, pero que merece la pena.']] },
      '<b>Adjetivos de valoración:</b> sobrio, ágil, logrado, previsible, tedioso, memorable, desigual, irregular. Un crítico serio gradúa su juicio: «bastante logrado», «algo previsible», «notablemente irregular».',
      '<b>Matizar con concesión:</b> «si bien la trama es previsible, los diálogos son brillantes»; «aunque el reparto es excelente, el guion no le hace justicia». Con «por muy + adjetivo + que» se usa subjuntivo para presentar un obstáculo como irrelevante: «por muy previsible que sea, emociona».',
      '<b>Verbos de la reseña:</b> <i>retratar</i>, <i>abordar</i>, <i>plantear</i>, <i>lograr</i>, <i>flojear</i>, <i>desmerecer</i>. Se usa el presente para describir la obra: «El director retrata una sociedad en crisis».',
      { t: 'ex', list: ['La trama es sencilla, pero está bien construida.', 'La película adolece de un ritmo demasiado lento.', 'La puesta en escena es sobria y elegante.', 'Por muy previsible que sea, el final emociona.'] },
    ] },
    listen: ['La trama es sencilla, pero está bien construida.', 'La película adolece de un ritmo demasiado lento.', 'La puesta en escena es sobria y elegante.', 'El reparto está formado por actores jóvenes.', 'Por muy previsible que sea, el final emociona.'],
    practice: [
      mc('Una reseña crítica debe...', 'describir y valorar con argumentos', ['contar el final completo de la obra', 'copiar la sinopsis de la contraportada', 'evitar cualquier opinión personal'], 'Informa, analiza y valora.', { tag: 'reseña' }),
      mc('«La película adolece de un guion previsible» expresa...', 'una valoración negativa', ['una valoración positiva', 'una pregunta', 'una orden'], 'Adolecer de = tener un defecto.', { tag: 'reseña' }),
      fill('Por muy previsible ___ sea, el final emociona. (conjunción)', 'que', 'Por muy + adjetivo + que + subjuntivo.', { tag: 'reseña' }),
      order('La puesta en escena es sobria y elegante', 'Valoración con ser + adjetivos.', { tag: 'reseña' }),
    ],
    quiz: [
      mc('El «reparto» de una película es...', 'el conjunto de actores', ['el guion que escribe el autor', 'la música que suena al final', 'la fecha de estreno en cines'], 'Reparto = actores.', { tag: 'vocabulario' }),
      mc('¿Qué frase concede algo y luego valora?', 'Aunque el reparto es excelente, el guion es flojo.', ['El reparto es excelente y la película termina.', 'No hay reparto ni guion que comentar aquí.', 'El guion, el reparto, la música y la fotografía.'], 'Aunque + concesión + contraste.', { tag: 'reseña' }),
      mc('La «trama» de una novela es...', 'el conjunto de hechos que forman su argumento', ['su portada y el diseño del libro', 'su precio en las librerías', 'su autor y la fecha de edición'], 'Trama = argumento.', { tag: 'vocabulario' }),
      listen('La puesta en escena es sobria y elegante.', 'Escucha: ¿cómo es la puesta en escena?', 'Sobria y elegante', ['Caótica y ruidosa', 'Cara y lenta', 'Antigua y oscura'], 'Dice «sobria y elegante».', { tag: 'reseña' }),
      dict('La película adolece de un ritmo demasiado lento.', 'Revisa la «c» de «adolece» y la tilde de «película».', { tag: 'dictado' }),
      mc('«Logrado» describe algo...', 'bien conseguido', ['mal escrito', 'muy antiguo', 'sin terminar'], 'Logrado = bien ejecutado.', { tag: 'vocabulario' }),
      match([['la reseña', 'Texto que describe y valora'], ['la trama', 'Argumento de una obra'], ['adolecer de', 'Tener un defecto'], ['logrado', 'Bien conseguido']], 'Repasa el vocabulario de la reseña.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u4.l1', level: 'C1', unit: 4, n: 1, title: 'Argumentación compleja', topic: 'Argumentar y rebatir',
    goal: 'Al terminar esta lección, podrás defender una postura con argumentos encadenados, reconocer falacias y rebatir con matices.',
    vocab: [
      ['desmontar', 'verbo', 'Demostrar que un argumento no se sostiene.', 'Desmontó cada una de sus objeciones con datos.', 'She dismantled each of his objections with data.'],
      ['la falacia', 'sustantivo', 'Razonamiento que parece válido, pero es incorrecto.', 'Decir que algo es bueno porque es antiguo es una falacia.', 'Saying that something is good because it is old is a fallacy.'],
      ['puntualizar', 'verbo', 'Precisar o aclarar un detalle de lo que se ha dicho.', 'Conviene puntualizar esa afirmación.', 'That statement should be clarified.'],
      ['cuestionar', 'verbo', 'Poner en duda algo.', 'Nadie cuestionó la validez del estudio.', 'Nobody questioned the validity of the study.'],
      ['la objeción', 'sustantivo', 'Razón que se opone a una idea o propuesta.', 'Su objeción fue difícil de responder.', 'His objection was hard to answer.'],
      ['por otra parte', 'expresión', 'Introduce un elemento adicional o contrastante.', 'Por otra parte, la medida resulta muy costosa.', 'On the other hand, the measure turns out to be very costly.'],
    ],
    explain: { title: 'Argumentar con solidez', body: [
      'Argumentar bien no consiste en elevar la voz, sino en <b>encadenar razones</b>: tesis, argumento, prueba y conclusión. Un argumento complejo reconoce además <b>la postura contraria</b> y la responde.',
      { t: 'table', head: ['Función', 'Conectores y fórmulas', 'Ejemplo'], rows: [['Añadir', 'además, asimismo, es más', 'Es más, la medida resulta costosa.'], ['Contrastar', 'por un lado... por otro; en cambio; sin embargo', 'Por un lado, ahorra tiempo; por otro, genera dependencia.'], ['Conceder', 'si bien + indicativo; aunque; por mucho que + subjuntivo', 'Por mucho que se insista, los datos no cambian.'], ['Rebatir', 'no es cierto que + subjuntivo; lejos de + inf.', 'No es cierto que la medida sea eficaz.'], ['Concluir', 'por tanto, en consecuencia, de ahí que + subjuntivo', 'De ahí que se reclame una revisión.']] },
      '<b>Estructura de refutación en tres pasos:</b> (1) resumir la postura contraria con honestidad; (2) señalar su punto débil; (3) ofrecer tu propia razón. «Se ha dicho que la medida reduce el paro. Sin embargo, ese dato ignora el empleo precario. Por tanto, el balance es menos favorable.»',
      '<b>Falacias frecuentes:</b> el ataque personal («Lo dice alguien que no sabe nada»), la generalización precipitada («Un caso prueba la regla»), la falsa disyuntiva («O estás conmigo o contra mí») y el argumento de autoridad («Lo dice un famoso, luego es verdad»).',
      '<b>Subjuntivo en la argumentación:</b> tras la negación de una opinión se usa subjuntivo: «No creo que sea una buena idea», «No es cierto que los datos lo demuestren». Con afirmación, indicativo: «Creo que es una buena idea».',
      { t: 'ex', list: ['Por un lado, ahorra tiempo; por otro, genera dependencia.', 'Conviene puntualizar esa afirmación.', 'No es cierto que los datos lo demuestren.', 'Por mucho que se insista, el problema persiste.'] },
    ] },
    listen: ['Por un lado, ahorra tiempo; por otro, genera dependencia.', 'Conviene puntualizar esa afirmación.', 'No es cierto que los datos lo demuestren.', 'Su objeción fue difícil de rebatir.', 'Por mucho que se insista, el problema persiste.'],
    practice: [
      mc('No es cierto que los datos lo ___. (demostrar)', 'demuestren', ['demuestran', 'demostrarán', 'demostraron'], 'No es cierto que + subjuntivo.', { tag: 'argumentación' }),
      mc('«Un solo caso prueba la regla» es un ejemplo de...', 'generalización precipitada', ['argumento de autoridad', 'ataque personal', 'falsa disyuntiva'], 'Se generaliza a partir de un único caso.', { tag: 'argumentación' }),
      fill('Por mucho que se ___, el problema persiste. (insistir)', 'insista', 'Por mucho que + subjuntivo.', { tag: 'argumentación' }),
      order('Por un lado ahorra tiempo y por otro genera dependencia', 'Estructura de contraste.', { tag: 'argumentación', alts: ['Por un lado ahorra tiempo; por otro genera dependencia'] }),
    ],
    quiz: [
      mc('«Puntualizar» una afirmación es...', 'precisarla o aclararla', ['repetirla con más fuerza', 'borrarla del texto', 'traducirla'], 'Puntualizar = precisar.', { tag: 'vocabulario' }),
      mc('¿Qué opción es una falacia de ataque personal?', 'Eso lo dice alguien que no entiende nada.', ['Los datos indican justo lo contrario.', 'Según el estudio, el gasto bajó este año.', 'Habría que revisar esta cifra con calma.'], 'Ataca a la persona, no al argumento.', { tag: 'argumentación' }),
      mc('Tras «No creo que» se usa...', 'subjuntivo', ['indicativo', 'infinitivo', 'imperativo'], 'No creo que + subjuntivo.', { tag: 'argumentación' }),
      listen('No es cierto que los datos lo demuestren.', 'Escucha: ¿qué hace el hablante?', 'Rechaza una afirmación', ['Acepta una propuesta', 'Pide más datos', 'Cuenta una anécdota'], 'Dice «no es cierto que».', { tag: 'argumentación' }),
      dict('Conviene puntualizar esa afirmación.', 'Revisa la «v» de «conviene» y la «z» de «puntualizar»; ninguna de las dos palabras lleva tilde.', { tag: 'dictado' }),
      mc('Una «objeción» es...', 'una razón que se opone a una idea', ['una conclusión final del debate', 'una cita literal de un experto', 'una pregunta retórica del orador'], 'Objeción = razón en contra.', { tag: 'vocabulario' }),
      match([['desmontar', 'Demostrar que no se sostiene'], ['la falacia', 'Razonamiento incorrecto'], ['cuestionar', 'Poner en duda'], ['puntualizar', 'Precisar una idea']], 'Repasa el vocabulario de la argumentación.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u4.l2', level: 'C1', unit: 4, n: 2, title: 'Debates y tertulias', topic: 'Debate oral',
    goal: 'Al terminar esta lección, podrás participar en un debate o una tertulia: pedir y ceder la palabra, discrepar con cortesía e interrumpir con tacto.',
    vocab: [
      ['la tertulia', 'sustantivo', 'Programa o reunión en la que se conversa sobre temas de actualidad.', 'La tertulia de la radio empieza a las diez.', 'The radio discussion programme begins at ten.'],
      ['el moderador', 'sustantivo', 'Persona que dirige un debate y reparte los turnos.', 'El moderador pidió que se respetaran los tiempos.', 'The moderator asked that the time limits be respected.'],
      ['el turno de palabra', 'expresión', 'Momento en que a cada persona le toca hablar.', 'Cada participante tiene un turno de palabra de dos minutos.', 'Each participant has a two-minute speaking turn.'],
      ['interrumpir', 'verbo', 'Cortar lo que alguien está diciendo.', 'Perdone que le interrumpa, pero quisiera puntualizar eso.', 'Sorry to interrupt, but I would like to qualify that.'],
      ['disentir', 'verbo', 'No estar de acuerdo con una opinión.', 'Disiento de su análisis, aunque lo respeto.', 'I disagree with your analysis, although I respect it.', ['discrepar']],
      ['ceder la palabra', 'expresión', 'Dejar que otra persona hable.', 'Le cedo la palabra a mi compañera.', 'I give the floor to my colleague.'],
    ],
    explain: { title: 'Cómo participar en un debate', body: [
      'En un <b>debate</b> o una <b>tertulia</b> se combinan dos objetivos: defender tu postura y mantener un clima de respeto. El lenguaje adecuado es <b>formal-neutro</b>, con fórmulas de cortesía y sin ataques personales.',
      { t: 'table', head: ['Acción', 'Fórmulas', 'Ejemplo'], rows: [['Pedir la palabra', 'Me gustaría intervenir... / ¿Puedo añadir algo?', 'Me gustaría intervenir en este punto.'], ['Interrumpir con tacto', 'Perdone que le interrumpa, pero...', 'Perdone que le interrumpa, pero ese dato es incorrecto.'], ['Discrepar con cortesía', 'Respeto su opinión, pero discrepo... / No comparto su punto de vista', 'No comparto su análisis, y le explico por qué.'], ['Ceder la palabra', 'Le cedo la palabra... / Adelante, por favor', 'Le cedo la palabra a mi compañera.'], ['Recuperar el hilo', 'Como decía... / Volviendo a lo anterior...', 'Volviendo a lo anterior, el problema es la financiación.']] },
      '<b>El papel del moderador:</b> presenta el tema, reparte los turnos de palabra, controla los tiempos y evita que el debate se desvíe. Fórmulas típicas: «Pasamos ahora a la siguiente cuestión», «Les ruego que respeten el turno», «Tiene usted un minuto».',
      '<b>Escuchar activamente:</b> parafrasea antes de responder («Si le he entendido bien, usted sostiene que...») y reconoce lo válido en la otra postura («Tiene razón en que..., pero...»). Esto refuerza tu credibilidad.',
      '<b>Registro oral:</b> las muletillas («o sea», «pues», «¿vale?») restan precisión. Sustitúyelas por pausas y por conectores como «en primer lugar», «ahora bien», «en definitiva».',
      { t: 'ex', list: ['Me gustaría intervenir en este punto.', 'Perdone que le interrumpa, pero ese dato es incorrecto.', 'No comparto su punto de vista, y le explico por qué.', 'Le cedo la palabra a mi compañera.'] },
    ] },
    listen: ['Me gustaría intervenir en este punto.', 'Perdone que le interrumpa, pero ese dato es incorrecto.', 'No comparto su punto de vista.', 'Le cedo la palabra a mi compañera.', 'Les ruego que respeten el turno de palabra.'],
    practice: [
      mc('¿Qué fórmula sirve para interrumpir con tacto?', 'Perdone que le interrumpa, pero...', ['Cállese un momento, por favor ya.', 'Eso que dice es una mentira total.', 'Déjeme hablar a mí de una vez.'], 'La cortesía suaviza la interrupción.', { tag: 'debate' }),
      mc('El moderador de un debate...', 'reparte los turnos de palabra', ['gana siempre el debate que dirige', 'escribe el informe final del acto', 'vota a favor de uno de los participantes'], 'Dirige y organiza el debate.', { tag: 'debate' }),
      fill('Perdone que le ___, pero ese dato es incorrecto. (interrumpir)', 'interrumpa', 'Perdone que + subjuntivo.', { tag: 'debate' }),
      order('Le cedo la palabra a mi compañera', 'Fórmula para ceder el turno.', { tag: 'debate' }),
    ],
    quiz: [
      mc('«Disentir» significa...', 'no estar de acuerdo', ['estar de acuerdo con todos', 'interrumpir a quien habla', 'moderar el turno de palabra'], 'Disentir = discrepar.', { tag: 'vocabulario' }),
      mc('¿Qué frase discrepa con cortesía?', 'Respeto su opinión, pero no la comparto.', ['Usted no tiene ni idea de esto.', 'Qué tontería acaba de decir ahora.', 'Eso es absurdo y no hay más que hablar.'], 'Cortesía + desacuerdo.', { tag: 'debate' }),
      mc('Una «tertulia» es...', 'una conversación sobre temas de actualidad', ['un contrato laboral por escrito', 'un examen oral de la universidad', 'una carta formal a la administración'], 'Tertulia = reunión o programa de conversación.', { tag: 'vocabulario' }),
      listen('Le cedo la palabra a mi compañera.', 'Escucha: ¿qué hace el hablante?', 'Deja hablar a otra persona', ['Cierra el debate', 'Pide silencio', 'Cambia de tema'], 'Dice «le cedo la palabra».', { tag: 'debate' }),
      dict('Perdone que le interrumpa, pero quisiera puntualizar eso.', 'Revisa la «rr» de «interrumpa» y la «z» de «puntualizar».', { tag: 'dictado' }),
      mc('Una buena forma de escuchar activamente es...', 'parafrasear lo que dice el otro', ['hablar a la vez que el otro', 'mirar el móvil mientras escuchas', 'repetir tu opinión una y otra vez'], 'Parafrasear demuestra comprensión.', { tag: 'debate' }),
      match([['la tertulia', 'Conversación sobre actualidad'], ['el moderador', 'Dirige el debate'], ['disentir', 'No estar de acuerdo'], ['ceder la palabra', 'Dejar hablar a otro']], 'Repasa el vocabulario del debate.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c1.u4.l3', level: 'C1', unit: 4, n: 3, title: 'Hablar en público', topic: 'Oratoria',
    goal: 'Al terminar esta lección, podrás preparar y pronunciar un discurso claro, con una estructura sólida y recursos para captar la atención del auditorio.',
    vocab: [
      ['el orador', 'sustantivo', 'Persona que pronuncia un discurso ante un público.', 'El orador habló durante veinte minutos sin papeles.', 'The speaker talked for twenty minutes without notes.'],
      ['el auditorio', 'sustantivo', 'Conjunto de personas que escuchan.', 'El auditorio aplaudió con entusiasmo.', 'The audience applauded enthusiastically.', ['el público']],
      ['la entonación', 'sustantivo', 'Subida y bajada de la voz al hablar.', 'Una buena entonación evita que el discurso resulte monótono.', 'Good intonation prevents a speech from sounding monotonous.'],
      ['la pausa', 'sustantivo', 'Breve silencio que se hace al hablar.', 'Una pausa antes de la idea clave genera expectación.', 'A pause before the key idea creates anticipation.'],
      ['captar la atención', 'expresión', 'Conseguir que el público se interese por lo que dices.', 'Una pregunta sorprendente sirve para captar la atención.', 'A surprising question serves to capture attention.'],
      ['el discurso', 'sustantivo', 'Texto o exposición oral que se pronuncia ante un público.', 'Preparó un discurso breve y emotivo.', 'He prepared a short, moving speech.'],
    ],
    explain: { title: 'Estructura y recursos del discurso', body: [
      'Hablar en público es una destreza que se entrena. Un buen <b>discurso</b> se apoya en tres elementos: <b>contenido</b> (ideas claras), <b>estructura</b> (orden lógico) y <b>puesta en voz</b> (entonación, ritmo, gestos).',
      { t: 'table', head: ['Parte', 'Objetivo', 'Recursos'], rows: [['Apertura', 'Captar la atención', 'una pregunta, una cifra sorprendente, una anécdota breve'], ['Presentación', 'Anunciar el plan', 'Hoy voy a hablarles de tres cuestiones: ...'], ['Desarrollo', 'Explicar y convencer', 'ejemplos, datos, comparaciones, repetición'], ['Cierre', 'Dejar huella', 'síntesis + llamada a la acción o frase final memorable']] },
      '<b>Recursos retóricos:</b> la <i>pregunta retórica</i> («¿Podemos permitirnos esperar?»), la <i>enumeración</i> («tiempo, esfuerzo, dedicación»), la <i>repetición</i> («No es un problema, no es una opinión, es un derecho») y la <i>regla de tres</i>.',
      '<b>La voz:</b> varía la <b>entonación</b> para no sonar monótono; haz <b>pausas</b> antes y después de las ideas clave; ajusta el volumen al espacio; habla más despacio de lo que crees necesario. Las muletillas se sustituyen por silencios.',
      '<b>Dirigirse al público:</b> «Señoras y señores», «Queridos compañeros», «Estimados asistentes». Los conectores orales ordenan el discurso: «en primer lugar», «a continuación», «dicho esto», «para terminar».',
      '<b>Preparación:</b> escribe un guion de ideas (no un texto para leer), ensaya en voz alta con un cronómetro y prevé posibles preguntas del auditorio. Mirar a distintas personas de la sala transmite seguridad.',
      { t: 'ex', list: ['Señoras y señores, buenas tardes.', 'Hoy voy a hablarles de tres cuestiones.', '¿Podemos permitirnos esperar?', 'Para terminar, quisiera agradecerles su atención.'] },
    ] },
    listen: ['Señoras y señores, buenas tardes.', 'Hoy voy a hablarles de tres cuestiones.', '¿Podemos permitirnos seguir esperando?', 'Una pausa antes de la idea clave genera expectación.', 'Para terminar, quisiera agradecerles su atención.'],
    practice: [
      mc('¿Qué sirve para captar la atención al empezar un discurso?', 'Una pregunta sorprendente', ['Leer el título muy deprisa', 'Pedir disculpas por hablar', 'Mirar al suelo'], 'Una pregunta o una cifra impactan.', { tag: 'oratoria' }),
      mc('«¿Podemos permitirnos esperar?» es...', 'una pregunta retórica', ['una pregunta de examen', 'una orden', 'una despedida'], 'No espera respuesta; busca efecto.', { tag: 'oratoria' }),
      fill('Hoy voy a hablar___ de tres cuestiones. (pronombre para «a ustedes», unido al infinitivo)', 'les', 'Hablar + pronombre «les»: hablarles.', { tag: 'oratoria' }),
      order('Para terminar quisiera agradecerles su atención', 'Fórmula de cierre.', { tag: 'oratoria', alts: ['Para terminar, quisiera agradecerles su atención'] }),
    ],
    quiz: [
      mc('Hacer una pausa antes de la idea clave sirve para...', 'generar expectación', ['perder el hilo', 'alargar el discurso sin motivo', 'evitar al público'], 'La pausa subraya lo importante.', { tag: 'oratoria' }),
      mc('El «auditorio» es...', 'el conjunto de personas que escuchan', ['el micrófono que usa el orador', 'el guion que se lee en voz alta', 'el título que lleva el discurso'], 'Auditorio = público.', { tag: 'vocabulario' }),
      mc('¿Qué conviene preparar para un discurso?', 'Un guion de ideas y un ensayo en voz alta', ['Un texto largo para leer sin mirar al público', 'Nada, es mejor improvisar todo el discurso', 'Solo la despedida para terminar rápido'], 'Guion de ideas y ensayo.', { tag: 'oratoria' }),
      listen('Hoy voy a hablarles de tres cuestiones.', 'Escucha: ¿qué hace el orador?', 'Anuncia el plan del discurso', ['Se despide', 'Cuenta un chiste', 'Pide un voluntario'], 'Presenta tres cuestiones.', { tag: 'oratoria' }),
      dict('Una pausa antes de la idea clave genera expectación.', 'Revisa la tilde de «expectación» y la «x».', { tag: 'dictado' }),
      mc('La «entonación» es...', 'la subida y bajada de la voz', ['la velocidad a la que se lee el texto', 'el título que lleva el discurso', 'la ropa que lleva el orador'], 'Entonación = melodía de la voz.', { tag: 'vocabulario' }),
      match([['el orador', 'Quien pronuncia un discurso'], ['el auditorio', 'Personas que escuchan'], ['la pausa', 'Breve silencio'], ['captar la atención', 'Interesar al público']], 'Repasa el vocabulario de la oratoria.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'vehemente': 'vehement; impassioned', 'el eufemismo': 'euphemism', 'peyorativo': 'pejorative; derogatory', 'tozudo': 'stubborn; pigheaded', 'sutil': 'subtle',
    'equívoco': ['ambiguous; misleading', 'misunderstanding; mistake'], 'la insinuación': 'insinuation; hint', 'tomar el pelo': 'to pull (someone\'s) leg', 'el calambur': 'pun (word split to change meaning)', 'entre líneas': 'between the lines',
    'a caballo regalado no le mires el diente': 'don\'t look a gift horse in the mouth', 'más vale pájaro en mano que ciento volando': 'a bird in the hand is worth two in the bush', 'no hay mal que por bien no venga': 'every cloud has a silver lining', 'en boca cerrada no entran moscas': 'silence is golden; keep your mouth shut', 'ser pan comido': 'to be a piece of cake',
    'la metáfora': 'metaphor', 'el narrador': 'narrator', 'la elipsis': 'ellipsis; omission', 'evocar': 'to evoke; to call to mind', 'la prosopopeya': 'personification',
    'el otorgante': 'grantor; party granting a document', 'por la presente': 'hereby; by this document', 'subsanar': 'to remedy; to correct (a defect)', 'el expediente': 'file; case record', 'la vigencia': 'validity; period in force',
    'el titular': ['headline', 'holder; owner'], 'la entradilla': 'lead paragraph; standfirst', 'la crónica': 'chronicle; feature report', 'desmentir': 'to deny; to refute', 'el sensacionalismo': 'sensationalism'
  });

  C.addLesson({
    id: 'c2.u1.l1', level: 'C2', unit: 1, n: 1, title: 'Sinónimos y connotación', topic: 'Matices de significado',
    goal: 'Al terminar esta lección, podrás elegir entre sinónimos según su connotación, su intensidad y su registro, y reconocer los eufemismos.',
    vocab: [
      ['vehemente', 'adjetivo', 'Que se expresa con mucha fuerza y pasión.', 'Hizo una defensa vehemente de sus ideas.', 'He made an impassioned defense of his ideas.', ['apasionado']],
      ['el eufemismo', 'sustantivo', 'Palabra suave que sustituye a otra considerada dura o desagradable.', '«Pasar a mejor vida» es un eufemismo de «morir».', '"To pass on to a better life" is a euphemism for "to die".'],
      ['peyorativo', 'adjetivo', 'Que expresa una valoración negativa o despectiva.', 'Usó la palabra con un sentido claramente peyorativo.', 'He used the word with a clearly pejorative sense.', ['despectivo']],
      ['tozudo', 'adjetivo', 'Que mantiene su opinión con terquedad, aunque no tenga razón.', 'Es tan tozudo que nunca rectifica.', 'He is so stubborn that he never backs down.', ['testarudo']],
      ['sutil', 'adjetivo', 'Delicado, fino y difícil de percibir.', 'Entre ambos términos hay una diferencia muy sutil.', 'There is a very subtle difference between the two terms.'],
    ],
    explain: { title: 'Elegir la palabra justa: denotación y connotación', body: [
      'En español casi no existen los sinónimos perfectos. Dos palabras pueden compartir la <b>denotación</b> (el significado básico) y diferir en la <b>connotación</b>: la carga afectiva, la intensidad o el registro que arrastran.',
      { t: 'table', head: ['Idea base', 'Neutro', 'Positivo', 'Negativo'], rows: [['Decidido en sus opiniones', 'firme', 'tenaz, perseverante', 'tozudo, terco, cabezota'], ['Que gasta poco', 'ahorrador', 'previsor, austero', 'tacaño, rácano (coloquial)'], ['Que habla mucho', 'hablador', 'comunicativo, expresivo', 'charlatán, parlanchín'], ['Delgado', 'delgado', 'esbelto, estilizado', 'flaco, escuálido']] },
      'La <b>intensidad</b> también cambia: «molesto» < «irritante» < «insoportable» < «intolerable». Elegir el grado exacto evita tanto la exageración como el tono tibio.',
      'El <b>registro</b> separa «morirse» (neutro), «fallecer» (formal), «espicharla» (coloquial, humorístico) y «expirar» (literario o solemne).',
      'Un <b>eufemismo</b> suaviza lo desagradable («tercera edad» por «vejez»; «reajuste de plantilla» por «despidos»). Cuando el eufemismo oculta una realidad dura de manera interesada, hablamos de lenguaje manipulador.',
      'Un mismo adjetivo puede ser elogio o reproche según el contexto: «ambicioso» (con aprobación) frente a «trepa» (con desprecio) describen a veces la misma conducta.',
      { t: 'ex', list: ['Es firme en sus convicciones; su hermano, en cambio, es tozudo.', 'Más que ahorrador, diría que es tacaño.', 'Su discurso fue vehemente, pero no agresivo.', 'Entre «delgado» y «escuálido» hay un matiz sutil de intensidad.'] },
    ] },
    listen: ['Es firme en sus convicciones, pero su hermano es tozudo.', 'Hizo una defensa vehemente de sus ideas.', 'Entre ambos términos hay una diferencia muy sutil.', 'Pasar a mejor vida es un eufemismo de morir.', 'Usó la palabra con un sentido claramente peyorativo.'],
    practice: [
      mc('¿Qué adjetivo tiene connotación negativa para «que gasta poco»?', 'tacaño', ['ahorrador', 'prudente', 'frugal'], 'Tacaño censura; ahorrador es neutro.', { tag: 'connotación' }),
      mc('«Fallecer» frente a «espicharla» se diferencia por...', 'el registro', ['el significado básico', 'la gramática', 'el género'], 'Misma denotación, distinto registro.', { tag: 'connotación' }),
      fill('«Tercera edad» es un ___ de «vejez». (palabra que suaviza)', 'eufemismo', 'Suaviza una realidad desagradable.', { tag: 'connotación' }),
      order('Entre ambos términos hay una diferencia sutil', 'Complemento inicial + «hay» + sujeto + adjetivo.', { tag: 'connotación', alts: ['Hay una diferencia sutil entre ambos términos', 'Entre ambos términos hay una sutil diferencia', 'Hay una sutil diferencia entre ambos términos'] }),
    ],
    quiz: [
      mc('La connotación de una palabra es...', 'su carga afectiva o valorativa', ['su definición del diccionario', 'su origen latino', 'su número de sílabas'], 'Denotación = significado básico; connotación = carga añadida.', { tag: 'connotación' }),
      mc('¿Qué serie está ordenada de menor a mayor intensidad?', 'molesto, irritante, insoportable', ['insoportable, molesto, irritante', 'irritante, molesto, insoportable', 'molesto, insoportable, irritante'], 'Del grado más suave al más fuerte.', { tag: 'connotación' }),
      mc('Un uso «peyorativo» de una palabra es...', 'despectivo', ['elogioso', 'neutro', 'técnico'], 'Peyorativo = con valoración negativa.', { tag: 'vocabulario' }),
      listen('Hizo una defensa vehemente de sus ideas.', 'Escucha: ¿cómo defendió sus ideas?', 'Con pasión y fuerza', ['Con timidez', 'Con indiferencia', 'Con humor'], 'Vehemente = apasionado.', { tag: 'connotación' }),
      dict('Entre ambos términos hay una diferencia muy sutil.', 'Revisa la tilde de «términos».', { tag: 'dictado' }),
      mc('¿Cuál es el término más formal para «morirse»?', 'fallecer', ['espicharla', 'diñarla', 'estirar la pata'], 'Fallecer es el registro formal.', { tag: 'connotación' }),
      match([['vehemente', 'Apasionado y enérgico'], ['el eufemismo', 'Palabra que suaviza'], ['tozudo', 'Terco, no cede'], ['sutil', 'Fino, difícil de percibir']], 'Repasa el vocabulario de matices.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u1.l2', level: 'C2', unit: 1, n: 2, title: 'Ambigüedad y doble sentido', topic: 'Matices de significado',
    goal: 'Al terminar esta lección, podrás detectar la ambigüedad léxica y sintáctica, interpretar insinuaciones y jugar con el doble sentido.',
    vocab: [
      ['equívoco', 'adjetivo', 'Que puede entenderse de varias maneras y provoca confusión.', 'Su respuesta fue deliberadamente equívoca.', 'His answer was deliberately ambiguous.', ['ambiguo']],
      ['la insinuación', 'sustantivo', 'Cosa que se da a entender sin decirla abiertamente.', 'No acepto esa insinuación sobre mi honradez.', 'I do not accept that insinuation about my honesty.'],
      ['tomar el pelo', 'expresión', 'Burlarse de alguien con engaños o bromas.', 'No me tomes el pelo: eso es imposible.', 'Don\'t pull my leg: that is impossible.'],
      ['el calambur', 'sustantivo', 'Juego de palabras que cambia el sentido al agrupar las sílabas de otro modo.', 'La broma «plátano es» / «plata no es» es un calambur.', 'The joke "plátano es" / "plata no es" is a calambur (a pun that regroups syllables).'],
      ['entre líneas', 'expresión', 'De manera implícita, sin estar dicho con claridad.', 'Hay que leer entre líneas lo que dijo el ministro.', 'You have to read between the lines of what the minister said.'],
    ],
    explain: { title: 'Cuando una frase significa más de una cosa', body: [
      'La <b>ambigüedad</b> aparece cuando un enunciado admite varias interpretaciones. Puede ser <b>léxica</b> (una palabra con varios sentidos) o <b>sintáctica</b> (la estructura permite dos lecturas).',
      { t: 'table', head: ['Tipo', 'Ejemplo', 'Lecturas posibles'], rows: [['Léxica', 'Esperé en el <b>banco</b>.', 'la entidad financiera / el asiento'], ['Sintáctica', 'Vi al hombre con el telescopio.', 'yo tenía el telescopio / él lo tenía'], ['Referencial', 'Luis le dijo a Juan que <b>su</b> hermano llegaría tarde.', 'el hermano de Luis o el de Juan'], ['Pragmática', '¿Puedes pasarme la sal?', 'pregunta de capacidad o petición cortés']] },
      'Para <b>desambiguar</b> se reformula: «Con mi telescopio, vi al hombre» o «Vi al hombre que tenía el telescopio»; y «Luis le dijo a Juan: “Tu hermano llegará tarde”».',
      'El <b>doble sentido</b> es voluntario: ironía, humor, <b>insinuación</b> o <b>calambur</b>. Leer «entre líneas» muestra cómo lo implícito pesa tanto como lo dicho.',
      'Las <b>implicaturas</b> son significados que se deducen del contexto: «Aquí hace calor» puede significar «abre la ventana». Un hablante experto elige cuándo ser explícito y cuándo dejar que el otro deduzca.',
      'Un texto formal exige <b>precisión</b> y evitar el equívoco; un texto humorístico o literario lo cultiva.',
      { t: 'ex', list: ['Su respuesta fue deliberadamente equívoca.', 'No me tomes el pelo.', 'Hay que leer entre líneas lo que dijo.', 'Rechazo esa insinuación.'] },
    ] },
    listen: ['Su respuesta fue deliberadamente equívoca.', 'No me tomes el pelo, eso es imposible.', 'Hay que leer entre líneas lo que dijo el ministro.', 'No acepto esa insinuación sobre mi honradez.', 'Vi al hombre con el telescopio.'],
    practice: [
      mc('«Vi al hombre con el telescopio» es un caso de ambigüedad...', 'sintáctica', ['léxica', 'ortográfica', 'fonética'], 'La estructura admite dos lecturas.', { tag: 'ambigüedad' }),
      mc('«¿Puedes pasarme la sal?» es en realidad...', 'una petición cortés', ['una pregunta sobre tu capacidad', 'una orden grosera', 'una queja'], 'Significado pragmático.', { tag: 'ambigüedad' }),
      fill('No me ___ el pelo. (tomar, imperativo negativo)', 'tomes', 'No + subjuntivo: tomes.', { tag: 'ambigüedad' }),
      order('Hay que leer entre líneas', 'Perífrasis de obligación + locución.', { tag: 'ambigüedad' }),
    ],
    quiz: [
      mc('¿Qué reformulación elimina la ambigüedad del posesivo en «Luis le dijo a Juan que su hermano llegaría tarde»?', 'Luis le dijo a Juan: «Tu hermano llegará tarde».', ['Luis le dijo a Juan su hermano llegaría tarde.', 'Luis dijo a Juan que llegaría tarde.', 'Luis y Juan llegarían tarde.'], 'Con estilo directo y «tu» queda claro de quién es el hermano; las demás cambian el sentido o no aclaran nada.', { tag: 'ambigüedad' }),
      mc('Una «insinuación» es...', 'algo que se da a entender sin decirlo', ['una orden directa y clara a alguien', 'un insulto explícito y sin rodeos', 'un dato exacto que se da con precisión'], 'Insinuar = dar a entender.', { tag: 'vocabulario' }),
      mc('Una «implicatura» es...', 'un significado que se deduce del contexto', ['una falta de ortografía muy común', 'una palabra rara y poco usada', 'un tiempo verbal del subjuntivo'], 'Lo implícito no está dicho, se infiere.', { tag: 'ambigüedad' }),
      listen('No acepto esa insinuación sobre mi honradez.', 'Escucha: ¿qué hace la persona?', 'Rechaza una insinuación', ['Acepta una oferta', 'Pide perdón', 'Cuenta un chiste'], 'Dice «no acepto esa insinuación».', { tag: 'ambigüedad' }),
      dict('Hay que leer entre líneas lo que dijo el ministro.', 'Revisa la tilde de «líneas» y la «h» de «Hay».', { tag: 'dictado' }),
      mc('En un contrato conviene...', 'evitar el equívoco', ['cultivar el doble sentido', 'usar muchas ironías', 'dejarlo todo implícito'], 'La precisión es esencial en textos formales.', { tag: 'ambigüedad' }),
      match([['equívoco', 'Que admite varios sentidos'], ['la insinuación', 'Se da a entender sin decir'], ['tomar el pelo', 'Burlarse con engaños'], ['entre líneas', 'De forma implícita']], 'Repasa el vocabulario del doble sentido.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u1.l3', level: 'C2', unit: 1, n: 3, title: 'Refranes y modismos', topic: 'Matices de significado',
    goal: 'Al terminar esta lección, podrás entender e integrar refranes y modismos con naturalidad y saber cuándo conviene usarlos.',
    vocab: [
      ['a caballo regalado no le mires el diente', 'refrán', 'No se debe criticar lo que se recibe como regalo.', 'No te quejes del jersey: a caballo regalado no le mires el diente.', 'Don\'t complain about the sweater: don\'t look a gift horse in the mouth.'],
      ['más vale pájaro en mano que ciento volando', 'refrán', 'Es mejor conservar lo seguro que arriesgarlo por algo mejor incierto.', 'Acepta la oferta: más vale pájaro en mano que ciento volando.', 'Accept the offer: a bird in the hand is worth two in the bush.'],
      ['no hay mal que por bien no venga', 'refrán', 'Algo malo puede traer consecuencias buenas.', 'Perdí el vuelo, pero conocí a mi socio: no hay mal que por bien no venga.', 'I missed the flight but met my partner: every cloud has a silver lining.'],
      ['en boca cerrada no entran moscas', 'refrán', 'Callar a tiempo evita problemas.', 'Prefirió no opinar: en boca cerrada no entran moscas.', 'He preferred not to comment: silence avoids trouble.'],
      ['ser pan comido', 'modismo', 'Ser algo muy fácil.', 'Con tu experiencia, este examen es pan comido.', 'With your experience, this exam is a piece of cake.', ['ser coser y cantar']],
    ],
    explain: { title: 'La sabiduría condensada: refranes, dichos y modismos', body: [
      'Un <b>refrán</b> es una oración completa, de forma fija y con carácter de enseñanza, a menudo rimada o en dos miembros: «Quien mal anda, mal acaba». Un <b>modismo</b> o <b>locución</b> es una expresión fija que funciona como una palabra o un sintagma: «meter la pata», «estar en las nubes». Un <b>dicho</b> es una frase popular de uso más libre.',
      { t: 'table', head: ['Expresión', 'Sentido', 'Tono / uso'], rows: [['A buen entendedor, pocas palabras bastan.', 'Se entiende sin explicar más', 'Cierra una advertencia velada'], ['Camarón que se duerme, se lo lleva la corriente.', 'Quien se descuida, pierde', 'Anima a actuar'], ['Dime con quién andas y te diré quién eres.', 'Las compañías definen a la persona', 'A veces reproche'], ['Ser pan comido', 'Muy fácil', 'Coloquial'], ['Costar un ojo de la cara', 'Ser carísimo', 'Coloquial, enfático']] },
      '<b>Cómo integrarlos:</b> se introducen con fórmulas como «como dice el refrán», «ya se sabe que...», «dicen que...». Un refrán soltado en el momento justo da fuerza; en exceso resulta cursi o paternalista.',
      '<b>Riesgos:</b> muchos refranes son contradictorios («Más vale tarde que nunca» / «A buenas horas, mangas verdes»; «Al que madruga, Dios le ayuda» / «No por mucho madrugar amanece más temprano»). Se elige el que conviene a la situación.',
      'En <b>textos formales</b> los modismos coloquiales se evitan; en <b>conversación, publicidad y literatura</b> aportan color y complicidad. Muchos se pueden <b>manipular</b> con ingenio: «A caballo regalado, sí le miro el diente si es una trampa».',
      { t: 'ex', list: ['Acepta la oferta: más vale pájaro en mano que ciento volando.', 'Callé a tiempo: en boca cerrada no entran moscas.', 'Para ti, este examen es pan comido.', 'Como dice el refrán, no hay mal que por bien no venga.'] },
    ] },
    listen: ['A caballo regalado no le mires el diente.', 'Más vale pájaro en mano que ciento volando.', 'No hay mal que por bien no venga.', 'En boca cerrada no entran moscas.', 'Con tu experiencia, el examen es pan comido.'],
    practice: [
      mc('«Más vale pájaro en mano que ciento volando» aconseja...', 'conservar lo seguro', ['arriesgarlo todo', 'cazar pájaros', 'esperar a mejor oferta'], 'Prefiere lo seguro a lo incierto.', { tag: 'refranes' }),
      mc('«Ser pan comido» significa...', 'ser muy fácil', ['ser muy caro', 'tener hambre', 'ser aburrido'], 'Es un modismo: algo sin dificultad.', { tag: 'refranes' }),
      fill('No hay mal que por ___ no venga. (lo contrario de mal)', 'bien', 'Lo malo puede traer algo bueno.', { tag: 'refranes' }),
      order('Como dice el refrán no hay mal que por bien no venga', 'Fórmula introductora + refrán.', { tag: 'refranes', alts: ['Como dice el refrán, no hay mal que por bien no venga'] }),
    ],
    quiz: [
      mc('¿Cuál es un refrán?', 'Quien mal anda, mal acaba.', ['meter la pata', 'estar en las nubes', 'costar un ojo de la cara'], 'El refrán es una oración completa con enseñanza.', { tag: 'refranes' }),
      mc('Alguien critica un regalo. ¿Qué refrán le dirías?', 'A caballo regalado no le mires el diente.', ['En boca cerrada no entran moscas.', 'Camarón que se duerme, se lo lleva la corriente.', 'Más vale tarde que nunca.'], 'No se critica lo que se recibe gratis.', { tag: 'refranes' }),
      mc('¿Por qué algunos refranes parecen contradictorios?', 'Porque cada uno vale para una situación distinta', ['Porque están mal escritos en los libros', 'Porque son todos muy modernos y nuevos', 'Porque en realidad no tienen ningún sentido'], 'Se elige el que encaja con el contexto.', { tag: 'refranes' }),
      listen('En boca cerrada no entran moscas.', 'Escucha: ¿qué recomienda el refrán?', 'Callar a tiempo', ['Hablar más alto', 'Cerrar la ventana', 'Comer despacio'], 'Callar evita problemas.', { tag: 'refranes' }),
      dict('No hay mal que por bien no venga.', 'Cuidado con «por bien» y el subjuntivo «venga».', { tag: 'dictado' }),
      mc('En un informe formal, los modismos coloquiales...', 'se suelen evitar', ['son obligatorios', 'sustituyen a los datos', 'se escriben en mayúsculas'], 'Aportan color, pero no encajan en un registro formal.', { tag: 'refranes' }),
      match([['ser pan comido', 'Ser muy fácil'], ['en boca cerrada no entran moscas', 'Callar evita problemas'], ['no hay mal que por bien no venga', 'Lo malo trae algo bueno'], ['a caballo regalado no le mires el diente', 'No critiques un regalo']], 'Repasa los refranes y modismos.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u2.l1', level: 'C2', unit: 2, n: 1, title: 'Lenguaje literario', topic: 'Estilos',
    goal: 'Al terminar esta lección, podrás reconocer los recursos del lenguaje literario y explicar su efecto en un texto.',
    vocab: [
      ['la metáfora', 'sustantivo', 'Figura que identifica una cosa con otra por su parecido.', '«Tus ojos son dos luceros» es una metáfora.', '"Your eyes are two bright stars" is a metaphor.'],
      ['el narrador', 'sustantivo', 'Voz que cuenta los hechos de un relato.', 'El narrador de la novela es un testigo anónimo.', 'The novel\'s narrator is an anonymous witness.'],
      ['la elipsis', 'sustantivo', 'Omisión de elementos que se sobrentienden o de una parte de la historia.', 'La elipsis deja al lector imaginar el final.', 'The ellipsis lets the reader imagine the ending.'],
      ['evocar', 'verbo', 'Traer algo a la memoria o a la imaginación.', 'El olor a pan evocaba su infancia.', 'The smell of bread evoked his childhood.'],
      ['la prosopopeya', 'sustantivo', 'Figura que atribuye cualidades humanas a lo inanimado.', '«La luna sonreía» es una prosopopeya.', '"The moon smiled" is a personification.', ['la personificación']],
    ],
    explain: { title: 'Recursos y efectos del lenguaje literario', body: [
      'El lenguaje literario no solo informa: busca <b>belleza, ambigüedad fecunda y emoción</b>. Se aparta de lo cotidiano mediante recursos que llaman la atención sobre la forma.',
      { t: 'table', head: ['Recurso', 'Ejemplo', 'Efecto'], rows: [['Metáfora', 'Las perlas de su boca', 'Identifica dos realidades y crea imagen'], ['Símil', 'Ligero como una pluma', 'Compara con «como»'], ['Prosopopeya', 'El viento susurraba secretos', 'Da vida a lo inanimado'], ['Hipérbole', 'Te lo he dicho mil veces', 'Exagera para enfatizar'], ['Antítesis', 'Frágil por fuera, firme por dentro', 'Contrasta ideas'], ['Elipsis', 'Pasó la noche... y ya no hubo más', 'Omite y sugiere'], ['Aliteración', 'El susurro de la seda sobre la sala', 'Repite sonidos']] },
      'El <b>narrador</b> puede ser de primera persona (protagonista o testigo), de tercera <b>omnisciente</b> (lo sabe todo) o de tercera con <b>focalización limitada</b> (solo ve lo que ve un personaje).',
      'La <b>sintaxis</b> también es expresiva: el <b>hipérbaton</b> (alterar el orden habitual: «Azul y profundo se extendía el mar») da solemnidad; las frases largas con subordinadas crean ritmo envolvente, las cortas, tensión.',
      'Los tiempos verbales narran: el <b>indefinido</b> avanza la acción; el <b>imperfecto</b> describe y crea atmósfera; el <b>presente histórico</b> acerca el pasado al lector.',
      'Al comentar un texto, sigue el esquema: <b>identificar el recurso → citarlo → explicar su efecto</b>. «La prosopopeya “la ciudad dormía” transmite quietud y humaniza el espacio».',
      { t: 'ex', list: ['El olor a pan evocaba su infancia.', 'La metáfora convierte la vejez en un otoño de la vida.', 'La elipsis final deja abierto el desenlace.', 'El narrador testigo limita lo que sabemos.'] },
    ] },
    listen: ['El olor a pan evocaba su infancia.', 'La luna sonreía sobre el mar tranquilo.', 'La elipsis deja al lector imaginar el final.', 'El narrador de la novela es un testigo anónimo.', 'Frágil por fuera, firme por dentro.'],
    practice: [
      mc('«La luna sonreía» es un ejemplo de...', 'prosopopeya', ['hipérbole', 'antítesis', 'símil'], 'Atribuye una acción humana a la luna.', { tag: 'literario' }),
      mc('«Ligero como una pluma» es...', 'un símil', ['una metáfora pura', 'una elipsis', 'un hipérbaton'], 'Compara de forma explícita con «como».', { tag: 'literario' }),
      fill('El imperfecto sirve para describir y crear ___. (clima de la escena)', ['atmósfera', 'ambiente', 'clima'], 'Atmósfera o ambiente de la escena.', { tag: 'literario' }),
      order('La elipsis deja abierto el desenlace', 'Sujeto + verbo + complemento.', { tag: 'literario', alts: ['La elipsis deja el desenlace abierto'] }),
    ],
    quiz: [
      mc('Un narrador omnisciente...', 'lo sabe todo sobre los personajes', ['es siempre el protagonista del relato', 'solo cuenta lo que ve con sus ojos', 'no puede existir en una novela'], 'Omnisciente = conoce pensamientos y hechos.', { tag: 'literario' }),
      mc('«Te lo he dicho mil veces» es...', 'una hipérbole', ['una antítesis', 'una elipsis', 'una prosopopeya'], 'Exagera para enfatizar.', { tag: 'literario' }),
      mc('¿Qué tiempo verbal hace avanzar la acción en un relato?', 'el indefinido', ['el imperfecto', 'el condicional', 'el subjuntivo'], 'El indefinido narra los hechos puntuales.', { tag: 'literario' }),
      listen('La elipsis deja al lector imaginar el final.', 'Escucha: ¿qué consigue la elipsis?', 'Que el lector imagine el final', ['Que se explique todo', 'Que haya más diálogo', 'Que cambie el narrador'], 'Omite y sugiere.', { tag: 'literario' }),
      dict('El olor a pan evocaba su infancia.', 'Revisa la tilde de «evocaba» (no lleva) y la «v».', { tag: 'dictado' }),
      mc('Al comentar un recurso, lo esencial es...', 'citarlo y explicar su efecto', ['copiar el texto entero', 'resumir la trama', 'contar la vida del autor'], 'Identificar, citar y explicar el efecto.', { tag: 'literario' }),
      match([['la metáfora', 'Identifica dos realidades'], ['el narrador', 'Voz que cuenta'], ['evocar', 'Traer a la memoria'], ['la prosopopeya', 'Humaniza lo inanimado']], 'Repasa el vocabulario literario.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u2.l2', level: 'C2', unit: 2, n: 2, title: 'Lenguaje jurídico y administrativo', topic: 'Estilos',
    goal: 'Al terminar esta lección, podrás comprender y redactar fórmulas jurídicas y administrativas con precisión y el tono adecuado.',
    vocab: [
      ['el otorgante', 'sustantivo', 'Persona que concede o firma un documento ante un fedatario.', 'El otorgante firmó la escritura ante notario.', 'The grantor signed the deed before a notary.'],
      ['por la presente', 'expresión', 'Fórmula que indica que lo declarado se hace mediante este mismo documento.', 'Por la presente, solicito la baja del servicio.', 'I hereby request cancellation of the service.'],
      ['subsanar', 'verbo', 'Corregir un defecto o error de un trámite.', 'Dispone de diez días para subsanar la documentación.', 'You have ten days to correct the documentation.'],
      ['el expediente', 'sustantivo', 'Conjunto de documentos de un asunto o trámite.', 'Su expediente está pendiente de resolución.', 'Your file is pending resolution.'],
      ['la vigencia', 'sustantivo', 'Tiempo durante el cual una norma o contrato es válido.', 'La vigencia del contrato es de dos años.', 'The contract is valid for two years.'],
    ],
    explain: { title: 'Precisión, impersonalidad y fórmulas fijas', body: [
      'El lenguaje jurídico-administrativo busca <b>exactitud, objetividad y formalidad</b>. Evita la ambigüedad, pero a veces la rodea de un estilo recargado. Hoy se promueve el <b>lenguaje claro</b> sin perder rigor.',
      { t: 'table', head: ['Rasgo', 'Ejemplo', 'Versión clara'], rows: [['Impersonalidad con «se»', 'Se advierte que el plazo ha vencido.', 'Le advertimos que el plazo ha vencido.'], ['Gerundio de posterioridad (incorrecto)', 'Dictó sentencia, <b>siendo</b> recurrida después.', 'Dictó sentencia, que fue recurrida después.'], ['Futuro de mandato', 'Los interesados presentarán la solicitud.', 'Los interesados deben presentar la solicitud.'], ['Futuro de subjuntivo', 'Quien incumpliere será sancionado.', 'Quien incumpla será sancionado.'], ['Fórmula de inicio', 'Por la presente, solicito...', 'Solicito...']] },
      '<b>Fórmulas habituales:</b> «<b>EXPONE</b> / <b>SOLICITA</b>» (instancias), «en virtud de lo dispuesto en...», «a los efectos oportunos», «hacer constar», «en el plazo de diez días hábiles», «sin perjuicio de», «a tenor de lo establecido».',
      '<b>Subsanar</b> un defecto no es «solucionar» cualquier cosa: se aplica a errores o carencias de un trámite. <b>Expediente</b> es el conjunto de documentos; <b>resolución</b> es la decisión de la Administración; <b>recurso</b> es la vía para impugnarla.',
      '<b>Cuidado con los términos parecidos:</b> «caducar» (perder validez por el paso del tiempo), «prescribir» (extinguirse un derecho o una responsabilidad por el paso del tiempo), «derogar» (dejar sin vigencia una norma, en todo o en parte) y «abrogar» (término técnico poco frecuente: dejarla sin vigencia por completo) no son sinónimos exactos.',
      'En una <b>instancia</b> se identifica al solicitante, se exponen los hechos, se pide algo concreto y se firma con fecha y lugar. No se usan abreviaturas ni coloquialismos.',
      { t: 'ex', list: ['Dispone de diez días hábiles para subsanar la documentación.', 'La vigencia del contrato es de dos años.', 'Por la presente, solicito la baja del servicio.', 'Se hace constar que el expediente está completo.'] },
    ] },
    listen: ['Dispone de diez días hábiles para subsanar la documentación.', 'La vigencia del contrato es de dos años.', 'Por la presente, solicito la baja del servicio.', 'El otorgante firmó la escritura ante notario.', 'Su expediente está pendiente de resolución.'],
    practice: [
      mc('¿Qué verbo se usa para corregir un defecto en un trámite?', 'subsanar', ['derogar', 'caducar', 'otorgar'], 'Subsanar = corregir un defecto.', { tag: 'jurídico' }),
      mc('«Derogar» significa...', 'dejar sin vigencia una norma', ['firmar un contrato con otra empresa', 'presentar una queja ante la autoridad', 'cobrar una multa de tráfico'], 'Se derogan las normas, es decir, dejan de estar en vigor.', { tag: 'jurídico' }),
      fill('Quien incumpla la norma será ___. (sancionar, participio)', 'sancionado', 'Participio de sancionar: será sancionado.', { tag: 'jurídico' }),
      order('Por la presente solicito la baja del servicio', 'Fórmula + verbo + objeto.', { tag: 'jurídico', alts: ['Por la presente, solicito la baja del servicio'] }),
    ],
    quiz: [
      mc('Una versión clara de «Los interesados presentarán la solicitud» es...', 'Los interesados deben presentar la solicitud.', ['Los interesados presentaron la solicitud.', 'Los interesados presentando la solicitud.', 'Los interesados presenten la solicitud ayer.'], 'El futuro de mandato equivale a una obligación.', { tag: 'jurídico' }),
      mc('El «expediente» es...', 'el conjunto de documentos de un asunto', ['una sentencia dictada por un juez', 'una multa impuesta por la policía', 'una firma puesta al final de un escrito'], 'Reúne todos los papeles del trámite.', { tag: 'vocabulario' }),
      mc('Un derecho que se extingue por el paso del tiempo...', 'prescribe', ['se deroga', 'se otorga', 'se subsana'], 'Prescribir = extinguirse por tiempo.', { tag: 'jurídico' }),
      listen('La vigencia del contrato es de dos años.', 'Escucha: ¿cuánto dura el contrato?', 'Dos años', ['Un año', 'Diez días', 'Seis meses'], 'Vigencia de dos años.', { tag: 'jurídico' }),
      dict('Dispone de diez días hábiles para subsanar la documentación.', 'Revisa «hábiles» (con h) y la tilde de «días».', { tag: 'dictado' }),
      mc('Una instancia debe incluir...', 'una petición concreta, fecha y firma', ['solo un saludo cordial al inicio', 'chistes para suavizar la petición', 'abreviaturas informales como en un chat'], 'Hechos, petición, lugar, fecha y firma.', { tag: 'jurídico' }),
      match([['el otorgante', 'Quien concede o firma ante notario'], ['subsanar', 'Corregir un defecto'], ['el expediente', 'Documentos de un trámite'], ['la vigencia', 'Tiempo en que algo es válido']], 'Repasa el vocabulario jurídico.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u2.l3', level: 'C2', unit: 2, n: 3, title: 'Lenguaje periodístico', topic: 'Estilos',
    goal: 'Al terminar esta lección, podrás leer críticamente la prensa, distinguir géneros y escribir un titular y una entradilla eficaces.',
    vocab: [
      ['el titular', 'sustantivo', 'Título destacado de una noticia.', 'El titular resume la noticia en pocas palabras.', 'The headline sums up the news in a few words.'],
      ['la entradilla', 'sustantivo', 'Primer párrafo que resume lo esencial de una noticia.', 'La entradilla responde a qué, quién, cuándo y dónde.', 'The lead answers what, who, when and where.'],
      ['la crónica', 'sustantivo', 'Relato periodístico de un suceso con valoración del autor.', 'Leí una crónica del partido muy bien escrita.', 'I read a very well written report of the match.'],
      ['desmentir', 'verbo', 'Negar públicamente que algo sea cierto.', 'El gobierno desmintió los rumores.', 'The government denied the rumors.'],
      ['el sensacionalismo', 'sustantivo', 'Tendencia a exagerar las noticias para impactar.', 'El sensacionalismo sacrifica el rigor.', 'Sensationalism sacrifices rigor.'],
    ],
    explain: { title: 'Informar, opinar y leer entre titulares', body: [
      'El periodismo distingue <b>géneros informativos</b> (noticia, crónica), <b>interpretativos</b> (reportaje, análisis, entrevista) y <b>de opinión</b> (editorial, columna, artículo de opinión). Saber cuál lees determina cuánta subjetividad puedes esperar.',
      { t: 'table', head: ['Parte de la noticia', 'Función', 'Rasgos'], rows: [['Titular', 'Atrae y resume', 'Presente histórico, verbos fuertes, sin artículos a veces'], ['Entradilla', 'Resume lo esencial', 'Qué, quién, cuándo, dónde, cómo, por qué'], ['Cuerpo', 'Desarrolla', 'Pirámide invertida: de lo más a lo menos importante'], ['Cierre', 'Contexto o cita', 'Opcional']] },
      '<b>Rasgos del estilo:</b> frases breves, voz activa, precisión de cifras y fuentes, y uso del <b>presente histórico</b> en titulares: «El Congreso aprueba la ley» (hecho pasado, actualidad inmediata).',
      '<b>Atribución y distancia:</b> para no afirmar lo no confirmado, se usan fórmulas como «según fuentes cercanas», «presuntamente», «al parecer», «habría dimitido» (condicional de rumor) o «el gobierno, que niega los hechos...». El condicional de rumor y el <b>gerundio de posterioridad</b> («Se aprobó la ley, entrando en vigor hoy») son dos rasgos criticables si se abusa de ellos.',
      '<b>Lectura crítica:</b> pregúntate quién habla, qué fuentes cita, qué omite y qué verbos elige: no es lo mismo «afirma», «alega», «confiesa» o «admite». El <b>sensacionalismo</b> exagera con adjetivos («escándalo», «bomba») y titulares engañosos («clickbait»).',
      '<b>Desmentir</b> es negar públicamente; <b>rectificar</b> es corregir un error propio; <b>matizar</b> es precisar sin negar.',
      { t: 'ex', list: ['El Congreso aprueba la ley de vivienda.', 'Según fuentes cercanas, el ministro habría dimitido.', 'El gobierno desmintió los rumores.', 'El sensacionalismo sacrifica el rigor.'] },
    ] },
    listen: ['El titular resume la noticia en pocas palabras.', 'Según fuentes cercanas, el ministro habría dimitido.', 'El gobierno desmintió los rumores.', 'La entradilla responde a qué, quién, cuándo y dónde.', 'El sensacionalismo sacrifica el rigor.'],
    practice: [
      mc('La estructura de «pirámide invertida» coloca primero...', 'lo más importante', ['los detalles', 'la conclusión', 'las opiniones'], 'De lo esencial a lo accesorio.', { tag: 'periodístico' }),
      mc('«El ministro habría dimitido» indica...', 'información no confirmada', ['un hecho seguro y comprobado', 'una orden dirigida al ministro', 'un deseo de los ciudadanos'], 'Condicional de rumor.', { tag: 'periodístico' }),
      fill('El gobierno ___ los rumores. (desmentir, indefinido)', 'desmintió', 'Desmentir: e → i en 3.ª persona.', { tag: 'periodístico' }),
      order('El titular resume la noticia en pocas palabras', 'Sujeto + verbo + complemento.', { tag: 'periodístico' }),
    ],
    quiz: [
      mc('¿Qué género es un editorial?', 'de opinión', ['informativo puro', 'una entrevista', 'un anuncio'], 'Expresa la postura del medio.', { tag: 'periodístico' }),
      mc('¿Qué tiempo se usa a menudo en los titulares para un hecho pasado?', 'el presente histórico', ['el pluscuamperfecto', 'el subjuntivo', 'el futuro perfecto'], '«El Congreso aprueba...»', { tag: 'periodístico' }),
      mc('«Rectificar» significa...', 'corregir un error propio', ['negar un rumor ajeno', 'exagerar una noticia', 'citar una fuente'], 'Rectificar es corregirse.', { tag: 'periodístico' }),
      listen('Según fuentes cercanas, el ministro habría dimitido.', 'Escucha: ¿qué se afirma?', 'Que quizá el ministro dimitió, sin confirmar', ['Que el ministro dimitió con seguridad', 'Que el ministro negó todo', 'Que el ministro llegará mañana'], '«Según fuentes» y «habría» marcan distancia.', { tag: 'periodístico' }),
      dict('El gobierno desmintió los rumores.', 'Revisa la tilde de «desmintió».', { tag: 'dictado' }),
      mc('Un titular sensacionalista suele...', 'exagerar para impactar', ['citar todas las fuentes', 'evitar adjetivos', 'resumir con neutralidad'], 'Prioriza el impacto sobre el rigor.', { tag: 'periodístico' }),
      match([['el titular', 'Título destacado'], ['la entradilla', 'Primer párrafo resumen'], ['desmentir', 'Negar públicamente'], ['el sensacionalismo', 'Exagerar para impactar']], 'Repasa el vocabulario periodístico.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match } = L.Q;
  C.gloss = Object.assign(C.gloss || {}, {
    'recapitular': 'to recap; to sum up', 'la concisión': 'conciseness', 'el hilo conductor': 'common thread; main thread', 'condensar': 'to condense', 'ceñirse a': 'to stick to; to keep within',
    'refutar': 'to refute', 'la salvedad': 'caveat; qualification', 'a modo de conclusión': 'by way of conclusion', 'cabe destacar que': 'it is worth noting that', 'el planteamiento': 'approach; framing of an issue',
    'la redundancia': 'redundancy', 'el pleonasmo': 'pleonasm', 'el queísmo': 'queísmo (dropping a required «de» before «que»)', 'el dequeísmo': 'dequeísmo (adding an incorrect «de» before «que»)', 'pulir': 'to polish; to refine', 'la cacofonía': 'cacophony; harsh-sounding repetition',
    'el retintín': 'sarcastic tone; insinuating undertone', 'condescendiente': 'condescending', 'mordaz': 'biting; caustic', 'el tono': 'tone', 'el matiz': 'nuance; shade',
    'improvisar': 'to improvise', 'salir del paso': 'to get out of a tight spot; to muddle through', 'precisar': 'to specify; to state precisely', 'sobre la marcha': 'on the fly; as you go', 'dar rodeos': 'to beat around the bush',
    'mediar': 'to mediate; to intervene', 'terciar': 'to step into a discussion', 'reformular': 'to rephrase; to reformulate', 'el interlocutor': 'speaker; person one is talking to', 'ponerse en el lugar de': 'to put oneself in the shoes of'
  });

  C.addLesson({
    id: 'c2.u3.l1', level: 'C2', unit: 3, n: 1, title: 'Síntesis y paráfrasis', topic: 'Escritura avanzada',
    goal: 'Al terminar esta lección, podrás condensar un texto largo conservando sus ideas esenciales y reformularlo con tus propias palabras sin copiarlo.',
    vocab: [
      ['recapitular', 'verbo', 'Repasar de forma ordenada lo que se ha dicho antes.', 'Antes de seguir, permítanme recapitular las ideas principales.', 'Before going on, allow me to recap the main ideas.', ['resumir']],
      ['la concisión', 'sustantivo', 'Cualidad de decir mucho con pocas palabras.', 'Su informe destaca por la concisión y la claridad.', 'His report stands out for its conciseness and clarity.', ['la brevedad']],
      ['el hilo conductor', 'expresión', 'Idea o tema que une las partes de un texto o de un discurso.', 'La nostalgia es el hilo conductor de la novela.', 'Nostalgia is the common thread of the novel.'],
      ['condensar', 'verbo', 'Reducir un texto o una idea a lo esencial.', 'Logró condensar cuarenta páginas en una sola.', 'He managed to condense forty pages into one.'],
      ['ceñirse a', 'expresión', 'Limitarse estrictamente a algo, sin añadir nada más.', 'Debes ceñirte a los hechos y evitar las opiniones.', 'You must stick to the facts and avoid opinions.'],
    ],
    explain: { title: 'Resumir, sintetizar y parafrasear', body: [
      'Tres operaciones parecidas pero distintas: el <b>resumen</b> reduce el texto manteniendo su orden; la <b>síntesis</b> reorganiza las ideas esenciales en un texto nuevo, a veces a partir de varias fuentes; la <b>paráfrasis</b> dice lo mismo con otras palabras, sin reducir necesariamente la extensión.',
      { t: 'table', head: ['Operación', 'Extensión', 'Orden de ideas', 'Voz'], rows: [['Resumen', 'Mucho más corto', 'El del original', 'Propia, fiel al autor (suele usarse la tercera persona)'], ['Síntesis', 'Corto', 'Nuevo, según tu criterio', 'Propia, integra varias fuentes'], ['Paráfrasis', 'Similar', 'El del original', 'Propia, con otras palabras']] },
      '<b>Método en cuatro pasos:</b> (1) leer y subrayar la idea central de cada párrafo; (2) detectar el <b>hilo conductor</b>; (3) eliminar ejemplos, repeticiones y adornos; (4) redactar con tus palabras y comprobar que no has añadido opiniones propias.',
      'Una paráfrasis no consiste en cambiar una palabra por su sinónimo. Hay que <b>cambiar la estructura</b>: voz activa por pasiva, verbo por sustantivo (nominalización), oración principal por subordinada.',
      { t: 'table', head: ['Original', 'Paráfrasis'], rows: [['El ministro anunció que reducirá los impuestos.', 'La reducción de impuestos fue anunciada por el ministro.'], ['Aunque llovía, salimos.', 'A pesar de la lluvia, salimos.'], ['Cuando terminó la reunión, se marcharon.', 'Al terminar la reunión, se marcharon.']] },
      'Conectores útiles al sintetizar: <b>en suma</b>, <b>en definitiva</b>, <b>en resumidas cuentas</b>, <b>a modo de síntesis</b>. Para atribuir ideas: «según el autor», «el texto sostiene que», «la autora subraya que».',
      { t: 'ex', list: ['El texto sostiene que la ciudad debe reducir el tráfico.', 'En definitiva, el autor defiende una solución gradual.', 'Conviene ceñirse a las ideas esenciales.', 'Condensó el artículo en tres líneas.'] },
    ] },
    listen: ['Antes de seguir, permítanme recapitular las ideas principales.', 'Su informe destaca por la concisión y la claridad.', 'La nostalgia es el hilo conductor de la novela.', 'Debes ceñirte a los hechos y evitar las opiniones.', 'En definitiva, el autor defiende una solución gradual.'],
    practice: [
      mc('¿Qué operación reorganiza las ideas esenciales de varias fuentes con tu criterio?', 'La síntesis', ['La paráfrasis', 'La copia', 'La cita literal'], 'La síntesis integra y reordena.', { tag: 'síntesis' }),
      mc('Una buena paráfrasis...', 'cambia la estructura además de las palabras', ['solo cambia un sinónimo del original', 'copia el original palabra por palabra', 'añade opiniones propias del autor'], 'Cambiar solo sinónimos no basta.', { tag: 'síntesis' }),
      fill('«Aunque llovía, salimos» → «A ___ de la lluvia, salimos». (locución concesiva)', 'pesar', 'A pesar de + sustantivo.', { tag: 'síntesis' }),
      order('Debes ceñirte a los hechos', 'Deber + ceñirse a + sustantivo.', { tag: 'síntesis' }),
    ],
    quiz: [
      mc('«Al terminar la reunión» es una paráfrasis de...', 'Cuando terminó la reunión', ['Si termina la reunión', 'Porque terminó la reunión', 'Aunque terminó la reunión'], 'Al + infinitivo equivale a una temporal con «cuando».', { tag: 'síntesis' }),
      mc('¿Qué conector introduce una síntesis final?', 'En definitiva', ['Por ejemplo', 'Por otro lado', 'Además'], 'En definitiva = en conclusión.', { tag: 'síntesis' }),
      mc('El «hilo conductor» de un texto es...', 'el tema que une sus partes', ['su título en la portada', 'su primera frase del párrafo inicial', 'su autor y la fecha de publicación'], 'Es la idea que recorre todo el texto.', { tag: 'vocabulario' }),
      listen('Su informe destaca por la concisión y la claridad.', 'Escucha: ¿qué cualidad se elogia?', 'Que es breve y claro', ['Que es muy largo', 'Que tiene muchos ejemplos', 'Que es muy técnico'], 'Concisión = decir mucho con pocas palabras.', { tag: 'síntesis' }),
      dict('Logró condensar cuarenta páginas en una sola.', 'Revisa la tilde de «páginas».', { tag: 'dictado' }),
      mc('¿Cuál NO es propio de un resumen?', 'Añadir tu opinión personal', ['Mantener el orden original', 'Eliminar los ejemplos', 'Usar tercera persona'], 'El resumen se ciñe al texto.', { tag: 'síntesis' }),
      match([['recapitular', 'Repasar lo dicho'], ['la concisión', 'Decir mucho con pocas palabras'], ['condensar', 'Reducir a lo esencial'], ['ceñirse a', 'Limitarse estrictamente a']], 'Repasa el vocabulario de la síntesis.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u3.l2', level: 'C2', unit: 3, n: 2, title: 'Texto argumentativo extenso', topic: 'Escritura avanzada',
    goal: 'Al terminar esta lección, podrás construir un texto argumentativo largo con tesis, argumentos, contraargumentos, salvedades y conclusión.',
    vocab: [
      ['refutar', 'verbo', 'Demostrar que una idea o argumento es falso o erróneo.', 'Los datos refutan la hipótesis inicial.', 'The data refute the initial hypothesis.', ['rebatir']],
      ['la salvedad', 'sustantivo', 'Limitación o excepción que se añade a lo que se afirma.', 'Estoy de acuerdo, con una salvedad.', 'I agree, with one caveat.'],
      ['a modo de conclusión', 'expresión', 'Fórmula para introducir el cierre de un texto.', 'A modo de conclusión, conviene insistir en la prevención.', 'By way of conclusion, it is worth stressing prevention.'],
      ['cabe destacar que', 'expresión', 'Fórmula formal para subrayar un dato importante.', 'Cabe destacar que el estudio incluyó a mil personas.', 'It is worth noting that the study included a thousand people.'],
      ['el planteamiento', 'sustantivo', 'Modo de enfocar o presentar un problema.', 'Su planteamiento del problema resulta muy original.', 'His way of framing the problem is very original.', ['el enfoque']],
    ],
    explain: { title: 'Arquitectura de un texto argumentativo largo', body: [
      'Un texto argumentativo extenso no es una lista de opiniones: es una <b>construcción</b> en la que cada párrafo cumple una función. La estructura clásica es: <b>introducción</b> (contexto y tesis), <b>desarrollo</b> (argumentos y contraargumentos) y <b>conclusión</b>.',
      { t: 'table', head: ['Parte', 'Función', 'Fórmulas útiles'], rows: [['Introducción', 'Plantear el tema y la tesis', 'Resulta innegable que... / En el presente texto se sostiene que...'], ['Argumento', 'Apoyar la tesis con razones y datos', 'En primer lugar... / Cabe destacar que... / A ello se suma...'], ['Contraargumento', 'Reconocer la postura contraria', 'Es cierto que... / Podría objetarse que... / Se alega a menudo que...'], ['Refutación', 'Rebatir la objeción', 'Sin embargo... / No obstante... / Esta objeción pasa por alto que...'], ['Conclusión', 'Cerrar y reafirmar la tesis', 'A modo de conclusión... / En definitiva... / Por todo ello...']] },
      '<b>La concesión estratégica</b> refuerza tu credibilidad: «Es cierto que la medida tiene costes; sin embargo, sus beneficios los superan». Admitir un punto no debilita el argumento; lo hace más honesto y más difícil de atacar.',
      'Los <b>tipos de argumento</b> más habituales: de autoridad («según la OMS»), de datos («el 62 % de...»), de ejemplo, de causa-efecto y por analogía. Cuidado con las <b>falacias</b>: el ataque personal (<i>ad hominem</i>), la generalización apresurada y la falsa disyuntiva («o estás conmigo o contra mí»).',
      '<b>Cohesión:</b> usa conectores de adición (además, asimismo), contraste (no obstante, ahora bien), causa (puesto que, dado que), consecuencia (de ahí que + subjuntivo, por consiguiente) y cierre (en suma).',
      { t: 'ex', list: ['Estoy de acuerdo con el planteamiento, con una salvedad.', 'Podría objetarse que la medida es cara; sin embargo, el coste de no actuar es mayor.', 'Los datos refutan esa hipótesis.', 'A modo de conclusión, se impone una reforma gradual.'] },
    ] },
    listen: ['Estoy de acuerdo con el planteamiento, con una salvedad.', 'Los datos refutan la hipótesis inicial.', 'Cabe destacar que el estudio incluyó a mil personas.', 'Es cierto que la medida es cara; sin embargo, es necesaria.', 'A modo de conclusión, se impone una reforma gradual.'],
    practice: [
      mc('«Es cierto que... ; sin embargo...» es una estructura de...', 'concesión y refutación', ['causa y efecto entre dos hechos', 'ejemplo que ilustra una idea', 'conclusión final del texto'], 'Concedes un punto y lo rebates.', { tag: 'argumentación' }),
      mc('Atacar a la persona en lugar de a su argumento es una falacia...', 'ad hominem', ['de autoridad', 'de datos', 'de ejemplo'], 'Ad hominem = contra la persona.', { tag: 'argumentación' }),
      fill('Estoy de acuerdo, pero con una ___. (limitación)', ['salvedad', 'reserva', 'limitación', 'excepción'], 'Una salvedad es una excepción o reserva.', { tag: 'argumentación' }),
      order('A modo de conclusión se impone una reforma', 'Fórmula de cierre + verbo + sujeto.', { tag: 'argumentación', alts: ['A modo de conclusión, se impone una reforma'] }),
    ],
    quiz: [
      mc('¿Dónde se formula normalmente la tesis?', 'En la introducción', ['Solo en la conclusión', 'En los ejemplos', 'En la bibliografía'], 'La tesis se plantea al inicio.', { tag: 'argumentación' }),
      mc('«O estás conmigo o contra mí» es una...', 'falsa disyuntiva', ['concesión que reconoce algo al otro', 'paráfrasis de otra idea anterior', 'salvedad que matiza lo dicho'], 'Reduce un asunto complejo a solo dos opciones.', { tag: 'argumentación' }),
      mc('¿Qué conector expresa consecuencia con subjuntivo?', 'de ahí que', ['puesto que', 'aunque', 'por ejemplo'], 'De ahí que + subjuntivo.', { tag: 'argumentación' }),
      listen('Cabe destacar que el estudio incluyó a mil personas.', 'Escucha: ¿qué se subraya?', 'El tamaño de la muestra del estudio', ['El precio del estudio', 'La duración de la entrevista', 'El nombre del autor'], 'Destaca que participaron mil personas.', { tag: 'argumentación' }),
      dict('Podría objetarse que la medida es cara.', 'Revisa la «j» de «objetarse».', { tag: 'dictado' }),
      mc('«Refutar» significa...', 'demostrar que algo es erróneo', ['repetir un argumento ya dado', 'resumir un texto largo', 'citar a un experto en la materia'], 'Refutar = rebatir con razones.', { tag: 'vocabulario' }),
      match([['refutar', 'Demostrar que es falso'], ['la salvedad', 'Limitación que se añade'], ['el planteamiento', 'Modo de enfocar un problema'], ['a modo de conclusión', 'Fórmula de cierre']], 'Repasa el vocabulario argumentativo.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u3.l3', level: 'C2', unit: 3, n: 3, title: 'Corrección y estilo', topic: 'Escritura avanzada',
    goal: 'Al terminar esta lección, podrás revisar un texto, detectar redundancias, queísmo, dequeísmo y cacofonías, y pulir el estilo.',
    vocab: [
      ['la redundancia', 'sustantivo', 'Repetición innecesaria de una idea o una palabra.', 'Esa frase contiene una redundancia evidente.', 'That sentence contains an obvious redundancy.'],
      ['el pleonasmo', 'sustantivo', 'Uso de palabras innecesarias que repiten el sentido; a veces se admite con valor expresivo.', '«Subir arriba» es un pleonasmo.', '"Subir arriba" (literally "to go up up") is a pleonasm.'],
      ['el queísmo', 'sustantivo', 'Error de omitir la preposición «de» cuando la exige el verbo o la expresión.', '«Me alegro que vengas» es un caso de queísmo.', '"Me alegro que vengas" is a case of queísmo.'],
      ['el dequeísmo', 'sustantivo', 'Error de añadir «de» ante «que» cuando no corresponde.', '«Pienso de que tienes razón» es dequeísmo.', '"Pienso de que tienes razón" is dequeísmo.'],
      ['pulir', 'verbo', 'Mejorar un texto eliminando defectos y afinando la expresión.', 'Pasé la tarde puliendo el último párrafo.', 'I spent the afternoon polishing the last paragraph.'],
      ['la cacofonía', 'sustantivo', 'Sonido desagradable por la repetición de sílabas o sonidos parecidos.', 'La repetición de «-ción» produce cacofonía.', 'The repetition of "-ción" produces cacophony.'],
    ],
    explain: { title: 'Revisar un texto: errores frecuentes y estilo', body: [
      'Revisar es una fase distinta de escribir. Conviene hacerlo en <b>tres pasadas</b>: (1) contenido y estructura; (2) gramática, ortografía y puntuación; (3) estilo y sonoridad, leyendo en voz alta.',
      { t: 'table', head: ['Error', 'Incorrecto', 'Correcto', 'Truco'], rows: [['Queísmo', 'Me alegro que vengas.', 'Me alegro de que vengas.', 'Pregunta: ¿de qué me alegro? → de eso'], ['Dequeísmo', 'Pienso de que es tarde.', 'Pienso que es tarde.', 'Pregunta: ¿qué pienso? → eso (sin «de»)'], ['Queísmo', 'Estoy seguro que ganará.', 'Estoy seguro de que ganará.', '¿De qué estoy seguro? → de eso'], ['Dequeísmo', 'Dijo de que vendría.', 'Dijo que vendría.', 'Decir no lleva «de» ante «que»']] },
      'La <b>redundancia</b> debilita el texto: «volver a repetir», «lapso de tiempo», «accidente fortuito», «completamente lleno». Hay pleonasmos aceptados con valor expresivo: «lo vi con mis propios ojos».',
      'Otros defectos de estilo: la <b>cacofonía</b> («la realización de la tramitación de la solicitud»), el abuso del gerundio («Se aprobó la ley, entrando en vigor mañana» → «...y entrará en vigor mañana»), la <b>voz pasiva excesiva</b> y las <b>frases interminables</b>.',
      '<b>Estilo:</b> prefiere el verbo concreto al comodín («hacer», «poner», «tener»): «hacer una crítica» → «criticar»; «dar comienzo» → «comenzar». Alterna frases largas y cortas para dar ritmo y evita repetir la misma palabra en una línea (usa sinónimos o pronombres).',
      { t: 'ex', list: ['Me alegro de que vengas.', 'Pienso que tienes razón.', 'Estoy seguro de que ganará.', 'Pasé la tarde puliendo el último párrafo.'] },
    ] },
    listen: ['Me alegro de que vengas.', 'Pienso que tienes razón.', 'Estoy seguro de que ganará.', 'Subir arriba es un pleonasmo.', 'Pasé la tarde puliendo el último párrafo.'],
    practice: [
      mc('¿Cuál es correcta?', 'Me alegro de que vengas.', ['Me alegro que vengas.', 'Me alegro de qué vengas.', 'Me alegro de de que vengas.'], 'Alegrarse de algo → alegrarse de que.', { tag: 'corrección' }),
      mc('¿Cuál es correcta?', 'Pienso que es tarde.', ['Pienso de que es tarde.', 'Pienso de qué es tarde.', 'Pienso el que es tarde.'], 'Pensar no lleva «de» ante «que».', { tag: 'corrección' }),
      fill('Estoy seguro ___ que ganará. (preposición)', 'de', 'Estar seguro de que.', { tag: 'corrección' }),
      order('Pasé la tarde puliendo el texto', 'Verbo + complemento de tiempo + gerundio.', { tag: 'corrección' }),
    ],
    quiz: [
      mc('«Subir arriba» es...', 'un pleonasmo', ['un queísmo', 'un dequeísmo', 'una metáfora'], 'Subir ya implica «arriba».', { tag: 'corrección' }),
      mc('«Dijo de que vendría» es un caso de...', 'dequeísmo', ['queísmo', 'pleonasmo', 'cacofonía'], 'Sobra «de».', { tag: 'corrección' }),
      mc('¿Qué versión es más precisa y elegante?', 'Criticó la medida.', ['Hizo una crítica sobre la medida.', 'Realizó la acción de criticar la medida.', 'Dio lugar a la crítica de la medida.'], 'Prefiere el verbo concreto al comodín.', { tag: 'corrección' }),
      listen('Estoy seguro de que ganará.', 'Escucha: ¿qué expresa la persona?', 'Seguridad sobre un resultado', ['Duda sobre una fecha', 'Una queja', 'Una petición'], 'Está seguro de que ganará.', { tag: 'corrección' }),
      dict('Me alegro de que vengas.', 'No olvides «de» antes de «que».', { tag: 'dictado' }),
      mc('Una buena revisión de estilo incluye...', 'leer el texto en voz alta', ['alargar todas las frases', 'repetir las palabras clave siempre', 'evitar la puntuación'], 'La lectura en voz alta revela la cacofonía.', { tag: 'corrección' }),
      match([['la redundancia', 'Repetición innecesaria'], ['el queísmo', 'Omitir «de» indebidamente'], ['el dequeísmo', 'Añadir «de» indebidamente'], ['pulir', 'Mejorar y afinar el texto']], 'Repasa el vocabulario de corrección.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u4.l1', level: 'C2', unit: 4, n: 1, title: 'Interpretar el tono', topic: 'Dominio del discurso',
    goal: 'Al terminar esta lección, podrás interpretar la ironía, el sarcasmo y las intenciones implícitas a partir del tono, el contexto y la elección de palabras.',
    vocab: [
      ['el retintín', 'sustantivo', 'Tono malicioso con que se dice algo para insinuar otra cosa.', 'Lo dijo con un retintín que no me gustó nada.', 'He said it with a snide tone that I did not like at all.'],
      ['condescendiente', 'adjetivo', 'Que trata a los demás como inferiores, con amabilidad forzada.', 'Me habló en un tono condescendiente.', 'He spoke to me in a condescending tone.'],
      ['mordaz', 'adjetivo', 'Que critica con ironía y dureza.', 'Escribió una crítica mordaz del estreno.', 'He wrote a biting review of the premiere.', ['cáustico']],
      ['el tono', 'sustantivo', 'Actitud o intención que se percibe en la forma de decir algo.', 'No me gusta el tono de tu mensaje.', 'I do not like the tone of your message.'],
      ['el matiz', 'sustantivo', 'Diferencia pequeña pero significativa en el sentido o la intención.', 'Hay un matiz de reproche en su frase.', 'There is a nuance of reproach in his sentence.'],
    ],
    explain: { title: 'Leer lo que no se dice', body: [
      'En la comunicación real, el significado literal es solo una parte. El <b>tono</b> revela la actitud del hablante: afecto, enfado, burla, desdén, cortesía fría. Interpretarlo exige combinar tres fuentes: <b>las palabras</b>, <b>el contexto</b> y, en la voz, <b>la entonación y las pausas</b>.',
      { t: 'table', head: ['Frase', 'Lectura literal', 'Lectura según el tono'], rows: [['«Qué buena idea, sí señor.»', 'Elogio', 'Con retintín: crítica; la idea es mala'], ['«Menos mal que has venido a tiempo.»', 'Alivio', 'Irónico, si llegó tarde: reproche'], ['«No tengo nada en contra.»', 'Neutralidad', 'Con reservas: no apoya, pero no se opone'], ['«Si tú lo dices...»', 'Aceptar lo dicho', 'Duda o desacuerdo velado']] },
      '<b>Ironía</b> (decir lo contrario de lo que se piensa) frente a <b>sarcasmo</b> (ironía hiriente, con voluntad de ofender) y <b>humor</b> (sin intención de herir). La línea entre ellos depende del contexto y de la relación entre los interlocutores.',
      'Pistas escritas del tono: <b>comillas irónicas</b> («su “generosa” oferta»), <b>puntos suspensivos</b>, adverbios de énfasis («francamente»), diminutivos despectivos, y la elección entre sinónimos («es prudente» frente a «es cobarde»).',
      '<b>Cortesía como estrategia:</b> los eufemismos y los atenuantes («quizá», «un poco», «tal vez») suavizan una crítica. Pero una cortesía excesiva puede resultar <b>condescendiente</b>. Al responder, identifica el tono antes de reaccionar al contenido.',
      { t: 'ex', list: ['Lo dijo con retintín.', 'Su comentario fue mordaz, pero no llegó a ser ofensivo.', 'Hay un matiz de reproche en esa frase.', '«Si tú lo dices...» suele expresar desacuerdo.'] },
    ] },
    listen: ['Lo dijo con un retintín que no me gustó nada.', 'Me habló en un tono condescendiente.', 'Escribió una crítica mordaz del estreno.', 'No me gusta el tono de tu mensaje.', 'Hay un matiz de reproche en su frase.'],
    practice: [
      mc('«Qué buena idea, sí señor», dicho con retintín, expresa...', 'una crítica', ['un elogio sincero', 'una pregunta', 'una invitación'], 'El retintín invierte el sentido.', { tag: 'tono' }),
      mc('La ironía hiriente con voluntad de ofender se llama...', 'sarcasmo', ['humor', 'eufemismo', 'cortesía'], 'Sarcasmo = ironía cruel.', { tag: 'tono' }),
      fill('Lo dijo con un ___ que no me gustó. (tono malicioso)', 'retintín', 'Retintín = tono de insinuación.', { tag: 'tono' }),
      order('No me gusta el tono de tu mensaje', 'Negación + verbo + sujeto.', { tag: 'tono' }),
    ],
    quiz: [
      mc('«Si tú lo dices...» suele expresar...', 'duda o desacuerdo velado', ['entusiasmo por lo que se oye', 'agradecimiento por la información', 'una orden dada con claridad'], 'Es una aceptación solo aparente.', { tag: 'tono' }),
      mc('Las comillas en su «generosa» oferta indican...', 'ironía', ['una cita textual', 'énfasis positivo', 'un título'], 'Comillas irónicas.', { tag: 'tono' }),
      mc('Un trato «condescendiente» es...', 'el de quien se cree superior', ['el de un amigo íntimo', 'el de un experto neutral', 'el de alguien tímido'], 'Condescendiente = con aire de superioridad.', { tag: 'vocabulario' }),
      listen('Me habló en un tono condescendiente.', 'Escucha: ¿cómo le habló?', 'Como si fuera inferior', ['Con mucha rabia', 'Con alegría', 'En voz muy baja'], 'Condescendiente = con superioridad.', { tag: 'tono' }),
      dict('Hay un matiz de reproche en su frase.', 'Revisa la tilde de «matiz» (no lleva) y la «z» final.', { tag: 'dictado' }),
      mc('Para interpretar un tono hay que combinar...', 'palabras, contexto y entonación', ['solo las palabras que se dicen', 'solo la gramática de la frase', 'solo el diccionario de la lengua'], 'Tres fuentes de información.', { tag: 'tono' }),
      match([['el retintín', 'Tono malicioso'], ['mordaz', 'Crítico con ironía dura'], ['condescendiente', 'Trata como inferior'], ['el matiz', 'Pequeña diferencia de sentido']], 'Repasa el vocabulario del tono.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u4.l2', level: 'C2', unit: 4, n: 2, title: 'Improvisar con precisión', topic: 'Dominio del discurso',
    goal: 'Al terminar esta lección, podrás hablar sin preparación con orden, evitar rodeos y ganar tiempo sin perder precisión.',
    vocab: [
      ['improvisar', 'verbo', 'Hablar o actuar sin preparación previa.', 'Me pidieron que improvisara unas palabras de agradecimiento.', 'They asked me to improvise a few words of thanks.'],
      ['salir del paso', 'expresión', 'Resolver con recursos limitados una situación comprometida.', 'No sabía la respuesta, pero salí del paso con una anécdota.', 'I did not know the answer, but I got by with an anecdote.'],
      ['precisar', 'verbo', 'Expresar algo con exactitud, sin dejar dudas.', 'Conviene precisar a qué fecha nos referimos.', 'We should specify which date we are referring to.', ['concretar']],
      ['sobre la marcha', 'expresión', 'Mientras se hace algo, sin plan previo.', 'Fuimos corrigiendo los errores sobre la marcha.', 'We corrected the mistakes as we went along.'],
      ['dar rodeos', 'expresión', 'Evitar ir directamente al asunto principal.', 'Deja de dar rodeos y dime qué ha pasado.', 'Stop beating around the bush and tell me what happened.', ['andarse por las ramas']],
    ],
    explain: { title: 'Hablar sin guion', body: [
      'Improvisar bien no es hablar sin pensar, sino <b>pensar mientras se habla</b> con una estructura mínima en la cabeza. Un esquema muy útil es <b>posición – razón – ejemplo – cierre</b>: «Creo que... porque... Por ejemplo... Por eso...».',
      { t: 'table', head: ['Necesidad', 'Fórmulas'], rows: [['Ganar tiempo', 'Es una buena pregunta. / Déjeme pensarlo un momento. / Dicho de otro modo...'], ['Estructurar', 'Hay tres aspectos: primero..., segundo..., y por último...'], ['Precisar', 'Más exactamente... / Para ser más precisos... / Me refiero concretamente a...'], ['Corregirte', 'Mejor dicho... / O, más bien... / Perdón, quería decir...'], ['Cerrar', 'En resumen... / Con esto quiero decir que... / Y eso es todo lo esencial.']] },
      '<b>Muletillas</b> como «o sea», «eh», «¿vale?» o «digamos» sirven un instante, pero abusar de ellas resta autoridad. Sustitúyelas por <b>pausas breves</b>, que dan la impresión de reflexión.',
      '<b>Precisión léxica:</b> cuando no recuerdas una palabra, no te detengas; usa una <b>perífrasis</b> («lo que sirve para cortar papel» = tijeras) o un sinónimo cercano, y avanza. Un hablante maduro compensa con recursos, no con silencios.',
      'Para <b>evitar rodeos</b>, di primero la idea principal y después los detalles («La conclusión es esta: ...»). Los rodeos, en cambio, retrasan el mensaje y desorientan.',
      { t: 'ex', list: ['Es una buena pregunta; déjeme pensarlo un momento.', 'Mejor dicho, me refiero concretamente al segundo punto.', 'Corregimos los errores sobre la marcha.', 'Deja de dar rodeos y ve al grano.'] },
    ] },
    listen: ['Es una buena pregunta; déjeme pensarlo un momento.', 'Mejor dicho, me refiero concretamente al segundo punto.', 'Fuimos corrigiendo los errores sobre la marcha.', 'Deja de dar rodeos y dime qué ha pasado.', 'No sabía la respuesta, pero salí del paso con una anécdota.'],
    practice: [
      mc('¿Qué esquema sirve para improvisar con orden?', 'Posición, razón, ejemplo y cierre', ['Solo anécdotas sin relación entre sí', 'Muletillas seguidas hasta terminar', 'Silencio y disculpas constantes'], 'Una estructura mínima organiza el discurso.', { tag: 'improvisación' }),
      mc('Para corregirte mientras hablas dices...', 'Mejor dicho...', ['Por ejemplo...', 'Además...', 'Por cierto...'], 'Mejor dicho = rectificación.', { tag: 'improvisación' }),
      fill('Fuimos corrigiendo los errores sobre la ___. (mientras se hacía)', 'marcha', 'Sobre la marcha = sin plan previo.', { tag: 'improvisación' }),
      order('Deja de dar rodeos y ve al grano', 'Imperativo + imperativo.', { tag: 'improvisación' }),
    ],
    quiz: [
      mc('Si no recuerdas una palabra, lo mejor es...', 'usar una perífrasis y continuar', ['callarte hasta recordarla bien', 'cambiar de tema de golpe', 'pedir disculpas varias veces seguidas'], 'Compensa con recursos.', { tag: 'improvisación' }),
      mc('«Dar rodeos» significa...', 'evitar ir al asunto principal', ['hablar muy alto para ser oído', 'ser muy preciso y directo', 'resumir el asunto en una frase'], 'Rodeo = camino indirecto.', { tag: 'vocabulario' }),
      mc('¿Cuál es una fórmula para ganar tiempo?', 'Es una buena pregunta; déjeme pensarlo.', ['No pienso responder a esa pregunta.', 'Eso ya lo dije hace un buen rato.', 'Siguiente pregunta, por favor, rápido.'], 'Permite pensar con naturalidad.', { tag: 'improvisación' }),
      listen('Mejor dicho, me refiero concretamente al segundo punto.', 'Escucha: ¿qué hace la persona?', 'Se corrige y precisa', ['Cambia de tema', 'Se despide', 'Hace una pregunta'], 'Mejor dicho = rectifica; concretamente = precisa.', { tag: 'improvisación' }),
      dict('Déjeme pensarlo un momento.', 'Revisa la tilde de «Déjeme».', { tag: 'dictado' }),
      mc('Abusar de las muletillas...', 'resta autoridad al hablante', ['aumenta la claridad', 'es siempre obligatorio', 'sustituye a los argumentos'], 'Mejor usar pausas breves.', { tag: 'improvisación' }),
      match([['improvisar', 'Hablar sin preparación'], ['precisar', 'Expresar con exactitud'], ['salir del paso', 'Resolver con pocos recursos'], ['sobre la marcha', 'Sin plan previo']], 'Repasa el vocabulario de la improvisación.', { tag: 'vocabulario' }),
    ],
  });

  C.addLesson({
    id: 'c2.u4.l3', level: 'C2', unit: 4, n: 3, title: 'Mediar entre registros', topic: 'Dominio del discurso',
    goal: 'Al terminar esta lección, podrás adaptar un mismo mensaje a distintos registros y mediar entre interlocutores con códigos lingüísticos diferentes.',
    vocab: [
      ['mediar', 'verbo', 'Intervenir entre dos partes para acercar sus posturas.', 'Mi tía medió en la discusión familiar.', 'My aunt mediated in the family argument.'],
      ['terciar', 'verbo', 'Intervenir en una conversación o discusión ajena.', 'Terció para aclarar un malentendido.', 'He stepped in to clear up a misunderstanding.'],
      ['reformular', 'verbo', 'Decir de nuevo algo con otra forma para que se entienda mejor.', 'Permítame reformular la pregunta.', 'Let me rephrase the question.'],
      ['el interlocutor', 'sustantivo', 'Persona con la que se habla en una conversación.', 'Adapta tu lenguaje a tu interlocutor.', 'Adapt your language to the person you are talking to.'],
      ['ponerse en el lugar de', 'expresión', 'Imaginar la situación de otra persona para comprenderla.', 'Intenta ponerte en el lugar de tu cliente.', 'Try to put yourself in your client\'s shoes.'],
    ],
    explain: { title: 'Mediar: traducir de un registro a otro', body: [
      'Un hablante maestro no solo domina varios registros: puede <b>trasladar un mismo mensaje</b> de uno a otro según el <b>interlocutor</b>, la <b>situación</b> y el <b>canal</b>. Mediar es, en parte, traducir dentro de la misma lengua.',
      { t: 'table', head: ['Registro', 'Ejemplo del mismo mensaje'], rows: [['Coloquial', 'Oye, que no puedo ir, se me ha complicado el día.'], ['Neutro', 'No podré asistir porque he tenido un imprevisto.'], ['Formal', 'Lamento comunicarle que no podré asistir por motivos imprevistos.'], ['Administrativo', 'Se comunica la imposibilidad de asistir por causa sobrevenida.']] },
      '<b>Qué cambia al subir de registro:</b> el trato (tú → usted), el léxico (coche → vehículo), las construcciones (voz pasiva, impersonales, nominalizaciones) y los marcadores de cortesía. <b>Al bajarlo:</b> frases más cortas, vocabulario común, ejemplos concretos y menos subordinación.',
      '<b>Mediar entre personas:</b> (1) escuchar a ambas partes; (2) <b>reformular</b> lo que cada una dice, sin juicios («Si lo he entendido bien, lo que te preocupa es...»); (3) separar los hechos de las emociones; (4) proponer un punto común.',
      '<b>Fórmulas de mediación:</b> «Permítame reformular...», «Creo que ambos coinciden en...», «Quizá convenga distinguir entre...», «¿Podríamos empezar por lo que nos une?». Evita el «tú siempre...» y el «usted nunca...».',
      'La <b>empatía lingüística</b> consiste en ponerse en el lugar del otro: explicar un término técnico a un lego sin <b>condescendencia</b> y adaptar tu léxico a su nivel, pero sin simplificar el contenido.',
      { t: 'ex', list: ['Permítame reformular la pregunta.', 'Creo que ambos coinciden en lo esencial.', 'Terció para aclarar el malentendido.', 'Intenta ponerte en el lugar de tu cliente.'] },
    ] },
    listen: ['Permítame reformular la pregunta.', 'Adapta tu lenguaje a tu interlocutor.', 'Terció para aclarar un malentendido.', 'Intenta ponerte en el lugar de tu cliente.', 'Si lo he entendido bien, lo que te preocupa es el plazo.'],
    practice: [
      mc('¿Cuál es la versión más formal de «No puedo ir, se me ha complicado el día»?', 'Lamento comunicarle que no podré asistir por motivos imprevistos.', ['Oye, que no voy a ir, lo siento mucho.', 'No puedo ir, qué rollo de verdad.', 'Paso de ir, tío, me ha surgido otro plan.'], 'Trato de usted y léxico formal.', { tag: 'registro' }),
      mc('Al bajar de registro conviene...', 'usar frases más cortas y vocabulario común', ['usar más voz pasiva que antes', 'añadir tecnicismos y términos cultos', 'alargar las frases con subordinadas'], 'Se simplifica la forma, no el contenido.', { tag: 'registro' }),
      fill('Permítame ___ la pregunta. (decirla de otra forma)', 'reformular', 'Reformular = decir de nuevo con otra forma.', { tag: 'registro' }),
      order('Adapta tu lenguaje a tu interlocutor', 'Imperativo + complemento + a + destinatario.', { tag: 'registro' }),
    ],
    quiz: [
      mc('¿Qué hace un mediador?', 'Acerca las posturas de dos partes', ['Decide quién tiene la razón al final', 'Se pone siempre de un lado concreto', 'Evita hablar con las dos partes'], 'Mediar = intervenir entre dos partes.', { tag: 'registro' }),
      mc('«Si lo he entendido bien, lo que te preocupa es...» es una forma de...', 'reformular sin juzgar', ['dar una orden', 'rechazar', 'interrumpir con enfado'], 'Muestra escucha activa.', { tag: 'registro' }),
      mc('¿Qué opción es una nominalización propia de un registro administrativo?', 'la imposibilidad de asistir', ['no poder venir a la reunión', 'que no puedo ir a la cita', 'no me va bien ir hoy'], 'Verbo → sustantivo abstracto.', { tag: 'registro' }),
      listen('Si lo he entendido bien, lo que te preocupa es el plazo.', 'Escucha: ¿qué hace el hablante?', 'Reformula la preocupación del otro', ['Rechaza el plazo', 'Pide más dinero', 'Cambia de tema'], 'Reformula lo que ha oído.', { tag: 'registro' }),
      dict('Terció para aclarar un malentendido.', 'Revisa la tilde de «Terció».', { tag: 'dictado' }),
      mc('«Ponerse en el lugar de alguien» es...', 'imaginar su situación para comprenderla', ['darle la razón siempre sin pensar', 'ocupar su puesto de trabajo', 'repetir sus palabras tal cual'], 'Empatía.', { tag: 'vocabulario' }),
      match([['mediar', 'Acercar a dos partes'], ['terciar', 'Intervenir en una discusión'], ['reformular', 'Decir de otra forma'], ['el interlocutor', 'Persona con quien se habla']], 'Repasa el vocabulario de la mediación.', { tag: 'vocabulario' }),
    ],
  });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C; C.enHelp = C.enHelp || {};
  const add = (id, title, lines) => { C.enHelp[id] = { title, lines }; };
  add('a1.u1.l1', 'Greetings: in simple words', [
    'Spanish greetings change with the time of day: <b>Buenos días</b> (morning), <b>Buenas tardes</b> (afternoon), <b>Buenas noches</b> (evening and night). <b>Hola</b> works at any time.',
    'There are two ways to say “you”: <b>tú</b> for friends, family and children (informal) and <b>usted</b> for older people and formal situations (polite).',
    'A question starts with <b>¿</b> and ends with <b>?</b>. Example: ¿Cómo estás? = How are you?',
    'Answers: <b>Muy bien, gracias</b> = very well, thank you. <b>Así, así</b> = so-so.']);
  add('a1.u1.l2', 'The verb “ser” (to be): in simple words', [
    '<b>Ser</b> = “to be”. Use it for who you are: your name, where you are from, your job.',
    'Forms: <b>yo soy</b> (I am), <b>tú eres</b> (you are), <b>él/ella/usted es</b> (he/she/you are), <b>nosotros somos</b> (we are), <b>vosotros sois</b> (you all are, Spain), <b>ellos/ustedes son</b> (they/you all are).',
    'Useful questions: ¿Cómo te llamas? (What is your name?) · ¿De dónde eres? (Where are you from?) · ¿Dónde vives? (Where do you live?)',
    'Careful: for your name say <b>Me llamo Ana</b> (literally “I call myself Ana”), not “soy llamo”.']);
  add('a1.u1.l3', 'Numbers 0–100: in simple words', [
    'Learn 0–20 by heart: cero, uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez, once, doce, trece, catorce, quince, dieciséis, diecisiete, dieciocho, diecinueve, veinte.',
    '21–29 are one word: veintiuno, veintidós, veintitrés… From 31 use <b>y</b> (and): treinta <b>y</b> uno = 31.',
    'The tens: treinta (30), cuarenta (40), cincuenta (50), sesenta (60), setenta (70), ochenta (80), noventa (90), cien (100).',
    'Age: ¿Cuántos años tienes? → Tengo veinte años (literally “I have twenty years”).']);
  add('a1.u2.l1', '“Tener” (to have) and possessives: in simple words', [
    '<b>Tener</b> = “to have”: tengo, tienes, tiene, tenemos, tenéis, tienen. You also use it for age and family: <b>Tengo dos hermanos</b> = I have two brothers/siblings.',
    '<b>Possessives</b> say who owns something: <b>mi / mis</b> (my), <b>tu / tus</b> (your), <b>su / sus</b> (his, her, their, your-formal).',
    'Use the short form (mi, tu, su) with ONE thing and add <b>-s</b> with MANY: mi madre → mis padres.',
    'They do not change for masculine/feminine: mi padre, mi madre.']);
  add('a1.u2.l2', 'Days, months and dates: in simple words', [
    'Days: lunes, martes, miércoles, jueves, viernes, sábado, domingo. Months: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre.',
    'Days and months are written with a <b>small letter</b> in Spanish (not capital).',
    'Date pattern: <b>day + de + month</b>: el cinco de mayo = 5th of May. Ask with ¿Qué día es hoy?',
    '<b>el lunes</b> = this/next Monday (one time). <b>los lunes</b> = every Monday.']);
  add('a1.u2.l3', 'Telling the time: in simple words', [
    'Ask: <b>¿Qué hora es?</b> (What time is it?). Ask when something happens: <b>¿A qué hora…?</b>',
    'For one o’clock say <b>Es la una</b>. For every other hour say <b>Son las</b> + number: Son las tres.',
    'Quarter past: <b>y cuarto</b>. Half past: <b>y media</b>. Quarter to: <b>menos cuarto</b>. Exactly: <b>en punto</b>.',
    'Add <b>de la mañana / de la tarde / de la noche</b> to show a.m. or p.m.']);
  add('a1.u3.l1', '“Querer” and “gustar”: in simple words', [
    '<b>Querer</b> = to want: quiero, quieres, quiere, queremos, queréis, quieren. Note the vowel change e → ie (except nosotros/vosotros).',
    '<b>Me gusta</b> = I like (literally “it pleases me”). Use <b>me gusta</b> with ONE thing and <b>me gustan</b> with MANY things: me gusta el café · me gustan las manzanas.',
    'To order politely: <b>Quiero un café, por favor</b>, or the softer <b>Quisiera…</b> (I would like…).']);
  add('a1.u3.l2', 'Gender, number and adjectives: in simple words', [
    'Every noun is masculine or feminine: <b>el libro</b> (masculine), <b>la casa</b> (feminine). “A” is <b>un</b> / <b>una</b>.',
    'Plural: add <b>-s</b> after a vowel (libro → libros) and <b>-es</b> after a consonant (color → colores). The plural articles are <b>los / las</b> and <b>unos / unas</b>.',
    'Adjectives agree with the noun: un libro rojo, una casa roja, unas casas rojas. Adjectives ending in -e or a consonant (grande, azul) do not change for gender.',
    'The adjective usually goes AFTER the noun: una casa grande.']);
  add('a1.u3.l3', '“Estar” and “hay”: in simple words', [
    '<b>Estar</b> = to be (place): estoy, estás, está, estamos, estáis, están. Use it to say WHERE something known is: <b>La farmacia está en la calle Mayor</b>.',
    '<b>Hay</b> = there is / there are. It says something EXISTS and never changes: hay un parque, hay dos parques.',
    'Place words: en (in/on), cerca de (near), lejos de (far from), al lado de (next to), enfrente de (opposite), entre (between).',
    '<b>a + el = al</b> and <b>de + el = del</b>: al lado del parque.']);
  add('a1.u4.l1', 'Present tense of -ar verbs: in simple words', [
    'Take the infinitive (hablar), remove <b>-ar</b>, add: <b>-o, -as, -a, -amos, -áis, -an</b>. Example: hablo, hablas, habla, hablamos, habláis, hablan.',
    'You can usually leave out “I / you / he”: the ending already tells who does it. <b>Hablo español</b> = I speak Spanish.',
    'Make it negative by putting <b>no</b> before the verb: <b>No hablo inglés</b>.']);
  add('a1.u4.l2', 'Present tense of -er and -ir verbs: in simple words', [
    '-er verbs (comer) and -ir verbs (vivir) use almost the same endings: <b>-o, -es, -e, -emos/-imos, -éis/-ís, -en</b>.',
    'Only “we” and “you all” differ: comemos / vivimos, coméis / vivís.',
    'Routine words: todos los días (every day), por la mañana (in the morning), por la tarde, por la noche.']);
  add('a1.u4.l3', 'Question words and “ir”: in simple words', [
    'Question words always have an accent: <b>qué</b> (what), <b>quién</b> (who), <b>dónde</b> (where), <b>cuándo</b> (when), <b>cómo</b> (how), <b>cuánto/cuántos</b> (how much/many), <b>por qué</b> (why). Answer “why” with <b>porque</b> (because), written as one word without accent.',
    '<b>Ir</b> = to go: voy, vas, va, vamos, vais, van. After “ir” use <b>a</b>: Voy al parque (a + el = al).',
    'A yes/no question needs no question word: ¿Vives en Madrid? — Sí, vivo en Madrid.']);
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C; C.enHelp = C.enHelp || {};
  const add = (id, title, lines) => { C.enHelp[id] = { title, lines }; };
  add('a2.u1.l1', 'Reflexive verbs, time and frequency: in simple words', [
    'A <b>reflexive verb</b> has an extra small word (<b>me, te, se, nos, os, se</b>) because the person does the action to themselves: <b>me levanto</b> = I get (myself) up.',
    'Say the time of an activity with <b>a las</b> + hour: Me levanto <b>a las siete</b>. For one o’clock: <b>a la una</b>.',
    'Frequency words: siempre (always), normalmente (usually), a veces (sometimes), casi nunca (almost never), nunca (never). With <b>no</b> the verb comes first: No desayuno <b>nunca</b>.',
    'Stem change: acostarse → me <b>acue</b>sto (o becomes ue), but nosotros keeps the o: nos acostamos.']);
  add('a2.u1.l2', 'Prices and “this / that”: in simple words', [
    'Ask the price: <b>¿Cuánto cuesta?</b> (one thing) or <b>¿Cuánto cuestan?</b> (several things).',
    '<b>este</b> = this (near me), <b>ese</b> = that (near you), <b>aquel</b> = that over there (far). They change with the noun: este libro, esta camisa, estos zapatos, estas chaquetas.',
    '<b>muy caro</b> = very expensive (just emphasis). <b>demasiado caro</b> = too expensive (a problem).',
    'Useful: ¿Puedo pagar con tarjeta? (Can I pay by card?) · ¿Puedo probarme esto? (Can I try this on?)']);
  add('a2.u1.l3', 'Ordering politely: in simple words', [
    'Be polite with the waiter: <b>¿Me puede traer la carta?</b> (Could you bring me the menu?) · <b>¿Qué me recomienda?</b> (What do you recommend?) · <b>La cuenta, por favor</b> (The bill, please).',
    '<b>Quisiera…</b> = I would like… (more polite than <b>quiero</b>, “I want”).',
    '<b>Pedir</b> (to ask for / order) changes e → i: pido, pides, pide, pedimos, pedís, piden. Same for servir and repetir.',
    'Menu words: <b>de primero</b> (first course), <b>de segundo</b> (main course), <b>de postre</b> (dessert).']);
  add('a2.u2.l1', 'Travel information: in simple words', [
    'At the station ask: <b>¿A qué hora sale el tren?</b> (what time does it leave?) · <b>¿Cuánto dura el viaje?</b> (how long is the trip?) · <b>¿De qué andén sale?</b> (which platform?).',
    'Little words: <b>a</b> = to (destination): Voy <b>a</b> Madrid. <b>de</b> = from: Salgo <b>de</b> Sevilla. <b>en</b> = by (transport): Viajo <b>en</b> tren.',
    'Never say “voy en la estación” for going to a place: use <b>a</b> with ir and llegar.',
    '<b>billete de ida</b> = one-way ticket · <b>de ida y vuelta</b> = return ticket.']);
  add('a2.u2.l2', 'Hotel: in simple words', [
    'To book say: <b>Quisiera reservar una habitación doble</b> (I would like to book a double room). Room types: individual (one person), doble (two people).',
    'Ask about services: ¿El desayuno está incluido? (Is breakfast included?).',
    'Say a problem with <b>funcionar</b>: <b>No funciona</b> la televisión (singular) · <b>No funcionan</b> las luces (plural).',
    '<b>incluido</b> agrees with the noun: el desayuno está incluid<b>o</b>, las toallas están incluid<b>as</b>.']);
  add('a2.u2.l3', 'Describing people and places: in simple words', [
    'Use <b>ser</b> for looks and character: <b>Es alta</b>, <b>Es simpática</b>. Use <b>tener</b> for physical features: <b>Tiene el pelo largo y los ojos verdes</b>.',
    'Adjectives must match the noun: alto, alta, altos, altas. Adjectives ending in -e or a consonant have one form for masculine and feminine: un chico amable, una chica amable.',
    'Places: <b>La plaza es grande y está en el centro</b> (ser + description, estar + location). <b>Hay</b> says what exists: En mi barrio hay un parque.']);
  add('a2.u3.l1', 'Pretérito perfecto (“I have done”): in simple words', [
    'Formula: <b>he / has / ha / hemos / habéis / han</b> + <b>past participle</b>.',
    'Participle: -ar verbs → <b>-ado</b> (hablado); -er/-ir verbs → <b>-ido</b> (comido, vivido).',
    'Irregular participles to memorise: hacer → <b>hecho</b>, decir → <b>dicho</b>, ver → <b>visto</b>, escribir → <b>escrito</b>, poner → <b>puesto</b>, abrir → <b>abierto</b>, volver → <b>vuelto</b>.',
    'Use it for things finished in a time that is not over (<b>hoy, esta semana, este año</b>) and for life experience (<b>¿Has estado alguna vez en México?</b>). Never put <b>no</b> or <b>ya</b> between he and the participle: No he comido.']);
  add('a2.u3.l2', 'Pretérito indefinido, regular verbs: in simple words', [
    'Use the <b>indefinido</b> for finished actions at a specific past time: ayer (yesterday), anoche (last night), el año pasado, hace dos días (two days ago).',
    'Endings: -ar → <b>-é, -aste, -ó, -amos, -asteis, -aron</b> (hablé, hablaste, habló…). -er/-ir → <b>-í, -iste, -ió, -imos, -isteis, -ieron</b> (comí, comiste, comió…).',
    'The accent matters: <b>hablé</b> (I spoke, past) vs <b>hable</b> (subjunctive); <b>habló</b> (he spoke) vs <b>hablo</b> (I speak).',
    '<b>hace</b> + time = ago: Llegué <b>hace dos horas</b> (I arrived two hours ago).']);
  add('a2.u3.l3', 'Irregular preterites: in simple words', [
    'Some very common verbs change their stem in the indefinido and use special endings <b>-e, -iste, -o, -imos, -isteis, -ieron</b> (no accents): estuve, tuve, hice, pude, puse, vine, dije.',
    '“He/she did” is <b>hizo</b> (with z).',
    '<b>Ser</b> and <b>ir</b> have exactly the same forms: fui, fuiste, fue, fuimos, fuisteis, fueron. The context tells you: <b>Fui a Madrid</b> = I went; <b>Fue un viaje largo</b> = it was a long trip.']);
  add('a2.u4.l1', 'Plans with “ir a”: in simple words', [
    'Plans: <b>voy a / vas a / va a / vamos a / vais a / van a</b> + <b>infinitive</b>: Voy a estudiar esta noche = I am going to study tonight.',
    'Future time words: mañana, esta noche, el sábado, el próximo mes, el año que viene.',
    'Suggest: <b>¿Vamos al cine?</b> · Accept: <b>¡Claro!</b> / <b>Vale, perfecto</b> · Politely refuse: <b>Lo siento, no puedo. Tengo que estudiar</b>.']);
  add('a2.u4.l2', 'Comparisons: in simple words', [
    '<b>más… que</b> = more… than (Ana es más alta que Eva). <b>menos… que</b> = less… than. <b>tan… como</b> = as… as (Pablo es tan simpático como su hermano).',
    'Irregular: bueno → <b>mejor</b>, malo → <b>peor</b>, grande → <b>mayor</b> (age), pequeño → <b>menor</b> (age). Never say “más mejor”.',
    'With numbers use <b>de</b>: Tengo más <b>de</b> veinte libros (more than twenty).']);
  add('a2.u4.l3', 'Health and advice: in simple words', [
    '<b>Doler</b> (to hurt) works like gustar: <b>Me duele</b> la cabeza (one thing) · <b>Me duelen</b> las piernas (several things).',
    'Symptoms: Tengo fiebre (I have a fever) · tos (a cough) · dolor de estómago (a stomach ache).',
    '<b>Tener que</b> + infinitive = must / have to: Tengo que ir al médico. <b>Deber</b> + infinitive = should (advice): Debes descansar.',
    'Emergency: say <b>Necesito ayuda</b> and <b>Es una emergencia</b>, then give your location: Estoy en la calle…']);
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  // [palabra, categoría, nivel, tema, sentidos[[def, ejemplo, english, pos?]], sinónimos]
  const W = (w, pos, lvl, topic, senses, syn) => C.extraWords.push({ w, pos, level: lvl, topic, senses: senses.map((s) => ({ def: s[0], ex: s[1], en: s[2], pos: s[3] })), syn: syn || [] });

  W('banco', 'sustantivo', 'A1', 'Vida cotidiana', [
    ['Lugar donde guardamos dinero o pedimos un préstamo.', 'Voy al banco para sacar dinero.', 'I am going to the bank to withdraw money.'],
    ['Asiento largo para varias personas, en un parque o en la calle.', 'Nos sentamos en un banco del parque.', 'We sat on a bench in the park.']]);
  W('llamar', 'verbo', 'A1', 'Conversación', [
    ['Decir el nombre de una persona para que venga o responda.', 'Llamo a mi hermano para cenar.', 'I call my brother to come to dinner.'],
    ['Telefonear a alguien.', 'Te llamo esta noche.', 'I will call you tonight.'],
    ['llamarse: tener un nombre determinado.', 'Mi perro se llama Toby.', "My dog's name is Toby."]]);
  W('tomar', 'verbo', 'A1', 'Vida cotidiana', [
    ['Beber o comer algo.', 'Tomo café por la mañana.', 'I drink coffee in the morning.'],
    ['Usar un medio de transporte.', 'Tomo el autobús al trabajo.', 'I take the bus to work.']], ['coger']);
  W('tarde', 'adverbio', 'A1', 'Vida cotidiana', [
    ['Después de la hora prevista o normal.', 'Llego tarde a clase.', 'I arrive late to class.'],
    ['Parte del día entre el mediodía y la noche (la tarde).', 'Estudio por la tarde.', 'I study in the afternoon.', 'sustantivo']]);
  W('amigo', 'sustantivo', 'A1', 'Familia', [['Persona con la que tienes una relación de cariño y confianza.', 'Mi amigo vive en Valencia.', 'My friend lives in Valencia.']], ['compañero']);
  W('trabajo', 'sustantivo', 'A1', 'Trabajo', [
    ['Actividad por la que una persona recibe dinero.', 'Mi trabajo empieza a las ocho.', 'My job starts at eight.'],
    ['Tarea que hay que hacer.', 'Tengo mucho trabajo hoy.', 'I have a lot of work today.']]);
  W('escuela', 'sustantivo', 'A1', 'Educación', [['Lugar donde los niños aprenden con sus profesores.', 'Mi hermana va a la escuela.', 'My sister goes to school.']], ['colegio']);
  W('universidad', 'sustantivo', 'A1', 'Educación', [['Centro de estudios superiores donde se obtienen títulos.', 'Estudio medicina en la universidad.', 'I study medicine at university.']]);
  W('profesor', 'sustantivo', 'A1', 'Educación', [['Persona que enseña. Si es mujer, se dice «la profesora».', 'El profesor explica la lección.', 'The teacher explains the lesson.']], ['maestro']);
  W('médico', 'sustantivo', 'A1', 'Salud', [['Persona que cuida la salud de los enfermos.', 'El médico me recomienda descansar.', 'The doctor recommends that I rest.']], ['doctor']);
  W('coche', 'sustantivo', 'A1', 'Viajes', [['Vehículo con cuatro ruedas para viajar por carretera.', 'Mi padre tiene un coche rojo.', 'My father has a red car.']], ['auto', 'carro']);
  W('tren', 'sustantivo', 'A1', 'Viajes', [['Vehículo largo que circula sobre vías.', 'Viajo en tren a Barcelona.', 'I travel by train to Barcelona.']]);
  W('avión', 'sustantivo', 'A1', 'Viajes', [['Vehículo que vuela y transporta personas.', 'El avión sale a las diez.', 'The plane leaves at ten.']]);
  W('dinero', 'sustantivo', 'A1', 'Vida cotidiana', [['Monedas y billetes que usamos para pagar.', 'No tengo dinero hoy.', 'I have no money today.']]);
  W('barato', 'adjetivo', 'A1', 'Vida cotidiana', [['Que cuesta poco dinero.', 'Este pan es muy barato.', 'This bread is very cheap.']], ['económico']);
  W('caro', 'adjetivo', 'A1', 'Vida cotidiana', [['Que cuesta mucho dinero.', 'Esa camisa es muy cara.', 'That shirt is very expensive.']]);
  W('bueno', 'adjetivo', 'A1', 'Vida cotidiana', [['Que tiene buenas cualidades o da placer.', 'El café está muy bueno.', 'The coffee is very good.']]);
  W('malo', 'adjetivo', 'A1', 'Vida cotidiana', [['Que no es bueno o no tiene buenas cualidades.', 'Hoy hace mal tiempo.', 'The weather is bad today.']]);
  W('pequeño', 'adjetivo', 'A1', 'Vida cotidiana', [['De tamaño menor que lo normal.', 'Mi casa es pequeña.', 'My house is small.']]);
  W('nuevo', 'adjetivo', 'A1', 'Vida cotidiana', [['Que se ha hecho o se ha comprado hace poco.', 'Tengo un teléfono nuevo.', 'I have a new phone.']]);
  W('viejo', 'adjetivo', 'A1', 'Vida cotidiana', [['Que existe desde hace mucho tiempo.', 'Mi coche es muy viejo.', 'My car is very old.']]);
  W('bonito', 'adjetivo', 'A1', 'Vida cotidiana', [['Que resulta agradable de ver.', 'Tienes una casa muy bonita.', 'You have a very pretty house.']], ['lindo', 'hermoso']);
  W('feliz', 'adjetivo', 'A2', 'Emociones', [['Que siente alegría y satisfacción.', 'Estoy feliz con mi trabajo.', 'I am happy with my job.']], ['contento', 'alegre']);
  W('triste', 'adjetivo', 'A2', 'Emociones', [['Que siente pena o poca alegría.', 'Está triste porque se va su amigo.', 'He is sad because his friend is leaving.']]);
  W('cansado', 'adjetivo', 'A2', 'Salud', [['Que necesita descansar después de hacer un esfuerzo.', 'Estoy muy cansado después del trabajo.', 'I am very tired after work.']]);
  W('cenar', 'verbo', 'A2', 'Comida', [['Comer por la noche.', 'Cenamos a las nueve.', 'We have dinner at nine.']]);
  W('dormir', 'verbo', 'A2', 'Vida cotidiana', [['Descansar con los ojos cerrados y sin estar despierto.', 'Duermo ocho horas cada noche.', 'I sleep eight hours every night.']]);
  W('la comida', 'sustantivo', 'A1', 'Comida', [
    ['Lo que comemos para alimentarnos.', 'La comida mexicana me gusta mucho.', 'I really like Mexican food.'],
    ['La comida principal del día, normalmente al mediodía.', 'La comida es a las dos.', 'Lunch is at two.']]);
  W('esperar', 'verbo', 'A2', 'Vida cotidiana', [
    ['Quedarte en un lugar hasta que llegue alguien o algo.', 'Espero el autobús en la parada.', 'I wait for the bus at the stop.'],
    ['Tener la esperanza de que algo suceda.', 'Espero que vengas a mi fiesta.', 'I hope you come to my party.']]);
  W('pasar', 'verbo', 'A2', 'Vida cotidiana', [
    ['Ir de un lugar a otro.', 'El tren pasa por mi pueblo.', 'The train goes through my town.'],
    ['Ocurrir algo.', '¿Qué pasa aquí?', "What's going on here?"],
    ['Estar en un lugar un tiempo.', 'Paso las vacaciones en la playa.', 'I spend my vacation at the beach.']]);
  W('dar', 'verbo', 'A2', 'Vida cotidiana', [['Entregar algo a alguien sin pedir nada a cambio.', 'Te doy mi número de teléfono.', 'I give you my phone number.']]);
  W('tener hambre', 'expresión', 'A1', 'Expresiones', [['Necesitar comer.', 'Tengo hambre: quiero un bocadillo.', "I'm hungry: I want a sandwich."]]);
  W('tener sed', 'expresión', 'A1', 'Expresiones', [['Necesitar beber.', 'Tengo sed después de correr.', "I'm thirsty after running."]]);
  W('tener razón', 'expresión', 'B1', 'Expresiones', [['Decir o pensar algo correcto.', 'Tienes razón: el examen es difícil.', "You're right: the exam is difficult."]]);
  W('estar de acuerdo', 'expresión', 'B1', 'Expresiones', [['Tener la misma opinión que otra persona.', 'Estoy de acuerdo contigo.', 'I agree with you.']]);
  W('darse cuenta', 'expresión', 'B1', 'Expresiones', [['Comprender algo que antes no sabías o no veías.', 'Me di cuenta de mi error.', 'I realized my mistake.']]);
  W('de repente', 'expresión', 'B1', 'Expresiones', [['De forma rápida y sin avisar.', 'De repente empezó a llover.', 'Suddenly it started to rain.']], ['de pronto']);
  W('sin embargo', 'conector', 'B1', 'Expresiones', [['Expresión que indica una oposición o una contradicción con lo anterior.', 'Estudió mucho; sin embargo, no aprobó.', 'He studied a lot; however, he did not pass.']], ['no obstante']);
  W('por eso', 'conector', 'B1', 'Expresiones', [['Expresión que presenta una consecuencia.', 'Llovía; por eso nos quedamos en casa.', 'It was raining; that is why we stayed home.']]);
  W('aunque', 'conector', 'B1', 'Expresiones', [['Palabra que introduce una dificultad que no impide algo.', 'Salgo aunque llueva.', "I'm going out even if it rains."]]);
  W('como', 'conjunción', 'A2', 'Expresiones', [
    ['Palabra que sirve para comparar: igual que.', 'Ella es alta como su padre.', 'She is tall like her father.'],
    ['Palabra que introduce una causa al principio de la frase.', 'Como llueve, no salimos.', "Since it's raining, we are not going out."]]);
  W('ordenador', 'sustantivo', 'A2', 'Tecnología', [['Máquina electrónica que sirve para trabajar, estudiar y navegar por internet.', 'Trabajo con el ordenador todos los días.', 'I work with the computer every day.']], ['computadora']);
  W('teléfono', 'sustantivo', 'A2', 'Tecnología', [['Aparato que sirve para hablar con personas que están lejos.', 'Mi teléfono nuevo tiene una buena cámara.', 'My new phone has a good camera.']], ['móvil', 'celular']);
  W('árbol', 'sustantivo', 'A2', 'Naturaleza', [['Planta grande con tronco, ramas y hojas.', 'Hay un árbol enorme en el parque.', 'There is a huge tree in the park.']]);
  W('río', 'sustantivo', 'A2', 'Naturaleza', [['Corriente de agua que va hacia el mar o hacia un lago.', 'El río pasa por el centro de la ciudad.', 'The river runs through the city center.']]);

  // Verbos con formas conjugadas: [yo, tú, él, nosotros, vosotros, ellos]
  const V = (inf, level, def, ex, en, pres, indef, extra) => C.verbs.push(Object.assign({ inf, level, def, ex, en, pres, indef }, extra || {}));
  V('ser', 'A1', 'Verbo que usamos para decir la identidad, el origen, la profesión o una característica.', 'Soy de Chile.', 'I am from Chile.', ['soy', 'eres', 'es', 'somos', 'sois', 'son'], ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']);
  V('estar', 'A1', 'Verbo que usamos para decir el lugar o el estado de algo.', 'Estoy en casa.', 'I am at home.', ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'], ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron']);
  V('tener', 'A1', 'Poseer algo o tener una relación con alguien.', 'Tengo dos hermanos.', 'I have two brothers.', ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'], ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron']);
  V('ir', 'A1', 'Moverte de un lugar a otro.', 'Voy al parque.', 'I go to the park.', ['voy', 'vas', 'va', 'vamos', 'vais', 'van'], ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']);
  V('hablar', 'A1', 'Decir palabras para comunicarte.', 'Hablo español.', 'I speak Spanish.', ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'], ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron']);
  V('trabajar', 'A1', 'Hacer una actividad por la que recibes dinero.', 'Trabajo en un banco.', 'I work at a bank.', ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajáis', 'trabajan'], ['trabajé', 'trabajaste', 'trabajó', 'trabajamos', 'trabajasteis', 'trabajaron']);
  V('estudiar', 'A1', 'Dedicar tiempo a aprender algo.', 'Estudio español.', 'I study Spanish.', ['estudio', 'estudias', 'estudia', 'estudiamos', 'estudiáis', 'estudian'], ['estudié', 'estudiaste', 'estudió', 'estudiamos', 'estudiasteis', 'estudiaron']);
  V('comprar', 'A1', 'Dar dinero a cambio de un producto.', 'Compro pan.', 'I buy bread.', ['compro', 'compras', 'compra', 'compramos', 'compráis', 'compran'], ['compré', 'compraste', 'compró', 'compramos', 'comprasteis', 'compraron']);
  V('comer', 'A1', 'Tomar alimentos sólidos.', 'Como pan.', 'I eat bread.', ['como', 'comes', 'come', 'comemos', 'coméis', 'comen'], ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron']);
  V('beber', 'A1', 'Tomar un líquido.', 'Bebo agua.', 'I drink water.', ['bebo', 'bebes', 'bebe', 'bebemos', 'bebéis', 'beben'], ['bebí', 'bebiste', 'bebió', 'bebimos', 'bebisteis', 'bebieron']);
  V('vivir', 'A1', 'Tener tu casa en un lugar.', 'Vivo en Madrid.', 'I live in Madrid.', ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'], ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron']);
  V('leer', 'A1', 'Mirar un texto y entender lo que dice.', 'Leo un libro.', 'I read a book.', ['leo', 'lees', 'lee', 'leemos', 'leéis', 'leen'], ['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron']);
  V('escribir', 'A1', 'Poner palabras en un papel o en una pantalla.', 'Escribo una carta.', 'I write a letter.', ['escribo', 'escribes', 'escribe', 'escribimos', 'escribís', 'escriben'], ['escribí', 'escribiste', 'escribió', 'escribimos', 'escribisteis', 'escribieron']);
  V('querer', 'A1', 'Tener el deseo de conseguir o hacer algo.', 'Quiero un café.', 'I want a coffee.', ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'], ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron']);
  V('hacer', 'A1', 'Realizar una acción o fabricar algo.', 'Hago la tarea.', 'I do my homework.', ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'], ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron']);
  V('poder', 'A1', 'Tener la capacidad o el permiso para hacer algo.', '¿Puedes ayudarme?', 'Can you help me?', ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden'], ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron']);
  V('ver', 'A1', 'Percibir algo con los ojos.', 'Veo la televisión.', 'I watch TV.', ['veo', 'ves', 've', 'vemos', 'veis', 'ven'], ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron']);
  V('saber', 'A1', 'Tener un conocimiento o una habilidad.', 'Sé hablar español.', 'I know how to speak Spanish.', ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'], ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron']);
  V('decir', 'A1', 'Expresar algo con palabras.', 'Digo la verdad.', 'I tell the truth.', ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen'], ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron']);
  V('venir', 'A1', 'Moverte hacia el lugar donde está la persona que habla.', 'Vengo de la escuela.', 'I come from school.', ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'], ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron']);
  V('poner', 'A1', 'Colocar algo en un lugar.', 'Pongo el libro en la mesa.', 'I put the book on the table.', ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen'], ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron']);
  V('salir', 'A1', 'Pasar de dentro a fuera de un lugar.', 'Salgo de casa a las ocho.', 'I leave home at eight.', ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'], ['salí', 'saliste', 'salió', 'salimos', 'salisteis', 'salieron']);
  V('dar', 'A2', 'Entregar algo a alguien.', 'Te doy mi número.', 'I give you my number.', ['doy', 'das', 'da', 'damos', 'dais', 'dan'], ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron']);
  V('dormir', 'A2', 'Descansar con los ojos cerrados.', 'Duermo ocho horas.', 'I sleep eight hours.', ['duermo', 'duermes', 'duerme', 'dormimos', 'dormís', 'duermen'], ['dormí', 'dormiste', 'durmió', 'dormimos', 'dormisteis', 'durmieron']);
  V('cenar', 'A2', 'Comer por la noche.', 'Ceno a las nueve.', 'I have dinner at nine.', ['ceno', 'cenas', 'cena', 'cenamos', 'cenáis', 'cenan'], ['cené', 'cenaste', 'cenó', 'cenamos', 'cenasteis', 'cenaron']);
  V('gustar', 'A1', 'Producir placer o agrado.', 'Me gusta el café.', 'I like coffee.', ['gusto', 'gustas', 'gusta', 'gustamos', 'gustáis', 'gustan'], ['gusté', 'gustaste', 'gustó', 'gustamos', 'gustasteis', 'gustaron'], { note: 'Se usa casi siempre en tercera persona: «me gusta» / «me gustan».' });
  V('viajar', 'A2', 'Ir de un lugar a otro, normalmente lejos.', 'Viajo a México en verano.', 'I travel to Mexico in summer.', ['viajo', 'viajas', 'viaja', 'viajamos', 'viajáis', 'viajan'], ['viajé', 'viajaste', 'viajó', 'viajamos', 'viajasteis', 'viajaron']);
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  C.gloss = Object.assign(C.gloss || {}, {
    'hola': 'hello; hi', 'buenos días': 'good morning', 'buenas tardes': 'good afternoon; good evening', 'buenas noches': 'good evening; good night',
    'adiós': 'goodbye', 'hasta luego': 'see you later', 'por favor': 'please', 'gracias': 'thank you; thanks', 'me llamo': 'my name is; I am called',
    'soy': 'I am (from «ser»)', 'de': 'of; from', 'encantado': 'pleased to meet you; delighted', 'el nombre': 'name', 'el país': 'country',
    'el estudiante': 'student', 'vivir': 'to live', 'cero': 'zero', 'uno': 'one', 'cinco': 'five', 'diez': 'ten', 'quince': 'fifteen',
    'veinte': 'twenty', 'treinta': 'thirty', 'cien': 'one hundred', 'la familia': 'family', 'la madre': 'mother', 'el padre': 'father',
    'el hermano': 'brother', 'la hermana': 'sister', 'los abuelos': 'grandparents', 'el hijo': 'son; child', 'tener': ['to have; to be (with age)', 'to have'],
    'el lunes': 'Monday', 'el sábado': 'Saturday', 'el domingo': 'Sunday', 'la semana': 'week', 'el mes': 'month', 'enero': 'January',
    'hoy': 'today', 'mañana': 'tomorrow; morning', 'la hora': 'hour; time', 'el minuto': 'minute', 'el reloj': 'clock; watch',
    'en punto': "o'clock; sharp", 'y media': 'half past', 'la mañana': 'morning', 'la tarde': 'afternoon; evening', 'la noche': 'night',
    'el agua': 'water', 'el pan': 'bread', 'la leche': 'milk', 'el café': 'coffee; café', 'la manzana': 'apple', 'el pollo': 'chicken',
    'querer': ['to want; to love', 'to want'], 'gustar': ['to like (to be pleasing)', 'to like'], 'el color': 'color', 'rojo': 'red', 'azul': 'blue', 'verde': 'green',
    'la mesa': 'table', 'el libro': 'book', 'la casa': 'house; home', 'grande': 'big; large; great', 'la ciudad': 'city', 'la calle': 'street',
    'el parque': 'park', 'el supermercado': 'supermarket', 'la farmacia': 'pharmacy', 'el hospital': 'hospital',
    'estar': ['to be (location or state)', 'to be (location or state)'], 'hay': 'there is; there are', 'hablar': ['to speak; to talk', 'to speak; to talk'],
    'trabajar': 'to work', 'estudiar': 'to study', 'caminar': 'to walk', 'comprar': 'to buy', 'necesitar': 'to need', 'escuchar': 'to listen',
    'el español': 'Spanish (language); Spaniard', 'comer': 'to eat', 'beber': 'to drink', 'leer': 'to read', 'aprender': 'to learn',
    'escribir': 'to write', 'abrir': 'to open', 'correr': 'to run', 'recibir': 'to receive', 'qué': 'what', 'quién': 'who', 'dónde': 'where',
    'cuándo': 'when', 'cómo': 'how', 'por qué': 'why', 'cuánto': 'how much; how many', 'ir': 'to go',
    'banco': ['bank', 'bench'], 'llamar': ['to call (to summon)', 'to phone; to call', 'to be called (llamarse)'], 'tomar': ['to take (food or drink)', 'to take (transport)'],
    'tarde': ['late', 'afternoon; evening'], 'amigo': 'friend', 'trabajo': ['job; work', 'work; task'], 'escuela': 'school', 'universidad': 'university',
    'profesor': 'teacher; professor', 'médico': 'doctor; physician', 'coche': 'car', 'tren': 'train', 'avión': 'airplane', 'dinero': 'money',
    'barato': 'cheap; inexpensive', 'caro': 'expensive', 'bueno': 'good', 'malo': 'bad', 'pequeño': 'small; little', 'nuevo': 'new',
    'viejo': 'old', 'bonito': 'pretty; nice', 'feliz': 'happy', 'triste': 'sad', 'cansado': 'tired', 'cenar': 'to have dinner', 'dormir': ['to sleep', 'to sleep'],
    'la comida': ['food; meal', 'lunch; main meal'], 'esperar': ['to wait', 'to hope'], 'pasar': ['to pass; to go through', 'to happen', 'to spend (time)'],
    'dar': ['to give', 'to give'], 'tener hambre': 'to be hungry', 'tener sed': 'to be thirsty', 'tener razón': 'to be right',
    'estar de acuerdo': 'to agree', 'darse cuenta': 'to realize', 'de repente': 'suddenly', 'sin embargo': 'however; nevertheless',
    'por eso': 'that is why; therefore', 'aunque': 'although; even though', 'como': ['as; like; how', 'since; as (because)'], 'ordenador': 'computer (Spain)',
    'teléfono': 'telephone; phone', 'árbol': 'tree', 'río': 'river', 'ser': 'to be (identity, origin, characteristics)', 'hacer': 'to do; to make',
    'poder': 'to be able to; can', 'ver': 'to see; to watch', 'saber': 'to know (a fact); to know how to', 'decir': 'to say; to tell',
    'venir': 'to come', 'poner': 'to put; to place', 'salir': 'to leave; to go out', 'viajar': 'to travel', 'además': 'besides; moreover; also', 'por un lado': 'on the one hand', 'por otro lado': 'on the other hand'
  });
  // Devuelve el significado en inglés del sentido i de una entrada (o null si no hay)
  C.glossFor = function (entry, i) {
    const g = C.gloss[entry.w];
    if (!g) return null;
    if (Array.isArray(g)) return g[i] || g[g.length - 1] || null;
    return g;
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order } = L.Q;
  C.grammar = [];
  const G = (g) => {
    g.exercises = g.exercises.map((q) => L.Q.prep(q, 'gram:' + g.id, g.level));
    g.quiz = g.quiz.map((q) => L.Q.prep(q, 'gram:' + g.id, g.level));
    C.grammar.push(g);
  };
  const tb = (head, rows) => ({ t: 'table', head, rows });
  const ex = (...list) => ({ t: 'ex', list });
  const tip = (text) => ({ t: 'tip', text });

  G({ id: 'sustantivos', level: 'A1', title: 'Sustantivos', summary: 'Palabras que nombran personas, animales, cosas, lugares e ideas.',
    explain: ['El <b>sustantivo</b> es la palabra que usamos para nombrar personas, animales, cosas, lugares e ideas.',
      tb(['Tipo', 'Qué nombra', 'Ejemplos'], [['Común', 'Cualquier elemento de un grupo', 'niño, ciudad, libro, felicidad'], ['Propio', 'Un nombre único', 'Lucía, Madrid, México']]),
      'Los nombres propios se escriben con <b>mayúscula inicial</b>. Los nombres comunes, con minúscula (salvo al principio de una frase).',
      ex('La ciudad es grande.', 'Madrid es una ciudad.', 'Lucía tiene un libro.'), tip('Los días y los meses son sustantivos comunes: se escriben con minúscula («lunes», «mayo»).')],
    contrast: null,
    mistakes: [['Vivo en madrid.', 'Vivo en Madrid.', 'Los nombres propios llevan mayúscula.'], ['Hoy es Lunes.', 'Hoy es lunes.', 'Los días se escriben con minúscula.']],
    exercises: [mc('¿Cuál de estas palabras es un nombre propio?', 'Sevilla', ['ciudad', 'parque', 'calle'], '«Sevilla» nombra un lugar único: es nombre propio y lleva mayúscula.'),
      mc('¿Qué frase está bien escrita?', 'Mi hermana vive en Lima.', ['mi hermana vive en lima.', 'Mi Hermana vive en Lima.', 'Mi hermana vive en lima.'], 'Mayúscula al empezar la frase y en el nombre propio «Lima».'),
      mc('¿Cuál es un sustantivo común?', 'libro', ['Pablo', 'México', 'Ana'], '«Libro» nombra cualquier libro: es común.'),
      fill('Hoy es ___. (el día después de domingo)', 'lunes', 'Los días de la semana se escriben con minúscula.')],
    quiz: [mc('Elige el nombre propio:', 'España', ['país', 'casa', 'mesa'], '«España» es un nombre propio.'), mc('¿Cuál está bien escrita?', 'En mayo viajo a Chile.', ['En Mayo viajo a chile.', 'En mayo viajo a chile.', 'en mayo viajo a Chile.'], 'Meses en minúscula; «Chile» con mayúscula.'), fill('La capital de España es ___.', 'Madrid', 'Es nombre propio: lleva mayúscula.')] });

  G({ id: 'articulos', level: 'A1', title: 'Artículos', summary: 'El, la, los, las, un, una, unos, unas.',
    explain: ['Los <b>artículos</b> acompañan al sustantivo y concuerdan con él en género y número.',
      tb(['', 'Masculino', 'Femenino'], [['Definido singular', 'el', 'la'], ['Definido plural', 'los', 'las'], ['Indefinido singular', 'un', 'una'], ['Indefinido plural', 'unos', 'unas']]),
      'Usamos el <b>definido</b> cuando hablamos de algo conocido («el libro de la clase») y el <b>indefinido</b> cuando algo es nuevo o no se conoce («un libro»).',
      'Con sustantivos femeninos que empiezan por <b>a tónica</b> usamos «el» en singular: <b>el agua</b>, <b>el águila</b>; pero en plural: <b>las aguas</b>.',
      ex('El libro está en la mesa.', 'Tengo una hermana y unos primos.', 'El agua está fría.'), tip('El adjetivo sigue siendo femenino: «el agua fría», no «el agua frío».')],
    mistakes: [['La agua está fría.', 'El agua está fría.', 'Con «a» tónica usamos «el» en singular.'], ['El mano es pequeña.', 'La mano es pequeña.', '«Mano» es femenino aunque termine en -o.']],
    exercises: [mc('___ casa es grande.', 'La', ['El', 'Los', 'Un'], '«Casa» es femenino singular.'), mc('Tengo ___ amigos en Perú.', 'unos', ['unas', 'el', 'la'], '«Amigos» es masculino plural: «unos».'), fill('___ agua está fría.', 'El', 'Con «agua» (a tónica) usamos «el» en singular.'), order('Las niñas están en el parque', 'Artículo + sustantivo + verbo + lugar.')],
    quiz: [mc('¿Cuál es correcta?', 'El agua es buena.', ['La agua es buena.', 'Los agua es buena.', 'El agua es bueno.'], '«El agua» + adjetivo femenino.'), fill('Quiero ___ café. (uno cualquiera)', 'un', 'Café es masculino y no está definido: «un».'), mc('El plural de «el libro» es:', 'los libros', ['las libros', 'el libros', 'los libro'], 'Artículo y sustantivo van en plural.')] });

  G({ id: 'genero-numero', level: 'A1', title: 'Género y número', summary: 'Masculino y femenino, singular y plural, y concordancia.',
    explain: ['Los sustantivos son masculinos o femeninos. Muchos masculinos terminan en <b>-o</b> y muchos femeninos en <b>-a</b>, pero hay excepciones.',
      tb(['Regla', 'Ejemplos'], [['-o → masculino', 'el libro, el niño'], ['-a → femenino', 'la casa, la niña'], ['Excepciones', 'el día, el mapa, la mano, la foto'], ['Terminan en -e o consonante', 'el coche, la noche, el color, la ciudad (hay que aprender el género)']]),
      '<b>Plural:</b> vocal → <b>-s</b> (libro → libros); consonante → <b>-es</b> (color → colores); <b>-z → -ces</b> (lápiz → lápices).',
      'El adjetivo <b>concuerda</b> con el sustantivo: «un niño alto», «unas niñas altas». Los adjetivos en -e o consonante no cambian en el género: «un coche grande», «una casa grande».',
      ex('Los libros son rojos.', 'Las ciudades son grandes.', 'Tengo dos lápices.')],
    mistakes: [['Los problemas es difícil.', 'Los problemas son difíciles.', 'El verbo y el adjetivo concuerdan en plural.'], ['Un lápices.', 'Un lápiz / unos lápices.', 'Plural: -z → -ces.']],
    exercises: [fill('El plural de «color» es:', 'colores', 'Termina en consonante: añadimos -es.'), fill('El plural de «lápiz» es:', 'lápices', 'Cambia -z por -ces.'), mc('Las casas son ___.', 'grandes', ['grande', 'grandas', 'grandos'], 'El adjetivo va en plural: «grandes».'), mc('¿Qué palabra es femenina?', 'la mano', ['el día', 'el mapa', 'el libro'], '«Mano» es femenina aunque termine en -o.')],
    quiz: [mc('El plural de «ciudad» es:', 'ciudades', ['ciudads', 'ciudaes', 'ciudad'], 'Termina en consonante: -es.'), fill('Una casa roj___. (completa la terminación)', 'a', 'Concuerda con «casa» (femenino singular): roja.'), mc('¿Cuál es correcta?', 'Unas amigas simpáticas.', ['Unos amigas simpáticas.', 'Unas amigas simpático.', 'Una amigas simpáticas.'], 'Artículo, sustantivo y adjetivo concuerdan.')] });

  G({ id: 'pronombres', level: 'A1', title: 'Pronombres', summary: 'Pronombres personales de sujeto y su uso.',
    explain: ['Los <b>pronombres de sujeto</b> indican quién hace la acción.',
      tb(['Persona', 'Pronombre'], [['1.ª singular', 'yo'], ['2.ª singular', 'tú (informal) / usted (formal)'], ['3.ª singular', 'él, ella'], ['1.ª plural', 'nosotros, nosotras'], ['2.ª plural', 'vosotros, vosotras (España)'], ['3.ª plural', 'ellos, ellas, ustedes']]),
      'En español casi siempre se <b>omite</b> el pronombre de sujeto, porque la terminación del verbo ya lo indica: «Hablo español». Lo usamos para destacar o aclarar: «Yo hablo español, pero ella habla inglés».',
      'En <b>América Latina</b> se usa «ustedes» como plural de «tú» y de «usted»; en <b>España</b>, «vosotros» es el plural informal. Ambas son correctas.',
      ex('Vivo en Sevilla.', 'Ella trabaja en un hospital.', 'Ustedes hablan muy bien.')],
    mistakes: [['Yo hablo, yo vivo y yo trabajo aquí.', 'Hablo, vivo y trabajo aquí.', 'Normalmente omitimos el pronombre de sujeto porque el verbo ya indica la persona.']],
    exercises: [mc('¿Qué pronombre usas para hablar con tu profesor con respeto?', 'usted', ['tú', 'yo', 'ellos'], '«Usted» es el trato formal.'), mc('Hablas de dos mujeres. ¿Qué pronombre usas?', 'ellas', ['ellos', 'ella', 'nosotras'], '«Ellas» es 3.ª persona plural femenino.'), fill('___ soy de Chile. (hablas de ti mismo)', 'Yo', 'Primera persona singular: yo.'), mc('«Hablo español» no lleva «yo» porque...', 'la terminación -o ya indica la persona', ['el verbo no tiene sujeto', 'el español no usa pronombres', 'es una pregunta'], 'La terminación verbal indica la persona.')],
    quiz: [mc('Tú y yo: ¿qué pronombre usamos?', 'nosotros', ['ellos', 'vosotros', 'ustedes'], '«Tú y yo» = nosotros.'), mc('En muchos países de América, el plural de «tú» es:', 'ustedes', ['vosotros', 'nosotros', 'ellos'], 'En América Latina se usa «ustedes».'), fill('___ es mi madre. (ella)', 'Ella', 'Pronombre de 3.ª persona femenino singular.')] });

  G({ id: 'ser-estar', level: 'A1', title: 'Ser y estar', summary: 'Dos verbos para «to be»: identidad frente a lugar y estado.',
    explain: ['Usamos <b>ser</b> para identificar y definir; usamos <b>estar</b> para el lugar y los estados.',
      tb(['Ser', 'Estar'], [['Identidad: Soy Ana.', 'Lugar: Estoy en casa.'], ['Origen: Es de Chile.', 'Estado: Estoy cansado.'], ['Profesión: Es médico.', 'Resultado: La puerta está abierta.'], ['Características: Es alto.', 'Acción en curso: Estoy leyendo.'], ['Hora y fecha: Son las tres.', 'Ubicación de cosas: El libro está aquí.']]),
      'Algunos adjetivos cambian de significado: <b>es aburrido</b> (su carácter) / <b>está aburrido</b> (ahora se aburre); <b>es listo</b> (inteligente) / <b>está listo</b> (preparado).',
      ex('Mi padre es médico.', 'Mi padre está en el hospital.', 'La sopa es buena.', 'La sopa está caliente.'), tip('Para decir dónde se celebra un evento usamos «ser»: «La fiesta es en mi casa». Para dónde está algo, «estar».')],
    mistakes: [['Soy cansado.', 'Estoy cansado.', 'El cansancio es un estado: usamos «estar».'], ['Madrid es en España.', 'Madrid está en España.', 'La ubicación se expresa con «estar».']],
    exercises: [fill('Yo ___ estudiante. (profesión o identidad)', 'soy', 'Con identidad usamos «ser».'), fill('Mi hermano ___ en el parque. (lugar)', 'está', 'Para el lugar usamos «estar».'), mc('La sopa ___ caliente ahora.', 'está', ['es', 'son', 'estás'], 'Es un estado del momento: «estar».'), mc('¿Qué frase es correcta?', 'Ella es de Perú.', ['Ella está de Perú.', 'Ella es en Perú.', 'Ella está Perú.'], 'El origen se dice con «ser + de».')],
    quiz: [mc('¿Cuál es correcta?', 'Estoy cansado.', ['Soy cansado.', 'Soy cansada en casa.', 'Estar cansado yo.'], 'El cansancio es un estado.'), fill('Hoy ___ lunes.', 'es', 'Los días se expresan con «ser».'), mc('«Mi hermano es aburrido» significa que...', 'su carácter es aburrido', ['ahora se aburre', 'está en un lugar', 'no está en casa'], 'Con «ser» hablamos de una característica.')] });

  G({ id: 'tener-haber', level: 'A1', title: 'Tener y haber', summary: 'Posesión, edad y sensaciones; existencia con «hay».',
    explain: ['<b>Tener</b> expresa posesión, edad y sensaciones: «Tengo dos hermanos», «Tengo veinte años», «Tengo hambre».',
      '<b>Haber</b> tiene dos usos principales. Como <b>hay</b> expresa existencia: «Hay un parque». Como <b>auxiliar</b> forma tiempos compuestos: «He comido».',
      tb(['Tener', 'Haber (existencia)'], [['yo tengo', 'hay (presente)'], ['tú tienes', 'había (pasado)'], ['él tiene', 'habrá (futuro)'], ['nosotros tenemos', 'hubo (indefinido)']]),
      '«Hay» no cambia por el plural: «hay un libro», «hay dos libros». Lo mismo ocurre en el pasado: «había muchos libros».',
      ex('Tengo hambre.', 'En mi ciudad hay un teatro.', 'Ayer había mucha gente en la calle.')],
    mistakes: [['Habían muchas personas.', 'Había muchas personas.', '«Haber» impersonal no cambia con el plural.'], ['Soy veinte años.', 'Tengo veinte años.', 'La edad se dice con «tener».']],
    exercises: [fill('¿Cuántos años ___ tú?', 'tienes', 'La edad se dice con «tener».'), mc('En mi clase ___ veinte estudiantes.', 'hay', ['tienen', 'están', 'son'], '«Hay» expresa existencia.'), mc('Ayer ___ mucha gente en el cine.', 'había', ['habían', 'tenía', 'estaba'], 'Existencia en el pasado: «había», invariable.'), fill('Nosotros ___ una casa pequeña.', 'tenemos', 'Posesión con «nosotros»: tenemos.')],
    quiz: [mc('¿Cuál es correcta?', 'Hay tres libros en la mesa.', ['Hay tres libros está en la mesa.', 'Tienen tres libros en la mesa.', 'Están tres libros hay.'], '«Hay» + sustantivo expresa existencia.'), fill('Tengo ___. (necesito comer)', 'hambre', '«Tener hambre» expresa la sensación.'), mc('¿Cuál es incorrecta?', 'Habían dos niños.', ['Había dos niños.', 'Hay dos niños.', 'Hubo dos niños.'], 'Con «había» no usamos plural.')] });

  G({ id: 'presente', level: 'A1', title: 'Presente', summary: 'Verbos regulares e irregulares; cambios vocálicos.',
    explain: ['El <b>presente</b> sirve para hablar de hábitos, de lo que ocurre ahora y de planes próximos.',
      tb(['Persona', '-ar (hablar)', '-er (comer)', '-ir (vivir)'], [['yo', 'hablo', 'como', 'vivo'], ['tú', 'hablas', 'comes', 'vives'], ['él/ella/usted', 'habla', 'come', 'vive'], ['nosotros', 'hablamos', 'comemos', 'vivimos'], ['vosotros', 'habláis', 'coméis', 'vivís'], ['ellos/ustedes', 'hablan', 'comen', 'viven']]),
      '<b>Cambios en la raíz:</b> e → ie (querer: quiero), o → ue (poder: puedo), e → i (pedir: pido). No cambian «nosotros» y «vosotros».',
      '<b>Verbos con «yo» irregular:</b> hacer → hago, poner → pongo, salir → salgo, saber → sé, ver → veo, decir → digo, venir → vengo.',
      ex('Trabajo por la mañana.', 'Quiero un café.', 'Hago la tarea por la tarde.', 'Mañana salgo con mis amigos.')],
    mistakes: [['Yo quero un café.', 'Yo quiero un café.', 'Querer cambia e → ie.'], ['Yo hacer la tarea.', 'Yo hago la tarea.', 'Hay que conjugar el verbo.']],
    exercises: [fill('Yo ___ en una oficina. (trabajar)', 'trabajo', 'Terminación -o.'), fill('Ella ___ pan. (comer)', 'come', '3.ª persona: -e.'), fill('Nosotros ___ en Madrid. (vivir)', 'vivimos', 'En -ir, «nosotros»: -imos.'), mc('Yo ___ la tarea. (hacer)', 'hago', ['hacio', 'haco', 'hace'], '«Hacer» es irregular en «yo»: hago.')],
    quiz: [fill('Tú ___ un café. (querer)', 'quieres', 'e → ie.'), mc('¿Cuál es correcta?', 'Puedo ayudarte.', ['Podo ayudarte.', 'Puedes ayudarte yo.', 'Poder ayudarte.'], 'Poder: o → ue.'), fill('Yo ___ los lunes a las ocho. (salir)', 'salgo', '«Salir» tiene «yo» irregular: salgo.')] });

  G({ id: 'perfecto', level: 'A2', title: 'Pretérito perfecto', summary: 'Acciones pasadas conectadas con el presente.',
    explain: ['Se forma con el presente de <b>haber</b> + <b>participio</b>.',
      tb(['Persona', 'Haber', 'Ejemplo'], [['yo', 'he', 'he comido'], ['tú', 'has', 'has hablado'], ['él/ella/usted', 'ha', 'ha vivido'], ['nosotros', 'hemos', 'hemos comido'], ['vosotros', 'habéis', 'habéis hablado'], ['ellos/ustedes', 'han', 'han vivido']]),
      'El participio: -ar → <b>-ado</b> (hablado); -er/-ir → <b>-ido</b> (comido, vivido). <b>Irregulares:</b> hecho, dicho, escrito, visto, puesto, vuelto, roto, abierto.',
      'Lo usamos con marcadores como <b>hoy, esta semana, este año, ya, todavía no, alguna vez, nunca</b>.',
      ex('Hoy he desayunado temprano.', 'Todavía no he hecho la tarea.', '¿Has estado alguna vez en México?'),
      tip('En muchas zonas de América Latina se usa más el pretérito indefinido en estos casos («Hoy desayuné temprano»). Las dos formas son correctas en su región.')],
    mistakes: [['He comido ayer.', 'Comí ayer.', 'Con «ayer» (un tiempo terminado) usamos el indefinido en el español estándar.'], ['He hacido la tarea.', 'He hecho la tarea.', '«Hacer» tiene participio irregular: hecho.']],
    exercises: [fill('Hoy yo ___ café. (haber + beber)', 'he bebido', 'He + participio de «beber».'), fill('Ella ya ___ la carta. (haber + escribir)', 'ha escrito', '«Escribir» tiene participio irregular: escrito.'), mc('¿Cuál es el participio de «hacer»?', 'hecho', ['hacido', 'hacado', 'hacendo'], 'Es irregular.'), order('Todavía no hemos visto esa película', '«Todavía no» + perfecto.')],
    quiz: [fill('Nosotros ___ en Perú. (haber + vivir)', 'hemos vivido', 'Hemos + vivido.'), mc('¿Cuál es el participio de «ver»?', 'visto', ['veído', 'viendo', 'vido'], 'Participio irregular.'), mc('¿Qué frase está bien?', 'Esta semana he trabajado mucho.', ['Esta semana he trabajó mucho.', 'Esta semana hemos trabajar mucho.', 'Esta semana ha trabajados mucho.'], 'He + participio (invariable).')] });

  G({ id: 'indefinido', level: 'A2', title: 'Pretérito indefinido', summary: 'Acciones pasadas terminadas.',
    explain: ['El <b>indefinido</b> cuenta acciones terminadas en el pasado: «Ayer comí pizza».',
      tb(['Persona', '-ar (hablar)', '-er/-ir (comer, vivir)'], [['yo', 'hablé', 'comí / viví'], ['tú', 'hablaste', 'comiste / viviste'], ['él/ella/usted', 'habló', 'comió / vivió'], ['nosotros', 'hablamos', 'comimos / vivimos'], ['vosotros', 'hablasteis', 'comisteis / vivisteis'], ['ellos/ustedes', 'hablaron', 'comieron / vivieron']]),
      '<b>Irregulares frecuentes:</b> ser/ir → fui, fuiste, fue, fuimos, fuisteis, fueron; tener → tuve; hacer → hice, hizo; estar → estuve; decir → dije; poder → pude; venir → vine.',
      'Marcadores: <b>ayer, anoche, el año pasado, hace dos días, en 2020</b>.',
      ex('Ayer comí con mi familia.', 'El año pasado viajamos a Italia.', 'Anoche fui al cine.')],
    mistakes: [['Ella hablé con Juan.', 'Ella habló con Juan.', 'Con «ella» la terminación es -ó; con «yo» es -é.'], ['Yo tenía una fiesta ayer.', 'Tuve una fiesta ayer.', 'Una acción terminada en un momento concreto usa indefinido.']],
    exercises: [fill('Ayer yo ___ pizza. (comer)', 'comí', 'Yo + -er: -í.'), fill('Ella ___ por teléfono. (hablar)', 'habló', '3.ª persona -ar: -ó.'), fill('Nosotros ___ al cine. (ir)', 'fuimos', '«Ir» es irregular: fuimos.'), mc('Anoche yo ___ muy tarde. (llegar)', 'llegué', ['llegé', 'llegó', 'llegaba'], 'Con «yo» -ar: -é; la g cambia a gu: llegué.')],
    quiz: [fill('Ellos ___ en un hotel. (estar)', 'estuvieron', '«Estar»: estuvieron.'), mc('¿Cuál es correcta?', 'El año pasado viajé a Perú.', ['El año pasado viajo a Perú.', 'El año pasado he viajar a Perú.', 'El año pasado viajaba a Perú ayer.'], 'Acción terminada: indefinido.'), fill('Tú ___ la verdad. (decir)', 'dijiste', '«Decir»: dije, dijiste, dijo.')] });

  G({ id: 'imperfecto', level: 'B1', title: 'Pretérito imperfecto', summary: 'Descripciones, hábitos y acciones en curso en el pasado.',
    explain: ['El <b>imperfecto</b> describe cómo eran las cosas, lo que se hacía habitualmente o lo que estaba ocurriendo en el pasado.',
      tb(['Persona', '-ar (hablar)', '-er/-ir (comer, vivir)'], [['yo', 'hablaba', 'comía / vivía'], ['tú', 'hablabas', 'comías / vivías'], ['él/ella/usted', 'hablaba', 'comía / vivía'], ['nosotros', 'hablábamos', 'comíamos / vivíamos'], ['vosotros', 'hablabais', 'comíais / vivíais'], ['ellos/ustedes', 'hablaban', 'comían / vivían']]),
      '<b>Solo tres irregulares:</b> ser (era, eras, era, éramos, erais, eran), ir (iba, ibas...), ver (veía, veías...).',
      '<b>Imperfecto frente a indefinido:</b> «Cuando llegué (acción puntual, indefinido), llovía (descripción, imperfecto)».',
      ex('Cuando era niño, vivía en un pueblo.', 'Todos los veranos íbamos a la playa.', 'Mientras estudiaba, escuchaba música.')],
    mistakes: [['Cuando era niño, viví en un pueblo.', 'Cuando era niño, vivía en un pueblo.', 'Para describir una situación habitual usamos imperfecto.']],
    exercises: [fill('Cuando era niño, yo ___ en un pueblo. (vivir)', 'vivía', 'Descripción del pasado: imperfecto.'), fill('Todos los veranos nosotros ___ a la playa. (ir)', 'íbamos', '«Ir» es irregular: íbamos.'), mc('Mientras ella ___, yo escuchaba música. (estudiar)', 'estudiaba', ['estudió', 'estudiará', 'estudia'], 'Dos acciones simultáneas en curso.'), mc('Era de noche y ___ mucho. (llover)', 'llovía', ['llovió', 'llueve', 'lloverá'], 'Descripción del ambiente en el pasado: imperfecto.')],
    quiz: [fill('Ellos ___ muy jóvenes entonces. (ser)', 'eran', '«Ser» es irregular: eran.'), mc('¿Qué frase usa bien el imperfecto?', 'De pequeña, jugaba en la calle.', ['De pequeña, jugué en la calle siempre.', 'De pequeña, jugaré en la calle.', 'De pequeña, he jugado en la calle.'], 'Hábito del pasado: imperfecto.'), fill('Yo ___ la televisión por las noches. (ver)', 'veía', '«Ver» es irregular: veía.')] });

  G({ id: 'futuro', level: 'B1', title: 'Futuro', summary: 'Planes, predicciones y probabilidad.',
    explain: ['El <b>futuro simple</b> se forma con el infinitivo + <b>-é, -ás, -á, -emos, -éis, -án</b>: «hablaré, comerás, vivirá».',
      '<b>Irregulares frecuentes</b> (cambian la raíz): tener → tendré, hacer → haré, decir → diré, poder → podré, querer → querré, saber → sabré, salir → saldré, venir → vendré, poner → pondré, haber → habrá.',
      'También hablamos del futuro con <b>ir a + infinitivo</b> («Voy a viajar») y con el presente («Mañana salgo»). El futuro simple es más frecuente en predicciones y textos formales.',
      'Con el futuro podemos expresar <b>probabilidad en el presente</b>: «Serán las ocho» = «Creo que son las ocho».',
      ex('Mañana lloverá en el norte.', 'El año que viene viajaré a Chile.', '¿Dónde estará mi llave?')],
    mistakes: [['Yo tenderé tiempo.', 'Yo tendré tiempo.', '«Tener» es irregular: tendré.']],
    exercises: [fill('Mañana yo ___ a mis abuelos. (visitar)', 'visitaré', 'Infinitivo + -é.'), fill('Ella ___ muy contenta. (estar, probabilidad)', 'estará', 'Futuro de probabilidad: estará.'), fill('Nosotros ___ a las ocho. (salir)', 'saldremos', '«Salir» es irregular: saldremos.'), mc('El futuro de «hacer» (yo) es:', 'haré', ['haceré', 'hago', 'hacía'], 'Irregular: haré.')],
    quiz: [fill('Tú ___ mucho éxito. (tener)', 'tendrás', 'Irregular: tendrás.'), mc('¿Cuál expresa un plan futuro?', 'Mañana viajaré a Chile.', ['Ayer viajé a Chile.', 'Viajaba a Chile siempre.', 'He viajado a Chile.'], 'Futuro simple.'), mc('«¿Qué hora será?» expresa...', 'duda sobre la hora ahora', ['una hora futura exacta', 'un hábito del pasado', 'una orden'], 'Futuro de probabilidad.')] });

  G({ id: 'condicional', level: 'B1', title: 'Condicional', summary: 'Cortesía, consejos e hipótesis.',
    explain: ['El <b>condicional simple</b> se forma con el infinitivo + <b>-ía, -ías, -ía, -íamos, -íais, -ían</b>: «hablaría, comería, viviría». Los irregulares coinciden con los del futuro: tendría, haría, diría, podría...',
      tb(['Uso', 'Ejemplo'], [['Cortesía', 'Me gustaría un café. ¿Podría ayudarme?'], ['Consejo', 'Deberías descansar más.'], ['Hipótesis', 'Si tuviera tiempo, viajaría.'], ['Futuro desde el pasado', 'Dijo que vendría mañana.']]),
      '<b>Hipótesis con «si»:</b> <i>si + imperfecto de subjuntivo</i>, <i>condicional</i>: «Si tuviera más dinero, compraría una casa».',
      ex('Me gustaría reservar una mesa.', 'Yo en tu lugar hablaría con él.', 'Si fuera rico, viajaría por el mundo.')],
    mistakes: [['Si tendría tiempo, iría.', 'Si tuviera tiempo, iría.', 'Después de «si» no se usa condicional, sino imperfecto de subjuntivo.']],
    exercises: [fill('Me ___ un café, por favor. (gustar)', 'gustaría', 'Cortesía: condicional.'), fill('Yo en tu lugar ___ más. (estudiar)', 'estudiaría', 'Consejo: condicional.'), fill('¿___ ayudarme? (poder, usted)', 'Podría', 'Cortesía: podría.'), mc('Si tuviera tiempo, ___.', 'viajaría', ['viajo', 'viajé', 'viajaré'], 'Hipótesis: si + subjuntivo imperfecto, condicional.')],
    quiz: [fill('Nosotros ___ a la playa. (ir, si hiciera sol)', 'iríamos', 'Condicional de «ir».'), mc('¿Cuál es correcta?', 'Si fuera tú, hablaría con ella.', ['Si sería tú, hablaría con ella.', 'Si fuera tú, hablaré con ella.', 'Si soy tú, hablaría con ella.'], 'Si + imperfecto de subjuntivo + condicional.'), fill('Yo ___ una pregunta. (tener, cortés)', 'tendría', 'Irregular: tendría.')] });

  G({ id: 'subjuntivo', level: 'B1', title: 'Subjuntivo', summary: 'Deseos, dudas, emociones y futuro.',
    explain: ['El <b>presente de subjuntivo</b> se forma con la raíz de «yo» del presente + terminaciones «contrarias»: -ar → <b>-e, -es, -e, -emos, -éis, -en</b>; -er/-ir → <b>-a, -as, -a, -amos, -áis, -an</b>.',
      tb(['Infinitivo', 'Yo (presente)', 'Subjuntivo'], [['hablar', 'hablo', 'hable'], ['comer', 'como', 'coma'], ['venir', 'vengo', 'venga'], ['hacer', 'hago', 'haga'], ['ser', '—', 'sea'], ['ir', '—', 'vaya']]),
      'Lo usamos después de expresiones de <b>deseo</b> (quiero que), <b>duda</b> (no creo que), <b>emoción</b> (me alegro de que), <b>necesidad</b> (es necesario que) y con <b>cuando</b> si hablamos del futuro (cuando llegues).',
      '<b>Indicativo frente a subjuntivo:</b> «Creo que viene» (certeza) / «No creo que venga» (duda).',
      '<b>Imperfecto de subjuntivo</b> (B2): terminaciones -ara/-iera, -ase/-iese: «Si tuviera tiempo, viajaría».',
      ex('Quiero que vengas a mi fiesta.', 'No creo que tenga tiempo.', 'Cuando llegues, llámame.')],
    mistakes: [['Quiero que vienes.', 'Quiero que vengas.', 'Después de «querer que» usamos subjuntivo.'], ['Espero que llueve.', 'Espero que llueva.', 'Esperar que pide subjuntivo.']],
    exercises: [fill('Quiero que tú ___ conmigo. (venir)', 'vengas', '«Querer que» + subjuntivo.'), fill('Espero que ella ___ pronto. (llegar)', 'llegue', 'Subjuntivo de «llegar»: llegue.'), mc('No creo que ___ tiempo.', 'tenga', ['tiene', 'tendrá', 'tuvo'], '«No creo que» + subjuntivo.'), mc('Cuando ___ a casa, llámame.', 'llegues', ['llegas', 'llegaste', 'llegarás'], 'Con «cuando» y futuro usamos subjuntivo.')],
    quiz: [fill('Es importante que nosotros ___ temprano. (llegar)', 'lleguemos', 'Subjuntivo de «nosotros».'), mc('¿Cuál es correcta?', 'Me alegro de que estés aquí.', ['Me alegro de que estás aquí.', 'Me alegro de que estarás aquí.', 'Me alegro de que estuviste aquí hoy.'], 'Emoción + de que + subjuntivo.'), fill('Quiero que tú ___ la verdad. (decir)', 'digas', 'Subjuntivo de «decir»: digas.')] });

  G({ id: 'preposiciones', level: 'A2', title: 'Preposiciones', summary: 'A, de, en, con, por, para y más.',
    explain: [tb(['Preposición', 'Uso principal', 'Ejemplo'], [['a', 'dirección; objeto de persona', 'Voy a Madrid. Veo a Ana.'], ['de', 'origen, posesión, material', 'Soy de Perú. El libro de Luis.'], ['en', 'lugar, medio', 'Estoy en casa. Viajo en tren.'], ['con', 'compañía, instrumento', 'Voy con mi hermana.'], ['desde / hasta', 'inicio y fin', 'Trabajo desde las nueve hasta las cinco.'], ['entre', 'en medio de', 'Está entre el banco y el parque.']]),
      '<b>Contracciones:</b> a + el = <b>al</b>; de + el = <b>del</b>: «Voy al parque», «Vengo del trabajo».',
      '<b>Por y para:</b> <b>para</b> expresa finalidad, destino y plazo («Estudio para aprender», «Es para ti», «Para mañana»). <b>Por</b> expresa causa, medio y lugar de paso («Gracias por todo», «Hablo por teléfono», «Paso por el parque»).',
      '<b>A personal:</b> usamos «a» antes de un complemento directo de persona: «Veo a mi madre», pero «Veo la casa».',
      ex('Voy al supermercado con mi padre.', 'Este regalo es para ti.', 'Gracias por tu ayuda.')],
    mistakes: [['Voy a el parque.', 'Voy al parque.', 'a + el = al.'], ['Veo mi madre.', 'Veo a mi madre.', 'Se usa «a» con personas como complemento directo.']],
    exercises: [fill('Voy ___ parque. (a + el)', 'al', 'a + el = al.'), mc('Este regalo es ___ ti.', 'para', ['por', 'de', 'en'], 'Destinatario: para.'), mc('Gracias ___ tu ayuda.', 'por', ['para', 'a', 'con'], 'Causa del agradecimiento: por.'), fill('Veo ___ mi hermano. (a personal)', 'a', 'Complemento directo de persona: a.')],
    quiz: [fill('Vengo ___ trabajo. (de + el)', 'del', 'de + el = del.'), mc('Estudio ___ aprender español.', 'para', ['por', 'con', 'de'], 'Finalidad: para.'), mc('Hablo ___ teléfono.', 'por', ['para', 'en', 'de'], 'Medio: por.')] });

  G({ id: 'conectores', level: 'B1', title: 'Conectores', summary: 'Palabras que unen ideas y ordenan el discurso.',
    explain: [tb(['Función', 'Conectores', 'Ejemplo'], [['Añadir', 'y, además, también', 'Estudia y trabaja. Además, hace deporte.'], ['Oponer', 'pero, sin embargo, aunque', 'Es caro, pero es bueno.'], ['Causa', 'porque, como, ya que', 'No salí porque llovía.'], ['Consecuencia', 'por eso, así que, por lo tanto', 'Llovía; por eso me quedé.'], ['Orden', 'primero, luego, después, finalmente', 'Primero comí y luego salí.'], ['Ejemplificar', 'por ejemplo', 'Me gusta la fruta, por ejemplo la manzana.']]),
      '<b>Porque</b> responde a «¿por qué?». <b>Como</b> al principio de la frase también introduce una causa: «Como llueve, no salimos».',
      '<b>Aunque</b> + indicativo expresa un hecho real («Aunque llueve, salgo»); + subjuntivo, una posibilidad o algo poco importante («Aunque llueva, saldré»).',
      ex('Estudió mucho; sin embargo, no aprobó.', 'Como estaba cansado, se fue a dormir.', 'Primero cenamos y después vimos una película.')],
    mistakes: [['Llovía, porque me quedé en casa.', 'Llovía, por eso me quedé en casa.', '«Porque» introduce la causa, «por eso» la consecuencia.']],
    exercises: [mc('Estudió mucho; ___, no aprobó.', 'sin embargo', ['por eso', 'además', 'porque'], 'Oposición: sin embargo.'), mc('Llovía; ___ nos quedamos en casa.', 'por eso', ['aunque', 'pero', 'como'], 'Consecuencia: por eso.'), fill('No salí ___ llovía.', 'porque', 'Causa: porque.'), mc('___ comimos y después salimos.', 'Primero', ['Aunque', 'Porque', 'Sin embargo'], 'Ordena las acciones.')],
    quiz: [mc('Elige el conector de causa:', 'ya que', ['por lo tanto', 'sin embargo', 'por eso'], '«Ya que» introduce una causa.'), fill('Es caro, ___ es muy bueno.', 'pero', 'Oposición simple: pero.'), mc('¿Cuál es correcta?', 'Como estaba cansada, se fue a dormir.', ['Como estaba cansada, por eso se fue a dormir.', 'Estaba cansada como se fue a dormir.', 'Como estaba cansada pero se fue a dormir.'], '«Como» + causa, y después la consecuencia.')] });

  G({ id: 'orden', level: 'A1', title: 'Orden de las palabras', summary: 'Sujeto, verbo y complementos; adjetivos; negación y preguntas.',
    explain: ['El orden básico es <b>sujeto + verbo + complementos</b>: «Ana come una manzana en el parque».',
      'El adjetivo suele ir <b>después</b> del sustantivo: «una casa grande», «un libro interesante».',
      'La negación va <b>antes del verbo</b>: «No hablo inglés». Con otra negación: «No tengo nada».',
      'Las preguntas empiezan por la palabra interrogativa: «¿Dónde vives?». Con sí/no basta con la entonación: «¿Vives aquí?».',
      'Los pronombres de objeto van <b>antes del verbo</b>: «Lo compro», «Me gusta», «Te veo mañana».',
      ex('Mi hermano compra un libro nuevo.', 'No quiero café.', '¿Qué estudias en la universidad?', 'Lo veo todos los días.')],
    mistakes: [['Tengo un coche rojo nuevo grande.', 'Tengo un coche grande, rojo y nuevo.', 'Varios adjetivos se separan con comas y «y».'], ['Hablo no inglés.', 'No hablo inglés.', 'La negación va antes del verbo.']],
    exercises: [order('Mi hermana estudia español en la universidad', 'Sujeto + verbo + complementos.'), order('No quiero café con leche', 'La negación va antes del verbo.'), order('¿Dónde vives tú?', 'Interrogativo al principio.', { alts: ['¿Dónde vives?'] }), order('Lo compro todos los días', 'El pronombre va antes del verbo.')],
    quiz: [mc('¿Qué frase es correcta?', 'Tengo una casa grande.', ['Tengo grande una casa.', 'Grande tengo casa una.', 'Una casa tengo grande.'], 'El adjetivo va después del sustantivo.'), order('Hoy voy al colegio', 'Marcador de tiempo + verbo + lugar.', { alts: ['Voy al colegio hoy'] }), mc('¿Cuál es la negación correcta?', 'No hablo francés.', ['Hablo no francés.', 'No francés hablo.', 'Hablo francés no.'], 'La negación va antes del verbo.')] });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, listen } = L.Q;
  C.pron = [];
  const T = (t) => { t.quiz = t.quiz.map((q) => { q.s = 'pronunciación'; return L.Q.prep(q, 'pron:' + t.id, 'A1'); }); C.pron.push(t); };
  const tip = (text) => ({ t: 'tip', text });
  const tb = (head, rows) => ({ t: 'table', head, rows });

  T({ id: 'vocales', title: 'Las vocales', summary: 'Cinco vocales, cinco sonidos siempre iguales.',
    explain: ['El español tiene <b>cinco vocales</b>: a, e, i, o, u. Cada una tiene un sonido corto y estable: no cambia según la palabra.',
      tb(['Vocal', 'Sonido aproximado', 'Ejemplos'], [['a', 'boca abierta', 'casa, mamá'], ['e', 'como en «mesa»', 'mesa, verde'], ['i', 'sonido agudo', 'sí, libro'], ['o', 'labios redondos', 'foto, ojo'], ['u', 'labios muy redondos', 'uno, luna']]),
      'En español no se alargan ni se reducen las vocales sin acento. Pronuncia cada una con claridad.',
      '<b>Diptongos:</b> dos vocales juntas en la misma sílaba: <b>bien</b>, <b>cuatro</b>, <b>aire</b>, <b>auto</b>. <b>Hiatos:</b> dos vocales en sílabas distintas: <b>pa-ís</b>, <b>le-er</b>.'],
    items: [['a', ['casa', 'mamá', 'plata', 'agua']], ['e', ['mesa', 'verde', 'leche', 'tela']], ['i', ['sí', 'libro', 'amigo', 'cine']], ['o', ['foto', 'ojo', 'todo', 'oro']], ['u', ['uno', 'luna', 'azul', 'cubo']]],
    pairs: [['pan', 'pen'], ['mesa', 'misa'], ['solo', 'sala']],
    quiz: [listen('luna', 'Escucha: ¿qué palabra oyes?', 'luna', ['lana', 'lona'], 'La vocal tónica es «u».'), listen('mesa', 'Escucha: ¿qué palabra oyes?', 'mesa', ['misa', 'masa'], 'Se oye «e» en la primera sílaba.'), mc('¿Cuántas vocales tiene el español?', 'cinco', ['tres', 'siete', 'diez'], 'Son a, e, i, o, u.'), mc('En «cuatro» las vocales «ua» forman un...', 'diptongo', ['hiato', 'triptongo', 'acento'], 'Dos vocales en la misma sílaba forman un diptongo.')] });

  T({ id: 'consonantes', title: 'Consonantes clave', summary: 'b/v, g/j, h, qu, ñ, ll/y, c/z.',
    explain: [tb(['Letra(s)', 'Sonido', 'Ejemplos'], [['b y v', 'suenan igual', 'vaca, baca; vino, bien'], ['h', 'no se pronuncia', 'hola, hotel'], ['j', 'sonido áspero (como una h fuerte)', 'jamón, ojo'], ['g + a, o, u', 'sonido «g»', 'gato, gota, gusto'], ['g + e, i', 'igual que la j', 'gente, giro'], ['gue, gui', 'la u no suena', 'guerra, guitarra'], ['güe, güi', 'la u suena', 'pingüino, vergüenza'], ['qu + e, i', 'sonido «k»; la u no suena', 'queso, quince'], ['ñ', 'sonido nasal palatal', 'niño, año, mañana'], ['ch', 'sonido «ch»', 'chico, noche'], ['ll / y', 'en muchos lugares suenan igual (yeísmo)', 'llave, yo, calle']]),
      '<b>c y z:</b> «ca, co, cu» suenan «k» (casa, coche, cuna). Con «ce, ci» y con «z» hay <b>dos variedades igual de correctas</b>: en la mayor parte de España se pronuncia como una «z» interdental (cena, zapato); en América Latina y en el sur de España suena como una «s» (seseo).',
      tip('Ninguna pronunciación regional es mejor que otra. Escucha varias y elige la que quieras usar de forma coherente.')],
    items: [['b / v', ['vaca', 'bien', 'vino', 'abuela']], ['h muda', ['hola', 'hotel', 'huevo', 'hermano']], ['j', ['jamón', 'ojo', 'viaje', 'rojo']], ['g', ['gato', 'gente', 'guitarra', 'pingüino']], ['qu', ['queso', 'quince', 'aquí', 'tranquilo']], ['ñ', ['niño', 'año', 'mañana', 'español']], ['ll / y', ['llave', 'calle', 'yo', 'playa']], ['c / z', ['casa', 'cena', 'zapato', 'cielo']]],
    pairs: [['caña', 'cana'], ['uña', 'una'], ['mono', 'moño'], ['gato', 'cato']],
    quiz: [listen('niño', 'Escucha: ¿qué palabra oyes?', 'niño', ['nino', 'ninio'], 'Se oye el sonido «ñ».'), mc('¿Qué letra no se pronuncia en «hola»?', 'h', ['o', 'l', 'a'], 'La «h» es muda en español.'), mc('En «guitarra», la «u»...', 'no se pronuncia', ['se pronuncia siempre', 'suena como «o»', 'suena como «b»'], 'En «gui» la u no suena.'), mc('La «g» de «gente» suena como la...', 'j', ['k', 'b', 'ñ'], 'Con «e» e «i», g = j.')] });

  T({ id: 'r-rr', title: 'R y RR', summary: 'Una vibración suave y otra fuerte.',
    explain: ['La <b>r</b> entre vocales es una vibración corta («caro», «pero»). La <b>rr</b> es una vibración múltiple («carro», «perro»). Al principio de palabra, o después de n, l, s, la «r» suena fuerte: <b>rosa</b>, <b>Enrique</b>, <b>alrededor</b>.',
      tb(['r suave', 'r fuerte'], [['caro', 'carro'], ['pero', 'perro'], ['coro', 'corro'], ['cero', 'cerro']]),
      '<b>Atención:</b> cambiar r por rr cambia el significado de la palabra.',
      tip('Practica diciendo «tetera» muy rápido: la lengua toca el paladar una vez. Para rr, deja que la lengua vibre varias veces.')],
    items: [['r suave', ['caro', 'pero', 'toro', 'cara']], ['rr', ['carro', 'perro', 'torre', 'guitarra']], ['r inicial', ['rosa', 'ropa', 'rápido', 'río']]],
    pairs: [['pero', 'perro'], ['caro', 'carro'], ['coro', 'corro'], ['cero', 'cerro']],
    quiz: [listen('perro', 'Escucha: ¿qué palabra oyes?', 'perro', ['pero'], 'Se oye la «rr» fuerte.'), listen('caro', 'Escucha: ¿qué palabra oyes?', 'caro', ['carro'], 'Se oye una «r» suave.'), mc('¿Cómo suena la «r» al principio de «rosa»?', 'fuerte', ['suave', 'muda', 'como «l»'], 'La r inicial es fuerte.'), mc('¿Qué par cambia de significado por r/rr?', 'pero / perro', ['casa / caza', 'mesa / misa', 'niño / niña'], '«Pero» y «perro» son palabras distintas.')] });

  T({ id: 'silabas-acento', title: 'Sílabas y acento', summary: 'Dónde suena más fuerte la palabra y cuándo lleva tilde.',
    explain: ['Las palabras se dividen en <b>sílabas</b>: ca-sa, es-cue-la, te-lé-fo-no. Una sílaba suena más fuerte: la <b>sílaba tónica</b>.',
      tb(['Tipo', 'Sílaba tónica', 'Ejemplos'], [['Aguda', 'la última', 'ca-FÉ, ha-BLAR, ciu-DAD'], ['Llana (grave)', 'la penúltima', 'CA-sa, LÁ-piz, ÁR-bol'], ['Esdrújula', 'la antepenúltima', 'TE-LÉ-fo-no, MÚ-si-ca']]),
      '<b>Reglas de la tilde:</b> las <b>agudas</b> llevan tilde si terminan en <b>n, s o vocal</b> (café, canción). Las <b>llanas</b> llevan tilde si <b>no</b> terminan en n, s o vocal (lápiz, árbol). Las <b>esdrújulas</b> siempre llevan tilde (teléfono, música).',
      tip('La tilde cambia el significado a veces: «papa» (alimento) y «papá» (padre); «sabia» y «sabía».')],
    items: [['agudas', ['café', 'canción', 'hablar', 'ciudad']], ['llanas', ['casa', 'lápiz', 'árbol', 'mesa']], ['esdrújulas', ['teléfono', 'música', 'rápido', 'sábado']]],
    pairs: [['papa', 'papá'], ['sabia', 'sabía'], ['hablo', 'habló']],
    quiz: [mc('¿Cuántas sílabas tiene «escuela»?', 'tres', ['dos', 'cuatro', 'una'], 'Es-cue-la.'), mc('«Café» es una palabra...', 'aguda', ['llana', 'esdrújula', 'sin acento'], 'La sílaba tónica es la última.'), mc('«Teléfono» lleva tilde porque es...', 'esdrújula', ['aguda', 'llana', 'monosílaba'], 'Las esdrújulas siempre llevan tilde.'), listen('papá', 'Escucha: ¿qué palabra oyes?', 'papá', ['papa'], 'La sílaba tónica es la última: papá.')] });

  T({ id: 'entonacion', title: 'Entonación', summary: 'Cómo suenan las preguntas, las frases y las exclamaciones.',
    explain: ['La <b>entonación</b> es la melodía de la frase. En español:',
      tb(['Tipo de frase', 'Melodía', 'Ejemplo'], [['Enunciado', 'baja al final', 'Vivo en Madrid.'], ['Pregunta de sí o no', 'sube al final', '¿Vives en Madrid?'], ['Pregunta con interrogativo', 'empieza alta y baja al final', '¿Dónde vives?'], ['Exclamación', 'más intensa', '¡Qué bonito!']]),
      'Escribimos <b>dos signos</b> en preguntas y exclamaciones: ¿...? y ¡...!. El primero marca dónde empieza la melodía especial.',
      tip('Escucha la misma frase como afirmación y como pregunta: solo cambia la melodía.')],
    items: [['Enunciados', ['Vivo en Madrid.', 'Me llamo Lucía.', 'Hoy hace sol.']], ['Preguntas de sí o no', ['¿Vives en Madrid?', '¿Tienes hermanos?', '¿Hablas español?']], ['Preguntas con interrogativo', ['¿Dónde vives?', '¿Cómo te llamas?', '¿Qué hora es?']], ['Exclamaciones', ['¡Qué bonito!', '¡Feliz cumpleaños!', '¡Cuánto tiempo!']]],
    pairs: [['Vives aquí.', '¿Vives aquí?']],
    quiz: [mc('En una pregunta de sí o no, la voz...', 'sube al final', ['baja al final', 'no cambia', 'desaparece'], 'La melodía sube al final.'), mc('¿Cuántos signos de interrogación se escriben en español?', 'dos', ['uno', 'tres', 'ninguno'], 'Uno de apertura (¿) y uno de cierre (?).'), listen('¿Dónde vives?', 'Escucha: ¿qué tipo de frase es?', 'Una pregunta', ['Una orden', 'Una exclamación'], 'Es una pregunta con interrogativo.'), mc('¿Qué frase es una exclamación?', '¡Qué bonito!', ['¿Qué bonito?', 'Qué bonito.', 'Qué bonito, no'], 'Las exclamaciones llevan ¡ !.')] });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill } = L.Q;
  C.stories = [];
  const S = (s) => { s.questions = s.questions.map((q) => { q.s = 'lectura'; return L.Q.prep(q, 'story:' + s.id, s.level); }); s.expr = s.expr.map((q) => { q.s = 'vocabulario'; return L.Q.prep(q, 'story:' + s.id, s.level); }); C.stories.push(s); };

  S({ id: 'el-gato-de-lucia', level: 'A1', title: 'El gato de Lucía', emoji: '🐱',
    paragraphs: ['Lucía tiene un gato. Se llama Nube. Nube es blanco y muy pequeño. Vive en un piso en Madrid con Lucía.', 'Todas las mañanas, Nube bebe leche y duerme en el sofá. Por la tarde, juega con una pelota roja.', 'Hoy Lucía no encuentra a Nube. Busca en la cocina, en el baño y en el salón. ¡Nube está dentro de una caja!', 'Lucía se ríe y dice: «Nube, eres un gato muy divertido».'],
    vocab: [['el piso', 'Vivienda dentro de un edificio.'], ['la pelota', 'Objeto redondo con el que se juega.'], ['encontrar', 'Descubrir dónde está algo o alguien que buscabas.'], ['la caja', 'Recipiente con tapa para guardar cosas.'], ['reírse', 'Mostrar alegría con la cara y con la voz.']],
    questions: [mc('¿Cómo es Nube?', 'Blanco y pequeño', ['Negro y grande', 'Rojo y pequeño', 'Blanco y grande'], 'El texto dice «Nube es blanco y muy pequeño».'), mc('¿Dónde duerme Nube por la mañana?', 'En el sofá', ['En la cocina', 'En una caja', 'En el baño'], 'Se dice «duerme en el sofá».'), mc('¿Con qué juega Nube por la tarde?', 'Con una pelota roja', ['Con una caja', 'Con leche', 'Con Lucía'], 'Juega con una pelota roja.'), mc('¿Dónde está Nube hoy?', 'Dentro de una caja', ['En la cocina', 'En el salón', 'En el baño'], 'Lucía la encuentra «dentro de una caja».')],
    order: ['Por la mañana, Nube bebe leche y duerme en el sofá.', 'Por la tarde, Nube juega con una pelota.', 'Hoy Lucía busca a Nube por toda la casa.', 'Lucía encuentra a Nube dentro de una caja.'],
    expr: [fill('Nube bebe leche ___ las mañanas. (cada mañana)', 'todas', '«Todas las mañanas» expresa una costumbre.'), mc('«Lucía se ríe» significa que Lucía...', 'está alegre y hace ruido con la cara y la voz', ['está enfadada', 'está durmiendo', 'busca algo'], 'Reírse es mostrar alegría.')] });

  S({ id: 'fin-de-semana-en-valencia', level: 'A2', title: 'Un fin de semana en Valencia', emoji: '🏖️',
    paragraphs: ['El sábado pasado viajé a Valencia con mi hermana. Salimos de Madrid a las ocho de la mañana y llegamos a mediodía.', 'Primero dejamos las maletas en el hotel, que está muy cerca de la playa. Después comimos paella en un restaurante pequeño. ¡Estaba deliciosa!', 'Por la tarde visitamos la Ciudad de las Artes y las Ciencias. Hicimos muchas fotos porque los edificios son muy modernos.', 'El domingo por la mañana paseamos por la playa y compramos recuerdos para nuestros padres. Volvimos a casa cansadas, pero muy contentas.'],
    vocab: [['el mediodía', 'Las doce de la mañana, cuando el sol está más alto.'], ['la paella', 'Plato de arroz típico de Valencia.'], ['el recuerdo', 'Objeto que compras en un viaje para acordarte del lugar.'], ['pasear', 'Caminar tranquilamente por placer.'], ['moderno', 'Muy nuevo o de estilo actual.']],
    questions: [mc('¿Con quién viajó la narradora?', 'Con su hermana', ['Con sus padres', 'Con una amiga', 'Sola'], 'Dice «viajé a Valencia con mi hermana».'), mc('¿A qué hora llegaron a Valencia?', 'A mediodía', ['A las ocho', 'Por la noche', 'Por la tarde'], '«Salimos... a las ocho y llegamos a mediodía».'), mc('¿Cómo estaba la paella?', 'Deliciosa', ['Fría', 'Muy cara', 'Pequeña'], 'La narradora dice «¡Estaba deliciosa!».'), mc('¿Qué hicieron el domingo por la mañana?', 'Pasearon por la playa y compraron recuerdos', ['Visitaron un museo', 'Volvieron a Madrid temprano', 'Comieron en un restaurante'], 'El texto dice «paseamos por la playa y compramos recuerdos».')],
    order: ['Salieron de Madrid a las ocho de la mañana.', 'Dejaron las maletas en el hotel.', 'Comieron paella en un restaurante pequeño.', 'Visitaron la Ciudad de las Artes y las Ciencias.', 'El domingo pasearon por la playa.'],
    expr: [fill('Compramos recuerdos ___ nuestros padres. (destinatario)', 'para', '«Para» indica el destinatario.'), mc('«Volvimos cansadas, pero muy contentas» expresa...', 'un contraste entre cansancio y alegría', ['solo alegría', 'solo cansancio', 'una orden'], '«Pero» introduce un contraste.')] });

  S({ id: 'el-dia-que-perdi-el-tren', level: 'B1', title: 'El día que perdí el tren', emoji: '🚆',
    paragraphs: ['Ese lunes me desperté tarde porque no sonó el despertador. Me vestí rápidamente, cogí la mochila y salí corriendo hacia la estación.', 'Cuando llegué, el tren ya había salido. Sentí mucha rabia, pero no tenía otra opción: tenía que esperar dos horas hasta el siguiente.', 'Para no aburrirme, compré un libro en el quiosco y me senté en una cafetería. Empecé a leer y, de repente, me di cuenta de que a mi lado estaba sentado un antiguo compañero de clase.', 'Charlamos durante horas sobre nuestros recuerdos. Al final, perder el tren fue una suerte: gracias a eso nos reencontramos después de diez años.'],
    vocab: [['el despertador', 'Reloj que suena a una hora para despertarte.'], ['el quiosco', 'Pequeña tienda en la calle donde se venden periódicos y revistas.'], ['antiguo', 'Que existió o sucedió hace mucho tiempo; también, que ya no lo es: «un antiguo compañero».'], ['reencontrarse', 'Volver a encontrarse con alguien después de mucho tiempo.'], ['la suerte', 'Casualidad que resulta favorable.']],
    questions: [mc('¿Por qué se despertó tarde?', 'Porque no sonó el despertador', ['Porque estaba enfermo', 'Porque se acostó tarde', 'Porque perdió el móvil'], 'El texto dice «no sonó el despertador».'), mc('¿Qué sintió al llegar a la estación?', 'Rabia', ['Alegría', 'Sorpresa', 'Miedo'], '«Sentí mucha rabia».'), mc('¿Por qué compró un libro?', 'Para no aburrirse mientras esperaba', ['Para regalárselo a alguien', 'Porque trabajaba en un quiosco', 'Porque le gustaba el quiosco'], '«Para no aburrirme, compré un libro».'), mc('¿Por qué dice el autor que perder el tren fue una suerte?', 'Porque se reencontró con un antiguo compañero', ['Porque llegó antes a su destino', 'Porque encontró trabajo', 'Porque el tren tuvo un accidente'], 'Gracias a perder el tren se reencontró con un antiguo compañero.')],
    order: ['No sonó el despertador y se despertó tarde.', 'Llegó a la estación y el tren ya había salido.', 'Compró un libro y se sentó en una cafetería.', 'Se dio cuenta de que un antiguo compañero estaba a su lado.', 'Charlaron durante horas.'],
    expr: [mc('«De repente» significa...', 'de forma inesperada, sin avisar', ['poco a poco', 'todos los días', 'con cuidado'], 'Indica que algo ocurre de forma súbita.'), mc('«Darse cuenta de algo» es...', 'comprender algo que antes no veías', ['dar algo a alguien', 'contar dinero', 'cuidar algo'], 'Se usa cuando descubres o comprendes algo.')] });

  S({ id: 'la-ciudad-sin-coches', level: 'B2', title: 'La ciudad sin coches', emoji: '🚲',
    paragraphs: ['Desde hace tres años, el centro histórico de la ciudad está cerrado al tráfico privado. La medida, que al principio generó un fuerte rechazo, ha transformado la vida de los vecinos.', 'Los defensores del proyecto destacan que la contaminación ha disminuido casi un treinta por ciento y que las calles se han llenado de terrazas, juegos infantiles y bicicletas.', 'Sin embargo, algunos comerciantes sostienen que sus ventas han descendido porque los clientes habituales, sobre todo los mayores, ya no pueden llegar cómodamente en coche.', 'El ayuntamiento reconoce que el plan no es perfecto y estudia ahora ampliar el transporte público y habilitar zonas de aparcamiento en la periferia. Los expertos coinciden en que el éxito dependerá de ofrecer alternativas reales y no solo de prohibir.'],
    vocab: [['el rechazo', 'Reacción de oposición ante algo que no se acepta.'], ['sostener', 'Afirmar con firmeza una opinión.'], ['habilitar', 'Preparar un espacio para que pueda usarse.'], ['la periferia', 'Zona que está en las afueras de una ciudad.'], ['coincidir', 'Tener la misma opinión que otras personas.']],
    questions: [mc('¿Qué efecto positivo se menciona?', 'La contaminación ha disminuido', ['Los comercios venden más', 'Hay más aparcamientos', 'El transporte público es gratis'], 'Dice que la contaminación bajó casi un treinta por ciento.'), mc('¿Qué critican algunos comerciantes?', 'Que los clientes mayores no pueden llegar cómodamente en coche', ['Que las calles son muy estrechas', 'Que hay demasiadas terrazas', 'Que el ayuntamiento no escucha'], 'Sus ventas bajan porque los clientes habituales no llegan en coche.'), mc('¿Qué estudia ahora el ayuntamiento?', 'Ampliar el transporte público y crear aparcamientos en las afueras', ['Cerrar más calles', 'Eliminar las terrazas', 'Subir los impuestos'], 'El texto lo indica en el último párrafo.'), mc('¿Qué opinan los expertos?', 'Que el éxito depende de ofrecer alternativas reales', ['Que el plan debe cancelarse', 'Que solo hay que prohibir más', 'Que los vecinos no deben opinar'], 'Coinciden en que no basta con prohibir.')],
    order: ['El centro se cerró al tráfico privado.', 'Al principio, mucha gente rechazó la medida.', 'La contaminación disminuyó y las calles ganaron vida.', 'Algunos comerciantes denuncian una caída de ventas.', 'El ayuntamiento estudia ofrecer más alternativas.'],
    expr: [mc('«Sin embargo» en el tercer párrafo sirve para...', 'oponer una idea a la anterior', ['añadir una causa', 'dar un ejemplo', 'terminar el texto'], 'Introduce una oposición.'), mc('«Los expertos coinciden» significa que...', 'tienen la misma opinión', ['no se ponen de acuerdo', 'no conocen el tema', 'dudan de todo'], 'Coincidir es tener la misma opinión.')] });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  C.dialogs = [];
  const D = (id, level, title, who, lines, extra) => C.dialogs.push(Object.assign({ id, level, title, who, lines: lines.map((t, i) => ({ who: i % 2, text: t })) }, extra || {}));

  D('presentaciones', 'A1', 'Presentaciones', ['Lucía', 'Marcos'], [
    'Hola, buenos días. Me llamo Lucía. ¿Y tú?', 'Hola, Lucía. Yo me llamo Marcos. Mucho gusto.', 'Encantada. ¿De dónde eres, Marcos?', 'Soy de Argentina, de Córdoba. ¿Y tú?',
    'Yo soy de Colombia, de Medellín. Ahora vivo en Madrid.', '¿Y qué haces en Madrid?', 'Soy estudiante de arquitectura. ¿Y tú?', 'Yo trabajo en una librería, cerca de aquí.'],
    { alts: ['Mucho gusto, Marcos. Me llamo Lucía.', 'Encantado de conocerte.'], gaps: [[0, 'llamo'], [2, 'eres'], [4, 'vivo']] });

  D('conversaciones-cotidianas', 'A1', 'Conversaciones cotidianas', ['Elena', 'Pablo'], [
    'Hola, Pablo. ¿Cómo estás?', 'Muy bien, gracias. ¿Y tú, Elena?', 'Un poco cansada, pero contenta. Hoy tengo mucho trabajo.', 'Yo también. Tengo una reunión a las tres.',
    '¿Quieres un café ahora?', 'Sí, por favor. Un café con leche.', 'Perfecto. Yo quiero un té. Vamos a la cafetería.', 'Vale, vamos.'],
    { alts: ['Estoy bien, gracias.', 'Así, así, ¿y tú?'], gaps: [[0, 'estás'], [2, 'cansada'], [5, 'leche']] });

  D('pedir-indicaciones', 'A2', 'Pedir indicaciones', ['Turista', 'Vecina'], [
    'Perdone, ¿sabe dónde está la estación de tren?', 'Sí, claro. Siga todo recto por esta calle.', '¿Está lejos de aquí?', 'No, está a diez minutos andando.',
    'Entonces sigo recto y... ¿después?', 'Al final de la calle, gire a la derecha. La estación está enfrente de la plaza.', 'Muchísimas gracias por su ayuda.', 'De nada. ¡Buen viaje!'],
    { alts: ['Disculpe, ¿dónde queda la estación?', 'Gracias, es usted muy amable.'], gaps: [[1, 'recto'], [3, 'minutos'], [5, 'derecha']] });

  D('en-el-restaurante', 'A2', 'En el restaurante', ['Camarero', 'Clienta'], [
    'Buenas noches. ¿Tienen reserva?', 'Sí, a nombre de Martínez, para dos personas.', 'Perfecto. Pasen por aquí, por favor. Esta es su mesa.', 'Gracias. ¿Nos puede traer la carta?',
    'Enseguida. ¿Qué desean beber?', 'Yo quiero agua sin gas y mi amigo, una cerveza.', 'Muy bien. ¿Y para comer ya saben qué van a pedir?', 'Sí, de primero, una ensalada y, de segundo, pescado a la plancha.',
    'Excelente elección. ¿Algo de postre?', 'Todavía no. Después, la cuenta, por favor.'],
    { alts: ['Quisiera una mesa para dos, por favor.', '¿Qué me recomienda?'], gaps: [[0, 'reserva'], [3, 'carta'], [7, 'pescado']] });

  D('en-el-aeropuerto', 'A2', 'En el aeropuerto', ['Empleado', 'Viajero'], [
    'Buenos días. Su pasaporte y su billete, por favor.', 'Aquí tiene. Voy a Lima en el vuelo de las doce.', 'Gracias. ¿Va a facturar maletas?', 'Sí, una maleta. La otra la llevo conmigo.',
    'Muy bien. La maleta pesa veinte kilos, está bien. Aquí tiene su tarjeta de embarque.', '¿Por qué puerta embarco?', 'Por la puerta catorce. El embarque empieza a las once y media.', 'Muchas gracias. Buen día.'],
    { alts: ['¿A qué hora sale el vuelo?', '¿Dónde está la puerta de embarque?'], gaps: [[1, 'vuelo'], [3, 'maleta'], [6, 'puerta']] });

  D('en-el-hotel', 'A2', 'En el hotel', ['Recepcionista', 'Huésped'], [
    'Buenas tardes. Bienvenido al Hotel Mar Azul. ¿En qué puedo ayudarle?', 'Buenas tardes. Tengo una reserva a nombre de Rivera para tres noches.', 'Un momento, por favor. Sí, una habitación doble con vistas al mar.', 'Perfecto. ¿El desayuno está incluido?',
    'Sí, se sirve de siete a diez en el comedor del primer piso.', 'Muy bien. ¿Hay wifi en la habitación?', 'Sí, la contraseña está en esta tarjeta. Su habitación es la 204.', 'Gracias. ¿Me puede despertar mañana a las siete?'],
    { alts: ['¿A qué hora es la salida?', 'Necesito una toalla más, por favor.'], gaps: [[1, 'reserva'], [4, 'comedor'], [6, 'habitación']] });

  D('de-compras', 'A2', 'De compras', ['Dependienta', 'Cliente'], [
    'Buenos días. ¿Puedo ayudarle?', 'Sí, busco una camisa azul, talla mediana.', 'Tenemos esta, que es de algodón. ¿Quiere probársela?', 'Sí, gracias. ¿Dónde están los probadores?',
    'Al fondo, a la izquierda. ... ¿Qué tal le queda?', 'Me queda un poco grande. ¿Tiene una talla más pequeña?', 'Sí, un momento. Aquí tiene. Cuesta veinticinco euros.', 'Me la llevo. ¿Puedo pagar con tarjeta?'],
    { alts: ['¿Cuánto cuesta esta camisa?', 'Es demasiado cara para mí.'], gaps: [[1, 'talla'], [3, 'probadores'], [7, 'tarjeta']] });

  D('en-el-trabajo', 'B1', 'En el trabajo', ['Carmen', 'Andrés'], [
    'Andrés, ¿tienes un minuto? Quería comentarte lo del informe del trimestre.', 'Claro, Carmen. Estaba revisando los datos justo ahora.', 'Creo que deberíamos entregarlo el jueves, no el viernes, porque el director viaja.', 'Me parece bien, aunque necesitaré que el equipo de ventas me envíe sus cifras antes.',
    'Se las pediré hoy mismo. ¿Crees que llegaremos a tiempo?', 'Si nadie se retrasa, sí. De todos modos, prefiero tener un plan alternativo.', 'Tienes razón. Entonces, si el miércoles no tenemos todo, reorganizamos las tareas.', 'Perfecto. Te escribo un correo con los plazos para que quede por escrito.'],
    { alts: ['Estoy de acuerdo contigo.', 'No creo que lleguemos si no empezamos hoy.'], gaps: [[0, 'informe'], [2, 'jueves'], [7, 'correo']] });

  D('en-la-universidad', 'B1', 'En la universidad', ['Sofía', 'Profesor Ruiz'], [
    'Buenos días, profesor. ¿Puedo hablar con usted un momento sobre mi trabajo final?', 'Claro, Sofía, pasa. ¿Ya has elegido el tema?', 'Sí, quiero investigar cómo han cambiado los hábitos de lectura entre los jóvenes.', 'Es un tema interesante. ¿Has pensado cómo vas a recoger los datos?',
    'Estaba pensando en hacer una encuesta, pero no sé si es suficiente.', 'Sería mejor combinarla con algunas entrevistas, para tener opiniones más detalladas.', 'Buena idea. ¿Para cuándo tendría que presentarle el primer borrador?', 'Dentro de un mes, más o menos. Envíamelo por correo y lo comentamos.'],
    { alts: ['Muchas gracias por su ayuda.', '¿Podría recomendarme algunos libros?'], gaps: [[0, 'trabajo'], [4, 'encuesta'], [7, 'correo']] });

  D('hablar-por-telefono', 'B1', 'Hablar por teléfono', ['Recepción', 'Clienta'], [
    'Clínica Dental Sonrisa, buenos días. ¿En qué puedo ayudarle?', 'Buenos días. Quisiera pedir cita para una revisión, si es posible.', 'Por supuesto. ¿Le viene bien el martes por la mañana?', 'El martes no puedo, tengo una reunión. ¿Tiene algún hueco el miércoles?',
    'Déjeme mirar... El miércoles a las cuatro de la tarde hay una cita libre.', 'Perfecto, me va bien a las cuatro. ¿Necesita algún dato mío?', 'Sí, su nombre completo y un número de teléfono, por favor.', 'Me llamo Irene Campos y mi móvil es el seis, uno, dos, tres, cuatro, cinco, seis, siete, ocho.'],
    { alts: ['¿Podría repetirlo, por favor?', 'Voy a llamar más tarde.'], gaps: [[1, 'cita'], [3, 'miércoles'], [6, 'nombre']] });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, listen, order, fill } = L.Q;
  const prepAll = (arr, tag, level, skill) => arr.map((q) => { if (skill) q.s = skill; return L.Q.prep(q, tag, level); });

  // ---------------- ESCUCHAR ----------------
  C.listening = [];
  const LS = (a) => { a.questions = prepAll(a.questions, 'listen:' + a.id, a.level, 'escucha'); C.listening.push(a); };

  LS({ id: 'saludos-y-nombres', level: 'A1', title: 'Saludos y nombres', intro: 'Escucha a dos personas que se conocen.',
    questions: [
      listen('Hola, buenos días. Me llamo Lucía. ¿Y tú?', 'La primera persona dice...', 'Su nombre', ['Su edad', 'Su país', 'Su trabajo'], 'Dice «Me llamo Lucía».'),
      listen('Yo soy Marcos y soy de Argentina.', '¿De dónde es Marcos?', 'De Argentina', ['De España', 'De México', 'De Colombia'], 'Marcos dice «soy de Argentina».'),
      listen('Mucho gusto. Hasta luego.', '¿Qué hace la persona?', 'Se despide', ['Pide comida', 'Pregunta la hora', 'Compra algo'], '«Hasta luego» es una despedida.'),
      listen('Buenas noches, señora. ¿Cómo está usted?', '¿Qué momento del día es?', 'La noche', ['La mañana', 'El mediodía', 'La tarde'], 'Dice «buenas noches».')] });

  LS({ id: 'numeros-y-precios', level: 'A1', title: 'Números y precios', intro: 'Escucha números en situaciones diarias.',
    questions: [
      listen('El café cuesta dos euros.', '¿Cuánto cuesta el café?', '2 euros', ['12 euros', '20 euros', '3 euros'], 'Dice «dos euros».'),
      listen('Mi número de casa es el quince.', '¿Qué número oyes?', '15', ['5', '50', '14'], 'Quince es 15.'),
      listen('Tengo veinte años y mi hermana tiene diez.', '¿Cuántos años tiene la hermana?', '10', ['20', '12', '30'], 'La hermana tiene diez años.'),
      listen('La clase empieza a las ocho y media.', '¿A qué hora empieza la clase?', 'A las 8:30', ['A las 8:00', 'A las 9:30', 'A las 7:30'], '«Y media» significa treinta minutos.')] });

  LS({ id: 'mi-familia', level: 'A1', title: 'Mi familia', intro: 'Una persona habla de su familia.',
    questions: [
      listen('En mi familia somos cuatro: mis padres, mi hermana y yo.', '¿Cuántas personas hay en la familia?', 'Cuatro', ['Tres', 'Cinco', 'Seis'], 'Dice «somos cuatro».'),
      listen('Mi hermana se llama Elena y estudia en la universidad.', '¿Qué hace Elena?', 'Estudia', ['Trabaja', 'Duerme', 'Viaja'], 'Elena estudia en la universidad.'),
      listen('Mis abuelos viven en una casa grande con jardín.', '¿Cómo es la casa de los abuelos?', 'Grande', ['Pequeña', 'Nueva', 'Cara'], 'La casa es grande.'),
      listen('Mi padre trabaja en un hospital. Es médico.', '¿Cuál es la profesión del padre?', 'Médico', ['Profesor', 'Estudiante', 'Camarero'], 'El padre es médico.')] });

  LS({ id: 'en-el-mercado', level: 'A2', title: 'En el mercado', intro: 'Una clienta compra fruta y verdura.',
    questions: [
      listen('Quiero un kilo de manzanas y medio kilo de naranjas, por favor.', '¿Qué fruta compra en mayor cantidad?', 'Manzanas', ['Naranjas', 'Peras', 'Uvas'], 'Compra un kilo de manzanas y medio kilo de naranjas.'),
      listen('Las fresas están muy buenas hoy, pero son un poco caras.', '¿Qué dice el vendedor de las fresas?', 'Son caras', ['Son baratas', 'Son malas', 'No hay'], 'Dice «son un poco caras».'),
      listen('¿Algo más? —No, nada más. ¿Cuánto es?', '¿Qué pregunta la clienta?', 'El precio total', ['La hora', 'El nombre de la fruta', 'La dirección'], 'Pregunta «¿Cuánto es?».'),
      listen('Son siete euros con cincuenta.', '¿Cuánto debe pagar?', '7,50 euros', ['5,70 euros', '17,50 euros', '7,15 euros'], 'Siete euros con cincuenta.')] });

  LS({ id: 'un-viaje-en-tren', level: 'A2', title: 'Un viaje en tren', intro: 'Escucha el aviso de la estación y una conversación.',
    questions: [
      listen('Atención: el tren con destino a Sevilla sale por la vía tres.', '¿Por dónde sale el tren a Sevilla?', 'Por la vía 3', ['Por la vía 1', 'Por la vía 13', 'Por la vía 5'], 'Dice «vía tres».'),
      listen('Perdone, ¿este asiento está libre? —Sí, siéntese.', '¿Qué responde la otra persona?', 'Que está libre', ['Que está ocupado', 'Que no sabe', 'Que se va'], 'Responde «Sí, siéntese».'),
      listen('El viaje dura dos horas y media. Llegamos a las cinco.', '¿Cuánto dura el viaje?', 'Dos horas y media', ['Dos horas', 'Tres horas', 'Media hora'], 'Dice «dos horas y media».'),
      listen('Ayer perdí el tren y tuve que esperar una hora.', '¿Qué pasó ayer?', 'Perdió el tren', ['Llegó temprano', 'Compró un billete', 'Viajó en avión'], 'Dice «perdí el tren».')] });

  LS({ id: 'plan-para-el-fin-de-semana', level: 'A2', title: 'Plan para el fin de semana', intro: 'Dos amigos hacen planes.',
    questions: [
      listen('Este sábado voy a ir a la playa con mis primos.', '¿Con quién va a ir a la playa?', 'Con sus primos', ['Con sus padres', 'Con sus amigos', 'Solo'], 'Dice «con mis primos».'),
      listen('Si llueve, nos quedamos en casa y vemos una película.', '¿Qué hacen si llueve?', 'Se quedan en casa', ['Van a la playa', 'Viajan', 'Salen a correr'], 'Si llueve, se quedan en casa.'),
      listen('El domingo por la mañana tengo clase de baile.', '¿Cuándo tiene clase de baile?', 'El domingo por la mañana', ['El sábado por la tarde', 'El lunes', 'El domingo por la noche'], 'La clase es el domingo por la mañana.'),
      listen('¿Quedamos a las seis delante del cine?', '¿Qué propone?', 'Verse a las seis', ['Cenar en casa', 'Ir al hospital', 'Viajar a Madrid'], '«Quedamos» significa acordar un encuentro.')] });

  LS({ id: 'una-entrevista-de-trabajo', level: 'B1', title: 'Una entrevista de trabajo', intro: 'Una candidata habla con la responsable de personal.',
    questions: [
      listen('Llevo tres años trabajando como diseñadora en una empresa pequeña.', '¿Qué experiencia tiene la candidata?', 'Tres años como diseñadora', ['Un año como médica', 'Tres meses como profesora', 'Ninguna'], 'Dice «tres años ... como diseñadora».'),
      listen('Me gustaría cambiar de empresa porque busco más oportunidades de crecer.', '¿Por qué quiere cambiar?', 'Busca más oportunidades', ['Gana poco dinero', 'Vive lejos', 'Tiene problemas con su jefe'], 'Busca «más oportunidades de crecer».'),
      listen('Si me contratan, podría empezar el próximo lunes.', '¿Cuándo podría empezar?', 'El próximo lunes', ['Mañana', 'En un mes', 'El viernes'], 'Dice «el próximo lunes».'),
      listen('Le llamaremos esta semana para comunicarle nuestra decisión.', '¿Qué hará la empresa?', 'Llamarla esta semana', ['Escribirle un año después', 'Pedirle dinero', 'Visitarla en casa'], 'Dicen «le llamaremos esta semana».')] });

  LS({ id: 'noticias-de-la-radio', level: 'B1', title: 'Noticias de la radio', intro: 'Escucha tres titulares breves.',
    questions: [
      listen('Mañana habrá lluvias fuertes en el norte del país y las temperaturas bajarán varios grados.', '¿Qué tiempo hará mañana en el norte?', 'Lluvia y más frío', ['Sol y calor', 'Nieve en todo el país', 'Viento en el sur'], 'Habrá lluvias y bajarán las temperaturas.'),
      listen('El ayuntamiento ha anunciado que el museo estará gratis el primer domingo de cada mes.', '¿Cuándo será gratis el museo?', 'El primer domingo de cada mes', ['Todos los días', 'El último sábado', 'Una vez al año'], 'El primer domingo de cada mes.'),
      listen('Debido a las obras, la línea de metro número cuatro permanecerá cerrada durante dos semanas.', '¿Por qué está cerrada la línea cuatro?', 'Por obras', ['Por una huelga', 'Por el tiempo', 'Por una fiesta'], 'Dice «debido a las obras».'),
      listen('Los expertos recomiendan dormir entre siete y ocho horas para mantener una buena salud.', '¿Qué recomiendan los expertos?', 'Dormir siete u ocho horas', ['Dormir cuatro horas', 'Comer menos', 'Correr cada día'], 'Recomiendan dormir entre siete y ocho horas.')] });

  // ---------------- LEER ----------------
  C.reading = [];
  const RS = (r) => { r.q = prepAll(r.q, 'read:' + r.id, r.level, 'lectura'); C.reading.push(r); };

  RS({ id: 'mi-dia-normal', level: 'A1', title: 'Mi día normal', text: 'Me llamo Pablo y tengo veinte años. Vivo en Sevilla con mis padres. Por la mañana me levanto a las siete y desayuno café con pan. Voy a la universidad en autobús. Estudio historia. Como en casa a las dos. Por la tarde estudio y por la noche veo la televisión con mi hermana.',
    q: [mc('¿Dónde vive Pablo?', 'En Sevilla', ['En Madrid', 'En Valencia', 'En Bilbao'], 'El texto dice «Vivo en Sevilla».'), mc('¿Cómo va a la universidad?', 'En autobús', ['En coche', 'En tren', 'A pie'], 'Dice «Voy a la universidad en autobús».'), mc('¿Qué estudia?', 'Historia', ['Medicina', 'Arte', 'Música'], 'Estudia historia.'), mc('¿Con quién ve la televisión?', 'Con su hermana', ['Con sus padres', 'Con un amigo', 'Solo'], 'La ve con su hermana.')] });

  RS({ id: 'la-casa-de-ana', level: 'A1', title: 'La casa de Ana', text: 'Ana vive en un piso pequeño en el centro de la ciudad. El piso tiene un salón, una cocina, un baño y dos dormitorios. En el salón hay un sofá azul y una mesa blanca. Ana tiene un gato que se llama Tigre. A Ana le gusta su casa porque está cerca del parque y de una librería.',
    q: [mc('¿Cómo es el piso de Ana?', 'Pequeño', ['Muy grande', 'Muy viejo', 'Muy caro'], 'Es «un piso pequeño».'), mc('¿Cuántos dormitorios tiene?', 'Dos', ['Uno', 'Tres', 'Cuatro'], 'Tiene «dos dormitorios».'), mc('¿De qué color es el sofá?', 'Azul', ['Rojo', 'Verde', 'Blanco'], 'El sofá es azul.'), mc('¿Por qué le gusta su casa?', 'Porque está cerca del parque y de una librería', ['Porque es muy grande', 'Porque no tiene vecinos', 'Porque es barata'], 'Está cerca del parque y de una librería.')] });

  RS({ id: 'una-carta-a-un-amigo', level: 'A2', title: 'Una carta a un amigo', text: 'Querido Daniel: ¿Cómo estás? Yo estoy muy bien en Granada. Llegué hace dos semanas y ya tengo un piso con dos compañeras de la universidad. Las clases empezaron el lunes y los profesores son muy simpáticos. El fin de semana pasado visité la Alhambra y me encantó. Quiero que vengas a verme en las vacaciones de verano. Podemos comer tapas y pasear por el centro. Un abrazo, Marta.',
    q: [mc('¿Cuánto tiempo hace que Marta llegó a Granada?', 'Dos semanas', ['Dos días', 'Dos meses', 'Dos años'], 'Dice «Llegué hace dos semanas».'), mc('¿Con quién vive?', 'Con dos compañeras de la universidad', ['Con sus padres', 'Con Daniel', 'Sola'], 'Tiene un piso con dos compañeras.'), mc('¿Qué visitó el fin de semana pasado?', 'La Alhambra', ['Un museo de Madrid', 'La playa', 'Un mercado'], 'Visitó la Alhambra.'), mc('¿Qué le propone a Daniel?', 'Que la visite en verano', ['Que estudie en Granada', 'Que le escriba más', 'Que le mande dinero'], 'Quiere que vaya a verla en las vacaciones de verano.')] });

  RS({ id: 'anuncio-de-un-gimnasio', level: 'A2', title: 'Anuncio de un gimnasio', text: 'GIMNASIO ENERGÍA. Abierto de lunes a viernes de 7:00 a 22:00 y los sábados de 9:00 a 14:00. Los domingos estamos cerrados. Clases de yoga, baile y natación. El primer mes cuesta solo 20 euros. Después, 35 euros al mes. Los estudiantes tienen un diez por ciento de descuento. Inscríbete en recepción o llama al 912 345 678.',
    q: [mc('¿Cuándo está cerrado el gimnasio?', 'Los domingos', ['Los sábados', 'Los lunes', 'Los viernes'], 'Dice «Los domingos estamos cerrados».'), mc('¿Cuánto cuesta el primer mes?', '20 euros', ['35 euros', '10 euros', '9 euros'], 'El primer mes cuesta 20 euros.'), mc('¿Quién tiene descuento?', 'Los estudiantes', ['Los profesores', 'Los niños', 'Los domingos'], 'Los estudiantes tienen un diez por ciento de descuento.'), mc('¿Cómo puedes inscribirte?', 'En recepción o por teléfono', ['Solo por correo', 'Solo por internet', 'No se puede'], 'Inscríbete en recepción o llama al teléfono.')] });

  RS({ id: 'el-mercado-de-los-sabados', level: 'A2', title: 'El mercado de los sábados', text: 'Cada sábado por la mañana, la plaza de mi barrio se llena de puestos. Los vendedores llegan muy temprano y colocan la fruta, el pescado, el queso y las flores. Mi abuela compra siempre en el mismo puesto porque conoce al vendedor desde hace veinte años. A mí me gusta ir con ella porque siempre me da una manzana para probar. Al mediodía, el mercado se vacía y los vecinos van a tomar algo a los bares de la plaza.',
    q: [mc('¿Cuándo hay mercado?', 'Los sábados por la mañana', ['Los domingos', 'Todos los días', 'Los viernes por la noche'], 'Cada sábado por la mañana.'), mc('¿Por qué compra la abuela en el mismo puesto?', 'Porque conoce al vendedor desde hace años', ['Porque es el más barato', 'Porque está cerca', 'Porque no hay otro'], 'Conoce al vendedor desde hace veinte años.'), mc('¿Qué le da la abuela a la narradora?', 'Una manzana para probar', ['Dinero', 'Una flor', 'Un queso'], 'Siempre le da una manzana para probar.'), mc('¿Qué pasa al mediodía?', 'El mercado se vacía', ['Llegan más vendedores', 'Se cierra la plaza', 'Empieza la fiesta'], 'Al mediodía el mercado se vacía.')] });

  RS({ id: 'trabajar-desde-casa', level: 'B1', title: 'Trabajar desde casa', text: 'En los últimos años, cada vez más personas trabajan desde casa. Esta forma de trabajar tiene claras ventajas: se ahorra tiempo en los desplazamientos y es más fácil organizar el día. Sin embargo, también presenta inconvenientes. Algunos trabajadores sienten que están solos y les cuesta separar la vida profesional de la personal. Por eso, muchos expertos aconsejan tener un horario fijo, un espacio dedicado al trabajo y pausas regulares. Además, las empresas deberían facilitar el contacto entre los compañeros para evitar el aislamiento.',
    q: [mc('¿Cuál es una ventaja del teletrabajo según el texto?', 'Se ahorra tiempo en los desplazamientos', ['Se gana más dinero', 'Se trabaja menos horas', 'No hay jefe'], 'El texto menciona el ahorro de tiempo.'), mc('¿Qué inconveniente se menciona?', 'Algunos se sienten solos', ['El ruido de la oficina', 'Los viajes largos', 'Los salarios bajos'], 'Algunos sienten que están solos.'), mc('¿Qué aconsejan los expertos?', 'Tener un horario fijo y un espacio de trabajo', ['Trabajar de noche', 'Evitar las pausas', 'Usar solo el móvil'], 'Aconsejan horario fijo, espacio y pausas.'), mc('¿Qué deberían hacer las empresas?', 'Facilitar el contacto entre compañeros', ['Cerrar las oficinas', 'Pagar menos', 'Eliminar los horarios'], 'Deberían facilitar el contacto para evitar el aislamiento.')] });

  RS({ id: 'una-receta-con-historia', level: 'B1', title: 'Una receta con historia', text: 'La tortilla de patatas es uno de los platos más conocidos de España, aunque nadie sabe con certeza dónde nació. Se prepara con pocos ingredientes: patatas, huevos, aceite y sal. Lo que genera más debate es si debe llevar cebolla. Hay quienes defienden que sin cebolla no es una auténtica tortilla, mientras que otros piensan que la cebolla le quita el sabor original. Lo cierto es que casi todas las familias tienen su propia versión y la consideran la mejor del mundo.',
    q: [mc('¿Qué ingredientes básicos lleva la tortilla?', 'Patatas, huevos, aceite y sal', ['Arroz y pollo', 'Pan y queso', 'Pescado y leche'], 'Se prepara con patatas, huevos, aceite y sal.'), mc('¿Qué genera más debate?', 'Si debe llevar cebolla', ['Si se come caliente', 'Quién la inventó', 'Cuánto cuesta'], 'El debate es sobre la cebolla.'), mc('¿Qué sabemos sobre su origen?', 'Nadie lo sabe con certeza', ['Nació en Madrid', 'Nació en México', 'Es muy reciente'], 'Nadie sabe con certeza dónde nació.'), mc('¿Qué piensan casi todas las familias?', 'Que su versión es la mejor', ['Que es difícil de hacer', 'Que es demasiado cara', 'Que no hay que comerla'], 'Consideran su versión la mejor del mundo.')] });

  RS({ id: 'bibliotecas-del-futuro', level: 'B2', title: 'Las bibliotecas del futuro', text: 'Aunque se ha dicho a menudo que las bibliotecas desaparecerían con la llegada de internet, la realidad ha sido otra. Hoy, muchas de ellas se han convertido en centros de encuentro donde se organizan talleres, clubes de lectura y actividades para todas las edades. Los bibliotecarios, lejos de limitarse a prestar libros, orientan a los usuarios en la búsqueda de información fiable, un servicio cada vez más valioso en una época saturada de datos. Quienes defienden estos espacios sostienen que ofrecen algo que ninguna pantalla puede dar: un lugar común, gratuito y abierto a todos.',
    q: [mc('¿Qué se predijo sobre las bibliotecas?', 'Que desaparecerían con internet', ['Que serían más grandes', 'Que serían gratis', 'Que tendrían más libros'], 'Se decía que desaparecerían.'), mc('¿En qué se han convertido muchas bibliotecas?', 'En centros de encuentro con actividades', ['En tiendas', 'En museos de arte', 'En oficinas'], 'Organizan talleres, clubes y actividades.'), mc('¿Qué papel tienen hoy los bibliotecarios?', 'Orientar en la búsqueda de información fiable', ['Solo prestar libros', 'Vender libros', 'Cerrar las salas'], 'Orientan a los usuarios en la búsqueda de información fiable.'), mc('¿Qué ofrecen las bibliotecas según sus defensores?', 'Un lugar común, gratuito y abierto a todos', ['Pantallas más modernas', 'Libros más baratos', 'Clases privadas'], 'Un lugar común, gratuito y abierto.')] });

  // ---------------- ESCRIBIR ----------------
  // Cada actividad: consigna, requisitos comprobables (palabras o patrones), modelo y criterios de autoevaluación.
  C.writing = [
    { id: 'presentacion', level: 'A1', title: 'Preséntate', prompt: 'Escribe una presentación breve: tu nombre, tu país, dónde vives y qué haces.', min: 20,
      need: [{ label: 'Dices tu nombre (me llamo / soy)', re: /\b(me llamo|mi nombre es|soy)\b/i }, { label: 'Dices de dónde eres (soy de)', re: /\bsoy de\b/i }, { label: 'Dices dónde vives (vivo en)', re: /\bvivo en\b/i }],
      model: 'Hola, me llamo Sara. Soy de Marruecos, pero ahora vivo en Barcelona. Trabajo en una tienda y estudio español por las tardes. Me gusta la música y caminar por el parque.',
      criteria: ['Empiezas con un saludo.', 'Cada frase empieza con mayúscula y termina con punto.', 'Usas «soy» para origen y «vivo» para el lugar.', 'Revisaste las tildes.'] },
    { id: 'mi-familia-escrita', level: 'A1', title: 'Mi familia', prompt: 'Describe a tu familia: cuántas personas son y cómo se llaman, con una característica de cada una.', min: 25,
      need: [{ label: 'Usas «mi / mis»', re: /\b(mi|mis)\b/i }, { label: 'Usas el verbo «tener» o «ser»', re: /\b(tengo|tiene|tienen|es|son|somos)\b/i }, { label: 'Nombras a algún familiar', re: /\b(madre|padre|hermano|hermana|abuelo|abuela|hijo|hija|tío|tía|primo|prima)s?\b/i }],
      model: 'En mi familia somos cinco. Mi padre se llama Omar y es médico. Mi madre se llama Laila y es profesora. Tengo dos hermanos: Yusuf es alto y Salma es muy simpática.',
      criteria: ['Las palabras concuerdan en género y número (mi hermana simpática).', 'Usas «es» y «son» para describir.', 'Cada persona tiene una característica.'] },
    { id: 'rutina-diaria', level: 'A1', title: 'Mi rutina diaria', prompt: 'Cuenta qué haces un día normal, desde que te levantas hasta que te acuestas.', min: 30,
      need: [{ label: 'Usas verbos reflexivos (me levanto, me acuesto…)', re: /\bme (levanto|acuesto|ducho|despierto|visto)\b/i }, { label: 'Dices una hora (a las…)', re: /\ba las?\s+\w+/i }, { label: 'Usas conectores de orden (después, luego, por la tarde…)', re: /\b(después|luego|por la (mañana|tarde|noche)|primero)\b/i }],
      model: 'Me levanto a las siete y desayuno café con pan. Después voy al trabajo en autobús. Como a las dos con mis compañeros. Por la tarde estudio español y por la noche cocino. Me acuesto a las once.',
      criteria: ['Los verbos están en presente y en primera persona.', 'Las horas están bien escritas.', 'Ordenaste las acciones con conectores.'] },
    { id: 'email-a-un-amigo', level: 'A2', title: 'Un correo a un amigo', prompt: 'Escribe un correo a un amigo para contarle qué hiciste el fin de semana pasado.', min: 40,
      need: [{ label: 'Saludas al principio (Hola / Querido…)', re: /\b(hola|querid[oa])\b/i }, { label: 'Usas el pretérito indefinido (fui, comí, visité, salí…)', re: /\b(fui|comí|visité|salí|bebí|vi|compré|jugué|viajé|hice|estuve|pasé|cené|hablé|caminé)\b/i }, { label: 'Te despides (un abrazo / hasta pronto…)', re: /\b(un abrazo|hasta pronto|saludos|besos)\b/i }],
      model: 'Hola, Daniel: ¿Qué tal? El sábado fui a la playa con mi familia. Comimos pescado en un restaurante y después caminamos por la orilla. El domingo me quedé en casa y vi una película. ¿Y tú, qué hiciste? Un abrazo, Marta.',
      criteria: ['Los verbos de las acciones terminadas están en indefinido.', 'Hay saludo, cuerpo y despedida.', 'Haces una pregunta al final para continuar la conversación.'] },
    { id: 'mi-ciudad', level: 'A2', title: 'Mi ciudad', prompt: 'Describe la ciudad o el pueblo donde vives: cómo es, qué hay y qué te gusta.', min: 45,
      need: [{ label: 'Usas «hay»', re: /\bhay\b/i }, { label: 'Usas «es» o «está»', re: /\b(es|está|están|son)\b/i }, { label: 'Dices qué te gusta (me gusta / me encanta)', re: /\bme (gusta|gustan|encanta|encantan)\b/i }],
      model: 'Vivo en una ciudad pequeña cerca del mar. En el centro hay una plaza muy bonita y un mercado. La playa está a diez minutos de mi casa. Me gusta mucho mi ciudad porque es tranquila y la gente es amable, pero no hay cine y los fines de semana a veces me aburro.',
      criteria: ['Distingues «hay» (existencia) de «está» (ubicación).', 'Usas adjetivos que concuerdan.', 'Das al menos una opinión.'] },
    { id: 'planes-de-verano', level: 'A2', title: 'Planes de verano', prompt: 'Escribe qué vas a hacer en tus próximas vacaciones.', min: 40,
      need: [{ label: 'Usas «voy a + infinitivo»', re: /\b(voy|vas|va|vamos|van) a \w+(ar|er|ir)\b/i }, { label: 'Nombras un lugar', re: /\ben [A-ZÁÉÍÓÚ]\w+|\b(playa|montaña|ciudad|pueblo|campo)\b/ }, { label: 'Dices con quién', re: /\bcon (mi|mis|un|una|mi)\b/i }],
      model: 'Este verano voy a viajar a Sevilla con mi hermana en tren. Vamos a visitar la catedral y a comer tapas en el centro. También voy a descansar en el hotel por las tardes y voy a leer dos libros. Después vamos a pasar tres días en la playa.',
      criteria: ['Usas «ir a + infinitivo» sin olvidar la «a».', 'Indicas lugar, compañía y actividades.', 'No repites siempre el mismo verbo.'] },
    { id: 'carta-de-presentacion', level: 'B1', title: 'Carta de presentación', prompt: 'Escribe una carta breve para solicitar un trabajo o un curso. Explica quién eres, tu experiencia y por qué te interesa.', min: 70,
      need: [{ label: 'Usas un saludo formal (Estimado/a, Muy señor mío…)', re: /\b(estimad[oa]s?|muy señor)\b/i }, { label: 'Explicas tu interés (me gustaría / me interesa / quisiera)', re: /\b(me gustaría|me interesa|quisiera|estoy interesad[oa])\b/i }, { label: 'Te despides con fórmula formal (atentamente / cordialmente…)', re: /\b(atentamente|cordialmente|un cordial saludo|saludos cordiales)\b/i }],
      model: 'Estimada señora Ruiz: Me llamo Ana López y le escribo para solicitar el puesto de ayudante administrativa. Llevo dos años trabajando en una oficina, donde he aprendido a organizar tareas y atender a clientes. Me interesa su empresa porque busca personas con ganas de crecer. Me gustaría poder explicarle mi experiencia en una entrevista, porque creo que mi perfil encaja con el puesto. Además, tengo disponibilidad inmediata y buen nivel de inglés. Le agradezco su atención y quedo a su disposición para cualquier duda. Atentamente, Ana López.',
      criteria: ['Mantienes el registro formal (usted).', 'Usas el pretérito perfecto para la experiencia.', 'La carta tiene saludo, motivo, experiencia y despedida.'] },
    { id: 'opinion-escrita', level: 'B1', title: 'Da tu opinión', prompt: 'Escribe tu opinión sobre este tema: «¿Es mejor vivir en la ciudad o en el campo?». Da al menos dos razones.', min: 70,
      need: [{ label: 'Expresas tu opinión (creo que / pienso que / en mi opinión)', re: /\b(creo que|pienso que|en mi opinión|me parece que)\b/i }, { label: 'Das razones (porque / ya que)', re: /\b(porque|ya que|debido a)\b/i }, { label: 'Usas un conector de contraste (sin embargo / aunque / pero)', re: /\b(sin embargo|aunque|pero|por otro lado)\b/i }],
      model: 'En mi opinión, es mejor vivir en el campo porque hay menos ruido y el aire es más limpio. Además, la vida es más tranquila y los vecinos se conocen. Sin embargo, en la ciudad hay más trabajo y más servicios. Por eso, creo que depende de cada persona y de lo que busque en cada etapa de su vida, aunque yo prefiero la tranquilidad y el contacto con la naturaleza, y no me importa viajar un poco más cada día.',
      criteria: ['Tu opinión está clara desde el principio.', 'Cada razón tiene una explicación.', 'Usas conectores para organizar las ideas.'] },
  ];

  // ---------------- CONSTRUCCIÓN DE FRASES ----------------
  C.sentences = [];
  const SN = (level, topic, a, extra, why, alts) => C.sentences.push(L.Q.prep(order(a, why || 'Revisa el orden de las palabras en español.', { extra: extra || [], alts: alts || [], s: 'gramática', topic }), 'frases:' + topic, level));
  SN('A1', 'presentarse', 'Me llamo Lucía y vivo en Madrid.', ['llama'], 'Con «me llamo» dices tu nombre.');
  SN('A1', 'presentarse', 'Soy de Argentina.', ['es'], '«Soy» es la forma de «yo» del verbo «ser».');
  SN('A1', 'presentarse', 'Tengo veinte años.', ['soy'], 'En español, la edad se dice con «tener».');
  SN('A1', 'familia', 'Mi hermana es muy simpática.', ['mis'], 'El adjetivo concuerda: hermana → simpática.');
  SN('A1', 'familia', 'Mis padres viven en una casa grande.', ['vive'], 'Sujeto plural → verbo plural.');
  SN('A1', 'cotidiano', 'Por la mañana bebo café con leche.', ['bebes'], '«Yo» → «bebo».');
  SN('A1', 'cotidiano', 'Voy a la universidad en autobús.', ['va'], '«Ir a» + lugar; «en» + transporte.');
  SN('A1', 'cotidiano', '¿Dónde está la estación de tren?', ['es'], 'Para el lugar usamos «estar».');
  SN('A1', 'cotidiano', '¿Qué hora es?', ['cuánto'], 'La pregunta fija para la hora es «¿Qué hora es?».');
  SN('A1', 'comida', 'Quiero un vaso de agua, por favor.', ['quieres'], 'Pedimos con «quiero» + «por favor».');
  SN('A1', 'comida', 'No me gusta el pescado.', ['te'], 'Con «gustar», el pronombre va antes del verbo: «me gusta».');
  SN('A1', 'ciudad', 'Hay un supermercado cerca de mi casa.', ['está'], '«Hay» presenta cosas nuevas; no lleva artículo definido.');
  SN('A1', 'ciudad', 'La farmacia está al lado del banco.', ['hay'], 'Ubicamos con «estar».');
  SN('A1', 'tiempo', 'Hoy es lunes y mañana es martes.', ['están'], '«Ser» para días de la semana.');
  SN('A1', 'tiempo', 'Estudio español todos los días.', ['estudias'], '«Todos los días» expresa hábito.');
  SN('A1', 'preguntas', '¿Cómo te llamas?', ['llamo'], 'Para preguntar el nombre usamos «te llamas».');
  SN('A1', 'preguntas', '¿Cuánto cuesta este libro?', ['cuántos'], 'Para precios: «¿Cuánto cuesta…?».');
  SN('A1', 'preguntas', '¿Por qué estudias español?', ['porque'], '«Por qué» en dos palabras y con tilde pregunta la causa.');
  SN('A1', 'ropa', 'Necesito una camisa azul.', ['necesita'], 'Camisa es femenino: una camisa azul.');
  SN('A1', 'ropa', 'Me gustan los zapatos negros.', ['gusta'], 'Plural: «gustan».');
  SN('A2', 'pasado', 'Ayer fui al cine con mis amigos.', ['voy'], 'Con «ayer» usamos el indefinido: «fui».');
  SN('A2', 'pasado', 'El sábado pasado comimos en un restaurante.', ['comemos'], 'Acción terminada → indefinido.');
  SN('A2', 'pasado', 'Cuando era niña, vivía en un pueblo.', ['vivo'], 'Descripción del pasado → imperfecto.');
  SN('A2', 'pasado', 'Esta mañana he desayunado muy temprano.', ['ha'], 'Con «esta mañana» usamos el perfecto: «he desayunado».');
  SN('A2', 'futuro', 'Mañana voy a visitar a mi abuela.', ['visito'], 'Futuro próximo: «ir a» + infinitivo.');
  SN('A2', 'futuro', 'Este verano vamos a viajar a Cádiz.', ['viajamos'], '«Vamos a» + infinitivo.');
  SN('A2', 'comparar', 'Mi casa es más grande que tu casa.', ['como'], 'Comparamos con «más ... que».');
  SN('A2', 'comparar', 'Esta ciudad es tan bonita como Granada.', ['que'], 'Igualdad: «tan ... como».');
  SN('A2', 'viajes', 'Quisiera reservar una habitación doble.', ['quiero'], '«Quisiera» es más cortés que «quiero».');
  SN('A2', 'viajes', '¿A qué hora sale el tren?', ['salgo'], 'Pregunta: «¿A qué hora...?».');
  SN('A2', 'salud', 'Me duele la cabeza desde ayer.', ['duelo'], 'Con «doler», «me duele» + parte del cuerpo.');
  SN('A2', 'salud', 'Tienes que descansar y beber agua.', ['tengo'], '«Tener que» + infinitivo expresa obligación.');
  SN('A2', 'rutina', 'Me levanto a las siete y me ducho.', ['levantas'], 'Verbos reflexivos con «me».');
  SN('A2', 'rutina', 'Normalmente ceno con mi familia.', ['cenas'], '«Normalmente» va con presente de hábito.');
  SN('A2', 'compras', '¿Me puede traer la cuenta, por favor?', ['puedo'], 'Con «usted» pedimos cortésmente: «¿Me puede...?».');
  SN('A2', 'compras', 'Prefiero pagar con tarjeta.', ['prefieres'], '«Preferir» + infinitivo.');
  SN('B1', 'opinión', 'Creo que es importante dormir bien.', ['crea'], 'Con «creo que» + indicativo.');
  SN('B1', 'opinión', 'No creo que sea una buena idea.', ['es'], 'Con «no creo que» usamos subjuntivo: «sea».');
  SN('B1', 'condicional', 'Si tuviera más tiempo, viajaría más.', ['tendré'], 'Hipótesis irreal: si + imperfecto de subjuntivo, condicional.');
  SN('B1', 'condicional', 'Me gustaría vivir en el extranjero.', ['gusta'], '«Me gustaría» expresa un deseo.');
  SN('B1', 'perfecto', 'Todavía no he terminado el informe.', ['terminó'], '«Todavía no» + perfecto.');
  SN('B1', 'perfecto', 'Nunca he visitado Perú.', ['visité'], '«Nunca he + participio» habla de experiencias.');
  SN('B1', 'conectores', 'Aunque llovía, salimos a pasear.', ['pero'], '«Aunque» introduce una concesión.');
  SN('B1', 'conectores', 'Estudié mucho; por eso aprobé el examen.', ['porque'], '«Por eso» introduce la consecuencia.');
  SN('B1', 'pronombres', 'Se lo dije ayer a mi jefe.', ['le'], 'Le + lo → «se lo».');
  SN('B1', 'pronombres', 'Me los regaló mi abuelo.', ['les'], 'Pronombres de objeto indirecto y directo.');
  SN('B1', 'trabajo', 'Llevo dos años trabajando en esta empresa.', ['llevó'], '«Llevar + tiempo + gerundio».');
  SN('B1', 'trabajo', 'Te llamaré en cuanto llegue a la oficina.', ['llegaré'], 'Con «en cuanto» el futuro usa subjuntivo: «llegue».');
  C.sentences.forEach((q) => { q.s = 'gramática'; });
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, read } = L.Q;
  const P = (q, lvl, skill) => { q.s = skill || q.s; return L.Q.prep(q, 'place:' + lvl, lvl); };
  const B = (lvl, arr) => arr.map((q) => { q.level = lvl; return q; });

  C.placementBank = {
    A1: B('A1', [
      P(mc('Son las nueve de la mañana. ¿Qué saludo usas?', 'Buenos días', ['Buenas noches', 'Hasta luego', 'Adiós'], 'Por la mañana decimos «buenos días».'), 'A1', 'vocabulario'),
      P(fill('Yo ___ de México. (ser)', 'soy', 'Con «yo» el verbo ser es «soy».'), 'A1', 'gramática'),
      P(order('Me llamo Ana y vivo en Madrid', 'Primero el nombre y después el lugar.'), 'A1', 'gramática'),
      P(mc('Los hijos de mis padres son mis...', 'hermanos', ['abuelos', 'primos', 'tíos'], 'Los hijos de tus padres son tus hermanos.'), 'A1', 'vocabulario'),
      P(listen('Tengo veinte años.', 'Escucha: ¿cuántos años tiene la persona?', '20', ['12', '30'], 'Se oye «veinte»: 20.'), 'A1', 'escucha'),
      P(read('Hola, me llamo Pablo. Vivo en Sevilla y trabajo en un banco. Tengo dos hermanos.', '¿Dónde vive Pablo?', 'En Sevilla', ['En Madrid', 'En Valencia', 'En Lima'], 'El texto dice «Vivo en Sevilla».'), 'A1', 'lectura'),
    ]),
    A2: B('A2', [
      P(fill('Ayer yo ___ al supermercado. (ir)', 'fui', 'Pretérito indefinido de «ir» con «yo»: fui.'), 'A2', 'gramática'),
      P(mc('Esta camiseta es ___ que esa.', 'más barata', ['más barato', 'tan barata', 'muy barata'], 'Comparativo: más + adjetivo + que; «camiseta» es femenino.'), 'A2', 'gramática'),
      P(order('Mañana voy a viajar a Barcelona en tren', 'Futuro próximo: ir a + infinitivo.'), 'A2', 'gramática'),
      P(mc('El camarero pregunta: «¿Qué desea tomar?». ¿Qué respondes?', 'Quiero una ensalada y agua, por favor.', ['Tengo veinte años.', 'Está al lado del banco.', 'Hoy es martes.'], 'En un restaurante pedimos con «quiero... por favor».'), 'A2', 'vocabulario'),
      P(listen('Me levanto a las siete y desayuno café con tostadas.', 'Escucha: ¿qué desayuna?', 'Café con tostadas', ['Leche con pan', 'Té con galletas'], 'Se oye «café con tostadas».'), 'A2', 'escucha'),
      P(read('Querida Marta: ayer llegué a Valencia. El hotel es pequeño pero muy cómodo y está cerca de la playa. Mañana voy a visitar el museo. Un abrazo, Luis.', '¿Cuándo va a visitar Luis el museo?', 'Mañana', ['Ayer', 'Hoy', 'El domingo'], 'El texto dice «Mañana voy a visitar el museo».'), 'A2', 'lectura'),
    ]),
    B1: B('B1', [
      P(fill('Cuando era niño, mis abuelos ___ en un pueblo pequeño. (vivir)', 'vivían', 'Descripción en el pasado: pretérito imperfecto, «vivían».'), 'B1', 'gramática'),
      P(mc('Ayer ___ a Pedro en el centro comercial.', 'vi', ['veía', 'veré', 'viera'], 'Acción terminada en un momento pasado concreto: pretérito indefinido, «vi».'), 'B1', 'gramática'),
      P(order('Creo que mañana lloverá en el norte', 'Opinión + futuro simple.'), 'B1', 'gramática'),
      P(mc('Quiero que tú ___ conmigo a la fiesta.', 'vengas', ['vienes', 'vendrás', 'venir'], 'Después de «querer que» usamos subjuntivo: «vengas».'), 'B1', 'gramática'),
      P(mc('Estudió mucho; ___, no aprobó el examen.', 'sin embargo', ['por eso', 'además', 'porque'], '«Sin embargo» indica oposición entre las dos ideas.'), 'B1', 'vocabulario'),
      P(read('Cuando llegué a la estación, el tren ya había salido. Tuve que esperar dos horas, así que compré un libro y me senté en una cafetería.', '¿Por qué compró un libro?', 'Porque tenía que esperar mucho tiempo', ['Porque perdió su maleta', 'Porque trabajaba en una librería', 'Porque quería regalárselo a alguien'], 'El texto dice «Tuve que esperar dos horas, así que compré un libro».'), 'B1', 'lectura'),
    ]),
    B2: B('B2', [
      P(mc('No creo que ___ tiempo para terminarlo hoy.', 'tengamos', ['tenemos', 'tendremos', 'tuvimos'], 'Con «no creo que» usamos subjuntivo: «tengamos».'), 'B2', 'gramática'),
      P(fill('Si ___ más dinero, viajaría por todo el mundo. (tener)', ['tuviera', 'tuviese'], 'Hipótesis poco probable: si + imperfecto de subjuntivo + condicional.'), 'B2', 'gramática'),
      P(mc('Me alegro de que ya te ___ mejor.', 'encuentres', ['encuentras', 'encontrarás', 'encontrabas'], 'Los sentimientos con «de que» piden subjuntivo.'), 'B2', 'gramática'),
      P(mc('En una reunión formal, ¿cómo expresas desacuerdo con cortesía?', 'Entiendo su punto de vista, pero no estoy del todo de acuerdo.', ['¡Qué tontería!', 'No me importa lo que dice.', 'Eso es mentira, seguro.'], 'El registro formal pide expresiones corteses y matizadas.'), 'B2', 'vocabulario'),
      P(mc('La reunión se canceló ___ la falta de participantes.', 'debido a', ['a pesar de', 'en cuanto a', 'con tal de'], '«Debido a» introduce la causa.'), 'B2', 'vocabulario'),
      P(read('Aunque el nuevo sistema de transporte ha reducido el tráfico en el centro, muchos comerciantes aseguran que sus ventas han caído porque los clientes ya no pueden aparcar cerca.', '¿Qué critican los comerciantes?', 'Que los clientes no pueden aparcar cerca y compran menos', ['Que el tráfico ha aumentado', 'Que el sistema es demasiado caro', 'Que hay demasiados clientes'], 'Las ventas han caído porque los clientes no pueden aparcar cerca.'), 'B2', 'lectura'),
    ]),
    C1: B('C1', [
      P(mc('Ojalá me ___ avisado antes: habría podido ayudarte.', 'hubieras', ['has', 'habías', 'hayas'], 'Deseo irreal sobre el pasado: «ojalá + pluscuamperfecto de subjuntivo».'), 'C1', 'gramática'),
      P(mc('No es que no quiera ayudarte, ___ que no puedo.', 'sino', ['pero', 'aunque', 'y'], 'Correcciona una idea negada: «no es que... sino que...».'), 'C1', 'gramática'),
      P(mc('Cuando decimos que alguien «tira la toalla», significa que...', 'se rinde', ['se baña', 'empieza un trabajo', 'limpia la casa'], 'La expresión «tirar la toalla» significa rendirse.'), 'C1', 'vocabulario'),
      P(mc('Un texto «conciso» es un texto...', 'breve y preciso', ['muy largo', 'difícil de leer', 'lleno de datos inútiles'], '«Conciso» significa que dice mucho con pocas palabras.'), 'C1', 'vocabulario'),
      P(mc('Por mucho que ___, no conseguirá convencerme.', 'insista', ['insiste', 'insistirá', 'insistiera'], 'Con «por mucho que» (concesiva) referida al presente o futuro usamos subjuntivo presente.'), 'C1', 'gramática'),
      P(read('El ministro, lejos de desmentir los rumores, optó por una ambigüedad calculada que alimentó aún más la especulación.', '¿Qué efecto tuvo su respuesta?', 'Aumentó las especulaciones', ['Puso fin a los rumores', 'Confirmó claramente los rumores', 'Provocó su dimisión'], '«Alimentó aún más la especulación» significa que la aumentó.'), 'C1', 'lectura'),
    ]),
    C2: B('C2', [
      P(mc('«Nada más lejos de mi intención ofenderte» significa que...', 'no tuve ninguna intención de ofenderte', ['quería ofenderte mucho', 'estaba muy lejos de ti', 'no sé si te ofendí'], 'La expresión niega con énfasis la intención.'), 'C2', 'vocabulario'),
      P(mc('¿Qué opción es más adecuada en una carta formal?', 'Le agradecería que tuviera a bien remitirme la documentación.', ['Mándame los papeles ya.', 'Oye, pásame los documentos.', 'Necesito los papeles, ¿vale?'], 'El registro muy formal usa fórmulas corteses y el condicional de cortesía.'), 'C2', 'vocabulario'),
      P(mc('Algo «efímero» es algo que...', 'dura muy poco tiempo', ['dura para siempre', 'cuesta mucho dinero', 'se repite cada día'], '«Efímero» significa de breve duración.'), 'C2', 'vocabulario'),
      P(mc('Hubiera querido ayudarte; ___, no estaba en mi mano.', 'no obstante', ['por consiguiente', 'dado que', 'así pues'], '«No obstante» introduce una oposición, como «sin embargo».'), 'C2', 'gramática'),
      P(mc('¿Cuál de estas oraciones usa correctamente el subjuntivo?', 'Aunque lo supiera, no te lo diría.', ['Aunque lo sabría, no te lo diría.', 'Aunque lo supo, no te lo diré ayer.', 'Aunque lo sepa, no te lo dijera ayer.'], 'Hipótesis poco probable: imperfecto de subjuntivo + condicional.'), 'C2', 'gramática'),
      P(read('Lo que en un principio se presentó como una reforma estructural no fue, a la postre, más que un reajuste cosmético.', '¿Qué opina el autor de la reforma?', 'Que su efecto real fue superficial', ['Que cambió profundamente el sistema', 'Que fracasó por falta de dinero', 'Que fue rechazada por todos'], '«No fue más que un reajuste cosmético» significa que fue superficial.'), 'C2', 'lectura'),
    ]),
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  // 30 niveles: cada nivel del MCER (A1–C2) se divide en 5 etapas
  const SIZES = [3, 2, 3, 2, 2];
  let cache = null;
  function build() {
    const out = [];
    C.levels.forEach((lv) => {
      const ids = C.lessonList(lv.id).map((x) => x.id);
      let i = 0;
      SIZES.forEach((n, k) => { out.push({ n: out.length + 1, level: lv.id, k: k + 1, lessons: ids.slice(i, i + n) }); i += n; });
    });
    return out;
  }
  L.stages = () => cache || (cache = build());
  L.STAGES = 30;
  L.stageOf = (id) => { const s = L.stages().find((x) => x.lessons.includes(id)); return s ? s.n : 0; };
  L.stage = (n) => L.stages()[n - 1] || null;
})(window.LWS);

