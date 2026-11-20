/* Languway Spanish — Configuración completa en secciones plegables */
(function (L) {
  'use strict';
  const { h, route } = L;
  const S = L.S, A = L.A, U = L.U;

  const AVATARS = ['star', 'flame', 'bolt', 'heart', 'rocket', 'moon', 'sun', 'globe', 'compass', 'book', 'cap', 'bulb', 'target', 'flag', 'trophy', 'spark', 'palette', 'puzzle', 'headphones', 'mic'];
  const REASONS = [['', '—'], ['travel', 'Viajar · Travel · السفر'], ['work', 'Trabajo · Work · العمل'], ['study', 'Estudios y exámenes · Study · الدراسة'], ['family', 'Familia y amigos · Family · العائلة'], ['culture', 'Cultura y lectura · Culture · الثقافة'], ['fun', 'Por gusto · For fun · للمتعة']];
  const LEVELS = [['basic', 'Básico · Basic · أساسي'], ['good', 'Bueno · Good · جيد'], ['fluent', 'Fluido · Fluent · طليق']];
  const st = () => S.prog.settings;

  async function setSetting(k, v) { S.prog.settings[k] = v; S.markProg(); await U.save(true); }
  async function setMany(o) { Object.assign(S.prog.settings, o); S.markProg(); await U.save(true); }
  const cleanName = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const validName = (v) => v.length >= 2 && v.length <= 40 && /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(v);

  // El nombre visible se guarda en el progreso (así viaja con la cuenta) y en el usuario local.
  async function applyDisplayName() {
    const n = st().displayName;
    if (!n || !A.user || A.user.name === n) return;
    A.user.name = n;
    if (!A.isGuest()) { try { await L.db.put('users', A.user); } catch (e) { /* sin almacenamiento */ } }
    if (L.refreshAcct) L.refreshAcct();
  }
  const refresh0 = L.refreshAcct;
  L.refreshAcct = function () { if (S.prog && st().displayName && A.user && !A.isGuest()) A.user.name = st().displayName; if (refresh0) refresh0(); };

  // ---------- teclado de tildes (opcional) ----------
  const ACC = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];
  let bar = null, target = null;
  function wantsBar(el) {
    if (!el || !el.matches) return false;
    if (!el.matches('input[type=text], input:not([type]), textarea')) return false;
    if (el.closest('.sbar, .dsearch, .auth, form[data-noacc], [data-noacc]')) return false;
    if (/pass|user|name|search/i.test((el.id || '') + (el.name || '') + (el.getAttribute('autocomplete') || ''))) return false;
    return !!el.closest('#view');
  }
  function ensureBar() {
    if (bar) return bar;
    bar = h('div', { class: 'accbar', role: 'toolbar', 'aria-label': 'Caracteres especiales del español', hidden: true });
    ACC.forEach((c) => bar.appendChild(h('button', { type: 'button', class: 'acckey', 'aria-label': 'Insertar ' + c, onmousedown: (e) => e.preventDefault(), ontouchstart: (e) => e.preventDefault(), onclick: () => {
      if (!target) return; const s = target.selectionStart == null ? target.value.length : target.selectionStart, e2 = target.selectionEnd == null ? s : target.selectionEnd;
      target.value = target.value.slice(0, s) + c + target.value.slice(e2); target.selectionStart = target.selectionEnd = s + 1;
      target.dispatchEvent(new Event('input', { bubbles: true })); target.focus();
    } }, c)));
    document.body.appendChild(bar); return bar;
  }
  document.addEventListener('focusin', (e) => {
    if (!S.prog || st().accentBar === false) return;
    if (wantsBar(e.target)) { target = e.target; ensureBar().hidden = false; document.body.classList.add('has-accbar'); }
  });
  document.addEventListener('focusout', () => { setTimeout(() => { const a = document.activeElement; if (bar && !(a && wantsBar(a))) { bar.hidden = true; document.body.classList.remove('has-accbar'); } }, 120); });

  // ---------- piezas ----------
  const field = (label, control, help) => h('div', { class: 'field' }, h('label', null, label), control, help ? h('p', { class: 'muted' }, help) : null);
  function toggle(key, label, help, def, after) {
    const on = st()[key] === undefined ? def : st()[key] !== false;
    const cb = h('input', { type: 'checkbox', id: 'set-' + key, checked: on ? '' : null, onchange: async (e) => { await setSetting(key, e.target.checked); L.applyPrefs(); if (after) after(e.target.checked); } });
    return h('div', { class: 'field' }, h('label', { for: 'set-' + key }, cb, ' ' + label), help ? h('p', { class: 'muted' }, help) : null);
  }
  function select(id, opts, cur, onchange) {
    return h('select', { class: 'inp', id, onchange: (e) => onchange(e.target.value) }, opts.map(([v, t]) => h('option', { value: v, selected: String(v) === String(cur) ? '' : null }, t)));
  }
  const nameOf = (code) => { const f = L.sup.LANGS.find((x) => x[0] === code); return f ? f[1] : code; };

  // Cada sección: [id, icono, título, descripción, constructor]
  function sections() {
    const out = [];
    const add = (id, icon, title, desc, build) => out.push({ id, icon, title, desc, build });

    // ===== 1. Perfil =====
    add('perfil', 'user', 'Perfil · Profile · الملف الشخصي', 'Nombre, avatar y motivo de estudio.', () => {
      const box = h('div');
      const nm = h('input', { class: 'inp', id: 'pf-name', type: 'text', maxlength: '40', autocomplete: 'name', value: st().displayName || (A.isGuest() ? '' : A.user.name) || '', 'data-noacc': '1' });
      const err = h('p', { class: 'field-err', role: 'alert' });
      let av = AVATARS.includes(st().avatar) ? st().avatar : AVATARS[0];
      const grid = h('div', { class: 'avgrid', role: 'radiogroup', 'aria-label': 'Avatar' }, AVATARS.map((a) => h('button', { type: 'button', 'aria-label': a, class: 'av' + (a === av ? ' on' : ''), role: 'radio', 'aria-checked': String(a === av), onclick: (e) => { av = a; grid.querySelectorAll('.av').forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-checked', 'true'); } }, L.ico(a))));
      const why = select('pf-why', REASONS, st().reason || '', () => {});
      box.append(
        h('div', { class: 'field' }, h('label', { for: 'pf-name' }, 'Nombre que se muestra (también en los certificados) · Display name'), nm, err),
        h('div', { class: 'field' }, h('label', null, 'Avatar'), grid),
        h('div', { class: 'field' }, h('label', { for: 'pf-why' }, 'Por qué aprendo español · Why I learn Spanish'), why),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
          const v = cleanName(nm.value); err.textContent = '';
          if (v && !validName(v)) { err.textContent = 'Usa solo letras, espacios, punto, apóstrofo o guion (2 a 40 caracteres). · Letters only.'; return; }
          await setMany({ displayName: v, avatar: av, reason: why.value }); await applyDisplayName(); L.toast('Perfil guardado.', 'ok', 2200);
        } }, 'Guardar perfil · Save profile'));
      return box;
    });

    // ===== 2. Cuenta =====
    add('cuenta', 'lock', 'Cuenta y seguridad · Account · الحساب', 'Usuario, sincronización, contraseña, cerrar sesión y eliminar la cuenta.', () => {
      const box = h('div');
      if (A.isGuest()) {
        box.append(h('p', null, 'You are learning as a guest: your progress stays only on this device. Create an account (username + password, no email) to keep it online and use it on any phone.'),
          h('div', { class: 'row' }, h('a', { class: 'btn btn-primary', href: '#/cuenta/crear' }, 'Create Account'), h('a', { class: 'btn btn-ghost', href: '#/cuenta/entrar' }, 'Sign In'), L.accountFlows.restoreAccountButton()));
        return box;
      }
      const u = A.user;
      const syncInfo = h('p', { class: 'muted', 'aria-live': 'polite' }, (A.hasCloud() ? '☁️ Saved online' : '⚠️ Not connected online: sign in again to sync') + (st().lastSync ? ' · ' + L.fmtDate(st().lastSync) : ''));
      box.append(
        h('dl', { class: 'kv' }, h('dt', null, 'Username'), h('dd', null, '@' + (u.username || u.email)), h('dt', null, 'Created'), h('dd', null, L.fmtDate(u.created)), h('dt', null, 'Last sign-in'), h('dd', null, L.fmtDate(u.lastLogin || u.created))),
        h('p', { class: 'muted' }, 'The username identifies your account and cannot be changed. If you want another one, create a new account and restore a backup into it.'),
        syncInfo,
        h('div', { class: 'row' }, h('button', { class: 'btn btn-ghost', type: 'button', onclick: async (ev) => {
          const b = ev.currentTarget; b.disabled = true;
          if (!A.hasCloud() || !navigator.onLine) { L.toast('Sign in again while online to sync.', 'err', 4000); b.disabled = false; return; }
          const pulled = await A.pull(false); const pushed = await A.push();
          if (pushed || pulled) { await setSetting('lastSync', Date.now()); syncInfo.textContent = '☁️ Saved online · ' + L.fmtDate(Date.now()); L.toast('Synchronized.', 'ok', 2500); } else L.toast('Could not synchronize now. Try again later.', 'err', 4000);
          b.disabled = false;
        } }, '🔄 Sync now'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { await A.signOut(); L.refreshAcct(); L.toast('Signed out. Your progress is saved.', 'ok', 3500); location.hash = '#/'; L.render(); } }, 'Sign out')),
        h('h3', { style: 'margin-top:16px' }, 'Change password'));
      const cur = h('input', { class: 'inp', type: 'password', id: 'pw-cur', autocomplete: 'current-password', 'data-noacc': '1' });
      const n1 = h('input', { class: 'inp', type: 'password', id: 'pw-new', autocomplete: 'new-password', 'data-noacc': '1' });
      const n2 = h('input', { class: 'inp', type: 'password', id: 'pw-new2', autocomplete: 'new-password', 'data-noacc': '1' });
      const pe = h('p', { class: 'field-err', role: 'alert' });
      box.append(field('Current password', cur), field('New password (8 to 64 characters)', n1), field('Repeat the new password', n2), pe,
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async (ev) => {
          pe.textContent = ''; const b = ev.currentTarget; b.disabled = true;
          const r = await A.changePassword(cur.value, n1.value, n2.value); b.disabled = false;
          if (!r.ok) { pe.textContent = r.error; return; }
          cur.value = n1.value = n2.value = ''; L.toast('Password changed.', 'ok', 3000);
        } }, 'Change password'),
        h('h3', { style: 'margin-top:16px' }, 'Delete account'),
        h('p', { class: 'muted' }, 'Deletes the account online and all its progress on this device. This cannot be undone. Make a backup first if you may need it.'),
        h('button', { class: 'btn btn-danger', type: 'button', onclick: async () => {
          const pw = h('input', { class: 'inp', type: 'password', id: 'del-pw', autocomplete: 'current-password', 'data-noacc': '1', 'aria-label': 'Password' });
          const ok = await L.modal({ title: 'Delete your account?', body: h('div', null, h('p', null, 'Type your password to confirm. Your progress will be deleted.'), pw), escValue: false, actions: [{ label: 'Cancel', value: false }, { label: 'Delete forever', value: true, primary: true }] });
          if (!ok) return;
          const r = await A.deleteCurrent(pw.value); if (!r.ok) { L.toast(r.error, 'err', 5000); return; }
          L.refreshAcct(); L.toast('Account deleted.', 'ok', 3500); location.hash = '#/'; L.render();
        } }, 'Delete my account'));
      box.append(L.accountFlows.limits());
      return box;
    });

    // ===== 3. Idiomas =====
    add('idiomas', 'globe', 'Mis idiomas · My languages · لغاتي', 'Lengua materna, idiomas que dominas y el idioma de ayuda. Puedes cambiarlos cuando quieras.', () => {
      const box = h('div'); const Sup = L.sup;
      const knownLv = Object.assign({}, st().knownLevels || {});
      const helpHost = h('div');
      const rec = h('p', { class: 'muted' });
      function drawHelp() {
        helpHost.innerHTML = ''; const s = st();
        const r = Sup.recommend(s.native, s.known || []);
        rec.textContent = '★ Recommended help language: ' + (Sup.HAVE[r.lang] || r.lang) + (r.why === 'native' ? ' (your main language)' : r.why === 'known' ? ' (best one you speak)' : ' (fallback)');
        helpHost.append(
          field('Idioma de ayuda · Help language · لغة الشرح', select('lg-help', [['none', 'Solo español · Spanish only']].concat(Sup.options(s.native, s.known || [])), Sup.lang(), (v) => Sup.save({ supLang: v }))),
          field('Cuánta ayuda · How much help', select('lg-fade', [['auto', 'Automática según mi nivel · Automatic'], ['always', 'Siempre · Always'], ['never', 'Nunca · Never']], s.supFade || 'auto', (v) => Sup.save({ supFade: v })), 'La ayuda se reduce poco a poco: completa en A1–A2, parcial en B1 y desactivada desde B2 (modo automático).'),
          rec, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { Sup.save({ supLang: r.lang }); drawHelp(); L.toast('Help language updated.', 'ok', 2000); } }, 'Use the recommended one'));
      }
      const knownHost = h('div', { class: 'langs' });
      const other = h('input', { class: 'inp', id: 'lg-other', type: 'text', maxlength: '40', placeholder: 'Language name', value: st().otherLang || '', 'data-noacc': '1', onchange: (e) => setSetting('otherLang', cleanName(e.target.value)) });
      const otherRow = h('div', { class: 'field' }, h('label', { for: 'lg-other' }, 'Otro idioma (escribe el nombre) · Other language'), other);
      function drawKnown() {
        knownHost.innerHTML = ''; const s = st(); const known = new Set(s.known || []);
        otherRow.hidden = s.native !== 'other';
        Sup.LANGS.filter(([c]) => c !== s.native && c !== 'other').forEach(([c, n]) => {
          const on = known.has(c);
          const lv = select('lv-' + c, LEVELS, knownLv[c] || 'good', async (v) => { knownLv[c] = v; await setSetting('knownLevels', Object.assign({}, knownLv)); });
          lv.disabled = !on; lv.setAttribute('aria-label', 'Level in ' + n);
          const cb = h('input', { type: 'checkbox', id: 'kn-' + c, checked: on ? '' : null, onchange: async (e) => {
            const k = new Set(st().known || []); e.target.checked ? k.add(c) : k.delete(c);
            if (e.target.checked && !knownLv[c]) knownLv[c] = 'good';
            await setMany({ known: Array.from(k), knownLevels: Object.assign({}, knownLv) }); drawKnown(); drawHelp();
          } });
          knownHost.appendChild(h('div', { class: 'lang-row' }, h('label', { for: 'kn-' + c }, cb, ' ' + n), lv));
        });
      }
      const nativeSel = select('lg-native', [['', '—']].concat(Sup.LANGS), st().native || '', async (v) => {
        const k = new Set(st().known || []); k.delete(v);
        const r = Sup.recommend(v, Array.from(k));
        const o = { native: v, known: Array.from(k) };
        if (st().supFade !== 'never' && (!st().supLang || st().supLang === 'none' || !Sup.HAVE[st().supLang])) o.supLang = r.lang;
        await setMany(o); Sup.refresh(); drawKnown(); drawHelp();
      });
      box.append(
        field('Mi lengua materna · My native language · لغتي الأم', nativeSel, 'Se usa para elegir el mejor idioma de ayuda.'), otherRow,
        h('div', { class: 'field' }, h('label', null, 'Idiomas que hablo bien y nivel · Languages I speak well, and how well · لغات أخرى أجيدها'), knownHost),
        h('hr', { class: 'ddiv' }), helpHost,
        h('div', { class: 'row' }, h('a', { class: 'btn btn-ghost btn-sm', href: '#/bienvenida' }, 'Repetir la bienvenida · Run the welcome again')));
      drawKnown(); drawHelp();
      return box;
    });

    // ===== 4. Aprendizaje =====
    add('aprendizaje', 'target', 'Mi aprendizaje · Learning · التعلّم', 'Objetivos, habilidades, repaso, imágenes y traducciones.', () => {
      const box = h('div'); const g = S.prog.goals;
      box.append(
        field('Objetivo semanal · Weekly goal', select('goal-l', [1, 2, 3, 5, 7, 10].map((n) => [n, n + (n === 1 ? ' lección por semana' : ' lecciones por semana')]), g.lessonsPerWeek, async (v) => { g.lessonsPerWeek = +v; S.markProg(); await U.save(true); })),
        field('Tiempo diario · Daily time', select('goal-m', [5, 10, 15, 20, 30, 45, 60].map((n) => [n, n + ' minutos al día']), g.minutesPerDay, async (v) => { g.minutesPerDay = +v; S.markProg(); await U.save(true); })),
        h('div', { class: 'field' }, h('label', null, 'Habilidades en las que quiero centrarme · Skills to focus on'), h('div', { class: 'row' }, S.SKILLS.map((s) => {
          const cb = h('input', { type: 'checkbox', id: 'f-' + s, checked: g.focus.includes(s) ? '' : null, onchange: async () => { g.focus = S.SKILLS.filter((k) => document.getElementById('f-' + k).checked); S.markProg(); await U.save(true); } });
          return h('label', { for: 'f-' + s, class: 'chip-tag' }, cb, ' ' + s);
        }))),
        field('Palabras por sesión de repaso · Words per review session', select('set-reviewLimit', [[10, '10'], [20, '20'], [30, '30'], [50, '50'], [100, '100']], st().reviewLimit || 30, (v) => setSetting('reviewLimit', +v)), 'Limita cuántas palabras pendientes ves de una vez; las demás esperan para otro día.'),
        toggle('showImages', 'Mostrar imágenes con cada palabra nueva · Show pictures for new words', 'Cada palabra nueva aparece con una ilustración y una frase de ejemplo.', true),
        field('Fotos reales · Real photos', select('set-realPhotos', [['auto', 'Automáticas cuando hay conexión · Automatic when online'], ['ask', 'Solo si las pido · Only on request'], ['off', 'Nunca · Never']], st().realPhotos || 'auto', (v) => setSetting('realPhotos', v)), 'Fotos de Wikipedia para objetos y lugares; se guardan para verlas sin conexión. Si una foto no corresponde, puedes ocultarla.'),
        toggle('showTranslations', 'Mostrar la traducción de las frases en mi idioma de ayuda · Show example translations', 'Debajo de cada frase de ejemplo, en inglés o árabe según tu idioma de ayuda.', true),
        toggle('autoPlay', 'Reproducir la pronunciación al abrir una palabra · Auto-play pronunciation', 'Se oye la palabra al tocar su ilustración.', false),
        toggle('celebrate', 'Animaciones de celebración · Celebrations', 'Emojis de felicitación al aprobar pruebas.', true),
        h('h3', { style: 'margin-top:14px' }, 'Prueba de nivel'),
        S.prog.placement ? h('p', null, 'Resultado actual: ', h('strong', null, 'Nivel ' + S.startStage() + ' de 30'), ' (' + L.fmtDate(S.prog.placement.date) + ').') : h('p', null, 'Todavía no has hecho la prueba de nivel.'),
        h('p', { class: 'muted' }, 'Repetirla no borra lo que ya has completado.'),
        h('a', { class: 'btn btn-ghost', href: '#/prueba-de-nivel' }, S.prog.placement ? 'Repetir la prueba de nivel' : 'Hacer la prueba de nivel'));
      return box;
    });

    // ===== 5. Ejercicios y escritura =====
    add('ejercicios', 'pen', 'Ejercicios y escritura · Exercises · التمارين', 'Tildes, teclado especial y corrección.', () => {
      const box = h('div');
      box.append(
        toggle('strictAccents', 'Exigir las tildes al escribir · Require accents', 'Si lo desactivas, una respuesta correcta sin tilde cuenta como acierto, pero la corrección te recuerda la tilde.', false),
        toggle('accentBar', 'Mostrar la barra de letras especiales (á é í ó ú ñ ¿ ¡) al escribir · Show special-letter bar', 'Aparece sobre el teclado cuando escribes una respuesta. Útil si tu teclado no tiene tildes.', true, () => { if (bar) bar.hidden = true; document.body.classList.remove('has-accbar'); }));
      return box;
    });

    // ===== 6. Audio =====
    add('audio', 'speaker', 'Audio y voz · Audio · الصوت', 'Voz, variedad del español, velocidad y volumen.', () => {
      const box = h('div'); const s = st();
      const rate = h('input', { type: 'range', id: 'set-rate', min: '0.7', max: '1.1', step: '0.05', value: String(s.rate || 1) });
      const rv = h('span', null, (s.rate || 1).toFixed(2) + '×');
      rate.addEventListener('input', () => { rv.textContent = (+rate.value).toFixed(2) + '×'; }); rate.addEventListener('change', () => setSetting('rate', +rate.value));
      const vol = h('input', { type: 'range', id: 'set-vol', min: '0.2', max: '1', step: '0.1', value: String(typeof s.volume === 'number' ? s.volume : 1) });
      vol.addEventListener('change', () => setSetting('volume', +vol.value));
      const voiceBox = h('div');
      function drawVoices() {
        voiceBox.innerHTML = '';
        if (!L.Audio.supported()) { voiceBox.appendChild(h('div', { class: 'alert warn' }, 'Este navegador no puede reproducir voz. Las lecciones se pueden estudiar leyendo el texto.')); return; }
        const vs = L.Audio.voices();
        if (!vs.length) { voiceBox.appendChild(h('div', { class: 'alert warn' }, 'No hay una voz en español instalada en este dispositivo. Puedes instalarla en los ajustes de voz de tu sistema (Android: «Síntesis de voz»; iPhone: Accesibilidad › Contenido leído; Windows: Voz).')); return; }
        const dl = L.Audio.dialects();
        const dsel = h('select', { class: 'inp', id: 'set-dialect', onchange: async (e) => { await setSetting('dialect', e.target.value); await setSetting('voiceURI', ''); drawVoices(); } }, h('option', { value: 'auto' }, 'Automático'), dl.map((d) => h('option', { value: d.id, selected: st().dialect === d.id ? '' : null }, d.label)));
        const vsel = h('select', { class: 'inp', id: 'set-voice', onchange: (e) => setSetting('voiceURI', e.target.value) }, h('option', { value: '' }, 'Elegir automáticamente'), vs.map((v) => h('option', { value: v.voiceURI, selected: st().voiceURI === v.voiceURI ? '' : null }, v.name + ' (' + v.lang + ')')));
        voiceBox.append(h('p', { class: 'muted' }, 'Estas son las voces en español que tiene tu dispositivo.'), field('Variedad del español', dsel), field('Voz', vsel));
      }
      L.Audio.ready().then(drawVoices); drawVoices();
      box.append(voiceBox, h('div', { class: 'field' }, h('label', { for: 'set-rate' }, 'Velocidad de lectura: ', rv), rate), field('Volumen', vol),
        h('div', { class: 'row' }, L.Audio.btn('Hola, ¿cómo estás? Me llamo Lucía y vivo en Sevilla.', { label: 'Probar la voz', name: 'prueba' }), h('span', { class: 'muted' }, 'Probar la voz')));
      return box;
    });

    // ===== 7. Apariencia y lectura =====
    add('apariencia', 'palette', 'Apariencia y lectura · Appearance · المظهر', 'Tema, animaciones, tamaño del texto, contraste y letra fácil.', () => {
      const box = h('div'); const s = st();
      const num = (id, opts, cur, key) => select(id, opts, cur, async (v) => { await setSetting(key, +v); L.applyPrefs(); });
      const chk = (id, key, label) => h('div', { class: 'field' }, h('label', { for: id }, h('input', { type: 'checkbox', id, checked: s[key] === true ? '' : null, onchange: async (e) => { await setSetting(key, e.target.checked); L.applyPrefs(); } }), ' ' + label));
      box.append(
        field('Tema · Theme', select('set-theme', [['light', 'Modo claro'], ['dark', 'Modo oscuro']], document.documentElement.getAttribute('data-theme'), (v) => L.applyTheme(v))),
        h('div', { class: 'field' }, h('label', { for: 'set-motion' }, h('input', { type: 'checkbox', id: 'set-motion', checked: s.reduceMotion ? '' : null, onchange: async (e) => { await setSetting('reduceMotion', e.target.checked); document.documentElement.setAttribute('data-motion', e.target.checked ? 'reduce' : 'auto'); } }), ' Reducir animaciones'), h('p', { class: 'muted' }, 'También se respeta la opción de tu sistema.')),
        field('Tamaño del texto', num('set-fs', [[0.9, 'Pequeño'], [1, 'Normal'], [1.15, 'Grande'], [1.3, 'Muy grande']], s.fontScale || 1, 'fontScale')),
        field('Espacio entre líneas', num('set-lh', [[1, 'Normal'], [1.15, 'Amplio'], [1.3, 'Muy amplio']], s.lineHeight || 1, 'lineHeight')),
        chk('set-contrast', 'contrast', 'Alto contraste'), chk('set-easy', 'easyFont', 'Letra de lectura fácil (más espaciada)'));
      return box;
    });

    // ===== 8. Datos y copias =====
    add('datos', 'download', 'Datos y copias de seguridad · Data & backup · البيانات', 'Copias, importar, almacenamiento, actualizar y restablecer.', () => {
      const box = h('div');
      const info = h('p', { class: 'muted', 'aria-live': 'polite' }, 'Calculando el espacio…');
      (async () => { try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); info.textContent = 'Espacio usado por Languway Spanish en este dispositivo: ' + (e.usage / 1048576).toFixed(1) + ' MB.'; } else info.textContent = 'Este navegador no informa del espacio usado.'; } catch (e) { info.textContent = 'No se pudo calcular el espacio.'; } })();
      const blk = (t, p, btn) => h('div', { class: 'field' }, h('h3', null, t), h('p', { class: 'muted' }, p), btn);
      box.append(info,
        blk('Almacenamiento seguro', 'Pide al navegador que no borre tu progreso cuando falte espacio.', h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { try { const ok = navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; L.toast(ok ? 'Almacenamiento protegido.' : 'El navegador no lo ha concedido (instalar la aplicación suele ayudar).', ok ? 'ok' : '', 5000); } catch (e) { L.toast('No disponible en este navegador.', 'err'); } } }, 'Proteger mi progreso')),
        blk('Actualizar la aplicación', 'Busca una versión nueva de los archivos. Tu progreso no se toca.', h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (!reg) { L.toast('No hay versión instalada que actualizar. Recarga la página.', ''); return; } await reg.update(); L.toast('Comprobado. Si hay una novedad, verás el aviso de actualización.', 'ok', 4500); } catch (e) { L.toast('No se pudo comprobar ahora (¿sin conexión?).', 'err'); } } }, 'Buscar actualizaciones')),
        blk('Limpiar la copia de la aplicación', 'Borra los archivos guardados para el modo sin conexión y los vuelve a descargar. No borra tu cuenta ni tu progreso.', h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => {
          const ok = await L.modal({ title: '¿Limpiar la copia de la aplicación?', body: 'Se recargará la página. Tu cuenta y tu progreso no se borran.', escValue: false, actions: [{ label: 'Cancelar', value: false }, { label: 'Limpiar y recargar', value: true, primary: true }] }); if (!ok) return;
          try { await S.flush(); if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : []; await Promise.all(regs.map((r) => r.unregister())); } catch (e) { /* se recarga igualmente */ }
          location.reload();
        } }, 'Limpiar y recargar')),
        blk('Restablecer los ajustes', 'Vuelve al aspecto, audio y ejercicios por defecto. No borra lecciones, palabras, idiomas ni tu perfil.', h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => {
          const ok = await L.modal({ title: '¿Restablecer los ajustes?', body: 'Se recuperan los valores por defecto de apariencia, audio, ejercicios e imágenes.', escValue: false, actions: [{ label: 'Cancelar', value: false }, { label: 'Restablecer', value: true, primary: true }] }); if (!ok) return;
          const keep = ['native', 'known', 'knownLevels', 'otherLang', 'supLang', 'supFade', 'onboarded', 'startLevel', 'displayName', 'avatar', 'reason', 'lastSync'];
          const old = st(); const fresh = S.defaultProg('x').settings; keep.forEach((k) => { if (old[k] !== undefined) fresh[k] = old[k]; });
          S.prog.settings = fresh; S.markProg(); await U.save(true); L.applyPrefs(); document.documentElement.setAttribute('data-motion', 'auto'); L.render();
        } }, 'Restablecer')),
        h('div', { style: 'margin-top:14px' }, L.accountFlows.dataSections()));
      return box;
    });

    // ===== 9. Instalar y ayuda =====
    add('instalar', 'rocket', 'Instalar, compartir y ayuda · Install & help · التثبيت', 'Instalar la app, código QR y ayuda de cuenta.', () => h('div', null,
      h('p', { class: 'muted' }, 'Instala la aplicación, comparte el enlace o muestra el código QR.'),
      h('a', { class: 'btn btn-primary', href: '#/instalar' }, h('span', { 'aria-hidden': 'true' }, '📲'), ' Instalar y compartir'),
      h('h3', { style: 'margin-top:16px' }, 'Forgot your password?'),
      h('p', null, 'Accounts use only a username and a password, with no email address, so we cannot send a reset link. Check Caps Lock and the exact username first. If you have a backup file, restore it into a new account.'),
      h('a', { class: 'btn btn-ghost', href: '#/cuenta' }, 'Account & Backup')));

    // ===== 10. Privacidad =====
    add('privacidad', 'shield', 'Privacidad y créditos · Privacy · الخصوصية', 'Qué datos se guardan y cómo.', () => h('div', null,
      h('p', null, 'Languway Spanish no usa publicidad ni rastreadores y no carga código de terceros, salvo las fotos de las palabras, que se piden a Wikipedia/Wikimedia cuando hay conexión y se guardan en tu dispositivo (puedes desactivarlas en «Mi aprendizaje»). Sin cuenta, tu progreso se queda solo en este dispositivo. Si creas una cuenta, solo pedimos un nombre de usuario y una contraseña (nunca un correo): se guardan junto con tu progreso para que puedas continuar en otro teléfono. La contraseña se guarda cifrada y puedes borrar tu cuenta cuando quieras.'),
      h('p', null, 'Las voces que oyes son las de tu dispositivo. El micrófono solo se activa cuando pulsas «Grabar», y la grabación no sale de tu dispositivo.'),
      h('p', { class: 'muted' }, 'Las lecciones, textos, ejercicios e historias son contenido original de Languway. Las fotos de las palabras vienen de Wikipedia/Wikimedia Commons con la licencia y el autor que se indican bajo cada foto; sin conexión se usa una ilustración integrada. Los certificados son de finalización de la plataforma y no son títulos oficiales.')));
    return out;
  }

  const splitTitle = (t) => { const p = t.split(' · '); return { es: p[0], rest: p.slice(1).join(' · ') }; };

  route('/configuracion/:id', ({ params }) => {
    const s = sections().find((x) => x.id === params.id);
    const root = h('div', { class: 'settings set-page' });
    if (!s) { root.appendChild(U.pageHead('Configuración', 'Esta sección no existe.', [{ t: 'Configuración', href: '#/configuracion' }])); root.appendChild(h('a', { class: 'btn', href: '#/configuracion' }, 'Volver a Configuración')); return root; }
    const tt = splitTitle(s.title);
    root.appendChild(U.pageHead(tt.es, s.desc, [{ t: 'Configuración', href: '#/configuracion' }, { t: tt.es }], s.icon));
    const body = h('div', { class: 'set-body card glass' });
    try { body.appendChild(s.build()); } catch (e) { body.appendChild(U.errorBox('No se pudo cargar esta sección.')); if (window.console) console.error(e); }
    root.appendChild(body);
    root.appendChild(h('a', { class: 'btn btn-ghost', href: '#/configuracion' }, L.ico('arrow', 'flip'), ' Volver a Configuración'));
    return root;
  }, 'Configuración');

  route('/configuracion', ({ q }) => {
    if (q && q.s && sections().some((x) => x.id === q.s)) { location.replace('#/configuracion/' + q.s); return h('div'); }
    const root = h('div', { class: 'settings' });
    root.appendChild(U.pageHead('Configuración', 'Elige una tarjeta para abrir su página. Todo lo que cambies se guarda en tu cuenta y afecta de verdad a la aplicación.', null, 'gear'));
    const secs = sections();
    const list = h('div', { class: 'set-cards' });
    const els = secs.map((s) => {
      const tt = splitTitle(s.title);
      const a = h('a', { class: 'set-card card glass', href: '#/configuracion/' + s.id, id: 'sec-' + s.id, 'data-title': (s.title + ' ' + s.desc).toLowerCase() },
        h('span', { class: 'set-ic', 'aria-hidden': 'true' }, L.ico(s.icon)),
        h('span', { class: 'set-tt' }, h('strong', null, tt.es), h('small', { class: 'muted' }, tt.rest), h('span', { class: 'set-ds' }, s.desc)),
        h('span', { class: 'set-chev', 'aria-hidden': 'true' }, L.ico('arrow')));
      list.appendChild(a); return a;
    });
    const empty = h('p', { class: 'muted', hidden: true }, 'No hay ajustes que coincidan.');
    const find = h('input', { type: 'search', class: 'inp', id: 'set-find', placeholder: 'Buscar un ajuste… · Search settings', 'aria-label': 'Buscar un ajuste', autocomplete: 'off', maxlength: '40', 'data-noacc': '1' });
    find.addEventListener('input', () => { const t = find.value.trim().toLowerCase(); let n = 0; els.forEach((d) => { const hide = !!t && !d.dataset.title.includes(t); d.hidden = hide; if (!hide) n++; }); empty.hidden = n > 0; });
    root.appendChild(h('div', { class: 'row set-tools' }, find));
    root.appendChild(list); root.appendChild(empty);
    return root;
  }, 'Configuración');

  L.settingsApply = applyDisplayName;
})(window.LWS);
