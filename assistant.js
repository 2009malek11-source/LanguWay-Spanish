/* Languway Spanish — Asistente de reglas + explicación de cada párrafo */
(function (L) {
  'use strict';
  const { h, route } = L;
  const C = L.C, S = L.S, U = L.U;
  const As = (L.assist = {});

  // ---------- idioma de las etiquetas ----------
  const lang = () => (L.sup ? L.sup.lang() : 'none');
  const T = (es, en, ar) => { const l = lang(); if (l === 'ar' && ar) return ar; if (l !== 'none' && en) return en; return es; };
  const dirOf = () => (lang() === 'ar' ? 'rtl' : 'ltr');
  const tag = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const fold = (s) => L.stripAcc(L.norm(String(s || ''))).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const isArabic = (s) => /[؀-ۿ]/.test(s);

  // ---------- glosario de términos del bloque ----------
  function glossOf(term) {
    const t = tag(term).replace(/[.,;:!?¿¡«»"()]/g, '').trim();
    if (!t || t.length > 40) return null;
    if (!L.dict.built) L.dict.build();
    const r = L.dict.lookup(t); const e = r && r.entries && r.entries[0];
    if (!e) return null;
    const en = C.glossFor(e, 0); const ar = lang() === 'ar' && C.glossAr ? C.glossAr[e.w] : null;
    return { w: e.w, def: e.senses[0].def, en, ar };
  }
  const termsOf = (html) => { const out = []; String(html).replace(/<b>(.*?)<\/b>/g, (_, x) => { const t = tag(x); if (t && t.length <= 40 && !out.includes(t)) out.push(t); }); return out.slice(0, 8); };
  const spanish = (t) => /[a-záéíóúñü]/i.test(t) && !isArabic(t);

  const sentences = (html) => String(html).split(/(?<=[.!?:;])\s+(?!¿\.\.\.)(?=[A-ZÁÉÍÓÚÑ¿¡«<(])/).map((x) => x.trim()).filter(Boolean);

  // ---------- explicación de un bloque (párrafo, tabla, ejemplos, consejo) ----------
  As.explainBlock = function (b, ctx) {
    const box = h('div', { class: 'xp', dir: dirOf() });
    const note = (es, en, ar) => box.appendChild(h('p', { class: 'xp-note' }, T(es, en, ar)));
    const isP = typeof b === 'string' || (b && b.t === 'tip');
    if (isP) {
      const html = typeof b === 'string' ? b : b.text;
      note('Paso a paso: cada frase por separado.', 'Step by step: one sentence at a time.', 'خطوة بخطوة: كل جملة على حدة.');
      const ol = h('ol', { class: 'xp-steps', lang: 'es', dir: 'ltr' });
      sentences(html).forEach((s) => ol.appendChild(h('li', null, h('span', { html: s }))));
      box.appendChild(ol);
      const terms = termsOf(html);
      if (terms.length) {
        box.appendChild(h('h4', null, T('Palabras clave', 'Key words', 'الكلمات المفتاحية')));
        const ul = h('ul', { class: 'xp-terms' });
        terms.forEach((t) => {
          const g = glossOf(t);
          ul.appendChild(h('li', null, spanish(t) ? L.Audio.btn(t, { small: true, name: t }) : null, h('b', { lang: 'es', dir: 'ltr' }, t),
            g ? h('span', { class: 'muted' }, ' — ' + (lang() !== 'none' && g.en ? g.en : g.def)) : null,
            g && g.ar ? h('span', { class: 'muted', lang: 'ar', dir: 'rtl', 'data-nosup': '1' }, ' · ' + g.ar) : null));
        });
        box.appendChild(ul);
      }
    } else if (b && b.t === 'table') {
      note('Cómo leer la tabla: lee cada fila de izquierda a derecha; la primera columna es la clave.', 'How to read the table: read each row from left to right; the first column is the key.', 'كيف تقرأ الجدول: اقرأ كل صفّ من اليسار إلى اليمين؛ والعمود الأول هو المفتاح.');
      const ul = h('ul', { class: 'xp-rows', lang: 'es', dir: 'ltr' });
      b.rows.slice(0, 14).forEach((r) => {
        const cells = r.map(tag);
        ul.appendChild(h('li', null, spanish(cells[0]) && cells[0].length < 60 ? L.Audio.btn(cells[0], { small: true, name: cells[0] }) : null,
          cells.map((c, i) => h('span', { class: 'xp-cell' }, h('small', { class: 'muted' }, (b.head[i] ? tag(b.head[i]) : '') + ': '), c))));
      });
      box.appendChild(ul);
    } else if (b && b.t === 'ex') {
      note('Escucha cada ejemplo y toca una palabra para ver su significado.', 'Listen to each example and tap a word to see its meaning.', 'استمع إلى كل مثال، ثم المس أي كلمة لترى معناها.');
      b.list.forEach((x) => { const sp = x.split(' — ')[0]; box.appendChild(h('div', { class: 'xp-ex', lang: 'es', dir: 'ltr' }, L.Audio.btn(sp, { small: true, name: sp }), U.tapText(sp, 'span'), x.includes(' — ') ? h('small', { class: 'muted' }, ' — ' + x.split(' — ').slice(1).join(' — ')) : null)); });
    } else if (b && b.t === 'compare') {
      note('Compara las dos columnas: fíjate en qué cambia entre una y otra.', 'Compare the two columns: notice what changes between them.', 'قارن بين العمودين: لاحظ ما الذي يتغيّر بينهما.');
      b.cols.forEach((c) => box.appendChild(h('div', { class: 'xp-cmp' }, h('b', null, c.title), h('span', { html: ' — ' + c.text }))));
    }
    // ayuda de la lección en el idioma elegido (si existe)
    const hp = ctx && ctx.id && lessonHelp(ctx.id);
    if (hp) box.appendChild(h('details', { class: 'xp-help' }, h('summary', null, T('Resumen en palabras sencillas', 'In simple words', 'بكلمات بسيطة')), hp));
    const q = (ctx && ctx.title ? ctx.title + ': ' : '') + tag(typeof b === 'string' ? b : b.text || b.t || '').slice(0, 90);
    box.appendChild(h('div', { class: 'row xp-actions' },
      h('a', { class: 'btn btn-ghost btn-sm', href: '#/asistente?q=' + encodeURIComponent(ctx && ctx.title ? ctx.title : q) }, '💬 ' + T('Preguntar al asistente', 'Ask the assistant', 'اسأل المساعد'))));
    return box;
  };

  function lessonHelp(id) {
    const l = lang(); const src = l === 'ar' ? C.arHelp : C.enHelp;
    if (l === 'none' || !src || !src[id]) return null;
    const hp = src[id];
    return h('div', { lang: l === 'ar' ? 'ar' : 'en', dir: l === 'ar' ? 'rtl' : 'ltr', 'data-nosup': '1' }, h('b', null, hp.title), hp.lines.map((x) => h('p', { html: x })));
  }

  // Añade el botón «Explicar» a cada bloque de U.blocks
  const blocks0 = U.blocks;
  U.blocks = function (blocks, ctx) {
    const box = blocks0(blocks);
    const kids = Array.from(box.children); // blocks0 crea un hijo por bloque, en orden
    blocks.forEach((b, i) => {
      const el = kids[i]; if (!el) return;
      const btn = h('button', { type: 'button', class: 'xp-btn', 'aria-expanded': 'false' }, '🔎 ' + T('Explicar', 'Explain', 'اشرح'));
      const wrap = h('div', { class: 'xp-bar' }, btn);
      let panel = null;
      btn.addEventListener('click', () => {
        if (panel) { panel.remove(); panel = null; btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('on'); return; }
        panel = As.explainBlock(b, ctx); btn.setAttribute('aria-expanded', 'true'); btn.classList.add('on');
        wrap.insertAdjacentElement('afterend', panel);
        if (L.sup && L.sup.apply) L.sup.apply();
      });
      el.insertAdjacentElement('afterend', wrap);
    });
    return box;
  };

  // ---------- índice de reglas ----------
  let IDX = null;
  const bodyText = (blocks) => (blocks || []).map((b) => (typeof b === 'string' ? tag(b) : b.t === 'table' ? b.head.concat([].concat.apply([], b.rows)).map(tag).join(' ') : b.t === 'ex' ? b.list.join(' ') : b.t === 'tip' ? b.text : b.t === 'compare' ? b.cols.map((c) => c.title + ' ' + tag(c.text)).join(' ') : '')).join(' ');
  function index() {
    if (IDX) return IDX; IDX = [];
    C.levels.forEach((lv) => C.lessonList(lv.id).forEach((r) => {
      const les = C.lessons[r.id]; if (!les || !les.explain) return;
      IDX.push({ kind: 'lesson', id: r.id, level: les.level, title: les.explain.title, sub: les.title, goal: les.goal, blocks: les.explain.body, practiceHref: '#/leccion/' + r.id, ruleHref: '#/entrenador/regla/' + r.id, head: fold(les.explain.title + ' ' + les.title + ' ' + les.topic), hay: fold(les.goal + ' ' + bodyText(les.explain.body)) });
    }));
    (C.grammar || []).forEach((g) => IDX.push({ kind: 'gram', id: g.id, level: g.level, title: g.title, sub: g.summary, goal: g.summary, blocks: g.explain, mistakes: g.mistakes, practiceHref: '#/gramatica/' + g.id, ruleHref: '#/gramatica/' + g.id, head: fold(g.title + ' ' + g.summary), hay: fold(bodyText(g.explain)) }));
    (C.pron || []).forEach((p) => IDX.push({ kind: 'pron', id: p.id, level: 'A1', title: p.title, sub: p.summary, goal: p.summary, blocks: p.explain, practiceHref: '#/pronunciacion/' + p.id, ruleHref: '#/pronunciacion/' + p.id, head: fold(p.title + ' ' + p.summary), hay: fold(bodyText(p.explain)) }));
    return IDX;
  }

  // Alias: términos que la gente escribe (inglés, árabe, español coloquial) -> palabras clave en español
  const ALIAS = [
    [['to be', 'verb to be', 'be verb', 'ser y estar', 'ser vs estar', 'كان', 'يكون', 'فعل الكينونة', 'الفرق بين ser'], 'ser estar'],
    [['past', 'preterite', 'preterit', 'simple past', 'الماضي', 'ماضي'], 'indefinido pretérito pasado'],
    [['imperfect', 'used to', 'الماضي المستمر', 'الماضي الناقص'], 'imperfecto'],
    [['present perfect', 'have done', 'الماضي القريب', 'المضارع التام'], 'perfecto haber participio'],
    [['future', 'will', 'المستقبل', 'سوف'], 'futuro'],
    [['conditional', 'would', 'الشرط', 'جملة الشرط'], 'condicional si'],
    [['subjunctive', 'subjuntivo', 'المضارع الإلتباسي', 'صيغة التمني', 'التمني'], 'subjuntivo'],
    [['present', 'present tense', 'المضارع', 'الزمن الحاضر'], 'presente'],
    [['article', 'articles', 'the', 'a an', 'أداة التعريف', 'أدوات التعريف', 'ال التعريف'], 'artículos el la un una'],
    [['gender', 'masculine', 'feminine', 'plural', 'التذكير', 'التأنيث', 'الجمع', 'المذكر', 'المؤنث'], 'género número masculino femenino plural'],
    [['noun', 'nouns', 'اسم', 'الأسماء', 'noun'], 'sustantivos'],
    [['adjective', 'adjectives', 'الصفة', 'الصفات'], 'adjetivos'],
    [['pronoun', 'pronouns', 'الضمير', 'الضمائر', 'i you he she'], 'pronombres'],
    [['have', 'to have', 'there is', 'there are', 'يملك', 'هناك', 'يوجد'], 'tener haber hay'],
    [['for', 'por para', 'por vs para', 'por o para', 'من اجل', 'لأجل'], 'por para'],
    [['reflexive', 'reflexive verbs', 'الأفعال الانعكاسية'], 'reflexivos se'],
    [['gustar', 'like', 'to like', 'يحب', 'اعجاب'], 'gustar'],
    [['question', 'questions', 'question words', 'who what where', 'الأسئلة', 'أدوات الاستفهام'], 'interrogativos preguntas'],
    [['negative', 'negation', 'not', 'النفي'], 'negación no'],
    [['comparison', 'comparative', 'superlative', 'more than', 'المقارنة', 'التفضيل'], 'comparativos más menos'],
    [['command', 'imperative', 'orders', 'الأمر', 'فعل الأمر'], 'imperativo'],
    [['gerund', 'ing', 'continuous', 'progressive', 'المضارع المستمر', 'اسم الفاعل'], 'gerundio estar'],
    [['accent', 'accents', 'tilde', 'stress', 'علامة التشكيل', 'النبر', 'تشكيل'], 'tilde acento'],
    [['pronunciation', 'sounds', 'vowels', 'النطق', 'الحروف المتحركة', 'الصوائت'], 'vocales pronunciación'],
    [['number', 'numbers', 'الأرقام', 'الأعداد'], 'números'],
    [['time', 'telling time', 'clock', 'الوقت', 'الساعة'], 'hora'],
    [['connectors', 'linking words', 'however', 'because', 'therefore', 'أدوات الربط', 'ولكن', 'لأن', 'لذلك'], 'conectores sin embargo por eso'],
    [['reported speech', 'indirect speech', 'الكلام المنقول', 'الكلام غير المباشر'], 'estilo indirecto contar que'],
    [['formal', 'informal', 'tu usted', 'tú usted', 'رسمي', 'غير رسمي'], 'tú usted formal informal registro'],
    [['letter', 'email', 'formal letter', 'رسالة', 'بريد'], 'carta correo formal'],
    [['passive', 'passive voice', 'المبني للمجهول'], 'pasiva se'],
    [['relative', 'who which that', 'الاسم الموصول'], 'relativos que quien'],
    [['idiom', 'idioms', 'proverb', 'مثل', 'أمثال', 'تعابير'], 'modismos refranes'],
    [['future perfect', 'ir a'], 'ir a futuro'],
  ];
  function expand(q) {
    const raw = ' ' + String(q).toLowerCase() + ' '; let extra = '';
    ALIAS.forEach(([keys, sp]) => { if (keys.some((k) => raw.includes(k.toLowerCase()))) extra += ' ' + sp; });
    return extra;
  }
  const STOP = new Set('que de la el los las un una unos unas y o en es son por para con sin como me te se lo le les al del a quiero saber explicame explica explicar dime cual cuales cuando uso usar usa regla reglas sobre what is are the how do does when why use using explain tell me about rule rules please can you i to of for in and or an a ما هو هي هل كيف متى لماذا اشرح لي شرح قاعدة قواعد عن في من على'.split(' '));

  As.search = function (query, limit) {
    const idx = index(); const q = fold(query + ' ' + expand(query));
    const toks = q.split(' ').filter((t) => t.length > 1 && !STOP.has(t));
    if (!toks.length) return [];
    const uniq = Array.from(new Set(toks));
    const res = idx.map((r) => {
      let sc = 0;
      uniq.forEach((t) => { if (r.head.includes(t)) sc += 6 + (r.head.split(' ').includes(t) ? 3 : 0); if (r.hay.includes(t)) sc += 1 + Math.min(3, r.hay.split(t).length - 2) * 0.3; });
      if (r.kind === 'gram') sc *= 1.15;
      return { r, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    return res.slice(0, limit || 4).map((x) => x.r);
  };

  // ---------- chat ----------
  const history = [];
  const SUGG = ['ser y estar', 'pretérito indefinido', 'imperfecto', 'subjuntivo', 'por y para', 'artículos', 'género y número', 'verbos reflexivos', 'gustar', 'conectores'];

  function ruleAnswer(r, level) {
    const box = h('div', { class: 'as-answer' });
    box.appendChild(h('div', { class: 'row sb' }, h('strong', { class: 'as-rt' }, '📘 ' + r.title), h('span', { class: 'chip-tag' }, r.level)));
    if (r.sub) box.appendChild(h('p', { class: 'muted' }, r.sub));
    const hp = r.kind === 'lesson' ? lessonHelp(r.id) : null;
    if (hp) box.appendChild(h('div', { class: 'tip' }, h('strong', null, '💡 '), hp));
    else box.appendChild(h('p', { class: 'xp-note' }, T('Esta es la explicación de la regla, dividida en pasos.', 'Here is the rule explained in steps.', 'هذا شرح القاعدة مقسَّماً إلى خطوات.')));
    const list = r.blocks || []; const first = list.slice(0, level === 'more' ? list.length : 2);
    first.forEach((b) => {
      const part = h('div', { class: 'as-part' });
      part.appendChild(U.blocks([b], { id: r.kind === 'lesson' ? r.id : null, title: r.title }));
      box.appendChild(part);
    });
    if (list.length > first.length) {
      const more = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { more.remove(); list.slice(first.length).forEach((b) => box.insertBefore(h('div', { class: 'as-part' }, U.blocks([b], { id: r.kind === 'lesson' ? r.id : null, title: r.title })), foot)); } }, T('Ver el resto de la explicación', 'Show the rest of the explanation', 'عرض بقية الشرح'));
      box.appendChild(more);
    }
    if (r.mistakes && r.mistakes.length) {
      const ul = h('ul', { class: 'as-mist' }); r.mistakes.slice(0, 4).forEach((m) => ul.appendChild(h('li', null, typeof m === 'string' ? tag(m) : [m.wrong ? h('s', null, m.wrong) : null, m.right ? [' → ', h('b', null, m.right)] : null, m.why ? h('div', { class: 'muted' }, m.why) : null])));
      box.appendChild(h('details', { class: 'xp-help' }, h('summary', null, T('Errores comunes', 'Common mistakes', 'أخطاء شائعة')), ul));
    }
    const foot = h('div', { class: 'row as-foot' },
      h('a', { class: 'btn btn-ghost btn-sm', href: r.ruleHref }, '📖 ' + T('Ver la regla completa', 'Open the full rule', 'القاعدة كاملة')),
      h('a', { class: 'btn btn-ghost btn-sm', href: r.practiceHref }, '🎯 ' + T('Practicar', 'Practise', 'تدرّب')));
    box.appendChild(foot);
    return box;
  }

  function reply(query) {
    const out = h('div', { class: 'as-reply' });
    const q = String(query || '').trim();
    const hits = As.search(q, 4);
    const single = fold(q).split(' ').length <= 2 && q.length < 30;
    if (single) {
      if (!L.dict.built) L.dict.build();
      const r = L.dict.lookup(q.replace(/[¿?¡!.,]/g, ''));
      if (r && r.entries && r.entries[0] && !hits.length) { out.appendChild(h('p', null, T('Esto es lo que encontré en el diccionario:', 'Here is what I found in the dictionary:', 'هذا ما وجدته في القاموس:'))); out.appendChild(U.wordCard(r.entries[0], { english: true, source: 'asistente' })); return out; }
    }
    if (!hits.length) {
      out.appendChild(h('p', null, T('No encontré una regla con ese nombre. Prueba con otras palabras (por ejemplo «ser y estar» o «pasado»), o elige un tema:', 'I could not find a rule with that name. Try other words (for example “ser and estar” or “past”), or choose a topic:', 'لم أجد قاعدة بهذا الاسم. جرّب كلمات أخرى (مثل «ser و estar» أو «الماضي») أو اختر موضوعاً:')));
      out.appendChild(chips(SUGG)); return out;
    }
    out.appendChild(h('p', null, T('Claro, te lo explico:', 'Sure, let me explain:', 'بكل سرور، إليك الشرح:')));
    out.appendChild(ruleAnswer(hits[0]));
    if (hits.length > 1) {
      out.appendChild(h('p', { class: 'muted as-rel' }, T('También puede interesarte:', 'You may also want:', 'وقد يهمّك أيضاً:')));
      out.appendChild(chips(hits.slice(1).map((r) => r.title), hits.slice(1)));
    }
    const ok = h('div', { class: 'row as-ok' }, h('span', null, T('¿Lo has entendido?', 'Did you understand?', 'هل فهمت؟')),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: (e) => { e.currentTarget.parentNode.replaceWith(h('p', { class: 'alert ok' }, T('¡Genial! Sigue con la práctica.', 'Great! Carry on with practice.', 'رائع! تابع التدريب.'))); } }, '👍 ' + T('Sí', 'Yes', 'نعم')),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: (e) => {
        const row = e.currentTarget.parentNode; const r = hits[0];
        row.replaceWith(h('div', { class: 'as-answer' }, h('p', { class: 'alert' }, T('Vamos más despacio: aquí tienes toda la explicación y los ejemplos con audio.', 'Let us go slower: here is the whole explanation with audio examples.', 'لنتمهّل: إليك الشرح كاملاً مع أمثلة صوتية.')), ruleAnswer(r, 'more')));
      } }, '🤔 ' + T('No del todo', 'Not quite', 'ليس تماماً')));
    out.appendChild(ok);
    return out;
  }

  function chips(labels, rules) {
    return h('div', { class: 'as-chips' }, labels.map((t, i) => h('button', { type: 'button', class: 'chip-tag as-chip', onclick: () => As.ask(rules && rules[i] ? rules[i].title : t) }, t)));
  }

  let thread = null, input = null;
  As.ask = function (text) {
    const t = String(text || '').trim(); if (!t || !thread) return;
    history.push({ role: 'user', text: t });
    thread.appendChild(h('div', { class: 'as-msg me' }, t));
    const r = reply(t); history.push({ role: 'bot', text: '' });
    const m = h('div', { class: 'as-msg bot' }, r); thread.appendChild(m);
    m.scrollIntoView({ block: 'nearest', behavior: L.reducedMotion && L.reducedMotion() ? 'auto' : 'smooth' });
    if (L.sup && L.sup.apply) L.sup.apply();
  };

  route('/asistente', ({ q }) => {
    const root = h('div', { class: 'assistant' });
    root.appendChild(U.pageHead(T('Asistente de reglas', 'Rules assistant', 'مساعد القواعد'), T('Pregúntame por cualquier regla o palabra y te la explico paso a paso.', 'Ask me about any rule or word and I will explain it step by step.', 'اسألني عن أي قاعدة أو كلمة وسأشرحها لك خطوة بخطوة.')));
    root.appendChild(h('div', { class: 'alert' }, T('Entiendo español, English y العربية. Funciona sin conexión con las reglas de la aplicación; no envía tus preguntas a ningún sitio.', 'I understand Spanish, English and Arabic. I work offline using the rules inside the app and never send your questions anywhere.', 'أفهم الإسبانية والإنجليزية والعربية. أعمل دون إنترنت بقواعد التطبيق ولا أرسل أسئلتك إلى أي مكان.')));
    thread = h('div', { class: 'as-thread', 'aria-live': 'polite' });
    thread.appendChild(h('div', { class: 'as-msg bot' }, h('p', null, T('¡Hola! ¿Qué regla quieres entender? Elige un tema o escribe tu pregunta.', 'Hi! Which rule do you want to understand? Pick a topic or type your question.', 'مرحباً! أي قاعدة تريد أن تفهم؟ اختر موضوعاً أو اكتب سؤالك.')), chips(SUGG)));
    history.forEach((m) => { if (m.role === 'user') thread.appendChild(h('div', { class: 'as-msg me' }, m.text)); });
    input = h('input', { class: 'inp', id: 'as-in', type: 'text', maxlength: '120', autocomplete: 'off', placeholder: T('Escribe tu pregunta… (ej. ¿cuándo uso «por» y «para»?)', 'Type your question… (e.g. when do I use “por” and “para”?)', 'اكتب سؤالك… (مثل: متى أستخدم por وpara؟)'), 'aria-label': T('Pregunta', 'Question', 'السؤال'), 'data-noacc': '1' });
    const form = h('form', { class: 'as-form', onsubmit: (e) => { e.preventDefault(); const v = input.value; input.value = ''; As.ask(v); } }, input, h('button', { class: 'btn btn-primary', type: 'submit' }, T('Enviar', 'Send', 'إرسال')));
    root.append(thread, form);
    const pre = q && (q.q || q.r);
    if (pre) setTimeout(() => As.ask(q.r && C.lessons[q.r] ? C.lessons[q.r].explain.title : q.q), 30);
    return root;
  }, 'Asistente');

  // ---------- botón flotante ----------
  function fab() {
    if (document.getElementById('ask-fab')) return;
    const b = h('a', { id: 'ask-fab', class: 'ask-fab', href: '#/asistente', 'aria-label': 'Asistente de reglas · Rules assistant', title: 'Asistente · Assistant' }, h('span', { 'aria-hidden': 'true' }, '💬'), h('small', null, 'Asistente'));
    b.addEventListener('click', (e) => {
      const m = location.hash.match(/^#\/(leccion|entrenador\/regla)\/([^/?]+)/); const g = location.hash.match(/^#\/gramatica\/([^/?]+)/);
      if (m) { e.preventDefault(); location.hash = '#/asistente?r=' + m[2]; } else if (g) { const t = (C.grammar.find((x) => x.id === g[1]) || {}).title; if (t) { e.preventDefault(); location.hash = '#/asistente?q=' + encodeURIComponent(t); } }
    });
    document.body.appendChild(b);
  }
  function sync() { const b = document.getElementById('ask-fab'); if (!b) return; const p = location.hash.replace(/^#/, ''); b.hidden = /^\/(asistente|bienvenida|cuenta|verificar)/.test(p); }
  window.addEventListener('hashchange', sync);
  document.addEventListener('DOMContentLoaded', () => { fab(); sync(); });
  if (document.readyState !== 'loading') { fab(); sync(); }
})(window.LWS);
