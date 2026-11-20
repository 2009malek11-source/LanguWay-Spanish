/* Languway Spanish — Plan diario, entrenamiento de habla y "Lo que ya puedes hacer" */
(function (L) {
  'use strict';
  const { h, route } = L;
  const S = L.S, C = L.C, U = L.U;
  const st = () => (S.prog && S.prog.settings) || {};
  const sup = () => (L.sup ? L.sup.lang() : 'none');
  // Etiquetas en español + ayuda en el idioma elegido
  const T = (es, en, ar) => (sup() === 'ar' ? es + ' · ' + ar : sup() === 'en' ? es + ' · ' + en : es);
  const dayKey = (d) => L.dayKey(d);

  // ---------- datos del día ----------
  function lessonOrder() {
    const order = [];
    C.levels.forEach((lv) => C.lessonList(lv.id).forEach((x) => { if (C.lessons[x.id]) order.push(x.id); }));
    return order;
  }
  function today() { const a = S.prog.activity[dayKey()] || {}; return { q: a.q || 0, w: a.w || 0, reto: a.reto || 0 }; }
  function weekDays() {
    const out = []; const d = new Date();
    for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push({ date: x, on: !!S.prog.activity[dayKey(x)] }); }
    return out;
  }
  const DOW = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // La lección “de hoy” se fija al abrir el plan; así se puede marcar como hecha al terminarla.
  function dayState() {
    const k = dayKey();
    let p = S.prog.plan;
    if (!p || p.day !== k) {
      p = S.prog.plan = { day: k, lessonsAtStart: S.stats().lessons, errorsAtStart: pendingErrors(), speak: 0 };
      S.markProg();
    }
    return p;
  }
  function pendingErrors() { return Array.from(S.qstats.values()).filter((r) => r.wrong > 0 && r.streak < 2).length; }

  // ---------- tareas del plan ----------
  function tasks() {
    const t = today(), ds = dayState(), mins = Math.max(5, +S.prog.goals.minutesPerDay || 15);
    const due = S.dueWords().length, lim = st().reviewLimit || 30;
    const next = S.nextLesson(), les = next ? C.lessons[next] : null;
    const errs = pendingErrors(), weak = S.weakSkills();
    const out = [];
    if (due) out.push({ id: 'repaso', icon: '🔁', min: Math.max(2, Math.ceil(Math.min(due, lim) / 6)), title: T('Repasar palabras pendientes', 'Review due words', 'مراجعة الكلمات المستحقة'), why: T(due + ' palabras listas para repasar. Repasar a tiempo es lo que las fija en la memoria.', due + ' words are ready. Reviewing on time is what locks them into memory.', due + ' كلمة جاهزة للمراجعة. المراجعة في وقتها هي ما يثبّت الكلمات في الذاكرة.'), href: '#/repaso', done: t.w >= Math.min(due, lim) || t.w >= 10 });
    if (les) out.push({ id: 'leccion', icon: '📘', min: 10, title: T('Lección: ' + les.title, 'Lesson: ' + les.title, 'الدرس: ' + les.title), why: les.goal || '', href: '#/leccion/' + next, done: S.stats().lessons > ds.lessonsAtStart });
    if (errs) out.push({ id: 'errores', icon: '🎯', min: 4, title: T('Corregir mis errores', 'Fix my mistakes', 'تصحيح أخطائي'), why: T('Tienes ' + errs + ' ejercicios que fallaste. Volver a ellos es la forma más rápida de mejorar.', 'You have ' + errs + ' exercises you missed. Going back to them is the fastest way to improve.', 'لديك ' + errs + ' تمارين أخطأت فيها. العودة إليها أسرع طريقة للتحسّن.'), href: '#/errores', done: pendingErrors() < ds.errorsAtStart });
    out.push({ id: 'habla', icon: '🎤', min: 3, title: T('Decir 5 frases en voz alta', 'Say 5 sentences aloud', 'نطق 5 جمل بصوت عالٍ'), why: T('Hablar es la habilidad que más se descuida. Escucha, repite y compara.', 'Speaking is the most neglected skill. Listen, repeat and compare.', 'المحادثة أكثر مهارة يتم إهمالها. استمع وكرّر وقارن.'), href: '#/habla', done: (ds.speak || 0) >= 5 });
    if (weak.length) out.push({ id: 'debil', icon: '💪', min: 4, title: T('Reforzar: ' + weak[0].s, 'Strengthen: ' + weak[0].s, 'تقوية: ' + weak[0].s), why: T('Tu acierto en esta habilidad es del ' + weak[0].p + ' %.', 'Your accuracy here is ' + weak[0].p + '%.', 'نسبة صحتك في هذه المهارة ' + weak[0].p + '%.'), href: '#/practica', done: false });
    // ajusta al tiempo disponible: conserva las tareas hasta llenar los minutos (siempre al menos una)
    let sum = 0; const fit = [];
    out.forEach((x) => { if (!fit.length || sum + x.min <= mins + 3) { fit.push(x); sum += x.min; } });
    return { list: fit, minutes: sum, goal: mins };
  }

  // ---------- tarjeta para la página de inicio ----------
  L.plan = { tasks };
  L.plan.card = function () {
    if (!S.prog) return h('span');
    const tk = tasks(); const done = tk.list.filter((x) => x.done).length;
    return h('section', { class: 'card plan-card', style: 'margin-top:16px' },
      h('h2', null, T('Mi plan de hoy', 'My plan for today', 'خطتي لليوم')),
      h('p', { class: 'muted' }, done + ' / ' + tk.list.length + ' · ~' + tk.minutes + ' min'),
      h('div', { class: 'plan-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(tk.list.length), 'aria-valuenow': String(done) }, h('i', { style: 'width:' + Math.round(100 * done / Math.max(1, tk.list.length)) + '%' })),
      h('a', { class: 'btn btn-primary', href: '#/mi-plan' }, done >= tk.list.length ? T('Ver mi plan', 'See my plan', 'عرض خطتي') : T('Empezar', 'Start', 'ابدأ')));
  };

  // ---------- /mi-plan ----------
  route('/mi-plan', () => {
    const root = h('div');
    root.appendChild(U.pageHead(T('Mi plan de hoy', 'My plan for today', 'خطتي لليوم'), T('Una lista corta y clara, ajustada a tu tiempo y a lo que más necesitas.', 'A short, clear list, fitted to your time and what you need most.', 'قائمة قصيرة وواضحة، مناسبة لوقتك ولما تحتاجه أكثر.')));
    if (!S.prog || !S.prog.placement) { root.appendChild(U.empty('🧭', T('Primero elige tu nivel para que el plan se ajuste a ti.', 'Choose your level first so the plan fits you.', 'اختر مستواك أولاً ليناسبك الخطة.'), h('a', { class: 'btn btn-primary', href: '#/bienvenida' }, T('Elegir nivel', 'Choose level', 'اختيار المستوى')))); return root; }
    const tk = tasks(), done = tk.list.filter((x) => x.done).length;
    root.appendChild(h('div', { class: 'card' },
      h('h2', null, done >= tk.list.length ? '🎉 ' + T('¡Plan completado!', 'Plan complete!', 'اكتملت الخطة!') : done + ' / ' + tk.list.length),
      h('div', { class: 'plan-bar' }, h('i', { style: 'width:' + Math.round(100 * done / Math.max(1, tk.list.length)) + '%' })),
      h('p', { class: 'muted' }, T('Tiempo estimado: ' + tk.minutes + ' min (tu meta: ' + tk.goal + ' min al día).', 'Estimated time: ' + tk.minutes + ' min (your goal: ' + tk.goal + ' min a day).', 'الوقت المقدّر: ' + tk.minutes + ' دقيقة (هدفك ' + tk.goal + ' دقيقة يومياً).'))));
    const ul = h('ul', { class: 'plan-list' });
    tk.list.forEach((x) => ul.appendChild(h('li', { class: 'card plan-item' + (x.done ? ' done' : '') },
      h('span', { class: 'plan-ic', 'aria-hidden': 'true' }, x.done ? '✅' : x.icon),
      h('div', null, h('strong', null, x.title), h('small', { style: 'display:block' }, '~' + x.min + ' min'), x.why ? h('p', { class: 'muted', style: 'margin:4px 0 0' }, x.why) : null),
      h('a', { class: 'btn ' + (x.done ? 'btn-ghost' : 'btn-primary') + ' btn-sm', href: x.href }, x.done ? T('Repetir', 'Again', 'مرة أخرى') : T('Ir', 'Go', 'اذهب')))));
    root.appendChild(ul);
    // constancia semanal sin presión
    const days = weekDays(), act = days.filter((d) => d.on).length, goal = S.prog.goals.lessonsPerWeek || 3;
    root.appendChild(h('section', { class: 'card' },
      h('h2', null, T('Constancia de la semana', 'This week', 'انتظامك هذا الأسبوع')),
      h('div', { class: 'week-dots', role: 'img', 'aria-label': act + ' / 7' }, days.map((d) => h('span', { class: 'wd' + (d.on ? ' on' : '') }, h('b', null, DOW[d.date.getDay()]), d.on ? '✓' : '·'))),
      h('p', null, T('Estudiaste ' + act + ' de los últimos 7 días.', 'You studied ' + act + ' of the last 7 days.', 'درست ' + act + ' من آخر 7 أيام.')),
      h('p', { class: 'muted' }, T('Aquí no se “rompe” nada: un día de descanso no borra tu avance. Lo que cuenta es volver. Tu meta: ' + goal + ' lecciones por semana (cámbiala en Configuración).', 'Nothing “breaks” here: a rest day does not erase your progress. What matters is coming back. Your goal: ' + goal + ' lessons a week (change it in Settings).', 'لا شيء “ينكسر” هنا: يوم راحة لا يمحو تقدّمك. المهم أن تعود. هدفك: ' + goal + ' دروس أسبوعياً (غيّره من الإعدادات).'))));
    root.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn btn-ghost', href: '#/puedo' }, T('Lo que ya puedes hacer', 'What you can already do', 'ما تستطيع فعله الآن')), h('a', { class: 'btn btn-ghost', href: '#/configuracion/aprendizaje' }, T('Cambiar mis metas', 'Change my goals', 'تغيير أهدافي'))));
    return root;
  }, 'Mi plan');

  // ---------- /puedo : lo que ya sabes hacer ----------
  const goalText = (g) => String(g || '').replace(/^Al terminar esta lección,?\s*(podrás|serás capaz de)?\s*/i, '').replace(/\.$/, '');
  route('/puedo', () => {
    const root = h('div');
    root.appendChild(U.pageHead(T('Lo que ya puedes hacer', 'What you can already do', 'ما تستطيع فعله الآن'), T('Cada lección completada te da una capacidad real. Mira lo que has conseguido y lo que viene.', 'Every completed lesson gives you a real ability. See what you have achieved and what is next.', 'كل درس مكتمل يمنحك قدرة حقيقية. شاهد ما أنجزته وما هو قادم.')));
    let total = 0, got = 0;
    C.levels.forEach((lv) => {
      const ids = C.lessonList(lv.id).map((x) => x.id).filter((id) => C.lessons[id] && C.lessons[id].goal);
      if (!ids.length) return;
      const d = ids.filter((id) => S.lessonDone(id)); total += ids.length; got += d.length;
      const open = d.length > 0;
      const det = h('details', { class: 'card', open: open ? '' : null },
        h('summary', null, h('strong', null, lv.id), ' · ' + (lv.title || lv.name || ''), ' — ' + d.length + ' / ' + ids.length));
      const ul = h('ul', { class: 'can-list' });
      ids.forEach((id) => { const ok = S.lessonDone(id); ul.appendChild(h('li', { class: ok ? 'ok' : 'todo' }, h('span', { 'aria-hidden': 'true' }, ok ? '✅ ' : '⬜ '), ok ? T('Puedo ', 'I can ', 'أستطيع ') : T('Pronto podré ', 'Soon I will ', 'قريباً سأستطيع '), goalText(C.lessons[id].goal), ok ? null : h('a', { href: '#/leccion/' + id, class: 'muted', style: 'margin-inline-start:8px' }, '→'))); });
      det.appendChild(ul); root.appendChild(det);
    });
    root.insertBefore(h('div', { class: 'card' }, h('h2', null, got + ' / ' + total), h('div', { class: 'plan-bar' }, h('i', { style: 'width:' + Math.round(100 * got / Math.max(1, total)) + '%' }))), root.children[1]);
    return root;
  }, 'Lo que puedes hacer');

  // ---------- /habla : decir en voz alta y comparar ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const rawWords = (s) => String(s || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean);

  // Alineación por subsecuencia común más larga: qué palabras de la frase se oyeron
  function compare(target, heard) {
    const tw = rawWords(target), a = tw.map(fold), b = fold(heard).split(' ').filter(Boolean);
    const n = a.length, m = b.length; const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] || (a[i] && b[j] && a[i].length > 3 && lev1(a[i], b[j])) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const hit = new Array(n).fill(false); let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j] || (a[i].length > 3 && lev1(a[i], b[j]))) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
    }
    const ok = hit.filter(Boolean).length;
    return { words: tw.map((w, k) => ({ w, ok: hit[k] })), score: n ? Math.round(100 * ok / n) : 0 };
  }
  // distancia de edición ≤ 1 (tolera un error de reconocimiento en palabras largas)
  function lev1(x, y) {
    if (x === y) return true; if (Math.abs(x.length - y.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < x.length && j < y.length) {
      if (x[i] === y[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (x.length > y.length) i++; else if (x.length < y.length) j++; else { i++; j++; }
    }
    return edits + (x.length - i) + (y.length - j) <= 1;
  }
  L.plan.compare = compare;

  function phrasePool() {
    const order = lessonOrder().filter((id) => S.lessonUnlocked(id));
    const pool = []; const seen = new Set();
    order.slice(-6).forEach((id) => {
      const les = C.lessons[id];
      (les.vocab || []).forEach((v) => { const ex = v[3]; if (ex && !seen.has(ex) && rawWords(ex).length >= 2 && rawWords(ex).length <= 12) { seen.add(ex); pool.push({ es: ex, en: v[4] || '', from: les.title }); } });
    });
    if (pool.length < 5) order.forEach((id) => (C.lessons[id].vocab || []).forEach((v) => { if (pool.length < 30 && v[3] && !seen.has(v[3])) { seen.add(v[3]); pool.push({ es: v[3], en: v[4] || '', from: C.lessons[id].title }); } }));
    return pool;
  }
  const locale = () => { const d = st().dialect; return d && d !== 'auto' ? d : 'es-ES'; };

  route('/habla', () => {
    const root = h('div');
    root.appendChild(U.pageHead(T('Habla', 'Speak', 'تحدّث'), T('Escucha la frase, repítela en voz alta y compara. Practica lo que dirías de verdad.', 'Listen to the sentence, say it aloud and compare. Practise what you would really say.', 'استمع إلى الجملة وكرّرها بصوت عالٍ وقارن. تدرّب على ما ستقوله فعلاً.')));
    const pool = L.shuffle ? L.shuffle(phrasePool()) : phrasePool();
    if (!pool.length) { root.appendChild(U.empty('🎤', T('Completa tu primera lección para tener frases que practicar.', 'Complete your first lesson to get sentences to practise.', 'أكمل درسك الأول لتحصل على جمل للتدرّب.'), h('a', { class: 'btn btn-primary', href: '#/aprender' }, T('Aprender', 'Learn', 'تعلّم')))); return root; }
    root.appendChild(h('div', { class: 'alert' }, SR
      ? T('Tu navegador puede reconocer tu voz: te diré qué palabras se entendieron. El micrófono solo se usa mientras grabas; el audio no se guarda.', 'Your browser can recognise your voice: I will show which words were understood. The microphone is only used while recording; audio is not saved.', 'متصفحك يستطيع التعرّف على صوتك: سأريك الكلمات التي فُهمت. يُستخدم الميكروفون أثناء التسجيل فقط ولا يُحفظ الصوت.')
      : T('Tu navegador no reconoce la voz. Puedes grabarte y escucharte para comparar con el modelo (sin puntuación).', 'Your browser cannot recognise speech. You can record yourself and listen back to compare with the model (no score).', 'متصفحك لا يتعرّف على الكلام. يمكنك تسجيل نفسك والاستماع للمقارنة مع النموذج (بلا درجة).')));
    let i = 0, tally = { n: 0, sum: 0 };
    const card = h('section', { class: 'card habla-card' }); root.appendChild(card);
    const sum = h('p', { class: 'muted' }); root.appendChild(sum);

    function draw() {
      const p = pool[i % pool.length]; card.innerHTML = '';
      const out = h('div', { class: 'habla-out', 'aria-live': 'polite' });
      const rec = h('button', { type: 'button', class: 'btn btn-primary' }, '🎤 ' + T('Grabar', 'Record', 'سجّل'));
      card.append(...[
        h('p', { class: 'muted' }, T('Frase ', 'Sentence ', 'الجملة ') + ((i % pool.length) + 1) + ' / ' + pool.length + ' · ' + p.from),
        h('p', { class: 'habla-es', lang: 'es' }, p.es),
        p.en && sup() !== 'none' ? h('p', { class: 'muted', lang: 'en', dir: 'ltr', 'data-nosup': '1' }, p.en) : null,
        h('div', { class: 'row' }, L.Audio.btn(p.es, { name: p.es }), L.Audio.btn(p.es, { slow: true, name: p.es }), rec),
        out,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { i++; draw(); } }, T('Siguiente', 'Next', 'التالية') + ' →'))].filter(Boolean));
      rec.addEventListener('click', () => (SR ? recognise(p, rec, out) : shadow(p, rec, out)));
    }

    function result(p, heard, out) {
      const r = compare(p.es, heard); out.innerHTML = '';
      out.append(...[
        h('p', { class: 'habla-score ' + (r.score >= 80 ? 'good' : r.score >= 50 ? 'mid' : 'low') }, r.score + ' % · ' + (r.score >= 80 ? T('¡Muy bien!', 'Great!', 'ممتاز!') : r.score >= 50 ? T('Casi. Inténtalo otra vez.', 'Nearly. Try again.', 'قريب. حاول مرة أخرى.') : T('Escucha el modelo y repite despacio.', 'Listen to the model and repeat slowly.', 'استمع إلى النموذج وكرّر ببطء.'))),
        h('p', { class: 'habla-words', lang: 'es' }, r.words.map((x) => h('span', { class: x.ok ? 'w-ok' : 'w-miss' }, x.w + ' '))),
        h('p', { class: 'muted' }, T('Entendí: «', 'I heard: “', 'سمعتُ: «') + (heard || '—') + (sup() === 'ar' ? '»' : '»')),
        r.words.some((x) => !x.ok) ? h('p', { class: 'muted' }, T('En rojo: palabras que no se entendieron. Pulsa 🔈 y repítelas despacio.', 'In red: words that were not understood. Press 🔈 and repeat them slowly.', 'بالأحمر: كلمات لم تُفهم. اضغط 🔈 وكرّرها ببطء.')) : null].filter(Boolean));
      tally.n++; tally.sum += r.score; sum.textContent = T('Media de esta sesión: ', 'Session average: ', 'متوسط الجلسة: ') + Math.round(tally.sum / tally.n) + ' % (' + tally.n + ')';
      const ds = dayState(); ds.speak = (ds.speak || 0) + 1; S.markProg(); U.save(true);
      if (S.recordAnswer) S.recordAnswer({ id: 'habla:' + fold(p.es).slice(0, 40), tag: 'pron:habla', s: 'pronunciación' }, r.score >= 70, false);
    }

    function recognise(p, btn, out) {
      let rc; try { rc = new SR(); } catch (e) { out.textContent = T('No se pudo iniciar el reconocimiento.', 'Could not start recognition.', 'تعذّر بدء التعرّف.'); return; }
      rc.lang = locale(); rc.interimResults = false; rc.maxAlternatives = 3; rc.continuous = false;
      btn.disabled = true; btn.textContent = '● ' + T('Escuchando…', 'Listening…', 'جارٍ الاستماع…'); out.textContent = '';
      let got = false;
      const end = () => { btn.disabled = false; btn.textContent = '🎤 ' + T('Grabar', 'Record', 'سجّل'); };
      rc.onresult = (e) => {
        got = true; let best = '', bs = -1;
        for (let k = 0; k < e.results[0].length; k++) { const alt = e.results[0][k].transcript; const sc = compare(p.es, alt).score; if (sc > bs) { bs = sc; best = alt; } }
        result(p, best, out);
      };
      rc.onerror = (e) => {
        got = true;
        const m = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? T('Permite el micrófono en tu navegador para usar esta función.', 'Allow the microphone in your browser to use this feature.', 'اسمح بالميكروفون في متصفحك لاستخدام هذه الميزة.')
          : e.error === 'no-speech' ? T('No oí nada. Acércate al micrófono e inténtalo otra vez.', 'I heard nothing. Move closer to the microphone and try again.', 'لم أسمع شيئاً. اقترب من الميكروفون وحاول مجدداً.')
            : e.error === 'network' ? T('El reconocimiento necesita conexión a internet en este navegador.', 'Recognition needs an internet connection in this browser.', 'يحتاج التعرّف إلى اتصال بالإنترنت في هذا المتصفح.')
              : T('No se pudo reconocer. Inténtalo otra vez.', 'Could not recognise. Try again.', 'تعذّر التعرّف. حاول مرة أخرى.');
        out.innerHTML = ''; out.appendChild(h('p', { class: 'field-err', role: 'alert' }, m));
      };
      rc.onend = () => { end(); if (!got) { out.textContent = T('No se oyó nada.', 'Nothing was heard.', 'لم يُسمع شيء.'); } };
      try { rc.start(); } catch (e) { end(); out.textContent = T('No se pudo iniciar el micrófono.', 'Could not start the microphone.', 'تعذّر تشغيل الميكروفون.'); }
    }

    // Sin reconocimiento de voz: grabar, escuchar y comparar a oído
    function shadow(p, btn, out) {
      if (!navigator.mediaDevices || !window.MediaRecorder) { out.textContent = T('Tu navegador no permite grabar audio.', 'Your browser cannot record audio.', 'متصفحك لا يدعم تسجيل الصوت.'); return; }
      if (btn._rec) { btn._rec.stop(); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const chunks = []; const mr = new MediaRecorder(stream); btn._rec = mr;
        mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop()); btn._rec = null; btn.textContent = '🎤 ' + T('Grabar otra vez', 'Record again', 'سجّل مجدداً');
          const url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
          out.innerHTML = ''; out.append(h('p', null, T('Escucha tu voz y el modelo, uno tras otro:', 'Listen to your voice and the model, one after the other:', 'استمع إلى صوتك ثم إلى النموذج:')), h('audio', { controls: '', src: url }), h('div', { class: 'row' }, L.Audio.btn(p.es, { name: p.es })));
          const ds = dayState(); ds.speak = (ds.speak || 0) + 1; S.markProg(); U.save(true);
        };
        btn.textContent = '■ ' + T('Detener', 'Stop', 'إيقاف'); mr.start();
      }).catch(() => { out.textContent = T('Permite el micrófono para grabarte.', 'Allow the microphone to record yourself.', 'اسمح بالميكروفون لتسجّل نفسك.'); });
    }
    draw();
    return root;
  }, 'Habla');

})(window.LWS);
