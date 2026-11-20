/* Languway Spanish — biblioteca de iconos SVG (sin emojis) */
(function (L) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  // d = relleno degradado dorado; el resto son trazos con currentColor
  const D = (p) => '<path fill="url(#lwG)" stroke="none" opacity=".9" d="' + p + '"/>';
  const ICONS = {
    home: D('M5 10l7-6 7 6v10h-5v-6h-4v6H5z') + '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    book: D('M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5z') + '<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path d="M12 6v13"/>',
    chart: D('M16 3h4v17h-4z') + '<rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/>',
    trophy: D('M8 4h8v6a4 4 0 0 1-8 0z') + '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4"/><path d="M12 14v4M8 20h8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    bell: D('M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z') + '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/>' + D('M3 14h4v6H3zM17 14h4v6h-4z') + '<rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    mic: D('M9 3h6v11H9z') + '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    globe: D('M3 12a9 9 0 0 1 18 0z') + '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    translate: '<path d="M4 6h9M8.5 4v2M6 6c1 4 3 6 6 7M12 6c-1 4-3 6-7 8"/>' + D('M12 20l4-9 4 9z') + '<path d="M12 20l4-9 4 9M13.5 17h5"/>',
    calendar: D('M3.5 10h17v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3z') + '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>' + D('M12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z') + '<path d="M12 12l6-6"/>',
    repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3"/>',
    star: D('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z') + '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    'star-o': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    flame: D('M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z') + '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    user: D('M4 21a8 8 0 0 1 16 0z') + '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    play: D('M8 5l11 7-11 7z') + '<path d="M8 5l11 7-11 7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    grid: D('M4 4h7v7H4z') + '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    pen: D('M4 20l1-4 11-11 3 3L8 19z') + '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
    chat: D('M4 5h16v11H10l-5 4v-4H4z') + '<path d="M4 5h16v11H10l-5 4v-4H4z"/>',
    doc: D('M6 3h9l4 4v14H6z') + '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    puzzle: D('M5 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H5z') + '<path d="M5 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H5z"/>',
    blocks: D('M8 4h8v8H8z') + '<rect x="3" y="12" width="8" height="8" rx="1.5"/><rect x="13" y="12" width="8" height="8" rx="1.5"/><rect x="8" y="4" width="8" height="8" rx="1.5"/>',
    wrench: D('M14 6a4 4 0 0 0 5 5l-9 9a2.5 2.5 0 0 1-4-4l9-9z') + '<path d="M14 6a4 4 0 0 0 5 5l-9 9a2.5 2.5 0 0 1-4-4l9-9a4 4 0 0 1-1-5 4 4 0 0 1 5 1z"/>',
    compass: '<circle cx="12" cy="12" r="9"/>' + D('M15.5 8.5l-2 5-5 2 2-5z') + '<path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    moon: D('M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z') + '<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z"/>',
    sun: D('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z') + '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    heart: D('M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.400 12 20 12 20z') + '<path d="M12 20s-8-4.600-8-10.500A4.500 4.500 0 0 1 12 7a4.500 4.500 0 0 1 8 2.500C20 15.400 12 20 12 20z"/>',
    bulb: D('M12 3a6 6 0 0 0-3.500 10.900c.8.600 1 1.300 1 2.100h5c0-.8.200-1.500 1-2.100A6 6 0 0 0 12 3z') + '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.8.600 1 1.300 1 2.100h5c0-.8.200-1.500 1-2.100A6 6 0 0 0 12 3z"/>',
    lock: D('M5 11h14v9H5z') + '<rect x="5" y="11" width="14" height="9" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    speaker: D('M4 9v6h4l5 4V5L8 9z') + '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/>',
    hourglass: D('M7 4h10c0 4-3 5-5 8-2-3-5-4-5-8z') + '<path d="M7 3h10M7 21h10M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    spark: D('M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z') + '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/><path d="M19 16v4M17 18h4"/>',
    cap: D('M2 9l10-5 10 5-10 5z') + '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c3 2.500 9 2.500 12 0v-4.500"/>',
    abc: '<path d="M3 18l4-11 4 11M4.500 14h5"/>' + D('M16.500 11.500a3 3 0 1 0 0 6 3 3 0 0 0 0-6z') + '<circle cx="16.500" cy="14.500" r="3"/><path d="M19.500 11.500V18"/>',
    bolt: D('M13 2L5 13h6l-1 9 8-11h-6z') + '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
    flag: D('M5 5h13l-2.500 4 2.500 4H5z') + '<path d="M5 21V4M5 5h13l-2.500 4 2.500 4H5"/>',
    alert: D('M12 4l9 16H3z') + '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    clipboard: D('M6 5h12v16H6z') + '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 12h6M9 16h4"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2.200-.5-1.300.4-2.300 1.700-2.300H18a3 3 0 0 0 3-3c0-5-4-10.500-9-10.500z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.500" r="1"/><circle cx="16" cy="10" r="1"/>',
    shield: D('M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z') + '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
    thumb: D('M3 11h4v9H3z') + '<path d="M7 11l4-7c2 0 3 1 2.500 3L13 10h5a2 2 0 0 1 2 2.300l-1 6A2 2 0 0 1 17 20H7"/><path d="M3 11h4v9H3z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17v.5"/>',
    square: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    rocket: D('M12 3c3 2 5 5 5 9l-3 3h-4l-3-3c0-4 2-7 5-9z') + '<path d="M12 3c3 2 5 5 5 9l-3 3h-4l-3-3c0-4 2-7 5-9z"/><circle cx="12" cy="10" r="1.500"/><path d="M7 14l-3 3 4 .5M17 14l3 3-4 .5M10 19l2 2 2-2"/>',
    users: '<circle cx="9" cy="8" r="3.500"/><path d="M2 20a7 7 0 0 1 14 0M16 5a3.500 3.500 0 0 1 0 6.500M18 14a7 7 0 0 1 4 6"/>',
    dot: '<circle cx="12" cy="12" r="3"/>'
  };
  const GRAD = '<linearGradient id="lwG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD25A"/><stop offset="1" stop-color="#F2A81D"/></linearGradient>';
  function sprite() {
    if (document.getElementById('lw-sprite')) return;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('id', 'lw-sprite'); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<defs>' + GRAD + '</defs>' + Object.keys(ICONS).map((k) => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>').join('');
    document.body.insertBefore(s, document.body.firstChild);
  }
  // Devuelve un <span class="ico"> con el icono pedido
  L.ico = function (name, cls) {
    const k = ICONS[name] ? name : 'dot';
    const span = document.createElement('span');
    span.className = 'ico' + (cls ? ' ' + cls : '');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><use href="#i-' + k + '"/></svg>';
    return span;
  };
  L.icoHtml = (name, cls) => '<span class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><use href="#i-' + (ICONS[name] ? name : 'dot') + '"/></svg></span>';
  L.ICON_NAMES = Object.keys(ICONS);

  // ---- Los pictogramas Unicode se muestran como iconos SVG propios ----
  const MAP = {
    '✓': 'check', '✅': 'check', '✔': 'check', '✕': 'close', '✖': 'close', '×': null, '★': 'star', '⭐': 'star', '🌟': 'star', '☆': 'star-o', '✨': 'spark', '🎉': 'spark', '🚀': 'rocket',
    '🔒': 'lock', '🔐': 'lock', '🏆': 'trophy', '🏅': 'trophy', '🔊': 'speaker', '🔈': 'speaker', '🧭': 'compass', '📘': 'book', '📚': 'book', '📖': 'book', '📕': 'book',
    '🎯': 'target', '🎧': 'headphones', '🔁': 'repeat', '🔄': 'repeat', '💬': 'chat', '🗣': 'chat', '🔎': 'search', '🔍': 'search', '📲': 'download', '📤': 'download', '💾': 'download',
    '🎓': 'cap', '🐢': 'hourglass', '🎤': 'mic', '🎙': 'mic', '🔤': 'abc', '✍': 'pen', '📝': 'pen', '🧩': 'puzzle', '🧱': 'blocks', '☰': 'menu', '🔥': 'flame', '💡': 'bulb',
    '📊': 'chart', '📈': 'chart', '📋': 'clipboard', '🏠': 'home', '📭': 'inbox', '📜': 'doc', '🌐': 'globe', '🌍': 'globe', '👤': 'user', '🧑': 'user', '⚠': 'alert', '🛠': 'wrench',
    '⚙': 'gear', '🌙': 'moon', '☀': 'sun', '🎨': 'palette', '🛡': 'shield', '💪': 'bolt', '👍': 'thumb', '🤔': 'question', '⬜': 'square'
  };
  const EMO = /(?:[\u{1F300}-\u{1FAFF}☀-➿⭐⬜⬛❤✓✕★☆☰])[️‍\u{1F300}-\u{1FAFF}]*/gu;
  const key = (e) => e.replace(/[️‍]/g, '');
  const SKIP = 'script,style,textarea,input,select,option,svg,.vis,.vis-pic,[data-emoji]';
  function convertNode(root) {
    if (!root || !root.nodeType) return;
    const w = document.createTreeWalker(root.nodeType === 3 ? root.parentNode : root, NodeFilter.SHOW_TEXT);
    const hits = []; let n;
    while ((n = w.nextNode())) { if (n.nodeValue && EMO.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(SKIP))) hits.push(n); EMO.lastIndex = 0; }
    hits.forEach((t) => {
      const frag = document.createDocumentFragment(); const s = t.nodeValue; let last = 0, m;
      EMO.lastIndex = 0;
      while ((m = EMO.exec(s))) {
        const first = key(m[0]).slice(0, 2); const k = MAP[key(m[0])] !== undefined ? MAP[key(m[0])] : MAP[Array.from(key(m[0]))[0]];
        frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        if (k) frag.appendChild(L.ico(k, 'ei'));
        last = m.index + m[0].length; if (!first) break;
      }
      frag.appendChild(document.createTextNode(s.slice(last).replace(/^\s+(?=\s)/, '')));
      t.parentNode.replaceChild(frag, t);
    });
    // atributos y controles que no admiten SVG: se limpian los pictogramas
    const scope = root.nodeType === 1 ? root : root.parentNode;
    if (scope && scope.querySelectorAll) scope.querySelectorAll('[aria-label],[title],[placeholder],option').forEach((el) => {
      if (el.closest('.vis,[data-emoji]')) return;
      ['aria-label', 'title', 'placeholder'].forEach((a) => { const v = el.getAttribute(a); if (v && EMO.test(v)) el.setAttribute(a, v.replace(EMO, '').replace(/\s{2,}/g, ' ').trim()); EMO.lastIndex = 0; });
      if (el.tagName === 'OPTION' && EMO.test(el.textContent)) el.textContent = el.textContent.replace(EMO, '').trim();
      EMO.lastIndex = 0;
    });
  }
  L.noEmoji = convertNode;
  function start() {
    sprite();
    let busy = false;
    const mo = new MutationObserver((muts) => {
      if (busy) return; busy = true;
      try { muts.forEach((m) => m.addedNodes.forEach((x) => { if (x.nodeType === 1 || x.nodeType === 3) convertNode(x); })); } finally { busy = false; }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    convertNode(document.body);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})(window.LWS = window.LWS || {});
