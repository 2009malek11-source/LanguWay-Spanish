(function (L) {
  'use strict';
  const C = L.C;
  const D = (L.dict = { byId: new Map(), entries: [], keys: new Map(), forms: new Map(), built: false });
  const TENSES = { pres: 'Presente', indef: 'Pretérito indefinido' };
  const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ustedes'];
  D.TENSES = TENSES; D.PERSONS = PERSONS;

  const ART = /^(el|la|los|las|un|una)\s+/;
  const keyOf = (w) => L.stripAcc(L.norm(w));
  function addKey(k, e) { if (!k) return; const a = D.keys.get(k) || []; if (!a.includes(e)) a.push(e); D.keys.set(k, a); }

  D.build = function () {
    D.byId.clear(); D.entries = []; D.keys.clear(); D.forms.clear();
    const upsert = (w, pos, level, topic, senses, extra) => {
      const id = C.wordId(w);
      let e = D.byId.get(id);
      if (!e) { e = { id, w, pos, level, topic, senses: [], syn: [], lessons: [], forms: null, note: null }; D.byId.set(id, e); D.entries.push(e); }
      senses.forEach((s) => { if (!e.senses.some((x) => x.def === s.def)) e.senses.push(s); });
      if (extra) { if (extra.syn) extra.syn.forEach((x) => !e.syn.includes(x) && e.syn.push(x)); if (extra.lesson && !e.lessons.includes(extra.lesson)) e.lessons.push(extra.lesson); }
      return e;
    };
    C.levels.forEach((lv) => C.lessonList(lv.id).forEach((ref) => {
      const les = C.lessons[ref.id]; if (!les) return;
      les.vocab.forEach((v) => upsert(v[0], v[1], les.level, les.topic, [{ def: v[2], ex: v[3], en: v[4] }], { lesson: les.id, syn: v[5] }));
    }));
    C.extraWords.forEach((x) => upsert(x.w, x.pos, x.level, x.topic, x.senses, { syn: x.syn }));
    C.verbs.forEach((v) => {
      const e = upsert(v.inf, 'verbo', v.level, 'Verbos', [{ def: v.def, ex: v.ex, en: v.en }]);
      e.forms = { pres: v.pres, indef: v.indef };
      if (v.note) e.note = v.note;
      ['pres', 'indef'].forEach((t) => (v[t] || []).forEach((f) => { const k = keyOf(f); const arr = D.forms.get(k) || []; if (!arr.some((x) => x.e === e && x.t === t && x.f === f)) arr.push({ e, t, f }); D.forms.set(k, arr); }));
    });
    D.entries.forEach((e) => { addKey(keyOf(e.w), e); addKey(keyOf(e.w.replace(ART, '')), e); });
    D.built = true;
    return D;
  };
  D.get = (id) => D.byId.get(id) || null;
  D.entryByWord = (w) => D.byId.get(C.wordId(w)) || null;

  D.lookup = function (q) {
    if (!D.built) D.build();
    const k = keyOf(q);
    const out = { q, entries: [], forms: [], suggestions: [] };
    if (!k) return out;
    (D.keys.get(k) || []).forEach((e) => out.entries.push(e));
    (D.forms.get(k) || []).forEach((f) => { out.forms.push(f); if (!out.entries.includes(f.e)) out.entries.push(f.e); });
    if (!out.entries.length) {
      const sug = new Set();
      D.keys.forEach((list, key) => { if (key.length >= 3 && (key.startsWith(k) || (k.length >= 4 && key.includes(k)))) list.forEach((e) => sug.add(e)); });
      if (sug.size < 4 && k.length >= 3) D.keys.forEach((list, key) => { if (Math.abs(key.length - k.length) <= 2 && L.lev(key, k) <= (k.length > 5 ? 2 : 1)) list.forEach((e) => sug.add(e)); });
      D.forms.forEach((list, key) => { if (k.length >= 4 && L.lev(key, k) <= 1) list.forEach((f) => sug.add(f.e)); });
      out.suggestions = Array.from(sug).slice(0, 6);
    }
    return out;
  };
  D.suggest = function (prefix, n) {
    if (!D.built) D.build();
    const k = keyOf(prefix);
    if (k.length < 1) return [];
    const res = [];
    for (const e of D.entries) { if (keyOf(e.w.replace(ART, '')).startsWith(k) || keyOf(e.w).startsWith(k)) res.push(e); if (res.length >= (n || 8)) break; }
    return res;
  };
  D.find = function (word) { if (!D.built) D.build(); return D.lookup(word).entries[0] || null; };
})(window.LWS);

;
(function (L) {
  'use strict';
  const C = L.C;
  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 14, 30, 60]; // días por caja Leitner
  const SKILLS = ['vocabulario', 'gramática', 'escucha', 'lectura', 'escritura', 'pronunciación'];
  const PASS = 75;
  const FORMAT = 1;

  const S = (L.S = { user: null, prog: null, words: new Map(), qstats: new Map(), PASS, SKILLS, INTERVALS });
  const dirty = { prog: false, words: new Set(), q: new Set(), attempts: [] };
  let chain = Promise.resolve();
  const listeners = [];
  S.onSave = (fn) => listeners.push(fn);
  const emit = (st, err) => listeners.forEach((f) => { try { f(st, err); } catch (e) {} });

  function defaultProg(userId) {
    const now = Date.now();
    return {
      userId, v: 1, created: now, updated: now,
      settings: { voiceURI: '', rate: 1, volume: 1, dialect: 'auto', reduceMotion: false, strictAccents: false, fontScale: 1, lineHeight: 1, contrast: false, easyFont: false },
      goals: { lessonsPerWeek: 3, minutesPerDay: 15, focus: [] },
      placement: null, unlockedLevels: ['A1'], validatedLevels: [],
      lessons: {}, units: {}, levelTests: {},
      resume: null, lastLesson: null,
      skills: {}, activity: {}, counters: {},
      favorites: { words: [], sentences: [], expressions: [], stories: [], lessons: [] },
      searchHistory: [], translatorHistory: [],
      achievements: {}, certificates: [], done: {},
      lastBackup: null, seen: {}, finalExam: { best: 0, attempts: 0, date: 0 },
    };
  }
  S.defaultProg = defaultProg;

  S.load = async function (user) {
    S.user = user;
    let prog = await L.db.get('progress', user.id);
    if (!prog) { prog = defaultProg(user.id); await L.db.put('progress', prog); }
    // Mezcla con valores por defecto: los campos nuevos de futuras versiones no rompen datos antiguos.
    const d = defaultProg(user.id);
    S.prog = Object.assign(d, prog);
    S.prog.settings = Object.assign(defaultProg(user.id).settings, prog.settings || {});
    S.prog.goals = Object.assign(defaultProg(user.id).goals, prog.goals || {});
    S.prog.favorites = Object.assign(defaultProg(user.id).favorites, prog.favorites || {});
    const ws = await L.db.byIndex('words', 'byUser', user.id);
    S.words = new Map(ws.map((w) => [w.id, w]));
    const qs = await L.db.byIndex('qstats', 'byUser', user.id);
    S.qstats = new Map(qs.map((q) => [q.qid, q]));
    dirty.prog = false; dirty.words.clear(); dirty.q.clear(); dirty.attempts = [];
    return S.prog;
  };
  S.unload = function () { S.user = null; S.prog = null; S.words = new Map(); S.qstats = new Map(); };

  // ---------- guardado (transacción atómica verificada) ----------
  S.markProg = () => { dirty.prog = true; S.prog.updated = Date.now(); };
  S.markWord = (id) => dirty.words.add(id);
  S.markQ = (id) => dirty.q.add(id);
  S.addAttempt = (a) => { a.userId = S.user.id; a.date = Date.now(); dirty.attempts.push(a); };
  S.flush = function () {
    chain = chain.then(async () => {
      if (!S.user) return true;
      const ops = [];
      if (dirty.prog) ops.push({ store: 'progress', put: S.prog });
      dirty.words.forEach((id) => { const w = S.words.get(id); if (w) ops.push({ store: 'words', put: w }); });
      dirty.q.forEach((id) => { const q = S.qstats.get(id); if (q) ops.push({ store: 'qstats', put: q }); });
      dirty.attempts.forEach((a) => ops.push({ store: 'attempts', add: a }));
      if (!ops.length) return true;
      const snap = { prog: dirty.prog, words: new Set(dirty.words), q: new Set(dirty.q), attempts: dirty.attempts.slice() };
      dirty.prog = false; dirty.words.clear(); dirty.q.clear(); dirty.attempts = [];
      try {
        emit('saving');
        await L.db.commit(ops);
        emit('saved');
        return true;
      } catch (err) {
        dirty.prog = dirty.prog || snap.prog; snap.words.forEach((x) => dirty.words.add(x)); snap.q.forEach((x) => dirty.q.add(x)); dirty.attempts = snap.attempts.concat(dirty.attempts);
        emit('error', err);
        return false;
      }
    });
    return chain;
  };

  // ---------- actividad y habilidades ----------
  S.log = function (kind, n) {
    const k = L.dayKey();
    const a = (S.prog.activity[k] = S.prog.activity[k] || {});
    a[kind] = (a[kind] || 0) + (n || 1);
    S.markProg();
  };
  S.count = function (key, n) { S.prog.counters[key] = (S.prog.counters[key] || 0) + (n || 1); S.markProg(); };
  S.counter = (k) => S.prog.counters[k] || 0;

  S.recordAnswer = function (q, ok, assisted) {
    if (!S.prog) return;
    if (!assisted) {
      const sk = (S.prog.skills[q.s] = S.prog.skills[q.s] || { c: 0, t: 0 });
      sk.t++; if (ok) sk.c++;
    }
    let r = S.qstats.get(q.id);
    if (!r) { r = { userId: S.user.id, qid: q.id, tag: q.tag, s: q.s, right: 0, wrong: 0, streak: 0, last: 0 }; S.qstats.set(q.id, r); }
    if (ok) { r.right++; r.streak++; } else { r.wrong++; r.streak = 0; }
    r.last = Date.now();
    S.markQ(q.id);
    S.log('q', 1);
  };
  S.skillPct = (s) => { const k = S.prog.skills[s]; return k && k.t ? Math.round((100 * k.c) / k.t) : null; };

  S.streak = function () {
    let n = 0; const d = new Date();
    const has = (dt) => !!S.prog.activity[L.dayKey(dt)];
    if (!has(d)) d.setDate(d.getDate() - 1);
    while (has(d)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  S.activeDays = () => Object.keys(S.prog.activity).length;
  S.lastActivity = () => { const ks = Object.keys(S.prog.activity).sort(); return ks.length ? ks[ks.length - 1] : null; };

  // ---------- palabras y repaso espaciado ----------
  S.word = (id) => S.words.get(id) || null;
  S.addWord = function (id, source, immediate) {
    let w = S.words.get(id);
    if (w) return w;
    const now = Date.now();
    w = { userId: S.user.id, id, added: now, source: source || 'lección', box: immediate ? 0 : 1, due: immediate ? now : now + DAY, streak: 0, seen: 0, lapses: 0, right: 0, wrong: 0, updated: now, fav: false, ctx: '' };
    S.words.set(id, w); S.markWord(id);
    return w;
  };
  S.removeWord = function (id) {
    if (!S.words.has(id)) return;
    S.words.delete(id); dirty.words.delete(id);
    L.db.commit([{ store: 'words', del: [S.user.id, id] }]).catch(() => {});
  };
  // strength: 'strong' (escrito/escuchado/elegido) | 'weak' (autoevaluación con botón)
  S.reviewWord = function (id, ok, strength) {
    const w = S.addWord(id, 'repaso', true);
    const now = Date.now();
    w.seen++; w.updated = now;
    if (ok) {
      w.right++; w.streak++;
      if (strength === 'weak') { if (w.box < 3) w.box++; } else if (w.box < 6) w.box++;
      w.due = now + (INTERVALS[w.box] || 0) * DAY;
    } else {
      w.wrong++; w.streak = 0; w.lapses++;
      w.box = w.box >= 4 ? w.box - 2 : 0;
      w.due = now + 10 * 60000;
    }
    S.markWord(id);
    S.log('w', 1); S.count('reviews');
    return w;
  };
  S.mastery = function (w) {
    if (!w) return 'nueva';
    if (!w.seen && w.box <= 1) return 'nueva';
    if (w.box >= 5 && w.streak >= 3) return 'dominada';
    if (w.box >= 2) return 'repasando';
    return 'aprendiendo';
  };
  S.dueWords = function (now) {
    now = now || Date.now();
    const arr = [];
    S.words.forEach((w) => { if (w.due <= now) arr.push(w); });
    arr.sort((a, b) => (b.lapses * 2 + b.wrong - a.lapses * 2 - a.wrong) || a.due - b.due);
    return arr;
  };
  S.wordPriority = (w) => (w.lapses >= 2 || w.wrong > w.right ? 'alta' : w.box <= 1 ? 'media' : 'baja');

  // ---------- favoritos ----------
  S.isFav = (kind, id) => S.prog.favorites[kind].includes(id);
  S.toggleFav = function (kind, id) {
    const a = S.prog.favorites[kind];
    const i = a.indexOf(id);
    if (i >= 0) a.splice(i, 1); else a.push(id);
    S.markProg();
    return i < 0;
  };

  // ---------- desbloqueo ----------
  S.lessonRec = (id) => S.prog.lessons[id] || null;
  S.lessonDone = (id) => !!(S.prog.lessons[id] && S.prog.lessons[id].done);
  S.unitDone = (lv, n) => !!(S.prog.units[lv + '.' + n] && S.prog.units[lv + '.' + n].done);
  S.levelDone = (lv) => !!(S.prog.levelTests[lv] && S.prog.levelTests[lv].done);
  S.levelUnlocked = (lv) => S.prog.unlockedLevels.includes(lv);
  S.levelValidated = (lv) => S.prog.validatedLevels.includes(lv);
  // Etapa (1–30) desde la que empieza el estudiante según su prueba de nivel
  S.startStage = function () {
    const pl = S.prog.placement; if (!pl) return 1;
    let n = +pl.stage; if (!(n >= 1)) { const i = C.levelIdx(pl.level); n = i >= 0 ? i * 5 + 1 : 1; }
    return Math.max(1, Math.min(L.STAGES, Math.floor(n)));
  };
  S.stageDone = (n) => { const st = L.stage(n); return !!st && st.lessons.every((id) => S.lessonDone(id)); };
  S.currentStage = function () {
    for (let n = S.startStage(); n <= L.STAGES; n++) if (!S.stageDone(n)) return n;
    return L.STAGES;
  };
  const cleared = (id) => S.lessonDone(id) || L.stageOf(id) < S.startStage();
  const unitCleared = (lv, un) => S.unitDone(lv, un.n) || un.lessons.every((l) => L.stageOf(l.id) < S.startStage());
  S.lessonUnlocked = function (id) {
    const info = C.unitOfLesson(id);
    if (!info || !C.lessons[id]) return false;
    const lv = info.level.id;
    if (!S.levelUnlocked(lv)) return false;
    if (S.levelValidated(lv) || S.lessonDone(id) || L.stageOf(id) < S.startStage()) return true;
    const ui = info.unit.lessons.findIndex((l) => l.id === id);
    if (ui > 0) return cleared(info.unit.lessons[ui - 1].id);
    const un = info.level.units.findIndex((u) => u.n === info.unit.n);
    if (un === 0) return true;
    return unitCleared(lv, info.level.units[un - 1]);
  };
  S.unitTestUnlocked = function (lv, n) {
    const level = C.level(lv); const unit = level.units.find((u) => u.n === n);
    return S.levelUnlocked(lv) && C.unitReady(unit) && unit.lessons.every((l) => cleared(l.id));
  };
  S.levelTestUnlocked = function (lv) {
    const level = C.level(lv);
    return S.levelUnlocked(lv) && C.levelReady(level) && level.units.every((u) => unitCleared(lv, u));
  };
  S.levelProgress = function (lv) {
    const list = C.lessonList(lv);
    const done = list.filter((l) => S.lessonDone(l.id)).length;
    return { done, total: list.length, pct: L.pct(done, list.length) };
  };
  S.levelStatus = function (lv) {
    if (S.levelDone(lv)) return 'completado';
    if (!S.levelUnlocked(lv)) return 'bloqueado';
    const p = S.levelProgress(lv);
    return p.done > 0 || (S.prog.lastLesson && S.prog.lastLesson.startsWith(lv.toLowerCase() + '.')) ? 'en curso' : 'disponible';
  };
  // Nivel actual: el más alto desbloqueado que aún no está completado (o el último completado)
  S.currentLevel = function () {
    const stg = L.stage(S.currentStage());
    return stg ? stg.level : 'A1';
  };
  S.nextLesson = function () {
    const last = S.prog.lastLesson;
    const order = [];
    C.levels.forEach((l) => C.lessonList(l.id).forEach((x) => order.push(x.id)));
    const start = Math.max(0, order.findIndex((id) => L.stageOf(id) >= S.currentStage()));
    for (let i = start; i < order.length; i++) {
      const id = order[i];
      if (C.lessons[id] && !S.lessonDone(id) && S.lessonUnlocked(id)) return id;
    }
    // si el nivel actual no tiene más contenido, busca en cualquier nivel desbloqueado
    for (let i = 0; i < order.length; i++) { const id = order[i]; if (C.lessons[id] && !S.lessonDone(id) && S.lessonUnlocked(id)) return id; }
    return last && C.lessons[last] ? last : null;
  };

  // ---------- resultados ----------
  S.finishLesson = function (lessonId, scorePct, answers) {
    const les = C.lessons[lessonId];
    const rec = (S.prog.lessons[lessonId] = S.prog.lessons[lessonId] || { done: false, best: 0, attempts: 0 });
    rec.attempts++; rec.last = Date.now(); rec.score = scorePct;
    rec.best = Math.max(rec.best || 0, scorePct);
    const passed = scorePct >= PASS;
    if (passed && !rec.done) { rec.done = true; rec.doneAt = Date.now(); }
    S.prog.lastLesson = lessonId;
    S.count('quizzes');
    if (scorePct === 100) S.count('perfect');
    if (passed) {
      les.vocab.forEach((v) => S.addWord(C.wordId(v[0]), 'lección ' + lessonId));
      S.log('l', 1);
      S.prog.resume = null;
    }
    S.addAttempt({ kind: 'lesson', ref: lessonId, score: scorePct, total: answers.length, wrong: answers.filter((a) => !a.ok).map((a) => a.id) });
    S.markProg();
    return passed;
  };
  S.finishUnit = function (lv, n, scorePct, answers) {
    const k = lv + '.' + n;
    const rec = (S.prog.units[k] = S.prog.units[k] || { done: false, best: 0, attempts: 0 });
    rec.attempts++; rec.best = Math.max(rec.best, scorePct); rec.last = Date.now();
    const passed = scorePct >= PASS;
    if (passed && !rec.done) { rec.done = true; rec.doneAt = Date.now(); }
    S.addAttempt({ kind: 'unit', ref: k, score: scorePct, total: answers.length, wrong: answers.filter((a) => !a.ok).map((a) => a.id) });
    S.markProg();
    return passed;
  };
  S.finishLevelTest = function (lv, scorePct, answers) {
    const rec = (S.prog.levelTests[lv] = S.prog.levelTests[lv] || { done: false, best: 0, attempts: 0 });
    rec.attempts++; rec.best = Math.max(rec.best, scorePct); rec.last = Date.now();
    const passed = scorePct >= PASS;
    let cert = null;
    if (passed && !rec.done) {
      rec.done = true; rec.doneAt = Date.now(); rec.finalScore = scorePct;
      const nxt = C.levels[C.levelIdx(lv) + 1];
      if (nxt && !S.prog.unlockedLevels.includes(nxt.id)) S.prog.unlockedLevels.push(nxt.id);
      const rnd = Array.from(crypto.getRandomValues(new Uint8Array(5))).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      cert = { id: 'LWS-' + lv + '-' + rnd, level: lv, date: Date.now(), score: scorePct, name: S.user.name };
      S.prog.certificates.push(cert);
    }
    S.addAttempt({ kind: 'level', ref: lv, score: scorePct, total: answers.length, wrong: answers.filter((a) => !a.ok).map((a) => a.id) });
    S.markProg();
    return { passed, cert };
  };
  S.applyPlacement = function (res) {
    const stg = L.stage(res.stage || 1);
    res.level = stg ? stg.level : res.level;
    S.prog.placement = res;
    const idx = C.levelIdx(res.level);
    for (let i = 0; i <= idx; i++) {
      const id = C.levels[i].id;
      if (!S.prog.unlockedLevels.includes(id)) S.prog.unlockedLevels.push(id);
      if (i < idx && !S.prog.validatedLevels.includes(id)) S.prog.validatedLevels.push(id);
    }
    S.markProg();
  };

  // ---------- logros (ligados a acciones reales) ----------
  const wordsKnown = () => Array.from(S.words.values()).filter((w) => w.seen > 0 || w.box >= 1).length;
  const lessonsDone = () => Object.values(S.prog.lessons).filter((l) => l.done).length;
  S.ACH = [
    { id: 'first-lesson', icon: '🎓', t: 'Primera lección', d: 'Completa tu primera lección.', ok: () => lessonsDone() >= 1 },
    { id: 'five-lessons', icon: '📚', t: 'Cinco lecciones', d: 'Completa 5 lecciones.', ok: () => lessonsDone() >= 5 },
    { id: 'ten-lessons', icon: '🏅', t: 'Diez lecciones', d: 'Completa 10 lecciones.', ok: () => lessonsDone() >= 10 },
    { id: 'words-25', icon: '🔤', t: '25 palabras', d: 'Estudia 25 palabras.', ok: () => wordsKnown() >= 25 },
    { id: 'words-100', icon: '📖', t: '100 palabras', d: 'Estudia 100 palabras.', ok: () => wordsKnown() >= 100 },
    { id: 'unit-test', icon: '✅', t: 'Unidad superada', d: 'Aprueba un examen de unidad.', ok: () => Object.values(S.prog.units).some((u) => u.done) },
    { id: 'level-done', icon: '🏆', t: 'Nivel completado', d: 'Aprueba el examen final de un nivel.', ok: () => Object.values(S.prog.levelTests).some((u) => u.done) },
    { id: 'listening', icon: '🎧', t: 'Sesión de escucha', d: 'Completa una actividad de Escuchar.', ok: () => S.counter('listens') >= 1 },
    { id: 'review-50', icon: '🔁', t: '50 repasos', d: 'Repasa palabras 50 veces.', ok: () => S.counter('reviews') >= 50 },
    { id: 'streak-3', icon: '🔥', t: 'Tres días seguidos', d: 'Practica 3 días seguidos.', ok: () => S.streak() >= 3 },
    { id: 'perfect', icon: '⭐', t: 'Examen perfecto', d: 'Saca 100 % en un examen de lección.', ok: () => S.counter('perfect') >= 1 },
    { id: 'placement', icon: '🧭', t: 'Prueba de nivel', d: 'Completa la prueba de nivel.', ok: () => !!S.prog.placement },
    { id: 'story', icon: '📕', t: 'Lector de historias', d: 'Completa una historia.', ok: () => S.counter('stories') >= 1 },
    { id: 'convo', icon: '💬', t: 'Conversador', d: 'Completa una conversación.', ok: () => S.counter('convos') >= 1 },
    { id: 'writer', icon: '✍️', t: 'Escritor', d: 'Completa una actividad de escritura.', ok: () => S.counter('writes') >= 1 },
    { id: 'sounds', icon: '🔊', t: 'Buen oído', d: 'Completa un ejercicio de pronunciación.', ok: () => S.counter('pron') >= 1 },
  ];
  S.checkAchievements = function () {
    const fresh = [];
    S.ACH.forEach((a) => { if (!S.prog.achievements[a.id] && a.ok()) { S.prog.achievements[a.id] = Date.now(); fresh.push(a); } });
    if (fresh.length) S.markProg();
    return fresh;
  };

  // ---------- estadísticas reales ----------
  S.stats = function () {
    const ws = Array.from(S.words.values());
    return {
      lessons: lessonsDone(), words: ws.length,
      mastered: ws.filter((w) => S.mastery(w) === 'dominada').length,
      due: S.dueWords().length,
      answered: Object.values(S.prog.skills).reduce((a, k) => a + k.t, 0),
      days: S.activeDays(), streak: S.streak(), last: S.lastActivity(),
    };
  };
  S.weakTags = function (n) {
    const arr = Array.from(S.qstats.values()).filter((r) => r.wrong > 0 && r.streak < 2);
    const by = {};
    arr.forEach((r) => { by[r.tag] = (by[r.tag] || 0) + r.wrong - r.right * 0.5; });
    return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, n || 5).map((x) => x[0]);
  };
  S.weakSkills = function () {
    return SKILLS.map((s) => ({ s, p: S.skillPct(s) })).filter((x) => x.p !== null && x.p < 70).sort((a, b) => a.p - b.p);
  };

  // ---------- exportación / importación ----------
  S.exportData = async function (pass) {
    const attempts = (await L.db.byIndex('attempts', 'byUser', S.user.id)).slice(-500).map((a) => { const c = Object.assign({}, a); delete c.aid; return c; });
    S.prog.lastBackup = Date.now(); S.markProg(); await S.flush();
    const data = {
      app: 'languway-spanish', format: FORMAT, exportedAt: Date.now(),
      accountId: S.user.id,
      user: { id: S.user.id, name: S.user.name, username: S.user.username || S.user.email || null, created: S.user.created }, // sin contraseña ni hash
      progress: S.prog, words: Array.from(S.words.values()), qstats: Array.from(S.qstats.values()), attempts,
    };
    if (pass) {
      const pkg = await L.crypto.encryptJSON(data, pass);
      return { app: 'languway-spanish', format: FORMAT, encrypted: true, exportedAt: data.exportedAt, accountId: S.user.id, package: pkg };
    }
    return data;
  };
  // Validación estricta de una copia: nunca se escribe nada hasta que pase todas las comprobaciones.
  S.validateBackup = function (obj) {
    const bad = (m) => ({ ok: false, error: m });
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return bad('The file is not a valid Languway backup.');
    if (obj.app !== 'languway-spanish') return bad('This file was not created by Languway Spanish.');
    if (typeof obj.format !== 'number' || obj.format > FORMAT) return bad('This backup file cannot be read by this app.');
    if (obj.encrypted) return obj.package && obj.package.data ? { ok: true, encrypted: true } : bad('The encrypted backup is damaged.');
    if (!obj.progress || typeof obj.progress !== 'object' || !obj.user || typeof obj.user.id !== 'string') return bad('The backup is missing required data.');
    if (!Array.isArray(obj.words) || !Array.isArray(obj.qstats)) return bad('The backup structure is damaged.');
    if (obj.words.length > 20000 || obj.qstats.length > 50000) return bad('This backup is too large to be a Languway backup.');
    if (obj.user.id.length > 100) return bad('The backup is missing required data.');
    const p = obj.progress;
    for (const k of ['lessons', 'units', 'levelTests', 'activity', 'achievements', 'skills', 'counters']) if (p[k] != null && (typeof p[k] !== 'object' || Array.isArray(p[k]))) return bad('The backup structure is damaged (' + k + ').');
    const ignored = { lessons: 0, words: 0, qstats: 0 };
    const clean = defaultProg('x');
    Object.assign(clean, JSON.parse(JSON.stringify(p)));
    clean.settings = Object.assign(defaultProg('x').settings, p.settings || {});
    clean.goals = Object.assign(defaultProg('x').goals, p.goals || {});
    clean.favorites = Object.assign(defaultProg('x').favorites, p.favorites || {});
    ['words', 'sentences', 'expressions', 'stories', 'lessons'].forEach((k) => { if (!Array.isArray(clean.favorites[k])) clean.favorites[k] = []; });
    if (!Array.isArray(clean.unlockedLevels)) clean.unlockedLevels = ['A1'];
    if (!Array.isArray(clean.validatedLevels)) clean.validatedLevels = [];
    if (!Array.isArray(clean.certificates)) clean.certificates = [];
    if (!clean.seen || typeof clean.seen !== 'object' || Array.isArray(clean.seen)) clean.seen = {};
    Object.keys(clean.seen).forEach((k) => { if (typeof clean.seen[k] !== 'number' || k.length > 20) delete clean.seen[k]; });
    if (clean.settings && !['both', 'es', 'en'].includes(clean.settings.coachLang)) delete clean.settings.coachLang;
    if (!clean.finalExam || typeof clean.finalExam !== 'object') clean.finalExam = { best: 0, attempts: 0, date: 0 };
    ['best', 'attempts', 'date'].forEach((k) => { if (typeof clean.finalExam[k] !== 'number' || !isFinite(clean.finalExam[k])) clean.finalExam[k] = 0; });
    clean.finalExam.best = Math.max(0, Math.min(100, clean.finalExam.best));
    if (clean.settings && typeof clean.settings.certName !== 'undefined' && !/^[\p{L}][\p{L} .'-]{1,39}$/u.test(String(clean.settings.certName))) delete clean.settings.certName;
    if (clean.settings && typeof clean.settings.easyRules !== 'boolean') delete clean.settings.easyRules;
    ['searchHistory', 'translatorHistory'].forEach((k) => { if (!Array.isArray(clean[k])) clean[k] = []; });
    clean.unlockedLevels = clean.unlockedLevels.filter((x) => C.level(x));
    if (!clean.unlockedLevels.includes('A1')) clean.unlockedLevels.unshift('A1');
    clean.validatedLevels = clean.validatedLevels.filter((x) => C.level(x));
    Object.keys(clean.lessons).forEach((id) => { if (!C.lessons[id]) { delete clean.lessons[id]; ignored.lessons++; } });
    const known = (id) => !L.dict || !L.dict.built || L.dict.byId.has(id);
    const words = obj.words.filter((w) => w && typeof w.id === 'string' && typeof w.box === 'number' && w.id.length < 120 && isFinite(w.box) && (known(w.id) || (ignored.words++, false)));
    const qstats = obj.qstats.filter((q) => q && typeof q.qid === 'string' && q.qid.length < 160 && typeof q.right === 'number' && typeof q.wrong === 'number' && isFinite(q.right) && isFinite(q.wrong));
    const attempts = Array.isArray(obj.attempts) ? obj.attempts.filter((a) => a && typeof a.kind === 'string').slice(-500) : [];
    return { ok: true, data: { user: obj.user, progress: clean, words, qstats, attempts, exportedAt: obj.exportedAt, accountId: obj.accountId }, ignored };
  };
  S.dataSummary = (d) => ({
    lessons: Object.values(d.progress.lessons || {}).filter((l) => l.done).length,
    words: d.words.length, updated: d.progress.updated || d.exportedAt || 0,
    placement: d.progress.placement ? d.progress.placement.level : null,
  });
  S.currentSummary = () => ({ lessons: lessonsDone(), words: S.words.size, updated: S.prog.updated, placement: S.prog.placement ? S.prog.placement.level : null });

  // Reemplaza el progreso del usuario actual por el de la copia (identidad y contraseña no cambian). Atómico.
  S.restoreFrom = async function (d) {
    const uid = S.user.id;
    const prog = Object.assign({}, d.progress, { userId: uid, updated: Date.now() });
    const ops = [];
    S.words.forEach((w, id) => ops.push({ store: 'words', del: [uid, id] }));
    S.qstats.forEach((q, id) => ops.push({ store: 'qstats', del: [uid, id] }));
    ops.push({ store: 'progress', put: prog });
    d.words.forEach((w) => ops.push({ store: 'words', put: Object.assign({}, w, { userId: uid }) }));
    d.qstats.forEach((q) => ops.push({ store: 'qstats', put: Object.assign({}, q, { userId: uid }) }));
    d.attempts.forEach((a) => { const c = Object.assign({}, a, { userId: uid }); delete c.aid; ops.push({ store: 'attempts', add: c }); });
    await L.db.commit(ops);
    await S.load(S.user);
  };
  // Fusión segura: nunca pierde progreso de ninguno de los dos lados
  S.mergeFrom = async function (d) {
    const cur = S.prog, inc = d.progress;
    const maxRec = (a, b) => {
      if (!a) return b; if (!b) return a;
      return Object.assign({}, a, { done: !!(a.done || b.done), best: Math.max(a.best || 0, b.best || 0), attempts: Math.max(a.attempts || 0, b.attempts || 0), last: Math.max(a.last || 0, b.last || 0), doneAt: a.doneAt || b.doneAt });
    };
    ['lessons', 'units', 'levelTests'].forEach((k) => { Object.keys(inc[k] || {}).forEach((id) => { cur[k][id] = maxRec(cur[k][id], inc[k][id]); }); });
    Object.keys(cur.levelTests || {}).forEach((lv) => {
      if (cur.levelTests[lv] && cur.levelTests[lv].done) { const nxt = C.levels[C.levelIdx(lv) + 1]; if (nxt && !cur.unlockedLevels.includes(nxt.id)) cur.unlockedLevels.push(nxt.id); }
    });
    inc.unlockedLevels.forEach((x) => { if (!cur.unlockedLevels.includes(x)) cur.unlockedLevels.push(x); });
    inc.validatedLevels.forEach((x) => { if (!cur.validatedLevels.includes(x)) cur.validatedLevels.push(x); });
    if (inc.placement && (!cur.placement || (inc.placement.date || 0) > (cur.placement.date || 0))) cur.placement = inc.placement;
    Object.keys(inc.skills || {}).forEach((s) => { const a = cur.skills[s], b = inc.skills[s]; if (!a || (b.t || 0) > (a.t || 0)) cur.skills[s] = b; });
    Object.keys(inc.activity || {}).forEach((day) => { const a = (cur.activity[day] = cur.activity[day] || {}); Object.keys(inc.activity[day]).forEach((k) => { a[k] = Math.max(a[k] || 0, inc.activity[day][k]); }); });
    Object.keys(inc.counters || {}).forEach((k) => { cur.counters[k] = Math.max(cur.counters[k] || 0, inc.counters[k]); });
    Object.keys(inc.favorites).forEach((k) => { inc.favorites[k].forEach((x) => { if (!cur.favorites[k].includes(x)) cur.favorites[k].push(x); }); });
    Object.keys(inc.achievements || {}).forEach((k) => { if (!cur.achievements[k] || inc.achievements[k] < cur.achievements[k]) cur.achievements[k] = inc.achievements[k]; });
    (inc.certificates || []).forEach((c) => { if (!cur.certificates.some((x) => x.id === c.id)) cur.certificates.push(c); });
    Object.keys(inc.done || {}).forEach((k) => { cur.done[k] = Object.assign({}, inc.done[k] || {}, cur.done[k] || {}); });
    if ((inc.updated || 0) > (cur.updated || 0) && inc.lastLesson && C.lessons[inc.lastLesson]) cur.lastLesson = inc.lastLesson;
    cur.translatorHistory = Array.from(new Set((cur.translatorHistory || []).concat(inc.translatorHistory || []))).slice(0, 100);
    d.words.forEach((w) => {
      const mine = S.words.get(w.id);
      if (!mine) { S.words.set(w.id, Object.assign({}, w, { userId: S.user.id })); S.markWord(w.id); return; }
      const win = (w.updated || 0) > (mine.updated || 0) ? Object.assign({}, w, { userId: S.user.id }) : mine;
      win.fav = !!(mine.fav || w.fav); win.wrong = Math.max(mine.wrong || 0, w.wrong || 0); win.right = Math.max(mine.right || 0, w.right || 0);
      S.words.set(w.id, win); S.markWord(w.id);
    });
    d.qstats.forEach((q) => {
      const mine = S.qstats.get(q.qid);
      if (!mine) S.qstats.set(q.qid, Object.assign({}, q, { userId: S.user.id }));
      else { mine.right = Math.max(mine.right, q.right); mine.wrong = Math.max(mine.wrong, q.wrong); mine.last = Math.max(mine.last || 0, q.last || 0); }
      S.markQ(q.qid);
    });
    S.markProg();
    const ok = await S.flush();
    if (!ok) throw new Error('save failed');
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  // Conexión con el servicio de cuentas. La clave publicable es pública por diseño: solo permite
  // llamar a las funciones de cuenta; las tablas no son accesibles desde el navegador.
  const BASE = 'https://zmhxsfkogbmyhesdkumn.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_pjtzB-WsmA6cJTUAnxgffQ_dLVpRWUS';
  const K = (L.cloud = {});
  async function rpc(name, body) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(BASE + name, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
      if (!r.ok) return { ok: false, err: 'net' };
      const j = await r.json();
      return j && typeof j === 'object' && !Array.isArray(j) ? j : { ok: false, err: 'net' };
    } catch (e) { return { ok: false, err: 'net' }; } finally { clearTimeout(t); }
  }
  K.register = (u, p) => rpc('lws_register', { p_user: u, p_pass: p });
  K.login = (u, p) => rpc('lws_login', { p_user: u, p_pass: p });
  K.logout = (t) => rpc('lws_logout', { p_token: t });
  K.load = (t) => rpc('lws_load', { p_token: t });
  K.save = (t, data, updated) => rpc('lws_save', { p_token: t, p_data: data, p_updated: Math.floor(updated || 0) });
  K.changePassword = (t, o, n) => rpc('lws_change_password', { p_token: t, p_old: o, p_new: n });
  K.issueCert = (t, kind, ref, name) => rpc('lws_issue_cert', { p_token: t, p_kind: kind, p_ref: ref, p_name: name, p_data: {} });
  K.myCerts = (t) => rpc('lws_my_certs', { p_token: t });
  K.verifyCert = (id, code) => rpc('lws_verify_cert', { p_id: id, p_code: code });
  K.deleteAccount = (t, p) => rpc('lws_delete_account', { p_token: t, p_pass: p });
  // Mensajes (en inglés) para los códigos de error del servicio
  K.message = function (r, what) {
    switch (r && r.err) {
      case 'username': return 'Username must be 3 to 20 characters: lowercase letters, numbers or underscore.';
      case 'password': return 'Password must be between 8 and 64 characters.';
      case 'taken': return 'This username is already taken. Please choose another one.';
      case 'rate': return 'Too many attempts from this connection. Please wait a little and try again.';
      case 'locked': return 'Too many failed attempts. Please wait ' + (r.secs || 15) + ' seconds and try again.';
      case 'bad': return what === 'password' ? 'The current password is incorrect.' : 'Incorrect username or password.';
      case 'name': return 'Escribe un nombre válido (solo letras, espacios, punto, apóstrofo o guion).';
      case 'notdone': return 'Tu progreso guardado en línea todavía no muestra este nivel completado. Espera unos segundos y vuelve a intentarlo.';
      case 'none': return 'No existe ningún certificado con ese número.';
      case 'mismatch': return 'Los datos NO coinciden: este certificado no es auténtico o fue alterado.';
      case 'auth': return 'Your session has expired. Please sign in again.';
      case 'size': return 'Your data is too large to save online.';
      default: return 'Could not reach the server. Check your internet connection and try again.';
    }
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const A = (L.A = { user: null, GUEST_ID: 'guest-local' });
  const SKEY = 'lws.session';

  // Freno a intentos repetidos: tras 5 fallos, espera creciente (se guarda en este dispositivo)
  const FKEY = 'lws.f';
  function readFail() { try { return JSON.parse(localStorage.getItem(FKEY)) || { n: 0, t: 0 }; } catch (e) { return { n: 0, t: 0 }; } }
  function lockLeft() { const f = readFail(); if (f.n < 5) return 0; const d = Math.min(15 * 60000, 15000 * Math.pow(2, f.n - 5)); return Math.max(0, f.t + d - Date.now()); }
  function noteFail() { const f = readFail(); try { localStorage.setItem(FKEY, JSON.stringify({ n: f.n + 1, t: Date.now() })); } catch (e) {} }
  function clearFail() { try { localStorage.removeItem(FKEY); } catch (e) {} }
  function readSession() { try { const a = localStorage.getItem(SKEY) || sessionStorage.getItem(SKEY); return a ? JSON.parse(a) : null; } catch (e) { return null; } }
  function writeSession(userId, remember) {
    try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); (remember ? localStorage : sessionStorage).setItem(SKEY, JSON.stringify({ userId, ts: Date.now() })); } catch (e) {}
  }
  function clearSession() { try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); } catch (e) {} }

  const USER_RE = /^[a-z0-9_]{3,20}$/;
  A.normUser = (u) => String(u || '').trim().toLowerCase();
  A.validUsername = (u) => USER_RE.test(A.normUser(u));
  A.passwordProblem = (p) => {
    if (!p || p.length < 8) return 'Password must be at least 8 characters.';
    if (p.length > 64) return 'Password must be at most 64 characters.';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password must contain at least one letter and one number.';
    return null;
  };
  A.isGuest = () => !A.user || A.user.id === A.GUEST_ID;

  async function ensureGuest() {
    let g = await L.db.get('users', A.GUEST_ID);
    if (!g) { g = { id: A.GUEST_ID, name: 'Guest', created: Date.now(), lastLogin: Date.now(), guest: true }; await L.db.put('users', g); }
    return g;
  }
  // El nombre de usuario se guarda en el campo indexado «email» (clave única del almacén local)
  async function findByUsername(name) {
    const db = await L.db.open();
    return new Promise((res, rej) => {
      const r = db.transaction('users').objectStore('users').index('email').get(A.normUser(name));
      r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
    });
  }

  A.init = async function () {
    await L.db.open();
    const guest = await ensureGuest();
    const s = readSession();
    let u = null;
    if (s && s.userId) u = await L.db.get('users', s.userId);
    A.user = u || guest;
    await L.S.load(A.user);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return A.user;
  };


  // ---------- sincronización con la cuenta en línea ----------
  let pushTimer = null, pushing = false;
  A.hasCloud = () => !A.isGuest() && !!(A.user && A.user.ct);
  async function dropToken(msg) {
    if (!A.user) return;
    A.user.ct = null; try { await L.db.put('users', A.user); } catch (e) {}
    if (msg) L.toast(msg, 'err', 7000);
  }
  A.push = async function () {
    if (!A.hasCloud() || !navigator.onLine || pushing || !L.S.prog) return false;
    pushing = true;
    try {
      const data = await L.S.exportData(null);
      const r = await L.cloud.save(A.user.ct, JSON.stringify(data), L.S.prog.updated);
      if (!r.ok && r.err === 'auth') await dropToken('Your online session has expired. Sign in again to keep your progress saved online.');
      return !!r.ok;
    } catch (e) { return false; } finally { pushing = false; }
  };
  A.schedulePush = function () {
    if (!A.hasCloud()) return;
    clearTimeout(pushTimer); pushTimer = setTimeout(() => A.push(), 4000);
  };
  // Trae el progreso en línea y lo fusiona (nunca pierde nada de ninguno de los dos lados)
  A.pull = async function (replaceEmpty) {
    if (!A.hasCloud() || !navigator.onLine) return false;
    const r = await L.cloud.load(A.user.ct);
    if (!r.ok) { if (r.err === 'auth') await dropToken('Your online session has expired. Sign in again to keep your progress saved online.'); return false; }
    if (!r.data) return false;
    let obj; try { obj = L.safeParse(r.data); } catch (e) { return false; }
    const v = L.S.validateBackup(obj);
    if (!v.ok || v.encrypted) return false;
    try { if (replaceEmpty) await L.S.restoreFrom(v.data); else await L.S.mergeFrom(v.data); return true; } catch (e) { return false; }
  };
  L.S.onSave((st) => { if (st === 'saved') A.schedulePush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && A.hasCloud()) { clearTimeout(pushTimer); A.push(); } });
  window.addEventListener('online', () => { if (A.hasCloud()) A.push(); });

  async function newLocalUser(username, password, token) {
    const pw = await L.crypto.hashPassword(password);
    return { id: L.uid(), name: username, username, email: username, pw, ct: token || null, created: Date.now(), lastLogin: Date.now() };
  }

  // f.keepGuest: mover el progreso de invitado a la cuenta nueva.
  A.signUp = async function (f) {
    const errors = {};
    const username = A.normUser(f.username);
    if (!A.validUsername(username)) errors.username = 'Username must be 3 to 20 characters: lowercase letters, numbers or underscore.';
    const pp = A.passwordProblem(f.password); if (pp) errors.password = pp;
    if (!errors.password && f.password !== f.confirm) errors.confirm = 'Passwords do not match.';
    if (!L.crypto.available()) errors.form = 'For your safety, accounts can only be created over a secure (https://) connection. Please open the site from its https:// address.';
    if (Object.keys(errors).length) return { ok: false, errors };
    if (!navigator.onLine) return { ok: false, errors: { form: 'You need an internet connection to create an account.' } };
    const r = await L.cloud.register(username, f.password);
    if (!r.ok) { const m = L.cloud.message(r); return { ok: false, errors: r.err === 'taken' || r.err === 'username' ? { username: m } : r.err === 'password' ? { password: m } : { form: m } }; }
    let user = await findByUsername(username);
    const fresh = !user;
    if (user) { user.pw = await L.crypto.hashPassword(f.password); user.ct = r.token; user.lastLogin = Date.now(); user.username = username; await L.db.put('users', user); }
    else {
      user = await newLocalUser(username, f.password, r.token);
      const ops = [{ store: 'users', put: user }, { store: 'progress', put: L.S.defaultProg(user.id) }];
      const moving = f.keepGuest && A.user && A.user.id === A.GUEST_ID;
      if (moving) {
        const np = Object.assign({}, L.S.prog, { userId: user.id, created: Date.now(), updated: Date.now() });
        ops[1] = { store: 'progress', put: np };
        L.S.words.forEach((w) => ops.push({ store: 'words', put: Object.assign({}, w, { userId: user.id }) }));
        L.S.qstats.forEach((q) => ops.push({ store: 'qstats', put: Object.assign({}, q, { userId: user.id }) }));
      }
      try { await L.db.commit(ops); } catch (e) { L.cloud.logout(r.token); return { ok: false, errors: { form: 'Could not save the account on this device. Check that the browser allows site storage.' } }; }
      if (moving) { await L.db.deleteUser(A.GUEST_ID); await ensureGuest(); }
    }
    writeSession(user.id, true);
    A.user = user;
    await L.S.load(user);
    if (!fresh) await A.pull(false);
    A.push();
    return { ok: true, user };
  };

  A.signIn = async function (f) {
    const errors = {};
    const username = A.normUser(f.username);
    if (!A.validUsername(username)) errors.username = 'Please enter your username (3 to 20 characters: lowercase letters, numbers or underscore).';
    if (!f.password) errors.password = 'Please enter your password.';
    if (Object.keys(errors).length) return { ok: false, errors };
    if (!L.crypto.available()) return { ok: false, errors: { form: 'For your safety, sign-in only works over a secure (https://) connection.' } };
    const wait = lockLeft();
    if (wait > 0) return { ok: false, errors: { form: 'Too many failed attempts. Please wait ' + Math.ceil(wait / 1000) + ' seconds and try again.' } };
    let u = await findByUsername(username);
    const r = navigator.onLine ? await L.cloud.login(username, f.password) : { ok: false, err: 'net' };
    if (r.ok) {
      clearFail();
      const fresh = !u;
      if (u) { u.pw = await L.crypto.hashPassword(f.password); u.ct = r.token; u.lastLogin = Date.now(); u.username = username; await L.db.put('users', u); }
      else { u = await newLocalUser(username, f.password, r.token); await L.db.commit([{ store: 'users', put: u }, { store: 'progress', put: L.S.defaultProg(u.id) }]); }
      writeSession(u.id, !!f.remember);
      A.user = u;
      await L.S.load(u);
      await A.pull(fresh);
      return { ok: true, user: u };
    }
    if (r.err === 'bad') { noteFail(); await new Promise((x) => setTimeout(x, 450)); return { ok: false, errors: { form: L.cloud.message(r) } }; }
    if (r.err !== 'net') return { ok: false, errors: { form: L.cloud.message(r) } };
    // Sin conexión con el servicio: solo se permite entrar si esta cuenta ya existe en este dispositivo
    if (u && u.pw && (await L.crypto.verifyPassword(f.password, u.pw))) {
      clearFail(); u.lastLogin = Date.now(); await L.db.put('users', u);
      writeSession(u.id, !!f.remember); A.user = u; await L.S.load(u);
      return { ok: true, user: u, offline: true };
    }
    if (u && u.pw) { noteFail(); await new Promise((x) => setTimeout(x, 450)); return { ok: false, errors: { form: 'Incorrect username or password.' } }; }
    return { ok: false, errors: { form: L.cloud.message(r) } };
  };

  A.signOut = async function () {
    clearTimeout(pushTimer);
    await L.S.flush();
    if (A.hasCloud()) {
      await Promise.race([A.push(), new Promise((x) => setTimeout(x, 5000))]);
      const t = A.user.ct; L.cloud.logout(t);
      A.user.ct = null; try { await L.db.put('users', A.user); } catch (e) {}
    }
    clearSession();
    A.user = await ensureGuest();
    await L.S.load(A.user);
  };

  A.changePassword = async function (cur, next, confirm) {
    if (A.isGuest()) return { ok: false, error: 'Guests have no password.' };
    const pp = A.passwordProblem(next); if (pp) return { ok: false, error: pp };
    if (next !== confirm) return { ok: false, error: 'Passwords do not match.' };
    if (A.hasCloud()) {
      if (!navigator.onLine) return { ok: false, error: 'You need an internet connection to change your password.' };
      const r = await L.cloud.changePassword(A.user.ct, cur, next);
      if (!r.ok) { if (r.err === 'auth') await dropToken(); return { ok: false, error: L.cloud.message(r, 'password') }; }
    } else if (!(await L.crypto.verifyPassword(cur, A.user.pw))) return { ok: false, error: 'The current password is incorrect.' };
    A.user.pw = await L.crypto.hashPassword(next);
    await L.db.put('users', A.user);
    return { ok: true };
  };

  // Elimina la cuenta actual (en línea y en este dispositivo). Pide la contraseña si hay cuenta en línea.
  A.deleteCurrent = async function (password) {
    const id = A.user.id;
    if (!A.isGuest() && !A.hasCloud()) return { ok: false, error: navigator.onLine ? 'Please sign out and sign in again, then delete the account.' : 'You need an internet connection to delete your account.' };
    if (A.hasCloud()) {
      if (!navigator.onLine) return { ok: false, error: 'You need an internet connection to delete an online account.' };
      const r = await L.cloud.deleteAccount(A.user.ct, password || '');
      if (!r.ok) { if (r.err === 'auth') await dropToken(); return { ok: false, error: L.cloud.message(r, 'password') }; }
    }
    clearTimeout(pushTimer);
    await L.db.deleteUser(id);
    clearSession();
    A.user = await ensureGuest();
    await L.S.load(A.user);
    return { ok: true };
  };

  // Crea una cuenta nueva a partir de una copia (nuevo dispositivo) y restaura los datos
  A.createFromBackup = async function (data, username, password, confirm) {
    username = A.normUser(username);
    const name = username;
    if (!A.validUsername(username)) return { ok: false, error: 'Username must be 3 to 20 characters: lowercase letters, numbers or underscore.' };
    const pp = A.passwordProblem(password); if (pp) return { ok: false, error: pp };
    if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
    if (!navigator.onLine) return { ok: false, error: 'You need an internet connection to create an account.' };
    if (await findByUsername(username)) return { ok: false, error: 'An account with this username already exists on this device. Sign in and use Import My Data instead.' };
    const r = await L.cloud.register(username, password);
    if (!r.ok) return { ok: false, error: L.cloud.message(r) };
    const user = await newLocalUser(username, password, r.token); user.name = name;
    await L.db.commit([{ store: 'users', put: user }, { store: 'progress', put: L.S.defaultProg(user.id) }]);
    writeSession(user.id, true);
    A.user = user;
    await L.S.load(user);
    await L.S.restoreFrom(data);
    A.push();
    return { ok: true, user };
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h } = L;
  const A = (L.Audio = { current: null, lastError: null });
  const synth = window.speechSynthesis;
  let voices = [];
  let readyP = null;

  function load() { try { voices = synth ? synth.getVoices().filter((v) => /^es([-_]|$)/i.test(v.lang)) : []; } catch (e) { voices = []; } return voices; }
  A.supported = () => !!(synth && window.SpeechSynthesisUtterance);
  A.ready = function () {
    if (readyP) return readyP;
    readyP = new Promise((res) => {
      if (!A.supported()) return res([]);
      if (load().length) return res(voices);
      let done = false;
      const fin = () => { if (!done) { done = true; res(load()); } };
      synth.addEventListener && synth.addEventListener('voiceschanged', fin);
      setTimeout(fin, 1500);
    });
    return readyP;
  };
  A.voices = () => (load(), voices);
  A.hasVoice = () => A.voices().length > 0;

  // Variedades realmente disponibles en este dispositivo
  A.dialects = function () {
    const vs = A.voices();
    const out = [];
    if (vs.some((v) => /^es[-_]ES/i.test(v.lang))) out.push({ id: 'es-ES', label: 'Español de España' });
    if (vs.some((v) => /^es[-_]MX/i.test(v.lang))) out.push({ id: 'es-MX', label: 'Español de México' });
    if (vs.some((v) => /^es[-_](?!ES|MX)/i.test(v.lang))) out.push({ id: 'es-419', label: 'Español de América Latina' });
    return out;
  };
  A.pickVoice = function () {
    const vs = A.voices();
    if (!vs.length) return null;
    const st = (L.S && L.S.prog && L.S.prog.settings) || {};
    if (st.voiceURI) { const v = vs.find((x) => x.voiceURI === st.voiceURI); if (v) return v; }
    const by = { 'es-ES': (v) => /^es[-_]ES/i.test(v.lang), 'es-MX': (v) => /^es[-_]MX/i.test(v.lang), 'es-419': (v) => /^es[-_](?!ES|MX)/i.test(v.lang) };
    if (st.dialect && by[st.dialect]) { const m = vs.filter(by[st.dialect]); if (m.length) return m.sort((a, b) => (b.localService ? 1 : 0) - (a.localService ? 1 : 0))[0]; }
    return vs.slice().sort((a, b) => (/es[-_]ES|es[-_]MX/i.test(b.lang) ? 1 : 0) - (/es[-_]ES|es[-_]MX/i.test(a.lang) ? 1 : 0))[0];
  };

  A.stop = function () { try { synth && synth.cancel(); } catch (e) {} if (A.current) { const c = A.current; A.current = null; c.cancelled = true; c.end && c.end('cancel'); } };
  A.pause = function () { try { synth.pause(); } catch (e) {} };
  A.resume = function () { try { synth.resume(); } catch (e) {} };

  // Reproduce un texto. Promesa: 'end' | 'cancel' | rechaza con Error (mensaje en español)
  A.speak = function (text, o) {
    o = o || {};
    return new Promise((res, rej) => {
      if (!A.supported()) { A.lastError = 'Este navegador no puede reproducir voz.'; return rej(new Error(A.lastError)); }
      A.stop();
      const st = (L.S && L.S.prog && L.S.prog.settings) || {};
      const u = new SpeechSynthesisUtterance(String(text).replace(/[«»]/g, ''));
      const v = A.pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-ES';
      u.rate = Math.max(0.6, Math.min(1.2, (st.rate || 1) * (o.slow ? 0.75 : 1)));
      u.volume = typeof st.volume === 'number' ? st.volume : 1;
      const ctx = { cancelled: false };
      ctx.end = (why) => { res(why || 'end'); };
      A.current = ctx;
      let started = false;
      u.onstart = () => { started = true; o.onstart && o.onstart(); };
      u.onend = () => { if (A.current === ctx) A.current = null; res('end'); };
      u.onerror = (e) => {
        if (A.current === ctx) A.current = null;
        if (e && (e.error === 'canceled' || e.error === 'interrupted')) return res('cancel');
        A.lastError = A.hasVoice() ? 'No se pudo reproducir el audio.' : 'No hay una voz en español en este dispositivo. Instálala en los ajustes de voz del sistema.';
        rej(new Error(A.lastError));
      };
      try { synth.speak(u); } catch (e) { return rej(e); }
      setTimeout(() => { if (!started && A.current === ctx && !A.hasVoice()) { A.stop(); A.lastError = 'No hay una voz en español en este dispositivo. Instálala en los ajustes de voz del sistema.'; rej(new Error(A.lastError)); } }, 4000);
    });
  };
  // Reproduce varias líneas en orden. Devuelve {stop}
  A.sequence = function (lines, o) {
    o = o || {};
    let cancelled = false;
    const ctl = { stop() { cancelled = true; A.stop(); }, promise: null };
    ctl.promise = (async () => {
      for (let i = o.from || 0; i < lines.length && !cancelled; i++) {
        o.onLine && o.onLine(i);
        const ln = lines[i];
        const r = await A.speak(ln.text || ln, { slow: o.slow }).catch((e) => { o.onError && o.onError(e); throw e; });
        if (r === 'cancel' || cancelled) break;
        await new Promise((r2) => setTimeout(r2, o.gap == null ? 250 : o.gap));
      }
      o.onLine && o.onLine(-1);
      o.onEnd && o.onEnd(!cancelled);
    })().catch(() => { o.onLine && o.onLine(-1); o.onEnd && o.onEnd(false); });
    return ctl;
  };

  // Botón 🔊 accesible. text: string o función que devuelve string.
  A.btn = function (text, o) {
    o = o || {};
    const label = o.label || (o.slow ? 'Escuchar despacio' : 'Escuchar');
    const b = h('button', { type: 'button', class: 'audio-btn' + (o.slow ? ' slow' : '') + (o.small ? ' small' : ''), 'aria-label': label + (o.name ? ': ' + o.name : ''), title: label }, o.slow ? '🐢' : '🔊');
    let playing = false;
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (playing) { A.stop(); return; }
      playing = true; b.classList.add('playing'); b.textContent = '⏹';
      const done = () => { playing = false; b.classList.remove('playing'); b.textContent = o.slow ? '🐢' : '🔊'; };
      try { await A.speak(typeof text === 'function' ? text() : text, { slow: o.slow }); o.onEnd && o.onEnd(); } catch (err) { L.toast(err.message, 'err', 5000); }
      done();
    });
    return b;
  };

  // ---- Grabación del usuario (solo si pulsa «Grabar») ----
  A.canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  A.recorder = function () {
    let stream = null, mr = null, chunks = [];
    return {
      async start() {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = [];
        mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
        mr.start();
      },
      stop() {
        return new Promise((res) => {
          if (!mr) return res(null);
          mr.onstop = () => { const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); stream.getTracks().forEach((t) => t.stop()); res(blob); };
          try { mr.stop(); } catch (e) { res(null); }
        });
      },
    };
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, shuffle, norm, checkText } = L;
  const E = (L.Engine = {});
  const OKMSG = ['¡Excelente!', '¡Muy bien!', '¡Correcto!', '¡Perfecto!', '¡Así se hace!'];

  const vh = (txt) => h('span', { class: 'vh' }, txt);
  const playRow = (say) => h('div', { class: 'play-row' }, L.Audio.btn(say, { label: 'Escuchar' }), L.Audio.btn(say, { slow: true, label: 'Escuchar despacio' }));
  function transcriptLink(say, state, box) {
    const b = h('button', { type: 'button', class: 'link-btn', onclick: () => { state.assisted = true; box.textContent = 'Texto: «' + say + '»'; b.remove(); } }, 'No puedo escuchar: mostrar el texto');
    return b;
  }

  const T = {};
  T.mc = function (q) {
    const opts = shuffle(q.o);
    const wrap = h('div', { class: 'opts', role: 'group', 'aria-label': 'Opciones' });
    let locked = false, resolveCb = null;
    opts.forEach((o, i) => {
      const b = h('button', { type: 'button', class: 'opt', 'data-v': o }, h('span', { class: 'opt-k' }, String(i + 1)), h('span', { class: 'opt-t' }, o));
      b.addEventListener('click', () => { if (locked) return; locked = true; resolveCb && resolveCb(o); });
      wrap.appendChild(b);
    });
    const onKey = (e) => { if (/^[1-9]$/.test(e.key) && !locked && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { const b = wrap.children[+e.key - 1]; if (b) b.click(); } };
    document.addEventListener('keydown', onKey);
    return {
      el: wrap, auto: true,
      onAnswer(cb) { resolveCb = cb; },
      result(given) {
        document.removeEventListener('keydown', onKey);
        Array.from(wrap.children).forEach((b) => {
          b.disabled = true;
          const v = b.getAttribute('data-v');
          if (v === q.a) { b.classList.add('right'); b.appendChild(vh(' (respuesta correcta)')); b.appendChild(h('span', { class: 'mark', 'aria-hidden': 'true' }, '✓')); }
          else if (v === given) { b.classList.add('wrong'); b.appendChild(vh(' (tu respuesta, incorrecta)')); b.appendChild(h('span', { class: 'mark', 'aria-hidden': 'true' }, '✕')); }
        });
        return { ok: given === q.a, given, correct: q.a };
      },
      dispose() { document.removeEventListener('keydown', onKey); },
      focus() { const f = wrap.firstChild; f && f.focus(); },
    };
  };
  T.read = function (q, st) { const m = T.mc(q, st); return Object.assign(m, { el: h('div', null, h('div', { class: 'read-ctx' }, q.ctx), m.el) }); };
  T.listen = function (q, st) {
    const m = T.mc(q, st);
    const tr = h('div', { class: 'transcript', 'aria-live': 'polite' });
    return Object.assign(m, { el: h('div', null, playRow(q.say), tr, transcriptLink(q.say, st, tr), m.el) });
  };
  T.fill = function (q, st) {
    const parts = String(q.q).split('___');
    const input = h('input', { type: 'text', class: 'fill-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Tu respuesta', lang: 'es' });
    const el = parts.length > 1 ? h('div', { class: 'fill-line' }, parts[0], input, parts.slice(1).join('___')) : h('div', null, input);
    const special = h('div', { class: 'special-keys', 'aria-label': 'Caracteres españoles' }, ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'].map((c) => h('button', { type: 'button', class: 'key', tabindex: '-1', 'aria-label': 'Insertar ' + c, onclick: () => { const s = input.selectionStart == null ? input.value.length : input.selectionStart; input.setRangeText(c, s, input.selectionEnd == null ? s : input.selectionEnd, 'end'); input.focus(); } }, c)));
    const wrap = h('div', null, el, special);
    if (q.hint) wrap.appendChild(h('div', { class: 'hint' }, 'Pista: ' + q.hint));
    return {
      el: wrap, submit: true, getValue: () => input.value, focus() { input.focus(); },
      result(val) {
        input.disabled = true;
        const r = checkText(val, q.a, { strictAccents: st.strictAccents });
        input.classList.add(r.ok ? 'right' : 'wrong');
        return { ok: r.ok, given: val, correct: r.expected, kind: r.kind, expectedAll: q.a };
      },
    };
  };
  T.dict = function (q, st) {
    const input = h('input', { type: 'text', class: 'fill-input wide', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Escribe lo que oyes', lang: 'es' });
    const tr = h('div', { class: 'transcript', 'aria-live': 'polite' });
    return {
      el: h('div', null, playRow(q.say), tr, transcriptLink(q.say, st, tr), input), submit: true, getValue: () => input.value, focus() { input.focus(); },
      result(val) {
        input.disabled = true;
        const r = checkText(val, [q.say], { strictAccents: st.strictAccents });
        input.classList.add(r.ok ? 'right' : 'wrong');
        return { ok: r.ok, given: val, correct: q.say, kind: r.kind };
      },
    };
  };
  T.order = function (q, st) {
    const words = String(q.a).split(/\s+/).filter(Boolean).concat(q.extra || []);
    const bank = h('div', { class: 'bank', role: 'group', 'aria-label': 'Palabras disponibles' });
    const area = h('div', { class: 'answer-area', role: 'group', 'aria-label': 'Tu frase', 'aria-live': 'polite' });
    const placed = [];
    const chips = shuffle(words).map((w, i) => ({ w, i, used: false }));
    function draw() {
      bank.innerHTML = ''; area.innerHTML = '';
      chips.forEach((c) => { if (!c.used) bank.appendChild(h('button', { type: 'button', class: 'chip', onclick: () => { c.used = true; placed.push(c); draw(); } }, c.w)); });
      placed.forEach((c) => area.appendChild(h('button', { type: 'button', class: 'chip placed', 'aria-label': 'Quitar ' + c.w, onclick: () => { c.used = false; placed.splice(placed.indexOf(c), 1); draw(); } }, c.w)));
      if (!placed.length) area.appendChild(h('span', { class: 'ph' }, 'Toca las palabras para formar la frase'));
    }
    draw();
    const reset = h('button', { type: 'button', class: 'link-btn', onclick: () => { placed.splice(0).forEach((c) => (c.used = false)); draw(); } }, 'Borrar todo');
    const el = h('div', null, area, bank, reset);
    return {
      el, submit: true, getValue: () => placed.map((c) => c.w).join(' '),
      focus() { const f = bank.firstChild; f && f.focus(); },
      result(val) {
        Array.from(el.querySelectorAll('button')).forEach((b) => (b.disabled = true));
        const accepted = [q.a].concat(q.alts || []);
        const ok = accepted.some((a) => norm(a) === norm(val)) || (!st.strictAccents && accepted.some((a) => L.stripAcc(norm(a)) === L.stripAcc(norm(val))));
        area.classList.add(ok ? 'right' : 'wrong');
        return { ok, given: val, correct: q.a };
      },
    };
  };
  T.match = function (q) {
    const left = q.pairs.map((p, i) => ({ t: p[0], i }));
    const right = shuffle(q.pairs.map((p, i) => ({ t: p[1], i })));
    let selL = null, mistakes = 0, matched = 0, resolveCb = null;
    const colL = h('div', { class: 'mcol' }), colR = h('div', { class: 'mcol' });
    const btns = [];
    function mk(item, side) {
      const b = h('button', { type: 'button', class: 'mitem' }, item.t);
      b.dataset.i = item.i; b.dataset.side = side;
      b.addEventListener('click', () => {
        if (b.classList.contains('done')) return;
        if (side === 'l') { btns.filter((x) => x.dataset.side === 'l').forEach((x) => x.classList.remove('sel')); selL = b; b.classList.add('sel'); return; }
        if (!selL) { L.toast('Primero elige una palabra de la izquierda.', '', 1800); return; }
        if (selL.dataset.i === b.dataset.i) {
          selL.classList.remove('sel'); selL.classList.add('done'); b.classList.add('done');
          selL.appendChild(h('span', { class: 'mark', 'aria-hidden': 'true' }, '✓')); selL.disabled = true; b.disabled = true;
          matched++; selL = null;
          if (matched === q.pairs.length) resolveCb && resolveCb(null);
        } else {
          mistakes++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400);
          L.toast('Esa no es la pareja. Inténtalo de nuevo.', 'err', 1600);
        }
      });
      btns.push(b); return b;
    }
    left.forEach((x) => colL.appendChild(mk(x, 'l')));
    right.forEach((x) => colR.appendChild(mk(x, 'r')));
    return {
      el: h('div', { class: 'match' }, colL, colR), auto: true,
      onAnswer(cb) { resolveCb = cb; },
      focus() { colL.firstChild && colL.firstChild.focus(); },
      result() { return { ok: mistakes <= 1, given: mistakes + ' errores', correct: q.pairs.map((p) => p[0] + ' = ' + p[1]).join(' · '), mistakes }; },
    };
  };
  E.types = T;

  // ---- ejecutor ----
  // opts: {title, strictAccents, onAnswer(q,res), finishLabel}
  E.run = function (host, questions, opts) {
    opts = opts || {};
    const qs = questions.slice();
    const results = [];
    let idx = 0;
    return new Promise((resolve) => {
      if (!qs.length) return resolve([]);
      function show() {
        const q = qs[idx];
        const st = { assisted: false, strictAccents: opts.strictAccents == null ? !!(L.S.prog && L.S.prog.settings.strictAccents) : !!opts.strictAccents };
        host.innerHTML = '';
        const total = qs.length;
        const bar = h('div', { class: 'qbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': idx }, h('div', { class: 'qbar-in', style: 'width:' + Math.round((idx / total) * 100) + '%' }));
        const head = h('div', { class: 'q-head' }, h('span', null, (opts.title ? opts.title + ' · ' : '') + 'Pregunta ' + (idx + 1) + ' de ' + total), bar);
        const comp = T[q.t](q, st);
        const hasBlank = q.t === 'fill' && String(q.q).indexOf('___') >= 0;
        const card = h('div', { class: 'qcard' + (L.reducedMotion() ? '' : ' enter') });
        card.appendChild(head);
        if (hasBlank) card.appendChild(h('div', { class: 'q-text' }, 'Completa la frase.'));
        else card.appendChild(h('h3', { class: 'q-text' }, q.q || (q.t === 'dict' ? 'Escucha y escribe lo que oyes.' : q.t === 'match' ? 'Une cada palabra con su definición.' : q.t === 'order' ? 'Ordena las palabras para formar una frase correcta.' : '')));
        if (q.t === 'match') card.appendChild(h('p', { class: 'muted' }, 'Elige una palabra de la izquierda y luego su definición en la derecha.'));
        card.appendChild(comp.el);
        const fb = h('div', { class: 'feedback', 'aria-live': 'assertive' });
        const act = h('div', { class: 'q-actions' });
        card.appendChild(fb); card.appendChild(act);
        host.appendChild(card);
        let answered = false;

        function finish(raw) {
          if (answered) return; answered = true;
          const r = comp.result(raw);
          r.id = q.id; r.q = q; r.assisted = st.assisted;
          results.push(r);
          opts.onAnswer && opts.onAnswer(q, r);
          fb.className = 'feedback show ' + (r.ok ? 'ok' : 'bad');
          if (r.ok) {
            fb.appendChild(h('strong', null, '✓ ' + OKMSG[Math.floor(Math.random() * OKMSG.length)]));
            if (r.kind === 'tilde') fb.appendChild(h('div', null, 'Atención a la tilde: se escribe «' + r.correct + '».'));
          } else {
            fb.appendChild(h('strong', null, '✕ ' + (r.kind === 'ortografia' ? 'Casi: revisa la ortografía.' : r.kind === 'tilde' ? 'Falta la tilde (acento escrito).' : r.kind === 'empty' ? 'No escribiste ninguna respuesta.' : 'Respuesta incorrecta.')));
            fb.appendChild(q.t !== 'match' ? h('div', null, 'Respuesta correcta: ', h('b', null, '«' + r.correct + '»')) : h('div', null, 'Parejas correctas: ' + r.correct));
          }
          if (q.why) fb.appendChild(h('div', { class: 'why' }, q.why));
          if (L.coach) fb.appendChild(L.coach.feedback(q, r, opts));
          if (q.t === 'fill' && !r.ok && r.expectedAll && r.expectedAll.length > 1) fb.appendChild(h('div', { class: 'muted' }, 'También se acepta: ' + r.expectedAll.slice(1).map((x) => '«' + x + '»').join(', ')));
          if (!L.reducedMotion()) card.classList.add(r.ok ? 'pop' : 'shake');
          act.innerHTML = '';
          const last = idx === total - 1;
          const nxt = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { comp.dispose && comp.dispose(); if (last) resolve(results); else { idx++; show(); } } }, last ? (opts.finishLabel || 'Ver resultado') : 'Siguiente');
          act.appendChild(nxt);
          setTimeout(() => nxt.focus(), 50);
        }
        if (comp.auto) comp.onAnswer((v) => finish(v));
        if (comp.submit) {
          const btn = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => finish(comp.getValue()) }, 'Comprobar');
          act.appendChild(btn);
          card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !answered && e.target.tagName !== 'BUTTON') { e.preventDefault(); btn.click(); } });
        }
        setTimeout(() => comp.focus && comp.focus(), 60);
      }
      show();
    });
  };

  E.summary = function (results, o) {
    o = o || {};
    const ok = results.filter((r) => r.ok).length;
    const total = results.length;
    const pct = L.pct(ok, total);
    const pass = o.pass == null ? 75 : o.pass;
    const passed = pct >= pass;
    const wrap = h('div', { class: 'summary' });
    wrap.appendChild(h('div', { class: 'score-ring ' + (passed ? 'pass' : 'fail'), role: 'img', 'aria-label': 'Resultado: ' + pct + ' por ciento' }, h('div', { class: 'score-num' }, pct + '%'), h('div', { class: 'score-sub' }, ok + ' / ' + total)));
    wrap.appendChild(h('h2', null, o.headline || (passed ? '¡Lo lograste!' : 'Casi lo tienes')));
    wrap.appendChild(h('p', null, passed ? 'Superaste el mínimo de ' + pass + ' %. Tu progreso se ha guardado.' : 'Necesitas al menos ' + pass + ' % para continuar. Repasa los errores y vuelve a intentarlo; tu progreso anterior no se pierde.'));
    const wrong = results.filter((r) => !r.ok);
    if (wrong.length) {
      const det = h('div', { class: 'wrong-list' }, h('h3', null, 'Errores y explicaciones'));
      wrong.forEach((r) => {
        const q = r.q;
        det.appendChild(h('div', { class: 'wrong-item' },
          h('div', { class: 'wq' }, q.q || (q.t === 'dict' ? 'Dictado' : q.t === 'order' ? 'Ordenar la frase' : 'Pregunta')),
          h('div', null, 'Tu respuesta: ', h('span', { class: 'bad-t' }, r.given ? '«' + r.given + '»' : '—')),
          h('div', null, 'Correcta: ', h('b', null, '«' + r.correct + '»')),
          q.why ? h('div', { class: 'why' }, q.why) : null));
      });
      wrap.appendChild(det);
    }
    return { el: wrap, pct, passed, ok, total, wrong };
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h } = L;
  const U = (L.U = {});

  U.bar = (pct) => h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Progreso ' + pct + ' %' }, h('i', { style: 'width:' + pct + '%' }));
  U.empty = (icon, msg, action) => h('div', { class: 'empty' }, h('span', { class: 'big', 'aria-hidden': 'true' }, icon), h('p', null, msg), action || null);
  U.loading = () => h('div', { 'aria-busy': 'true', 'aria-label': 'Cargando' }, h('div', { class: 'skeleton' }), h('div', { class: 'skeleton', style: 'margin-top:12px' }));
  U.errorBox = (msg, retry) => h('div', { class: 'alert err', role: 'alert' }, h('strong', null, 'Algo salió mal. '), msg || 'No se pudo cargar esta sección.', retry ? h('div', { style: 'margin-top:8px' }, h('button', { class: 'btn btn-ghost btn-sm', onclick: retry }, 'Intentar de nuevo')) : null);

  // Guardado con confirmación y logros nuevos
  U.save = async function (quiet) {
    const fresh = L.S.checkAchievements();
    const ok = await L.S.flush();
    fresh.forEach((a) => L.toast(a.icon + ' ¡Logro desbloqueado: ' + a.t + '!', 'ok', 4200));
    if (!ok && !quiet) L.toast('No se pudo guardar tu progreso en este dispositivo. Revisa el espacio o los permisos del navegador.', 'err', 6000);
    return ok;
  };

  U.favBtn = function (kind, id, label) {
    const on0 = L.S.isFav(kind, id);
    const b = h('button', { type: 'button', class: 'fav' + (on0 ? ' on' : ''), 'aria-pressed': String(on0), 'aria-label': 'Favorito: ' + (label || id), title: 'Guardar en favoritos' }, on0 ? '★' : '☆');
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const on = L.S.toggleFav(kind, id);
      b.classList.toggle('on', on); b.textContent = on ? '★' : '☆'; b.setAttribute('aria-pressed', String(on));
      await U.save(true);
    });
    return b;
  };

  // Contenido de explicación: array de bloques
  U.blocks = function (blocks) {
    const box = h('div', { class: 'explain' });
    blocks.forEach((b) => {
      if (typeof b === 'string') box.appendChild(h('p', { html: b }));
      else if (b.t === 'table') box.appendChild(h('table', null, h('thead', null, h('tr', null, b.head.map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, b.rows.map((r) => h('tr', null, r.map((c) => h('td', { html: c })))))));
      else if (b.t === 'ex') box.appendChild(h('ul', { class: 'exlist' }, b.list.map((x) => h('li', null, L.Audio.btn(x.split(' — ')[0], { small: true, name: x }), h('span', null, x)))));
      else if (b.t === 'tip') box.appendChild(h('div', { class: 'tip' }, h('strong', null, '💡 '), b.text));
      else if (b.t === 'compare') box.appendChild(h('div', { class: 'grid g2' }, b.cols.map((c) => h('div', { class: 'card' }, h('h3', null, c.title), h('p', { html: c.text }), c.ex ? h('ul', { class: 'exlist' }, c.ex.map((x) => h('li', null, L.Audio.btn(x, { small: true, name: x }), x))) : null))));
    });
    return box;
  };

  // Tarjeta de palabra del diccionario. opts: {english, context, source, links}
  U.wordCard = function (e, opts) {
    opts = opts || {};
    const S = L.S;
    const card = h('article', { class: 'wcard', 'aria-label': 'Palabra: ' + e.w });
    card.appendChild(h('div', { class: 'row sb' },
      h('div', { class: 'w' }, h('span', { lang: 'es' }, e.w), L.Audio.btn(e.w, { small: true, name: e.w }), L.Audio.btn(e.w, { small: true, slow: true, name: e.w })),
      S.prog ? U.favBtn('words', e.id, e.w) : null));
    card.appendChild(h('div', { class: 'row' }, h('span', { class: 'pos' }, e.pos), h('span', { class: 'chip-tag' }, e.level), h('span', { class: 'chip-tag gray' }, e.topic)));
    e.senses.forEach((s, i) => {
      const sd = h('div', { class: 'sense' });
      if (e.senses.length > 1) sd.appendChild(h('div', { class: 'pos' }, 'Sentido ' + (i + 1) + (s.pos && s.pos !== e.pos ? ' · ' + s.pos : '')));
      sd.appendChild(h('p', { style: 'margin:.2em 0 .5em' }, h('b', null, 'Significado: '), s.def));
      sd.appendChild(h('div', { class: 'ex' }, h('span', null, s.ex + ' '), L.Audio.btn(s.ex, { small: true, name: s.ex })));
      if (opts.english) {
        const gl = L.C.glossFor(e, i);
        if (gl) sd.appendChild(h('div', { class: 'en', lang: 'en' }, h('b', null, 'Meaning in English'), gl));
        sd.appendChild(h('div', { class: 'en', lang: 'en' }, h('b', null, 'Example in English'), s.en));
      }
      card.appendChild(sd);
    });
    if (e.syn && e.syn.length) card.appendChild(h('div', null, h('b', null, 'Sinónimos: '), e.syn.join(', ')));
    if (e.note) card.appendChild(h('div', { class: 'muted' }, e.note));
    if (opts.context) card.appendChild(h('div', { class: 'tip' }, h('b', null, 'En tu texto: '), '«' + opts.context + '»'));
    if (e.lessons && e.lessons.length && opts.links !== false) {
      card.appendChild(h('div', null, h('b', null, 'Lecciones: '), e.lessons.map((id, i) => { const les = L.C.lessons[id]; return [i ? ' · ' : '', h('a', { href: '#/leccion/' + id }, les.level + ' · ' + les.title)]; })));
    }
    const acts = h('div', { class: 'acts' });
    if (S.prog) {
      const inBook = () => !!S.word(e.id);
      const add = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, inBook() ? '✓ En tu Wordbook' : '＋ Añadir al Wordbook');
      add.addEventListener('click', async () => {
        if (inBook()) { L.toast('Esta palabra ya está en tu Wordbook.', '', 1800); return; }
        const w = S.addWord(e.id, opts.source || 'traductor', true);
        if (opts.context) w.ctx = opts.context;
        S.markWord(e.id);
        add.textContent = '✓ En tu Wordbook';
        await U.save(); L.toast('Palabra añadida al Wordbook.', 'ok', 1800);
      });
      acts.appendChild(add);
    }
    acts.appendChild(h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: async () => {
      const txt = e.w + ' — ' + e.senses[0].def + ' Ejemplo: ' + e.senses[0].ex;
      try { await navigator.clipboard.writeText(txt); L.toast('Copiado.', 'ok', 1500); } catch (err) { L.toast('No se pudo copiar en este navegador.', 'err'); }
    } }, 'Copiar'));
    card.appendChild(acts);
    return card;
  };

  // Abre la tarjeta de una palabra (con contexto) desde un texto
  U.openWord = function (word, context) {
    if (!L.dict.built) L.dict.build();
    const r = L.dict.lookup(word.replace(/[.,;:!?¿¡«»"()]/g, ''));
    const e = r.entries[0];
    if (!e) { L.toast('Esa palabra todavía no está en el diccionario de la plataforma.', '', 2800); return; }
    L.modal({ title: 'Traductor', body: h('div', null, U.wordCard(e, { english: true, context, source: 'texto' })), actions: [{ label: 'Abrir en el Traductor', value: 'open' }, { label: 'Cerrar', value: null, primary: true }] }).then((v) => {
      if (v === 'open') location.hash = '#/traductor/' + encodeURIComponent(e.w) + (context ? '?ctx=' + encodeURIComponent(context) : '');
    });
  };
  // Texto con palabras tocables
  U.tapText = function (text, tag) {
    const p = h(tag || 'p', { class: 'tap-text', lang: 'es' });
    String(text).split(/(\s+)/).forEach((tok) => {
      if (!tok || /^\s+$/.test(tok)) return tok && p.appendChild(document.createTextNode(tok));
      const m = tok.match(/^([¿¡«"(]*)(.+?)([.,;:!?»")]*)$/);
      if (!m) return p.appendChild(document.createTextNode(tok));
      p.appendChild(document.createTextNode(m[1]));
      p.appendChild(h('button', { type: 'button', class: 'tap-word', onclick: () => U.openWord(m[2], text) }, m[2]));
      p.appendChild(document.createTextNode(m[3]));
    });
    return p;
  };
  U.audioLine = (text, o) => h('div', { class: 'row' }, L.Audio.btn(text, Object.assign({ small: true, name: text }, o || {})), h('span', null, text));
  U.pageHead = (title, sub, crumbs) => h('div', { style: 'margin-bottom:16px' },
    crumbs ? h('nav', { class: 'crumbs', 'aria-label': 'Ruta' }, crumbs.map((c, i) => [i ? ' › ' : '', c.href ? h('a', { href: c.href }, c.t) : c.t])) : null,
    h('h1', { tabindex: '-1', id: 'page-title' }, title), sub ? h('p', { class: 'muted' }, sub) : null);
  U.levelStatusChip = (st) => h('span', { class: 'chip-tag ' + (st === 'completado' ? 'green' : st === 'bloqueado' ? 'gray' : '') }, { completado: '✓ Completado', 'en curso': 'En curso', disponible: 'Disponible', bloqueado: '🔒 Bloqueado' }[st]);
  // Pista de 30 niveles: hecho / actual / abierto / bloqueado
  U.stageTrack = function () {
    const S = L.S, cur = S.currentStage(), start = S.startStage();
    return L.h('div', { class: 'stages', role: 'list', 'aria-label': 'Ruta de 30 niveles' }, L.stages().map((st) => {
      const done = S.stageDone(st.n), isCur = st.n === cur;
      const st2 = done ? 'done' : isCur ? 'cur' : st.n < start ? 'skip' : st.n > cur ? 'lock' : 'open';
      return L.h('a', { class: 'stg ' + st2, role: 'listitem', href: '#/aprender/' + st.level, 'aria-label': 'Nivel ' + st.n + ' (' + st.level + ')' + (done ? ', completado' : isCur ? ', actual' : ''), title: 'Nivel ' + st.n + ' · ' + st.level },
        L.h('b', null, st.n), L.h('small', null, st.level));
    }));
  };
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U;

  function continueCard() {
    const st = S.stats();
    const nxt = S.nextLesson();
    if (!st.lessons && !S.prog.lastLesson && !S.prog.placement) {
      return h('section', { class: 'hero' },
        h('img', { src: 'logo.png', alt: 'Languway Spanish', class: 'hero-logo', width: 220, height: 186 }),
        h('h1', null, 'Aprende español en español'),
        h('p', { style: 'font-size:1.1rem' }, 'Lecciones con audio, ejercicios corregidos, repaso espaciado y progreso guardado en tu dispositivo. Empieza con una prueba de nivel o directamente por el nivel A1.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn btn-primary', href: '#/prueba-de-nivel' }, 'Hacer la prueba de nivel'),
          h('a', { class: 'btn btn-ghost', href: nxt ? '#/leccion/' + nxt : '#/aprender' }, 'Empezar por A1')));
    }
    const lv = S.currentLevel(); const p = S.levelProgress(lv);
    const resume = S.prog.lastLesson && C.lessons[S.prog.lastLesson];
    const target = nxt || (resume ? S.prog.lastLesson : null);
    const les = target && C.lessons[target];
    return h('section', { class: 'hero' },
      h('div', { class: 'row sb' }, h('span', { class: 'chip-tag' }, 'Nivel ' + S.currentStage() + ' de 30 · ' + lv + ' ' + C.level(lv).name), S.streak() ? h('span', { class: 'chip-tag green' }, '🔥 ' + S.streak() + (S.streak() === 1 ? ' día seguido' : ' días seguidos')) : null),
      h('h1', null, 'Continuar aprendiendo'),
      les ? h('p', { style: 'font-size:1.1rem' }, S.lessonDone(target) ? 'Última lección: ' : 'Siguiente lección: ', h('strong', null, les.title), ' (' + les.level + ')') : h('p', null, 'Has completado todo el contenido disponible por ahora. Repasa tus palabras o practica tus errores.'),
      h('div', { class: 'row sb' }, h('span', null, p.done + ' de ' + p.total + ' lecciones completadas'), h('b', null, p.pct + ' %')),
      U.bar(p.pct),
      h('div', { class: 'row', style: 'margin-top:14px' },
        les ? h('a', { class: 'btn btn-primary', href: '#/leccion/' + target }, 'Continuar aprendiendo') : null,
        h('a', { class: 'btn btn-ghost', href: '#/aprender/' + lv }, 'Ver el nivel ' + lv),
        S.prog.placement ? null : h('a', { class: 'btn btn-ghost', href: '#/prueba-de-nivel' }, 'Prueba de nivel')));
  }

  function levelsSection() {
    const g = h('div', { class: 'grid g3' });
    C.levels.forEach((lv) => {
      const st = S.levelStatus(lv.id); const p = S.levelProgress(lv.id);
      g.appendChild(h('article', { class: 'card lvl' + (st === 'bloqueado' ? ' locked' : '') },
        h('div', { class: 'row sb' }, h('span', { class: 'code' }, lv.id), U.levelStatusChip(st)),
        h('h3', null, lv.name), h('p', { class: 'muted' }, lv.desc),
        h('div', { class: 'muted' }, lv.units.length + ' unidades · ' + p.done + '/' + p.total + ' lecciones'), U.bar(p.pct),
        h('a', { class: 'btn ' + (st === 'bloqueado' ? 'btn-ghost' : 'btn-primary'), href: '#/aprender/' + lv.id, 'aria-label': 'Abrir nivel ' + lv.id }, st === 'bloqueado' ? 'Ver nivel' : 'Abrir nivel')));
    });
    return g;
  }

  function quickPractice() {
    const due = S.dueWords().length;
    const items = [
      ['📝', 'Práctica de vocabulario', '#/practica/vocabulario', 'Elige o escribe la palabra correcta.'],
      ['🧩', 'Práctica de gramática', '#/practica/gramatica', 'Preguntas de las reglas que has estudiado.'],
      ['🎧', 'Comprensión auditiva', '#/escuchar', 'Escucha y responde.'],
      ['🔊', 'Pronunciación', '#/pronunciacion', 'Sonidos, sílabas y entonación.'],
      ['🧱', 'Construcción de frases', '#/frases', 'Ordena las palabras tocando.'],
      ['🔁', 'Repaso diario', '#/repaso', due ? due + (due === 1 ? ' palabra para repasar' : ' palabras para repasar') : 'Palabras que toca repasar hoy.'],
    ];
    return h('div', { class: 'grid g3' }, items.map((x) => h('a', { class: 'card', href: x[2], style: 'text-decoration:none;color:inherit' }, h('div', { style: 'font-size:1.8rem' }, x[0]), h('h3', null, x[1]), h('p', { class: 'muted', style: 'margin:0' }, x[3]))));
  }

  function statsSection() {
    const st = S.stats();
    if (!st.answered && !st.lessons && !st.words) return h('div', { class: 'empty' }, h('span', { class: 'big', 'aria-hidden': 'true' }, '📊'), h('p', null, 'Aquí verás tus estadísticas reales cuando empieces a estudiar. Todavía no hay actividad.'));
    const weak = S.weakSkills();
    const g = h('div', { class: 'grid g4' }, [
      ['Lecciones completadas', st.lessons], ['Palabras estudiadas', st.words], ['Palabras dominadas', st.mastered], ['Ejercicios respondidos', st.answered], ['Días de estudio', st.days], ['Palabras por repasar', st.due],
    ].map((x) => h('div', { class: 'card stat' }, h('b', null, x[1]), h('span', null, x[0]))));
    const wrap = h('div', null, g);
    wrap.appendChild(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Última actividad: ' + (st.last ? L.fmtDate(new Date(st.last + 'T12:00:00').getTime()) : '—')));
    if (weak.length) wrap.appendChild(h('div', { class: 'alert' }, h('strong', null, 'Habilidades para mejorar: '), weak.map((w) => w.s + ' (' + w.p + ' %)').join(', '), '. ', h('a', { href: '#/errores' }, 'Practicar mis errores')));
    return wrap;
  }

  route('/', () => {
    const root = h('div');
    root.appendChild(continueCard());
    if (S.prog && S.prog.placement && S.currentStage() <= 3 && !((S.prog.done['pre:steps'] || {}).best >= 75)) root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Primeros pasos · First steps'), h('p', null, 'Nuevo en español? New to Spanish? Learn the letters, the numbers and your first words in English, then take a short check.'), h('a', { class: 'btn btn-primary', href: '#/primeros-pasos' }, 'Empezar desde cero')));
    if (L.coach && S.prog && S.prog.placement) root.appendChild(L.coach.card(2));
    if (L.A.isGuest() && !L.memoryMode) root.appendChild(h('div', { class: 'alert', style: 'margin-top:16px' }, h('strong', null, 'Tu progreso se guarda en este dispositivo. '), 'Puedes estudiar sin cuenta. Para guardar tu progreso en línea y seguir en otro teléfono, ', h('a', { href: '#/cuenta/crear' }, 'crea una cuenta'), ' (solo nombre de usuario y contraseña).'));
    const backupWarn = backupReminder();
    if (backupWarn) root.appendChild(backupWarn);
    root.appendChild(h('h2', { style: 'margin-top:26px' }, 'Niveles'));
    root.appendChild(levelsSection());
    root.appendChild(h('h2', { style: 'margin-top:26px' }, 'Práctica rápida'));
    root.appendChild(quickPractice());
    root.appendChild(h('h2', { style: 'margin-top:26px' }, 'Tu actividad'));
    root.appendChild(statsSection());
    return root;
  }, 'Inicio');

  function backupReminder() {
    const st = S.stats();
    if (st.lessons < 2) return null;
    const last = S.prog.lastBackup;
    const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
    if (last && days < 14) return null;
    return h('div', { class: 'alert warn', style: 'margin-top:16px' }, h('strong', null, 'Copia de seguridad. '),
      last ? 'Tu última copia fue hace ' + days + ' días. ' : 'Todavía no has hecho ninguna copia. ',
      'Si borras los datos del navegador o desinstalas la app, perderás tu progreso. ', h('a', { href: '#/cuenta' }, 'Exportar mis datos'));
  }
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine;

  function levelCard(lv) {
    const st = S.levelStatus(lv.id); const p = S.levelProgress(lv.id); const locked = st === 'bloqueado';
    const ready = lv.units.filter((u) => C.unitReady(u)).length;
    return h('article', { class: 'card lvl' + (locked ? ' locked' : '') },
      h('div', { class: 'row sb' }, h('span', { class: 'code' }, lv.id), U.levelStatusChip(st)),
      h('h3', null, lv.name), h('p', { class: 'muted' }, lv.desc),
      h('div', null, h('b', null, 'Habilidades: '), h('ul', null, lv.skills.slice(0, 3).map((s) => h('li', null, s)))),
      U.bar(p.pct), h('div', { class: 'muted' }, p.done + ' de ' + p.total + ' lecciones · ' + lv.units.length + ' unidades' + (ready < lv.units.length ? ' · contenido listo en ' + ready + ' de ' + lv.units.length : '')),
      h('a', { class: 'btn ' + (locked ? 'btn-ghost' : 'btn-primary'), href: '#/aprender/' + lv.id, 'aria-label': (locked ? 'Ver nivel ' : 'Abrir nivel ') + lv.id }, locked ? 'Ver nivel' : st === 'completado' ? 'Repasar nivel' : 'Abrir nivel'));
  }
  L.levelCard = levelCard;

  route('/aprender', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Aprender', 'Elige tu nivel. Tu ruta avanza paso a paso del A1 al C2.'));
    if (false) root.appendChild(h('div', { class: 'alert' }, h('strong', null, '¿No sabes por dónde empezar? '), 'Haz la prueba de nivel para descubrirlo. ', h('a', { class: 'btn btn-primary btn-sm', href: '#/prueba-de-nivel' }, 'Hacer la prueba de nivel')));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Tu ruta de 30 niveles'), h('p', { class: 'muted' }, 'Estás en el nivel ' + S.currentStage() + ' de 30. Completa las lecciones y los exámenes para avanzar.'), U.stageTrack()));
    root.appendChild(h('div', { class: 'grid g3', style: 'margin-top:16px' }, C.levels.map(levelCard)));
    root.appendChild(h('p', { class: 'muted', style: 'margin-top:16px' }, 'Los niveles se están completando por etapas: ves la estructura completa, pero solo las lecciones con contenido terminado se pueden abrir.'));
    return root;
  }, 'Aprender');

  function lessonRow(ref) {
    const ready = !!C.lessons[ref.id]; const done = S.lessonDone(ref.id); const unlocked = ready && S.lessonUnlocked(ref.id);
    const rec = S.lessonRec(ref.id);
    const n = ref.id.split('.l')[1];
    const tag = !ready ? 'En preparación' : done ? '✓ ' + rec.best + ' %' : unlocked ? (S.prog.lastLesson === ref.id ? 'Continuar' : 'Empezar') : '🔒 Bloqueada';
    return h(unlocked ? 'a' : 'div', { class: 'lesson-row' + (done ? ' done' : '') + (unlocked ? '' : ' locked'), href: unlocked ? '#/leccion/' + ref.id : null, 'aria-disabled': unlocked ? null : 'true' },
      h('span', { class: 'n' }, done ? '✓' : n),
      h('span', { style: 'flex:1' }, h('strong', null, ref.title), ready ? h('div', { class: 'muted' }, C.lessons[ref.id].vocab.length + ' palabras · examen de ' + (C.lessons[ref.id].quiz.length + 2) + ' preguntas') : h('div', { class: 'muted' }, 'Contenido en preparación')),
      h('span', { class: 'chip-tag ' + (done ? 'green' : 'gray') }, tag));
  }

  route('/aprender/:lv', ({ params }) => {
    const lv = C.level(params.lv.toUpperCase());
    if (!lv) return U.empty('🧭', 'Ese nivel no existe.', h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Volver a Aprender'));
    const st = S.levelStatus(lv.id); const p = S.levelProgress(lv.id);
    const root = h('div');
    root.appendChild(U.pageHead('Nivel ' + lv.id + ' — ' + lv.name, lv.desc, [{ t: 'Aprender', href: '#/aprender' }, { t: lv.id }]));
    root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row sb' }, U.levelStatusChip(st), h('span', null, p.done + ' / ' + p.total + ' lecciones')), U.bar(p.pct), h('p', { class: 'muted', style: 'margin-top:10px' }, 'Habilidades: ' + lv.skills.join(' · '))));
    if (st === 'bloqueado') {
      const prev = C.levels[C.levelIdx(lv.id) - 1];
      root.appendChild(h('div', { class: 'alert warn', style: 'margin-top:14px' }, 'Este nivel todavía está bloqueado. Aprueba el examen final del nivel ' + prev.id + ' para abrirlo, o haz la prueba de nivel. Mientras tanto, puedes repasar las lecciones de niveles anteriores.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/prueba-de-nivel' }, 'Hacer la prueba de nivel'))));
          root.appendChild(h('div', { class: 'card', style: 'margin-top:14px' }, h('p', null, 'Las lecciones de este nivel se mostrarán cuando llegues a él. Ahora concéntrate en tu nivel actual: ' + (S.currentStage() ? 'nivel ' + S.currentStage() + ' de 30.' : '')), h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Volver a mi ruta')));
      return root;
    }
    if (S.levelValidated(lv.id)) root.appendChild(h('div', { class: 'alert ok', style: 'margin-top:14px' }, 'Tu prueba de nivel indica que ya dominas este nivel. Todas las lecciones están abiertas para repasar en el orden que quieras.'));
    const units = h('div', { class: 'units' });
    lv.units.forEach((un) => {
      const ready = C.unitReady(un); const udone = S.unitDone(lv.id, un.n);
      const card = h('section', { class: 'card' }, h('div', { class: 'row sb' }, h('h3', null, 'Unidad ' + un.n + ': ' + un.title), udone ? h('span', { class: 'chip-tag green' }, '✓ Unidad superada') : !ready ? h('span', { class: 'chip-tag gray' }, 'En preparación') : null));
      un.lessons.forEach((ref) => { const sn = L.stageOf(ref.id); card.appendChild(h('div', { class: 'muted stg-label' }, 'Nivel ' + sn + ' de 30')); card.appendChild(lessonRow(ref)); });
      if (ready) {
        const open = S.unitTestUnlocked(lv.id, un.n);
        const rec = S.prog.units[lv.id + '.' + un.n];
        card.appendChild(h(open ? 'a' : 'div', { class: 'lesson-row' + (udone ? ' done' : '') + (open ? '' : ' locked'), href: open ? '#/unidad/' + lv.id + '/' + un.n : null },
          h('span', { class: 'n' }, '★'), h('span', { style: 'flex:1' }, h('strong', null, 'Repaso y examen de la unidad'), h('div', { class: 'muted' }, 'Mínimo ' + S.PASS + ' % para pasar a la unidad siguiente')), h('span', { class: 'chip-tag ' + (udone ? 'green' : 'gray') }, udone ? '✓ ' + rec.best + ' %' : open ? 'Disponible' : '🔒')));
      }
      units.appendChild(card);
    });
    root.appendChild(units);
    const ok = S.levelTestUnlocked(lv.id); const ldone = S.levelDone(lv.id);
    const why = !C.levelReady(lv) ? 'Disponible cuando todas las unidades del nivel tengan contenido terminado.' : !ok ? 'Se abre al aprobar todas las unidades.' : 'Mide vocabulario, gramática, comprensión y escucha del nivel.';
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h3', null, 'Examen final del nivel ' + lv.id), h('p', { class: 'muted' }, why),
      ldone ? h('p', null, '✓ Aprobado con ' + S.prog.levelTests[lv.id].best + ' %. ', h('a', { href: '#/certificado/' + lv.id }, 'Ver certificado')) : null,
      ok ? h('a', { class: 'btn btn-primary', href: '#/examen/' + lv.id }, ldone ? 'Repetir examen' : 'Empezar el examen final') : h('button', { class: 'btn btn-ghost', disabled: true }, '🔒 Bloqueado')));
    return root;
  }, (p) => 'Nivel ' + p.lv.toUpperCase());

  // ---------- LECCIÓN ----------
  const STEPS = ['Objetivos', 'Vocabulario', 'Explicación', 'Escuchar', 'Práctica', 'Examen', 'Resultado'];
  function nextAfter(lessonId) {
    const info = C.unitOfLesson(lessonId);
    const i = info.unit.lessons.findIndex((l) => l.id === lessonId);
    if (i < info.unit.lessons.length - 1) { const nx = info.unit.lessons[i + 1].id; return C.lessons[nx] ? { kind: 'lesson', id: nx } : null; }
    return { kind: 'unit', lv: info.level.id, n: info.unit.n };
  }

  route('/leccion/:id', async ({ params }) => {
    const id = params.id; const les = C.lessons[id];
    if (!les) return U.empty('📘', 'Esta lección todavía está en preparación.', h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Volver a Aprender'));
    if (!S.lessonUnlocked(id)) return h('div', { class: 'alert warn' }, 'Esta lección está bloqueada. Completa primero la lección anterior (con al menos ' + S.PASS + ' % en su examen).', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/aprender/' + les.level }, 'Volver al nivel ' + les.level)));
    const root = h('div');
    const info = C.unitOfLesson(id);
    root.appendChild(U.pageHead(les.title, 'Nivel ' + les.level + ' · Unidad ' + info.unit.n + ': ' + info.unit.title, [{ t: 'Aprender', href: '#/aprender' }, { t: les.level, href: '#/aprender/' + les.level }, { t: les.title }]));
    const stepsEl = h('div', { class: 'steps', role: 'list', 'aria-label': 'Pasos de la lección' });
    const host = h('div', { 'aria-live': 'polite' });
    root.append(stepsEl, host);
    const resume = S.prog.resume && S.prog.resume.lesson === id ? S.prog.resume.step : 0;
    let cur = Math.min(resume, 4);
    let gen = 0; // invalida pasos antiguos si el usuario navega

    function drawSteps() {
      stepsEl.innerHTML = '';
      STEPS.forEach((s, i) => stepsEl.appendChild(h('span', { role: 'listitem', class: 'st' + (i === cur ? ' on' : i < cur ? ' done' : ''), 'aria-current': i === cur ? 'step' : null }, (i < cur ? '✓ ' : '') + s)));
    }
    async function go(i) {
      gen++; L.Audio.stop();
      cur = i; drawSteps(); host.innerHTML = '';
      if (i < 5) { S.prog.resume = { lesson: id, step: i, ts: Date.now() }; S.prog.lastLesson = id; S.markProg(); U.save(true); }
      await [sObj, sVocab, sExplain, sListen, sPractice, sQuiz][i]();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    const nav = (back, next, nextLabel) => h('div', { class: 'nav-actions' }, back != null ? h('button', { class: 'btn btn-ghost', onclick: () => go(back) }, '← Anterior') : h('span'), next != null ? h('button', { class: 'btn btn-primary', onclick: () => go(next) }, nextLabel || 'Siguiente →') : null);
    async function check(box, qs, title, label) {
      box.innerHTML = '';
      const res = await E.run(box, qs, { title, lessonId: id, onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: label || 'Continuar' });
      await U.save(true);
      return res;
    }

    function sObj() {
      host.appendChild(h('div', { class: 'card' }, h('h2', null, 'Objetivo de la lección'), h('p', { style: 'font-size:1.15rem' }, les.goal),
        h('ul', null, h('li', null, les.vocab.length + ' palabras nuevas con audio'), h('li', null, 'Explicación con ejemplos'), h('li', null, 'Práctica de escucha y ejercicios'), h('li', null, 'Examen final: mínimo ' + S.PASS + ' % para aprobar')),
        resume > 0 ? h('div', { class: 'alert' }, 'Estabas en el paso «' + STEPS[resume] + '». Puedes continuar desde ahí.') : null,
        h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: () => go(resume > 0 ? resume : 1) }, resume > 0 ? 'Continuar donde lo dejé' : 'Comenzar'), resume > 0 ? h('button', { class: 'btn btn-ghost', onclick: () => go(1) }, 'Empezar desde el principio') : null)));
    }
    function sVocab() {
      const grid = h('div', { class: 'vgrid' });
      les.vocab.forEach((v) => {
        const wid = C.wordId(v[0]);
        const card = h('article', { class: 'wcard', 'aria-label': 'Palabra: ' + v[0] },
          h('div', { class: 'row sb' }, h('div', { class: 'w' }, h('span', { lang: 'es' }, v[0]), L.Audio.btn(v[0], { small: true, name: v[0] })), U.favBtn('words', wid, v[0])),
          h('span', { class: 'pos' }, v[1]), h('p', { style: 'margin:.2em 0' }, v[2]),
          h('div', { class: 'ex' }, v[3], ' ', L.Audio.btn(v[3], { small: true, name: v[3] })));
        const add = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, S.word(wid) ? '✓ En repaso' : '＋ Añadir al repaso');
        add.addEventListener('click', async () => { if (!S.word(wid)) { S.addWord(wid, 'lección ' + id, true); add.textContent = '✓ En repaso'; await U.save(); } });
        card.appendChild(h('div', { class: 'acts' }, add));
        grid.appendChild(card);
      });
      const box = h('div', { style: 'margin-top:18px' });
      const head = h('div', null, h('h2', null, 'Vocabulario nuevo'), h('p', { class: 'muted' }, 'Toca 🔊 para escuchar. Cuando termines, comprueba lo que recuerdas.'));
      const chk = h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-ghost', onclick: () => go(0) }, '← Anterior'), h('button', { class: 'btn btn-primary', onclick: async () => {
        const g = gen; chk.remove(); grid.classList.add('hide'); head.classList.add('hide');
        await check(box, C.vocabQuestions(les, 2), 'Comprueba el vocabulario');
        if (g !== gen) return;
        box.innerHTML = ''; box.appendChild(h('div', { class: 'alert ok' }, '¡Muy bien! Sigue con la explicación.')); box.appendChild(nav(null, 2));
      } }, 'Comprobar lo aprendido →'));
      host.append(head, grid, box, chk);
    }
    function sExplain() {
      const box = h('div', { style: 'margin-top:14px' });
      const bar = h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-ghost', onclick: () => go(1) }, '← Anterior'), h('button', { class: 'btn btn-primary', onclick: async () => {
        const g = gen; bar.remove();
        await check(box, les.practice.slice(0, 2), 'Comprueba la explicación');
        if (g !== gen) return;
        box.innerHTML = ''; box.appendChild(h('div', { class: 'alert ok' }, '¡Muy bien! Pasa al siguiente paso.')); box.appendChild(nav(1, 3));
      } }, 'Comprobar lo aprendido →'));
      host.append(h('div', { class: 'card' }, h('h2', null, les.explain.title), U.blocks(les.explain.body)), ...[L.coach && L.coach.enHelp(id)].filter(Boolean), box, bar);
    }
    function sListen() {
      const list = h('ul', { class: 'exlist' });
      let shown = false; const texts = [];
      les.listen.forEach((s, i) => { const t = h('span', { class: 'hide' }, s); texts.push(t); list.appendChild(h('li', { 'data-i': i }, L.Audio.btn(s, { name: 'frase ' + (i + 1) }), L.Audio.btn(s, { slow: true, name: 'frase ' + (i + 1) }), h('span', { 'aria-hidden': 'true', class: 'muted' }, 'Frase ' + (i + 1)), t)); });
      const toggle = h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { shown = !shown; texts.forEach((t) => t.classList.toggle('hide', !shown)); toggle.textContent = shown ? 'Ocultar el texto' : 'Mostrar el texto'; } }, 'Mostrar el texto');
      let seq = null;
      const all = h('button', { class: 'btn btn-ghost btn-sm', onclick: () => {
        if (seq) { seq.stop(); seq = null; all.textContent = '▶ Escuchar todo'; return; }
        all.textContent = '⏹ Detener';
        seq = L.Audio.sequence(les.listen, { onLine: (i) => { Array.from(list.children).forEach((li, k) => (li.style.outline = k === i ? '3px solid var(--yellow-d)' : '')); }, onEnd: () => { seq = null; all.textContent = '▶ Escuchar todo'; }, onError: (e) => L.toast(e.message, 'err', 5000) });
      } }, '▶ Escuchar todo');
      const box = h('div', { style: 'margin-top:14px' });
      const bar = h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-ghost', onclick: () => go(2) }, '← Anterior'), h('button', { class: 'btn btn-primary', onclick: async () => {
        const g = gen; bar.remove(); L.Audio.stop();
        await check(box, C.listenQuestions(les, 2), 'Comprueba lo que oyes');
        if (g !== gen) return;
        S.count('listens'); await U.save(true);
        box.innerHTML = ''; box.appendChild(h('div', { class: 'alert ok' }, '¡Buen oído! Sigue con la práctica.')); box.appendChild(nav(2, 4));
      } }, 'Comprobar lo que oí →'));
      host.append(h('div', { class: 'card' }, h('h2', null, 'Escucha'), h('p', null, 'Escucha cada frase varias veces. Intenta entenderla antes de mostrar el texto.'), h('div', { class: 'row' }, all, toggle), list), box, bar);
    }
    async function sPractice() {
      const g = gen;
      host.appendChild(h('h2', null, 'Práctica'));
      const box = h('div'); host.appendChild(box);
      await check(box, les.practice.slice(2).concat(C.vocabQuestions(les, 2)), 'Práctica', 'Ir al examen');
      if (g !== gen) return;
      box.innerHTML = ''; box.appendChild(h('div', { class: 'alert ok' }, '¡Excelente práctica! Ahora el examen final de la lección.')); box.appendChild(nav(3, 5, 'Empezar el examen →'));
    }
    async function sQuiz() {
      const g = gen;
      cur = 5; drawSteps();
      const run = async (qs, title) => { host.innerHTML = ''; const box = h('div'); host.appendChild(box); return E.run(box, qs, { title, lessonId: les.id, strictAccents: les.level > 'A2', onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' }); };
      const res = await run(les.quiz.concat(C.vocabQuestions(les, 2)), 'Examen');
      if (g !== gen) return;
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      cur = 6; drawSteps();
      const passed = S.finishLesson(id, pct, res);
      const saved = await U.save();
      host.innerHTML = '';
      const sm = E.summary(res, { pass: S.PASS, headline: passed ? '¡Lección superada!' : 'Casi lo tienes' });
      host.appendChild(h('div', { class: 'card' }, passed ? h('div', { class: 'celebrate center', 'aria-hidden': 'true' }, '🎉') : null, sm.el, saved ? h('p', { class: 'center muted' }, '✓ Resultado guardado en este dispositivo.') : null));
      const actions = h('div', { class: 'nav-actions' });
      if (sm.wrong.length) actions.appendChild(h('button', { class: 'btn btn-ghost', onclick: async () => { await run(sm.wrong.map((r) => r.q), 'Repaso de errores'); await U.save(true); go(6 === cur ? 5 : 5); } }, 'Repetir las preguntas incorrectas'));
      if (passed) {
        const nx = nextAfter(id);
        if (nx && nx.kind === 'lesson') actions.appendChild(h('a', { class: 'btn btn-primary', href: '#/leccion/' + nx.id }, 'Siguiente lección →'));
        else if (nx && nx.kind === 'unit') actions.appendChild(h('a', { class: 'btn btn-primary', href: '#/unidad/' + nx.lv + '/' + nx.n }, 'Repaso y examen de la unidad →'));
        actions.appendChild(h('a', { class: 'btn btn-ghost', href: '#/aprender/' + les.level }, 'Volver al nivel'));
      } else {
        actions.appendChild(h('button', { class: 'btn btn-primary', onclick: () => go(5) }, 'Intentar el examen de nuevo'));
        actions.appendChild(h('button', { class: 'btn btn-ghost', onclick: () => go(1) }, 'Repasar la lección'));
      }
      host.appendChild(actions);
    }
    go(cur);
    return root;
  }, 'Lección');

  // ---------- EXAMEN DE UNIDAD ----------
  function sampleBank(ids, n) {
    const pools = ids.map((id) => L.shuffle(C.lessonBank(id)));
    const out = []; let i = 0;
    while (out.length < n && pools.some((p) => p.length)) { const p = pools[i % pools.length]; if (p.length) out.push(p.pop()); i++; }
    return L.shuffle(out);
  }
  C.sampleBank = sampleBank;

  route('/unidad/:lv/:n', async ({ params }) => {
    const lv = C.level(params.lv); const un = lv && lv.units.find((u) => u.n === +params.n);
    if (!un || !C.unitReady(un)) return U.empty('📘', 'Este examen todavía está en preparación.', h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Volver'));
    if (!S.unitTestUnlocked(lv.id, un.n)) return h('div', { class: 'alert warn' }, 'El examen de la unidad se abre cuando apruebas todas sus lecciones.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/aprender/' + lv.id }, 'Volver al nivel')));
    const ids = un.lessons.map((l) => l.id);
    const root = h('div');
    root.appendChild(U.pageHead('Repaso y examen · Unidad ' + un.n + ': ' + un.title, 'Nivel ' + lv.id, [{ t: 'Aprender', href: '#/aprender' }, { t: lv.id, href: '#/aprender/' + lv.id }, { t: 'Unidad ' + un.n }]));
    const host = h('div'); root.appendChild(host);
    const rev = h('div', { class: 'card' }, h('h2', null, 'Repaso de la unidad'), h('p', null, 'Antes del examen, repasa las palabras y los temas de gramática de esta unidad.'));
    ids.forEach((id) => {
      const les = C.lessons[id];
      rev.appendChild(h('details', { style: 'margin:8px 0' }, h('summary', { style: 'cursor:pointer;font-weight:700' }, les.title + ' — ' + les.vocab.length + ' palabras'),
        h('div', { style: 'padding:8px 0' }, h('p', null, h('b', null, 'Tema: '), les.explain.title), h('ul', { class: 'exlist' }, les.vocab.map((v) => h('li', null, L.Audio.btn(v[0], { small: true, name: v[0] }), h('span', null, h('b', null, v[0]), ' — ' + v[2])))))));
    });
    async function start() {
      host.innerHTML = ''; const box = h('div'); host.appendChild(box);
      const res = await E.run(box, sampleBank(ids, 10), { title: 'Examen de unidad', onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      const passed = S.finishUnit(lv.id, un.n, pct, res);
      await U.save();
      host.innerHTML = '';
      const sm = E.summary(res, { pass: S.PASS, headline: passed ? '¡Unidad superada!' : 'Todavía no' });
      host.appendChild(h('div', { class: 'card' }, passed ? h('div', { class: 'celebrate center', 'aria-hidden': 'true' }, '🏆') : null, sm.el));
      const actions = h('div', { class: 'nav-actions' });
      if (passed) {
        const nu = lv.units.find((u) => u.n === un.n + 1);
        if (nu && C.unitReady(nu)) actions.appendChild(h('a', { class: 'btn btn-primary', href: '#/leccion/' + nu.lessons[0].id }, 'Empezar la unidad ' + nu.n + ' →'));
        else if (S.levelTestUnlocked(lv.id)) actions.appendChild(h('a', { class: 'btn btn-primary', href: '#/examen/' + lv.id }, 'Ir al examen final del nivel →'));
        actions.appendChild(h('a', { class: 'btn btn-ghost', href: '#/aprender/' + lv.id }, 'Volver al nivel'));
      } else {
        actions.appendChild(h('button', { class: 'btn btn-primary', onclick: start }, 'Intentarlo de nuevo'));
        actions.appendChild(h('a', { class: 'btn btn-ghost', href: '#/aprender/' + lv.id }, 'Repasar lecciones'));
      }
      host.appendChild(actions);
    }
    rev.appendChild(h('div', { class: 'nav-actions' }, h('a', { class: 'btn btn-ghost', href: '#/aprender/' + lv.id }, 'Volver'), h('button', { class: 'btn btn-primary', onclick: start }, 'Empezar el examen →')));
    host.appendChild(rev);
    return root;
  }, 'Examen de unidad');

  // ---------- EXAMEN FINAL DE NIVEL ----------
  route('/examen/:lv', async ({ params }) => {
    const lv = C.level(params.lv.toUpperCase());
    if (!lv || !S.levelTestUnlocked(lv.id)) return h('div', { class: 'alert warn' }, 'El examen final se abre cuando todas las unidades del nivel tienen contenido y las has aprobado.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/aprender' }, 'Volver')));
    const root = h('div'); root.appendChild(U.pageHead('Examen final · Nivel ' + lv.id, 'Vocabulario, gramática, lectura y escucha. Mínimo ' + S.PASS + ' %.', [{ t: 'Aprender', href: '#/aprender' }, { t: lv.id, href: '#/aprender/' + lv.id }, { t: 'Examen final' }]));
    const host = h('div'); root.appendChild(host);
    const ids = C.lessonList(lv.id).map((l) => l.id);
    async function start() {
      host.innerHTML = ''; const box = h('div'); host.appendChild(box);
      let qs = sampleBank(ids, 12);
      const reads = (C.reading || []).filter((r) => r.level === lv.id).slice(0, 1).flatMap((r) => r.q.slice(0, 2).map((q) => L.Q.prep(Object.assign({}, q, { t: 'read', ctx: r.text, s: 'lectura' }), 'read:' + r.id, lv.id)));
      qs = L.shuffle(qs.concat(reads));
      const res = await E.run(box, qs, { title: 'Examen final ' + lv.id, strictAccents: lv.id > 'A2', onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      const out = S.finishLevelTest(lv.id, pct, res);
      await U.save();
      host.innerHTML = '';
      const sm = E.summary(res, { pass: S.PASS, headline: out.passed ? '¡Felicidades! Nivel ' + lv.id + ' completado' : 'Todavía no' });
      host.appendChild(h('div', { class: 'card' }, out.passed ? h('div', { class: 'celebrate center', 'aria-hidden': 'true' }, '🎓') : null, sm.el));
      const actions = h('div', { class: 'nav-actions' });
      if (out.passed) {
        actions.appendChild(h('a', { class: 'btn btn-primary', href: '#/certificado/' + lv.id }, 'Ver mi certificado'));
        const nxt = C.levels[C.levelIdx(lv.id) + 1];
        if (nxt) actions.appendChild(h('a', { class: 'btn btn-ghost', href: '#/aprender/' + nxt.id }, 'Ir al nivel ' + nxt.id + ' →'));
      } else actions.appendChild(h('button', { class: 'btn btn-primary', onclick: start }, 'Intentarlo de nuevo'));
      host.appendChild(actions);
    }
    host.appendChild(h('div', { class: 'card' }, h('h2', null, 'Antes de empezar'), h('p', null, 'El examen mezcla preguntas de todo el nivel. Si no llegas al ' + S.PASS + ' %, podrás repetirlo; tu progreso anterior no se borra.'), h('button', { class: 'btn btn-primary', onclick: start }, 'Empezar el examen')));
    return root;
  }, 'Examen final');

  // ---------- CERTIFICADO ----------

})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine, D = L.dict;
  const ART = /^(el|la|los|las|un|una)\s+/i;
  const bare = (w) => w.replace(ART, '');

  // ----- banco global de preguntas por id (para repasar errores) -----
  C.questionIndex = function () {
    const m = new Map();
    const add = (q) => { if (q && q.id) m.set(q.id, q); };
    Object.values(C.lessons).forEach((les) => les.practice.concat(les.quiz).forEach(add));
    (C.grammar || []).forEach((g) => (g.exercises || []).concat(g.quiz || []).forEach((q) => add(L.Q.prep(q, 'gram:' + g.id, g.level))));
    (C.pron || []).forEach((p) => (p.quiz || []).forEach((q) => add(L.Q.prep(q, 'pron:' + p.id, 'A1'))));
    return m;
  };

  // ----- preguntas sobre palabras -----
  function wordQuestion(e, kind) {
    const s = e.senses[0]; const wid = e.id;
    const pool = D.entries.filter((x) => x !== e && x.pos === e.pos);
    const alt = (pool.length >= 3 ? pool : D.entries.filter((x) => x !== e));
    const wrongs = L.sample(alt, 3).map((x) => x.w);
    let q;
    const w0 = bare(e.w);
    const ctxOk = s.ex && new RegExp('(^|[^a-záéíóúüñ])' + w0.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-záéíóúüñ]|$)', 'i').test(s.ex);
    if (kind === 'ctx' && ctxOk) {
      q = L.Q.fill(s.ex.replace(new RegExp(w0.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___'), [w0], 'La palabra era «' + w0 + '»: ' + s.def, { s: 'vocabulario', tag: 'vocab:' + e.id, hint: s.def.length < 80 ? s.def : null });
    } else if (kind === 'fill') {
      q = L.Q.fill('Escribe la palabra que corresponde: «' + s.def + '»', [e.w, w0], 'La palabra era «' + e.w + '».', { s: 'vocabulario', tag: 'vocab:' + e.id, hint: 'empieza por «' + w0[0] + '»' });
    } else {
      q = L.Q.mc('¿Qué palabra corresponde a esta definición? «' + s.def + '»', e.w, wrongs, 'La palabra «' + e.w + '» significa: ' + s.def, { s: 'vocabulario', tag: 'vocab:' + e.id });
    }
    q.wid = wid;
    q.id = 'wq' + L.hash(kind + '|' + wid + '|' + (q.q || ''));
    return L.Q.prep(q, 'vocab:' + e.id, e.level);
  }
  C.wordQuestion = wordQuestion;
  function questionForWord(w, e) {
    const box = w ? w.box : 0;
    const kinds = box <= 1 ? ['mc'] : box <= 3 ? ['ctx', 'mc', 'fill'] : ['fill', 'ctx'];
    return wordQuestion(e, L.shuffle(kinds)[0]);
  }

  // ---------- Wordbook ----------
  const TOPICS = ['Familia', 'Comida', 'Viajes', 'Trabajo', 'Educación', 'Salud', 'Tecnología', 'Naturaleza', 'Vida cotidiana', 'Emociones', 'Conversación', 'Expresiones'];
  function statusLabel(w) { const m = S.mastery(w); return { nueva: 'Nueva', aprendiendo: 'Aprendiendo', repasando: 'Repasando', dominada: 'Dominada' }[m]; }

  route('/vocabulario', ({ q }) => {
    const root = h('div');
    root.appendChild(U.pageHead('Vocabulario', 'Tu Wordbook: palabras de las lecciones y del diccionario, con audio y repaso.'));
    const mine = Array.from(S.words.values());
    const due = S.dueWords().length;
    root.appendChild(h('div', { class: 'grid g4' }, [['Mis palabras', mine.length], ['Para repasar hoy', due], ['Dominadas', mine.filter((w) => S.mastery(w) === 'dominada').length], ['En el diccionario', D.entries.length]].map((x) => h('div', { class: 'card stat' }, h('b', null, x[1]), h('span', null, x[0])))));
    root.appendChild(h('div', { class: 'row', style: 'margin:16px 0' },
      h('a', { class: 'btn btn-primary', href: '#/repaso' }, due ? 'Repaso diario (' + due + ')' : 'Repaso diario'),
      h('a', { class: 'btn btn-ghost', href: '#/vocabulario/tarjetas' }, 'Tarjetas de estudio'),
      h('a', { class: 'btn btn-ghost', href: '#/practica/vocabulario' }, 'Práctica de vocabulario'),
      h('a', { class: 'btn btn-ghost', href: '#/traductor' }, 'Traductor')));

    const state = { tab: q.tab || (mine.length ? 'mias' : 'todas'), level: '', topic: '', status: '', text: '' };
    const filters = h('div', { class: 'card' });
    const tabs = h('div', { class: 'tabs', role: 'group', 'aria-label': 'Ver' }, [['mias', 'Mis palabras'], ['todas', 'Todas las palabras'], ['fav', 'Favoritas']].map(([k, t]) => h('button', { type: 'button', class: 'tab', 'aria-pressed': String(state.tab === k), onclick: (e) => { state.tab = k; Array.from(tabs.children).forEach((b) => b.setAttribute('aria-pressed', String(b === e.target))); draw(); } }, t)));
    const sel = (label, key, opts) => { const s = h('select', { 'aria-label': label, class: 'inp', onchange: (e) => { state[key] = e.target.value; draw(); } }, h('option', { value: '' }, label + ': todos'), opts.map((o) => h('option', { value: o[0] }, o[1]))); return s; };
    const search = h('input', { class: 'inp', type: 'search', 'aria-label': 'Buscar palabra', placeholder: 'Buscar palabra o significado…', oninput: L.debounce((e) => { state.text = e.target.value; draw(); }, 180) });
    filters.append(tabs, h('div', { class: 'grid g4' }, search, sel('Nivel', 'level', C.levels.map((l) => [l.id, l.id])), sel('Tema', 'topic', TOPICS.concat(['Ciudad', 'Tiempo', 'Compras', 'Verbos']).map((t) => [t, t])), sel('Estado', 'status', [['nueva', 'Nueva'], ['aprendiendo', 'Aprendiendo'], ['repasando', 'Repasando'], ['dominada', 'Dominada']])));
    root.appendChild(filters);
    const list = h('div', { class: 'vgrid', style: 'margin-top:16px', 'aria-live': 'polite' }); const count = h('p', { class: 'muted', style: 'margin-top:12px' });
    root.append(count, list);
    let shownN = 0;
    function draw(more) {
      const nx = L.norm(state.text);
      let items = D.entries.filter((e) => {
        const w = S.word(e.id);
        if (state.tab === 'mias' && !w) return false;
        if (state.tab === 'fav' && !S.isFav('words', e.id)) return false;
        if (state.level && e.level !== state.level) return false;
        if (state.topic && e.topic !== state.topic) return false;
        if (state.status && S.mastery(w) !== state.status) return false;
        if (nx && !(L.stripAcc(L.norm(e.w)).includes(L.stripAcc(nx)) || e.senses.some((s) => L.norm(s.def).includes(nx)))) return false;
        return true;
      });
      if (state.tab === 'mias') items.sort((a, b) => (S.word(b.id).added - S.word(a.id).added));
      count.textContent = items.length + (items.length === 1 ? ' palabra' : ' palabras');
      if (!more) { list.innerHTML = ''; shownN = 0; }
      if (!items.length) { list.innerHTML = ''; list.appendChild(U.empty('🔎', state.tab === 'mias' ? 'Todavía no tienes palabras guardadas. Completa una lección o añade palabras desde «Todas las palabras».' : state.tab === 'fav' ? 'Aún no has marcado ninguna palabra como favorita.' : 'No hay palabras con esos filtros. Prueba con otros.')); return; }
      items.slice(shownN, shownN + 24).forEach((e) => list.appendChild(wordTile(e)));
      shownN += 24;
      const old = root.querySelector('.more-btn'); old && old.remove();
      if (shownN < items.length) root.appendChild(h('div', { class: 'center more-btn', style: 'margin-top:14px' }, h('button', { class: 'btn btn-ghost', onclick: () => draw(true) }, 'Mostrar más (' + (items.length - shownN) + ')')));
    }
    draw();
    return root;
  }, 'Vocabulario');

  function wordTile(e) {
    const w = S.word(e.id);
    const card = U.wordCard(e, { english: true, source: 'wordbook', links: true });
    if (w) {
      const info = h('div', { class: 'row' }, h('span', { class: 'chip-tag ' + (S.mastery(w) === 'dominada' ? 'green' : '') }, statusLabel(w)), h('span', { class: 'muted' }, 'Añadida: ' + L.fmtDate(w.added) + ' · Repasos: ' + w.seen + ' · Próximo: ' + (w.due <= Date.now() ? 'hoy' : L.fmtDate(w.due))));
      card.insertBefore(info, card.children[2]);
    }
    return card;
  }

  // ---------- Tarjetas ----------
  route('/vocabulario/tarjetas', () => {
    const root = h('div'); root.appendChild(U.pageHead('Tarjetas de estudio', 'Mira la palabra, intenta recordarla y después descubre el significado.', [{ t: 'Vocabulario', href: '#/vocabulario' }, { t: 'Tarjetas' }]));
    let words = Array.from(S.words.values());
    if (!words.length) return U.empty('🃏', 'Aún no tienes palabras en tu Wordbook. Completa una lección para añadir las primeras.', h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Ir a Aprender'));
    words.sort((a, b) => a.due - b.due);
    const deck = L.shuffle(words.slice(0, 15).map((w) => w.id));
    root.appendChild(flashSession(deck, 'tarjetas'));
    return root;
  }, 'Tarjetas');

  function flashSession(ids, label) {
    const host = h('div'); let i = 0; const stat = { know: 0, practice: 0 };
    function card() {
      host.innerHTML = '';
      if (i >= ids.length) { host.appendChild(h('div', { class: 'card center' }, h('div', { class: 'celebrate', 'aria-hidden': 'true' }, '✅'), h('h2', null, 'Sesión terminada'), h('p', null, 'La conocías: ' + stat.know + ' · Necesitas practicarla: ' + stat.practice), h('p', { class: 'muted' }, 'Las palabras que marcaste para practicar volverán pronto en tu repaso.'), h('div', { class: 'row', style: 'justify-content:center' }, h('a', { class: 'btn btn-primary', href: '#/repaso' }, 'Ir al Repaso diario'), h('a', { class: 'btn btn-ghost', href: '#/vocabulario' }, 'Volver al Wordbook')))); return; }
      const e = D.get(ids[i]); if (!e) { i++; return card(); }
      let shown = false;
      const back = h('div', { class: 'hide' });
      e.senses.slice(0, 2).forEach((s) => back.appendChild(h('div', { class: 'sense' }, h('p', null, h('b', null, 'Significado: '), s.def), h('p', { class: 'ex' }, s.ex, ' ', L.Audio.btn(s.ex, { small: true, name: s.ex })), h('p', { class: 'en', lang: 'en' }, h('b', null, 'Example in English'), s.en))));
      const acts = h('div', { class: 'row', style: 'justify-content:center;margin-top:14px' });
      const reveal = h('button', { class: 'btn btn-primary', onclick: () => { shown = true; back.classList.remove('hide'); reveal.remove(); acts.append(h('button', { class: 'btn btn-ghost', onclick: () => answer(true) }, 'La conozco'), h('button', { class: 'btn btn-primary', onclick: () => answer(false) }, 'Necesito practicarla')); } }, 'Mostrar el significado');
      acts.appendChild(reveal);
      host.appendChild(h('div', { class: 'card flash' }, h('div', { class: 'muted' }, 'Tarjeta ' + (i + 1) + ' de ' + ids.length), h('div', { class: 'big', lang: 'es' }, e.w), h('div', { class: 'row', style: 'justify-content:center' }, L.Audio.btn(e.w, { name: e.w }), L.Audio.btn(e.w, { slow: true, name: e.w }), h('span', { class: 'pos' }, e.pos)), back, acts));
    }
    async function answer(ok) {
      const id = ids[i];
      S.reviewWord(id, ok, 'weak'); ok ? stat.know++ : stat.practice++;
      await U.save(true); i++; card();
    }
    card();
    return host;
  }

  // ---------- Repaso diario ----------
  async function runWordSession(host, words, title) {
    const qs = words.map((w) => { const e = D.get(w.id); return e ? questionForWord(w, e) : null; }).filter(Boolean);
    if (!qs.length) { host.appendChild(U.empty('🎉', 'No hay palabras para esta sesión.')); return; }
    host.innerHTML = '';
    const box = h('div'); host.appendChild(box);
    const res = await E.run(box, qs, { title, onAnswer: (q, r) => { S.reviewWord(q.wid, r.ok, 'strong'); S.recordAnswer(q, r.ok, r.assisted); }, finishLabel: 'Terminar' });
    await U.save();
    host.innerHTML = '';
    const sm = E.summary(res, { pass: 75, headline: 'Repaso completado' });
    host.appendChild(h('div', { class: 'card' }, sm.el, h('p', { class: 'center muted' }, 'Las palabras que fallaste volverán pronto; las que acertaste se espaciarán más.')));
    host.appendChild(h('div', { class: 'nav-actions' }, h('a', { class: 'btn btn-primary', href: '#/repaso' }, 'Ver mi repaso'), h('a', { class: 'btn btn-ghost', href: '#/' }, 'Inicio')));
  }

  route('/repaso', () => {
    const root = h('div'); root.appendChild(U.pageHead('Repaso diario', 'Las palabras que más necesitas repasar, ordenadas por dificultad.'));
    const due = S.dueWords();
    const host = h('div'); root.appendChild(host);
    if (!S.words.size) { host.appendChild(U.empty('📚', 'Todavía no tienes palabras para repasar. Completa una lección o añade palabras desde el Traductor.', h('div', { class: 'row', style: 'justify-content:center' }, h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Ir a Aprender'), h('a', { class: 'btn btn-ghost', href: '#/vocabulario' }, 'Ver el Wordbook')))); return root; }
    if (!due.length) {
      const next = Array.from(S.words.values()).sort((a, b) => a.due - b.due)[0];
      host.appendChild(h('div', { class: 'card center' }, h('div', { class: 'celebrate', 'aria-hidden': 'true' }, '🌟'), h('h2', null, 'No tienes repasos pendientes'), h('p', null, 'Vuelve más tarde: la próxima palabra toca ' + (next.due - Date.now() < 3600000 ? 'en menos de una hora' : L.fmtDateTime(next.due)) + '.'), h('div', { class: 'row', style: 'justify-content:center' }, h('a', { class: 'btn btn-ghost', href: '#/vocabulario/tarjetas' }, 'Estudiar con tarjetas'), h('a', { class: 'btn btn-ghost', href: '#/errores' }, 'Practicar mis errores'))));
      return root;
    }
    const pr = { alta: 0, media: 0, baja: 0 }; due.forEach((w) => pr[S.wordPriority(w)]++);
    host.appendChild(h('div', { class: 'card' }, h('h2', null, due.length + (due.length === 1 ? ' palabra para repasar' : ' palabras para repasar')),
      h('p', null, 'Prioridad alta: ' + pr.alta + ' · media: ' + pr.media + ' · baja: ' + pr.baja), h('p', { class: 'muted' }, 'Cada sesión usa hasta 10 palabras para no cansarte. Si aciertas, la palabra se espacia; si fallas, vuelve pronto.'),
      h('button', { class: 'btn btn-primary', onclick: () => runWordSession(host, due.slice(0, 10), 'Repaso') }, 'Empezar el repaso')));
    const lst = h('div', { class: 'card', style: 'margin-top:14px' }, h('h3', null, 'Lista de repaso'));
    due.slice(0, 30).forEach((w) => { const e = D.get(w.id); if (!e) return; lst.appendChild(h('div', { class: 'row sb', style: 'padding:8px 0;border-top:1px solid var(--line)' }, h('span', null, L.Audio.btn(e.w, { small: true, name: e.w }), ' ', h('b', null, e.w)), h('span', { class: 'chip-tag ' + (S.wordPriority(w) === 'alta' ? '' : 'gray') }, 'Prioridad ' + S.wordPriority(w)))); });
    root.appendChild(lst);
    return root;
  }, 'Repaso diario');

  // ---------- Práctica por errores ----------
  route('/errores', async () => {
    const root = h('div'); root.appendChild(U.pageHead('Práctica de errores', 'Ejercicios nuevos sobre las ideas en las que más te equivocas.'));
    const wrong = Array.from(S.qstats.values()).filter((r) => r.wrong > 0 && r.streak < 2).sort((a, b) => b.wrong - a.wrong);
    if (!wrong.length) { root.appendChild(U.empty('✨', 'No tienes errores pendientes. Cuando falles ejercicios, aparecerán aquí para practicar.', h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Seguir aprendiendo'))); return root; }
    const idx = C.questionIndex();
    const tags = S.weakTags(6);
    const card = h('div', { class: 'card' }, h('h2', null, 'Temas que necesitas reforzar'), h('ul', null, tags.map((t) => h('li', null, tagName(t)))), h('p', { class: 'muted' }, 'Se mezclan preguntas nuevas del mismo tema con las que fallaste, para no repetir siempre lo mismo.'));
    const host = h('div'); root.append(card, host);
    card.appendChild(h('button', { class: 'btn btn-primary', onclick: async () => {
      const failed = wrong.slice(0, 20).map((r) => idx.get(r.qid)).filter(Boolean);
      const failedIds = new Set(failed.map((q) => q.id));
      const fresh = [];
      tags.forEach((t) => { if (t.startsWith('vocab:')) { const e = D.get(t.slice(6)); if (e) fresh.push(wordQuestion(e, 'mc')); return; } idx.forEach((q) => { if (q.tag === t && !failedIds.has(q.id)) fresh.push(q); }); });
      const qs = L.shuffle(L.sample(fresh, 6).concat(L.sample(failed, 4))).slice(0, 10);
      if (!qs.length) { L.toast('Todavía no hay suficientes ejercicios para estos temas.', '', 3000); return; }
      host.innerHTML = ''; card.classList.add('hide');
      const box = h('div'); host.appendChild(box);
      const res = await E.run(box, qs, { title: 'Errores', onAnswer: (q, r) => { S.recordAnswer(q, r.ok, r.assisted); if (q.wid) S.reviewWord(q.wid, r.ok, 'strong'); }, finishLabel: 'Ver resultado' });
      await U.save();
      host.innerHTML = ''; const sm = E.summary(res, { pass: 75, headline: 'Práctica terminada' });
      host.append(h('div', { class: 'card' }, sm.el), h('div', { class: 'nav-actions' }, h('a', { class: 'btn btn-primary', href: '#/errores' }, 'Volver'), h('a', { class: 'btn btn-ghost', href: '#/' }, 'Inicio')));
    } }, 'Empezar la práctica'));
    return root;
  }, 'Práctica de errores');
  function tagName(t) {
    if (t.startsWith('vocab:')) { const e = D.get(t.slice(6)); return 'Vocabulario: ' + (e ? e.w : t); }
    if (t.startsWith('escucha:') || t.startsWith('dictado:')) return 'Comprensión auditiva y dictado';
    if (t.startsWith('gram:')) { const g = (C.grammar || []).find((x) => 'gram:' + x.id === t); return 'Gramática: ' + (g ? g.title : t.slice(5)); }
    if (t.startsWith('pron:')) return 'Pronunciación: ' + t.slice(5).replace(/-/g, ' ');
    return t.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  }
  C.tagName = tagName;

  // ---------- Práctica rápida ----------
  route('/practica', () => {
    const root = h('div'); root.appendChild(U.pageHead('Práctica', 'Elige un tipo de práctica. Todas cuentan para tu progreso.'));
    const items = [['📝', 'Vocabulario', '#/practica/vocabulario', 'Definiciones y frases con huecos.'], ['🧩', 'Gramática', '#/practica/gramatica', 'Ejercicios de las reglas que estudias.'], ['🎧', 'Comprensión auditiva', '#/escuchar', 'Escucha y responde.'], ['🔊', 'Pronunciación', '#/pronunciacion', 'Sonidos y sílabas.'], ['🧱', 'Construcción de frases', '#/frases', 'Ordena las palabras.'], ['🔁', 'Repaso diario', '#/repaso', 'Palabras que toca repasar.'], ['🎯', 'Práctica de errores', '#/errores', 'Refuerza lo que fallas.']];
    root.appendChild(h('div', { class: 'grid g3' }, items.map((x) => h('a', { class: 'card', href: x[2], style: 'text-decoration:none;color:inherit' }, h('div', { style: 'font-size:1.8rem' }, x[0]), h('h3', null, x[1]), h('p', { class: 'muted', style: 'margin:0' }, x[3])))));
    return root;
  }, 'Práctica');

  route('/practica/:kind', async ({ params }) => {
    const kind = params.kind;
    const root = h('div'); root.appendChild(U.pageHead(kind === 'vocabulario' ? 'Práctica de vocabulario' : 'Práctica de gramática', null, [{ t: 'Práctica', href: '#/practica' }, { t: kind }]));
    const host = h('div'); root.appendChild(host);
    let qs = [];
    if (kind === 'vocabulario') {
      let ws = Array.from(S.words.values()).map((w) => D.get(w.id)).filter(Boolean);
      if (ws.length < 8) ws = ws.concat(L.sample(D.entries.filter((e) => e.level === 'A1' && !ws.includes(e)), 10 - ws.length));
      qs = L.sample(ws, 10).map((e) => questionForWord(S.word(e.id), e));
    } else if (kind === 'gramatica') {
      const doneIds = Object.keys(S.prog.lessons).filter((id) => S.prog.lessons[id].done);
      let pool = [];
      (doneIds.length ? doneIds : C.lessonList('A1').map((l) => l.id).filter((id) => C.lessons[id])).forEach((id) => C.lessons[id] && pool.push(...C.lessons[id].practice.concat(C.lessons[id].quiz).filter((q) => q.s === 'gramática')));
      (C.grammar || []).filter((g) => S.levelUnlocked(g.level)).forEach((g) => pool.push(...(g.exercises || []).map((q) => L.Q.prep(q, 'gram:' + g.id, g.level))));
      qs = L.sample(pool, 10);
    } else return U.empty('🧭', 'Esa práctica no existe.', h('a', { class: 'btn btn-primary', href: '#/practica' }, 'Volver'));
    if (!qs.length) return U.empty('📘', 'Todavía no hay ejercicios disponibles.');
    const box = h('div'); host.appendChild(box);
    const res = await E.run(box, qs, { title: 'Práctica', onAnswer: (q, r) => { S.recordAnswer(q, r.ok, r.assisted); if (q.wid) S.reviewWord(q.wid, r.ok, 'strong'); }, finishLabel: 'Ver resultado' });
    await U.save();
    host.innerHTML = ''; const sm = E.summary(res, { pass: 75, headline: 'Práctica terminada' });
    host.append(h('div', { class: 'card' }, sm.el), h('div', { class: 'nav-actions' }, h('a', { class: 'btn btn-primary', href: '#/practica/' + kind }, 'Repetir con otros ejercicios'), h('a', { class: 'btn btn-ghost', href: '#/practica' }, 'Volver')));
    return root;
  }, 'Práctica');

  // ---------- Favoritos ----------
  route('/favoritos', () => {
    const root = h('div'); root.appendChild(U.pageHead('Favoritos', 'Palabras, frases, expresiones, historias y lecciones que has guardado.'));
    const f = S.prog.favorites; let any = false;
    const sec = (title, items, render) => { if (!items.length) return; any = true; root.appendChild(h('h2', { style: 'margin-top:20px' }, title)); root.appendChild(render(items)); };
    sec('Palabras', f.words.map((id) => D.get(id)).filter(Boolean), (arr) => h('div', { class: 'vgrid' }, arr.map((e) => U.wordCard(e, { english: true }))));
    sec('Lecciones', f.lessons.filter((id) => C.lessons[id]), (arr) => h('div', null, arr.map((id) => h('a', { class: 'lesson-row', href: '#/leccion/' + id }, h('span', { class: 'n' }, '★'), C.lessons[id].title + ' (' + C.lessons[id].level + ')'))));
    sec('Frases', f.sentences, (arr) => h('ul', { class: 'exlist' }, arr.map((s) => h('li', null, L.Audio.btn(s, { small: true, name: s }), h('span', null, s), U.favBtn('sentences', s, s)))));
    sec('Expresiones', f.expressions, (arr) => h('ul', { class: 'exlist' }, arr.map((s) => h('li', null, L.Audio.btn(s, { small: true, name: s }), h('span', null, s), U.favBtn('expressions', s, s)))));
    sec('Historias', f.stories.filter((id) => (C.stories || []).some((x) => x.id === id)), (arr) => h('div', null, arr.map((id) => { const st = C.stories.find((x) => x.id === id); return h('a', { class: 'lesson-row', href: '#/historias/' + id }, h('span', { class: 'n' }, '📕'), st.title); })));
    if (!any) root.appendChild(U.empty('⭐', 'Todavía no tienes favoritos. Toca la estrella ☆ en palabras, lecciones o historias para guardarlas aquí.'));
    return root;
  }, 'Favoritos');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine;

  function gstat(id) { return (S.prog.done['gram:' + id]) || null; }

  route('/gramatica', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Gramática', 'Reglas explicadas en español sencillo, con ejemplos, errores comunes y ejercicios. Los temas se abren con tu nivel.'));
    const search = h('input', { class: 'inp', type: 'search', 'aria-label': 'Buscar un tema de gramática', placeholder: 'Buscar un tema (p. ej. ser y estar)…' });
    root.appendChild(h('div', { class: 'card' }, search));
    const host = h('div'); root.appendChild(host);
    const fav = null;
    function draw() {
      host.innerHTML = '';
      const nx = L.stripAcc(L.norm(search.value));
      let any = false;
      C.levels.forEach((lv) => {
        const topics = C.grammar.filter((g) => g.level === lv.id && (!nx || L.stripAcc(L.norm(g.title + ' ' + g.summary)).includes(nx)));
        if (!topics.length) return; any = true;
        const open = S.levelUnlocked(lv.id);
        const sec = h('section', { style: 'margin-top:18px' }, h('h2', null, 'Nivel ' + lv.id + ' · ' + lv.name), open ? null : h('p', { class: 'muted' }, 'Se abre cuando desbloquees el nivel ' + lv.id + ' (aprobando el examen del nivel anterior o con la prueba de nivel).'));
        const grid = h('div', { class: 'grid g3' });
        topics.forEach((g) => { const st = gstat(g.id); grid.appendChild(h(open ? 'a' : 'div', { class: 'card' + (open ? '' : ' lvl locked'), href: open ? '#/gramatica/' + g.id : null, style: 'text-decoration:none;color:inherit', 'aria-disabled': open ? null : 'true' }, h('div', { class: 'row sb' }, h('h3', { style: 'margin:0' }, g.title), st ? h('span', { class: 'chip-tag green' }, '✓ ' + st.best + ' %') : open ? null : h('span', null, '🔒')), h('p', { class: 'muted', style: 'margin:.4em 0 0' }, g.summary))); });
        sec.appendChild(grid); host.appendChild(sec);
      });
      if (!any) host.appendChild(U.empty('🔎', 'No hay temas que coincidan con tu búsqueda.'));
    }
    search.addEventListener('input', L.debounce(draw, 150)); draw();
    return root;
  }, 'Gramática');

  route('/gramatica/:id', ({ params }) => {
    const g = C.grammar.find((x) => x.id === params.id);
    if (!g) return U.empty('📘', 'Ese tema de gramática no existe.', h('a', { class: 'btn btn-primary', href: '#/gramatica' }, 'Volver a Gramática'));
    if (!S.levelUnlocked(g.level)) return h('div', { class: 'alert warn' }, 'Este tema es del nivel ' + g.level + ' y todavía no está abierto. Primero completa los niveles anteriores.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/gramatica' }, 'Ver otros temas')));
    const root = h('div');
    root.appendChild(U.pageHead(g.title, 'Nivel ' + g.level, [{ t: 'Gramática', href: '#/gramatica' }, { t: g.title }]));
    const host = h('div'); root.appendChild(host);
    function study() {
      host.innerHTML = '';
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Explicación'), U.blocks(g.explain)));
      if (g.mistakes && g.mistakes.length) host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Errores comunes'), h('ul', { style: 'list-style:none;padding:0' }, g.mistakes.map((m) => h('li', { style: 'margin-bottom:12px' }, h('div', null, h('span', { class: 'chip-tag', style: 'background:var(--err-bg);color:var(--err);border-color:var(--err)' }, '✕ Incorrecto'), ' ', h('s', null, m[0])), h('div', null, h('span', { class: 'chip-tag green' }, '✓ Correcto'), ' ', h('b', null, m[1])), h('div', { class: 'muted' }, m[2]))))));
      const box = h('div');
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Practica'), h('p', null, 'Ejercicios cortos para comprobar que has entendido el tema.'), h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: () => run(g.exercises, 'Ejercicios', false) }, 'Empezar los ejercicios'), h('button', { class: 'btn btn-ghost', onclick: () => run(L.shuffle(g.quiz.concat(g.exercises.slice(0, 2))), 'Mini-examen', true) }, 'Mini-examen (' + (g.quiz.length + 2) + ' preguntas)')), gstat(g.id) ? h('p', { class: 'muted', style: 'margin-top:10px' }, 'Mejor resultado del mini-examen: ' + gstat(g.id).best + ' %') : null), box);
      host.appendChild(box);
      host._box = box;
    }
    async function run(qs, title, scored) {
      host.innerHTML = ''; const box = h('div'); host.appendChild(box);
      const res = await E.run(box, qs, { title: g.title + ' · ' + title, onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      if (scored) { const d = (S.prog.done['gram:' + g.id] = S.prog.done['gram:' + g.id] || { best: 0, attempts: 0 }); d.best = Math.max(d.best, pct); d.attempts++; d.last = Date.now(); S.markProg(); }
      S.addAttempt({ kind: 'grammar', ref: g.id, score: pct, total: res.length, wrong: res.filter((r) => !r.ok).map((r) => r.id) });
      await U.save();
      host.innerHTML = '';
      const sm = E.summary(res, { pass: S.PASS, headline: pct >= S.PASS ? '¡Tema dominado!' : 'Sigue practicando' });
      host.appendChild(h('div', { class: 'card' }, sm.el));
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: () => run(L.shuffle(g.exercises.concat(g.quiz)).slice(0, 6), 'Otra práctica', false) }, 'Practicar otra vez'), h('button', { class: 'btn btn-ghost', onclick: study }, 'Volver a la explicación'), h('a', { class: 'btn btn-ghost', href: '#/gramatica' }, 'Todos los temas')));
    }
    study();
    return root;
  }, (p) => 'Gramática');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine;

  const open = (lv) => S.levelUnlocked(lv);
  const lockedNote = (lv) => h('p', { class: 'muted' }, 'Se abre cuando desbloquees el nivel ' + lv + ' (aprobando el examen del nivel anterior o con la prueba de nivel).');
  const doneOf = (key) => S.prog.done[key] || null;

  // Lista por niveles con tarjetas
  function listByLevel(items, hrefBase, doneKey, extra) {
    const root = h('div');
    let any = false;
    C.levels.forEach((lv) => {
      const arr = items.filter((x) => x.level === lv.id);
      if (!arr.length) return; any = true;
      const ok = open(lv.id);
      const sec = h('section', { style: 'margin-top:18px' }, h('h2', null, 'Nivel ' + lv.id + ' · ' + lv.name), ok ? null : lockedNote(lv.id));
      const grid = h('div', { class: 'grid g3' });
      arr.forEach((x) => {
        const d = doneOf(doneKey(x));
        grid.appendChild(h(ok ? 'a' : 'div', { class: 'card' + (ok ? '' : ' lvl locked'), href: ok ? hrefBase + x.id : null, style: 'text-decoration:none;color:inherit', 'aria-disabled': ok ? null : 'true' },
          h('div', { class: 'row sb' }, h('h3', { style: 'margin:0' }, (x.emoji ? x.emoji + ' ' : '') + x.title), d && d.best != null ? h('span', { class: 'chip-tag green' }, '✓ ' + d.best + ' %') : d ? h('span', { class: 'chip-tag green' }, '✓') : ok ? null : h('span', null, '🔒')),
          extra ? h('p', { class: 'muted', style: 'margin:.4em 0 0' }, extra(x)) : null));
      });
      sec.appendChild(grid); root.appendChild(sec);
    });
    if (!any) root.appendChild(U.empty('📭', 'Todavía no hay actividades en esta sección.'));
    return root;
  }

  // Ejecuta una lista de preguntas, guarda el resultado y muestra el resumen
  async function runQuiz(host, qs, o) {
    host.innerHTML = ''; const box = h('div'); host.appendChild(box);
    const res = await E.run(box, qs, { title: o.title, strictAccents: !!o.strict, onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
    const pct = L.pct(res.filter((r) => r.ok).length, res.length);
    if (o.key) { const d = (S.prog.done[o.key] = S.prog.done[o.key] || { best: 0, attempts: 0 }); d.best = Math.max(d.best, pct); d.attempts++; d.last = Date.now(); }
    S.addAttempt({ kind: o.kind, ref: o.ref, score: pct, total: res.length, wrong: res.filter((r) => !r.ok).map((r) => r.id) });
    if (o.counter) S.count(o.counter);
    S.markProg(); await U.save();
    host.innerHTML = '';
    const sm = E.summary(res, { pass: S.PASS, headline: pct >= S.PASS ? o.good || '¡Bien hecho!' : o.bad || 'Sigue practicando' });
    host.appendChild(h('div', { class: 'card' }, sm.el));
    return { res, pct };
  }

  // ---------------- ESCUCHAR ----------------
  route('/escuchar', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Escuchar', 'Escucha frases y conversaciones cortas y responde. Puedes oír el audio despacio o mostrar el texto si no puedes escuchar.'));
    root.appendChild(h('div', { class: 'alert' }, h('strong', null, 'Sobre el audio: '), 'la voz la proporciona tu dispositivo. Si no hay una voz en español, verás un aviso y podrás configurarla en ', h('a', { href: '#/configuracion' }, 'Configuración'), '.'));
    root.appendChild(listByLevel(C.listening, '#/escuchar/', (x) => 'listen:' + x.id, (x) => x.intro));
    return root;
  }, 'Escuchar');

  route('/escuchar/:id', ({ params }) => {
    const a = C.listening.find((x) => x.id === params.id);
    if (!a) return U.empty('🎧', 'Esta actividad no existe.', h('a', { class: 'btn btn-primary', href: '#/escuchar' }, 'Volver a Escuchar'));
    if (!open(a.level)) return h('div', { class: 'alert warn' }, 'Esta actividad es del nivel ' + a.level + ' y todavía no está abierta.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/escuchar' }, 'Ver otras actividades')));
    const root = h('div'); root.appendChild(U.pageHead(a.title, a.intro, [{ t: 'Escuchar', href: '#/escuchar' }, { t: a.title }]));
    const host = h('div'); root.appendChild(host);
    function start() { host.innerHTML = ''; host.appendChild(h('section', { class: 'card' }, h('p', null, a.questions.length + ' preguntas. En cada una pulsa 🔊 para escuchar (o 🐢 para oír despacio) y elige la respuesta.'), h('button', { class: 'btn btn-primary', onclick: go }, 'Empezar'))); }
    async function go() {
      const r = await runQuiz(host, L.shuffle(a.questions.slice()), { title: a.title, kind: 'listen', ref: a.id, key: 'listen:' + a.id, counter: 'listens', good: '¡Buen oído!', bad: 'Escucha otra vez' });
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: go }, 'Repetir'), h('a', { class: 'btn btn-ghost', href: '#/escuchar' }, 'Más actividades')));
    }
    start();
    return root;
  }, 'Escuchar');

  // ---------------- LEER ----------------
  route('/leer', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Leer', 'Lee textos cortos. Toca cualquier palabra para ver su significado en el Traductor y responde las preguntas de comprensión.'));
    root.appendChild(listByLevel(C.reading, '#/leer/', (x) => 'read:' + x.id, (x) => x.text.split(' ').length + ' palabras'));
    return root;
  }, 'Leer');

  route('/leer/:id', ({ params }) => {
    const r = C.reading.find((x) => x.id === params.id);
    if (!r) return U.empty('📖', 'Este texto no existe.', h('a', { class: 'btn btn-primary', href: '#/leer' }, 'Volver a Leer'));
    if (!open(r.level)) return h('div', { class: 'alert warn' }, 'Este texto es del nivel ' + r.level + ' y todavía no está abierto.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/leer' }, 'Ver otros textos')));
    const root = h('div'); root.appendChild(U.pageHead(r.title, 'Nivel ' + r.level, [{ t: 'Leer', href: '#/leer' }, { t: r.title }]));
    const host = h('div'); root.appendChild(host);
    function view() {
      host.innerHTML = '';
      host.appendChild(h('section', { class: 'card' }, h('div', { class: 'row sb' }, h('h2', { style: 'margin:0' }, 'Texto'), h('div', { class: 'row' }, L.Audio.btn(r.text, { label: 'Escuchar el texto', name: r.title }), L.Audio.btn(r.text, { slow: true, label: 'Escuchar el texto despacio', name: r.title }))), U.tapText(r.text, 'p'), h('p', { class: 'muted' }, 'Toca una palabra para ver qué significa.')));
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Comprensión'), h('p', null, r.q.length + ' preguntas. Puedes volver a leer el texto cuando quieras.'), h('button', { class: 'btn btn-primary', onclick: go }, 'Empezar las preguntas')));
    }
    async function go() {
      host.innerHTML = '';
      const qs = r.q.map((q) => Object.assign({}, q, { t: 'read', ctx: r.text }));
      const res = await runQuiz(host, L.shuffle(qs), { title: r.title, kind: 'read', ref: r.id, key: 'read:' + r.id, counter: 'reads', good: '¡Buena comprensión!', bad: 'Vuelve a leer el texto' });
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: go }, 'Repetir'), h('button', { class: 'btn btn-ghost', onclick: view }, 'Volver al texto'), h('a', { class: 'btn btn-ghost', href: '#/leer' }, 'Más textos')));
    }
    view();
    return root;
  }, 'Leer');

  // ---------------- ESCRIBIR ----------------
  route('/escribir', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Escribir', 'Escribe con una consigna, comprueba los requisitos básicos y compara tu texto con un modelo.'));
    root.appendChild(h('div', { class: 'alert' }, h('strong', null, 'Cómo se revisa: '), 'la plataforma comprueba cosas objetivas (longitud, estructuras pedidas, mayúsculas y puntuación). No evalúa la calidad del texto ni lo corrige como un profesor; por eso tienes un modelo y una lista de autoevaluación.'));
    root.appendChild(listByLevel(C.writing, '#/escribir/', (x) => 'write:' + x.id, (x) => x.prompt));
    return root;
  }, 'Escribir');

  route('/escribir/:id', ({ params }) => {
    const w = C.writing.find((x) => x.id === params.id);
    if (!w) return U.empty('✍️', 'Esta actividad no existe.', h('a', { class: 'btn btn-primary', href: '#/escribir' }, 'Volver a Escribir'));
    if (!open(w.level)) return h('div', { class: 'alert warn' }, 'Esta actividad es del nivel ' + w.level + ' y todavía no está abierta.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/escribir' }, 'Ver otras actividades')));
    const key = 'write:' + w.id; const saved = doneOf(key) || {};
    const root = h('div'); root.appendChild(U.pageHead(w.title, 'Nivel ' + w.level, [{ t: 'Escribir', href: '#/escribir' }, { t: w.title }]));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Consigna'), h('p', null, w.prompt), h('p', { class: 'muted' }, 'Mínimo ' + w.min + ' palabras.')));
    const ta = h('textarea', { class: 'inp', rows: 8, lang: 'es', 'aria-label': 'Tu texto', spellcheck: 'true', placeholder: 'Escribe aquí tu texto…', style: 'width:100%' }, saved.text || '');
    const keys = h('div', { class: 'special-keys' }, ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'].map((c) => h('button', { type: 'button', class: 'key', 'aria-label': 'Insertar ' + c, onclick: () => { const s = ta.selectionStart || ta.value.length; ta.setRangeText(c, s, ta.selectionEnd || s, 'end'); ta.focus(); } }, c)));
    const count = h('span', { class: 'muted', role: 'status' });
    const out = h('div', { style: 'margin-top:14px' });
    const upd = () => { const n = (ta.value.trim().match(/\S+/g) || []).length; count.textContent = n + ' palabras'; return n; };
    ta.addEventListener('input', upd); upd();
    const draftSave = L.debounce(async () => { const d = (S.prog.done[key] = S.prog.done[key] || { attempts: 0 }); d.text = ta.value; d.draft = Date.now(); S.markProg(); await U.save(true); }, 900);
    ta.addEventListener('input', draftSave);
    async function check() {
      const text = ta.value.trim(); const n = upd();
      out.innerHTML = '';
      if (!text) { L.toast('Escribe tu texto primero.', '', 2200); ta.focus(); return; }
      const checks = [];
      checks.push({ ok: n >= w.min, label: 'Longitud: al menos ' + w.min + ' palabras (tienes ' + n + ')' });
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      checks.push({ ok: sentences.every((s) => /^[¿¡"«(]*[A-ZÁÉÍÓÚÑ0-9]/.test(s)), label: 'Cada frase empieza con mayúscula' });
      checks.push({ ok: /[.!?]["»)]?$/.test(text), label: 'El texto termina con un signo de puntuación' });
      if (/\?/.test(text)) checks.push({ ok: /¿[^?]*\?/.test(text), label: 'Las preguntas llevan los dos signos (¿ ... ?)' });
      w.need.forEach((r) => checks.push({ ok: r.re.test(text), label: r.label }));
      const okN = checks.filter((c) => c.ok).length;
      out.appendChild(h('section', { class: 'card' }, h('h2', null, 'Revisión automática'), h('p', { class: 'muted' }, okN + ' de ' + checks.length + ' comprobaciones superadas. Esta revisión es limitada: no corrige tu gramática.'),
        h('ul', { style: 'list-style:none;padding:0' }, checks.map((c) => h('li', { style: 'margin:6px 0' }, h('span', { class: 'chip-tag ' + (c.ok ? 'green' : ''), style: c.ok ? '' : 'background:var(--err-bg);color:var(--err)' }, c.ok ? '✓' : '✕'), ' ' + c.label)))));
      out.appendChild(h('section', { class: 'card' }, h('h2', null, 'Modelo para comparar'), U.tapText(w.model, 'p'), h('div', { class: 'row' }, L.Audio.btn(w.model, { label: 'Escuchar el modelo', name: 'modelo' })), h('p', { class: 'muted' }, 'No es la única respuesta correcta: compara estructuras y vocabulario, no palabra por palabra.')));
      const boxes = w.criteria.map((c, i) => h('label', { style: 'display:flex;gap:8px;align-items:flex-start;margin:6px 0' }, h('input', { type: 'checkbox', 'aria-label': c }), h('span', null, c)));
      const fin = h('button', { class: 'btn btn-primary', onclick: async () => {
        const d = (S.prog.done[key] = S.prog.done[key] || { attempts: 0 });
        const self = boxes.filter((b) => b.querySelector('input').checked).length;
        d.text = ta.value; d.attempts = (d.attempts || 0) + 1; d.last = Date.now(); d.checks = okN; d.checksTotal = checks.length; d.self = self; d.selfTotal = w.criteria.length; d.done = true;
        S.addAttempt({ kind: 'write', ref: w.id, score: L.pct(okN, checks.length), total: checks.length, wrong: [] });
        S.count('writes'); S.markProg(); await U.save(); L.toast('Actividad guardada.', 'ok'); fin.disabled = true; fin.textContent = '✓ Guardada';
      } }, 'Guardar la actividad');
      out.appendChild(h('section', { class: 'card' }, h('h2', null, 'Autoevaluación'), h('p', null, 'Marca lo que cumple tu texto:'), h('div', null, boxes), fin));
    }
    root.appendChild(h('section', { class: 'card' }, ta, keys, h('div', { class: 'row sb', style: 'margin-top:8px' }, count, h('button', { class: 'btn btn-primary', onclick: check }, 'Revisar mi texto')), saved.draft ? h('p', { class: 'muted' }, 'Tu borrador se guarda automáticamente en este dispositivo.') : null), out);
    return root;
  }, 'Escribir');

  // ---------------- CONSTRUCCIÓN DE FRASES ----------------
  route('/frases', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Construcción de frases', 'Toca las palabras para ordenarlas y formar una frase correcta. Cuidado: algunas palabras sobran.'));
    const host = h('div'); root.appendChild(host);
    function menu() {
      host.innerHTML = '';
      const grid = h('div', { class: 'grid g3' });
      C.levels.forEach((lv) => {
        const n = C.sentences.filter((s) => s.level === lv.id).length; if (!n) return;
        const ok = open(lv.id); const d = doneOf('frases:' + lv.id);
        grid.appendChild(h(ok ? 'button' : 'div', { class: 'card' + (ok ? '' : ' lvl locked'), type: ok ? 'button' : null, style: 'text-align:left;cursor:' + (ok ? 'pointer' : 'default'), onclick: ok ? () => start(lv.id) : null, 'aria-disabled': ok ? null : 'true' },
          h('div', { class: 'row sb' }, h('h3', { style: 'margin:0' }, 'Nivel ' + lv.id), d ? h('span', { class: 'chip-tag green' }, '✓ ' + d.best + ' %') : ok ? null : h('span', null, '🔒')),
          h('p', { class: 'muted', style: 'margin:.4em 0 0' }, n + ' frases · sesiones de 8')));
      });
      host.appendChild(grid);
    }
    async function start(lv) {
      const qs = L.shuffle(C.sentences.filter((s) => s.level === lv)).slice(0, 8);
      await runQuiz(host, qs, { title: 'Frases ' + lv, kind: 'sentences', ref: lv, key: 'frases:' + lv, counter: 'sentences', strict: lv > 'A2', good: '¡Frases bien construidas!', bad: 'Repasa el orden de las palabras' });
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: () => start(lv) }, 'Otra sesión'), h('button', { class: 'btn btn-ghost', onclick: menu }, 'Cambiar de nivel')));
    }
    menu();
    return root;
  }, 'Construcción de frases');

  // ---------------- CONVERSACIÓN ----------------
  route('/conversacion', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Conversación', 'Diálogos de la vida real. Escúchalos, léelos y practica con huecos, respuestas y frases para ordenar.'));
    root.appendChild(h('div', { class: 'alert' }, 'El audio usa una sola voz de tu dispositivo para ambos personajes. Cada línea indica quién habla.'));
    root.appendChild(listByLevel(C.dialogs, '#/conversacion/', (x) => 'dialog:' + x.id, (x) => x.who.join(' y ')));
    return root;
  }, 'Conversación');

  route('/conversacion/:id', ({ params }) => {
    const d = C.dialogs.find((x) => x.id === params.id);
    if (!d) return U.empty('💬', 'Esta conversación no existe.', h('a', { class: 'btn btn-primary', href: '#/conversacion' }, 'Volver a Conversación'));
    if (!open(d.level)) return h('div', { class: 'alert warn' }, 'Esta conversación es del nivel ' + d.level + ' y todavía no está abierta.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/conversacion' }, 'Ver otras')));
    const root = h('div'); root.appendChild(U.pageHead(d.title, 'Nivel ' + d.level + ' · ' + d.who.join(' y '), [{ t: 'Conversación', href: '#/conversacion' }, { t: d.title }]));
    const host = h('div'); root.appendChild(host);
    function view() {
      host.innerHTML = '';
      const rows = d.lines.map((ln, i) => h('div', { class: 'dline', 'data-i': i, style: 'display:flex;gap:10px;margin:8px 0;align-items:flex-start' },
        h('span', { class: 'chip-tag' + (ln.who ? ' gray' : ''), style: 'min-width:96px;text-align:center' }, d.who[ln.who]),
        h('div', { style: 'flex:1' }, U.tapText(ln.text, 'span')), L.Audio.btn(ln.text, { small: true, name: ln.text })));
      let seq = null; const all = h('button', { class: 'btn btn-ghost btn-sm' }, '▶ Escuchar toda la conversación');
      const mark = (i) => rows.forEach((r, k) => r.classList.toggle('now', k === i));
      all.addEventListener('click', () => {
        if (seq) { seq.stop(); seq = null; all.textContent = '▶ Escuchar toda la conversación'; mark(-1); return; }
        all.textContent = '⏹ Detener';
        seq = L.Audio.sequence(d.lines.map((l) => l.text), { onLine: mark, onEnd: () => { seq = null; all.textContent = '▶ Escuchar toda la conversación'; }, onError: (e) => L.toast(e.message, 'err', 5000) });
      });
      host.appendChild(h('section', { class: 'card' }, h('div', { class: 'row sb' }, h('h2', { style: 'margin:0' }, 'Conversación'), all), h('div', null, rows), h('p', { class: 'muted' }, 'Toca una palabra para ver su significado.')));
      if (d.alts && d.alts.length) host.appendChild(h('section', { class: 'card' }, h('h3', null, 'Otras formas de decirlo'), h('ul', null, d.alts.map((a) => h('li', null, L.Audio.btn(a, { small: true, name: a }), ' ', a)))));
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Practica'), h('p', null, 'Tres tipos de ejercicio con esta conversación: completar huecos, elegir la respuesta adecuada y ordenar frases.'), h('button', { class: 'btn btn-primary', onclick: practice }, 'Empezar la práctica')));
    }
    function buildQs() {
      const qs = [];
      (d.gaps || []).forEach(([i, word]) => {
        const ln = d.lines[i].text; const re = new RegExp('\\b' + word + '\\b', 'i');
        qs.push(L.Q.prep(L.Q.fill('Completa la frase de ' + d.who[d.lines[i].who] + ': «' + ln.replace(re, '_____') + '»', word, 'La palabra que falta es «' + word + '».', { s: 'vocabulario' }), 'dialog:' + d.id, d.level));
      });
      const idx = []; for (let i = 0; i < d.lines.length - 1; i += 2) idx.push(i);
      L.shuffle(idx).slice(0, 3).forEach((i) => {
        const right = d.lines[i + 1].text; const wrongs = L.shuffle(d.lines.filter((x, k) => k !== i + 1 && k % 2 === 1 && x.text !== right).map((x) => x.text)).slice(0, 3);
        if (wrongs.length < 2) return;
        qs.push(L.Q.prep(L.Q.mc(d.who[d.lines[i].who] + ' dice: «' + d.lines[i].text + '». ¿Qué responde ' + d.who[d.lines[i + 1].who] + '?', right, wrongs, 'La respuesta adecuada en la conversación es: «' + right + '».', { s: 'gramática' }), 'dialog:' + d.id, d.level));
      });
      L.shuffle(d.lines.map((l) => l.text).filter((t) => t.split(/\s+/).length >= 4 && t.split(/\s+/).length <= 9)).slice(0, 2).forEach((t) => qs.push(L.Q.prep(L.Q.order(t, 'Escucha de nuevo la conversación para ver el orden.', { s: 'gramática' }), 'dialog:' + d.id, d.level)));
      return qs;
    }
    async function practice() {
      await runQuiz(host, buildQs(), { title: d.title, kind: 'dialog', ref: d.id, key: 'dialog:' + d.id, counter: 'convos', strict: d.level > 'A2', good: '¡Buena conversación!', bad: 'Escucha la conversación otra vez' });
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: practice }, 'Practicar otra vez'), h('button', { class: 'btn btn-ghost', onclick: view }, 'Volver a la conversación'), h('a', { class: 'btn btn-ghost', href: '#/conversacion' }, 'Más conversaciones')));
    }
    view();
    return root;
  }, 'Conversación');

  // ---------------- HISTORIAS ----------------
  route('/historias', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Historias', 'Historias originales por niveles. Lee, escucha, toca las palabras que no conozcas y comprueba que has entendido.'));
    root.appendChild(listByLevel(C.stories, '#/historias/', (x) => 'story:' + x.id, (x) => x.paragraphs.join(' ').split(' ').length + ' palabras'));
    return root;
  }, 'Historias');

  route('/historias/:id', ({ params }) => {
    const st = C.stories.find((x) => x.id === params.id);
    if (!st) return U.empty('📕', 'Esta historia no existe.', h('a', { class: 'btn btn-primary', href: '#/historias' }, 'Volver a Historias'));
    if (!open(st.level)) return h('div', { class: 'alert warn' }, 'Esta historia es del nivel ' + st.level + ' y todavía no está abierta.', h('div', { style: 'margin-top:8px' }, h('a', { class: 'btn btn-primary btn-sm', href: '#/historias' }, 'Ver otras historias')));
    const root = h('div'); root.appendChild(U.pageHead((st.emoji || '') + ' ' + st.title, 'Nivel ' + st.level, [{ t: 'Historias', href: '#/historias' }, { t: st.title }]));
    const host = h('div'); root.appendChild(host);
    const fullText = st.paragraphs.join(' ');
    function view() {
      host.innerHTML = '';
      host.appendChild(h('section', { class: 'card' }, h('div', { class: 'row sb' }, h('div', { class: 'row' }, L.Audio.btn(fullText, { label: 'Escuchar la historia', name: st.title }), L.Audio.btn(fullText, { slow: true, label: 'Escuchar la historia despacio', name: st.title })), U.favBtn('stories', st.id, st.title)),
        st.paragraphs.map((p) => h('div', { style: 'margin:10px 0' }, U.tapText(p, 'p'))), h('p', { class: 'muted' }, 'Toca una palabra para ver su significado.')));
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Vocabulario de la historia'), h('ul', { style: 'list-style:none;padding:0' }, st.vocab.map(([w, def]) => h('li', { style: 'margin:8px 0' }, h('b', null, w), ' ', L.Audio.btn(w, { small: true, name: w }), h('div', { class: 'muted' }, def))))));
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Comprueba lo que entendiste'), h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: go }, 'Preguntas y expresiones'), h('button', { class: 'btn btn-ghost', onclick: events }, 'Ordenar los hechos'))));
    }
    async function go() {
      await runQuiz(host, L.shuffle(st.questions.concat(st.expr)), { title: st.title, kind: 'story', ref: st.id, key: 'story:' + st.id, counter: 'stories', good: '¡Historia entendida!', bad: 'Vuelve a leer la historia' });
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: go }, 'Repetir'), h('button', { class: 'btn btn-ghost', onclick: view }, 'Volver a la historia'), h('a', { class: 'btn btn-ghost', href: '#/historias' }, 'Más historias')));
    }
    function events() {
      host.innerHTML = '';
      let items = L.shuffle(st.order.slice()); if (items.join() === st.order.join() && items.length > 1) items.push(items.shift());
      const list = h('ol', { style: 'padding-left:1.2em' }); const msg = h('div', { role: 'status', 'aria-live': 'polite' });
      function draw() {
        list.innerHTML = '';
        items.forEach((t, i) => list.appendChild(h('li', { style: 'margin:8px 0' }, h('span', null, t), ' ',
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': 'Subir: ' + t, disabled: i === 0 ? '' : null, onclick: () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); } }, '↑'), ' ',
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': 'Bajar: ' + t, disabled: i === items.length - 1 ? '' : null, onclick: () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); } }, '↓'))));
      }
      draw();
      const chk = h('button', { class: 'btn btn-primary', onclick: async () => {
        const right = items.filter((t, i) => t === st.order[i]).length; const pct = L.pct(right, st.order.length);
        const d = (S.prog.done['story-order:' + st.id] = S.prog.done['story-order:' + st.id] || { best: 0, attempts: 0 }); d.best = Math.max(d.best, pct); d.attempts++; d.last = Date.now(); S.markProg(); await U.save(true);
        msg.innerHTML = ''; msg.appendChild(h('div', { class: 'alert ' + (pct === 100 ? 'ok' : 'warn') }, pct === 100 ? '¡Perfecto! Todos los hechos están en el orden correcto.' : right + ' de ' + st.order.length + ' hechos están en su lugar. Revisa la historia e inténtalo otra vez.'));
        if (pct < 100) msg.appendChild(h('p', { class: 'muted' }, 'Orden correcto: ' + st.order.map((t, i) => (i + 1) + '. ' + t).join(' ')));
      } }, 'Comprobar el orden');
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Ordena los hechos'), h('p', null, 'Usa las flechas para poner los hechos en el orden en que ocurren.'), list, h('div', { class: 'row' }, chk, h('button', { class: 'btn btn-ghost', onclick: view }, 'Volver a la historia')), msg));
    }
    view();
    return root;
  }, 'Historias');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine;

  const syl = (w) => w; // las palabras se muestran tal cual; la división silábica se explica en el tema

  function recorder(word) {
    const box = h('div', { class: 'card', style: 'margin-top:12px' }, h('h3', null, 'Grabar mi voz (opcional)'));
    if (!L.Audio.canRecord()) { box.appendChild(h('p', { class: 'muted' }, 'Este navegador no permite grabar audio. Puedes practicar repitiendo en voz alta después de escuchar.')); return box; }
    box.appendChild(h('p', { class: 'muted' }, 'Es un ejercicio de práctica personal: escuchas el modelo y luego tu grabación para compararlos. La plataforma no evalúa ni corrige tu pronunciación automáticamente. El micrófono solo se activa cuando pulsas «Grabar».'));
    let rec = null, url = null; const status = h('span', { role: 'status', class: 'muted' }); const player = h('audio', { controls: '', class: 'hide', style: 'width:100%;margin-top:8px', 'aria-label': 'Tu grabación' });
    const btn = h('button', { class: 'btn btn-primary', type: 'button' }, '🎙️ Grabar');
    btn.addEventListener('click', async () => {
      if (!rec) {
        try { rec = L.Audio.recorder(); await rec.start(); btn.textContent = '⏹ Detener'; status.textContent = 'Grabando…'; }
        catch (e) { rec = null; status.textContent = ''; L.toast(e && e.name === 'NotAllowedError' ? 'No diste permiso al micrófono. Puedes activarlo en los ajustes del navegador.' : 'No se pudo usar el micrófono.', 'err', 5000); }
      } else {
        const blob = await rec.stop(); rec = null; btn.textContent = '🎙️ Grabar otra vez'; status.textContent = '';
        if (!blob) { L.toast('No se pudo guardar la grabación.', 'err'); return; }
        if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); player.src = url; player.classList.remove('hide');
        S.count('pron'); U.save(true);
      }
    });
    box.append(h('div', { class: 'row' }, L.Audio.btn(word, { label: 'Escuchar el modelo', name: 'modelo' }), btn, status), player);
    return box;
  }

  route('/pronunciacion', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Pronunciación', 'Aprende cómo suena el español: vocales, consonantes, sílabas, acento y entonación.'));
    root.appendChild(h('div', { class: 'alert' }, h('strong', null, 'Sobre el audio: '), 'las voces las proporciona tu dispositivo (síntesis de voz). Si tu dispositivo no tiene una voz en español, verás un aviso y podrás elegir otra en ', h('a', { href: '#/configuracion' }, 'Configuración'), '. Ninguna variedad del español se considera más correcta que otra.'));
    root.appendChild(h('div', { class: 'grid g3' }, C.pron.map((p) => { const d = S.prog.done['pron:' + p.id]; return h('a', { class: 'card', href: '#/pronunciacion/' + p.id, style: 'text-decoration:none;color:inherit' }, h('div', { class: 'row sb' }, h('h3', { style: 'margin:0' }, p.title), d ? h('span', { class: 'chip-tag green' }, '✓ ' + d.best + ' %') : null), h('p', { class: 'muted', style: 'margin:.4em 0 0' }, p.summary)); })));
    return root;
  }, 'Pronunciación');

  route('/pronunciacion/:id', ({ params }) => {
    const p = C.pron.find((x) => x.id === params.id);
    if (!p) return U.empty('🔊', 'Ese tema no existe.', h('a', { class: 'btn btn-primary', href: '#/pronunciacion' }, 'Volver'));
    const root = h('div');
    root.appendChild(U.pageHead(p.title, p.summary, [{ t: 'Pronunciación', href: '#/pronunciacion' }, { t: p.title }]));
    const host = h('div'); root.appendChild(host);
    function study() {
      host.innerHTML = '';
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Explicación'), U.blocks(p.explain)));
      const lst = h('section', { class: 'card' }, h('h2', null, 'Escucha y repite'), h('p', { class: 'muted' }, 'Pulsa 🔊 para escuchar y 🐢 para oír despacio. Repite en voz alta.'));
      p.items.forEach(([label, words]) => lst.appendChild(h('div', { style: 'margin:10px 0' }, h('h3', null, label), h('div', { class: 'row' }, words.map((w) => h('span', { class: 'chip-tag', style: 'font-size:1rem;padding:6px 10px;display:inline-flex;gap:6px;align-items:center' }, w, L.Audio.btn(w, { small: true, name: w }), L.Audio.btn(w, { small: true, slow: true, name: w + ' despacio' })))))));
      let seq = null;
      const all = h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { if (seq) { seq.stop(); seq = null; all.textContent = '▶ Escuchar todo'; return; } all.textContent = '⏹ Detener'; seq = L.Audio.sequence(p.items.flatMap((x) => x[1]), { onEnd: () => { seq = null; all.textContent = '▶ Escuchar todo'; }, onError: (e) => L.toast(e.message, 'err', 5000) }); } }, '▶ Escuchar todo');
      lst.appendChild(all); host.appendChild(lst);
      if (p.pairs && p.pairs.length) host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Compara sonidos parecidos'), h('p', { class: 'muted' }, 'Escucha las dos palabras de cada pareja y fíjate en la diferencia.'), h('div', { class: 'grid g2' }, p.pairs.map((pr) => h('div', { class: 'card stat', style: 'box-shadow:none' }, h('div', { class: 'row', style: 'justify-content:center' }, h('div', null, h('b', { style: 'font-size:1.2rem' }, pr[0]), h('div', null, L.Audio.btn(pr[0], { small: true, name: pr[0] }))), h('span', null, '≠'), h('div', null, h('b', { style: 'font-size:1.2rem' }, pr[1]), h('div', null, L.Audio.btn(pr[1], { small: true, name: pr[1] })))))))));
      host.appendChild(recorder(p.items[0][1][0]));
      host.appendChild(h('section', { class: 'card' }, h('h2', null, 'Ejercicio de discriminación'), h('p', null, 'Escucha y elige lo que oyes. ' + p.quiz.length + ' preguntas.'), h('button', { class: 'btn btn-primary', onclick: run }, 'Empezar el ejercicio')));
    }
    async function run() {
      host.innerHTML = ''; const box = h('div'); host.appendChild(box);
      const res = await E.run(box, L.shuffle(p.quiz), { title: p.title, onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      const d = (S.prog.done['pron:' + p.id] = S.prog.done['pron:' + p.id] || { best: 0, attempts: 0 }); d.best = Math.max(d.best, pct); d.attempts++; d.last = Date.now();
      S.count('pron'); S.markProg(); await U.save();
      host.innerHTML = ''; const sm = E.summary(res, { pass: S.PASS, headline: pct >= S.PASS ? '¡Buen oído!' : 'Sigue escuchando' });
      host.appendChild(h('div', { class: 'card' }, sm.el, h('p', { class: 'muted center' }, 'Recuerda: acertar este ejercicio mide cuánto distingues los sonidos, no cómo los pronuncias tú.')));
      host.appendChild(h('div', { class: 'nav-actions' }, h('button', { class: 'btn btn-primary', onclick: run }, 'Repetir el ejercicio'), h('button', { class: 'btn btn-ghost', onclick: study }, 'Volver al tema'), h('a', { class: 'btn btn-ghost', href: '#/pronunciacion' }, 'Todos los temas')));
    }
    study();
    return root;
  }, 'Pronunciación');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, D = L.dict;

  function formsTable(e) {
    if (!e.forms) return null;
    const tb = h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, 'Persona'), Object.keys(e.forms).map((t) => h('th', null, D.TENSES[t])))),
      h('tbody', null, D.PERSONS.map((p, i) => h('tr', null, h('td', null, p), Object.keys(e.forms).map((t) => h('td', null, h('span', null, e.forms[t][i] + ' '), L.Audio.btn(e.forms[t][i], { small: true, name: e.forms[t][i] })))))));
    return h('details', { open: '' }, h('summary', { style: 'cursor:pointer;font-weight:700;margin:8px 0' }, 'Conjugación de «' + e.w + '»'), tb);
  }
  function relatedLessons(e) {
    const own = e.lessons || [];
    if (!own.length) return null;
    return h('div', { class: 'tip' }, h('b', null, 'Aprende esta palabra en: '), own.map((id, i) => { const les = C.lessons[id]; return [i ? ' · ' : '', h('a', { href: '#/leccion/' + id }, les.level + ' · ' + les.title)]; }));
  }

  async function remember(word) {
    const hist = S.prog.translatorHistory || (S.prog.translatorHistory = []);
    const i = hist.indexOf(word); if (i >= 0) hist.splice(i, 1);
    hist.unshift(word); if (hist.length > 60) hist.length = 60;
    S.markProg(); S.count('lookups'); await U.save(true);
  }

  function resultsView(out, q, ctx) {
    const box = h('div', { 'aria-live': 'polite' });
    if (!out.entries.length) {
      box.appendChild(h('div', { class: 'alert' }, h('strong', null, 'No encontramos «' + q + '» en el diccionario de la plataforma. '), 'Revisa la ortografía (y las tildes) o prueba con otra palabra. El diccionario crece con cada versión.'));
      if (out.suggestions.length) box.appendChild(h('div', null, h('p', null, '¿Querías buscar alguna de estas palabras?'), h('div', { class: 'row' }, out.suggestions.map((e) => h('a', { class: 'btn btn-ghost btn-sm', href: '#/traductor/' + encodeURIComponent(e.w) }, e.w)))));
      return box;
    }
    if (out.forms.length) {
      out.forms.forEach((f) => box.appendChild(h('div', { class: 'alert ok' }, '«' + f.f + '» es una forma del verbo ', h('a', { href: '#/traductor/' + encodeURIComponent(f.e.w) }, f.e.w), ': ' + D.TENSES[f.t].toLowerCase() + ', ' + D.PERSONS[(f.e.forms[f.t] || []).indexOf(f.f)] + '.')));
    }
    out.entries.forEach((e) => { const c = U.wordCard(e, { english: true, context: ctx, source: 'traductor' }); const ft = formsTable(e); if (ft) c.insertBefore(ft, c.querySelector('.acts')); const rl = relatedLessons(e); if (rl) c.insertBefore(rl, c.querySelector('.acts')); box.appendChild(c); });
    return box;
  }

  function page(initial, ctx) {
    const root = h('div');
    root.appendChild(U.pageHead('Traductor', 'Escribe una palabra, una forma de verbo o una expresión en español. Verás su significado explicado en español, su significado en inglés y un ejemplo en inglés.'));
    const form = h('form', { class: 'search-box', role: 'search' });
    const inp = h('input', { type: 'search', class: 'inp', id: 'tr-q', 'aria-label': 'Palabra en español', placeholder: 'Escribe una palabra… (p. ej. aprender, tengo, tener razón)', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', lang: 'es', value: initial || '' });
    const go = h('button', { class: 'btn btn-primary', type: 'submit', style: 'margin-top:10px' }, 'Buscar');
    const sugg = h('div', { class: 'sugg', role: 'listbox', hidden: true });
    form.append(inp, sugg, go);
    const keys = h('div', { class: 'special-keys' }, ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'].map((c) => h('button', { type: 'button', class: 'key', 'aria-label': 'Insertar ' + c, onclick: () => { const s = inp.selectionStart || inp.value.length; inp.setRangeText(c, s, inp.selectionEnd || s, 'end'); inp.focus(); inp.dispatchEvent(new Event('input')); } }, c)));
    const out = h('div', { style: 'margin-top:18px' });
    root.append(h('div', { class: 'card' }, form, keys), out);
    let selIdx = -1;
    function closeS() { sugg.hidden = true; sugg.innerHTML = ''; selIdx = -1; }
    inp.addEventListener('input', () => {
      const v = inp.value.trim(); sugg.innerHTML = '';
      if (!v) return closeS();
      const arr = D.suggest(v, 7);
      if (!arr.length) return closeS();
      arr.forEach((e) => sugg.appendChild(h('button', { type: 'button', role: 'option', onclick: () => { inp.value = e.w; closeS(); search(e.w); } }, h('b', null, e.w), h('span', { class: 'muted' }, ' · ' + e.pos + ' · ' + e.level))));
      sugg.hidden = false;
    });
    inp.addEventListener('keydown', (e) => {
      const opts = Array.from(sugg.children); if (sugg.hidden || !opts.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); selIdx = (selIdx + 1) % opts.length; } else if (e.key === 'ArrowUp') { e.preventDefault(); selIdx = (selIdx - 1 + opts.length) % opts.length; } else if (e.key === 'Enter' && selIdx >= 0) { e.preventDefault(); opts[selIdx].click(); return; } else if (e.key === 'Escape') return closeS(); else return;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === selIdx)));
    });
    document.addEventListener('click', (e) => { if (!form.contains(e.target)) closeS(); });
    async function search(q) {
      q = String(q || inp.value).trim(); closeS(); if (!q) { L.toast('Escribe una palabra para buscar.', '', 2000); inp.focus(); return; }
      const r = D.lookup(q); out.innerHTML = '';
      out.appendChild(resultsView(r, q, ctx));
      if (r.entries.length) { await remember(r.entries[0].w); drawHist(); }
      history.replaceState(null, '', '#/traductor/' + encodeURIComponent(q));
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); search(); });

    const histBox = h('section', { class: 'card', style: 'margin-top:18px' });
    function drawHist() {
      histBox.innerHTML = '';
      const hist = S.prog.translatorHistory || [];
      histBox.appendChild(h('div', { class: 'row sb' }, h('h2', { style: 'margin:0' }, 'Palabras buscadas'), hist.length ? h('button', { class: 'btn btn-ghost btn-sm', onclick: async () => { const ok = await L.modal({ title: '¿Borrar el historial?', body: 'Se borrarán las palabras buscadas. Tu Wordbook y tus favoritos no cambian.', escValue: false, actions: [{ label: 'Cancelar', value: false }, { label: 'Borrar historial', value: true, danger: true }] }); if (!ok) return; S.prog.translatorHistory = []; S.markProg(); await U.save(true); drawHist(); } }, 'Borrar historial') : null));
      if (!hist.length) { histBox.appendChild(h('p', { class: 'muted' }, 'Aún no has buscado palabras. Tus búsquedas aparecerán aquí.')); return; }
      const hs = h('input', { class: 'inp', type: 'search', 'aria-label': 'Buscar en el historial', placeholder: 'Buscar en tus palabras anteriores…', style: 'margin:8px 0' });
      const row = h('div', { class: 'row' });
      const paint = () => { row.innerHTML = ''; const f = L.norm(hs.value); hist.filter((w) => !f || L.stripAcc(L.norm(w)).includes(L.stripAcc(f))).slice(0, 40).forEach((w) => row.appendChild(h('a', { class: 'btn btn-ghost btn-sm', href: '#/traductor/' + encodeURIComponent(w) }, w))); if (!row.children.length) row.appendChild(h('span', { class: 'muted' }, 'Ninguna palabra coincide.')); };
      hs.addEventListener('input', paint); histBox.append(hs, row); paint();
    }
    drawHist(); root.appendChild(histBox);
    root.appendChild(h('section', { class: 'card', style: 'margin-top:14px' }, h('h2', null, '¿No te convence el resultado?'), h('p', null, 'Si no encuentras la palabra o la traducción no te satisface, prueba con nuestra otra aplicación de traducción.'), h('a', { class: 'btn btn-primary', href: 'https://2009malek11-source.github.io/Languway-Translator/', target: '_blank', rel: 'noopener noreferrer' }, 'Entrar a Languway Translator ↗'), h('p', { class: 'muted', style: 'margin-top:8px' }, 'Se abre en una pestaña nueva y necesita conexión a internet.')));
    const fav = S.prog.favorites.words;
    if (fav.length) root.appendChild(h('section', { class: 'card', style: 'margin-top:14px' }, h('h2', null, 'Palabras favoritas'), h('div', { class: 'row' }, fav.map((id) => D.get(id)).filter(Boolean).map((e) => h('a', { class: 'btn btn-ghost btn-sm', href: '#/traductor/' + encodeURIComponent(e.w) }, '★ ' + e.w)))));
    if (initial) search(initial); else setTimeout(() => inp.focus(), 60);
    return root;
  }
  route('/traductor', ({ q }) => page('', q.ctx || ''), 'Traductor');
  route('/traductor/:w', ({ params, q }) => page(params.w, q.ctx || ''), 'Traductor');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, D = L.dict;
  const DAYN = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  function last14() {
    const out = []; const d = new Date(); d.setHours(12);
    for (let i = 13; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); const k = L.dayKey(x); const a = S.prog.activity[k] || {}; out.push({ k, d: x, n: (a.q || 0) + (a.w || 0) + (a.l || 0) * 5 }); }
    return out;
  }
  function weekLessons() {
    let n = 0; const now = Date.now();
    Object.values(S.prog.lessons).forEach((l) => { if (l.doneAt && now - l.doneAt < 7 * 86400000) n++; });
    return n;
  }
  function scoreName(a) {
    if (a.kind === 'lesson') { const les = C.lessons[a.ref]; return 'Lección: ' + (les ? les.title : a.ref); }
    if (a.kind === 'unit') return 'Examen de la unidad ' + a.ref.replace('.', ' · ');
    if (a.kind === 'level') return 'Examen final del nivel ' + a.ref;
    const names = { grammar: 'Gramática: ', listen: 'Escuchar: ', read: 'Lectura: ', write: 'Escritura: ', sentences: 'Frases · nivel ', dialog: 'Conversación: ', story: 'Historia: ', placement: 'Prueba de nivel' };
    const lab = { grammar: (C.grammar || []).find((g) => g.id === a.ref), listen: (C.listening || []).find((g) => g.id === a.ref), read: (C.reading || []).find((g) => g.id === a.ref), write: (C.writing || []).find((g) => g.id === a.ref), dialog: (C.dialogs || []).find((g) => g.id === a.ref), story: (C.stories || []).find((g) => g.id === a.ref) }[a.kind];
    if (names[a.kind]) return names[a.kind] + (lab ? lab.title : (a.ref || ''));
    return a.kind;
  }

  route('/progreso', async () => {
    const root = h('div');
    root.appendChild(U.pageHead('Mi progreso', 'Estos datos salen de lo que has hecho de verdad en la plataforma.'));
    const st = S.stats();
    if (!st.answered && !st.lessons && !st.words && !S.prog.placement) {
      root.appendChild(U.empty('📊', 'Todavía no hay actividad que mostrar. Completa tu primera lección o la prueba de nivel y aquí aparecerá tu progreso.', h('div', { class: 'row', style: 'justify-content:center' }, h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Empezar a aprender'), h('a', { class: 'btn btn-ghost', href: '#/prueba-de-nivel' }, 'Prueba de nivel'))));
      return root;
    }
    const lv = S.currentLevel(); const p = S.levelProgress(lv);
    root.appendChild(h('section', { class: 'card', style: 'margin-bottom:16px' }, h('h2', null, 'Ruta de 30 niveles'), U.stageTrack()));
    root.appendChild(h('div', { class: 'grid g2' },
      h('section', { class: 'card' }, h('h2', null, 'Nivel ' + S.currentStage() + ' de 30 (' + lv + ')'), h('p', { class: 'muted' }, C.level(lv).name), h('div', { class: 'row sb' }, h('span', null, p.done + ' de ' + p.total + ' lecciones'), h('b', null, p.pct + ' %')), U.bar(p.pct),
        h('p', { style: 'margin-top:10px' }, 'Unidades superadas: ' + C.level(lv).units.filter((u) => S.unitDone(lv, u.n)).length + ' de ' + C.level(lv).units.length)),
      h('section', { class: 'card' }, h('h2', null, 'Mi objetivo'), (() => {
        const goal = S.prog.goals.lessonsPerWeek, wk = weekLessons();
        return h('div', null, h('p', null, 'Esta semana: ', h('b', null, wk + ' de ' + goal), ' lecciones.'), U.bar(Math.min(100, L.pct(wk, goal))),
          h('p', { class: 'muted', style: 'margin-top:8px' }, wk >= goal ? '¡Objetivo semanal cumplido!' : 'Cada paso cuenta. Puedes ajustar el objetivo en Configuración si necesitas otro ritmo.'));
      })())));
    root.appendChild(h('div', { class: 'grid g4', style: 'margin-top:16px' }, [['Lecciones completadas', st.lessons], ['Palabras estudiadas', st.words], ['Palabras dominadas', st.mastered], ['Para repasar', st.due], ['Ejercicios respondidos', st.answered], ['Días de estudio', st.days], ['Racha actual', st.streak + (st.streak === 1 ? ' día' : ' días')], ['Última actividad', st.last ? L.fmtDate(new Date(st.last + 'T12:00:00').getTime()) : '—']].map((x) => h('div', { class: 'card stat' }, h('b', { style: x[1] && String(x[1]).length > 8 ? 'font-size:1.1rem' : '' }, x[1]), h('span', null, x[0])))));

    // actividad
    const days = last14(); const mx = Math.max(1, ...days.map((d) => d.n));
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Actividad de los últimos 14 días'),
      h('div', { class: 'chart-wrap' }, h('div', { class: 'chart', role: 'img', 'aria-label': 'Actividad diaria: ' + days.map((d) => L.pad(d.d.getDate()) + '/' + L.pad(d.d.getMonth() + 1) + ': ' + d.n).join(', ') }, days.map((d) => h('div', { class: 'col', title: d.k + ': ' + d.n, style: 'height:' + Math.max(4, Math.round((d.n / mx) * 100)) + '%;' + (d.n ? '' : 'opacity:.25') }, h('span', null, DAYN[d.d.getDay()]))))),
      h('p', { class: 'muted' }, 'Cada barra suma respuestas, repasos y lecciones de ese día.')));

    // habilidades
    const sk = h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Rendimiento por habilidad'));
    let any = false;
    S.SKILLS.forEach((s) => { const pc = S.skillPct(s); const t = (S.prog.skills[s] || {}).t || 0; if (pc !== null) any = true; sk.appendChild(h('div', { class: 'skill-row' }, h('span', null, s.replace(/^./, (c) => c.toUpperCase())), pc === null ? h('span', { class: 'muted' }, 'Sin datos todavía') : U.bar(pc), h('span', null, pc === null ? '—' : pc + ' %'))); });
    if (any) sk.appendChild(h('p', { class: 'muted' }, 'Los porcentajes cuentan solo respuestas dadas sin ayuda (sin mostrar el texto en ejercicios de escucha).'));
    const weak = S.weakSkills();
    if (weak.length) sk.appendChild(h('div', { class: 'alert' }, h('b', null, 'Para mejorar: '), weak.map((w) => w.s).join(', '), '. ', h('a', { href: '#/errores' }, 'Practicar mis errores')));
    root.appendChild(sk);

    // resultados
    const at = (await L.db.byIndex('attempts', 'byUser', S.user.id)).sort((a, b) => b.date - a.date).slice(0, 12);
    const res = h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Resultados recientes'));
    if (!at.length) res.appendChild(h('p', { class: 'muted' }, 'Aún no has hecho ningún examen.'));
    else res.appendChild(h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Examen', 'Resultado', 'Fecha'].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, at.map((a) => h('tr', null, h('td', null, scoreName(a)), h('td', null, h('span', { class: 'chip-tag ' + (a.score >= S.PASS ? 'green' : '') }, (a.score >= S.PASS ? '✓ ' : '') + a.score + ' %')), h('td', null, L.fmtDateTime(a.date)))))));
    root.appendChild(res);

    // errores frecuentes
    const tags = S.weakTags(5);
    if (tags.length) root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Errores frecuentes'), h('ul', null, tags.map((t) => h('li', null, C.tagName(t)))), h('a', { class: 'btn btn-primary btn-sm', href: '#/errores' }, 'Practicar estos temas')));

    // palabras
    const need = S.dueWords().slice(0, 8);
    if (need.length) root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Palabras que necesitan repaso'), h('div', { class: 'row' }, need.map((w) => { const e = D.get(w.id); return e ? h('span', { class: 'chip-tag' }, e.w) : null; })), h('p', null, h('a', { class: 'btn btn-primary btn-sm', href: '#/repaso' }, 'Ir al Repaso diario'))));

    // niveles y certificados
    const certs = S.prog.certificates;
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Certificados'), certs.length ? h('div', null, certs.map((c) => h('a', { class: 'lesson-row', href: '#/certificado/' + c.level }, h('span', { class: 'n' }, '🎓'), h('span', { style: 'flex:1' }, h('strong', null, 'Nivel ' + c.level), h('div', { class: 'muted' }, L.fmtDate(c.date) + ' · ' + c.score + ' %')), h('span', { class: 'chip-tag' }, c.id)))) : h('p', { class: 'muted' }, 'Aprueba el examen final de un nivel para recibir tu certificado de finalización.')));
    root.appendChild(h('p', { style: 'margin-top:10px' }, h('a', { class: 'btn btn-ghost', href: '#/certificados' }, 'Todos mis certificados y diploma')));
    // logros
    const ag = h('div', { class: 'grid g2' }, S.ACH.map((a) => { const got = S.prog.achievements[a.id]; return h('div', { class: 'ach' + (got ? '' : ' lock') }, h('span', { class: 'ic', 'aria-hidden': 'true' }, a.icon), h('div', null, h('b', null, a.t + (got ? ' ✓' : '')), h('div', { class: 'muted' }, a.d + (got ? ' · ' + L.fmtDate(got) : '')))); }));
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Logros'), ag));
    return root;
  }, 'Mi progreso');


})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, A = L.A, E = L.Engine;
  const SITE = (L.SITE_URL || 'https://2009malek11-source.github.io/LanguWay-Spanish/');
  const NAME_RE = /^[\p{L}][\p{L} .'-]{1,39}$/u;
  const LV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const cleanName = (v) => String(v || '').trim().replace(/\s+/g, ' ');
  const days = (a, b) => Math.max(1, Math.round((b - a) / 86400000));

  // ---------- sello digital: dibujo único derivado del código firmado por el servidor ----------
  function sealSvg(id, code) {
    const hex = String(code || '').toLowerCase().padEnd(20, '0');
    const nb = (i) => parseInt(hex.substr(i * 2, 2), 16) || 0;
    const a = 5 + (nb(0) % 8), b = 3 + (nb(1) % 7), c = 7 + (nb(2) % 9);
    const p1 = (nb(3) / 255) * 6.283, p2 = (nb(4) / 255) * 6.283, p3 = (nb(5) / 255) * 6.283;
    const path = (R, k) => { let d = ''; for (let i = 0; i <= 360; i += 2) { const t = (i / 180) * Math.PI; const r = R * (0.62 + 0.16 * Math.cos(a * t + p1 * k) + 0.1 * Math.cos(b * t + p2) + 0.07 * Math.cos(c * t + p3 * k)); d += (i ? 'L' : 'M') + (100 + r * Math.cos(t)).toFixed(1) + ' ' + (100 + r * Math.sin(t)).toFixed(1); } return d + 'Z'; };
    const grp = String(code || '').replace(/(.{4})/g, '$1 ').trim();
    const ring = 'LANGUWAY SPANISH · SELLO DIGITAL · ' + id + ' · ';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Sello digital ' + id + '">' +
      '<defs><radialGradient id="sg" cx="40%" cy="35%"><stop offset="0" stop-color="#fff3b0"/><stop offset="0.6" stop-color="#f2c94c"/><stop offset="1" stop-color="#b8860b"/></radialGradient><path id="sr" d="M100 100 m-86 0 a86 86 0 1 1 172 0 a86 86 0 1 1 -172 0"/></defs>' +
      '<circle cx="100" cy="100" r="97" fill="url(#sg)" stroke="#7a5a00" stroke-width="3"/><circle cx="100" cy="100" r="90" fill="none" stroke="#7a5a00" stroke-width="1"/>' +
      '<text font-size="7.2" font-family="monospace" fill="#4a3600" letter-spacing="0.6"><textPath href="#sr">' + (ring + ring).slice(0, 118) + '</textPath></text>' +
      '<circle cx="100" cy="100" r="72" fill="#fffdf0" stroke="#7a5a00" stroke-width="1.2"/>' +
      '<path d="' + path(70, 1) + '" fill="none" stroke="#b8860b" stroke-width="0.9"/><path d="' + path(62, 2) + '" fill="none" stroke="#7a5a00" stroke-width="0.7"/><path d="' + path(54, 3) + '" fill="none" stroke="#d9ad1f" stroke-width="0.7"/>' +
      '<circle cx="100" cy="100" r="30" fill="#fff8d6" stroke="#7a5a00" stroke-width="1"/>' +
      '<text x="100" y="97" text-anchor="middle" font-size="15" font-weight="800" font-family="Georgia,serif" fill="#4a3600">LS</text>' +
      '<text x="100" y="109" text-anchor="middle" font-size="6" font-family="monospace" fill="#4a3600">VERIFICADO</text>' +
      '<text x="100" y="178" text-anchor="middle" font-size="7" font-family="monospace" fill="#4a3600" letter-spacing="0.5">' + grp.slice(0, 9) + '</text></svg>';
  }

  const fmtLevel = (n) => { const st = L.stage(n); return st ? st.level + ' · ' + C.level(st.level).name : ''; };

  function certCard(c) {
    const when = L.fmtDate(c.issued); const d = c.data || {};
    const card = h('article', { class: 'cert cert-' + c.kind, 'aria-label': 'Certificado ' + (c.kind === 'final' ? 'final' : c.ref) });
    if (c.id && c.code) card.appendChild(h('div', { class: 'cert-seal', html: sealSvg(c.id, c.code) }));
    card.appendChild(h('div', { html: L.logoSvg(), style: 'width:64px;margin:0 auto' }));
    card.appendChild(h('div', { style: 'letter-spacing:.2em;font-weight:700' }, 'LANGUWAY SPANISH'));
    let title, line, extra = [];
    if (c.kind === 'stage') {
      const n = +c.ref; title = 'Certificado · Nivel ' + n + ' de 30'; line = 'ha completado con éxito el nivel ' + n + ' de 30 (' + fmtLevel(n) + ').';
      if (d.lessons) extra.push('Lecciones superadas en este nivel del curso: ' + d.lessons);
      extra.push(n < 30 ? 'Niveles que te quedan para completar los 30: ' + (30 - n) : '¡Has completado los 30 niveles!');
    } else if (c.kind === 'level') {
      const i = LV.indexOf(c.ref); title = 'Certificado de nivel ' + c.ref; line = 'ha completado el nivel ' + c.ref + ' — ' + C.level(c.ref).name + '.';
      if (d.score != null) extra.push('Resultado del examen final del nivel: ' + d.score + ' %');
      extra.push(i < 5 ? 'Niveles que te quedan (A1–C2): ' + (5 - i) : '¡Has completado todos los niveles!');
    } else {
      title = 'Diploma de Español · 30 niveles (A1–C2)'; line = 'ha completado los 30 niveles de español de Languway Spanish y ha aprobado el examen final global.';
      if (d.score != null) extra.push('Nota del examen final global: ' + d.score + ' %');
      if (d.lessons) extra.push('Lecciones superadas: ' + d.lessons);
      if (d.words) extra.push('Palabras guardadas para repaso: ' + d.words);
      if (d.start) extra.push('Duración del curso: ' + days(d.start, c.issued) + ' días (desde el ' + L.fmtDate(d.start) + ')');
    }
    card.appendChild(h('h1', null, title));
    card.appendChild(h('p', null, 'Se certifica que'));
    card.appendChild(h('div', { class: 'name' }, c.name));
    card.appendChild(h('p', null, line));
    extra.forEach((x) => card.appendChild(h('p', { style: 'margin:.2em 0' }, x)));
    card.appendChild(h('p', { style: 'margin-top:14px;font-style:italic' }, 'Gracias por tu esfuerzo y tu constancia. ¡Enhorabuena y sigue adelante!'));
    card.appendChild(h('p', null, 'Fecha: ' + when));
    if (c.id && c.code) {
      card.appendChild(h('p', { style: 'font-size:.82rem;margin-top:10px' }, 'N.º ' + c.id + ' · Código: ' + c.code.replace(/(.{4})/g, '$1 ').trim()));
      card.appendChild(h('p', { style: 'font-size:.78rem;color:#555' }, 'Comprueba su autenticidad en ' + SITE + '#/verificar con el número y el código. El servidor guarda el nombre y la fecha firmados: si alguien cambia un dato, la verificación falla.'));
    } else {
      card.appendChild(h('p', { style: 'font-size:.82rem;color:#8a3b00;font-weight:700;margin-top:10px' }, 'Sin sello: no verificado. Inicia sesión con tu cuenta para obtener el sello digital comprobable.'));
    }
    card.appendChild(h('p', { style: 'font-size:.75rem;color:#5f5f5f' }, 'Certificado emitido por la plataforma Languway Spanish. No es un título oficial ni está avalado por ninguna institución externa.'));
    return card;
  }

  // Muestra un certificado: pide el nombre, emite/recupera el sello en el servidor y dibuja el resultado
  function certPage(kind, ref, title, eligible, notYet, back) {
    const root = h('div');
    root.appendChild(h('div', { class: 'no-print' }, U.pageHead(title, null, [{ t: 'Certificados', href: '#/certificados' }, { t: title }])));
    if (!eligible()) { root.appendChild(U.empty('🎓', notYet, h('a', { class: 'btn btn-primary', href: back || '#/aprender' }, 'Volver'))); return root; }
    const out = h('div'); const form = h('div', { class: 'card no-print', style: 'max-width:760px;margin:0 auto 16px' });
    root.append(form, out);
    const nameInp = h('input', { class: 'inp', type: 'text', maxlength: 40, autocomplete: 'name', 'aria-label': 'Nombre en el certificado', value: S.prog.settings.certName || '', placeholder: 'Tu nombre completo' });
    const msg = h('p', { class: 'muted', 'aria-live': 'polite' });
    const btn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Emitir mi certificado');
    form.append(h('h3', null, 'Nombre que aparecerá en el certificado'), nameInp, h('div', { class: 'row', style: 'margin-top:10px' }, btn), msg);
    let busy = false;
    async function issue() {
      if (busy) return; const nm = cleanName(nameInp.value);
      if (!NAME_RE.test(nm)) { msg.textContent = 'Escribe un nombre válido: solo letras, espacios, punto, apóstrofo o guion (2 a 40 caracteres).'; return; }
      busy = true; btn.disabled = true; msg.textContent = 'Emitiendo…'; out.innerHTML = '';
      S.prog.settings.certName = nm; S.markProg(); await U.save();
      let cert = null; let note = '';
      if (A.hasCloud() && navigator.onLine) {
        await A.push();
        const r = await L.cloud.issueCert(A.user.ct, kind, String(ref), nm);
        if (r.ok) cert = r; else note = L.cloud.message(r);
      } else note = A.isGuest() ? 'Estás como invitado: el certificado no tendrá sello. Crea una cuenta para obtener el sello digital.' : 'Sin conexión o sin sesión en línea: el certificado se muestra sin sello.';
      if (!cert) {
        const t = Date.now(); const local = { kind, ref: String(ref), name: nm, issued: t, data: localData(kind, ref) };
        cert = local;
      }
      out.appendChild(certCard(cert));
      out.appendChild(h('div', { class: 'row no-print', style: 'justify-content:center;margin-top:16px' }, h('button', { class: 'btn btn-primary', onclick: () => window.print() }, 'Imprimir o guardar como PDF'), h('a', { class: 'btn btn-ghost', href: '#/certificados' }, 'Todos mis certificados')));
      msg.textContent = note;
      busy = false; btn.disabled = false; btn.textContent = 'Volver a emitir con este nombre';
    }
    btn.addEventListener('click', issue);
    if (S.prog.settings.certName && NAME_RE.test(S.prog.settings.certName)) issue();
    return root;
  }
  function localData(kind, ref) {
    if (kind === 'stage') { const st = L.stage(+ref); return { lessons: st ? st.lessons.filter((id) => S.lessonDone(id)).length : 0 }; }
    if (kind === 'level') return { score: (S.prog.levelTests[ref] || {}).best || 0 };
    return { score: S.prog.finalExam.best, lessons: Object.keys(S.prog.lessons).filter((id) => S.lessonDone(id)).length, words: S.words.size || S.words.length || 0, start: S.prog.created };
  }
  const allLevelsDone = () => LV.every((l) => S.levelDone(l));
  const finalDone = () => allLevelsDone() && S.prog.finalExam.best >= 75;

  route('/certificado-nivel/:n', ({ params }) => { const n = +params.n; return certPage('stage', n, 'Certificado del nivel ' + n + ' de 30', () => n >= 1 && n <= 30 && S.stageDone(n), 'Todavía no has completado todas las lecciones del nivel ' + n + ' de 30.'); }, 'Certificado de nivel');
  route('/certificado/:lv', ({ params }) => { const lv = String(params.lv).toUpperCase(); return certPage('level', lv, 'Certificado de nivel ' + lv, () => LV.includes(lv) && S.levelDone(lv), 'Todavía no tienes el certificado de este nivel. Aprueba el examen final del nivel para obtenerlo.'); }, 'Certificado');
  route('/diploma', () => certPage('final', 'F', 'Diploma de Español', finalDone, 'El diploma se obtiene al aprobar los seis niveles (A1–C2) y el examen final global.', '#/examen-final'), 'Diploma');

  // ---------- examen final global ----------
  route('/examen-final', async () => {
    const root = h('div'); root.appendChild(U.pageHead('Examen final global', 'Una prueba completa de los seis niveles, de A1 a C2.', [{ t: 'Certificados', href: '#/certificados' }, { t: 'Examen final' }]));
    if (!allLevelsDone()) { root.appendChild(h('div', { class: 'alert warn' }, 'El examen final global se abre cuando apruebes el examen final de los seis niveles (A1 a C2). Te faltan: ' + LV.filter((l) => !S.levelDone(l)).join(', ') + '.')); return root; }
    const host = h('div'); root.appendChild(host);
    const ids = []; LV.forEach((l) => C.lessonList(l).forEach((r) => { if (C.lessons[r.id]) ids.push(r.id); }));
    async function start() {
      host.innerHTML = ''; const box = h('div'); host.appendChild(box);
      const qs = C.sampleBank(ids, 60);
      const res = await E.run(box, qs, { title: 'Examen final global', strictAccents: true, onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
      const pct = L.pct(res.filter((r) => r.ok).length, res.length);
      const f = S.prog.finalExam; f.attempts++; f.date = Date.now(); if (pct > f.best) f.best = pct; S.markProg(); await U.save();
      host.innerHTML = '';
      const passed = pct >= 75;
      const sm = E.summary(res, { pass: 75, headline: passed ? '¡Felicidades! Has aprobado el examen final global' : 'Todavía no' });
      host.appendChild(h('div', { class: 'card' }, sm.el));
      host.appendChild(h('div', { class: 'nav-actions' }, passed ? h('a', { class: 'btn btn-primary', href: '#/diploma' }, 'Obtener mi diploma') : h('button', { class: 'btn btn-primary', onclick: start }, 'Intentarlo de nuevo')));
    }
    host.appendChild(h('div', { class: 'card' }, h('h2', null, 'Antes de empezar'), h('p', null, '60 preguntas que mezclan vocabulario, gramática, lectura y orden de frases de todos los niveles. Necesitas un 75 % o más. Puedes repetirlo cuando quieras; se guarda tu mejor nota.'),
      S.prog.finalExam.attempts ? h('p', { class: 'muted' }, 'Tu mejor nota: ' + S.prog.finalExam.best + ' %.') : null, h('button', { class: 'btn btn-primary', onclick: start }, 'Empezar el examen final')));
    return root;
  }, 'Examen final global');

  // ---------- índice de certificados ----------
  route('/certificados', () => {
    const root = h('div'); root.appendChild(U.pageHead('Mis certificados', 'Un certificado por cada uno de los 30 niveles, uno por cada nivel A1–C2 y el diploma final.'));
    const row = (href, ok, t, sub) => h(ok ? 'a' : 'div', { class: 'lesson-row' + (ok ? ' done' : ' locked'), href: ok ? href : null }, h('span', { class: 'n' }, ok ? '✓' : '🔒'), h('span', { style: 'flex:1' }, h('strong', null, t), sub ? h('div', { class: 'muted' }, sub) : null), h('span', { class: 'chip-tag ' + (ok ? 'green' : 'gray') }, ok ? 'Ver' : 'Bloqueado'));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Diploma final'), row('#/diploma', finalDone(), 'Diploma de Español · 30 niveles', finalDone() ? 'Nota: ' + S.prog.finalExam.best + ' %' : allLevelsDone() ? 'Aprueba el examen final global' : 'Se abre al aprobar A1–C2 y el examen final global'),
      allLevelsDone() && !finalDone() ? h('a', { class: 'btn btn-primary', href: '#/examen-final' }, 'Hacer el examen final global') : null));
    const cs = h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Niveles A1 a C2')); LV.forEach((l) => cs.appendChild(row('#/certificado/' + l, S.levelDone(l), 'Nivel ' + l + ' — ' + C.level(l).name))); root.appendChild(cs);
    const ss = h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Los 30 niveles')); for (let n = 1; n <= 30; n++) ss.appendChild(row('#/certificado-nivel/' + n, S.stageDone(n), 'Nivel ' + n + ' de 30', fmtLevel(n))); root.appendChild(ss);
    root.appendChild(h('p', null, h('a', { href: '#/verificar' }, 'Verificar un certificado')));
    return root;
  }, 'Certificados');

  // ---------- verificación pública ----------
  const verifyView = ({ params }) => {
    const root = h('div'); root.appendChild(U.pageHead('Verificar un certificado', 'Escribe el número y el código que aparecen en el certificado. Solo el servidor puede confirmar si es auténtico.'));
    const id = h('input', { class: 'inp', type: 'text', maxlength: 20, autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Número del certificado', placeholder: 'LW-XXXXXX-XXXXXX', value: params.id || '' });
    const code = h('input', { class: 'inp', type: 'text', maxlength: 30, autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Código', placeholder: 'Código (20 caracteres)', style: 'margin-top:8px', value: params.code || '' });
    const res = h('div', { 'aria-live': 'polite', style: 'margin-top:12px' });
    const btn = h('button', { class: 'btn btn-primary', type: 'button', style: 'margin-top:10px' }, 'Verificar');
    async function go() {
      if (!/^LW-[0-9A-Fa-f]{6}-[0-9A-Fa-f]{6}$/.test(id.value.trim())) { res.innerHTML = ''; res.appendChild(h('div', { class: 'alert warn' }, 'El número debe tener el formato LW-XXXXXX-XXXXXX.')); return; }
      btn.disabled = true; res.textContent = 'Verificando…';
      const r = await L.cloud.verifyCert(id.value.trim(), code.value.trim()); btn.disabled = false; res.innerHTML = '';
      if (r.ok) {
        const t = r.kind === 'stage' ? 'Nivel ' + r.ref + ' de 30' : r.kind === 'level' ? 'Nivel ' + r.ref : 'Diploma final de español (30 niveles)';
        res.appendChild(h('div', { class: 'alert ok' }, h('strong', null, 'Certificado auténtico. '), 'Emitido a ', h('strong', null, r.name), ' · ' + t + ' · ' + L.fmtDate(r.issued) + (r.data && r.data.score != null ? ' · Nota: ' + r.data.score + ' %' : '') + '.'));
      } else res.appendChild(h('div', { class: 'alert warn' }, L.cloud.message(r)));
    }
    btn.addEventListener('click', go); if (params.id && params.code) go();
    root.appendChild(h('div', { class: 'card' }, id, code, btn, res));
    return root;
  };
  route('/verificar', (c) => verifyView({ params: {} }), 'Verificar certificado');
  route('/verificar/:id/:code', verifyView, 'Verificar certificado');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine, Q = L.Q;
  const prep = (q, tag) => { q.s = q.s || 'vocabulario'; return Q.prep(q, 'pre:' + tag, 'A1'); };

  // ---------- contenido: todo con inglés al lado, para quien parte de cero ----------
  const LETTERS = [
    ['A a', 'a', 'ah — like “a” in father', 'casa'], ['B b', 'be', 'b — like English b', 'bebé'], ['C c', 'ce', 'k before a, o, u (casa); th/s before e, i (cena)', 'casa, cena'],
    ['D d', 'de', 'd — softer than English d', 'dado'], ['E e', 'e', 'eh — like “e” in bed', 'mesa'], ['F f', 'efe', 'f — like English f', 'foto'],
    ['G g', 'ge', 'g in “go” before a, o, u; like a strong h before e, i (gente)', 'gato, gente'], ['H h', 'hache', 'silent! it is never pronounced', 'hola'],
    ['I i', 'i', 'ee — like “ee” in see', 'isla'], ['J j', 'jota', 'a strong, rough h sound', 'jamón'], ['K k', 'ka', 'k — rare, in foreign words', 'kilo'],
    ['L l', 'ele', 'l — like English l', 'luna'], ['M m', 'eme', 'm — like English m', 'mamá'], ['N n', 'ene', 'n — like English n', 'nada'],
    ['Ñ ñ', 'eñe', 'ny — like “ny” in canyon', 'niño'], ['O o', 'o', 'oh — short, like “o” in more', 'ojo'], ['P p', 'pe', 'p — without the puff of air', 'papa'],
    ['Q q', 'cu', 'k — always written “qu” (que, qui)', 'queso'], ['R r', 'erre', 'a quick tap of the tongue (rr = rolled)', 'pero, perro'], ['S s', 'ese', 's — like English s', 'sol'],
    ['T t', 'te', 't — without the puff of air', 'taza'], ['U u', 'u', 'oo — like “oo” in moon', 'uno'], ['V v', 'uve', 'same sound as b!', 'vaca'],
    ['W w', 'uve doble', 'w — rare, in foreign words', 'web'], ['X x', 'equis', 'ks — like “x” in taxi', 'taxi'], ['Y y', 'i griega', 'y as in yes (also the word “and”)', 'yo'], ['Z z', 'zeta', 's (America) or th (Spain)', 'zapato'],
  ];
  const NUMS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  const TENS = [['treinta', 30], ['cuarenta', 40], ['cincuenta', 50], ['sesenta', 60], ['setenta', 70], ['ochenta', 80], ['noventa', 90], ['cien', 100]];
  const WORDS = [['hola', 'hello'], ['adiós', 'goodbye'], ['buenos días', 'good morning'], ['buenas noches', 'good night'], ['por favor', 'please'], ['gracias', 'thank you'], ['de nada', 'you are welcome'],
    ['sí', 'yes'], ['no', 'no'], ['perdón', 'sorry / excuse me'], ['me llamo…', 'my name is…'], ['¿cómo te llamas?', 'what is your name?'], ['yo', 'I'], ['tú', 'you'], ['agua', 'water'], ['casa', 'house'], ['pan', 'bread'], ['amigo', 'friend']];

  const STEPS = [
    { id: 'abc', title: '1. The alphabet · El abecedario', body: () => {
      const box = h('div');
      box.appendChild(h('p', null, 'Spanish has ', h('b', null, '27 letters'), ': the same 26 as English plus ', h('b', null, 'ñ'), '. Spanish is written almost exactly as it sounds, so once you know the letters you can read any word. Tap a letter to hear its name.'));
      const t = h('div', { class: 'grid g2' });
      LETTERS.forEach((l) => t.appendChild(h('div', { class: 'card', style: 'padding:12px' }, h('div', { class: 'row sb' }, h('span', { style: 'font-size:1.6rem;font-weight:800' }, l[0]), L.Audio.btn(l[1], { small: true, name: l[1] })), h('div', null, h('b', null, l[1]), ' — ' + l[2]), h('div', { class: 'muted' }, 'Example: ' + l[3]))));
      box.appendChild(t); return box; } },
    { id: 'vowels', title: '2. The five vowels · Las vocales', body: () => {
      const box = h('div');
      box.appendChild(h('p', null, 'Spanish has only ', h('b', null, '5 vowel sounds'), ' and they never change. Say them short and clean.'));
      [['a', 'ah', 'casa'], ['e', 'eh', 'mesa'], ['i', 'ee', 'libro'], ['o', 'oh', 'ojo'], ['u', 'oo', 'luna']].forEach((v) => box.appendChild(h('div', { class: 'row', style: 'margin:8px 0' }, L.Audio.btn(v[2], { small: true, name: v[2] }), h('span', null, h('b', { style: 'font-size:1.3rem' }, v[0]), ' = “' + v[1] + '” as in ', h('b', null, v[2])))));
      box.appendChild(h('div', { class: 'alert' }, 'Tip: a written accent (á é í ó ú) does not change the sound; it only shows which part of the word is stressed.'));
      return box; } },
    { id: 'nums', title: '3. Numbers 0–100 · Los números', body: () => {
      const box = h('div'); box.appendChild(h('p', null, 'Learn 0 to 20 first. After 20 the numbers follow a pattern: ', h('b', null, 'treinta y uno'), ' = 31, ', h('b', null, 'cuarenta y cinco'), ' = 45.'));
      const g = h('div', { class: 'grid g3' });
      NUMS.forEach((w, i) => g.appendChild(h('div', { class: 'card', style: 'padding:10px' }, h('div', { class: 'row sb' }, h('span', { style: 'font-size:1.5rem;font-weight:800' }, String(i)), L.Audio.btn(w, { small: true, name: w })), h('b', null, w))));
      box.appendChild(g); box.appendChild(h('h3', { style: 'margin-top:14px' }, 'The tens'));
      const t = h('div', { class: 'grid g3' }); TENS.forEach((x) => t.appendChild(h('div', { class: 'card', style: 'padding:10px' }, h('div', { class: 'row sb' }, h('span', { style: 'font-size:1.5rem;font-weight:800' }, String(x[1])), L.Audio.btn(x[0], { small: true, name: x[0] })), h('b', null, x[0]))));
      box.appendChild(t); return box; } },
    { id: 'words', title: '4. First words · Las primeras palabras', body: () => {
      const box = h('div'); box.appendChild(h('p', null, 'These 18 words and phrases are enough for your first conversation. Tap to listen, then say them out loud.'));
      WORDS.forEach((w) => box.appendChild(h('div', { class: 'row', style: 'margin:8px 0' }, L.Audio.btn(w[0], { small: true, name: w[0] }), h('span', null, h('b', { style: 'font-size:1.1rem' }, w[0]), ' — ' + w[1]))));
      return box; } },
    { id: 'how', title: '5. How Spanish works · Cómo funciona el español', body: () => {
      const box = h('div');
      [['Questions and exclamations start with an upside-down mark', '¿Cómo estás? ¡Qué bien! — the opening mark ¿ or ¡ tells you the sentence is a question or exclamation before you read it.'],
       ['Every noun is masculine or feminine', 'el libro (the book, masculine) · la casa (the house, feminine). Most words ending in -o are masculine and in -a are feminine.'],
       ['Plural: add -s (or -es)', 'un libro → dos libros · una flor → dos flores.'],
       ['Adjectives usually come AFTER the noun and agree with it', 'una casa blanca (a white house) · unos libros blancos.'],
       ['Days and months do not start with a capital letter', 'lunes, martes, enero, febrero.'],
       ['You can often drop “I / you / he”', '“Hablo español” already means “I speak Spanish”: the verb ending shows who does the action.']]
        .forEach((x, i) => box.appendChild(h('div', { class: 'card', style: 'padding:12px;margin:8px 0' }, h('b', null, (i + 1) + '. ' + x[0]), h('div', null, x[1]))));
      return box; } },
  ];

  // Prueba de Primeros pasos: 15 preguntas sencillas
  function testQs() {
    const q = [];
    ['b', 'g', 'j', 'ñ', 'h'].forEach((k) => { const l = LETTERS.find((x) => x[0][0].toLowerCase() === k); q.push(prep(Q.listen(l[1], 'Listen: which letter name do you hear? / ¿Qué letra oyes?', l[1], LETTERS.filter((x) => x[1] !== l[1]).map((x) => x[1]).sort(() => 0.5 - Math.random()).slice(0, 3), 'You heard «' + l[1] + '», the name of the letter ' + l[0] + '.'), 'l' + k)); });
    [3, 7, 12, 15, 20].forEach((n) => { const w = NUMS[n]; q.push(prep(Q.listen(w, 'Listen: which number do you hear? / ¿Qué número oyes?', String(n), [String(n + 1), String(n === 0 ? 10 : n - 1), String(n + 10)].filter((v) => v !== String(n)).slice(0, 3), 'You heard «' + w + '» = ' + n + '.'), 'n' + n)); });
    [['hola', 'hello', ['goodbye', 'thank you', 'water']], ['gracias', 'thank you', ['please', 'sorry', 'yes']], ['agua', 'water', ['bread', 'house', 'friend']], ['por favor', 'please', ['you are welcome', 'good night', 'sorry']], ['adiós', 'goodbye', ['hello', 'yes', 'no']]]
      .forEach((w) => q.push(prep(Q.mc('What does «' + w[0] + '» mean? / ¿Qué significa «' + w[0] + '»?', w[1], w[2], '«' + w[0] + '» means “' + w[1] + '”.'), 'w' + w[0])));
    return L.shuffle(q);
  }

  route('/primeros-pasos', () => {
    const root = h('div');
    const d = S.prog.done['pre:steps'] = S.prog.done['pre:steps'] || { n: 0, best: 0, attempts: 0 };
    root.appendChild(U.pageHead('Primeros pasos · First steps', 'Empieza desde cero. Start from zero: letters, numbers and your first words, explained in English.'));
    root.appendChild(h('div', { class: 'alert' }, h('strong', null, 'No Spanish at all? Perfect. '), 'Read the 5 steps below (about 15 minutes), tap the speaker buttons to listen, then take the short check at the end. After that, your lessons start easily.'));
    STEPS.forEach((s, i) => root.appendChild(h('a', { class: 'lesson-row', href: '#/primeros-pasos/' + s.id }, h('span', { class: 'n' }, S.prog.seen && S.prog.seen['pre_' + s.id] ? '✓' : String(i + 1)), h('span', { style: 'flex:1' }, h('strong', null, s.title)), h('span', { class: 'chip-tag gray' }, 'Abrir'))));
    root.appendChild(h('a', { class: 'lesson-row' + (d.best >= 75 ? ' done' : ''), href: '#/primeros-pasos/prueba' }, h('span', { class: 'n' }, '★'), h('span', { style: 'flex:1' }, h('strong', null, 'Check · La prueba de Primeros pasos'), h('div', { class: 'muted' }, '15 easy questions. You need 75%.' + (d.attempts ? ' Best: ' + d.best + '%' : ''))), h('span', { class: 'chip-tag ' + (d.best >= 75 ? 'green' : 'gray') }, d.best >= 75 ? '✓ ' + d.best + ' %' : 'Empezar')));
    root.appendChild(h('div', { class: 'row', style: 'margin-top:14px' }, h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Ir a mis lecciones')));
    return root;
  }, 'Primeros pasos');

  route('/primeros-pasos/:id', async ({ params }) => {
    const root = h('div');
    if (params.id === 'prueba') {
      root.appendChild(U.pageHead('La prueba de Primeros pasos', 'Easy check: letters, numbers and first words. 75% to pass.', [{ t: 'Primeros pasos', href: '#/primeros-pasos' }, { t: 'Prueba' }]));
      const host = h('div'); root.appendChild(host);
      const start = async () => {
        host.innerHTML = ''; const box = h('div'); host.appendChild(box);
        const res = await E.run(box, testQs(), { title: 'Primeros pasos', onAnswer: (q, r) => S.recordAnswer(q, r.ok, r.assisted), finishLabel: 'Ver resultado' });
        const pct = L.pct(res.filter((r) => r.ok).length, res.length);
        const d = S.prog.done['pre:steps'] = S.prog.done['pre:steps'] || { n: 0, best: 0, attempts: 0 }; d.best = Math.max(d.best, pct); d.attempts++; S.markProg(); await U.save();
        host.innerHTML = ''; const sm = E.summary(res, { pass: 75, headline: pct >= 75 ? '¡Muy bien! You are ready for lesson 1' : 'Casi. Review the steps and try again' });
        host.appendChild(h('div', { class: 'card' }, sm.el));
        host.appendChild(h('div', { class: 'nav-actions' }, pct >= 75 ? h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Empezar la lección 1') : h('a', { class: 'btn btn-primary', href: '#/primeros-pasos' }, 'Repasar los pasos'), pct >= 75 ? null : h('button', { class: 'btn btn-ghost', onclick: start }, 'Intentarlo de nuevo')));
      };
      host.appendChild(h('div', { class: 'card' }, h('p', null, '15 short questions. Some play a sound: make sure your volume is on.'), h('button', { class: 'btn btn-primary', onclick: start }, 'Start')));
      return root;
    }
    const s = STEPS.find((x) => x.id === params.id);
    if (!s) return U.empty('🔤', 'Ese paso no existe.', h('a', { class: 'btn btn-primary', href: '#/primeros-pasos' }, 'Volver'));
    root.appendChild(U.pageHead(s.title, null, [{ t: 'Primeros pasos', href: '#/primeros-pasos' }, { t: s.title }]));
    root.appendChild(h('div', { class: 'card' }, s.body()));
    S.prog.seen = S.prog.seen || {}; S.prog.seen['pre_' + s.id] = Date.now(); S.markProg();
    const i = STEPS.indexOf(s); const nx = STEPS[i + 1];
    root.appendChild(h('div', { class: 'nav-actions' }, i ? h('a', { class: 'btn btn-ghost', href: '#/primeros-pasos/' + STEPS[i - 1].id }, '← Back') : null, h('a', { class: 'btn btn-primary', href: nx ? '#/primeros-pasos/' + nx.id : '#/primeros-pasos/prueba' }, nx ? 'Next →' : 'Take the check →')));
    return root;
  }, 'Primeros pasos');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const U = L.U;
  L.SITE_URL = 'https://2009malek11-source.github.io/LanguWay-Spanish/';

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isEdge = /Edg\//.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Telegram|WhatsApp|; wv\)/i.test(ua);
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
    try { const ta = h('textarea', { style: 'position:fixed;left:-9999px', 'aria-hidden': 'true' }); ta.value = t; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
  }
  L.copyText = copyText;
  async function share() {
    const data = { title: 'Languway Spanish', text: 'Aprende español en español con Languway Spanish.', url: L.SITE_URL };
    if (navigator.share) { try { await navigator.share(data); } catch (e) { if (e && e.name !== 'AbortError') L.toast('No se pudo abrir el menú de compartir. Copia el enlace.', 'err', 4000); } return; }
    L.toast((await copyText(L.SITE_URL)) ? 'Tu navegador no tiene menú de compartir: el enlace se ha copiado.' : 'No se pudo compartir. Copia el enlace manualmente.', '', 4500);
  }
  L.shareSite = share;

  // Bloque reutilizable: instalar, compartir, QR
  L.installBlock = function () {
    const box = h('div');
    const status = h('div', { 'aria-live': 'polite' });
    const btn = h('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
      const ev = window.__bip;
      if (!ev) { L.toast('Tu navegador no ofrece la instalación automática. Sigue los pasos de abajo.', '', 5000); const d = document.querySelector('details.how.sel-os'); d && (d.open = true, d.scrollIntoView({ behavior: 'smooth', block: 'center' })); return; }
      ev.prompt(); try { const r = await ev.userChoice; if (r.outcome === 'accepted') L.toast('Instalando…', 'ok'); } catch (e) {}
      window.__bip = null; paint();
    } }, h('span', { 'aria-hidden': 'true' }, '📲'), ' Instalar la aplicación');
    function paint() {
      status.innerHTML = '';
      if (standalone() || window.__installed) { status.appendChild(h('div', { class: 'alert ok' }, 'La aplicación ya está instalada y abierta como app.')); btn.hidden = true; return; }
      btn.hidden = false;
      if (inApp) status.appendChild(h('div', { class: 'alert warn' }, 'Estás dentro del navegador de otra aplicación (WhatsApp, Instagram, Facebook…). Desde aquí no se puede instalar. Pulsa «Abrir en el navegador» (menú ⋮ o «compartir») y vuelve a esta página.'));
      else if (!window.__bip && !isIOS) status.appendChild(h('div', { class: 'alert' }, 'Si el botón no instala la aplicación, usa los pasos detallados de abajo: dependen de tu dispositivo.'));
      if (isIOS) status.appendChild(h('div', { class: 'alert' }, 'En iPhone y iPad no existe el botón automático: hay que usar el menú Compartir de Safari (pasos abajo).'));
    }
    paint(); window.addEventListener('appinstalled', paint, { once: true }); setTimeout(paint, 1500);

    const act = h('div', { class: 'inst-actions' }, btn,
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: share }, h('span', { 'aria-hidden': 'true' }, '📤'), ' Compartir'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { const ok = await copyText(L.SITE_URL); L.toast(ok ? 'Enlace copiado.' : 'No se pudo copiar. Selecciónalo y cópialo a mano.', ok ? 'ok' : 'err', 2500); } }, h('span', { 'aria-hidden': 'true' }, '📋'), ' Copiar enlace'));
    box.append(status, act);
    return box;
  };

  const STEPS = [
    { id: 'android', t: 'Android · Chrome', on: () => isAndroid && !isSamsung && !isFirefox, steps: [
      'Abre esta página en Chrome (no dentro de WhatsApp, Instagram u otra app).',
      'Pulsa el botón «Instalar la aplicación» de esta página. Si aparece un aviso, elige «Instalar».',
      'Si no aparece: toca el menú ⋮ (arriba a la derecha) y elige «Instalar aplicación» o «Añadir a la pantalla de inicio».',
      'Confirma con «Instalar». El icono de Languway Spanish aparecerá en tu pantalla de inicio o en el cajón de aplicaciones.'] },
    { id: 'samsung', t: 'Android · Samsung Internet', on: () => isSamsung, steps: [
      'Abre la página en Samsung Internet.', 'Toca el menú ☰ (abajo a la derecha).', 'Elige «Añadir página a» y después «Pantalla de inicio» (o «Instalar»).', 'Confirma con «Añadir».'] },
    { id: 'ios', t: 'iPhone y iPad · Safari', on: () => isIOS, steps: [
      'Abre esta página en Safari. En iPhone y iPad solo Safari puede instalar (en Chrome u otros navegadores no aparece la opción, aunque en iOS 16.4 o superior sí aparece en el menú Compartir de otros navegadores).',
      'Toca el botón Compartir (el cuadrado con una flecha hacia arriba), abajo en iPhone o arriba en iPad.',
      'Desliza el menú hacia arriba y elige «Añadir a pantalla de inicio». Si no la ves, pulsa «Editar acciones» y actívala.',
      'Deja el nombre «Languway Spanish» y pulsa «Añadir» (arriba a la derecha).',
      'Abre la aplicación desde el icono nuevo de tu pantalla de inicio.'] },
    { id: 'firefox', t: 'Android · Firefox', on: () => isAndroid && isFirefox, steps: [
      'Abre la página en Firefox.', 'Toca el menú ⋮.', 'Elige «Instalar» (o «Añadir a la pantalla de inicio»).', 'Confirma con «Añadir».'] },
    { id: 'desk', t: 'Ordenador · Chrome o Edge (Windows, Mac, Linux)', on: () => !isIOS && !isAndroid && !isFirefox, steps: [
      'Abre esta página en Chrome o Edge.',
      'Pulsa «Instalar la aplicación» o el icono de instalar que aparece a la derecha de la barra de direcciones (un monitor con una flecha).',
      'Si no lo ves: menú ⋮ › «Guardar y compartir» › «Instalar Languway Spanish» (Chrome), o menú ⋯ › «Aplicaciones» › «Instalar este sitio como una aplicación» (Edge).',
      'Confirma con «Instalar». Se abrirá en su propia ventana y podrás anclarla a la barra de tareas.'] },
    { id: 'mac', t: 'Mac · Safari (macOS Sonoma o posterior)', on: () => /Macintosh/.test(ua) && !isIOS && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua), steps: [
      'Abre la página en Safari.', 'En el menú «Archivo» elige «Añadir al Dock».', 'Deja el nombre y pulsa «Añadir».'] },
    { id: 'ffdesk', t: 'Ordenador · Firefox', on: () => !isIOS && !isAndroid && isFirefox, steps: [
      'Firefox de escritorio no instala aplicaciones web.', 'Abre la página en Chrome o Edge y sigue los pasos de «Ordenador», o guarda la página en marcadores (Ctrl/Cmd + D).'] },
  ];
  const FIX = [
    'La página debe abrirse con https:// (la dirección de GitHub Pages ya lo usa). Con http:// o abriendo el archivo desde tu carpeta no se puede instalar.',
    'No uses el modo privado o incógnito: la instalación y el guardado del progreso pueden no funcionar.',
    'Abre el enlace en el navegador del sistema (Chrome, Safari, Edge o Samsung Internet), no en el navegador interno de otras aplicaciones.',
    'Actualiza tu navegador a la última versión y recarga la página.',
    'Si ya la instalaste antes y la borraste, espera unos minutos o borra los datos del sitio (en Configuración › Avanzado puedes limpiar la copia de la aplicación sin perder tu progreso) y recarga.',
    'Si nada funciona, usa la aplicación desde el navegador: funciona igual y puedes guardar un marcador. También puedes guardar la página como marcador en la pantalla de inicio.'
  ];

  route('/instalar', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Instalar y compartir', 'Usa Languway Spanish como una aplicación en tu pantalla de inicio, o comparte el enlace con quien quieras.'));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Instalar la aplicación'), h('p', { class: 'muted' }, 'Instalada se abre más rápido, a pantalla completa, y funciona sin conexión una vez cargada. No ocupa casi espacio y no necesita ninguna tienda de aplicaciones.'), L.installBlock()));
    const sec = h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Pasos detallados'), h('p', { class: 'muted' }, 'Elegimos primero el que corresponde a tu dispositivo.'));
    const mine = STEPS.filter((s) => s.on()).map((s) => s.id);
    STEPS.forEach((s) => sec.appendChild(h('details', { class: 'how' + (mine[0] === s.id ? ' sel-os' : ''), open: mine[0] === s.id ? '' : null }, h('summary', null, s.t), h('ol', null, s.steps.map((x) => h('li', null, x))))));
    root.appendChild(sec);
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Si no se instala'), h('ol', null, FIX.map((x) => h('li', { style: 'margin:6px 0' }, x)))));
    const link = h('input', { class: 'inp', readonly: '', value: L.SITE_URL, 'aria-label': 'Enlace de Languway Spanish', onfocus: (e) => e.target.select() });
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Compartir'),
      h('p', { class: 'muted' }, 'Envía el enlace o enseña el código QR para que otra persona lo abra con la cámara de su teléfono.'),
      h('div', { class: 'field' }, h('label', { for: 'site-link' }, 'Enlace'), link),
      h('div', { class: 'inst-actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: share }, h('span', { 'aria-hidden': 'true' }, '📤'), ' Compartir'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { const ok = await copyText(L.SITE_URL); L.toast(ok ? 'Enlace copiado.' : 'No se pudo copiar. Selecciónalo y cópialo a mano.', ok ? 'ok' : 'err', 2500); } }, h('span', { 'aria-hidden': 'true' }, '📋'), ' Copiar enlace'),
        h('a', { class: 'btn btn-ghost', target: '_blank', rel: 'noopener noreferrer', href: 'https://wa.me/?text=' + encodeURIComponent('Aprende español en español con Languway Spanish: ' + L.SITE_URL) }, 'WhatsApp'),
        h('a', { class: 'btn btn-ghost', target: '_blank', rel: 'noopener noreferrer', href: 'https://t.me/share/url?url=' + encodeURIComponent(L.SITE_URL) + '&text=' + encodeURIComponent('Languway Spanish') }, 'Telegram'),
        h('a', { class: 'btn btn-ghost', href: 'mailto:?subject=' + encodeURIComponent('Languway Spanish') + '&body=' + encodeURIComponent('Aprende español en español: ' + L.SITE_URL) }, 'Correo')),
      h('p', { class: 'muted' }, 'WhatsApp y Telegram se abren en una pestaña nueva solo si los pulsas.')));
    root.appendChild(h('section', { class: 'card', style: 'margin-top:16px' }, h('h2', null, 'Código QR'),
      h('div', { class: 'qr-box' }, h('img', { src: 'qr.png', alt: 'Código QR que abre Languway Spanish', width: '260', height: '260' }),
        h('div', null, h('p', null, 'Apunta la cámara de tu teléfono al código para abrir la aplicación.'), h('a', { class: 'btn btn-ghost', href: 'qr.png', download: 'languway-spanish-qr.png' }, h('span', { 'aria-hidden': 'true' }, '📲'), ' Descargar el código QR')))));
    return root;
  }, 'Instalar y compartir');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, A = L.A, U = L.U;

  async function setSetting(k, v) { S.prog.settings[k] = v; S.markProg(); await U.save(true); }

  route('/configuracion', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Configuración', 'Todo lo que cambies aquí se guarda en este dispositivo y afecta de verdad a la aplicación.'));
    const st = S.prog.settings;

    // Apariencia
    const theme = h('select', { class: 'inp', id: 'set-theme', onchange: (e) => L.applyTheme(e.target.value) }, [['light', 'Modo claro'], ['dark', 'Modo oscuro']].map(([v, t]) => h('option', { value: v, selected: document.documentElement.getAttribute('data-theme') === v ? '' : null }, t)));
    const motion = h('input', { type: 'checkbox', id: 'set-motion', checked: st.reduceMotion ? '' : null, onchange: async (e) => { await setSetting('reduceMotion', e.target.checked); document.documentElement.setAttribute('data-motion', e.target.checked ? 'reduce' : 'auto'); } });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Apariencia'),
      h('div', { class: 'field' }, h('label', { for: 'set-theme' }, 'Tema'), theme),
      h('div', { class: 'field' }, h('label', { for: 'set-motion' }, motion, ' Reducir animaciones'), h('p', { class: 'muted' }, 'También se respeta la opción de tu sistema.'))));


    // Lectura y accesibilidad
    const sel = (id, opts, cur, key) => h('select', { class: 'inp', id, onchange: async (e) => { await setSetting(key, +e.target.value); L.applyPrefs(); } }, opts.map(([v, t]) => h('option', { value: v, selected: Math.abs(cur - v) < 0.001 ? '' : null }, t)));
    const chk = (id, key, on) => h('input', { type: 'checkbox', id, checked: on ? '' : null, onchange: async (e) => { await setSetting(key, e.target.checked); L.applyPrefs(); } });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Lectura y accesibilidad'),
      h('div', { class: 'field' }, h('label', { for: 'set-fs' }, 'Tamaño del texto'), sel('set-fs', [[0.9, 'Pequeño'], [1, 'Normal'], [1.15, 'Grande'], [1.3, 'Muy grande']], st.fontScale || 1, 'fontScale')),
      h('div', { class: 'field' }, h('label', { for: 'set-lh' }, 'Espacio entre líneas'), sel('set-lh', [[1, 'Normal'], [1.15, 'Amplio'], [1.3, 'Muy amplio']], st.lineHeight || 1, 'lineHeight')),
      h('div', { class: 'field' }, h('label', { for: 'set-contrast' }, chk('set-contrast', 'contrast', st.contrast === true), ' Alto contraste')),
      h('div', { class: 'field' }, h('label', { for: 'set-easy' }, chk('set-easy', 'easyFont', st.easyFont === true), ' Letra de lectura fácil (más espaciada)'))));

    // Audio
    const audio = h('section', { class: 'card' }, h('h2', null, 'Audio'));
    const rate = h('input', { type: 'range', id: 'set-rate', min: '0.7', max: '1.1', step: '0.05', value: String(st.rate || 1), 'aria-describedby': 'rate-v' });
    const rv = h('span', { id: 'rate-v' }, (st.rate || 1).toFixed(2) + '×');
    rate.addEventListener('input', () => { rv.textContent = (+rate.value).toFixed(2) + '×'; }); rate.addEventListener('change', () => setSetting('rate', +rate.value));
    const vol = h('input', { type: 'range', id: 'set-vol', min: '0.2', max: '1', step: '0.1', value: String(typeof st.volume === 'number' ? st.volume : 1) });
    vol.addEventListener('change', () => setSetting('volume', +vol.value));
    const voiceBox = h('div');
    function drawVoices() {
      voiceBox.innerHTML = '';
      if (!L.Audio.supported()) { voiceBox.appendChild(h('div', { class: 'alert warn' }, 'Este navegador no puede reproducir voz. Las lecciones se pueden estudiar leyendo el texto.')); return; }
      const vs = L.Audio.voices();
      if (!vs.length) { voiceBox.appendChild(h('div', { class: 'alert warn' }, 'No hay una voz en español instalada en este dispositivo. Puedes instalarla en los ajustes de voz de tu sistema (Android: «Síntesis de voz»; iPhone: Accesibilidad › Contenido leído; Windows: Voz).')); return; }
      const dl = L.Audio.dialects();
      const dsel = h('select', { class: 'inp', id: 'set-dialect', onchange: async (e) => { await setSetting('dialect', e.target.value); await setSetting('voiceURI', ''); drawVoices(); } }, h('option', { value: 'auto' }, 'Automático'), dl.map((d) => h('option', { value: d.id, selected: st.dialect === d.id ? '' : null }, d.label)));
      const vsel = h('select', { class: 'inp', id: 'set-voice', onchange: (e) => setSetting('voiceURI', e.target.value) }, h('option', { value: '' }, 'Elegir automáticamente'), vs.map((v) => h('option', { value: v.voiceURI, selected: st.voiceURI === v.voiceURI ? '' : null }, v.name + ' (' + v.lang + ')')));
      voiceBox.append(h('p', { class: 'muted' }, 'Estas son las voces en español que tiene tu dispositivo. Solo se ofrecen las variedades disponibles ahora mismo; ninguna se considera más correcta que otra.'),
        h('div', { class: 'field' }, h('label', { for: 'set-dialect' }, 'Variedad del español'), dsel), h('div', { class: 'field' }, h('label', { for: 'set-voice' }, 'Voz'), vsel));
    }
    L.Audio.ready().then(drawVoices); drawVoices();
    audio.append(voiceBox, h('div', { class: 'field' }, h('label', { for: 'set-rate' }, 'Velocidad de lectura: ', rv), rate), h('div', { class: 'field' }, h('label', { for: 'set-vol' }, 'Volumen'), vol),
      h('div', { class: 'row' }, L.Audio.btn('Hola, ¿cómo estás? Me llamo Lucía y vivo en Sevilla.', { label: 'Probar la voz', name: 'prueba' }), h('span', { class: 'muted' }, 'Probar la voz')));
    root.appendChild(audio);

    // Ejercicios
    const strict = h('input', { type: 'checkbox', id: 'set-strict', checked: st.strictAccents ? '' : null, onchange: (e) => setSetting('strictAccents', e.target.checked) });
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Ejercicios escritos'), h('div', { class: 'field' }, h('label', { for: 'set-strict' }, strict, ' Exigir las tildes al escribir'), h('p', { class: 'muted' }, 'Si lo desactivas, una respuesta correcta sin tilde cuenta como acierto, pero la corrección te recuerda la tilde.'))));

    // Objetivos
    const g = S.prog.goals;
    const lessons = h('select', { class: 'inp', id: 'goal-l', onchange: async (e) => { g.lessonsPerWeek = +e.target.value; S.markProg(); await U.save(true); } }, [1, 2, 3, 5, 7, 10].map((n) => h('option', { value: n, selected: g.lessonsPerWeek === n ? '' : null }, n + (n === 1 ? ' lección por semana' : ' lecciones por semana'))));
    const mins = h('select', { class: 'inp', id: 'goal-m', onchange: async (e) => { g.minutesPerDay = +e.target.value; S.markProg(); await U.save(true); } }, [5, 10, 15, 20, 30, 45].map((n) => h('option', { value: n, selected: g.minutesPerDay === n ? '' : null }, n + ' minutos al día')));
    const focus = h('div', { class: 'row' }, S.SKILLS.map((s) => { const cb = h('input', { type: 'checkbox', id: 'f-' + s, checked: g.focus.includes(s) ? '' : null, onchange: async () => { g.focus = S.SKILLS.filter((k) => document.getElementById('f-' + k).checked); S.markProg(); await U.save(true); } }); return h('label', { for: 'f-' + s, class: 'chip-tag' }, cb, ' ' + s); }));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Mi plan de aprendizaje'), h('p', { class: 'muted' }, 'Tu objetivo orienta las sugerencias de «Mi progreso». Es flexible: puedes cambiarlo cuando quieras y no es un castigo si vas más despacio.'),
      h('div', { class: 'field' }, h('label', { for: 'goal-l' }, 'Objetivo semanal'), lessons), h('div', { class: 'field' }, h('label', { for: 'goal-m' }, 'Tiempo diario'), mins), h('div', { class: 'field' }, h('label', null, 'Habilidades en las que quiero centrarme'), focus)));

    // Prueba de nivel
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Prueba de nivel'),
      S.prog.placement ? h('p', null, 'Resultado actual: ', h('strong', null, 'Nivel ' + S.startStage() + ' de 30'), ' (' + L.fmtDate(S.prog.placement.date) + ').') : h('p', null, 'Todavía no has hecho la prueba de nivel.'),
      h('p', { class: 'muted' }, 'Repetirla no borra lo que ya has completado. Si el nuevo resultado es más alto, se desbloquean niveles y se abren sus lecciones para repasar; si es más bajo, tu progreso se conserva y simplemente se guarda el resultado.'),
      h('a', { class: 'btn btn-ghost', href: '#/prueba-de-nivel' }, S.prog.placement ? 'Repetir la prueba de nivel' : 'Hacer la prueba de nivel')));

    // Datos
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Mis datos y privacidad'),
      h('p', null, 'Tu progreso vive en este dispositivo (en el almacenamiento del navegador). No se sincroniza automáticamente con otros dispositivos. Pide permiso al micrófono solo si pulsas «Grabar» en Pronunciación.'),
      h('p', null, S.prog.lastBackup ? 'Última copia de seguridad: ' + L.fmtDateTime(S.prog.lastBackup) + '.' : 'Todavía no has hecho una copia de seguridad.'),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: () => L.accountFlows.exportFlow() }, 'Export My Data'), h('button', { class: 'btn btn-ghost', onclick: () => L.accountFlows.importFlow() }, 'Import My Data'), h('a', { class: 'btn btn-ghost', href: '#/cuenta' }, 'Cuenta y copias')),
      h('p', { class: 'muted', style: 'margin-top:10px' }, 'Si borras los datos del navegador o desinstalas la aplicación sin copia de seguridad, el progreso se pierde.')));

    // Sesión
    if (!A.isGuest()) root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Sesión'), h('p', null, 'Has iniciado sesión como ' + A.user.name + '. Cerrar sesión no borra tus datos.'), h('button', { class: 'btn btn-ghost', onclick: async () => { await A.signOut(); L.refreshAcct(); L.toast('Sesión cerrada. Tus datos siguen en este dispositivo.', 'ok', 3500); location.hash = '#/'; L.render(); } }, 'Cerrar sesión')));

    // Avanzado
    const info = h('p', { class: 'muted', 'aria-live': 'polite' }, 'Calculando el espacio…');
    (async () => { try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); info.textContent = 'Espacio usado por Languway Spanish en este dispositivo: ' + (e.usage / 1048576).toFixed(1) + ' MB.'; } else info.textContent = 'Este navegador no informa del espacio usado.'; } catch (e) { info.textContent = 'No se pudo calcular el espacio.'; } })();
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Avanzado'), info,
      h('div', { class: 'field' }, h('h3', null, 'Instalar y compartir'), h('p', { class: 'muted' }, 'Instala la aplicación, comparte el enlace o muestra el código QR.'), h('a', { class: 'btn btn-primary', href: '#/instalar' }, h('span', { 'aria-hidden': 'true' }, '📲'), ' Instalar y compartir')),
      h('div', { class: 'field' }, h('h3', null, 'Almacenamiento seguro'), h('p', { class: 'muted' }, 'Pide al navegador que no borre tu progreso cuando falte espacio. El navegador puede aceptar o rechazar la petición.'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { try { const ok = navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; L.toast(ok ? 'Almacenamiento protegido.' : 'El navegador no lo ha concedido (instalar la aplicación suele ayudar).', ok ? 'ok' : '', 5000); } catch (e) { L.toast('No disponible en este navegador.', 'err'); } } }, 'Proteger mi progreso')),
      h('div', { class: 'field' }, h('h3', null, 'Actualizar la aplicación'), h('p', { class: 'muted' }, 'Busca una versión nueva de los archivos de la aplicación. Tu progreso no se toca.'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (!reg) { L.toast('No hay versión instalada que actualizar. Recarga la página.', ''); return; } await reg.update(); L.toast('Comprobado. Si hay una novedad, verás el aviso de actualización.', 'ok', 4500); } catch (e) { L.toast('No se pudo comprobar ahora (¿sin conexión?).', 'err'); } } }, 'Buscar actualizaciones')),
      h('div', { class: 'field' }, h('h3', null, 'Limpiar la copia de la aplicación'), h('p', { class: 'muted' }, 'Borra los archivos guardados para el modo sin conexión y vuelve a descargarlos. No borra tu cuenta ni tu progreso. Úsalo si algo se ve raro tras una actualización.'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { const ok = await L.modal({ title: '¿Limpiar la copia de la aplicación?', body: 'Se recargará la página. Tu cuenta y tu progreso no se borran.', escValue: false, actions: [{ label: 'Cancelar', value: false }, { label: 'Limpiar y recargar', value: true, primary: true }] }); if (!ok) return; try { await S.flush(); if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : []; await Promise.all(regs.map((r) => r.unregister())); } catch (e) {} location.reload(); } }, 'Limpiar y recargar')),
      h('div', { class: 'field' }, h('h3', null, 'Restablecer los ajustes'), h('p', { class: 'muted' }, 'Vuelve al aspecto, audio y ejercicios por defecto. No borra lecciones ni palabras.'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { const ok = await L.modal({ title: '¿Restablecer los ajustes?', body: 'Se recuperan los valores por defecto de apariencia, audio y ejercicios.', escValue: false, actions: [{ label: 'Cancelar', value: false }, { label: 'Restablecer', value: true, primary: true }] }); if (!ok) return; Object.assign(S.prog.settings, S.defaultProg('x').settings); S.markProg(); await U.save(true); L.applyPrefs(); document.documentElement.setAttribute('data-motion', 'auto'); L.render(); } }, 'Restablecer'))));

    // Privacidad y créditos
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Privacidad y créditos'),
      h('p', null, 'Languway Spanish no usa publicidad ni rastreadores y no carga código de terceros. Sin cuenta, tu progreso se queda solo en este dispositivo. Si creas una cuenta, solo pedimos un nombre de usuario y una contraseña (nunca un correo): se guardan junto con tu progreso para que puedas continuar en otro teléfono. La contraseña se guarda cifrada y puedes borrar tu cuenta cuando quieras desde «Account & Backup».'),
      h('p', null, 'Las voces que oyes son las de tu dispositivo. El micrófono solo se activa cuando pulsas «Grabar», y la grabación no sale de tu dispositivo.'),
      h('p', { class: 'muted' }, 'Las lecciones, textos, ejercicios, historias e iconos son contenido original de Languway. El logotipo pertenece a sus autores. Los certificados son de finalización de la plataforma y no son títulos oficiales.')));
    // Nuestros trabajos
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'De nuestros trabajos'), h('p', { class: 'muted' }, 'Otros proyectos de la serie Languway (se abren en una pestaña nueva y necesitan conexión a internet):'),
      h('ul', { style: 'list-style:none;padding:0;margin:0' },
        h('li', { style: 'margin:8px 0' }, h('a', { href: 'https://2009malek11-source.github.io/Languway-Translator/', target: '_blank', rel: 'noopener noreferrer' }, 'Languway Translator ↗'), h('div', { class: 'muted' }, 'Aplicación de traducción de la serie Languway.')),
        h('li', { style: 'margin:8px 0' }, h('a', { href: 'https://2009malek11-source.github.io/Languway-English/', target: '_blank', rel: 'noopener noreferrer' }, 'Languway English ↗'), h('div', { class: 'muted' }, 'Sitio para aprender inglés.')))));
    return root;
  }, 'Configuración');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U;
  const DAY = 86400000;
  // Secciones que el entrenador vigila: ruta -> [clave, nombre ES, nombre EN, enlace]
  const SECTIONS = {
    '/gramatica': ['gram', 'Gramática', 'Grammar'],
    '/vocabulario': ['vocab', 'Vocabulario', 'Vocabulary'],
    '/pronunciacion': ['pron', 'Pronunciación', 'Pronunciation'],
    '/escuchar': ['listen', 'Comprensión auditiva', 'Listening'],
    '/leer': ['read', 'Lectura', 'Reading'],
    '/escribir': ['write', 'Escritura', 'Writing'],
    '/historias': ['stories', 'Historias', 'Stories'],
    '/repaso': ['review', 'Repaso diario', 'Daily review'],
  };
  const HREF = { gram: '#/gramatica', vocab: '#/vocabulario', pron: '#/pronunciacion', listen: '#/escuchar', read: '#/leer', write: '#/escribir', stories: '#/historias', review: '#/repaso' };

  const C2 = (L.coach = {});
  C2.lang = () => (S.prog && S.prog.settings && S.prog.settings.coachLang) || 'both';
  // Muestra la versión en español, en inglés o en ambos según la preferencia
  C2.pair = function (es, en, cls) {
    const m = C2.lang(); const box = h('div', { class: cls || '' });
    if (m !== 'en') box.appendChild(h('div', { lang: 'es' }, es));
    if (m !== 'es') box.appendChild(h('div', { lang: 'en', class: m === 'both' ? 'muted coach-en' : '' }, en));
    return box;
  };
  C2.touch = function (path) {
    if (!S.prog) return;
    const key = Object.keys(SECTIONS).find((p) => path === p || path.startsWith(p + '/'));
    if (!key) return;
    const k = SECTIONS[key][0];
    S.prog.seen = S.prog.seen || {};
    if (Date.now() - (S.prog.seen[k] || 0) > 600000) { S.prog.seen[k] = Date.now(); S.markProg(); }
  };

  // ---- índice pregunta -> lección (para enlazar la regla) ----
  let qIdx = null;
  function lessonOf(q, fallback) {
    if (!qIdx) {
      qIdx = new Map();
      Object.keys(C.lessons).forEach((id) => { const les = C.lessons[id]; [].concat(les.practice || [], les.quiz || []).forEach((x) => { if (x && x.id) qIdx.set(x.id, id); }); });
    }
    return qIdx.get(q.id) || fallback || null;
  }
  // Explicación en inglés («en palabras sencillas») para las lecciones A1 y A2
  C2.enHelp = function (id) {
    const e = C.enHelp && C.enHelp[id]; if (!e || C2.lang() === 'es') return null;
    return h('div', { class: 'card en-help', lang: 'en' }, h('h3', null, 'In simple words · En palabras sencillas'), e.lines.map((x) => h('p', { html: x })));
  };
  C2.openRule = function (lessonId) {
    const les = C.lessons[lessonId]; if (!les) return;
    const body = h('div', null,
      h('p', { class: 'muted' }, 'Lección: ' + les.title + ' (' + les.level + ')'),
      h('div', { class: 'card' }, h('h3', null, les.explain.title), U.blocks(les.explain.body)), C2.enHelp(les.id),
      les.vocab.length ? h('div', { class: 'card' }, h('h3', null, 'Vocabulary · Vocabulario'), h('ul', { class: 'exlist' }, les.vocab.map((v) => h('li', null, h('b', null, v[0]), ' — ' + v[2], v[4] ? h('div', { class: 'muted' }, v[4]) : null)))) : null);
    L.modal({ title: 'Entrenador · Coach', body, actions: [{ label: 'Cerrar', value: null, primary: true }], closeLabel: 'Cerrar' });
  };

  function terms(q, r) {
    const out = []; const seen = new Set();
    const add = (t) => { t = String(t || '').trim().toLowerCase().replace(/^[¿¡«"']+|[?!»"'.,;:]+$/g, ''); if (!t || seen.has(t)) return; seen.add(t); const g = C.gloss && C.gloss[t]; if (g) out.push([t, Array.isArray(g) ? g.join(' / ') : g]); };
    (String(q.q || '').match(/«([^»]{1,40})»/g) || []).forEach((m) => add(m.slice(1, -1)));
    add(r.correct); add(q.a);
    return out.slice(0, 4);
  }

  // Bloque de explicación que se añade a la corrección de cada pregunta
  C2.feedback = function (q, r, opts) {
    const box = h('div', { class: 'coach', role: 'note' });
    box.appendChild(h('div', { class: 'coach-h' }, h('strong', null, 'Entrenador'), ' · Coach'));
    if (r.ok) {
      box.appendChild(C2.pair('Muy bien: es la respuesta correcta. Fíjate en la explicación para recordarla.', 'Well done: that is the correct answer. Read the explanation so you remember why.'));
      if (r.kind === 'tilde') box.appendChild(C2.pair('Cuidado con la tilde: se escribe «' + r.correct + '».', 'Watch the accent mark: it is written «' + r.correct + '».'));
    } else {
      const given = r.given ? '«' + r.given + '»' : null;
      if (r.kind === 'tilde') box.appendChild(C2.pair('Tu respuesta casi es correcta, pero falta la tilde. En español la tilde puede cambiar el significado (por ejemplo, «si» y «sí»).', 'Your answer is almost right, but the written accent is missing. In Spanish an accent can change the meaning (for example, «si» and «sí»).'));
      else if (r.kind === 'ortografia') box.appendChild(C2.pair('Tu respuesta es muy parecida; revisa letra por letra cómo se escribe la palabra.', 'Your answer is very close; check the spelling letter by letter.'));
      else if (r.kind === 'empty') box.appendChild(C2.pair('No escribiste nada. Intenta responder siempre: equivocarse también enseña.', 'You did not write anything. Always try to answer: mistakes teach too.'));
      else {
        box.appendChild(C2.pair(given ? 'Elegiste ' + given + ', pero la respuesta correcta es «' + r.correct + '».' : 'La respuesta correcta es «' + r.correct + '».', given ? 'You chose ' + given + ', but the correct answer is «' + r.correct + '».' : 'The correct answer is «' + r.correct + '».'));
        box.appendChild(C2.pair('Lee la explicación de arriba y compárala con tu respuesta. Si sigue sin quedar claro, abre la regla.', 'Read the explanation above and compare it with your answer. If it is still unclear, open the rule.'));
      }
    }
    const tl = terms(q, r);
    if (tl.length) box.appendChild(h('div', { class: 'coach-gl' }, h('b', null, 'Vocabulary · Vocabulario: '), tl.map((t, i) => h('span', null, (i ? ' · ' : '') + '«' + t[0] + '» = ' + t[1]))));
    const lid = lessonOf(q, opts && opts.lessonId);
    if (lid && C.lessons[lid]) box.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => C2.openRule(lid) }, 'Ver la regla · See the rule'), h('a', { class: 'btn btn-ghost', href: '#/entrenador/regla/' + lid }, 'Modo fácil · Easy mode')));
    return box;
  };

  // ---- consejos del entrenador (inicio y página propia) ----
  C2.tips = function () {
    const tips = []; const now = Date.now();
    const st = S.stats();
    if (!S.prog) return tips;
    const due = S.dueWords().length;
    if (due) tips.push({ es: 'Tienes ' + due + (due === 1 ? ' palabra' : ' palabras') + ' para repasar hoy. Repasar a tiempo es lo que fija el vocabulario.', en: 'You have ' + due + (due === 1 ? ' word' : ' words') + ' to review today. Reviewing on time is what makes vocabulary stick.', href: '#/repaso', label: 'Repasar ahora · Review now' });
    // Lecciones sin superar
    const failed = Object.keys(S.prog.lessons).filter((id) => { const r = S.prog.lessons[id]; return r && !r.done && r.attempts > 0 && C.lessons[id]; });
    if (failed.length) { const id = failed[0]; tips.push({ es: 'La lección «' + C.lessons[id].title + '» todavía no está superada (necesitas ' + S.PASS + ' %). Repasa la explicación y vuelve a intentarlo.', en: 'The lesson “' + C.lessons[id].title + '” is not passed yet (you need ' + S.PASS + '%). Review the explanation and try again.', href: '#/leccion/' + id, label: 'Abrir la lección · Open the lesson' }); }
    // Temas débiles
    const weak = S.weakTags(2);
    if (weak.length) tips.push({ es: 'Te equivocas más en: ' + weak.join(', ') + '. Practica estos temas con ejercicios nuevos.', en: 'You make most mistakes in: ' + weak.join(', ') + '. Practise these topics with new exercises.', href: '#/errores', label: 'Practicar errores · Practise mistakes' });
    // Secciones sin visitar hace tiempo
    if (st.lessons >= 2) {
      const seen = S.prog.seen || {};
      Object.keys(SECTIONS).forEach((p) => {
        const k = SECTIONS[p][0]; if (k === 'review') return;
        const t = seen[k]; const days = t ? Math.floor((now - t) / DAY) : null;
        if (days === null) tips.push({ es: 'Todavía no has entrado en «' + SECTIONS[p][1] + '». Dedícale unos minutos esta semana.', en: 'You have not opened “' + SECTIONS[p][2] + '” yet. Spend a few minutes on it this week.', href: HREF[k], label: SECTIONS[p][1] + ' · ' + SECTIONS[p][2], low: true });
        else if (days >= 4) tips.push({ es: 'Hace ' + days + ' días que no entras en «' + SECTIONS[p][1] + '». Vuelve a leerla para no olvidar lo aprendido.', en: 'It has been ' + days + ' days since you opened “' + SECTIONS[p][2] + '”. Go back to it so you do not forget what you learned.', href: HREF[k], label: SECTIONS[p][1] + ' · ' + SECTIONS[p][2] });
      });
    }
    // Inactividad
    const la = S.lastActivity();
    if (la) { const d = Math.floor((now - new Date(la + 'T12:00:00').getTime()) / DAY); if (d >= 3) tips.unshift({ es: 'Hace ' + d + ' días que no estudias. Con 10 minutos hoy retomas el ritmo.', en: 'You have not studied for ' + d + ' days. Ten minutes today will get you back on track.', href: '#/', label: 'Continuar · Continue' }); }
    // Habilidad más floja
    const ws = S.weakSkills(); if (ws.length) tips.push({ es: 'Tu habilidad más floja ahora mismo es «' + ws[0].s + '» (' + ws[0].p + ' %). Practícala un poco cada día.', en: 'Your weakest skill right now is “' + ws[0].s + '” (' + ws[0].p + '%). Practise it a little every day.', href: '#/progreso', label: 'Ver mi progreso · See my progress' });
    return tips.sort((a, b) => (a.low ? 1 : 0) - (b.low ? 1 : 0));
  };
  C2.card = function (max, full) {
    const tips = C2.tips(); const list = tips.slice(0, max || 3);
    const card = h('section', { class: 'card coach-card' }, h('h2', null, 'Tu entrenador · Your coach'));
    if (!list.length) card.appendChild(C2.pair('Vas muy bien: no hay nada pendiente. Sigue con la siguiente lección.', 'You are doing great: nothing is pending. Carry on with the next lesson.'));
    list.forEach((t) => card.appendChild(h('div', { class: 'coach-tip' }, C2.pair(t.es, t.en), h('a', { class: 'btn btn-ghost', href: t.href }, t.label))));
    if (!full && tips.length > list.length) card.appendChild(h('a', { href: '#/entrenador' }, 'Ver todos los consejos · See all tips'));
    return card;
  };

  route('/entrenador', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Entrenador', 'Tu guía personal: corrige, explica y te recuerda qué repasar. / Your personal guide: it corrects, explains and reminds you what to review.'));
    root.appendChild(h('div', { class: 'alert' }, h('strong', null, 'Cómo funciona · How it works: '), 'el entrenador usa tus resultados guardados en este dispositivo y las explicaciones de cada lección. No es un chat ni envía tus datos a ningún sitio. / The coach uses your results saved on this device and each lesson’s explanations. It is not a chat and sends your data nowhere.'));
    root.appendChild(h('div', { class: 'card' }, h('h2', null, 'Reglas y explicaciones · Rules'), h('p', null, 'Todas las reglas de todas las lecciones, explicadas frase por frase. / Every rule from every lesson, explained one sentence at a time.'), h('a', { class: 'btn btn-primary', href: '#/entrenador/reglas' }, 'Abrir la biblioteca de reglas · Open the rules library')));
    root.appendChild(C2.card(50, true));
    const sel = h('select', { class: 'inp', 'aria-label': 'Idioma del entrenador · Coach language' }, [['both', 'Español + English'], ['es', 'Solo español'], ['en', 'English only']].map((o) => h('option', { value: o[0], selected: C2.lang() === o[0] ? '' : null }, o[1])));
    sel.addEventListener('change', () => { S.prog.settings.coachLang = sel.value; S.markProg(); U.save(true); L.toast('Guardado · Saved', 'ok'); });
    root.appendChild(h('div', { class: 'card' }, h('h3', null, 'Idioma del entrenador · Coach language'), sel));
    return root;
  }, 'Entrenador');

  // ---------- biblioteca de reglas (todas las explicaciones de todas las lecciones) ----------
  const stripTags = (t) => String(t || '').replace(/<[^>]*>/g, ' ');
  const blockText = (b) => (typeof b === 'string' ? stripTags(b) : b && b.t === 'table' ? b.head.concat([].concat.apply([], b.rows)).map(stripTags).join(' ') : b && b.t === 'ex' ? b.list.join(' ') : b && b.t === 'tip' ? b.text : b && b.t === 'compare' ? b.cols.map((c) => c.title + ' ' + stripTags(c.text)).join(' ') : '');
  let ruleIdx = null;
  function rules() {
    if (ruleIdx) return ruleIdx;
    ruleIdx = [];
    C.levels.forEach((lv) => C.lessonList(lv.id).forEach((r) => {
      const les = C.lessons[r.id]; if (!les || !les.explain) return;
      ruleIdx.push({ id: r.id, level: les.level, title: les.explain.title, lesson: les.title, hay: L.stripAcc(L.norm([les.explain.title, les.title, les.topic, les.goal].join(' ') + ' ' + les.explain.body.map(blockText).join(' '))) });
    }));
    return ruleIdx;
  }
  // Divide un párrafo en frases cortas (una por línea) sin romper las etiquetas ni las abreviaturas
  function sentences(html) {
    return String(html).split(/(?<=[.!?:;])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«<(])/).map((x) => x.trim()).filter(Boolean);
  }
  function easyBlocks(blocks) {
    const box = h('div', { class: 'explain easy' });
    blocks.forEach((b) => {
      if (typeof b === 'string') sentences(b).forEach((x, i) => box.appendChild(h('p', { html: x, class: i === 0 ? 'easy-first' : '' })));
      else box.appendChild(U.blocks([b]));
    });
    return box;
  }

  route('/entrenador/reglas', ({ q }) => {
    const root = h('div');
    root.appendChild(U.pageHead('Reglas y explicaciones', 'Todas las reglas de todas las lecciones en un solo lugar. Busca un tema y ábrelo en modo fácil. / All the rules from every lesson in one place. Search a topic and open it in easy mode.'));
    const search = h('input', { class: 'inp', type: 'search', 'aria-label': 'Buscar una regla · Search a rule', placeholder: 'Buscar (p. ej. ser, estar, subjuntivo, tilde)… / Search…', value: (q && q.q) || '' });
    const chips = h('div', { class: 'row' });
    let lvl = '';
    ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach((x) => { const b = h('button', { type: 'button', class: 'btn btn-ghost', 'aria-pressed': x === '' ? 'true' : 'false', onclick: () => { lvl = x; chips.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', y === b ? 'true' : 'false')); draw(); } }, x || 'Todos · All'); chips.appendChild(b); });
    root.appendChild(h('div', { class: 'card' }, search, h('div', { style: 'margin-top:10px' }, chips)));
    const host = h('div', { class: 'grid g3', style: 'margin-top:12px' }); root.appendChild(host);
    function draw() {
      const nx = L.stripAcc(L.norm(search.value)); host.innerHTML = '';
      const list = rules().filter((r) => (!lvl || r.level === lvl) && (!nx || r.hay.includes(nx))).slice(0, 120);
      if (!list.length) { host.appendChild(U.empty('🔎', 'No hay reglas que coincidan. / No matching rules.')); return; }
      list.forEach((r) => host.appendChild(h('a', { class: 'card', href: '#/entrenador/regla/' + r.id, style: 'text-decoration:none;color:inherit' }, h('div', { class: 'row sb' }, h('span', { class: 'chip-tag' }, r.level), h('span', { class: 'muted' }, r.id)), h('h3', null, r.title), h('p', { class: 'muted' }, r.lesson))));
    }
    search.addEventListener('input', L.debounce(draw, 150)); draw();
    return root;
  }, 'Reglas');

  route('/entrenador/regla/:id', ({ params }) => {
    const les = C.lessons[params.id];
    const root = h('div');
    if (!les || !les.explain) { root.appendChild(U.empty('🧭', 'No encontramos esta regla.', h('a', { class: 'btn btn-primary', href: '#/entrenador/reglas' }, 'Ver todas las reglas'))); return root; }
    root.appendChild(U.pageHead(les.explain.title, 'Nivel ' + les.level + ' · Lección: ' + les.title));
    let easy = !(S.prog.settings && S.prog.settings.easyRules === false);
    const host = h('div', { class: 'card' });
    const tog = h('button', { type: 'button', class: 'btn btn-ghost', 'aria-pressed': String(easy) });
    function draw() {
      host.innerHTML = '';
      tog.textContent = easy ? 'Modo fácil: activado · Easy mode: on' : 'Modo fácil: desactivado · Easy mode: off';
      tog.setAttribute('aria-pressed', String(easy));
      host.appendChild(h('div', { class: 'easy-goal' }, h('b', null, 'Qué vas a aprender · What you will learn: '), les.goal || ''));
      host.appendChild(easy ? easyBlocks(les.explain.body) : U.blocks(les.explain.body));
    }
    tog.addEventListener('click', () => { easy = !easy; S.prog.settings.easyRules = easy; S.markProg(); draw(); });
    root.appendChild(h('div', { class: 'row', style: 'margin-bottom:10px' }, tog, h('a', { class: 'btn btn-ghost', href: '#/entrenador/reglas' }, 'Todas las reglas · All rules')));
    draw(); root.appendChild(host);
    const en = C2.enHelp(les.id); if (en) root.appendChild(en);
    root.appendChild(C2.pair('Lee una frase a la vez. Si algo no se entiende, mira los ejemplos de abajo y escucha cada uno.', 'Read one sentence at a time. If something is unclear, look at the examples below and listen to each one.', 'muted'));
    if (les.vocab && les.vocab.length) root.appendChild(h('div', { class: 'card' }, h('h3', null, 'Vocabulario de esta regla · Vocabulary'), h('ul', { class: 'exlist' }, les.vocab.map((v) => h('li', null, L.Audio.btn(v[0], { small: true, name: v[0] }), h('span', null, h('b', null, v[0]), ' — ' + v[2], v[3] ? h('div', { class: 'muted' }, v[3]) : null, v[4] ? h('div', { class: 'muted' }, v[4]) : null))))));
    root.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/leccion/' + les.id }, 'Practicar esta lección · Practise this lesson')));
    return root;
  }, 'Regla');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const S = L.S, A = L.A, U = L.U;

  function field(id, label, type, o) {
    o = o || {};
    const inp = h('input', { id, type, name: id, autocomplete: o.auto || 'off', required: o.required ? '' : null, 'aria-describedby': id + '-err', value: o.value || '', inputmode: o.inputmode || null, maxlength: o.maxlength || null });
    const err = h('div', { class: 'err', id: id + '-err', role: 'alert' });
    const wrap = h('div', { class: 'field' }, h('label', { for: id }, label), inp, err);
    wrap.setErr = (m) => { err.textContent = m || ''; inp.classList.toggle('bad', !!m); inp.setAttribute('aria-invalid', m ? 'true' : 'false'); };
    wrap.inp = inp;
    return wrap;
  }
  function pwToggle(f) {
    const b = h('button', { type: 'button', class: 'link-btn', onclick: () => { const t = f.inp.type === 'password'; f.inp.type = t ? 'text' : 'password'; b.textContent = t ? 'Hide password' : 'Show password'; } }, 'Show password');
    f.appendChild(b); return f;
  }
  const secureWarn = () => (!L.crypto.available() ? h('div', { class: 'alert err', role: 'alert' }, 'For your safety, this page only works over a secure (https://) connection. Please open the site from its https:// address.') : null);
  const limits = () => h('details', { class: 'alert' }, h('summary', { style: 'cursor:pointer;font-weight:700' }, 'How accounts work'),
    h('p', null, 'An account needs only a username and a password. No email address and no other personal information is asked for.'),
    h('p', null, 'When you are signed in, your progress is also saved online under your username, so you can continue on another phone by signing in there. Your password is never stored as plain text.'),
    h('p', null, h('strong', null, 'There is no email, so a forgotten password cannot be reset. '), 'Choose a password you will remember, and keep a backup file as a safety copy.'),
    h('p', null, 'You can also learn without an account: your progress is then saved only on this device. Anyone who controls an unlocked device can see what is on it.'));

  function authView(mode, q) {
    const root = h('div', { class: 'auth-box' });
    const sign = mode === 'signin';
    const card = h('div', { class: 'card' });
    card.appendChild(h('h1', { id: 'page-title', tabindex: '-1' }, sign ? 'Sign In' : 'Create Account'));
    const sw = secureWarn(); if (sw) card.appendChild(sw);
    const formErr = h('div', { class: 'alert err', role: 'alert', hidden: true });
    card.appendChild(formErr);
    const f = {};
    const form = h('form', { novalidate: '' });
    form.appendChild(f.username = field('username', 'Username', 'text', { auto: 'username', maxlength: 20 }));
    f.username.inp.setAttribute('autocapitalize', 'none'); f.username.inp.setAttribute('autocorrect', 'off'); f.username.inp.setAttribute('spellcheck', 'false');
    if (!sign) form.appendChild(h('p', { class: 'muted', style: 'margin-top:-8px' }, '3 to 20 characters: lowercase letters, numbers or underscore (_).'));
    form.appendChild(f.password = pwToggle(field('password', 'Password', 'password', { auto: sign ? 'current-password' : 'new-password' })));
    if (!sign) {
      form.appendChild(h('p', { class: 'muted', style: 'margin-top:-8px' }, '8 to 64 characters, with at least one letter and one number.'));
      form.appendChild(f.confirm = field('confirm', 'Confirm Password', 'password', { auto: 'new-password' }));
    }
    let remember, keep;
    if (sign) {
      remember = h('input', { type: 'checkbox', id: 'remember', checked: '' });
      form.appendChild(h('div', { class: 'row sb', style: 'margin-bottom:14px' }, h('label', { for: 'remember' }, remember, ' Remember Me'), h('a', { href: '#/cuenta/olvide' }, 'Forgot Password?')));
    } else if (S.stats().answered || S.stats().words || S.prog.placement) {
      keep = h('input', { type: 'checkbox', id: 'keep', checked: '' });
      form.appendChild(h('div', { class: 'field' }, h('label', { for: 'keep' }, keep, ' Keep the progress I already made on this device')));
    }
    const btn = h('button', { class: 'btn btn-primary', type: 'submit', style: 'width:100%' }, sign ? 'Sign In' : 'Create Account');
    form.appendChild(btn);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formErr.hidden = true; ['username', 'password', 'confirm'].forEach((k) => f[k] && f[k].setErr(''));
      btn.disabled = true; btn.textContent = sign ? 'Signing in…' : 'Creating account…';
      let res;
      try {
        res = sign
          ? await A.signIn({ username: f.username.inp.value, password: f.password.inp.value, remember: remember.checked })
          : await A.signUp({ username: f.username.inp.value, password: f.password.inp.value, confirm: f.confirm.inp.value, keepGuest: !!(keep && keep.checked) });
      } catch (err) { res = { ok: false, errors: { form: 'Something went wrong. Please try again.' } }; }
      btn.disabled = false; btn.textContent = sign ? 'Sign In' : 'Create Account';
      if (!res.ok) {
        Object.keys(res.errors).forEach((k) => { if (f[k]) f[k].setErr(res.errors[k]); });
        if (res.errors.form) { formErr.hidden = false; formErr.textContent = res.errors.form; }
        const first = L.$('.bad', form); first && first.focus();
        return;
      }
      L.refreshAcct();
      L.toast(res.offline ? 'Signed in without internet. Sign in again when you are online to save your progress online.' : 'Welcome, ' + res.user.name + '!', 'ok', res.offline ? 5000 : 3000);
      const next = S.nextLesson();
      location.hash = !sign && !S.prog.placement ? '#/prueba-de-nivel' : (S.prog.lastLesson ? '#/' : '#/');
    });
    card.appendChild(form);
    card.appendChild(h('p', { class: 'center', style: 'margin-top:16px' }, sign ? 'New here? ' : 'Already have an account? ', h('a', { href: sign ? '#/cuenta/crear' : '#/cuenta/entrar' }, sign ? 'Create Account' : 'Sign In')));
    card.appendChild(h('p', { class: 'center muted' }, 'You can also learn without an account: your progress is saved on this device as a guest.'));
    root.append(card, h('div', { style: 'margin-top:14px' }, limits()));
    if (sign) root.appendChild(h('div', { class: 'card', style: 'margin-top:14px' }, h('h3', null, 'Moving from another phone?'), h('p', null, 'If you have a backup file, you can restore your account on this device.'), restoreAccountButton()));
    return root;
  }
  route('/cuenta/entrar', ({ q }) => (A.isGuest() ? authView('signin', q) : (location.hash = '#/cuenta', null)), 'Sign In');
  route('/cuenta/crear', ({ q }) => (A.isGuest() ? authView('create', q) : (location.hash = '#/cuenta', null)), 'Create Account');

  route('/cuenta/olvide', () => {
    const root = h('div', { class: 'auth-box' });
    root.appendChild(h('div', { class: 'card' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'Forgot Password?'),
      h('p', null, 'Accounts use only a username and a password, with no email address, so we cannot send you a reset link and we cannot recover the password for you.'),
      h('p', null, h('strong', null, 'Your options:')),
      h('ul', null, h('li', null, 'Try again: check Caps Lock and the exact username you used.'), h('li', null, 'If you have a backup file from before, create a new account from it with “Restore from a backup file”. Your learning progress comes back.'), h('li', null, 'Or create a new account and start again. You can keep learning as a guest in the meantime.')),
      h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/cuenta/entrar' }, 'Back to Sign In'), restoreAccountButton(), h('a', { class: 'btn btn-ghost', href: '#/cuenta/crear' }, 'Create Account'))));
    return root;
  }, 'Forgot Password');

  // ---------- leer y validar un archivo de copia ----------
  function pickFile() {
    return new Promise((res) => {
      const inp = h('input', { type: 'file', accept: '.json,application/json', style: 'position:fixed;left:-999px' });
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); res(f || null); });
      inp.addEventListener('cancel', () => { inp.remove(); res(null); });
      document.body.appendChild(inp); inp.click();
    });
  }
  async function readBackup() {
    const f = await pickFile(); if (!f) return null;
    if (f.size > 25 * 1024 * 1024) { L.toast('That file is too large to be a Languway backup.', 'err', 5000); return null; }
    let obj;
    try { obj = L.safeParse(await f.text()); } catch (e) { L.toast('This file is not a valid backup: it could not be read as JSON.', 'err', 6000); return null; }
    let v = S.validateBackup(obj);
    if (!v.ok) { L.toast(v.error, 'err', 7000); return null; }
    if (v.encrypted) {
      const pass = await askPassword('This backup is encrypted. Enter the backup password to open it.');
      if (pass == null) return null;
      try { obj = await L.crypto.decryptJSON(obj.package, pass); } catch (e) { L.toast('Wrong password, or the file is damaged. Nothing was changed.', 'err', 6000); return null; }
      v = S.validateBackup(obj);
      if (!v.ok) { L.toast(v.error, 'err', 7000); return null; }
    }
    return v;
  }
  function askPassword(msg, confirmMode) {
    const inp = h('input', { type: 'password', class: 'inp', autocomplete: 'off', 'aria-label': 'Backup password' });
    const inp2 = confirmMode ? h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'off', 'aria-label': 'Repeat the backup password', placeholder: 'Repeat the password' }) : null;
    const err = h('div', { class: 'err', role: 'alert' });
    const body = h('div', null, h('p', null, msg), inp, inp2, err);
    return new Promise((resolve) => {
      L.modal({ title: 'Backup password', body, escValue: null, actions: [{ label: 'Cancel', value: null }, { label: 'Continue', value: 'ok', primary: true }], closeLabel: 'Close' }).then((v) => { resolve(v === 'ok' ? inp.value : null); });
    });
  }
  function restoreAccountButton() {
    return h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => {
      const v = await readBackup(); if (!v) return;
      if (!(v.data.user.username || v.data.user.email)) { L.toast('This backup belongs to a guest profile. Sign in or continue as a guest, then use Import My Data.', 'err', 7000); return; }
      const un = h('input', { type: 'text', class: 'inp', autocomplete: 'username', maxlength: 20, autocapitalize: 'none', spellcheck: 'false', 'aria-label': 'Username', placeholder: 'Username' });
      const pw = h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'new-password', 'aria-label': 'New password', placeholder: 'New password' });
      const pw2 = h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'new-password', 'aria-label': 'Confirm new password', placeholder: 'Confirm Password' });
      const err = h('div', { class: 'err', role: 'alert' });
      const sm = S.dataSummary(v.data);
      const body = h('div', null, h('p', null, 'Backup for ', h('strong', null, v.data.user.username || v.data.user.name), ' — ' + sm.lessons + ' lessons completed, ' + sm.words + ' saved words.'),
        h('p', null, 'Choose a username and a password for the account. Passwords are never stored in backup files.'), un, pw, pw2, err);
      const r = await L.modal({ title: 'Restore account', body, actions: [{ label: 'Cancel', value: null }, { label: 'Restore Backup', value: 'ok', primary: true }] });
      if (r !== 'ok') return;
      const res = await A.createFromBackup(v.data, un.value, pw.value, pw2.value);
      if (!res.ok) { L.toast(res.error, 'err', 7000); return; }
      L.refreshAcct(); L.toast('Account restored. Welcome back, ' + res.user.name + '!', 'ok', 4000); location.hash = '#/';
    } }, 'Restore from a backup file');
  }

  // ---------- importar / exportar para la cuenta actual ----------
  async function exportFlow() {
    const enc = h('input', { type: 'checkbox', id: 'enc' });
    const body = h('div', null, h('p', null, 'The backup file contains your progress, words, results and settings. It never contains your password.'),
      h('div', { class: 'field' }, h('label', { for: 'enc' }, enc, ' Encrypt the file with a password')),
      h('p', { class: 'muted' }, 'If you encrypt it and forget the password, the backup cannot be opened.'));
    const r = await L.modal({ title: 'Export My Data', body, actions: [{ label: 'Cancel', value: null }, { label: 'Create backup file', value: 'go', primary: true }] });
    if (r !== 'go') return;
    let pass = null;
    if (enc.checked) {
      if (!L.crypto.available()) { L.toast('Encryption needs a secure (https://) connection.', 'err', 6000); return; }
      const inp = h('input', { type: 'password', class: 'inp', autocomplete: 'new-password', 'aria-label': 'Backup password' });
      const inp2 = h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'new-password', placeholder: 'Repeat the password', 'aria-label': 'Repeat the backup password' });
      const rr = await L.modal({ title: 'Backup password', body: h('div', null, h('p', null, 'Choose a password for this backup (at least 8 characters). You will need it to import the file.'), inp, inp2), actions: [{ label: 'Cancel', value: null }, { label: 'Encrypt and export', value: 'ok', primary: true }] });
      if (rr !== 'ok') return;
      if (inp.value.length < 8 || inp.value !== inp2.value) { L.toast('The passwords must match and have at least 8 characters.', 'err', 5000); return; }
      pass = inp.value;
    }
    const ring = L.ring(pass ? 'Cifrando la copia…' : 'Creando la copia…');
    try {
      const data = await S.exportData(pass); ring.done(true);
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const name = 'languway-spanish-backup-' + L.dayKey() + (pass ? '-encrypted' : '') + '.json';
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try { await navigator.share({ files: [file], title: 'Languway Spanish backup' }); L.toast('Backup ready.', 'ok'); L.render(); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      L.toast('Backup file created: ' + name, 'ok', 5000); L.render();
    } catch (e) { ring.done(false); L.toast('The backup could not be created.', 'err', 6000); }
  }
  async function importFlow() {
    const v = await readBackup(); if (!v) return;
    const d = v.data;
    if (d.accountId && d.accountId !== S.user.id && d.user && (d.user.username || d.user.email) && S.user.email && (d.user.username || d.user.email) !== S.user.email) {
      const go = await L.modal({ title: 'Different account', body: 'This backup was made for another account (' + (d.user.username || d.user.email) + '). You can still use its progress for the current account.', actions: [{ label: 'Cancel', value: null }, { label: 'Continue', value: 'ok', primary: true }] });
      if (go !== 'ok') return;
    }
    const cur = S.currentSummary(), inc = S.dataSummary(d);
    const newer = inc.updated > cur.updated ? 'The backup is newer than your current data.' : 'Your current data is newer than the backup.';
    const tbl = h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['', 'Current data', 'Backup'].map((x) => h('th', null, x)))),
      h('tbody', null, h('tr', null, h('td', null, 'Lessons completed'), h('td', null, cur.lessons), h('td', null, inc.lessons)), h('tr', null, h('td', null, 'Saved words'), h('td', null, cur.words), h('td', null, inc.words)),
        h('tr', null, h('td', null, 'Last change'), h('td', null, cur.updated ? L.fmtDateTime(cur.updated) : '—'), h('td', null, inc.updated ? L.fmtDateTime(inc.updated) : '—'))));
    const body = h('div', null, h('p', null, newer), tbl,
      v.ignored && (v.ignored.lessons || v.ignored.words) ? h('p', { class: 'muted' }, 'Some items that this app does not recognise were skipped safely (' + (v.ignored.lessons + v.ignored.words) + ').') : null,
      h('p', null, h('strong', null, 'Restore Backup'), ' replaces your current data with the backup. ', h('strong', null, 'Merge'), ' keeps the best of both (nothing is lost). ', h('strong', null, 'Keep Current Data'), ' changes nothing.'));
    const choice = await L.modal({ title: 'Import My Data', body, escValue: 'cancel', actions: [{ label: 'Cancel', value: 'cancel' }, { label: 'Keep Current Data', value: 'keep' }, { label: 'Merge', value: 'merge' }, { label: 'Restore Backup', value: 'restore', primary: true }] });
    if (choice === 'cancel' || choice === 'keep' || !choice) { if (choice === 'keep') L.toast('Your current data was kept.', '', 3000); return; }
    if (choice === 'restore') {
      const ok = await L.modal({ title: 'Replace current data?', body: 'Your current progress on this device will be replaced by the backup. Consider exporting a backup of the current data first.', escValue: false, actions: [{ label: 'Cancel', value: false }, { label: 'Yes, replace', value: true, danger: true }] });
      if (!ok) return;
    }
    try {
      if (choice === 'restore') await S.restoreFrom(d); else await S.mergeFrom(d);
      L.toast(choice === 'restore' ? 'Backup restored. Your progress is back.' : 'Data merged. Nothing was lost.', 'ok', 5000);
      L.refreshAcct(); location.hash = '#/'; L.render();
    } catch (e) { L.toast('The import failed and your current data was not modified. Please try another file.', 'err', 7000); }
  }
  async function deleteFlow() {
    const guest = A.isGuest();
    const online = A.hasCloud();
    const inp = h('input', { type: 'text', class: 'inp', 'aria-label': 'Type DELETE to confirm', autocomplete: 'off', placeholder: 'DELETE' });
    const pw = online ? h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'current-password', 'aria-label': 'Your password', placeholder: 'Your password' }) : null;
    const r = await L.modal({ title: guest ? 'Delete guest progress' : 'Delete account', body: h('div', null, h('p', null, 'This permanently deletes ' + (guest ? 'the progress saved as a guest' : 'this account and all its learning data' + (online ? ', online and on this device' : ' from this device')) + '. It cannot be undone. Export a backup first if you may want it later.'), h('p', null, 'Type DELETE to confirm.' + (online ? ' Then enter your password.' : '')), inp, pw), actions: [{ label: 'Cancel', value: false }, { label: 'Delete', value: true, danger: true }] });
    if (!r) return;
    if (inp.value.trim() !== 'DELETE') { L.toast('Not deleted: you did not type DELETE.', 'err', 4000); return; }
    try {
      const res = await A.deleteCurrent(pw ? pw.value : null);
      if (!res.ok) { L.toast(res.error, 'err', 6000); return; }
      L.refreshAcct(); L.toast('Account data deleted.', 'ok'); location.hash = '#/'; L.render();
    } catch (e) { L.toast('Could not delete the data.', 'err'); }
  }
  async function passwordFlow() {
    const a = h('input', { type: 'password', class: 'inp', autocomplete: 'current-password', 'aria-label': 'Current password', placeholder: 'Current password' });
    const b = h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'new-password', 'aria-label': 'New password', placeholder: 'New password' });
    const c = h('input', { type: 'password', class: 'inp', style: 'margin-top:8px', autocomplete: 'new-password', 'aria-label': 'Confirm new password', placeholder: 'Confirm Password' });
    const r = await L.modal({ title: 'Change password', body: h('div', null, a, b, c), actions: [{ label: 'Cancel', value: null }, { label: 'Save', value: 'ok', primary: true }] });
    if (r !== 'ok') return;
    const res = await A.changePassword(a.value, b.value, c.value);
    L.toast(res.ok ? 'Password changed.' : res.error, res.ok ? 'ok' : 'err', 5000);
  }

  route('/cuenta', () => {
    const root = h('div');
    root.appendChild(h('h1', { id: 'page-title', tabindex: '-1' }, 'Account & Backup'));
    const sw = secureWarn(); if (sw) root.appendChild(sw);
    const guest = A.isGuest();
    const who = h('section', { class: 'card' });
    if (guest) {
      who.append(h('h2', null, 'You are learning as a guest'), h('p', null, 'Your progress is saved on this device only. Create an account with just a username and a password to keep your progress online and continue on any phone.'),
        h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/cuenta/crear' }, 'Create Account'), h('a', { class: 'btn btn-ghost', href: '#/cuenta/entrar' }, 'Sign In'), restoreAccountButton()));
    } else {
      who.append(h('h2', null, A.user.name), h('p', { class: 'muted' }, '@' + (A.user.username || A.user.email) + ' · ' + (A.hasCloud() ? 'Saved online' : 'Not connected online: sign in again to sync') + ' · Account created ' + L.fmtDate(A.user.created) + ' · Last sign-in ' + L.fmtDateTime(A.user.lastLogin)),
        h('div', { class: 'row' }, h('button', { class: 'btn btn-ghost', onclick: passwordFlow }, 'Change password'), h('button', { class: 'btn btn-ghost', onclick: async () => { await A.signOut(); L.refreshAcct(); L.toast('Signed out. Your progress is saved in your account.', 'ok', 3500); location.hash = '#/'; L.render(); } }, 'Sign Out')));
    }
    root.appendChild(who);
    const last = S.prog.lastBackup;
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Backup and transfer'),
      h('p', null, last ? 'Last backup: ' + L.fmtDateTime(last) + '.' : 'You have not made a backup yet.'),
      h('p', null, 'To use your progress on another phone: 1) tap ', h('strong', null, 'Export My Data'), ' here; 2) send the file to the other phone (messages, email, cloud drive — your choice); 3) open the app there, sign in or create an account, and tap ', h('strong', null, 'Import My Data'), '.'),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: exportFlow }, 'Export My Data'), h('button', { class: 'btn btn-ghost', onclick: importFlow }, 'Import My Data')),
      h('p', { class: 'muted', style: 'margin-top:12px' }, 'When you are signed in, your progress is also saved online. A backup file is an extra safety copy you keep yourself.')));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, 'Storage on this device'), storageInfo()));
    root.appendChild(h('section', { class: 'card' }, h('h2', null, guest ? 'Delete guest progress' : 'Delete account'), h('p', null, 'Signing out never deletes anything. Use this only if you want to erase this ' + (guest ? 'guest progress from this device.' : 'account and its progress for good.')), h('button', { class: 'btn btn-danger', onclick: deleteFlow }, guest ? 'Delete guest progress' : 'Delete local account')));
    root.appendChild(h('div', { style: 'margin-top:16px' }, limits()));
    return root;
  }, 'Account & Backup');

  function storageInfo() {
    const box = h('div', null, h('p', { class: 'muted' }, 'Checking…'));
    (async () => {
      try {
        const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
        const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
        box.innerHTML = '';
        box.appendChild(h('p', null, 'Data is stored in this browser. ' + (persisted === true ? 'The browser has marked it as persistent.' : persisted === false ? 'The browser may remove it if the device runs low on space; back up regularly.' : '')));
        if (est && est.usage != null) box.appendChild(h('p', { class: 'muted' }, 'Used: ' + (est.usage / 1024 / 1024).toFixed(2) + ' MB'));
        if (L.memoryMode) box.appendChild(h('div', { class: 'alert err' }, 'This browser is not allowing site storage right now, so progress is only kept until you close the page.'));
      } catch (e) { box.innerHTML = ''; box.appendChild(h('p', { class: 'muted' }, 'Storage details are not available in this browser.')); }
    })();
    return box;
  }
  L.accountFlows = { exportFlow, importFlow };
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, E = L.Engine;
  const OK_T = new Set(['mc', 'fill', 'order', 'read']);
  const PER = 5, NEED = 4, BLOCKS = 6;   // 6 bloques x 5 = 30 preguntas exactas

  // Preguntas de un nivel (1–30): salen de las lecciones de esa etapa
  const poolCache = {};
  function pool(n) {
    if (poolCache[n]) return poolCache[n];
    const st = L.stage(n); const out = [];
    (st ? st.lessons : []).forEach((id) => { const les = C.lessons[id]; if (!les) return; les.practice.concat(les.quiz).forEach((q) => { if (OK_T.has(q.t)) { q._stage = n; out.push(q); } }); });
    return (poolCache[n] = out);
  }
  function pick(n, used) {
    const all = pool(n).filter((q) => !used.has(q.id));
    const hard = L.shuffle(all.filter((q) => q.t !== 'mc')), easy = L.shuffle(all.filter((q) => q.t === 'mc'));
    const out = hard.slice(0, 2).concat(easy).slice(0, PER);
    if (out.length < PER) hard.slice(2).forEach((q) => { if (out.length < PER) out.push(q); });
    return L.shuffle(out);
  }

  // Búsqueda adaptativa sobre los 30 niveles, con confirmación final
  async function runTest(host) {
    const used = new Set(); const probes = []; const skillAgg = {};
    let lo = 0, hi = L.STAGES + 1;           // lo: mayor nivel superado; hi: menor nivel no superado
    let blockN = 0; const tested = {};
    async function probe(n) {
      const qs = pick(n, used); qs.forEach((q) => used.add(q.id));
      blockN++;
      host.innerHTML = '';
      host.appendChild(h('p', { class: 'muted', 'aria-live': 'polite' }, 'Bloque ' + blockN + ' · La prueba se adapta a tus respuestas. Responde sin ayuda: sirve para colocarte en el nivel adecuado.'));
      const box = h('div'); host.appendChild(box);
      const res = await E.run(box, qs, { title: 'Prueba de nivel', finishLabel: 'Continuar', strictAccents: n > 10 });
      const ok = res.filter((r) => r.ok).length;
      res.forEach((r) => { const s = r.q.s; const a = (skillAgg[s] = skillAgg[s] || { c: 0, t: 0 }); if (!r.assisted) { a.t++; if (r.ok) a.c++; } });
      const pass = ok >= Math.min(NEED, qs.length);
      probes.push({ n, ok, total: qs.length, pass });
      (tested[n] = tested[n] || []).push(pass);
      return pass;
    }
    // 1) búsqueda binaria (como máximo 5 bloques)
    while (hi - lo > 1 && blockN < BLOCKS - 1) {
      const mid = Math.ceil((lo + hi) / 2);
      if (await probe(mid)) lo = mid; else hi = mid;
    }
    // 2) confirmación con preguntas nuevas hasta completar exactamente 30 preguntas
    while (blockN < BLOCKS) {
      const n = Math.max(1, lo);
      const ok = await probe(n);
      if (lo >= 1 && !ok) { hi = lo; lo = lo - 1; } else if (lo === 0 && ok) { lo = 1; }
    }
    const stage = Math.min(L.STAGES, lo + 1);
    return { stage, passedTop: lo, probes, skillAgg, date: Date.now() };
  }

  route('/prueba-de-nivel', () => {
    const root = h('div');
    const mandatory = !S.prog.placement;
    root.appendChild(U.pageHead('Prueba de nivel', mandatory ? 'Antes de empezar a estudiar, necesitamos saber tu nivel. Es obligatoria y solo dura unos minutos.' : 'Vuelve a medir tu nivel. Repetirla no borra tu progreso.'));
    const host = h('div'); root.appendChild(host);
    function intro() {
      host.innerHTML = '';
      host.appendChild(h('div', { class: 'card' }, h('h2', null, mandatory ? 'Tu examen de colocación' : 'Antes de empezar'),
        h('ul', null,
          h('li', null, 'Tu ruta tiene ', h('strong', null, '30 niveles'), ', del A1 al C2.'),
          h('li', null, 'La prueba empieza en un nivel medio y sube o baja según tus respuestas (30 preguntas en total).'),
          h('li', null, 'Mide vocabulario, gramática, lectura y orden de frases. Responde sin ayuda y sin traductor.'),
          h('li', null, 'Al terminar, tu nivel se abre y los anteriores quedan disponibles para repasar. Los niveles siguientes se abren cuando termines el tuyo.')),
        h('p', null, h('strong', null, '¿No sabes nada de español? '), 'No pasa nada: pulsa el botón de abajo y empezarás desde el principio, con las letras y los números.'),
        h('p', { class: 'muted' }, 'La prueba es una estimación: si el resultado no te parece justo, puedes repetirla en Configuración.'),
        !mandatory && S.prog.placement ? h('div', { class: 'alert' }, 'Tu resultado actual: nivel ' + S.startStage() + ' de 30.') : null,
        h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', onclick: async () => {
          const r = await runTest(host);
          S.applyPlacement({ stage: r.stage, passedTop: r.passedTop, probes: r.probes, date: r.date });
          S.count('placements'); await U.save(); result(r);
        } }, 'Empezar la prueba (30 preguntas)'), h('button', { class: 'btn btn-ghost', onclick: async () => { S.applyPlacement({ stage: 1, passedTop: 0, probes: [], date: Date.now() }); S.count('placements'); await U.save(); location.hash = '#/primeros-pasos'; } }, 'No sé nada de español'), mandatory ? null : h('a', { class: 'btn btn-ghost', href: '#/' }, 'Cancelar'))));
    }
    function result(r) {
      host.innerHTML = '';
      const stg = L.stage(r.stage); const lv = C.level(stg.level);
      const skills = Object.entries(r.skillAgg).filter(([, a]) => a.t).map(([s, a]) => ({ s, p: L.pct(a.c, a.t), t: a.t })).sort((a, b) => b.p - a.p);
      const strong = skills.filter((x) => x.p >= 75), weak = skills.filter((x) => x.p < 60);
      host.appendChild(h('div', { class: 'card center' }, h('div', { class: 'celebrate', 'aria-hidden': 'true' }, '🧭'), h('p', { class: 'muted' }, 'Tu nivel de partida'),
        h('h1', { id: 'page-title', tabindex: '-1', style: 'font-size:3rem;margin:.2em 0' }, 'Nivel ' + r.stage + ' de 30'),
        h('p', null, h('strong', null, stg.level + ' · ' + lv.name)),
        r.passedTop >= 1 ? h('p', { class: 'muted' }, 'Has demostrado dominar hasta el nivel ' + r.passedTop + '.') : h('p', { class: 'muted' }, 'Empezarás desde los fundamentos.')));
      const grid = h('div', { class: 'grid g2', style: 'margin-top:16px' });
      grid.appendChild(h('section', { class: 'card' }, h('h3', null, 'Habilidades'),
        strong.length ? h('p', null, h('b', null, 'Puntos fuertes: '), strong.map((x) => x.s + ' (' + x.p + ' %)').join(', ')) : h('p', { class: 'muted' }, 'Aún no hay habilidades claramente fuertes.'),
        weak.length ? h('p', null, h('b', null, 'A reforzar: '), weak.map((x) => x.s + ' (' + x.p + ' %)').join(', ')) : null));
      grid.appendChild(h('section', { class: 'card' }, h('h3', null, 'Cómo se calculó'), h('p', { class: 'muted' }, r.probes.length + ' bloques de ' + PER + ' preguntas. Superas un bloque con ' + NEED + ' aciertos. Es una estimación, no un diploma.')));
      host.appendChild(grid);
      const sg = h('section', { class: 'card', style: 'margin-top:16px' }, h('h3', null, 'Lecciones para empezar'));
      stg.lessons.forEach((id) => { const les = C.lessons[id]; if (!les) return; const unlocked = S.lessonUnlocked(id); sg.appendChild(h(unlocked ? 'a' : 'div', { class: 'lesson-row' + (unlocked ? '' : ' locked'), href: unlocked ? '#/leccion/' + id : null }, h('span', { class: 'n' }, '▶'), h('span', { style: 'flex:1' }, h('strong', null, les.title)))); });
      host.appendChild(sg);
      host.appendChild(h('div', { class: 'nav-actions' }, h('a', { class: 'btn btn-primary', href: '#/aprender' }, 'Empezar mi ruta'), h('a', { class: 'btn btn-ghost', href: '#/' }, 'Inicio')));
    }
    intro();
    return root;
  }, 'Prueba de nivel');
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U, D = L.dict;
  const key = (s) => L.stripAcc(L.norm(String(s || '')));

  function index() {
    if (!D.built) D.build();
    const out = [];
    D.entries.forEach((e) => out.push({ type: 'Palabra', title: e.w, sub: e.senses[0].def, href: '#/traductor/' + encodeURIComponent(e.w), hay: key(e.w + ' ' + (e.syn || []).join(' ') + ' ' + e.senses.map((s) => s.def).join(' ') + ' ' + (C.glossFor(e, 0) || '')) }));
    C.levels.forEach((lv) => C.lessonList(lv.id).forEach((ref) => { const les = C.lessons[ref.id]; if (les) out.push({ type: 'Lección', title: les.title, sub: lv.id + ' · ' + (les.goal || les.topic || ''), href: '#/leccion/' + les.id, hay: key(les.title + ' ' + (les.topic || '') + ' ' + (les.goal || '')) }); }));
    (C.grammar || []).forEach((g) => out.push({ type: 'Gramática', title: g.title, sub: g.level + ' · ' + g.summary, href: '#/gramatica/' + g.id, hay: key(g.title + ' ' + g.summary) }));
    (C.pron || []).forEach((p) => out.push({ type: 'Pronunciación', title: p.title, sub: p.summary, href: '#/pronunciacion/' + p.id, hay: key(p.title + ' ' + p.summary) }));
    (C.stories || []).forEach((s) => out.push({ type: 'Historia', title: s.title, sub: s.level + ' · ' + s.paragraphs[0].slice(0, 80) + '…', href: '#/historias/' + s.id, hay: key(s.title + ' ' + s.paragraphs.join(' ')) }));
    (C.dialogs || []).forEach((d) => out.push({ type: 'Conversación', title: d.title, sub: d.level + ' · ' + d.who.join(' y '), href: '#/conversacion/' + d.id, hay: key(d.title + ' ' + d.lines.map((l) => l.text).join(' ')) }));
    (C.reading || []).forEach((r) => out.push({ type: 'Lectura', title: r.title, sub: r.level, href: '#/leer/' + r.id, hay: key(r.title + ' ' + r.text) }));
    (C.listening || []).forEach((a) => out.push({ type: 'Escucha', title: a.title, sub: a.level + ' · ' + a.intro, href: '#/escuchar/' + a.id, hay: key(a.title + ' ' + a.intro) }));
    (C.writing || []).forEach((w) => out.push({ type: 'Escritura', title: w.title, sub: w.level + ' · ' + w.prompt, href: '#/escribir/' + w.id, hay: key(w.title + ' ' + w.prompt) }));
    return out;
  }
  let IDX = null;

  function page(initial) {
    const root = h('div');
    root.appendChild(U.pageHead('Buscar', 'Busca en palabras, lecciones, gramática, historias, conversaciones y más.'));
    const form = h('form', { role: 'search', class: 'card' });
    const inp = h('input', { type: 'search', class: 'inp', 'aria-label': 'Buscar en Languway Spanish', placeholder: 'Escribe una palabra o un tema… (p. ej. pretérito, restaurante)', autocomplete: 'off', value: initial || '' });
    form.append(inp, h('button', { class: 'btn btn-primary', type: 'submit', style: 'margin-top:10px' }, 'Buscar'));
    const out = h('div', { 'aria-live': 'polite', style: 'margin-top:16px' });
    root.append(form, out);
    function run() {
      const q = key(inp.value); out.innerHTML = '';
      if (!q) { out.appendChild(h('p', { class: 'muted' }, 'Escribe algo para buscar.')); return; }
      if (!IDX) IDX = index();
      const terms = q.split(/\s+/).filter(Boolean);
      const hits = IDX.filter((x) => terms.every((t) => x.hay.includes(t)));
      hits.sort((a, b) => (key(b.title).startsWith(q) - key(a.title).startsWith(q)) || (key(b.title).includes(q) - key(a.title).includes(q)));
      if (!hits.length) { out.appendChild(U.empty('🔎', 'No encontramos resultados para «' + inp.value.trim() + '». Prueba con otra palabra o revisa las tildes.', h('a', { class: 'btn btn-ghost', href: '#/traductor/' + encodeURIComponent(inp.value.trim()) }, 'Buscar en el Traductor'))); return; }
      const groups = {}; hits.forEach((x) => (groups[x.type] = groups[x.type] || []).push(x));
      out.appendChild(h('p', { class: 'muted' }, hits.length + (hits.length === 1 ? ' resultado' : ' resultados')));
      Object.keys(groups).forEach((g) => out.appendChild(h('section', { class: 'card', style: 'margin-bottom:12px' }, h('h2', null, g + ' (' + groups[g].length + ')'),
        h('ul', { style: 'list-style:none;padding:0;margin:0' }, groups[g].slice(0, 12).map((x) => h('li', { style: 'margin:8px 0' }, h('a', { href: x.href, style: 'font-weight:700' }, x.title), h('div', { class: 'muted' }, x.sub.length > 140 ? x.sub.slice(0, 140) + '…' : x.sub)))))));
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); history.replaceState(null, '', '#/buscar/' + encodeURIComponent(inp.value.trim())); });
    inp.addEventListener('input', L.debounce(run, 250));
    if (initial) run(); else setTimeout(() => inp.focus(), 60);
    return root;
  }
  route('/buscar', () => page(''), 'Buscar');
  route('/buscar/:q', ({ params }) => page(decodeURIComponent(params.q)), 'Buscar');
})(window.LWS);

;
(function (L) {
  'use strict';
  // Iconos vectoriales propios (SVG en línea, color heredado). Sustituyen a los emojis y símbolos de texto.
  const P = {
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" fill="currentColor"/>',
    starO: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3v3a5 5 0 0 0 2.5 4.3L12 12l-2.5 1.7A5 5 0 0 0 7 18v3M17 3v3a5 5 0 0 1-2.5 4.3L12 12l2.5 1.7A5 5 0 0 1 17 18v3"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    bookOpen: '<path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2zM12 6v14"/>',
    repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    blocks: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
    chat: '<path d="M20 12a7 7 0 0 1-10.3 6.1L4 20l1.6-4.3A7 7 0 1 1 20 12z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8M9.5 17h5"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-.5-5 1-8z"/>',
    sparkles: '<path d="M12 4l1.8 4.7L18.5 10.5l-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5l2.5-2.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.8c.7.6 1 1.3 1 2.2h5c0-.9.3-1.6 1-2.2A6 6 0 0 0 12 3z"/>',
    cards: '<rect x="4" y="7" width="12" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    ext: '<path d="M8 16L18 6M10 6h8v8"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2v2M14 18h2M18 18h2v2h-2z"/>',
    paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="12" cy="7" r="1.8"/><circle cx="17" cy="10" r="1.8"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 2-4 1-2 1-4 1-4-1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 21l2-4M15 21l-2-4"/><circle cx="9.5" cy="14" r=".8" fill="currentColor"/><circle cx="14.5" cy="14" r=".8" fill="currentColor"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8L9 5H7M12 13h5"/>',
  };
  const MAP = {
    '🔊': 'speaker', '▶': 'play', '⏹': 'stop', '🔒': 'lock', '🎧': 'headphones', '🧭': 'compass', '★': 'star', '⭐': 'star', '🌟': 'star', '☆': 'starO',
    '🎓': 'cap', '🐢': 'hourglass', '📚': 'book', '📘': 'book', '📕': 'book', '📖': 'bookOpen', '🔁': 'repeat', '✕': 'x', '🧩': 'blocks', '🧱': 'blocks',
    '✍': 'pencil', '💬': 'chat', '🗣': 'chat', '🔍': 'search', '🔎': 'search', '🏠': 'home', '🔤': 'type', '📈': 'trend', '🎯': 'target', '☰': 'menu',
    '✅': 'checkCircle', '✓': 'check', '🏆': 'trophy', '🏅': 'trophy', '🔥': 'flame', '🎉': 'sparkles', '✨': 'sparkles', '🎙': 'mic', '📝': 'note', '📜': 'note',
    '📊': 'bars', '🌐': 'globe', '🛠': 'wrench', '⚙': 'gear', '👤': 'user', '⚠': 'alert', '💡': 'bulb', '🃏': 'cards', '📭': 'inbox', '↔': 'swap', '↗': 'ext',
    '🐱': 'paw', '🏖': 'sun', '🚆': 'train', '📲': 'download', '📤': 'share', '📋': 'copy', '🚲': 'bike',
  };
  const RX = new RegExp('(' + Object.keys(MAP).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')[\\uFE0E\\uFE0F]?', 'g');
  const NS = 'http://www.w3.org/2000/svg';
  function svg(name, cls) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    // contenido fijo y propio (no proviene del usuario)
    s.innerHTML = P[name] || '';
    return s;
  }
  function convert(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); const list = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const pn = n.parentNode && n.parentNode.nodeName;
      if (pn === 'SCRIPT' || pn === 'STYLE' || pn === 'TEXTAREA' || pn === 'TITLE' || pn === 'OPTION') continue;
      RX.lastIndex = 0; if (RX.test(n.nodeValue)) list.push(n);
    }
    list.forEach((n) => {
      const t = n.nodeValue, frag = document.createDocumentFragment(); let last = 0; RX.lastIndex = 0; let m;
      while ((m = RX.exec(t))) { if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index))); frag.appendChild(svg(MAP[m[1]])); last = m.index + m[0].length; }
      if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  L.icon = svg; L.deEmoji = convert;
  function start() {
    let busy = false;
    const mo = new MutationObserver((muts) => {
      if (busy) return; busy = true;
      try { muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) convert(n); else if (n.nodeType === 3 && n.parentNode) convert(n.parentNode); })); } finally { busy = false; }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: false });
    convert(document.body);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})(window.LWS);

;
(function (L) {
  'use strict';
  const { h, $, $$ } = L;
  const routes = L.routes;
  L.go = (path) => { if (location.hash === '#' + path) L.render(); else location.hash = '#' + path; };

  const NAV = [
    ['/', 'Inicio'], ['/aprender', 'Aprender'], ['/vocabulario', 'Vocabulario'], ['/gramatica', 'Gramática'],
    ['/escuchar', 'Escuchar'], ['/pronunciacion', 'Pronunciación'], ['/traductor', 'Traductor'], ['/progreso', 'Mi progreso'],
  ];
  const MORE = [
    ['/leer', 'Leer'], ['/escribir', 'Escribir'], ['/frases', 'Construcción de frases'], ['/conversacion', 'Conversación'],
    ['/historias', 'Historias'], ['/practica', 'Práctica'], ['/repaso', 'Repaso diario'], ['/errores', 'Práctica de errores'],
    ['/favoritos', 'Favoritos'], ['/primeros-pasos', 'Primeros pasos'], ['/entrenador', 'Entrenador'], ['/certificados', 'Certificados'], ['/instalar', 'Instalar y compartir'], ['/configuracion', 'Configuración'],
  ];
  L.NAV = NAV; L.MORE = MORE;

  L.logoSvg = () => '<img src="mark.png" alt="" width="56" height="56" style="width:100%;height:auto;display:block">';

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('lws.theme', t); } catch (e) {}
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'dark' ? '#16140d' : '#F2C94C');
    const b = $('#theme-btn'); if (b) { b.setAttribute('aria-checked', String(t === 'dark')); b.setAttribute('aria-label', t === 'dark' ? 'Cambiar al modo claro' : 'Cambiar al modo oscuro'); b.setAttribute('title', b.getAttribute('aria-label')); }
  }
  L.applyTheme = applyTheme;
  // Preferencias de lectura (tamaño, interlineado, contraste, fuente) — se aplican en toda la app
  L.applyPrefs = function () {
    const st = (L.S && L.S.prog && L.S.prog.settings) || {}; const r = document.documentElement;
    const clamp = (v, a, b, d) => (typeof v === 'number' && v >= a && v <= b ? v : d);
    r.style.setProperty('--fs', String(clamp(st.fontScale, 0.85, 1.4, 1)));
    r.style.setProperty('--lh', String(clamp(st.lineHeight, 1, 1.5, 1)));
    r.setAttribute('data-contrast', st.contrast === true ? 'high' : 'normal');
    r.setAttribute('data-font', st.easyFont === true ? 'easy' : 'normal');
  };
  (function initialTheme() {
    let t = null; try { t = localStorage.getItem('lws.theme'); } catch (e) {}
    if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(t);
  })();

  const ICONS = { '/': '🏠', '/aprender': '📚', '/vocabulario': '🔤', '/gramatica': '🧩', '/escuchar': '🎧', '/pronunciacion': '🗣️', '/traductor': '🌐', '/progreso': '📈',
    '/leer': '📖', '/escribir': '✍️', '/frases': '🧱', '/conversacion': '💬', '/historias': '📜', '/practica': '🎯', '/repaso': '🔁', '/errores': '🛠️', '/favoritos': '⭐', '/instalar': '📲', '/configuracion': '⚙️' };
  function glare(el) { const g = $('.gglare'); if (!g || L.reducedMotion()) return; const r = el.getBoundingClientRect(), pr = el.parentNode.getBoundingClientRect(); g.style.left = (r.left - pr.left) + 'px'; g.style.width = r.width + 'px'; g.classList.remove('go'); void g.offsetWidth; g.classList.add('go'); }
  // Indicador de progreso circular para tareas con espera (p. ej. crear una copia)
  L.ring = function (msg) {
    const el = h('div', { class: 'ring-wrap', role: 'status' }, h('div', { class: 'ring' }, h('span', { class: 'ring-stop', 'aria-hidden': 'true' })), h('p', null, msg || ''));
    document.body.appendChild(el);
    return { done(ok) { el.classList.add(ok === false ? 'bad' : 'ok'); setTimeout(() => el.remove(), ok === false ? 700 : 600); } };
  };
  function buildShell() {
    const app = $('#app'); app.innerHTML = '';
    const nav = h('nav', { class: 'nav', 'aria-label': 'Principal' }, NAV.map(([p, t]) => h('a', { href: '#' + p, 'data-p': p }, t)));
    const moreBtn = h('button', { class: 'more', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'more-menu' }, 'Más ▾');
    const menu = h('div', { class: 'menu', id: 'more-menu' }, MORE.map(([p, t]) => h('a', { href: '#' + p, 'data-p': p, onclick: () => menu.classList.remove('open') }, t)));
    moreBtn.addEventListener('click', (e) => { e.stopPropagation(); const o = menu.classList.toggle('open'); moreBtn.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', () => { menu.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); });
    nav.appendChild(moreBtn);

    const sInp = h('input', { type: 'search', class: 'sbar-inp', placeholder: 'Buscar…', 'aria-label': 'Buscar en el contenido', autocomplete: 'off', maxlength: '60', tabindex: '-1' });
    const sBtn = h('button', { class: 'sbar-btn', type: 'button', 'aria-label': 'Buscar', title: 'Buscar' }, '🔍');
    const search = h('form', { class: 'sbar', role: 'search', onsubmit: (e) => { e.preventDefault(); const v = sInp.value.trim(); sInp.value = ''; sInp.blur(); location.hash = v ? '#/buscar/' + encodeURIComponent(v) : '#/buscar'; } }, sInp, sBtn);
    sBtn.addEventListener('click', () => { if (window.innerWidth < 760) { location.hash = '#/buscar'; return; } if (search.classList.contains('open') && sInp.value.trim()) { search.requestSubmit(); return; } search.classList.toggle('open'); if (search.classList.contains('open')) { sInp.tabIndex = 0; sInp.focus(); } else sInp.tabIndex = -1; });
    sInp.addEventListener('blur', () => { if (!sInp.value) { search.classList.remove('open'); sInp.tabIndex = -1; } });
    const theme = h('button', { class: 'dn', id: 'theme-btn', type: 'button', role: 'switch', 'aria-checked': 'false', onclick: () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark') },
      h('span', { class: 'dn-sky', 'aria-hidden': 'true' }, h('span', { class: 'dn-stars' }), h('span', { class: 'dn-cloud c1' }), h('span', { class: 'dn-cloud c2' }), h('span', { class: 'dn-knob' })));
    const acct = h('a', { class: 'icon-btn acct', id: 'acct-btn', href: '#/cuenta' }, 'Sign In');
    const dr = h('button', { class: 'icon-btn drawer-btn', type: 'button', 'aria-label': 'Abrir el menú', 'aria-expanded': 'false', 'aria-controls': 'drawer', onclick: () => toggleDrawer(true) }, '☰');
    const hdr = h('header', { class: 'site-header' }, h('div', { class: 'wrap hbar' },
      h('a', { class: 'logo', href: '#/', 'aria-label': 'Languway Spanish — Inicio' }, h('span', { html: L.logoSvg() }), h('span', { class: 'lt' }, 'Languway', h('small', null, 'Spanish'))),
      nav, h('div', { class: 'hright' },
        h('span', { class: 'pill warn', id: 'net-pill', hidden: true }, 'Sin conexión'),
        h('span', { class: 'pill', id: 'save-pill', role: 'status' }), search, theme, acct, dr)), menu);
    const dInp = h('input', { type: 'search', placeholder: 'Buscar', 'aria-label': 'Buscar en el contenido', maxlength: '60', autocomplete: 'off' });
    const dForm = h('form', { class: 'dsearch', role: 'search', onsubmit: (e) => { e.preventDefault(); const v = dInp.value.trim(); dInp.value = ''; toggleDrawer(false); location.hash = v ? '#/buscar/' + encodeURIComponent(v) : '#/buscar'; } }, h('span', { 'aria-hidden': 'true' }, '🔍'), dInp);
    const ico = (p) => h('span', { class: 'di', 'aria-hidden': 'true' }, ICONS[p] || '•');
    const dlink = ([p, t]) => h('a', { href: '#' + p, 'data-p': p, onclick: () => toggleDrawer(false) }, ico(p), h('span', null, t));
    const drawer = h('aside', { class: 'drawer', id: 'drawer', 'aria-label': 'Menú' },
      h('div', { class: 'row sb dhead' }, h('strong', { class: 'dtitle' }, 'Menú'), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cerrar el menú', onclick: () => toggleDrawer(false) }, '×')),
      dForm,
      NAV.map(dlink),
      h('hr', { class: 'ddiv' }),
      h('h4', null, 'Más secciones'),
      MORE.map(dlink),
      h('hr', { class: 'ddiv' }),
      h('h4', null, 'Cuenta'), h('a', { href: '#/cuenta', 'data-p': '/cuenta', onclick: () => toggleDrawer(false) }, h('span', { class: 'di', 'aria-hidden': 'true' }, '👤'), h('span', null, 'Account & Backup')));
    // Barra inferior de cristal (móvil)
    const GN = [['/', 'Inicio', '🏠'], ['/aprender', 'Aprender', '📚'], ['/buscar', 'Buscar', '🔍'], ['/progreso', 'Progreso', '📈']];
    const gnav = h('nav', { class: 'gnav', 'aria-label': 'Navegación rápida' }, h('span', { class: 'gglare', 'aria-hidden': 'true' }),
      GN.map(([p, t, i]) => h('a', { href: '#' + p, 'data-p': p, onclick: (e) => glare(e.currentTarget) }, h('span', { 'aria-hidden': 'true' }, i), h('small', null, t))),
      h('button', { type: 'button', 'aria-label': 'Abrir el menú', onclick: () => toggleDrawer(true) }, h('span', { 'aria-hidden': 'true' }, '☰'), h('small', null, 'Menú')));
    const back = h('div', { class: 'drawer-back', id: 'drawer-back', onclick: () => toggleDrawer(false) });
    const main = h('main', { id: 'main', tabindex: '-1' }, h('div', { class: 'wrap', id: 'view' }));
    const foot = h('footer', { class: 'site-footer' }, h('div', { class: 'wrap' },
      h('p', null, 'Languway Spanish: aprende español en español. Tu progreso se guarda en este dispositivo; haz copias de seguridad desde ', h('a', { href: '#/cuenta' }, 'Account & Backup'), '.'),
      h('p', null, 'Los certificados son de finalización emitidos por la plataforma; no son títulos oficiales.')));
    app.append(gnav, h('a', { class: 'skip', href: '#main', onclick: (e) => { e.preventDefault(); $('#main').focus(); } }, 'Saltar al contenido'), hdr, drawer, back, main, foot);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleDrawer(false); });
  }
  function toggleDrawer(o) {
    $('#drawer').classList.toggle('open', o); $('#drawer-back').classList.toggle('open', o);
    const b = $('.drawer-btn'); if (b) b.setAttribute('aria-expanded', String(o));
    if (o) { const f = $('#drawer a'); f && f.focus(); } else if (b) b.focus();
  }
  L.refreshAcct = function () {
    L.applyPrefs();
    const b = $('#acct-btn'); if (!b) return;
    b.textContent = L.A.isGuest() ? 'Sign In' : (L.A.user.name || '').split(' ')[0];
    b.setAttribute('aria-label', L.A.isGuest() ? 'Sign In or create an account' : 'Account of ' + L.A.user.name);
  };

  // ---- enrutador ----
  function parse() {
    const raw = location.hash.slice(1) || '/';
    const [path, qs] = raw.split('?');
    const q = Object.create(null); const dc = (x) => { try { return decodeURIComponent(x); } catch (e) { return ''; } };
    if (qs) qs.split('&').slice(0, 20).forEach((p) => { const [k, v] = p.split('='); const kk = dc(k); if (kk && kk !== '__proto__') q[kk] = dc(v || '').slice(0, 200); });
    return { path: path || '/', q };
  }
  let renderToken = 0;
  L.render = async function () {
    const tok = ++renderToken;
    const { path, q } = parse();
    L.Audio.stop();
    const view = $('#view');
    // La prueba de nivel es obligatoria antes de estudiar
    if (L.S.prog && !L.S.prog.placement && !/^\/(prueba-de-nivel|cuenta|configuracion)/.test(path)) { location.replace('#/prueba-de-nivel'); return; }
    if (L.coach) L.coach.touch(path);
    let match = null;
    for (const r of routes) { const m = r.re.exec(path); if (m) { match = { r, params: r.keys.reduce((o, k, i) => { try { o[k] = decodeURIComponent(m[i + 1]); } catch (e) { o[k] = ''; } return o; }, {}) }; break; } }
    $$('[data-p]').forEach((a) => { const p = a.getAttribute('data-p'); const on = p === '/' ? path === '/' : path === p || path.startsWith(p + '/'); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    const AB = /^\/cuenta\/(entrar|crear)$/;
    if (L._prev && AB.test(L._prev) && AB.test(path) && L._prev !== path && !L.reducedMotion()) {
      const band = h('span', { class: 'auth-band', 'aria-hidden': 'true' }, h('span', { class: 'band-edge' }));
      document.body.appendChild(band); setTimeout(() => band.remove(), 900);
      await new Promise((r) => setTimeout(r, 330)); if (tok !== renderToken) return;
    }
    L._prev = path;
    view.innerHTML = '';
    view.appendChild(L.U.loading());
    if (!match) { view.innerHTML = ''; view.appendChild(L.U.empty('🧭', 'No encontramos esta página.', h('a', { class: 'btn btn-primary', href: '#/' }, 'Ir al inicio'))); return; }
    try {
      const out = await match.r.fn({ params: match.params, q, path });
      if (tok !== renderToken) return;
      view.innerHTML = '';
      if (out) view.appendChild(out);
      view.classList.remove('view-enter'); void view.offsetWidth; if (!L.reducedMotion()) view.classList.add('view-enter');
      if (match.r.title) document.title = (typeof match.r.title === 'function' ? match.r.title(match.params) : match.r.title) + ' · Languway Spanish';
      const t = $('#page-title'); window.scrollTo(0, 0); if (t) t.focus({ preventScroll: true });
    } catch (err) {
      
      if (tok !== renderToken) return;
      view.innerHTML = '';
      view.appendChild(L.U.errorBox('No se pudo cargar esta sección. Tu progreso no se ha perdido.', () => L.render()));
    }
  };

  function setupIndicators() {
    let t;
    L.S.onSave((st) => {
      const p = $('#save-pill'); if (!p) return;
      clearTimeout(t);
      if (st === 'saving') { p.textContent = 'Guardando…'; p.className = 'pill show'; }
      else if (st === 'saved') { p.textContent = '✓ Guardado'; p.className = 'pill show'; t = setTimeout(() => (p.className = 'pill'), 1800); }
      else { p.textContent = '⚠ Sin guardar'; p.className = 'pill err show'; }
    });
    const net = () => { const n = $('#net-pill'); if (n) n.hidden = navigator.onLine; };
    window.addEventListener('online', net); window.addEventListener('offline', net); net();
  }

  // ---- Service Worker y actualización ----
  function setupSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const prompt = (worker) => {
        if (document.getElementById('upd-banner')) return;
        const b = h('div', { class: 'banner', id: 'upd-banner', role: 'alert' }, h('span', null, 'Hay una versión nueva de Languway Spanish. Tu progreso no se borrará.'),
          h('span', { class: 'row' }, h('button', { class: 'btn btn-primary btn-sm', onclick: () => { worker.postMessage('SKIP_WAITING'); } }, 'Actualizar'), h('button', { class: 'btn btn-ghost btn-sm', onclick: () => b.remove() }, 'Más tarde')));
        document.body.appendChild(b);
      };
      if (reg.waiting && navigator.serviceWorker.controller) prompt(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) prompt(w); });
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded || !hadController) return; reloaded = true; L.S.flush().finally(() => location.reload()); });
  }

  function fatal(msg) {
    const app = $('#app'); app.innerHTML = '';
    app.appendChild(h('div', { class: 'wrap', style: 'padding:40px 16px' }, h('div', { class: 'alert err', role: 'alert' }, h('h2', null, 'No se pudo iniciar'), h('p', null, msg), h('button', { class: 'btn btn-primary', onclick: () => location.reload() }, 'Reintentar'))));
  }

  L.start = async function () {
    try {
      L.dict.build();
      buildShell();
      try { await L.A.init(); if (L.A.hasCloud()) L.A.pull(false).then((ok) => { if (ok) { L.refreshAcct && L.refreshAcct(); L.render(); } }); } catch (e) {
        
        L.memoryMode = true;
        L.A.user = { id: L.A.GUEST_ID, name: 'Guest', guest: true };
        L.S.user = L.A.user; L.S.prog = L.S.defaultProg(L.A.GUEST_ID);
        L.db.commit = async () => true;
        document.body.appendChild(h('div', { class: 'banner', role: 'alert' }, 'Este navegador no permite guardar datos del sitio (¿modo privado?). Puedes aprender, pero el progreso se perderá al cerrar.'));
      }
      document.documentElement.setAttribute('data-motion', L.S.prog.settings.reduceMotion ? 'reduce' : 'auto'); L.applyPrefs();
      L.refreshAcct(); setupIndicators(); setupSW();
      L.Audio.ready();
      window.addEventListener('hashchange', L.render);
      window.addEventListener('pagehide', () => { L.S.flush(); });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') L.S.flush(); });
      await L.render();
    } catch (e) { fatal('Ocurrió un error inesperado al arrancar la aplicación. Tus datos guardados no se han tocado.'); }
  };
  document.addEventListener('DOMContentLoaded', () => L.start());
})(window.LWS);

