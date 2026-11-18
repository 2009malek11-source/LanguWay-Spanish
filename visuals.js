/* Languway Spanish — ilustraciones para cada palabra nueva, siempre dentro de una frase */
(function (L) {
  'use strict';
  const { h } = L;
  const V = (L.vis = {});

  // palabra (sin artículo) -> emojis (máx. 3). "#n" = número grande.
  const M = {
    // saludos y presentación
    hola: '👋🙂', 'buenos días': '🌅☀️', 'buenas tardes': '🌤️🙂', 'buenas noches': '🌙😴', adiós: '👋🚶', 'hasta luego': '👋⏰', 'por favor': '🙏✨', gracias: '🙏😊', 'de nada': '🤝😊', sí: '✅👍', no: '❌🙅', perdón: '🙇‍♂️💬', 'me llamo': '🧑🪪', 'me llamo…': '🧑🪪', 'cómo te llamas': '🧑❓🪪', soy: '🧑👈', de: '🌍➡️🧑', encantado: '🤝😃', nombre: '🪪✍️', país: '🗺️🏳️', estudiante: '🧑‍🎓📚', vivir: '🏠🧑', yo: '🧑👆', tú: '🫵🧑', 'cómo': '❓🔧', 'qué': '❓📦', 'quién': '❓🧑', 'dónde': '❓📍', 'cuándo': '❓📅', 'por qué': '❓🤔', 'cuánto': '❓🔢',
    // números
    cero: '#0', uno: '#1', cinco: '#5', diez: '#10', quince: '#15', veinte: '#20', treinta: '#30', cien: '#100',
    // familia
    familia: '👨🧕🧒', madre: '🧕🤱', padre: '👨🧒', hermano: '👦👦', hermana: '🧕🧕', abuelos: '👴🧕', hijo: '👨👦', tener: '🤲📦',
    // tiempo
    lunes: '📅1️⃣', sábado: '📅🛍️', domingo: '📅🏡', semana: '📆7️⃣', mes: '🗓️🌙', enero: '❄️🗓️', hoy: '📅👇', mañana: '📅➡️🌅', hora: '🕐⏳', minuto: '⏱️1️⃣', reloj: '⌚🕒', 'en punto': '🕒✔️', 'y media': '🕧➗', tarde: '🌇🕓', noche: '🌃⭐', ayer: '📅⬅️', anoche: '🌙⬅️', 'el año pasado': '📆⬅️', 'la semana pasada': '🗓️⬅️', hace: '⏳⬅️', 'esta mañana': '🌅👇', 'hoy mismo': '📅⚡', próximo: '📅➡️➡️', 'fin de semana': '🏖️📅', vacaciones: '🧳🏖️',
    // comida
    agua: '💧🥛', pan: '🍞🥖', leche: '🥛🐄', café: '☕🫘', manzana: '🍎🍏', pollo: '🍗🐔', comida: '🍽️🥘', postre: '🍰🍨', cena: '🍽️🌙', chocolate: '🍫🍫', carta: '📜🍽️', camarero: '🧑‍🍳🍽️', cuenta: '🧾💳', plato: '🍽️🥘', pedir: '🙋🍽️', propina: '💵🙏', desayuno: '🍳🥐☕', desayunar: '🍳🥐☕', cenar: '🍽️🌙', 'tener hambre': '🤤🍽️', 'tener sed': '🥵💧', beber: '🥤💧', comer: '🍽️😋', delicioso: '😋🍲',
    // gustos y colores
    querer: '🙏❤️', gustar: '👍😊', color: '🎨🌈', rojo: '🔴🍎', azul: '🔵🌊', verde: '🟢🌿',
    // cosas y lugares
    mesa: '🪑🍽️', libro: '📘📖', casa: '🏠🔑', grande: '🐘📏', ciudad: '🏙️🌆', calle: '🛣️🚶', parque: '🌳🛝', supermercado: '🛒🏬', farmacia: '💊🏪', hospital: '🏥🚑', banco: '🏦💰', tienda: '🏪🛍️', escuela: '🏫🎒', universidad: '🎓🏛️', trabajo: '💼🏢', coche: '🚗🔑', tren: '🚆🛤️', avión: '✈️☁️', dinero: '💵💰', ordenador: '💻⌨️', teléfono: '📱☎️', árbol: '🌳🍃', río: '🏞️🌊', amigo: '🧑🤝🧑', profesor: '🧑‍🏫📝', médico: '🧑‍⚕️🩺', doctor: '🧑‍⚕️🩺', televisión: '📺🛋️', animal: '🐕🐈', hotel: '🏨🛏️', restaurante: '🍽️🏠', pasaporte: '🛂📘', aeropuerto: '🛫🏢', información: 'ℹ️💬', mapa: '🗺️📍', foto: '📷🖼️', momento: '⏱️✨', persona: '🧑', problema: '⚠️🧩', idea: '💡🧠', plan: '📋🗓️',
    // adjetivos
    barato: '🏷️👇', caro: '💎💰', bueno: '👍😊', malo: '👎😠', pequeño: '🐜🔍', nuevo: '🆕✨', viejo: '🏚️🕰️', bonito: '🌸😍', feliz: '😄🌞', triste: '😢🌧️', cansado: '😩💤', alto: '🧍📏⬆️', bajo: '🧍📏⬇️', delgado: '🧍➖', simpático: '😊🤝', tranquilo: '😌🌿', moreno: '🧑🦱', rubio: '🧑🌾', ruidoso: '🔊📢', importante: '❗⭐', diferente: '🔴🔵🟢', interesante: '🤩📖', posible: '✅🤷', rápido: '🐆💨', mejor: '🥇⬆️', peor: '⬇️😞', enfermo: '🤒🤧', demasiado: '⚠️➕➕',
    // verbos básicos
    estar: '🧍📍', hay: '👉📦', hablar: '🗣️💬', trabajar: '👷💻', estudiar: '📚✏️', caminar: '🚶👟', comprar: '🛒💳', necesitar: '🙏🧩', escuchar: '👂🔊', español: '🇪🇸🗣️', aprender: '🧠📈', escribir: '✍️📝', abrir: '🚪🔓', correr: '🏃💨', recibir: '📬🤲', leer: '📖👀', ir: '🚶➡️', levantarse: '🛏️⬆️', ducharse: '🚿🧼', vestirse: '👕👖', acostarse: '🛌🌙', salir: '🚪🚶', llegar: '🏁🚶', dormir: '😴🛏️', esperar: '⏳🧍', pasar: '➡️🚪', dar: '🎁🤲', ser: '🧑✅', hacer: '🛠️✋', poder: '💪✅', ver: '👀🌄', saber: '🧠💡', decir: '🗣️💬', venir: '🚶⬅️📍', poner: '📥📍', viajar: '🧳🌍', llamar: '📞🧑', tomar: '🤲☕', visitar: '🚶🏛️', quedar: '🤝📍', terminar: '🏁✔️', probarse: '👕🪞', costar: '🏷️💰', recomendar: '👍🗣️', 'darse cuenta': '💡👀', 'estar de acuerdo': '🤝👍', 'tener razón': '✅🧠', como: '🟰🧑',
    // compras y viajes
    talla: '👕📏', precio: '🏷️💶', tarjeta: '💳🏧', descuento: '🏷️➖', billete: '🎫🚆', estación: '🚉🚆', andén: '🚉🧍', maleta: '🧳🛄', viaje: '🧳🗺️', retraso: '🚆⏰⚠️', reserva: '📋🏨✅', habitación: '🛏️🚪', llave: '🔑🚪', incluido: '➕✅', 'noche de hotel': '🏨🌙',
    // salud
    doler: '🤕⚡', cabeza: '🤕💭', estómago: '🤢🫃', fiebre: '🤒🌡️', descansar: '🛋️😌', receta: '📋💊', medicina: '💊🧴',
    // frecuencia y conectores
    normalmente: '🔁📅', 'a veces': '🔁❓', nunca: '🚫🔁', ya: '✅⏱️', todavía: '⏳❌', 'alguna vez': '❓⏳', participio: '📚✔️', estuvo: '🧍📍⬅️', fue: '🚶⬅️', tuvo: '🤲⬅️', hizo: '🛠️⬅️', dijo: '🗣️⬅️', vino: '🚶⬅️📍', pudo: '💪⬅️', puso: '📥⬅️', más: '➕⬆️', menos: '➖⬇️', tan: '🟰📏', soler: '🔁🕐', mientras: '⏳🔀⏳', 'de niño': '🧒🏠', antes: '⏪1️⃣', entonces: '➡️⏩', 'al principio': '🏁1️⃣', 'de repente': '⚡😮', 'después de': '1️⃣➡️2️⃣', finalmente: '🏁🔚', 'en cambio': '↔️🔄', además: '➕✨', 'sin embargo': '↔️⚖️', 'por un lado': '☝️⚖️', 'por otro lado': '⚖️✌️', 'por eso': '➡️🎯', aunque: '☔🚶', 'tal vez': '🤷❓', 'dentro de': '⏳➡️🗓️', seguro: '✅🔒', predicción: '🔮🌦️',
    // opinión y argumentación
    prometer: '🤞🤝', opinar: '💬🤔', aconsejar: '🗣️💡', opinión: '💬🙋', 'estar a favor': '👍✋', 'estar en contra': '👎✋', depender: '⚖️🔗', consejo: '💡🗣️', causa: '🔥➡️', consecuencia: '➡️💥', 'por lo tanto': '➡️🧮', 'debido a': '🌧️➡️🚫', 'ya que': '❓➡️✔️', 'así que': '➡️✔️', provocar: '🔥💥', ojalá: '🤲🌟', 'esperar que': '⏳🌟', desear: '🌠🙏', 'recomendar que': '🗣️👍', 'es importante que': '❗👉',
    // cartas y trabajo
    estimado: '✉️🤝', atentamente: '✉️✍️', adjuntar: '📎📧', solicitar: '🙋📄', puesto: '💼🪑', currículum: '📄🧑‍💼', agradecer: '🙏💌', entrevista: '🧑‍💼🗣️🧑', experiencia: '🏅🧰', candidato: '🧑‍💼✋', contratar: '🤝📄', sueldo: '💵📅', empresa: '🏢📈', horario: '🗓️⏰', quisiera: '🙏🛍️', podría: '🙋💬', sería: '🤔💭', 'le importaría': '🙏🤝', disculpe: '🙇🙏', hipótesis: '🧪❓', imaginar: '💭✨', 'ganar la lotería': '🎟️💰', viviría: '🏡💭',
    // estilo indirecto y debate
    'contar que': '🗣️📖', 'preguntar si': '❓🗣️', explicar: '🧑‍🏫💡', responder: '💬↩️', avisar: '📢⚠️', comentar: '💬🗨️', rotundamente: '💯✋', 'coincidir con': '🤝🟰', discrepar: '↔️🗣️', matizar: '🎨🔍', rebatir: '🛡️🗣️', 'en parte': '🍰½', 'a mi juicio': '👤⚖️', 'dudar que': '🤨❓', 'no creer que': '🙅🧠', 'resulta que': '🔍💡', 'sostener que': '🏋️🗣️', cuestionable: '❓⚖️', 'no obstante': '↔️🚧', 'por consiguiente': '➡️🧮', 'a pesar de': '🌧️🚶‍♂️', 'puesto que': '➡️✔️', 'por ende': '➡️🎯', 'por ello': '➡️🎯',
    // escritura formal
    'dirigirse a': '✉️👉', 'quedar a la espera': '⏳📬', 'con copia a': '📧👥', 'a la atención de': '📄👤', 'ponerse en contacto': '📞🤝', 'cordial saludo': '✉️🤝', columnista: '📰✍️', tesis: '📑🎓', contraargumento: '🛡️💬', rotundo: '💯✊', polémico: '🔥💬', encabezado: '📰🔠', 'idea principal': '💡⭐', sintetizar: '📚➡️📝', parafrasear: '📝🔁', omitir: '✂️📝', 'en resumidas cuentas': '📚➡️🧾', fragmento: '📄✂️',
    // registro y variedades
    'tratar de tú': '🫵🤝', registro: '🎚️🗣️', informal: '👕😄', 'de tú a tú': '🧑🤝🧑', esmerado: '🧐✨', tratamiento: '🎩🗣️', voseo: '🌎🗣️', seseo: '🗣️🐍', vosotros: '👥🫵', latinismo: '🏛️📜', regionalismo: '🗺️🗣️', variedad: '🌍🗣️', ironía: '🙃💬', sarcasmo: '😏🗨️', 'gastar una broma': '🤡😆', 'doble sentido': '🔀💬', chiste: '😂💬', 'tener gracia': '😄✨',
    // reuniones, datos
    'orden del día': '📋📌', 'tomar la palabra': '🎤✋', ponencia: '🧑‍🏫📊', 'turno de preguntas': '🙋❓', 'pasar a': '➡️📋', 'dar paso a': '🚪➡️', porcentaje: '📊%', tendencia: '📈🔍', gráfico: '📊📈', aumentar: '📈⬆️', descender: '📉⬇️', 'según los datos': '📊👉', concesión: '🤝🎁', 'llegar a un acuerdo': '🤝📝', contraoferta: '💼↔️', convencer: '🗣️✅', 'a cambio de': '🔄🤝', ceder: '🤲🚪',
    // perífrasis y modismos
    'echarse a': '🏁😂', 'no dejar de': '🔁⛔', 'venir a': '🚶➡️🎯', 'estar por': '⏳🔜', 'acabar por': '🔚✔️', 'tomar el pelo': '🤡🤥', 'meter la pata': '🦶⚠️', 'costar un ojo de la cara': '👁️💰', 'estar en las nubes': '☁️🧑', 'ponerse las pilas': '🔋💪', 'dar en el clavo': '🔨🎯', tutear: '🫵🤝', coloquial: '💬😎', solemne: '🎩🏛️', campechano: '🤗😎', eufemismo: '🙊💬', cortante: '✂️😐',
    // prensa y literatura
    titular: '📰🔠', crónica: '📰🕰️', editorial: '📰🖋️', fuente: '📰🔗', desmentir: '📰❌', sesgo: '⚖️↘️', narrador: '🧑📖', alusión: '💬👉', desenlace: '📖🏁', metáfora: '🌙🔗🧠', evocar: '💭🕰️', prosa: '📖✒️', conector: '🔗📝', 'ahora bien': '🔄💬', 'de ahí que': '➡️🔗', 'cabe señalar': '👉📌', 'a su vez': '🔁➡️', coherencia: '🧩✅', 'idea rectora': '💡🧭', esgrimir: '⚔️💬', corroborar: '🔍✅', planteamiento: '📐💡', 'a modo de conclusión': '🏁📝', premisa: '📌🧠', hallazgos: '🔎🧪', apartado: '📑📂', recopilar: '🗂️🧺', plazo: '📅⏳', viabilidad: '🧪✅', 'se desprende que': '🔎➡️', reseña: '⭐📝', trama: '🕸️📖', reparto: '🎭👥', 'adolecer de': '⚠️❌', 'puesta en escena': '🎭🎬', logrado: '🏆✅', desmontar: '🔧🧩', falacia: '🧩❌', puntualizar: '📍📝', cuestionar: '❓🧐', objeción: '✋🗣️',
    'por otra parte': '➕👉', tertulia: '🗣️☕🗣️', moderador: '🧑🎙️', 'turno de palabra': '🎙️🔢', interrumpir: '✋🗣️', disentir: '↔️🗣️', 'ceder la palabra': '🎙️➡️', orador: '🧑🗣️', auditorio: '🏛️👥', entonación: '🗣️〰️', pausa: '⏸️🗣️', 'captar la atención': '👀🧲', discurso: '🧑🗣️📜', vehemente: '😠🔥', peyorativo: '👎🗯️', tozudo: '🧱😤', sutil: '🪶🔍', equívoco: '❓🔀', insinuación: '🤫👉', calambur: '🔀🔤', 'entre líneas': '📄👀', 'a caballo regalado no le mires el diente': '🐴🎁🦷', 'más vale pájaro en mano que ciento volando': '🐦✋🐦🐦', 'no hay mal que por bien no venga': '🌧️➡️🌈', 'en boca cerrada no entran moscas': '🤐🪰', 'ser pan comido': '🍞😋', elipsis: '✂️💬', prosopopeya: '🌳🗣️', otorgante: '✍️📜', 'por la presente': '📄✍️', subsanar: '🩹📄', expediente: '🗂️📁', vigencia: '📜⏳✅', entradilla: '📰🔠', sensacionalismo: '📰😱', recapitular: '🔁📋', concisión: '✂️📝', 'hilo conductor': '🧵➡️', condensar: '💧⬇️📝', 'ceñirse a': '📏🔒', refutar: '🛡️❌', salvedad: '⚠️📝', 'cabe destacar que': '⭐👉', redundancia: '🔁🔁', pleonasmo: '🔁📝', queísmo: '🔤❓', dequeísmo: '🔤➕', pulir: '🧽✨', cacofonía: '🔊😖', retintín: '😏🗯️', condescendiente: '😒⬇️', mordaz: '🗡️💬', tono: '🎚️🗣️', matiz: '🎨🔍', improvisar: '💡🎬', 'salir del paso': '🚶‍♂️💨', precisar: '📍🔍', 'sobre la marcha': '🚶💡', 'dar rodeos': '🔄🚶', mediar: '🧑🤝🧑', terciar: '✋💬', reformular: '📝🔁', interlocutor: '🗣️🧑', 'ponerse en el lugar de': '👟🔄🧑',
    // primeros pasos / cognados
    música: '🔊🗣️', familiar: '👨‍👩‍👧', actor: '🎭🧑', banana: '🍌', cámara: '📷', cereal: '🥣🌾', chocolatería: '🍫', clima: '🌦️', computadora: '💻', cultura: '🏛️🎭', elefante: '🐘', energía: '⚡', fantástico: '🤩✨', gorila: '🦍', insecto: '🐜', jirafa: '🦒', kilo: '⚖️', lámpara: '💡🛋️', león: '🦁', mango: '🥭', nacional: '🏳️', océano: '🌊', pirámide: '🔺🏜️', radio: '📻', safari: '🦁🚙', tomate: '🍅', universo: '🌌', vegetal: '🥕', zebra: '🦓', zona: '🗺️📍', zoo: '🦁🏞️'
  };
  // alias (palabras con varias formas)
  const ALIAS = { 'la noche (de hotel)': 'noche de hotel', 'el fin de semana': 'fin de semana', 'las vacaciones': 'vacaciones', 'los abuelos': 'abuelos', 'el español': 'español', 'la tarde': 'tarde', 'la mañana': 'mañana' };
  const ART = /^(el|la|los|las|un|una|unos|unas)\s+/i;
  const norm = (w) => String(w || '').toLowerCase().trim().replace(/[.,;:!?¿¡«»"()]/g, '').replace(/\s+/g, ' ');

  // palabra clave -> emojis; null si no hay
  V.lookup = function (word) {
    let w = norm(word); if (!w) return null;
    if (M[w]) return M[w];
    if (ALIAS[w] && M[ALIAS[w]]) return M[ALIAS[w]];
    const s = w.replace(ART, ''); if (M[s]) return M[s];
    return null;
  };
  V.has = (word) => !!V.lookup(word);

  // Reserva simbólica según categoría gramatical, para palabras sin dibujo propio
  const POOL = { verbo: ['🏃💨', '🛠️✋', '🧠⚙️', '🗣️💬'], adjetivo: ['🎨✨', '🔍👌', '⭐🔎'], sustantivo: ['📦✨', '🧩🏷️', '🔖📘'], otros: ['🧩📝', '💡📚', '🔤✨'] };
  V.fallback = function (word, pos) {
    const p = /verb/i.test(pos || '') ? 'verbo' : /adj/i.test(pos || '') ? 'adjetivo' : /nombre|sust|n\./i.test(pos || '') ? 'sustantivo' : 'otros';
    let k = 0; String(word).split('').forEach((c) => { k = (k * 31 + c.charCodeAt(0)) >>> 0; });
    return POOL[p][k % POOL[p].length];
  };

  const PAL = [['#fff4d6', '#ffe08a'], ['#e3f2fd', '#90caf9'], ['#e8f5e9', '#a5d6a7'], ['#fce4ec', '#f48fb1'], ['#ede7f6', '#b39ddb'], ['#e0f7fa', '#80deea'], ['#fff3e0', '#ffcc80'], ['#f1f8e9', '#c5e1a5']];
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, a, txt) => { const e = document.createElementNS(NS, tag); Object.keys(a || {}).forEach((k) => e.setAttribute(k, a[k])); if (txt != null) e.textContent = txt; return e; };
  const split = (s) => Array.from(String(s).replace(/️/g, '')).reduce((acc, ch) => { // agrupa emojis compuestos (ZWJ, tonos)
    if (!acc.length) return [ch];
    const last = acc[acc.length - 1];
    if (ch === '‍' || last.endsWith('‍') || /[\u{1F3FB}-\u{1F3FF}⃣]/u.test(ch)) acc[acc.length - 1] = last + ch; else acc.push(ch);
    return acc;
  }, []);

  // Dibuja la escena (SVG) de una palabra
  V.scene = function (word, pos) {
    let em = V.lookup(word); const known = !!em; if (!em) em = V.fallback(word, pos);
    let k = 0; String(word).split('').forEach((c) => { k = (k * 17 + c.charCodeAt(0)) >>> 0; });
    const pal = PAL[k % PAL.length];
    const id = 'g' + k.toString(36) + Math.floor(Math.random() * 1e5).toString(36);
    const s = svg('svg', { viewBox: '0 0 300 150', class: 'vis-svg', role: 'img', 'aria-label': 'Ilustración: ' + word, preserveAspectRatio: 'xMidYMid slice' });
    const defs = svg('defs'); const g = svg('linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' });
    g.append(svg('stop', { offset: '0', 'stop-color': pal[0] }), svg('stop', { offset: '1', 'stop-color': pal[1] })); defs.appendChild(g); s.appendChild(defs);
    s.appendChild(svg('rect', { width: '300', height: '150', rx: '18', fill: 'url(#' + id + ')' }));
    s.appendChild(svg('circle', { cx: String(40 + (k % 60)), cy: '34', r: '46', fill: '#ffffff', opacity: '.35' }));
    s.appendChild(svg('ellipse', { cx: '150', cy: '128', rx: '110', ry: '10', fill: '#000', opacity: '.10' }));
    if (em[0] === '#') {
      s.appendChild(svg('text', { x: '150', y: '104', 'text-anchor': 'middle', 'font-size': em.length > 3 ? '76' : '96', 'font-weight': '800', fill: '#16140d', 'font-family': 'system-ui, sans-serif' }, em.slice(1)));
    } else {
      const list = split(em).slice(0, 3); const n = list.length; const size = n === 1 ? 88 : n === 2 ? 66 : 52; const gap = n === 1 ? 0 : n === 2 ? 92 : 80;
      list.forEach((e, i) => s.appendChild(svg('text', { x: String(150 + (i - (n - 1) / 2) * gap), y: n === 1 ? '102' : '98', 'text-anchor': 'middle', 'font-size': String(size), 'font-family': '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }, e)));
    }
    s.dataset.known = known ? '1' : '0';
    return s;
  };

  // Resalta la palabra dentro de su frase
  function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  V.markSentence = function (word, sentence) {
    const text = String(sentence || ''); const base = norm(word).replace(ART, '').replace(/\(.*?\)/g, '').replace('…', '').trim();
    if (!base) return esc(text);
    const tries = [base];
    if (/(ar|er|ir)$/.test(base) && base.length > 4) tries.push(base.slice(0, -2));
    if (/se$/.test(base) && base.length > 5) tries.push(base.slice(0, -4));
    if (base.length > 4) tries.push(base.slice(0, Math.max(4, base.length - 2)));
    for (const t of tries) {
      const i = text.toLowerCase().indexOf(t);
      if (i >= 0) {
        let j = i + t.length; while (j < text.length && /[\p{L}\p{M}]/u.test(text[j])) j++;
        let a = i; while (a > 0 && /[\p{L}\p{M}]/u.test(text[a - 1])) a--;
        return esc(text.slice(0, a)) + '<mark>' + esc(text.slice(a, j)) + '</mark>' + esc(text.slice(j));
      }
    }
    return esc(text);
  };

  const st = () => (L.S && L.S.prog && L.S.prog.settings) || {};
  V.enabled = () => st().showImages !== false;

  // Solo la imagen (clicable: pronuncia la palabra)
  V.pic = function (word, pos, extra) {
    const pic = h('div', { class: 'vis-pic' + (extra ? ' ' + extra : ''), role: 'button', tabindex: '0', 'aria-label': 'Escuchar: ' + word });
    if (!V.enabled()) { pic.hidden = true; return pic; }
    pic.appendChild(V.scene(word, pos));
    const go = () => { try { L.Audio.speak(word, { name: word }); } catch (e) { /* sin voz */ } };
    pic.addEventListener('click', go);
    pic.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return pic;
  };
  V.mini = (word, pos) => V.pic(word, pos, 'mini');

  // Tarjeta completa: imagen + palabra + frase + traducción
  // item: { w, pos, def, ex, en }
  V.figure = function (item, opts) {
    opts = opts || {};
    const wrap = h('figure', { class: 'vis' + (opts.compact ? ' compact' : '') });
    const pic = h('div', { class: 'vis-pic', role: 'button', tabindex: '0', 'aria-label': 'Escuchar: ' + item.w });
    if (V.enabled()) pic.appendChild(V.scene(item.w, item.pos));
    else pic.hidden = true;
    const say = () => { try { L.Audio.speak(item.ex || item.w, { name: item.w }); } catch (e) { /* sin voz */ } };
    if (st().autoPlay) pic.addEventListener('click', say);
    else pic.addEventListener('click', () => { try { L.Audio.speak(item.w, { name: item.w }); } catch (e) { /* sin voz */ } });
    pic.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pic.click(); } });
    const cap = h('figcaption');
    cap.appendChild(h('div', { class: 'vis-word' }, h('strong', { lang: 'es' }, item.w), item.pos ? h('span', { class: 'pos' }, item.pos) : null, L.Audio.btn(item.w, { small: true, name: item.w }), L.Audio.btn(item.w, { small: true, slow: true, name: item.w })));
    if (item.def && !opts.noDef) cap.appendChild(h('div', { class: 'vis-def' }, item.def));
    if (item.ex) {
      cap.appendChild(h('div', { class: 'vis-ex', lang: 'es' }, L.Audio.btn(item.ex, { small: true, name: item.ex }), h('span', { html: V.markSentence(item.w, item.ex) })));
      if (st().showTranslations !== false) {
        const lang = L.sup ? L.sup.lang() : 'none';
        if (item.en && lang !== 'none') cap.appendChild(h('div', { class: 'vis-en', lang: 'en', 'data-nosup': '1' }, item.en));
        else if (item.en && !L.sup) cap.appendChild(h('div', { class: 'vis-en', lang: 'en', 'data-nosup': '1' }, item.en));
        const ar = L.C.glossAr && L.C.glossAr[item.w];
        if (lang === 'ar' && ar) cap.appendChild(h('div', { class: 'vis-ar', lang: 'ar', dir: 'rtl', 'data-nosup': '1' }, 'المعنى: ' + ar));
      }
    }
    wrap.append(pic, cap);
    return wrap;
  };
})(window.LWS);
