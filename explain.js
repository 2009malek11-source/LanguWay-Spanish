/* Languway Spanish — explicador de palabras del traductor: significado en tu idioma, cómo se usa, gramática, conjugación e imagen */
(function (L) {
  'use strict';
  const { h } = L; const C = L.C;
  const X = (L.explain = {});
  const hl = () => (L.sup && L.sup.lang() === 'ar' ? 'ar' : 'en');
  const T = (en, ar) => (hl() === 'ar' ? ar : en);
  const attr = () => (hl() === 'ar' ? { dir: 'rtl', lang: 'ar', 'data-nosup': '1' } : { lang: 'en', 'data-nosup': '1' });
  const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ustedes'];

  // ---------- gramática regular ----------
  const END = {
    ar: { pres: ['o', 'as', 'a', 'amos', 'áis', 'an'], pret: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], imp: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
    er: { pres: ['o', 'es', 'e', 'emos', 'éis', 'en'], pret: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], imp: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ir: { pres: ['o', 'es', 'e', 'imos', 'ís', 'en'], pret: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], imp: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
  };
  const FUT = ['é', 'ás', 'á', 'emos', 'éis', 'án'], COND = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
  const strip = (inf) => String(inf).trim().replace(/se$/, '');
  X.group = (inf) => { const m = /(ar|er|ir)$/.exec(strip(inf)); return m ? m[1] : null; };
  X.conjugate = function (inf) {
    const base = strip(inf), g = X.group(base); if (!g) return null;
    const stem = base.slice(0, -2);
    const mk = (arr) => arr.map((e) => stem + e);
    return {
      group: g, pres: mk(END[g].pres), pret: mk(END[g].pret), imp: mk(END[g].imp),
      fut: FUT.map((e) => base + e), cond: COND.map((e) => base + e),
      part: stem + (g === 'ar' ? 'ado' : 'ido'), ger: stem + (g === 'ar' ? 'ando' : 'iendo'),
    };
  };
  X.plural = function (n) {
    const w = String(n).replace(/^(el|la|los|las|un|una)\s+/, '');
    if (/[áéíóú]/.test(w) && /[sn]$/.test(w)) return w.replace(/ó/, 'o').replace(/á/, 'a').replace(/é/, 'e').replace(/í/, 'i').replace(/ú/, 'u') + 'es';
    if (/z$/.test(w)) return w.slice(0, -1) + 'ces';
    if (/[aeiouáéíóú]$/.test(w)) return w + 's';
    if (/s$/.test(w)) return /[áéíóú]|(?:es|is|us)$/.test(w) && !/[áéíóú]/.test(w) ? w : w + 'es';
    return w + 'es';
  };
  X.gender = function (w) {
    const m = /^(el|un)\s/.exec(w), f = /^(la|una)\s/.exec(w);
    if (m) return 'm'; if (f) return 'f';
    const b = w.replace(/^(el|la|los|las|un|una)\s+/, '');
    if (/(ción|sión|dad|tad|tud|umbre|ie)$/.test(b) || /a$/.test(b)) return 'f';
    if (/(o|aje|or|án|ambre)$/.test(b)) return 'm';
    return null;
  };
  X.fromAr = function (q) {
    const t = String(q).trim().replace(/[ً-ٰٟ]/g, ''); const out = [];
    const ga = C.glossAr || {}; if (!L.dict.built) L.dict.build();
    Object.keys(ga).forEach((es) => { const parts = String(ga[es]).replace(/[ً-ٰٟ]/g, '').split(/[\/،,;؛()]+/).map((x) => x.trim()).filter(Boolean); if (parts.some((p) => p === t || (t.length > 2 && p.includes(t)))) { const e = L.dict.entryByWord(es); if (e && !out.includes(e)) out.push(e); } });
    return out.slice(0, 6);
  };

  // ---------- piezas de interfaz ----------
  const tbl = (cols, rows) => h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, T('Person', 'الضمير')), cols.map((c) => h('th', null, c[0])))),
    h('tbody', null, PERSONS.map((p, i) => h('tr', null, h('td', null, p), cols.map((c) => h('td', null, h('button', { type: 'button', class: 'say', lang: 'es', 'aria-label': c[1][i], onclick: () => L.Audio.speak && L.Audio.speak(c[1][i]) }, c[1][i]))))))));
  const para = (en, ar) => h('p', attr(), T(en, ar));
  const sec = (title, ...kids) => h('div', { class: 'ex-sec' }, h('h4', attr(), title), ...kids.filter(Boolean));

  function verbPart(e) {
    const inf = e.w, cj = X.conjugate(inf); if (!cj) return null;
    const given = e.forms || null;
    const pres = given && given.pres && given.pres.length === 6 ? given.pres : cj.pres;
    const pret = given && given.indef && given.indef.length === 6 ? given.indef : cj.pret;
    const irrP = given && given.pres && given.pres.some((f, i) => f !== cj.pres[i]);
    const irrI = given && given.indef && given.indef.some((f, i) => f !== cj.pret[i]);
    const g = cj.group, E = END[g];
    const box = h('div');
    box.appendChild(sec(T('How this verb works', 'كيف يعمل هذا الفعل'),
      para('«' + inf + '» is an infinitive (the dictionary form, "to ' + (e.gloss ? String(e.gloss).split(';')[0].replace(/^to /, '') : '…') + '"). It ends in -' + g + ', so it belongs to the -' + g + ' group. In Spanish the verb changes its ending for each person (who does the action).',
        '«' + inf + '» هو المصدر (الصيغة الموجودة في القاموس). ينتهي بـ -' + g + ' فهو من مجموعة أفعال -' + g + '. في الإسبانية تتغير نهاية الفعل بحسب الفاعل (من يقوم بالفعل).'),
      para('Present (what happens now or usually): remove -' + g + ' and add ' + E.pres.map((x) => '-' + x).join(', ') + '. Example: ' + pres[0] + ', ' + pres[1] + '…',
        'المضارع (ما يحدث الآن أو دائماً): احذف -' + g + ' وأضف ' + E.pres.map((x) => '-' + x).join('، ') + '. مثال: ' + pres[0] + '، ' + pres[1] + '…'),
      para('Past (finished action, "preterite"): remove -' + g + ' and add ' + E.pret.map((x) => '-' + x).join(', ') + '. Example: ' + pret[0] + ', ' + pret[2] + '.',
        'الماضي (فعل انتهى): احذف -' + g + ' وأضف ' + E.pret.map((x) => '-' + x).join('، ') + '. مثال: ' + pret[0] + '، ' + pret[2] + '.'),
      para('Imperfect (habit or "used to"): ' + cj.imp[0] + ', ' + cj.imp[2] + '. Future: keep the whole infinitive and add -é, -ás, -á, -emos, -éis, -án → ' + cj.fut[0] + '. Past participle (for "have done"): ' + cj.part + '. Gerund (for "-ing"): ' + cj.ger + '.',
        'الماضي المستمر (عادة قديمة): ' + cj.imp[0] + '، ' + cj.imp[2] + '. المستقبل: أبقِ المصدر كاملاً وأضف -é, -ás, -á, -emos, -éis, -án ← ' + cj.fut[0] + '. اسم المفعول (للماضي التام): ' + cj.part + '. المصدر الحالي (للاستمرار -ing): ' + cj.ger + '.')));
    if (irrP || irrI) box.appendChild(h('div', Object.assign({ class: 'alert warn' }, attr()), h('strong', null, T('Irregular verb. ', 'فعل شاذ. ')), T('Some forms do not follow the regular pattern: learn them by heart. The table shows the real forms.', 'بعض الصيغ لا تتبع القاعدة العادية فيجب حفظها. الجدول يعرض الصيغ الصحيحة.')));
    else if (!given) box.appendChild(h('p', Object.assign({ class: 'muted' }, attr()), T('Forms below follow the regular pattern. A few verbs are irregular, so check an example sentence if one looks odd.', 'الصيغ أدناه تتبع القاعدة العادية. بعض الأفعال شاذة، فتأكد من جملة مثال إن بدت لك الصيغة غريبة.')));
    box.appendChild(tbl([[T('Present', 'المضارع'), pres], [T('Past', 'الماضي'), pret], [T('Imperfect', 'الماضي المستمر'), cj.imp], [T('Future', 'المستقبل'), cj.fut]]));
    return box;
  }
  function nounPart(e) {
    const g = X.gender(e.w), base = e.w.replace(/^(el|la|los|las|un|una)\s+/, ''), pl = X.plural(e.w);
    const art = g === 'm' ? ['el', 'los', 'un'] : g === 'f' ? ['la', 'las', 'una'] : null;
    return sec(T('How this noun works', 'كيف يعمل هذا الاسم'),
      g ? para('«' + base + '» is ' + (g === 'm' ? 'masculine' : 'feminine') + ': ' + art[0] + ' ' + base + ' (the), ' + art[2] + ' ' + base + ' (a). Every Spanish noun has a gender, so learn the word together with its article.',
        '«' + base + '» اسم ' + (g === 'm' ? 'مذكر' : 'مؤنث') + ': ' + art[0] + ' ' + base + ' (التعريف)، ' + art[2] + ' ' + base + ' (التنكير). لكل اسم في الإسبانية جنس، فتعلّم الكلمة مع أداة التعريف.')
        : para('Check the article that comes with this word to know if it is masculine (el/un) or feminine (la/una).', 'انتبه لأداة التعريف المصاحبة للكلمة لتعرف هل هي مذكر (el/un) أم مؤنث (la/una).'),
      para('Plural: ' + (art ? art[1] + ' ' : '') + pl + '. Rule: after a vowel add -s; after a consonant add -es; -z becomes -ces.', 'الجمع: ' + (art ? art[1] + ' ' : '') + pl + '. القاعدة: بعد حرف علة أضف -s؛ بعد حرف ساكن أضف -es؛ و-z تصبح -ces.'));
  }
  function adjPart(e) {
    const b = e.w; let f = b, mp, fp;
    if (/o$/.test(b)) { f = b.slice(0, -1) + 'a'; mp = b + 's'; fp = f + 's'; } else if (/(or|ón|án|ín)$/.test(b)) { f = b + 'a'; mp = b + 'es'; fp = f + 's'; } else { mp = X.plural(b); fp = mp; }
    return sec(T('How this adjective works', 'كيف يعمل هذا الوصف'),
      para('An adjective agrees with the noun in gender and number: ' + b + ' (m.) · ' + f + ' (f.) · ' + mp + ' (m. pl.) · ' + fp + ' (f. pl.). It usually goes after the noun: «un coche ' + b + '».',
        'الصفة تتطابق مع الاسم في الجنس والعدد: ' + b + ' (مذكر) · ' + f + ' (مؤنث) · ' + mp + ' (جمع مذكر) · ' + fp + ' (جمع مؤنث). وتأتي عادة بعد الاسم.'));
  }
  const GENERIC = {
    adverbio: ['An adverb says how, when, where or how much. It never changes (no gender, no plural). Many end in -mente (rápida → rápidamente).', 'الظرف يبين كيف أو متى أو أين أو كم. وهو لا يتغير (لا جنس ولا جمع). كثير منها ينتهي بـ -mente.'],
    preposición: ['A preposition links words and always comes before a noun or pronoun. Learn it inside a phrase, because it is rarely translated word for word.', 'حرف الجر يربط الكلمات ويأتي قبل اسم أو ضمير. تعلمه داخل عبارة لأنه نادراً ما يُترجم حرفياً.'],
    conector: ['A connector links ideas or sentences (and, but, because…). It does not change.', 'أداة ربط تصل الأفكار أو الجمل (و، لكن، لأن…) ولا تتغير.'],
    interjección: ['An interjection expresses a feeling or a greeting and is used on its own.', 'تعبير عن شعور أو تحية ويُستعمل وحده.'],
    expresión: ['An expression is a fixed phrase: use it as a whole and do not translate it word for word.', 'عبارة ثابتة: استعملها كاملة ولا تترجمها كلمة بكلمة.'],
    locución: ['A set phrase that works like a single word. Learn it as a block.', 'عبارة ثابتة تعمل كأنها كلمة واحدة. احفظها كتلة واحدة.'],
    modismo: ['An idiom: its meaning is figurative, so it cannot be understood word for word.', 'تعبير مجازي لا يُفهم بترجمة كل كلمة على حدة.'],
    perífrasis: ['A verb phrase made of a conjugated verb plus an infinitive, gerund or participle. Only the first verb changes with the person.', 'تركيب فعلي: فعل مصرّف + مصدر أو حال أو اسم مفعول. الفعل الأول فقط يتغير بحسب الفاعل.'],
    numeral: ['A number word. Numbers up to 29 are one word; from 31 on they are written as tens + y + units (treinta y uno).', 'كلمة عدد. الأعداد حتى 29 كلمة واحدة، ومن 31 تُكتب: العشرات + y + الآحاد.'],
    pronombre: ['A pronoun replaces a noun. Spanish often drops subject pronouns because the verb ending already shows the person.', 'الضمير يحل محل الاسم. تحذف الإسبانية ضمائر الفاعل غالباً لأن نهاية الفعل تدل على الفاعل.'],
  };
  function genericPart(e) {
    const k = Object.keys(GENERIC).find((x) => String(e.pos).startsWith(x)); if (!k) return null;
    return sec(T('How to use it', 'كيف تستعملها'), para(GENERIC[k][0], GENERIC[k][1]));
  }

  // ---------- bloque principal para una entrada del diccionario ----------
  X.block = function (e, ctx) {
    const box = h('section', { class: 'card ex-card', 'aria-label': 'Explicación' });
    box.appendChild(h('h3', Object.assign({ class: 'ex-title' }, attr()), L.ico('bulb'), T('Explanation', 'الشرح')));
    const lang = L.sup ? L.sup.lang() : 'none';
    const ar = C.glossAr && C.glossAr[e.w];
    const en = e.gloss ? String(e.gloss).split(';').slice(0, 3).join(' · ') : null;
    const mean = h('div', Object.assign({ class: 'ex-mean' }, attr()),
      h('div', null, h('small', { class: 'muted' }, T('Meaning in your language', 'المعنى بلغتك')), h('b', null, lang === 'ar' && ar ? ar : en || e.senses[0].def)),
      lang === 'ar' && !ar && en ? h('small', { class: 'muted' }, T('', 'لا يوجد معنى عربي لهذه الكلمة بعد؛ هذا هو المعنى بالإنجليزية.')) : null);
    box.appendChild(mean);
    box.appendChild(sec(T('When do we use it?', 'متى نستعملها؟'), h('p', { lang: 'es' }, e.senses[0].def),
      h('p', { class: 'ex' }, h('span', { html: L.vis.markSentence(e.w, e.senses[0].ex) + ' ' }), L.Audio.btn(e.senses[0].ex, { small: true, name: e.senses[0].ex })),
      e.senses[0].en ? h('p', { class: 'muted', lang: 'en' }, e.senses[0].en) : null));
    const pos = String(e.pos);
    let part = null;
    if (pos.startsWith('verbo') || e.forms) part = verbPart(e);
    else if (pos.startsWith('sustantivo')) part = nounPart(e);
    else if (pos.startsWith('adjetivo')) part = adjPart(e);
    else part = genericPart(e);
    if (part) box.appendChild(part);
    if (!['en', 'ar'].includes(lang) && lang !== 'none') box.appendChild(h('div', { class: 'ex-online' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: (ev) => online(e.w, lang, ev.currentTarget) }, L.ico('globe'), ' ' + T('Translate into my language (online)', 'ترجمة إلى لغتي (عبر الإنترنت)'))));
    return box;
  };

  // ---------- consulta en línea (Wikipedia / Wiktionary) ----------
  async function getJson(url) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    try { const r = await fetch(url, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); }
  }
  const text = (html) => { const d = new DOMParser().parseFromString(String(html || ''), 'text/html'); return (d.body.textContent || '').replace(/\s+/g, ' ').trim(); };
  async function online(word, lang, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    const j = await getJson('https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=langlinks&lllang=' + encodeURIComponent(lang) + '&titles=' + encodeURIComponent(word.replace(/^(el|la|los|las)\s+/, '')));
    const pg = j && j.query && j.query.pages ? Object.values(j.query.pages)[0] : null;
    const tr = pg && pg.langlinks && pg.langlinks[0] ? pg.langlinks[0]['*'] : null;
    const out = h('p', attr(), tr ? '«' + tr + '»' : T('No online translation was found for this word.', 'لم أجد ترجمة عبر الإنترنت لهذه الكلمة.'));
    if (btn && btn.parentNode) btn.parentNode.replaceChildren(out);
  }
  async function photo(word, host) {
    const j = await getJson('https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=640&titles=' + encodeURIComponent(word));
    const pg = j && j.query && j.query.pages ? Object.values(j.query.pages)[0] : null;
    if (pg && pg.thumbnail && /^https:\/\/upload\.wikimedia\.org\//.test(pg.thumbnail.source)) {
      const img = new Image(); img.alt = word; img.className = 'ex-photo'; img.referrerPolicy = 'no-referrer'; img.onerror = () => img.remove(); img.src = pg.thumbnail.source;
      host.appendChild(h('figure', { class: 'ex-fig' }, img, h('figcaption', { class: 'muted' }, 'Foto: Wikipedia · ' + (pg.title || word))));
    }
  }
  // Palabra que no está en el diccionario de la plataforma
  X.unknown = function (q) {
    const word = String(q).trim().replace(/[.,;:!?¿¡]/g, '');
    const box = h('section', { class: 'card ex-card' });
    if (!word || /\s/.test(word) || /[؀-ۿ]/.test(word)) return box;
    box.appendChild(h('h3', Object.assign({ class: 'ex-title' }, attr()), L.ico('globe'), T('Looking it up online…', 'جارٍ البحث عنها عبر الإنترنت…')));
    const body = h('div'); box.appendChild(body);
    (async () => {
      if (navigator.onLine === false) { box.replaceChildren(h('p', Object.assign({ class: 'muted' }, attr()), T('You are offline. Connect to the internet to look up words that are not in the built-in dictionary.', 'أنت غير متصل. اتصل بالإنترنت للبحث عن كلمات ليست في القاموس المدمج.'))); return; }
      const j = await getJson('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word.toLowerCase()));
      const list = j && j.es ? j.es : null;
      if (!list || !list.length) { box.replaceChildren(h('p', Object.assign({ class: 'muted' }, attr()), T('No dictionary entry found online for «' + word + '». Check the spelling and the accents.', 'لم أجد «' + word + '» في القاموس عبر الإنترنت. تحقق من الإملاء والحركات.'))); return; }
      box.replaceChildren(h('h3', Object.assign({ class: 'ex-title' }, attr()), L.ico('bulb'), T('Online dictionary: ', 'القاموس عبر الإنترنت: '), h('span', { lang: 'es' }, word), L.Audio.btn(word, { small: true, name: word })));
      list.slice(0, 3).forEach((it) => {
        const defs = (it.definitions || []).slice(0, 3).map((d) => text(d.definition)).filter(Boolean);
        box.appendChild(h('div', { class: 'ex-sec' }, h('h4', { lang: 'en' }, it.partOfSpeech || ''), h('ol', { lang: 'en' }, defs.map((d) => h('li', null, d)))));
        const p = String(it.partOfSpeech || '').toLowerCase();
        if (p === 'verb' && X.group(word)) { const e = { w: word, forms: null, gloss: (defs[0] || '').slice(0, 40) }; box.appendChild(verbPart(e)); }
        else if (p === 'noun') box.appendChild(nounPart({ w: word }));
        else if (p === 'adjective') box.appendChild(adjPart({ w: word }));
      });
      const lang = L.sup ? L.sup.lang() : 'none';
      if (lang !== 'none' && lang !== 'en') box.appendChild(h('div', { class: 'ex-online' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: (ev) => online(word, lang, ev.currentTarget) }, L.ico('globe'), ' ' + T('Translate into my language (online)', 'ترجمة إلى لغتي (عبر الإنترنت)'))));
      if (L.S.prog && L.S.prog.settings && L.S.prog.settings.realPhotos !== 'off') photo(word, box);
    })();
    return box;
  };
})(window.LWS);
