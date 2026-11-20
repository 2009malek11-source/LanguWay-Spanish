/* Languway Spanish — ilustraciones vectoriales propias y animadas, y pantalla de bienvenida */
(function () {
  'use strict';
  const L = (window.LWS = window.LWS || {});
  const A = (L.art = {});
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  let uid = 0;

  // Una torre de catedral: fuste, aguja ojival, anillos y ventanas
  function tower(x, w, h, base, id) {
    const top = base - h, y1 = top + h * 0.42, hw = w / 2;
    const left = 'M' + (x - hw) + ' ' + base + 'L' + (x - hw) + ' ' + y1 + 'Q' + (x - hw) + ' ' + (y1 - h * 0.14) + ' ' + (x - hw * 0.62) + ' ' + (y1 - h * 0.26) + 'Q' + (x - hw * 0.3) + ' ' + (top + h * 0.12) + ' ' + x + ' ' + top;
    const right = 'Q' + (x + hw * 0.3) + ' ' + (top + h * 0.12) + ' ' + (x + hw * 0.62) + ' ' + (y1 - h * 0.26) + 'Q' + (x + hw) + ' ' + (y1 - h * 0.14) + ' ' + (x + hw) + ' ' + y1 + 'L' + (x + hw) + ' ' + base + 'Z';
    let s = '<path d="' + left + right + '" fill="url(#cg' + id + ')"/>';
    s += '<path d="M' + x + ' ' + top + 'L' + x + ' ' + base + 'L' + (x + hw) + ' ' + base + 'L' + (x + hw) + ' ' + y1 + 'Q' + (x + hw) + ' ' + (y1 - h * 0.14) + ' ' + (x + hw * 0.62) + ' ' + (y1 - h * 0.26) + 'Q' + (x + hw * 0.3) + ' ' + (top + h * 0.12) + ' ' + x + ' ' + top + 'Z" fill="#7a3b12" opacity=".28"/>';
    for (let k = 1; k <= 4; k++) { const yy = y1 + (base - y1) * k / 5; s += '<path d="M' + (x - hw) + ' ' + yy + 'H' + (x + hw) + '" stroke="#7a3b12" stroke-opacity=".25" stroke-width="1"/>'; }
    const wn = Math.max(1, Math.floor(w / 14));
    for (let i = 0; i < wn; i++) { const wx = x - hw + (i + 0.5) * (w / wn); s += '<path d="M' + (wx - 2.2) + ' ' + (y1 + 22) + 'v-9a2.2 2.2 0 0 1 4.4 0v9z" fill="#3a1a08" opacity=".7"/><path d="M' + (wx - 2.2) + ' ' + (y1 + 52) + 'v-9a2.2 2.2 0 0 1 4.4 0v9z" fill="#3a1a08" opacity=".6"/>'; }
    s += '<circle cx="' + x + '" cy="' + (top - 2) + '" r="2.4" fill="#fff3b0"/>';
    return s;
  }

  // Catedral dorada de agujas (diseño original) — viewBox 0 0 600 400
  A.cathedral = function () {
    const id = ++uid;
    const T = [[300, 44, 300], [248, 32, 246], [352, 32, 246], [198, 28, 196], [402, 28, 196], [152, 24, 150], [448, 24, 150], [108, 20, 108], [492, 20, 108]];
    let s = '<defs><linearGradient id="cg' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".45" stop-color="#f3b94a"/><stop offset="1" stop-color="#c96f1c"/></linearGradient>' +
      '<linearGradient id="cn' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c765"/><stop offset="1" stop-color="#b5601a"/></linearGradient></defs>';
    s += '<path d="M92 372V318c0-6 4-10 10-10h396c6 0 10 4 10 10v54z" fill="url(#cn' + id + ')"/>';
    for (let i = 0; i < 17; i++) { const wx = 112 + i * 23.5; s += '<path d="M' + (wx - 4) + ' 352v-24a4 4 0 0 1 8 0v24z" fill="#3a1a08" opacity=".55"/>'; }
    T.sort((a, b) => a[2] - b[2]).forEach((t) => { s += tower(t[0], t[1], t[2], 372, id); });
    s += '<path d="M276 372v-30a24 24 0 0 1 48 0v30z" fill="#3a1a08" opacity=".75"/>';
    return '<svg class="art-cathedral" viewBox="0 0 600 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' + s + '</svg>';
  };

  // Escena completa: cielo al atardecer, sol, nubes, aves, colinas y catedral
  A.scene = function (opts) {
    const id = ++uid; const dark = !!(opts && opts.night);
    let stars = '';
    for (let i = 0; i < 46; i++) stars += '<circle class="tw" style="animation-delay:' + (rnd() * 4).toFixed(2) + 's" cx="' + (rnd() * 1000).toFixed(0) + '" cy="' + (rnd() * 330).toFixed(0) + '" r="' + (0.7 + rnd() * 1.6).toFixed(1) + '" fill="#fff"/>';
    let rays = ''; for (let i = 0; i < 12; i++) rays += '<path d="M0 0L-26 -520L26 -520Z" transform="rotate(' + (i * 30) + ')"/>';
    return '<svg class="art-scene" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (dark ? '#050a22' : '#1a2a6c') + '"/><stop offset=".55" stop-color="#8a4f9e"/><stop offset=".82" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>' +
      '<radialGradient id="sn' + id + '"><stop offset="0" stop-color="#fff6c8"/><stop offset=".35" stop-color="#ffd36b" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hl' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a5c"/><stop offset="1" stop-color="#151235"/></linearGradient></defs>' +
      '<rect width="1000" height="560" fill="url(#sk' + id + ')"/>' + stars +
      '<g transform="translate(640 330)"><g class="rays" fill="#ffe08a" opacity=".13">' + rays + '</g><circle class="sun" r="150" fill="url(#sn' + id + ')"/></g>' +
      '<g class="cloud c1" fill="#fff" opacity=".22"><ellipse cx="170" cy="150" rx="90" ry="16"/><ellipse cx="220" cy="138" rx="60" ry="14"/></g>' +
      '<g class="cloud c2" fill="#fff" opacity=".18"><ellipse cx="760" cy="96" rx="110" ry="15"/><ellipse cx="700" cy="86" rx="64" ry="12"/></g>' +
      '<g class="bird b1" fill="none" stroke="#2a1a4a" stroke-width="2.4" stroke-linecap="round"><path d="M0 0q8-9 16 0q8-9 16 0"/></g>' +
      '<g class="bird b2" fill="none" stroke="#2a1a4a" stroke-width="2.4" stroke-linecap="round"><path d="M0 0q6-7 12 0q6-7 12 0"/></g>' +
      '<g class="bird b3" fill="none" stroke="#2a1a4a" stroke-width="2.4" stroke-linecap="round"><path d="M0 0q5-6 10 0q5-6 10 0"/></g>' +
      '<path d="M0 470c120-46 220-30 330-8s210 8 330-12 220-6 340 18v92H0z" fill="url(#hl' + id + ')" opacity=".85"/>' +
      '<g class="cath" transform="translate(300 60) scale(.98)">' + A.cathedral().replace(/^<svg[^>]*>/, '<g>').replace('</svg>', '</g>') + '</g>' +
      '<path d="M0 520c160-30 300-20 450 0s330 20 550-10v50H0z" fill="#0d0a24"/></svg>';
  };

  // Mosaico de rombos para fondos (patrón de azulejos)
  A.tiles = function (c) {
    return '<svg class="art-tiles" width="100%" height="100%" aria-hidden="true" focusable="false"><defs><pattern id="tl" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M32 4l28 28-28 28L4 32z" fill="none" stroke="' + (c || '#ffd25a') + '" stroke-opacity=".16"/><circle cx="32" cy="32" r="5" fill="none" stroke="' + (c || '#ffd25a') + '" stroke-opacity=".2"/></pattern></defs><rect width="100%" height="100%" fill="url(#tl)"/></svg>';
  };

  // Bandera de España (rojigualda, sin escudo)
  A.flag = function () {
    return '<svg class="art-flag" viewBox="0 0 120 80" aria-hidden="true" focusable="false"><defs><linearGradient id="fw" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs><path d="M6 6C30 -2 50 14 74 6s34-6 40 0v68c-6-6-16-6-40 0S30 82 6 74z" fill="#aa151b"/><path d="M6 24C30 16 50 32 74 24s34-6 40 0v32c-6-6-16-6-40 0S30 64 6 56z" fill="#f1bf00"/><path d="M6 6C30 -2 50 14 74 6s34-6 40 0v68c-6-6-16-6-40 0S30 82 6 74z" fill="url(#fw)"/><rect x="2" y="2" width="4" height="78" rx="2" fill="#c9a227"/></svg>';
  };

  // Calle con balcones y flores (tarjeta de lección)
  A.street = function () {
    let b = '';
    const cols = ['#f4b942', '#e8794a', '#f6d58b', '#d96a6a'];
    for (let i = 0; i < 4; i++) {
      const x = 10 + i * 74;
      b += '<rect x="' + x + '" y="' + (30 + (i % 2) * 10) + '" width="68" height="' + (150 - (i % 2) * 10) + '" rx="4" fill="' + cols[i] + '"/><rect x="' + x + '" y="' + (30 + (i % 2) * 10) + '" width="68" height="10" fill="#7a3b12" opacity=".25"/>';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) b += '<rect x="' + (x + 10 + c * 30) + '" y="' + (52 + (i % 2) * 10 + r * 44) + '" width="18" height="28" rx="9" fill="#2a1a4a" opacity=".78"/><path d="M' + (x + 6 + c * 30) + ' ' + (82 + (i % 2) * 10 + r * 44) + 'h26" stroke="#2a1a4a" stroke-width="3"/><circle cx="' + (x + 12 + c * 30) + '" cy="' + (80 + (i % 2) * 10 + r * 44) + '" r="3" fill="#e0457b"/><circle cx="' + (x + 20 + c * 30) + '" cy="' + (79 + (i % 2) * 10 + r * 44) + '" r="3" fill="#ff8a5a"/><circle cx="' + (x + 28 + c * 30) + '" cy="' + (80 + (i % 2) * 10 + r * 44) + '" r="3" fill="#e0457b"/>';
    }
    return '<svg class="art-street" viewBox="0 0 310 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="st1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb2ff"/><stop offset="1" stop-color="#ffe2a8"/></linearGradient></defs><rect width="310" height="190" fill="url(#st1)"/>' + b + '<path d="M0 190V160c60-12 120-12 160-4s100 6 150-6v40z" fill="#c9a86a"/><path d="M130 190c10-30 20-30 30-30s20 0 30 30z" fill="#a8864a" opacity=".6"/></svg>';
  };


  // ---------- fotografías (archivos incluidos en la app, funcionan sin conexión) ----------
  const P = (L.photos = {});
  const FILES = { hero: 'ph-hero.jpg', street: 'ph-street.jpg', street2: 'ph-street2.jpg', city: 'ph-city.jpg', flag: 'ph-flag.jpg', globe: 'ph-globe.jpg' };
  P.src = (key) => FILES[key] || null;
  // Pone la foto dentro de `el`, debajo del contenido; si no carga, queda el fondo vectorial
  P.attach = function (el, key) {
    const src = FILES[key]; if (!el || !src || el.querySelector(':scope > .ph-img')) return;
    const img = new Image(); img.className = 'ph-img'; img.alt = ''; img.decoding = 'async';
    img.onload = () => { el.classList.add('has-ph'); requestAnimationFrame(() => img.classList.add('on')); };
    img.onerror = () => img.remove();
    img.src = src; el.insertBefore(img, el.firstChild);
  };
  // Foto de cabecera para cada sección
  P.forRoute = function (path) {
    const seg = String(path || '/').split('/')[1] || '';
    const map = { aprender: 'street2', leccion: 'street2', unidad: 'street2', vocabulario: 'street', gramatica: 'city', escuchar: 'hero', leer: 'city', escribir: 'street', frases: 'street2', conversacion: 'street', historias: 'city', progreso: 'globe', certificados: 'hero', examen: 'hero', practica: 'street2', repaso: 'globe', configuracion: 'globe', cuenta: 'city', 'mi-plan': 'hero', puedo: 'street', habla: 'street2', buscar: 'city' };
    return map[seg] || 'hero';
  };

  // ---------- pantalla de bienvenida ----------
  function splash() {
    const el = document.getElementById('splash'); if (!el) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.innerHTML =
      '<div class="sp-sky">' + A.scene({ night: true }) + '</div><div class="sp-veil"></div>' +
      '<div class="sp-stage"><div class="sp-halo"><i></i><i></i><i></i></div>' +
      '<img class="sp-mark" src="mark.png" alt="" width="120" height="120">' +
      '<h1 class="sp-title" aria-label="Languway Spanish">' + 'Languway'.split('').map((c, i) => '<span style="--i:' + i + '">' + c + '</span>').join('') + '</h1>' +
      '<p class="sp-sub">SPANISH</p><p class="sp-tag">Aprende español en español</p></div>' +
      '<div class="sp-spark">' + Array.from({ length: 18 }, (_, i) => '<b style="--a:' + (i * 20) + 'deg;--d:' + (0.4 + (i % 6) * 0.18).toFixed(2) + 's"></b>').join('') + '</div>' +
      '<button type="button" class="sp-skip" aria-label="Entrar">Toca para entrar</button>';
    P.attach(el.querySelector('.sp-sky'), 'hero');
    let gone = false;
    const out = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => el.remove(), 700); };
    el.addEventListener('click', out);
    document.addEventListener('keydown', function k(e) { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { out(); document.removeEventListener('keydown', k); } });
    setTimeout(out, reduce ? 900 : 4200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', splash); else splash();
})();
