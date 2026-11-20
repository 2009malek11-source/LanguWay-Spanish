/* Languway Spanish — página de inicio */
(function (L) {
  'use strict';
  const { h, route } = L;
  const S = L.S, C = L.C, U = L.U;
  const sup = () => (L.sup ? L.sup.lang() : 'none');
  const T = (es, en, ar) => (sup() === 'ar' ? es + ' · ' + ar : sup() === 'en' ? es + ' · ' + en : es);
  const ico = (n, c) => L.ico(n, c);

  // Frases para el «Dato curioso» (una por día)
  const FACTS = [
    ['¡Buenos días!', 'Good morning!', 'صباح الخير!', 'Se dice por la mañana, hasta el mediodía.'],
    ['¡Buenas tardes!', 'Good afternoon!', 'مساء الخير!', 'Se usa desde el mediodía hasta que anochece.'],
    ['¡Buenas noches!', 'Good evening / Good night!', 'مساء الخير! / تصبح على خير!', 'Sirve para saludar y para despedirse de noche.'],
    ['¿Cómo estás?', 'How are you?', 'كيف حالك؟', 'La pregunta empieza con ¿ y termina con ?'],
    ['Mucho gusto.', 'Nice to meet you.', 'تشرفت بمعرفتك.', 'Se dice al conocer a alguien.'],
    ['Por favor.', 'Please.', 'من فضلك.', 'La palabra más útil para pedir algo con educación.'],
    ['Muchas gracias.', 'Thank you very much.', 'شكراً جزيلاً.', 'Se responde con «De nada».'],
    ['¿Dónde está el baño?', 'Where is the bathroom?', 'أين الحمّام؟', 'Una pregunta imprescindible cuando viajas.'],
    ['No entiendo.', 'I do not understand.', 'لا أفهم.', 'Añade «Más despacio, por favor» para que te hablen más lento.'],
    ['¿Cuánto cuesta?', 'How much does it cost?', 'كم السعر؟', 'Útil en tiendas y mercados.'],
    ['Me llamo...', 'My name is...', 'اسمي...', 'Literalmente: «Yo me llamo...».'],
    ['Hasta luego.', 'See you later.', 'إلى اللقاء.', 'Se usa cuando piensas volver a ver a la persona.'],
    ['¡Qué bien!', 'How nice!', 'ما أجمل ذلك!', 'Expresa alegría o aprobación.'],
    ['Con permiso.', 'Excuse me.', 'بعد إذنك.', 'Para pasar entre la gente o pedir paso.']
  ];

  function overall() {
    let d = 0, t = 0;
    C.levels.forEach((lv) => { const p = S.levelProgress(lv.id); d += p.done; t += p.total; });
    return { done: d, total: t, pct: t ? Math.round(100 * d / t) : 0 };
  }
  const nextLevel = (lv) => { const ids = C.levels.map((x) => x.id); const i = ids.indexOf(lv); return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null; };

  function stat(icon, value, label, pct, cls) {
    return h('article', { class: 'stat-card ' + (cls || '') },
      h('div', { class: 'sc-top' }, ico(icon, 'sc-ico'), h('div', null, h('b', null, value), h('span', null, label))),
      pct == null ? null : h('div', { class: 'sc-bar', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.max(3, Math.min(100, pct)) + '%' })));
  }

  // ---------- banner con carrusel ----------
  function hero(started, target) {
    const slides = [
      { t: ['Aprende ', 'español', 'de forma inteligente'], p: 'Un idioma nuevo… un mundo más grande.', btn: started ? 'Continuar' : 'Empezar a aprender', href: started ? '#/leccion/' + target : '#/prueba-de-nivel', icon: 'play' },
      { t: ['Escucha, ', 'repite', 'y compara'], p: 'Practica tu pronunciación con tu propia voz.', btn: 'Practicar a hablar', href: '#/habla', icon: 'mic' },
      { t: ['Tu plan, ', 'a tu medida', ''], p: 'Constancia sin presión: un día de descanso no rompe nada.', btn: 'Ver mi plan', href: '#/mi-plan', icon: 'calendar' }
    ];
    let cur = 0, timer = null;
    const copy = h('div', { class: 'hh-copy' });
    const dots = h('div', { class: 'hh-dots', role: 'tablist', 'aria-label': 'Mensajes' });
    const sec = h('section', { class: 'home-hero', 'aria-roledescription': 'carrusel' }, h('div', { class: 'hh-art', html: L.art.scene() }), copy, dots);
    L.photos.attach(sec.querySelector('.hh-art'), 'hero');
    function draw() {
      const s = slides[cur]; copy.innerHTML = '';
      copy.append(h('h1', { id: 'page-title', tabindex: '-1' }, s.t[0], h('em', null, s.t[1]), s.t[2].trim() ? [h('br'), s.t[2].trim()] : null), h('p', null, s.p),
        h('div', { class: 'row' }, h('a', { class: 'btn btn-primary btn-lg', href: s.href }, ico(s.icon), s.btn, ico('arrow')),
          !started && cur === 0 ? h('a', { class: 'btn btn-glass btn-lg', href: '#/primeros-pasos' }, 'No sé nada de español') : null));
      copy.classList.remove('swap'); void copy.offsetWidth; if (!L.reducedMotion()) copy.classList.add('swap');
      Array.from(dots.children).forEach((d, i) => { d.setAttribute('aria-selected', String(i === cur)); d.classList.toggle('on', i === cur); });
    }
    slides.forEach((s, i) => dots.appendChild(h('button', { type: 'button', role: 'tab', 'aria-label': 'Mensaje ' + (i + 1), onclick: () => { cur = i; draw(); restart(); } })));
    function restart() { clearInterval(timer); if (!L.reducedMotion()) timer = setInterval(() => { if (!sec.isConnected) { clearInterval(timer); return; } cur = (cur + 1) % slides.length; draw(); }, 7000); }
    draw(); restart();
    return sec;
  }

  // ---------- tarjeta de la próxima lección ----------
  function lessonCard(target, started) {
    const les = target && C.lessons[target];
    const card = h('section', { class: 'glass lesson-hero' });
    card.appendChild(h('div', { class: 'lh-head' }, h('h2', null, ico('star'), started ? 'Tu próxima lección' : 'Tu primera lección'), h('a', { class: 'view-all', href: '#/aprender' }, 'Ver todas', ico('arrow'))));
    if (!les) { card.appendChild(h('p', { class: 'muted' }, 'Has completado todo el contenido disponible. Repasa tus palabras para mantenerlas frescas.')); card.appendChild(h('a', { class: 'btn btn-primary', href: '#/repaso' }, ico('repeat'), 'Ir al repaso')); return card; }
    card.appendChild(h('div', { class: 'lh-body' },
      (() => { const a = h('a', { class: 'lh-pic', href: '#/leccion/' + target, 'aria-label': 'Empezar: ' + les.title, html: L.art.street() + L.icoHtml('play', 'lh-play') }); L.photos.attach(a, 'street'); return a; })(),
      h('div', { class: 'lh-info' },
        h('span', { class: 'chip-tag' }, 'Nivel ' + les.level + ' · Unidad ' + les.unit),
        h('h3', null, les.title),
        h('p', { class: 'muted' }, les.goal || les.topic || ''),
        h('a', { class: 'btn btn-primary btn-lg', href: '#/leccion/' + target }, ico('play'), S.lessonDone(target) ? 'Repetir lección' : 'Empezar lección', ico('arrow'))),
      h('div', { class: 'lh-tiles' }, [['/escuchar', 'Audio', 'headphones'], ['/vocabulario', 'Vocabulario', 'book'], ['/practica', 'Quiz', 'target']].map((t) => h('a', { href: '#' + t[0] }, ico(t[2]), h('span', null, t[1]))))));
    return card;
  }

  // ---------- meta con anillo ----------
  function goalCard() {
    const lv = S.currentLevel(), p = S.levelProgress(lv), left = Math.max(0, p.total - p.done), nx = nextLevel(lv);
    const R = 52, CIRC = 2 * Math.PI * R;
    const ring = '<svg class="ring-svg" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f2a81d"/></linearGradient></defs><circle cx="64" cy="64" r="' + R + '" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="11"/><circle class="rg-arc" cx="64" cy="64" r="' + R + '" fill="none" stroke="url(#rg)" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (CIRC * (1 - p.pct / 100)).toFixed(1) + '" transform="rotate(-90 64 64)"/></svg>';
    return h('section', { class: 'glass goal-card' },
      h('h2', null, ico('target'), 'Tu meta'),
      h('p', null, nx ? (left ? 'Completa ' + left + (left === 1 ? ' lección' : ' lecciones') + ' para desbloquear el nivel ' + nx : '¡Nivel ' + lv + ' completado! Ya puedes pasar al ' + nx) : (left ? 'Completa ' + left + (left === 1 ? ' lección' : ' lecciones') + ' del nivel ' + lv + ', el más alto del curso' : '¡Has completado el curso hasta C1!')),
      h('div', { class: 'ring-box' }, h('span', { html: ring }), h('b', null, p.pct + '%')),
      h('a', { class: 'btn btn-glass', href: '#/aprender/' + lv }, 'Ver el nivel ' + lv));
  }

  function quickAccess() {
    const items = [['/vocabulario', 'Diccionario', 'book'], ['/traductor', 'Traductor', 'translate'], ['/libros', 'Libros', 'abc'], ['/mi-plan', 'Horario', 'calendar']];
    return h('section', { class: 'glass quick' }, h('h2', null, ico('bolt'), 'Acceso rápido'),
      h('div', { class: 'q-grid' }, items.map((x) => h('a', { href: '#' + x[0], class: 'q-tile' }, ico(x[2], 'q-ico'), h('span', null, x[1])))));
  }

  function keepGoing() {
    const el = h('section', { class: 'keep', 'aria-label': 'Ánimo' }, ico('star'), h('div', null, h('b', null, '¡Sigue así!'), h('span', null, 'Lo estás haciendo genial.')));
    L.photos.attach(el, 'globe'); return el;
  }

  function funFact() {
    const d = Math.floor(Date.now() / 86400000) % FACTS.length, f = FACTS[d];
    const tr = sup() === 'ar' ? f[2] : f[1];
    return h('section', { class: 'glass fact' },
      h('div', { class: 'fact-copy' }, h('h2', null, ico('bulb'), 'Dato curioso'),
        h('p', { class: 'fact-es', lang: 'es' }, f[0], ' ', L.Audio.btn(f[0].replace(/[¡!¿?]/g, ''), { small: true, name: f[0] })),
        sup() === 'none' ? h('p', { class: 'muted' }, f[3]) : h('p', { class: 'muted', dir: sup() === 'ar' ? 'rtl' : 'ltr' }, (sup() === 'ar' ? 'تعني: «' : 'means “') + tr + (sup() === 'ar' ? '»' : '”'), h('br'), f[3])),
      h('div', { class: 'fact-flag' }, h('img', { src: L.photos.src('flag'), alt: '', loading: 'lazy' })));
  }


  route('/', () => {
    const root = h('div', { class: 'home' });
    const placed = !!(S.prog && S.prog.placement);
    const st = S.stats();
    const started = !!(st.lessons || S.prog.lastLesson || placed);
    const nxt = S.nextLesson();
    const resume = S.prog.lastLesson && C.lessons[S.prog.lastLesson] ? S.prog.lastLesson : null;
    const first = (C.lessonList(C.levels[0].id)[0] || {}).id;
    const target = nxt || resume || (started ? null : first);
    root.appendChild(hero(started && !!target, target));

    const ov = overall(), lv = S.currentLevel(), stage = placed ? S.currentStage() : 1, streak = S.streak();
    root.appendChild(h('div', { class: 'stats-row' },
      stat('chart', ov.pct + '%', 'Tu progreso', ov.pct, 's-blue'),
      stat('calendar', stage + ' / ' + L.STAGES, 'Nivel actual · ' + lv, 100 * stage / L.STAGES, 's-green'),
      stat('flame', streak + (streak === 1 ? ' día' : ' días'), 'Racha de estudio', Math.min(100, streak * 100 / 7), 's-orange'),
      stat('star', String(S.xp()), 'Puntos totales', S.xpLevel().pct, 's-violet')));

    root.appendChild(h('div', { class: 'home-grid' }, lessonCard(target, started), goalCard()));
    root.appendChild(h('div', { class: 'home-grid two' }, quickAccess(), funFact()));
    root.appendChild(keepGoing());

    if (L.plan && placed) root.appendChild(L.plan.card());
    if (placed && S.currentStage() <= 3 && !((S.prog.done['pre:steps'] || {}).best >= 75)) root.appendChild(h('section', { class: 'glass', style: 'margin-top:16px' }, h('h2', null, ico('flag'), 'Primeros pasos · First steps'), h('p', null, '¿Nuevo en español? Aprende las letras, los números y las primeras palabras. · New to Spanish? Learn the letters, numbers and first words.'), h('a', { class: 'btn btn-primary', href: '#/primeros-pasos' }, 'Empezar')));
    if (L.A.isGuest() && !L.memoryMode) root.appendChild(h('div', { class: 'alert', style: 'margin-top:16px' }, h('strong', null, 'Tu progreso se guarda en este dispositivo. '), 'Puedes estudiar sin cuenta. Para guardar tu progreso en línea y seguir en otro teléfono, ', h('a', { href: '#/cuenta/crear' }, 'crea una cuenta'), '.'));
    const warn = L.homeParts.backupReminder(); if (warn) root.appendChild(warn);
    return root;
  }, 'Inicio');
})(window.LWS);
