/* Languway Spanish — guía de características: qué hace cada función, cómo se usa, qué incluye y qué limitaciones tiene */
(function (L) {
  'use strict';
  const { h } = L;
  const ico = (n) => L.ico(n);

  // Cada texto es [español, árabe]
  const F = [
    {
      id: 'ruta', icon: 'book', path: '#/aprender', name: ['Ruta de lecciones (A1 a C1)', 'مسار الدروس (من A1 إلى C1)'],
      what: ['El camino principal del curso. Va de A1 a C1 en 25 niveles, con unidades y lecciones en orden. Solo se abre la lección siguiente cuando terminas la anterior, así nunca te pierdes.', 'المسار الرئيسي للكورس. يمتد من A1 إلى C1 في 25 مستوى، مقسمة إلى وحدات ودروس مرتبة. لا يُفتح الدرس التالي إلا بعد إنهاء السابق، فلا تضيع أبداً.'],
      steps: [['Pulsa «Lecciones» en el menú (o «Continuar» en la barra de abajo en el móvil).', 'اضغط «Lecciones» في القائمة (أو «Continuar» في الشريط السفلي على الجوال).'], ['Elige un nivel (A1, A2, B1, B2 o C1) y verás sus unidades.', 'اختر مستوى (A1 أو A2 أو B1 أو B2 أو C1) وستظهر وحداته.'], ['Entra en la primera lección disponible: la fila con el botón «Empezar» o «Continuar».', 'ادخل أول درس متاح: الصف الذي عليه زر «Empezar» أو «Continuar».'], ['Al terminar todas las lecciones de una unidad, haz el examen de la unidad para pasar a la siguiente.', 'عند إنهاء كل دروس الوحدة، قدّم امتحان الوحدة لتنتقل إلى التي بعدها.'], ['Cada fila muestra tu estado: número, nota (%), «Bloqueada» o «Empezar», y a la derecha el botón «Libro» de palabras.', 'كل صف يعرض حالتك: الرقم، الدرجة (%)، «Bloqueada» أو «Empezar»، وعلى اليمين زر «Libro» لكتاب الكلمات.']],
      has: [['Prueba de nivel opcional para empezar en el punto adecuado.', 'اختبار مستوى اختياري لتبدأ من النقطة المناسبة.'], ['Candados que impiden saltar contenido.', 'أقفال تمنع تخطي المحتوى.'], ['Examen por unidad y examen por nivel.', 'امتحان لكل وحدة وامتحان لكل مستوى.']],
      limits: [['No todas las lecciones de todos los niveles están escritas todavía: las que faltan aparecen como «En preparación».', 'ليست كل دروس كل المستويات مكتوبة بعد؛ الدروس الناقصة تظهر بعبارة «En preparación».'], ['No se puede saltar una lección sin hacer la prueba de nivel.', 'لا يمكن تخطي درس إلا بإجراء اختبار المستوى.']],
      tips: [['Estudia una lección al día: es mejor que cinco el fin de semana.', 'ادرس درساً واحداً يومياً؛ أفضل من خمسة دروس في نهاية الأسبوع.']],
    },
    {
      id: 'leccion', icon: 'puzzle', path: '#/aprender', name: ['La lección paso a paso', 'الدرس خطوة بخطوة'],
      what: ['Cada lección tiene 7 pasos fijos: Objetivos, Vocabulario, Explicación, Escuchar, Práctica, Examen y Resultado. Siempre es el mismo orden, para que no dudes qué hacer.', 'لكل درس 7 خطوات ثابتة: الأهداف، المفردات، الشرح، الاستماع، التدريب، الامتحان، النتيجة. الترتيب نفسه دائماً حتى لا تتردد فيما تفعل.'],
      steps: [['Objetivos: lee qué vas a aprender.', 'الأهداف: اقرأ ما ستتعلمه.'], ['Vocabulario: mira cada palabra con su imagen, su frase y su audio.', 'المفردات: شاهد كل كلمة مع صورتها وجملتها وصوتها.'], ['Explicación: lee la regla. Cada párrafo tiene su explicación y puedes preguntar al asistente.', 'الشرح: اقرأ القاعدة. لكل فقرة شرحها ويمكنك سؤال المساعد.'], ['Escuchar: pulsa el altavoz y repite en voz alta.', 'الاستماع: اضغط السماعة وكرر بصوت عالٍ.'], ['Práctica: ejercicios sin nota para entrenar.', 'التدريب: تمارين بلا درجة للتمرين.'], ['Examen: necesitas al menos 75 % para aprobar.', 'الامتحان: تحتاج 75% على الأقل للنجاح.'], ['Resultado: ves tu nota, tus fallos y se abre el libro de palabras de la lección.', 'النتيجة: ترى درجتك وأخطاءك ويُفتح كتاب كلمات الدرس.']],
      has: [['Imagen y frase de ejemplo en cada palabra nueva.', 'صورة وجملة مثال لكل كلمة جديدة.'], ['Explicación de cada regla en español y, según tu idioma de ayuda, en inglés o árabe.', 'شرح كل قاعدة بالإسبانية وبالإنجليزية أو العربية بحسب لغة المساعدة.'], ['Puedes repetir el examen para mejorar tu nota.', 'يمكنك إعادة الامتحان لتحسين درجتك.']],
      limits: [['Si no apruebas (menos de 75 %), la lección no cuenta como terminada y el libro de palabras sigue cerrado.', 'إن لم تنجح (أقل من 75%) لا يُحتسب الدرس منتهياً ويبقى كتاب الكلمات مقفلاً.'], ['Las explicaciones de los párrafos fueron generadas automáticamente salvo en A1 y A2, donde están escritas a mano; pueden tener imprecisiones.', 'شروح الفقرات مُولَّدة آلياً ما عدا A1 وA2 فهي مكتوبة يدوياً؛ وقد تحتوي على عدم دقة.']],
      tips: [['Pulsa el altavoz de la frase y repítela tres veces antes del examen.', 'اضغط سماعة الجملة وكررها ثلاث مرات قبل الامتحان.']],
    },
    {
      id: 'libro', icon: 'abc', path: '#/libros', name: ['Libro de palabras por lección', 'كتاب الكلمات لكل درس'],
      what: ['Cada lección tiene su propio libro con todas sus palabras: imagen, significado, frase de ejemplo y audio. Se abre solo cuando apruebas esa lección.', 'لكل درس كتاب خاص بكلماته: صورة ومعنى وجملة مثال وصوت. لا يُفتح إلا بعد نجاحك في ذلك الدرس.'],
      steps: [['Termina y aprueba una lección.', 'أنهِ درساً وانجح فيه.'], ['En la lista de lecciones, pulsa el botón «Libro» de esa fila (o entra en «Libros de palabras»).', 'في قائمة الدروس اضغط زر «Libro» في ذلك الصف (أو ادخل «Libros de palabras»).'], ['Pulsa el altavoz para oír la palabra y la frase; pulsa la estrella para guardarla en favoritos.', 'اضغط السماعة لسماع الكلمة والجملة؛ واضغط النجمة لحفظها في المفضلة.'], ['Pulsa «Explicación completa» para abrir la palabra en el traductor.', 'اضغط «Explicación completa» لفتح الكلمة في المترجم.'], ['Al final, «Repasar estas palabras» te lleva al repaso espaciado.', 'في النهاية «Repasar estas palabras» ينقلك إلى المراجعة المتباعدة.']],
      has: [['Un libro por lección, con su nombre «Libro de palabras · Lección N».', 'كتاب لكل درس باسم «Libro de palabras · Lección N».'], ['Índice general con candados en «Libros de palabras».', 'فهرس عام بأقفال في «Libros de palabras».']],
      limits: [['Mientras no apruebes la lección, el libro permanece bloqueado (es intencional).', 'ما دمت لم تنجح في الدرس يبقى الكتاب مقفلاً (وهذا مقصود).'], ['Las imágenes reales se cargan de internet; sin conexión se ve una ilustración sencilla.', 'الصور الحقيقية تُحمَّل من الإنترنت؛ بدون اتصال تظهر رسمة بسيطة.']],
      tips: [['Abre el libro justo después del examen: es el mejor momento para fijar las palabras.', 'افتح الكتاب بعد الامتحان مباشرة؛ فهو أفضل وقت لتثبيت الكلمات.']],
    },
    {
      id: 'repaso', icon: 'repeat', path: '#/repaso', name: ['Repaso espaciado', 'المراجعة المتباعدة'],
      what: ['Un sistema que te vuelve a preguntar cada palabra justo antes de que la olvides. Usa 7 cajas con intervalos de 0, 1, 3, 7, 14, 30 y 60 días.', 'نظام يعيد سؤالك عن كل كلمة قبل أن تنساها. يستخدم 7 صناديق بفواصل 0 و1 و3 و7 و14 و30 و60 يوماً.'],
      steps: [['Las palabras entran en el repaso cuando terminas una lección o las añades con «Añadir al repaso».', 'تدخل الكلمات في المراجعة عند إنهاء درس أو إضافتها بزر «Añadir al repaso».'], ['Abre «Repaso diario»: verás cuántas palabras toca repasar hoy.', 'افتح «Repaso diario»: سترى عدد الكلمات المطلوب مراجعتها اليوم.'], ['Responde cada pregunta. Si aciertas, la palabra sube de caja y tarda más en volver; si fallas, vuelve a la primera.', 'أجب عن كل سؤال. إن أصبت ترتفع الكلمة صندوقاً وتتأخر في العودة؛ وإن أخطأت ترجع للأول.'], ['Haz el repaso a diario: bastan 2 o 3 minutos.', 'راجع يومياً: تكفي دقيقتان أو ثلاث.']],
      has: [['Aviso en la campana cuando hay palabras pendientes.', 'تنبيه في الجرس عند وجود كلمات معلقة.'], ['Tarjetas de vocabulario además del test.', 'بطاقات مفردات إضافة إلى الاختبار.']],
      limits: [['Si dejas pasar muchos días, se acumulan palabras; el sistema limita la sesión para no abrumarte.', 'إن تركت أياماً كثيرة تتراكم الكلمات؛ ويحدّ النظام من طول الجلسة كي لا تُرهق.'], ['El progreso del repaso se guarda en tu dispositivo (y en la nube si tienes cuenta).', 'يُحفظ تقدم المراجعة على جهازك (وفي السحابة إن كان لك حساب).']],
      tips: [['Hazlo siempre a la misma hora para crear el hábito.', 'افعلها في الوقت نفسه يومياً لتكوّن العادة.']],
    },
    {
      id: 'traductor', icon: 'translate', path: '#/traductor', name: ['Traductor y explicador de palabras', 'المترجم ومفسّر الكلمات'],
      what: ['No solo traduce: explica la palabra. Te dice su significado en tu idioma, cuándo se usa, su gramática, la conjugación si es un verbo (presente, pasado, imperfecto y futuro) y muestra una imagen si es un sustantivo.', 'لا يترجم فقط بل يشرح الكلمة: معناها بلغتك، ومتى تُستعمل، وقواعدها، وتصريفها إن كانت فعلاً (المضارع والماضي والماضي المستمر والمستقبل)، ويعرض صورة إن كانت اسماً.'],
      steps: [['Pulsa «Traductor» en el menú o en la barra de abajo.', 'اضغط «Traductor» في القائمة أو في الشريط السفلي.'], ['Escribe una palabra en español, en inglés o en árabe (por ejemplo «hablar», «knife» o «مرحبا»).', 'اكتب كلمة بالإسبانية أو الإنجليزية أو العربية (مثل «hablar» أو «knife» أو «مرحبا»).'], ['Elige la dirección (Auto, Español → English, English → Español) y pulsa «Buscar». Usa los botones de acentos si no los tienes en el teclado.', 'اختر الاتجاه (Auto أو Español → English أو English → Español) واضغط «Buscar». استعمل أزرار الحركات إن لم تكن في لوحة المفاتيح.'], ['Lee la tarjeta de la palabra y, debajo, el bloque «Explicación» (o «الشرح» en árabe).', 'اقرأ بطاقة الكلمة ثم تحتها قسم «Explicación» (أو «الشرح» بالعربية).'], ['Si la palabra no está en el diccionario de la app, se busca en línea en Wiktionary y se muestra su definición.', 'إن لم تكن الكلمة في قاموس التطبيق يُبحث عنها عبر الإنترنت في ويكاموس وتُعرض تعريفاتها.']],
      has: [['Diccionario propio de unas 444 palabras con ejemplos y audio.', 'قاموس داخلي بنحو 444 كلمة مع أمثلة وصوت.'], ['Explicación gramatical en inglés o árabe según tu idioma de ayuda.', 'شرح نحوي بالإنجليزية أو العربية بحسب لغة المساعدة.'], ['Tabla de conjugación con audio al pulsar cada forma.', 'جدول تصريف مع نطق عند الضغط على كل صيغة.'], ['Historial de palabras buscadas.', 'سجل بالكلمات المبحوث عنها.']],
      limits: [['Sin internet solo funciona con las ~444 palabras del diccionario interno.', 'بدون إنترنت يعمل فقط مع نحو 444 كلمة من القاموس الداخلي.'], ['El significado en árabe existe solo para unas 300 palabras; para las demás se muestra el inglés.', 'المعنى بالعربية متوفر لنحو 300 كلمة فقط؛ وللباقي يُعرض المعنى بالإنجليزية.'], ['No traduce frases largas: es un explicador de palabras, no un traductor de textos.', 'لا يترجم الجمل الطويلة: هو مفسّر كلمات وليس مترجم نصوص.'], ['La conjugación automática sigue las reglas regulares; en verbos irregulares que no estén en el diccionario interno puede haber errores.', 'التصريف الآلي يتبع القواعد المنتظمة؛ وفي الأفعال الشاذة غير الموجودة في القاموس الداخلي قد توجد أخطاء.'], ['La traducción a otros idiomas (en línea) funciona sobre todo con sustantivos que tienen artículo en Wikipedia.', 'الترجمة إلى لغات أخرى (عبر الإنترنت) تنجح غالباً مع الأسماء التي لها مقال في ويكيبيديا.']],
      tips: [['Para un verbo, busca siempre el infinitivo (hablar, comer, vivir).', 'للفعل ابحث دائماً عن المصدر (hablar وcomer وvivir).']],
    },
    {
      id: 'diccionario', icon: 'search', path: '#/vocabulario', name: ['Diccionario y tarjetas', 'القاموس والبطاقات'],
      what: ['La lista de todas las palabras que has visto, con filtros, favoritas y tarjetas para memorizar.', 'قائمة بكل الكلمات التي رأيتها مع مرشحات ومفضلة وبطاقات للحفظ.'],
      steps: [['Abre «Diccionario» en la sección Herramientas.', 'افتح «Diccionario» في قسم الأدوات.'], ['Usa el buscador o los filtros para encontrar una palabra.', 'استخدم البحث أو المرشحات للعثور على كلمة.'], ['Pulsa «Tarjetas» para practicar con flashcards.', 'اضغط «Tarjetas» للتدرب ببطاقات الحفظ.'], ['Toca la estrella para guardar una palabra como favorita.', 'المس النجمة لحفظ كلمة كمفضلة.']],
      has: [['Imagen, frase y audio en cada palabra.', 'صورة وجملة وصوت لكل كلمة.'], ['Favoritos en una página propia.', 'المفضلة في صفحة خاصة.']],
      limits: [['Solo contiene palabras de las lecciones disponibles.', 'يحتوي فقط على كلمات الدروس المتاحة.']],
      tips: [['Marca como favoritas las palabras difíciles y repásalas el fin de semana.', 'ضع نجمة على الكلمات الصعبة وراجعها في عطلة الأسبوع.']],
    },
    {
      id: 'gramatica', icon: 'puzzle', path: '#/gramatica', name: ['Gramática', 'القواعد'],
      what: ['Todas las reglas del curso en un solo sitio, explicadas con ejemplos y ejercicios propios.', 'كل قواعد الكورس في مكان واحد، مشروحة بأمثلة وتمارين خاصة.'],
      steps: [['Abre «Gramática».', 'افتح «Gramática».'], ['Busca el tema o elige uno de la lista.', 'ابحث عن الموضوع أو اخترْه من القائمة.'], ['Lee la explicación, mira los ejemplos y haz los ejercicios.', 'اقرأ الشرح وشاهد الأمثلة وحل التمارين.'], ['Si algo no se entiende, pulsa el botón del asistente (burbuja de chat) para preguntar por esa regla.', 'إن لم يكن شيء واضحاً اضغط زر المساعد (فقاعة الدردشة) واسأل عن تلك القاعدة.']],
      has: [['Cada regla con su explicación por párrafos.', 'كل قاعدة بشرح لكل فقرة.'], ['Práctica de gramática en «Práctica libre».', 'تدريب القواعد في «Práctica libre».']],
      limits: [['Las explicaciones automáticas pueden ser menos pulidas que las escritas a mano.', 'الشروح الآلية قد تكون أقل صقلاً من المكتوبة يدوياً.']],
      tips: [['Lee primero la regla en la lección y usa esta sección solo para repasar.', 'اقرأ القاعدة أولاً في الدرس واستعمل هذا القسم للمراجعة فقط.']],
    },
    {
      id: 'asistente', icon: 'spark', path: '#/asistente', name: ['Asistente de reglas', 'مساعد القواعد'],
      what: ['Un asistente que explica cualquier regla del curso cuando se lo preguntas, con ejemplos y en tu idioma de ayuda.', 'مساعد يشرح أي قاعدة في الكورس عند سؤاله، بأمثلة وبلغة المساعدة التي اخترتها.'],
      steps: [['Pulsa el botón redondo de chat (aparece en lecciones, gramática y traductor) o abre «Asistente».', 'اضغط زر الدردشة الدائري (يظهر في الدروس والقواعد والمترجم) أو افتح «Asistente».'], ['Escribe tu duda, por ejemplo «¿cuándo uso ser y estar?».', 'اكتب سؤالك، مثل «¿cuándo uso ser y estar?».'], ['Lee la explicación y pulsa los enlaces para ir a la lección o práctica relacionada.', 'اقرأ الشرح واضغط الروابط للذهاب إلى الدرس أو التدريب المرتبط.']],
      has: [['Si lo abres desde una lección, ya sabe de qué regla hablas.', 'إن فتحته من درس فهو يعرف أي قاعدة تقصد.'], ['Diagnóstico de errores frecuentes.', 'تشخيص للأخطاء الشائعة.']],
      limits: [['Funciona sin internet con las reglas del curso; no es un chat libre y no responde a cualquier tema.', 'يعمل بدون إنترنت على قواعد الكورس؛ وليس دردشة حرة ولا يجيب عن أي موضوع.'], ['Si la pregunta no coincide con ninguna regla, te propone temas parecidos.', 'إن لم يطابق سؤالك أي قاعدة فسيقترح مواضيع قريبة.']],
      tips: [['Pregunta con palabras clave: «pretérito», «artículos», «ser y estar».', 'اسأل بكلمات مفتاحية: «pretérito» و«artículos» و«ser y estar».']],
    },
    {
      id: 'audio', icon: 'headphones', path: '#/escuchar', name: ['Escuchar y pronunciación', 'الاستماع والنطق'],
      what: ['Actividades de comprensión auditiva y de pronunciación. La voz sale de tu dispositivo, a velocidad normal o lenta.', 'أنشطة للفهم السمعي والنطق. يصدر الصوت من جهازك بسرعة عادية أو بطيئة.'],
      steps: [['Abre «Escuchar» y elige una actividad.', 'افتح «Escuchar» واختر نشاطاً.'], ['Pulsa el altavoz para oír, o la tortuga/reloj para oír despacio.', 'اضغط السماعة للاستماع، أو السلحفاة/الساعة للاستماع ببطء.'], ['Elige la respuesta correcta.', 'اختر الإجابة الصحيحة.'], ['En «Pronunciación» elige un tema y repite cada sílaba o frase en voz alta.', 'في «Pronunciación» اختر موضوعاً وكرر كل مقطع أو جملة بصوت عالٍ.']],
      has: [['Voz lenta para entender cada sonido.', 'صوت بطيء لفهم كل صوت.'], ['Ajustes de voz y velocidad en Configuración › Audio.', 'إعدادات الصوت والسرعة في Configuración › Audio.']],
      limits: [['La calidad de la voz depende de las voces en español instaladas en tu dispositivo.', 'جودة الصوت تعتمد على الأصوات الإسبانية المثبتة في جهازك.'], ['Algunos navegadores no tienen voz en español: en ese caso instala una en los ajustes del sistema.', 'بعض المتصفحات لا تملك صوتاً إسبانياً؛ ثبّت واحداً من إعدادات النظام.']],
      tips: [['Escucha primero lento, después a velocidad normal.', 'استمع أولاً ببطء ثم بالسرعة العادية.']],
    },
    {
      id: 'habla', icon: 'mic', path: '#/habla', name: ['Habla: practica con tu voz', 'تحدّث: تدرب بصوتك'],
      what: ['Diga una frase en voz alta y la aplicación la compara con la correcta y te dice en qué palabras fallaste.', 'قل جملة بصوت عالٍ فيقارنها التطبيق بالصحيحة ويخبرك في أي كلمات أخطأت.'],
      steps: [['Abre «Habla» (o «Pronunciación» › Grabar).', 'افتح «Habla» (أو «Pronunciación» › Grabar).'], ['Permite el micrófono cuando el navegador lo pida.', 'اسمح بالميكروفون عندما يطلبه المتصفح.'], ['Pulsa «Grabar», di la frase y espera el resultado.', 'اضغط «Grabar» وقل الجملة وانتظر النتيجة.'], ['Repite hasta que todas las palabras salgan en verde.', 'أعد حتى تصبح كل الكلمات خضراء.']],
      has: [['Resultado por palabra, no solo una nota global.', 'نتيجة لكل كلمة وليس درجة عامة فقط.']],
      limits: [['Necesita un navegador con reconocimiento de voz (Chrome, Edge, Safari); en Firefox puede no funcionar.', 'يحتاج متصفحاً يدعم التعرف على الصوت (Chrome وEdge وSafari)؛ وقد لا يعمل في Firefox.'], ['En muchos navegadores el reconocimiento usa un servicio en línea, así que requiere conexión.', 'في كثير من المتصفحات يستخدم التعرف خدمة عبر الإنترنت فيحتاج اتصالاً.'], ['El ruido de fondo y el acento pueden bajar la precisión.', 'الضوضاء واللكنة قد تقلل الدقة.']],
      tips: [['Habla cerca del micrófono y en un sitio tranquilo.', 'تحدث قرب الميكروفون في مكان هادئ.']],
    },
    {
      id: 'lectura', icon: 'doc', path: '#/leer', name: ['Leer, escribir, frases, conversaciones e historias', 'القراءة والكتابة والجمل والمحادثات والقصص'],
      what: ['Cinco secciones para usar lo aprendido: textos para leer, redacciones para escribir, frases para ordenar, diálogos para completar e historias cortas.', 'خمسة أقسام لاستعمال ما تعلمته: نصوص للقراءة، وموضوعات للكتابة، وجمل للترتيب، وحوارات للإكمال، وقصص قصيرة.'],
      steps: [['Entra en «Leer», «Escribir», «Frases», «Conversación» o «Historias».', 'ادخل «Leer» أو «Escribir» أو «Frases» أو «Conversación» أو «Historias».'], ['Elige una actividad de tu nivel (las de niveles superiores están bloqueadas).', 'اختر نشاطاً من مستواك (أنشطة المستويات الأعلى مقفلة).'], ['Haz la actividad: lee y responde, ordena las palabras o escribe tu texto.', 'نفّذ النشاط: اقرأ وأجب، أو رتب الكلمات، أو اكتب نصك.'], ['En «Escribir», la lista de comprobación te indica qué cumple tu texto.', 'في «Escribir» تُظهر قائمة التحقق ما يحققه نصك.']],
      has: [['Nota guardada de cada actividad.', 'درجة محفوظة لكل نشاط.'], ['Audio en textos y diálogos.', 'صوت في النصوص والحوارات.']],
      limits: [['La corrección de «Escribir» se basa en criterios automáticos (longitud, palabras clave); no sustituye a un profesor.', 'تصحيح «Escribir» يعتمد على معايير آلية (الطول والكلمات المفتاحية)؛ ولا يغني عن معلم.'], ['Hay pocas actividades en los niveles altos.', 'عدد الأنشطة قليل في المستويات العليا.']],
      tips: [['Escribe tu texto sin mirar y luego compáralo con la lista.', 'اكتب نصك دون النظر ثم قارنه بالقائمة.']],
    },
    {
      id: 'practica', icon: 'target', path: '#/practica', name: ['Práctica libre, Reto del día y errores', 'التدريب الحر وتحدي اليوم والأخطاء'],
      what: ['Ejercicios fuera de las lecciones: vocabulario, gramática, escucha, pronunciación y construcción de frases; un reto diario de 10 preguntas (+50 XP) y una sección que repite justo tus errores.', 'تمارين خارج الدروس: مفردات وقواعد واستماع ونطق وبناء جمل؛ وتحدٍّ يومي من 10 أسئلة (+50 نقطة خبرة)؛ وقسم يعيد أخطاءك بالذات.'],
      steps: [['Abre «Práctica libre» y elige el tipo de ejercicio.', 'افتح «Práctica libre» واختر نوع التمرين.'], ['Responde; al terminar ves tu nota y qué fallaste.', 'أجب؛ وعند الانتهاء ترى درجتك وما أخطأت فيه.'], ['Abre «Reto del día» una vez al día para ganar experiencia extra.', 'افتح «Reto del día» مرة يومياً لتكسب خبرة إضافية.'], ['Abre «Errores» para repetir las preguntas que fallaste.', 'افتح «Errores» لإعادة الأسئلة التي أخطأت فيها.']],
      has: [['Meta diaria de 20 respuestas con anillo de progreso en Inicio.', 'هدف يومي من 20 إجابة مع حلقة تقدم في الرئيسية.'], ['Aviso cuando tu racha corre peligro.', 'تنبيه عندما تتعرض سلسلة أيامك للخطر.']],
      limits: [['Las preguntas salen de las lecciones que ya tienes disponibles; al principio hay pocas.', 'الأسئلة مأخوذة من الدروس المتاحة لك؛ فتكون قليلة في البداية.']],
      tips: [['Termina el día con el reto: son menos de cinco minutos.', 'اختم يومك بالتحدي؛ يستغرق أقل من خمس دقائق.']],
    },
    {
      id: 'plan', icon: 'calendar', path: '#/mi-plan', name: ['Mi plan, «Puedo…» y entrenador', 'خطتي و«أستطيع…» والمدرب'],
      what: ['Tu plan de hoy con tareas pequeñas, una lista de «Puedo…» (lo que ya sabes hacer en español) y un entrenador que te propone qué reforzar según tus fallos.', 'خطة اليوم بمهام صغيرة، وقائمة «أستطيع…» (ما صرت تقدر عليه بالإسبانية)، ومدرب يقترح ما تقويه بحسب أخطائك.'],
      steps: [['Abre «Mi plan de hoy» y marca las tareas al terminarlas.', 'افتح «Mi plan de hoy» وعلّم المهام عند إنهائها.'], ['Abre «Puedo…» para ver tus logros prácticos y lo que te falta.', 'افتح «Puedo…» لترى إنجازاتك العملية وما بقي لك.'], ['Abre «Entrenador» para ver tus puntos débiles y practicarlos.', 'افتح «Entrenador» لترى نقاط ضعفك وتتدرب عليها.']],
      has: [['El plan se adapta a tu nivel, tus lecciones y tus repasos.', 'الخطة تتكيف مع مستواك ودروسك ومراجعاتك.'], ['Ajustes de tiempo y metas en Configuración › Mi aprendizaje.', 'إعدادات الوقت والأهداف في Configuración › Mi aprendizaje.']],
      limits: [['El plan se calcula en tu dispositivo con tus datos; no es un profesor personal.', 'تُحسب الخطة على جهازك ببياناتك؛ وليست معلماً شخصياً.']],
      tips: [['Si hoy tienes poco tiempo, haz solo la primera tarea del plan.', 'إن كان وقتك ضيقاً اليوم فنفّذ أول مهمة في الخطة فقط.']],
    },
    {
      id: 'progreso', icon: 'chart', path: '#/progreso', name: ['Progreso, experiencia, racha y logros', 'التقدم والخبرة والسلسلة والإنجازات'],
      what: ['Todo lo que has hecho de verdad: porcentaje del curso, lecciones, notas, habilidades, días seguidos (racha), puntos de experiencia (XP) y logros desbloqueados.', 'كل ما أنجزته فعلاً: نسبة الكورس والدروس والدرجات والمهارات والأيام المتتالية (السلسلة) ونقاط الخبرة (XP) والإنجازات المفتوحة.'],
      steps: [['Pulsa «Progreso» (en la barra de abajo en el móvil).', 'اضغط «Progreso» (في الشريط السفلي على الجوال).'], ['Arriba, «Ahora te toca» te dice qué hacer a continuación.', 'في الأعلى «Ahora te toca» يخبرك بما تفعله بعد ذلك.'], ['Mira tus niveles (hecho, actual, bloqueado), tus habilidades y tus logros.', 'شاهد مستوياتك (منتهٍ وحالي ومقفل) ومهاراتك وإنجازاتك.']],
      has: [['16 logros (primera lección, 3 días seguidos, examen perfecto…).', '16 إنجازاً (أول درس، 3 أيام متتالية، امتحان كامل…).'], ['Notificaciones reales sobre tu actividad en la campana.', 'إشعارات حقيقية عن نشاطك في الجرس.']],
      limits: [['Los datos se guardan en tu dispositivo; si borras los datos del navegador sin copia de seguridad, se pierden (con cuenta en la nube se guardan también en línea).', 'تُحفظ البيانات في جهازك؛ وإن مسحت بيانات المتصفح دون نسخة احتياطية تضيع (ومع حساب سحابي تُحفظ أيضاً عبر الإنترنت).'], ['Las notificaciones aparecen solo dentro de la aplicación, no como avisos del sistema.', 'الإشعارات تظهر داخل التطبيق فقط وليست تنبيهات للنظام.']],
      tips: [['Una racha corta pero diaria vale más que sesiones largas y raras.', 'سلسلة قصيرة يومية أفضل من جلسات طويلة نادرة.']],
    },
    {
      id: 'certificados', icon: 'trophy', path: '#/certificados', name: ['Certificados y diploma', 'الشهادات والدبلوم'],
      what: ['Certificado por cada uno de los 25 niveles, por cada nivel A1–C1 y un diploma final, con un código para verificarlos.', 'شهادة لكل مستوى من المستويات الـ25، ولكل مستوى من A1–C1، ودبلوم نهائي، مع رمز للتحقق منها.'],
      steps: [['Completa todas las lecciones de un nivel y apruébalo.', 'أكمل كل دروس مستوى وانجح فيه.'], ['Abre «Certificados» y pulsa el certificado disponible.', 'افتح «Certificados» واضغط الشهادة المتاحة.'], ['Descárgalo o imprímelo, y comparte su código para que otros lo verifiquen en «Verificar».', 'نزّلها أو اطبعها وشارك رمزها ليتحقق غيرك منها في «Verificar».']],
      has: [['En «Mi perfil» ves cuántos tienes y cuántos te faltan.', 'في «Mi perfil» ترى كم شهادة لديك وكم بقي.']],
      limits: [['Son certificados de finalización de esta plataforma: no son títulos oficiales ni equivalen al DELE.', 'هي شهادات إتمام من هذه المنصة؛ وليست شهادات رسمية ولا تعادل DELE.']],
      tips: [['Guarda el certificado en PDF o imagen en cuanto lo consigas.', 'احفظ الشهادة PDF أو صورة فور حصولك عليها.']],
    },
    {
      id: 'perfil', icon: 'user', path: '#/cuenta', name: ['Mi perfil y cuenta', 'ملفي الشخصي وحسابي'],
      what: ['Tu página personal: usuario, contraseña (oculta), cuánto llevas del curso, nota media, certificados, y una valoración de cómo vas (principiante, intermedio, avanzado; y si necesitas más esfuerzo).', 'صفحتك الشخصية: اسم المستخدم وكلمة المرور (مخفية) ونسبة ما أنجزته ومتوسط الدرجات والشهادات وتقييم لحالتك (مبتدئ أو متوسط أو متقدم؛ وهل تحتاج جهداً أكثر).'],
      steps: [['Pulsa «Perfil» en la barra de abajo o «Mi perfil» en el menú.', 'اضغط «Perfil» في الشريط السفلي أو «Mi perfil» في القائمة.'], ['Lee «¿Cómo voy?»: te dice tu nivel, tu ritmo y cuántas semanas te faltan.', 'اقرأ «¿Cómo voy?»: يخبرك بمستواك ووتيرتك وكم أسبوعاً بقي.'], ['Pulsa «Cambiar contraseña» para cambiarla, o «Editar perfil» para el nombre y el avatar.', 'اضغط «Cambiar contraseña» لتغييرها أو «Editar perfil» للاسم والصورة الرمزية.']],
      has: [['Cuenta en línea opcional para guardar y recuperar tu progreso en otro dispositivo.', 'حساب إلكتروني اختياري لحفظ تقدمك واستعادته على جهاز آخر.']],
      limits: [['La plataforma no usa correo electrónico: se entra con usuario y contraseña. La contraseña no se puede mostrar por seguridad.', 'المنصة لا تستخدم البريد الإلكتروني: الدخول باسم المستخدم وكلمة المرور. ولا يمكن إظهار كلمة المرور لأسباب أمنية.'], ['El nombre de usuario no se puede cambiar una vez creado.', 'لا يمكن تغيير اسم المستخدم بعد إنشائه.'], ['La valoración es una estimación basada en tus notas y tu constancia.', 'التقييم تقدير مبني على درجاتك ومواظبتك.']],
      tips: [['Anota tu contraseña en un lugar seguro y haz copias de seguridad.', 'دوّن كلمة مرورك في مكان آمن وخذ نسخاً احتياطية.']],
    },
    {
      id: 'config', icon: 'gear', path: '#/configuracion', name: ['Configuración', 'الإعدادات'],
      what: ['Un panel de tarjetas; cada tarjeta abre su página: Perfil, Cuenta, Idiomas, Mi aprendizaje, Ejercicios, Audio, Apariencia, Datos, Instalar, Privacidad y esta guía.', 'لوحة بطاقات؛ كل بطاقة تفتح صفحتها: الملف الشخصي والحساب واللغات وتعلّمي والتمارين والصوت والمظهر والبيانات والتثبيت والخصوصية وهذا الدليل.'],
      steps: [['Pulsa el engranaje arriba, o «Configuración» en el menú.', 'اضغط الترس في الأعلى أو «Configuración» في القائمة.'], ['Elige una tarjeta (o usa el buscador de ajustes).', 'اختر بطاقة (أو استعمل بحث الإعدادات).'], ['Cambia lo que quieras: se guarda y se aplica al momento.', 'غيّر ما تريد: يُحفظ ويُطبَّق فوراً.'], ['Pulsa «Volver a Configuración» para regresar.', 'اضغط «Volver a Configuración» للرجوع.']],
      has: [['Idioma nativo e idiomas que dominas, editables siempre (no solo al principio).', 'اللغة الأم واللغات التي تتقنها، قابلة للتعديل دائماً (وليس في البداية فقط).'], ['Tema claro/oscuro, tamaño de letra, metas, voz, fotos, exportar e importar tus datos.', 'سمة فاتحة/داكنة وحجم الخط والأهداف والصوت والصور وتصدير بياناتك واستيرادها.']],
      limits: [['Algunos ajustes (como la voz) dependen de lo que ofrezca tu navegador o dispositivo.', 'بعض الإعدادات (مثل الصوت) تعتمد على ما يوفره متصفحك أو جهازك.']],
      tips: [['Elige tu idioma de ayuda en «Idiomas»: cambia el idioma de las explicaciones.', 'اختر لغة المساعدة في «Idiomas»: فهي تغيّر لغة الشروح.']],
    },
    {
      id: 'fotos', icon: 'palette', path: '#/configuracion/aprendizaje', name: ['Imágenes y fotos de las palabras', 'صور الكلمات'],
      what: ['Cada palabra nueva tiene una imagen. Se muestra una foto real de Wikipedia/Wikimedia cuando hay conexión; si no, una ilustración sencilla integrada.', 'لكل كلمة جديدة صورة. تُعرض صورة حقيقية من ويكيبيديا/ويكيميديا عند توفر الاتصال؛ وإلا تظهر رسمة بسيطة مدمجة.'],
      steps: [['Abre el vocabulario de una lección o un libro de palabras.', 'افتح مفردات درس أو كتاب كلمات.'], ['Espera un momento: la foto aparece sobre la ilustración.', 'انتظر لحظة: تظهر الصورة فوق الرسمة.'], ['Si la foto no corresponde a la palabra, usa el botón de informar para ocultarla.', 'إن لم تناسب الصورة الكلمة فاستعمل زر الإبلاغ لإخفائها.'], ['Para desactivar las fotos: Configuración › Mi aprendizaje › Fotos reales.', 'لإيقاف الصور: Configuración › Mi aprendizaje › Fotos reales.']],
      has: [['Se guardan en tu dispositivo para verlas otra vez sin internet.', 'تُحفظ على جهازك لرؤيتها مرة أخرى بدون إنترنت.'], ['Se indica la fuente de cada foto.', 'يُذكر مصدر كل صورة.']],
      limits: [['Las fotos vienen de un tercero: pueden tardar, y las palabras abstractas (verbos, adjetivos) a veces no tienen una foto exacta.', 'الصور من طرف ثالث: قد تتأخر، والكلمات المجردة (أفعال وصفات) لا تجد أحياناً صورة دقيقة.'], ['La primera vez sin internet solo verás la ilustración integrada, que usa símbolos sencillos.', 'في أول مرة بدون إنترنت سترى فقط الرسمة المدمجة وهي تستعمل رموزاً بسيطة.']],
      tips: [['Abre las lecciones una vez con internet y quedarán guardadas.', 'افتح الدروس مرة واحدة مع الإنترنت وستبقى محفوظة.']],
    },
    {
      id: 'instalar', icon: 'download', path: '#/instalar', name: ['Instalar, uso sin conexión y copias de seguridad', 'التثبيت والعمل بدون إنترنت والنسخ الاحتياطية'],
      what: ['Puedes instalar Languway Spanish como una aplicación en el móvil o el ordenador, usarla sin conexión y guardar o restaurar tus datos en un archivo.', 'يمكنك تثبيت Languway Spanish كتطبيق على الجوال أو الحاسوب واستعماله بدون اتصال وحفظ بياناتك أو استعادتها في ملف.'],
      steps: [['Abre «Instalar y compartir» y pulsa «Instalar la aplicación» (en iPhone: Compartir › Añadir a pantalla de inicio).', 'افتح «Instalar y compartir» واضغط «Instalar la aplicación» (في آيفون: مشاركة › إضافة إلى الشاشة الرئيسية).'], ['Para guardar tus datos: Configuración › Datos › Exportar.', 'لحفظ بياناتك: Configuración › Datos › Exportar.'], ['Para restaurarlos en otro dispositivo: Configuración › Datos › Importar.', 'لاستعادتها على جهاز آخر: Configuración › Datos › Importar.']],
      has: [['Código QR y enlace para compartir la app.', 'رمز QR ورابط لمشاركة التطبيق.']],
      limits: [['Sin conexión funcionan las lecciones, los libros y la práctica; no funcionan las fotos nuevas, la búsqueda en línea del traductor ni la cuenta en la nube.', 'بدون اتصال تعمل الدروس والكتب والتدريب؛ ولا تعمل الصور الجديدة ولا بحث المترجم عبر الإنترنت ولا الحساب السحابي.'], ['Tras una actualización puede hacer falta cerrar y abrir la aplicación para ver la versión nueva.', 'بعد التحديث قد تحتاج إلى إغلاق التطبيق وفتحه لترى النسخة الجديدة.']],
      tips: [['Haz una copia de seguridad cada dos semanas (la campana te lo recuerda).', 'خذ نسخة احتياطية كل أسبوعين (والجرس يذكّرك بذلك).']],
    },
    {
      id: 'buscar', icon: 'search', path: '#/buscar', name: ['Búsqueda y navegación', 'البحث والتنقل'],
      what: ['El buscador de arriba encuentra lecciones, reglas y palabras. En el móvil, la barra de abajo tiene Inicio, Progreso, Continuar (te lleva directo a tu próxima lección), Traductor y Perfil.', 'مربع البحث في الأعلى يجد الدروس والقواعد والكلمات. وعلى الجوال يحتوي الشريط السفلي على: الرئيسية، التقدم، متابعة (تأخذك مباشرة إلى درسك التالي)، المترجم، الملف الشخصي.'],
      steps: [['Escribe en el buscador y pulsa Enter.', 'اكتب في مربع البحث واضغط Enter.'], ['Elige un resultado para abrirlo.', 'اختر نتيجة لفتحها.'], ['Pulsa el botón de cuadrícula (arriba) para ver todo el menú: Estudiar, Herramientas y Cuenta.', 'اضغط زر الشبكة (في الأعلى) لترى القائمة كاملة: Estudiar وHerramientas وCuenta.']],
      has: [['Menú lateral fijo en ordenador y cajón en móvil.', 'قائمة جانبية ثابتة على الحاسوب ودرج على الجوال.']],
      limits: [['El buscador busca solo en el contenido de la aplicación, no en internet.', 'البحث يشمل محتوى التطبيق فقط وليس الإنترنت.']],
      tips: [['En el móvil, «Continuar» es el camino más rápido para seguir estudiando.', 'على الجوال «Continuar» أسرع طريق لمتابعة الدراسة.']],
    },
  ];

  const LABEL = {
    es: { what: 'Qué es', steps: 'Cómo se usa, paso a paso', has: 'Qué incluye', limits: 'Limitaciones y defectos', tips: 'Consejos', where: 'Dónde está', open: 'Abrir', search: 'Buscar una función…', none: 'No hay funciones que coincidan.', index: 'Índice de funciones', quick: 'Cómo empezar en 5 pasos', lang: 'Idioma de la guía' },
    ar: { what: 'ما هي', steps: 'طريقة الاستخدام خطوة بخطوة', has: 'ما تتضمنه', limits: 'القيود والعيوب', tips: 'نصائح', where: 'مكانها', open: 'فتح', search: 'ابحث عن ميزة…', none: 'لا توجد ميزات مطابقة.', index: 'فهرس الميزات', quick: 'كيف تبدأ في 5 خطوات', lang: 'لغة الدليل' },
  };
  const QUICK = [
    ['Crea tu cuenta o entra como invitado y haz la prueba de nivel (opcional).', 'أنشئ حسابك أو ادخل كضيف وأجرِ اختبار المستوى (اختياري).'],
    ['Pulsa «Continuar»: te lleva a tu próxima lección.', 'اضغط «Continuar»: يأخذك إلى درسك التالي.'],
    ['Haz los 7 pasos de la lección y aprueba el examen con 75 % o más.', 'نفّذ خطوات الدرس السبع وانجح في الامتحان بنسبة 75% أو أكثر.'],
    ['Abre el libro de palabras de la lección y escucha las palabras.', 'افتح كتاب كلمات الدرس واستمع إلى الكلمات.'],
    ['Cada día: repaso diario + reto del día. Mira «¿Cómo voy?» en tu perfil.', 'يومياً: المراجعة اليومية + تحدي اليوم. وانظر «¿Cómo voy?» في ملفك.'],
  ];

  function page() {
    let lang = L.sup && L.sup.lang() === 'ar' ? 1 : 0; // 0 = español, 1 = árabe
    const root = h('div', { class: 'feat' });
    const bar = h('div', { class: 'row feat-bar' });
    const find = h('input', { type: 'search', class: 'inp', 'aria-label': 'Buscar una función', maxlength: '40', autocomplete: 'off', 'data-noacc': '1' });
    const sw = h('div', { class: 'chips', role: 'group', 'aria-label': 'Idioma de la guía' });
    const body = h('div');
    const t = () => LABEL[lang ? 'ar' : 'es'];
    const dirAttrs = () => (lang ? { dir: 'rtl', lang: 'ar', 'data-nosup': '1' } : { lang: 'es', 'data-nosup': '1' });

    function draw() {
      const q = find.value.trim().toLowerCase();
      find.placeholder = t().search;
      body.replaceChildren();
      body.setAttribute('dir', lang ? 'rtl' : 'ltr');
      const list = F.filter((f) => !q || (f.name[0] + ' ' + f.name[1] + ' ' + f.what[0] + ' ' + f.what[1]).toLowerCase().includes(q));
      if (!q) {
        body.appendChild(h('section', Object.assign({ class: 'card glass feat-quick' }, dirAttrs()), h('h2', null, ico('rocket'), t().quick), h('ol', null, QUICK.map((s) => h('li', null, s[lang])))));
        body.appendChild(h('nav', Object.assign({ class: 'card glass feat-index', 'aria-label': t().index }, dirAttrs()), h('h2', null, ico('grid'), t().index),
          h('div', { class: 'chips' }, F.map((f) => h('button', { type: 'button', class: 'chip', onclick: () => { const el = document.getElementById('feat-' + f.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.focus({ preventScroll: true }); } } }, f.name[lang])))));
      }
      if (!list.length) body.appendChild(h('p', { class: 'muted' }, t().none));
      list.forEach((f, i) => body.appendChild(card(f, i)));
    }
    function sec(title, icon, arr, cls) {
      return h('section', { class: 'feat-sec ' + (cls || '') }, h('h4', null, ico(icon), title), h('ul', null, arr.map((x) => h('li', null, x[lang]))));
    }
    function card(f, i) {
      const c = h('article', Object.assign({ class: 'card glass feat-card', id: 'feat-' + f.id, tabindex: '-1' }, dirAttrs()),
        h('header', { class: 'feat-head' }, h('span', { class: 'feat-ic', 'aria-hidden': 'true' }, ico(f.icon)),
          h('div', { class: 'feat-tt' }, h('small', { class: 'muted' }, (i + 1) + ' / ' + F.length), h('h3', null, f.name[lang])),
          h('a', { class: 'btn btn-ghost btn-sm', href: f.path }, t().open)),
        h('section', { class: 'feat-sec' }, h('h4', null, ico('question'), t().what), h('p', null, f.what[lang])),
        h('section', { class: 'feat-sec' }, h('h4', null, ico('check'), t().steps), h('ol', null, f.steps.map((x) => h('li', null, x[lang])))),
        sec(t().has, 'star', f.has),
        sec(t().limits, 'alert', f.limits, 'warn'),
        sec(t().tips, 'bulb', f.tips));
      return c;
    }
    [['Español', 0], ['العربية', 1]].forEach(([n, v]) => {
      const b = h('button', { type: 'button', class: 'chip' + (v === lang ? ' on' : ''), 'aria-pressed': String(v === lang), lang: v ? 'ar' : 'es', 'data-nosup': '1', onclick: () => { lang = v; [...sw.children].forEach((x, k) => { x.classList.toggle('on', k === v); x.setAttribute('aria-pressed', String(k === v)); }); draw(); } }, n);
      sw.appendChild(b);
    });
    find.addEventListener('input', draw);
    bar.appendChild(find); bar.appendChild(sw);
    root.appendChild(bar); root.appendChild(body);
    draw();
    return root;
  }
  L.features = { page, list: F };
})(window.LWS);
