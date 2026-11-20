/* Languway Spanish — recorrido de estudio simple: libro de palabras por lección, "ahora te toca", perfil y explicador de palabras */
(function (L) {
  'use strict';
  const { h, route } = L; const C = L.C, S = L.S, U = L.U;
  const ico = (n, c) => L.ico(n, c);
  const helpLang = () => { const l = L.sup ? L.sup.lang() : 'none'; return l === 'ar' ? 'ar' : 'en'; };
  const T = (en, ar) => (helpLang() === 'ar' ? ar : en);
  const rtl = () => (helpLang() === 'ar' ? { dir: 'rtl', lang: 'ar', 'data-nosup': '1' } : { lang: 'en', 'data-nosup': '1' });

  // textos de interfaz para la ayuda en inglés y árabe
  (C.uiTr = C.uiTr || []).push(
    ['Libro de palabras', 'Word book', 'كتاب الكلمات'], ['Libros de palabras', 'Word books', 'كتب الكلمات'], ['Ahora te toca', 'Up next', 'المطلوب الآن'],
    ['Mi perfil', 'My profile', 'ملفي الشخصي'], ['Continuar', 'Continue', 'متابعة'], ['Traductor', 'Translator', 'المترجم'], ['Libro', 'Book', 'الكتاب']);

  const lessonLabel = (id) => {
    const info = C.unitOfLesson(id), n = id.split('.l')[1];
    return { n, level: info.level.id, unit: info.unit.n, text: 'Nivel ' + info.level.id + ' · Unidad ' + info.unit.n + ' · Lección ' + n };
  };
  const doneLessons = () => Object.keys(S.prog.lessons).filter((id) => S.lessonDone(id) && C.lessons[id]);
  const totalLessons = () => Object.keys(C.lessons).length;

  // ---------- «Ahora te toca» ----------
  function nowCard() {
    const card = h('section', { class: 'card now-card' }, h('h2', null, ico('flag'), 'Ahora te toca'));
    const nxt = S.nextLesson && S.nextLesson();
    const rows = h('div', { class: 'now-rows' });
    if (!S.prog.placement && !doneLessons().length) {
      rows.appendChild(nowRow('target', 'Empieza por aquí', 'Haz la prueba de nivel o empieza desde la lección 1.', '#/prueba-de-nivel', 'Prueba de nivel'));
    }
    if (nxt && C.lessons[nxt]) {
      const lb = lessonLabel(nxt);
      rows.appendChild(nowRow('book', C.lessons[nxt].title, lb.text, '#/leccion/' + nxt, S.prog.lastLesson === nxt ? 'Continuar' : 'Empezar', true));
    }
    const due = S.dueWords ? S.dueWords().length : 0;
    if (due) rows.appendChild(nowRow('repeat', due + (due === 1 ? ' palabra para repasar' : ' palabras para repasar'), 'Dos minutos de repaso fijan lo aprendido.', '#/repaso', 'Repasar'));
    const done = doneLessons();
    if (done.length) {
      const last = done.sort().pop(); const lb = lessonLabel(last);
      rows.appendChild(nowRow('abc', 'Libro de palabras · Lección ' + lb.n, lb.text + ' · ' + C.lessons[last].title, '#/libro/' + last, 'Abrir libro'));
    }
    card.appendChild(rows);
    return card;
  }
  function nowRow(icon, title, sub, href, label, primary) {
    return h('div', { class: 'now-row' }, h('span', { class: 'now-ic', 'aria-hidden': 'true' }, ico(icon)),
      h('div', { class: 'now-tx' }, h('strong', null, title), h('span', { class: 'muted' }, sub)),
      h('a', { class: 'btn ' + (primary ? 'btn-primary' : 'btn-ghost') + ' btn-sm', href }, label));
  }

  // ---------- libro de palabras de una lección ----------
  function wordItem(v) {
    const w = v[0], pos = v[1];
    const gl = helpLang() === 'ar' && C.glossAr && C.glossAr[w];
    const card = h('article', { class: 'wb-item', 'aria-label': w });
    if (L.vis && L.vis.enabled()) card.appendChild(L.vis.pic(w, pos));
    card.appendChild(h('div', { class: 'wb-body' },
      h('div', { class: 'row sb' }, h('div', { class: 'w' }, h('span', { lang: 'es' }, w), L.Audio.btn(w, { small: true, name: w }), L.Audio.btn(w, { small: true, slow: true, name: w })), S.prog ? U.favBtn('words', C.wordId(w), w) : null),
      h('div', { class: 'row' }, h('span', { class: 'pos' }, pos), gl ? h('span', { class: 'ar-gloss-inline', lang: 'ar', dir: 'rtl', 'data-nosup': '1' }, gl) : null),
      h('p', { class: 'wb-def' }, v[2]),
      h('div', { class: 'ex' }, h('span', { html: L.vis.markSentence(w, v[3]) + ' ' }), L.Audio.btn(v[3], { small: true, name: v[3] })),
      v[4] ? h('div', { class: 'en', lang: 'en' }, v[4]) : null,
      h('a', { class: 'wb-tr', href: '#/traductor/' + encodeURIComponent(w) }, ico('translate'), ' Explicación completa')));
    return card;
  }
  route('/libro/:id', ({ params }) => {
    const id = params.id, les = C.lessons[id];
    if (!les) return U.empty('📖', 'Ese libro no existe.', h('a', { class: 'btn btn-primary', href: '#/libros' }, 'Ver todos los libros'));
    const lb = lessonLabel(id);
    const root = h('div', { class: 'wordbook' });
    root.appendChild(U.pageHead('Libro de palabras · Lección ' + lb.n, lb.text + ' · ' + les.title, [{ t: 'Libros', href: '#/libros' }, { t: 'Lección ' + lb.n }], 'abc'));
    if (!S.lessonDone(id)) {
      root.appendChild(h('section', { class: 'card glass lock-card' }, h('span', { class: 'lock-ic' }, ico('lock')), h('h2', null, 'Este libro se abre cuando termines la lección'),
        h('p', { class: 'muted' }, 'Completa «' + les.title + '» y aprueba su examen para abrir su libro de palabras.'),
        S.lessonUnlocked(id) ? h('a', { class: 'btn btn-primary', href: '#/leccion/' + id }, 'Ir a la lección') : h('a', { class: 'btn btn-primary', href: L.continueHref() }, 'Continuar con mi lección actual')));
      return root;
    }
    root.appendChild(h('p', { class: 'muted' }, les.vocab.length + ' palabras de esta lección, cada una con imagen, significado y una frase. Toca el altavoz para oírlas.'));
    root.appendChild(h('div', { class: 'wb-grid' }, les.vocab.map(wordItem)));
    const info = C.unitOfLesson(id), i = info.unit.lessons.findIndex((x) => x.id === id), nx = info.unit.lessons[i + 1];
    const acts = h('div', { class: 'row', style: 'margin-top:18px' }, h('a', { class: 'btn btn-primary', href: '#/repaso' }, ico('repeat'), ' Repasar estas palabras'));
    if (nx && C.lessons[nx.id]) acts.appendChild(h('a', { class: 'btn btn-ghost', href: '#/leccion/' + nx.id }, 'Siguiente lección'));
    acts.appendChild(h('a', { class: 'btn btn-ghost', href: '#/libros' }, 'Todos los libros'));
    root.appendChild(acts);
    return root;
  }, 'Libro de palabras');

  route('/libros', () => {
    const root = h('div');
    root.appendChild(U.pageHead('Libros de palabras', 'Cada lección tiene su propio libro de palabras. Se abre cuando terminas esa lección.', null, 'abc'));
    const cur = S.currentLevel();
    C.levels.forEach((lv) => {
      if (!lv.units.some((un) => un.lessons.some((r) => C.lessons[r.id]))) return;
      const det = h('details', { class: 'card wb-level' }, h('summary', null, h('strong', null, 'Nivel ' + lv.id), h('span', { class: 'muted' }, ' · ' + lv.name)));
      if (lv.id === cur) det.setAttribute('open', '');
      lv.units.forEach((un) => {
        const items = un.lessons.filter((r) => C.lessons[r.id]); if (!items.length) return;
        det.appendChild(h('h3', { class: 'wb-unit' }, 'Unidad ' + un.n + ': ' + un.title));
        items.forEach((r) => {
          const done = S.lessonDone(r.id), n = r.id.split('.l')[1];
          det.appendChild(h(done ? 'a' : 'div', { class: 'lesson-row' + (done ? ' done' : ' locked'), href: done ? '#/libro/' + r.id : null, 'aria-disabled': done ? null : 'true' },
            h('span', { class: 'n' }, done ? ico('check') : n),
            h('span', { class: 'lr-tx' }, h('strong', null, 'Lección ' + n + ' · ' + r.title), h('span', { class: 'muted' }, 'Libro de palabras · ' + C.lessons[r.id].vocab.length + ' palabras'),
              h('span', { class: 'chip-tag ' + (done ? 'green' : 'gray') }, ico(done ? 'book' : 'lock'), done ? ' Abrir' : ' Bloqueado'))));
        });
      });
      root.appendChild(det);
    });
    return root;
  }, 'Libros de palabras');

  // ---------- perfil ----------
  const avg = () => { const d = doneLessons(); return d.length ? Math.round(d.reduce((t, id) => t + (S.prog.lessons[id].best || 0), 0) / d.length) : null; };
  function weekCount() { // lecciones aprobadas en los últimos 7 días (según actividad)
    let n = 0; const d = new Date();
    for (let i = 0; i < 7; i++) { const a = S.prog.activity[L.dayKey(d)]; if (a && a.q) n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function verdict() {
    const done = doneLessons().length, tot = totalLessons(), pct = Math.round((100 * done) / tot), a = avg(), days = weekCount();
    let stage, tone;
    if (!done) { stage = 'Estás empezando tu camino.'; tone = 'info'; }
    else if (pct < 25) { stage = 'Principiante: todavía te queda mucho camino por delante.'; tone = 'info'; }
    else if (pct < 55) { stage = 'Nivel elemental-intermedio: ya tienes una base sólida.'; tone = 'ok'; }
    else if (pct < 85) { stage = 'Nivel intermedio: vas muy adelantado.'; tone = 'ok'; }
    else { stage = 'Nivel avanzado: estás cerca del final del recorrido.'; tone = 'ok'; }
    let pace, extra = '';
    if (!done) pace = 'Completa tu primera lección para recibir una valoración.';
    else if (a >= 85 && days >= 4) pace = 'Vas muy bien: buenas notas y constancia.';
    else if (a >= 75 && days >= 3) pace = 'Vas bien. Con un poco más de constancia avanzarás más rápido.';
    else if (a < 75) { pace = 'Necesitas reforzar: tus notas medias son bajas. Repite las lecciones difíciles y repasa cada día.'; tone = 'warn'; }
    else { pace = 'Tus notas son buenas, pero estudias pocos días. Intenta practicar al menos 4 días por semana.'; tone = 'warn'; }
    const weeks = (Date.now() - (S.prog.created || S.user.created || Date.now())) / 604800000;
    if (done >= 3 && weeks > 0.3) { const rate = done / Math.max(weeks, 1); const left = Math.ceil((tot - done) / Math.max(rate, 0.5)); extra = 'Al ritmo actual (' + rate.toFixed(1) + ' lecciones por semana) te faltan unas ' + left + ' semanas para terminar.'; }
    return { stage, pace, extra, tone, pct, done, tot, a, days };
  }
  function certSummary() {
    const LV = C.levels.map((l) => l.id);
    const stages = []; for (let n = 1; n <= L.STAGES; n++) if (S.stageDone(n)) stages.push(n);
    const levels = LV.filter((l) => S.levelDone(l));
    const fin = levels.length === LV.length && S.prog.finalExam && S.prog.finalExam.best >= 75;
    return { stages, levels, fin, LV };
  }
  function profile(opts) {
    const root = h('div', { class: 'profile' });
    const av = (S.prog.settings && S.prog.settings.avatar) || null;
    const name = S.user.name || 'Estudiante', username = S.user.username || S.user.email || '';
    root.appendChild(U.pageHead('Mi perfil', 'Tus datos, tu progreso, tus certificados y cómo vas.', null, 'user'));
    const info = h('section', { class: 'card glass pf-id' },
      h('div', { class: 'pf-av', 'aria-hidden': 'true' }, av && L.ICON_NAMES && L.ICON_NAMES.includes(av) ? ico(av) : name.slice(0, 1).toUpperCase()),
      h('div', { class: 'pf-info' }, h('h2', null, name),
        h('dl', { class: 'pf-dl' },
          h('dt', null, 'Usuario'), h('dd', null, '@' + username),
          h('dt', null, 'Correo'), h('dd', { class: 'muted' }, 'Esta plataforma no usa correo: entras con tu usuario y tu contraseña.'),
          h('dt', null, 'Contraseña'), h('dd', null, '••••••••', h('span', { class: 'muted' }, ' (por seguridad no se puede mostrar)')),
          h('dt', null, 'Miembro desde'), h('dd', null, L.fmtDate(S.user.created || S.prog.created || Date.now())),
          h('dt', null, 'Cuenta'), h('dd', null, L.A && L.A.hasCloud() ? 'Guardada en línea' : 'Guardada en este dispositivo')),
        h('div', { class: 'row' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: opts.passwordFlow }, ico('lock'), ' Cambiar contraseña'),
          h('a', { class: 'btn btn-ghost btn-sm', href: '#/configuracion/perfil' }, ico('gear'), ' Editar perfil'),
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: opts.signOut }, 'Cerrar sesión'))));
    root.appendChild(info);

    const v = verdict(), lv = S.currentLevel();
    root.appendChild(h('section', { class: 'card glass pf-eval' }, h('h2', null, ico('chart'), '¿Cómo voy?'),
      h('div', { class: 'pf-stats' },
        pfStat(v.pct + ' %', 'Del curso completado'), pfStat(v.done + ' / ' + v.tot, 'Lecciones hechas'), pfStat(v.a == null ? '—' : v.a + ' %', 'Nota media'), pfStat((S.currentStage()) + ' / ' + L.STAGES, 'Nivel · ' + lv)),
      U.bar(v.pct),
      h('div', { class: 'alert ' + (v.tone === 'warn' ? 'warn' : v.tone === 'ok' ? 'ok' : '') , style: 'margin-top:12px' }, h('strong', null, v.stage), ' ', v.pace, v.extra ? ' ' + v.extra : ''),
      h('p', { class: 'muted' }, 'Te quedan ' + (v.tot - v.done) + ' lecciones. Esta semana has estudiado ' + v.days + ' de 7 días.')));

    const cs = certSummary();
    const certCard = h('section', { class: 'card glass' }, h('h2', null, ico('trophy'), 'Mis certificados'),
      h('p', null, h('strong', null, cs.stages.length + ' de ' + L.STAGES), ' certificados de nivel · ', h('strong', null, cs.levels.length + ' de ' + cs.LV.length), ' certificados A1–C1 · Diploma final: ', h('strong', null, cs.fin ? 'conseguido' : 'pendiente')));
    if (cs.stages.length || cs.levels.length) certCard.appendChild(h('div', { class: 'row' }, cs.levels.map((l) => h('a', { class: 'chip-tag green', href: '#/certificado/' + l }, 'Nivel ' + l)), cs.stages.map((n) => h('a', { class: 'chip-tag green', href: '#/certificado-nivel/' + n }, 'Nivel ' + n))));
    let nextStage = 0; for (let n = 1; n <= L.STAGES; n++) if (!S.stageDone(n)) { nextStage = n; break; }
    if (nextStage) { const st = L.stage(nextStage); const left = st ? st.lessons.filter((id) => !S.lessonDone(id)).length : 0; certCard.appendChild(h('p', { class: 'muted' }, 'Próximo certificado: nivel ' + nextStage + ' · te faltan ' + left + (left === 1 ? ' lección.' : ' lecciones.'))); }
    certCard.appendChild(h('a', { class: 'btn btn-ghost btn-sm', href: '#/certificados' }, 'Ver todos los certificados'));
    root.appendChild(certCard);

    const sk = h('section', { class: 'card glass' }, h('h2', null, ico('target'), 'Mis habilidades'));
    let any = false;
    S.SKILLS.forEach((s) => { const pc = S.skillPct(s); if (pc === null) return; any = true; sk.appendChild(h('div', { class: 'skill-row' }, h('span', null, s.replace(/^./, (c) => c.toUpperCase())), U.bar(pc), h('b', null, pc + ' %'))); });
    if (!any) sk.appendChild(h('p', { class: 'muted' }, 'Aún no hay respuestas suficientes. Completa una lección para ver tus habilidades.'));
    const weak = S.weakSkills().slice(0, 2);
    if (weak.length) sk.appendChild(h('p', null, h('strong', null, 'Conviene reforzar: '), weak.map((x) => x.s + ' (' + x.p + ' %)').join(', '), '. ', h('a', { href: '#/practica' }, 'Practicar ahora')));
    root.appendChild(sk);
    root.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn btn-ghost', href: '#/progreso' }, 'Ver mi progreso completo'), h('a', { class: 'btn btn-ghost', href: '#/configuracion/datos' }, 'Copias de seguridad y datos')));
    return root;
  }
  const pfStat = (b, t) => h('div', { class: 'pf-stat' }, h('b', null, b), h('span', { class: 'muted' }, t));

  L.study = { nowCard, profile, lessonLabel };
})(window.LWS);
