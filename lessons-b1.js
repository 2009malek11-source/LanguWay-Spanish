;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match, read } = L.Q;

  C.addLesson({
    id: 'b1.u5.l1', level: 'B1', unit: 5, n: 1, title: 'Pretérito pluscuamperfecto', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás hablar de acciones anteriores a otro momento del pasado con «había + participio».',
    vocab: [
      ['la tormenta', 'sustantivo', 'Lluvia fuerte con viento, rayos y truenos.', 'Cuando llegamos a la playa, la tormenta ya había pasado.', 'When we got to the beach, the storm had already passed.'],
      ['el vuelo', 'sustantivo', 'Viaje en avión de un lugar a otro.', 'Cuando llegué al aeropuerto, el vuelo ya había salido.', 'When I got to the airport, the flight had already left.'],
      ['la sorpresa', 'sustantivo', 'Cosa inesperada que nos produce emoción.', 'Mis amigos me habían preparado una sorpresa.', 'My friends had prepared a surprise for me.'],
      ['el apagón', 'sustantivo', 'Corte repentino de la electricidad en una zona.', 'Ya habíamos cenado cuando se produjo el apagón.', 'We had already had dinner when the blackout happened.'],
      ['la huelga', 'sustantivo', 'Parada del trabajo que hacen los empleados para protestar.', 'No pudimos viajar porque los pilotos habían convocado una huelga.', "We couldn't travel because the pilots had called a strike."],
      ['el recuerdo', 'sustantivo', 'Imagen o idea del pasado que conservamos en la memoria.', 'Tengo un recuerdo muy bonito de un viaje que habíamos hecho de niños.', 'I have a very fond memory of a trip we had taken as children.'],
      ['mudarse', 'verbo', 'Cambiar de casa o de ciudad para vivir en otro lugar.', 'Cuando me conociste, ya me había mudado a Sevilla.', 'When you met me, I had already moved to Seville.'],
      ['el equipaje', 'sustantivo', 'Conjunto de maletas y bolsas que llevamos de viaje.', 'En el aeropuerto descubrimos que la aerolínea había perdido nuestro equipaje.', 'At the airport we found out that the airline had lost our luggage.'],
    ],
    explain: {
      title: 'El pasado del pasado: había + participio',
      body: [
        'El <b>pretérito pluscuamperfecto</b> expresa una acción pasada que ocurrió <b>antes</b> de otro momento del pasado. Por eso lo llamamos «el pasado del pasado». Se forma con el verbo <b>haber en imperfecto</b> + el <b>participio</b>.',
        { t: 'table', head: ['Persona', 'Haber', 'Ejemplo'], rows: [['yo', 'había', 'había llegado'], ['tú', 'habías', 'habías comido'], ['él / ella / usted', 'había', 'había salido'], ['nosotros / nosotras', 'habíamos', 'habíamos visto'], ['vosotros / vosotras', 'habíais', 'habíais vuelto'], ['ellos / ellas / ustedes', 'habían', 'habían dicho']] },
        'El participio regular termina en <b>-ado</b> (verbos en -ar) o en <b>-ido</b> (verbos en -er / -ir). Algunos participios son irregulares y conviene memorizarlos:',
        { t: 'table', head: ['Infinitivo', 'Participio', 'Infinitivo', 'Participio'], rows: [['abrir', 'abierto', 'poner', 'puesto'], ['decir', 'dicho', 'romper', 'roto'], ['escribir', 'escrito', 'ver', 'visto'], ['hacer', 'hecho', 'volver', 'vuelto'], ['descubrir', 'descubierto', 'resolver', 'resuelto']] },
        'El participio del tiempo compuesto <b>no cambia</b> (no concuerda en género ni en número) y no se separa del auxiliar. Los pronombres van delante de «había»: <i>No lo había visto. Ya se habían ido.</i>',
        'Lo usamos casi siempre con otra acción pasada que sirve de referencia. Son muy frecuentes las estructuras <b>ya había... cuando...</b> y <b>todavía no había... cuando...</b>. También lo acompañan palabras como <i>antes, nunca, ya, todavía no</i>.',
        { t: 'table', head: ['Tiempo', 'Función', 'Ejemplo'], rows: [['Pretérito indefinido', 'Acción terminada, en orden de narración', 'Llegué y saludé a todos.'], ['Pretérito imperfecto', 'Descripción o situación de fondo', 'Llovía y hacía frío.'], ['Pretérito pluscuamperfecto', 'Acción anterior a otra acción pasada', 'Cuando llegué, ya habían empezado.']] },
        { t: 'ex', list: ['Cuando llegamos a la estación, el tren ya había salido.', 'No sabía nada porque nadie me lo había dicho.', 'Todavía no había amanecido cuando salimos de casa.', 'Nunca habíamos visto una tormenta tan fuerte.'] },
        { t: 'tip', text: 'Error frecuente: «Cuando llegué, ya salió». Si la salida ocurrió antes de mi llegada, decimos «ya había salido». No uses el pluscuamperfecto cuando las acciones son seguidas: «Cuando llegué, saludé a todos» (no «había saludado»).' },
      ],
    },
    listen: [
      'Cuando llegamos a la estación, el tren ya había salido.',
      'No sabía nada porque nadie me lo había dicho.',
      'Ya habíamos cenado cuando se fue la luz.',
      'Mi hermana todavía no había vuelto de la oficina.',
      '¿Habías estado alguna vez en Lima antes de aquel viaje?',
    ],
    practice: [
      fill('Cuando llegué a casa, mi madre ya ___ la cena. (preparar)', 'había preparado', 'La cena se preparó antes de mi llegada: usamos «había» (haber en imperfecto) + participio «preparado».', { tag: 'plusc-formacion' }),
      mc('Cuando sonó el despertador, yo ya ___.', 'me había levantado', ['me levanto', 'me levantaré', 'me estoy levantando'], 'Hablamos del pasado y la acción es anterior al sonido del despertador: «me había levantado».', { tag: 'plusc-uso' }),
      mc('¿Cuál es el participio correcto de «escribir»?', 'escrito', ['escribido', 'escrebido', 'escribado'], '«Escribir» tiene un participio irregular: «escrito». Otros: abierto, dicho, hecho, puesto, visto, vuelto.', { tag: 'plusc-participios' }),
      order('Nunca habíamos visto una tormenta tan fuerte', 'Estructura: nunca + había (haber) + participio. El participio «visto» es irregular.', { tag: 'plusc-formacion' }),
    ],
    quiz: [
      mc('Cuando llegué al cine, la película ya ___.', 'había empezado', ['ha empezado', 'empezará', 'habrá empezado'], 'La película empezó antes de mi llegada, y los dos hechos son pasados: «había empezado».', { tag: 'plusc-uso' }),
      fill('Todavía no habíamos ___ la caja cuando nos dimos cuenta del error. (abrir)', 'abierto', 'El participio de «abrir» es irregular: «abierto».', { tag: 'plusc-participios' }),
      listen('Ya habíamos cenado cuando se fue la luz.', 'Escucha: ¿qué ocurrió primero?', 'Cenaron', ['Se fue la luz', 'Se acostaron'], 'Con «ya habíamos cenado cuando...» la cena es la acción anterior.', { tag: 'plusc-uso' }),
      dict('Cuando abrí la puerta, mis amigos ya habían preparado la sorpresa.', 'Practica «habían preparado»: haber en imperfecto + participio regular en -ado.', { tag: 'plusc-formacion' }),
      match([['hacer', 'hecho'], ['ver', 'visto'], ['poner', 'puesto'], ['volver', 'vuelto']], 'Son participios irregulares que debes memorizar.', { tag: 'plusc-participios' }),
      order('Ya habíamos recogido el equipaje cuando empezó la tormenta', 'La acción anterior («habíamos recogido») va en pluscuamperfecto; la segunda («empezó») en indefinido.', { tag: 'plusc-uso' }),
    ],
  });

  C.addLesson({
    id: 'b1.u5.l2', level: 'B1', unit: 5, n: 2, title: 'Por y para', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás elegir entre «por» y «para» según la causa, el medio, la finalidad, el destinatario o el plazo.',
    vocab: [
      ['el esfuerzo', 'sustantivo', 'Energía y trabajo que ponemos para conseguir algo difícil.', 'Lo consiguió por su esfuerzo constante.', 'He achieved it through his constant effort.'],
      ['la beca', 'sustantivo', 'Ayuda económica que recibe un estudiante para estudiar.', 'Pedí una beca para estudiar en el extranjero.', 'I applied for a scholarship to study abroad.'],
      ['el regalo', 'sustantivo', 'Cosa que damos a otra persona sin pedir dinero a cambio.', 'Compré este regalo para mi hermana.', 'I bought this gift for my sister.'],
      ['la factura', 'sustantivo', 'Documento que indica lo que debes pagar por un producto o un servicio.', 'Pagué la factura de la luz por internet.', 'I paid the electricity bill online.'],
      ['ahorrar', 'verbo', 'Guardar dinero para usarlo más tarde.', 'Estoy ahorrando para comprarme una bicicleta.', 'I am saving up to buy myself a bicycle.'],
      ['el premio', 'sustantivo', 'Cosa que se entrega a alguien por un buen resultado o un buen trabajo.', 'Recibió un premio por su proyecto de ciencias.', 'He received a prize for his science project.'],
      ['la entrada', 'sustantivo', 'Billete que necesitas para entrar a un cine, a un museo o a un concierto.', 'Pagué veinte euros por la entrada.', 'I paid twenty euros for the ticket.'],
      ['la fecha límite', 'expresión', 'Último día en que se puede hacer o entregar algo.', 'Mi fecha límite es el viernes, así que tengo que terminar el trabajo para entonces.', 'My deadline is Friday, so I have to finish the work by then.'],
    ],
    explain: {
      title: 'Por y para: dos preposiciones, dos ideas',
      body: [
        'En inglés, «por» y «para» suelen traducirse como <i>for</i>, pero en español expresan ideas distintas. Para elegir bien, piensa en la <b>idea</b>, no en la traducción. En general, <b>por</b> mira hacia <b>atrás</b> (causa, origen, medio) y <b>para</b> mira hacia <b>adelante</b> (meta, destino, finalidad).',
        { t: 'table', head: ['Usos de POR', 'Ejemplo'], rows: [['Causa o motivo', 'Lo consiguió por su esfuerzo.'], ['Medio o vía', 'El paquete llegó por correo.'], ['Duración', 'Viví en Lima por dos años.'], ['Intercambio o precio', 'Pagué veinte euros por la entrada.'], ['Lugar a través del cual', 'Paseamos por el parque.'], ['Parte del día', 'Estudio por la mañana.'], ['Agente de la voz pasiva', 'La novela fue escrita por un autor chileno.']] },
        { t: 'table', head: ['Usos de PARA', 'Ejemplo'], rows: [['Finalidad (para + infinitivo)', 'Ahorro para comprar una bicicleta.'], ['Destinatario', 'Este regalo es para mi hermana.'], ['Destino o dirección', 'Mañana salgo para Madrid.'], ['Plazo o fecha límite', 'Necesito el trabajo para el viernes.'], ['Opinión', 'Para mí, esa es la mejor solución.'], ['Comparación con lo esperado', 'Para su edad, corre muy rápido.']] },
        'Compara pares de frases casi iguales. Un pequeño cambio de preposición cambia el significado:',
        { t: 'table', head: ['POR', 'PARA'], rows: [['Trabajo por necesidad. (causa)', 'Trabajo para vivir. (finalidad)'], ['Salgo por la puerta. (a través de)', 'Salgo para Madrid. (destino)'], ['Lo necesito por la tarde. (durante la tarde)', 'Lo necesito para la tarde. (plazo)'], ['Lo compré por diez euros. (precio)', 'Lo compré para ti. (destinatario)']] },
        { t: 'ex', list: ['Gracias por tu ayuda.', 'Estudio español para trabajar en Perú.', 'Recibió un premio por su proyecto.', 'El cartero trae un paquete para ti.'] },
        { t: 'tip', text: 'Truco: ¿«por qué» (causa)? Usa por. ¿«para qué» (finalidad)? Usa para. Errores frecuentes: «Gracias para tu ayuda» (correcto: «gracias por tu ayuda») y «Pagué cien euros para el abrigo» (correcto: «por el abrigo»). Aprende también expresiones fijas: por favor, por ejemplo, por fin, por eso.' },
      ],
    },
    listen: [
      'Pedí una beca para estudiar en el extranjero.',
      'Muchas gracias por el regalo.',
      'Este paquete es para tu hermana.',
      'Viajamos por el sur del país durante dos semanas.',
      'Necesito terminar este trabajo para el lunes.',
    ],
    practice: [
      fill('Muchas gracias ___ tu ayuda.', 'por', 'Damos las gracias por una causa o un motivo: «gracias por».', { tag: 'por-causa' }),
      fill('Pagué cuarenta euros ___ esta mochila.', 'por', 'Con precio o intercambio usamos «por».', { tag: 'por-intercambio' }),
      mc('Tengo que entregar el trabajo ___ el viernes.', 'para', ['por', 'de', 'desde'], 'Para indicar un plazo o fecha límite usamos «para».', { tag: 'para-plazo' }),
      order('Estudio español para viajar por Sudamérica', '«Para» + infinitivo expresa la finalidad; «por» indica el lugar a través del cual viajamos.', { tag: 'por-para-contraste' }),
    ],
    quiz: [
      mc('¿Qué frase es correcta?', 'Me quedé en casa por la lluvia.', ['Me quedé en casa para la lluvia.', 'Muchas gracias para el regalo.', 'Pagué mucho dinero para este abrigo.'], 'La lluvia es la causa: «por». Con «gracias» y con el precio también se usa «por».', { tag: 'por-causa' }),
      fill('Viví en Lima ___ dos años. (por / para)', 'por', 'Para expresar duración de un periodo usamos «por» (o «durante»).', { tag: 'por-duracion' }),
      listen('El paquete llegó por correo urgente, pero era para mi hermana.', 'Escucha: ¿para quién era el paquete?', 'Para la hermana de quien habla', ['Para el cartero', 'Para la madre de quien habla'], '«Era para mi hermana»: «para» indica el destinatario. «Por correo urgente» es el medio.', { tag: 'para-destinatario' }),
      dict('Ayer recibí un premio por mi esfuerzo y un regalo para mi madre.', 'Observa: «por mi esfuerzo» (causa) y «para mi madre» (destinatario).', { tag: 'por-para-contraste' }),
      match([['Lo compré por diez euros.', 'Intercambio o precio'], ['Estudio para ser médico.', 'Finalidad'], ['Viajamos por el norte.', 'Lugar a través del cual'], ['Es un libro para ti.', 'Destinatario']], 'Cada preposición tiene un valor claro según el contexto.', { tag: 'por-para-contraste' }),
      order('Este paquete es para ti y llegó por correo', '«Para ti» expresa el destinatario y «por correo» el medio.', { tag: 'por-medio' }),
    ],
  });

  C.addLesson({
    id: 'b1.u5.l3', level: 'B1', unit: 5, n: 3, title: 'Oraciones de relativo', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás unir ideas con «que», «quien», «donde», «el que», «lo que» y «cuyo» en indicativo.',
    vocab: [
      ['el ingrediente', 'sustantivo', 'Cada uno de los alimentos que forman parte de una comida.', 'El ingrediente que más me gusta es el queso.', 'The ingredient I like most is cheese.'],
      ['el barrio', 'sustantivo', 'Cada una de las zonas en que se divide una ciudad.', 'El barrio donde vivo es tranquilo y tiene muchas tiendas.', 'The neighborhood where I live is quiet and has many shops.'],
      ['el autor', 'sustantivo', 'Persona que escribe un libro u otra obra. La mujer es «la autora».', 'El autor del que te hablé acaba de publicar un libro nuevo.', 'The author I told you about has just published a new book.'],
      ['la novela', 'sustantivo', 'Libro largo que cuenta una historia inventada.', 'La novela que estoy leyendo es muy emocionante.', 'The novel I am reading is very exciting.'],
      ['la herramienta', 'sustantivo', 'Objeto que usamos para hacer un trabajo manual, como el martillo.', 'Necesito la herramienta con la que se arregla esta silla.', 'I need the tool you use to fix this chair.'],
      ['la costumbre', 'sustantivo', 'Cosa que hacemos de manera habitual.', 'Una costumbre que me gusta es desayunar con mi familia.', 'A habit I like is having breakfast with my family.'],
      ['el informe', 'sustantivo', 'Documento que explica datos o resultados de un trabajo.', 'El informe que me enviaste tiene dos errores.', 'The report you sent me has two mistakes.'],
      ['el mercado', 'sustantivo', 'Lugar donde se venden frutas, verduras y otros productos.', 'El mercado al que voy los sábados abre a las siete.', 'The market I go to on Saturdays opens at seven.'],
    ],
    explain: {
      title: 'Oraciones de relativo: que, quien, donde, el que, lo que, cuyo',
      body: [
        'Una <b>oración de relativo</b> da información sobre un sustantivo (el <b>antecedente</b>) y lo une con otra idea. En español <b>no se puede omitir</b> el relativo: <i>The book I read</i> se dice «El libro <b>que</b> leí». En esta lección usamos el <b>indicativo</b>, porque hablamos de personas, cosas o lugares reales y conocidos.',
        { t: 'table', head: ['Relativo', 'Se refiere a', 'Ejemplo'], rows: [['que', 'Personas o cosas (el más frecuente)', 'La novela que leí es larga.'], ['quien / quienes', 'Solo personas', 'Mi tía, quien vive en Quito, me llamó.'], ['donde', 'Lugares', 'El barrio donde vivo es tranquilo.'], ['el / la / los / las que', 'Personas o cosas, con preposición', 'La herramienta con la que trabajo es nueva.'], ['lo que', 'Una idea general, sin antecedente', 'No entiendo lo que dice.'], ['cuyo / cuya / cuyos / cuyas', 'Posesión', 'El autor cuya novela leí es chileno.']] },
        'Con una <b>preposición</b> (a, con, de, en, para...), usamos el artículo + <b>que</b>, y el artículo concuerda con el antecedente. Con personas también podemos usar <b>quien</b>.',
        { t: 'ex', list: ['El mercado al que voy abre a las siete.', 'La herramienta con la que arreglo la silla es nueva.', 'El autor del que te hablé publicó otro libro.', 'La chica con quien trabajo es argentina.'] },
        '<b>Donde</b> equivale a «en el que / en la que». Las oraciones <b>explicativas</b>, entre comas, añaden información extra: «Mi vecino, <b>que</b> es médico, me ayudó». <b>Lo que</b> se refiere a una idea o a una cosa sin nombre: «Lo que más me gusta es caminar».',
        '<b>Cuyo</b> expresa posesión y concuerda con lo poseído, no con el poseedor: «el señor <b>cuya</b> casa visitamos» (casa es femenino). Es más frecuente en textos escritos.',
        { t: 'tip', text: 'Errores frecuentes: «La persona que hablé» (correcto: «la persona de la que / de quien hablé»); «El hombre que su coche es rojo» (correcto: «el hombre cuyo coche es rojo»). Y no confundas «que» (relativo, sin tilde) con «qué» (interrogativo o exclamativo, con tilde).' },
      ],
    },
    listen: [
      'La novela que estoy leyendo es muy emocionante.',
      'El barrio donde vivo tiene un mercado muy grande.',
      'Esa es la chica con quien trabajo.',
      'No entiendo lo que dice el informe.',
      'Mi vecino, cuyo hijo estudia medicina, es muy amable.',
    ],
    practice: [
      mc('La película ___ vimos ayer fue muy divertida.', 'que', ['quien', 'donde', 'cuyo'], 'El antecedente es una cosa («la película») y funciona como complemento directo: usamos «que».', { tag: 'relativo-que' }),
      fill('La ciudad ___ nací se llama Cartagena.', ['donde', 'en la que'], 'Para lugares usamos «donde» o «en la que»: «la ciudad en la que nací».', { tag: 'relativo-donde' }),
      mc('No creo ___ me dijo el vendedor.', 'lo que', ['el que', 'quien', 'cuyo'], 'No hay un sustantivo antecedente: la idea es general («aquello que»). Por eso usamos «lo que».', { tag: 'relativo-lo-que' }),
      order('El libro del que te hablé está en mi mochila', 'Con «hablar de» usamos preposición + artículo + que: «del que» (de + el que).', { tag: 'relativo-preposicion' }),
    ],
    quiz: [
      mc('¿Qué frase es correcta?', 'La persona con la que hablé es mi jefa.', ['La persona que hablé con es mi jefa.', 'La persona que hablé es mi jefa.', 'La persona donde hablé es mi jefa.'], 'El verbo «hablar» pide la preposición «con»; esta debe ir antes del relativo: «con la que». «Donde» solo se usa para lugares.', { tag: 'relativo-preposicion' }),
      fill('El señor ___ hijo es médico vive aquí.', 'cuyo', 'Expresa posesión y concuerda con el sustantivo poseído («hijo», masculino singular): «cuyo».', { tag: 'relativo-cuyo' }),
      listen('El mercado al que voy los sábados abre a las siete.', 'Escucha: ¿qué día va la persona al mercado?', 'Los sábados', ['Los domingos', 'Los viernes'], 'La frase dice «al que voy los sábados».', { tag: 'relativo-preposicion' }),
      dict('La costumbre que más me gusta es leer una novela cada noche.', 'Practica «la costumbre que...», relativo con antecedente de cosa.', { tag: 'relativo-que' }),
      match([['que', 'Se refiere a personas o cosas.'], ['donde', 'Se refiere a un lugar.'], ['lo que', 'Se refiere a una idea general, sin antecedente.'], ['cuyo', 'Indica posesión y concuerda con lo poseído.']], 'Repasa el uso de cada relativo.', { tag: 'relativo-tipos' }),
      order('Me encanta el barrio donde vivimos desde hace años', '«Donde» se refiere al lugar («el barrio») y equivale a «en el que».', { tag: 'relativo-donde' }),
    ],
  });
})(window.LWS);
