;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match, read } = L.Q;

  C.addLesson({
    id: 'c1.u5.l1', level: 'C1', unit: 5, n: 1, title: 'Subjuntivo avanzado y matices', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás elegir entre indicativo y subjuntivo en oraciones concesivas, finales, temporales y condicionales para expresar matices precisos.',
    vocab: [
      ['por más que', 'locución conjuntiva', 'Introduce una dificultad que no impide la acción principal; equivale a «aunque», con más intensidad.', 'Por más que lo intente, no logrará convencerlos.', 'However hard he tries, he will not manage to convince them.'],
      ['a fin de que', 'locución conjuntiva', 'Introduce la finalidad de una acción; significa «para que» y se usa en un registro formal.', 'Se publicó el informe a fin de que todos conocieran los datos.', 'The report was published so that everyone would know the data.'],
      ['comoquiera que', 'locución conjuntiva', 'Significa «de cualquier manera que»; con indicativo, equivale a «dado que».', 'Comoquiera que lo plantees, el problema sigue sin resolverse.', 'However you put it, the problem remains unsolved.'],
      ['sea como sea', 'locución adverbial', 'Expresión que significa «de todos modos», sin importar las circunstancias.', 'Sea como sea, hay que entregar el proyecto el viernes.', 'One way or another, the project must be handed in on Friday.'],
      ['con tal de que', 'locución conjuntiva', 'Introduce una condición mínima que debe cumplirse; significa «si al menos».', 'Acepto el cambio con tal de que me avisen con antelación.', 'I accept the change provided that they give me advance notice.'],
      ['a pesar de que', 'locución conjuntiva', 'Introduce un obstáculo que no impide que ocurra la acción principal.', 'A pesar de que nadie lo esperaba, el proyecto tuvo un gran éxito.', 'Even though nobody expected it, the project was a great success.'],
      ['siempre y cuando', 'locución conjuntiva', 'Introduce una condición necesaria y exige subjuntivo.', 'Podéis usar la sala siempre y cuando la dejéis ordenada.', 'You may use the room as long as you leave it tidy.'],
      ['a menos que', 'locución conjuntiva', 'Introduce la única excepción posible; significa «salvo que».', 'La reunión se celebrará mañana a menos que surja algún imprevisto.', 'The meeting will take place tomorrow unless something unforeseen comes up.'],
    ],
    explain: {
      title: 'Indicativo o subjuntivo: la elección depende del matiz',
      body: [
        'En el nivel avanzado, el modo verbal no es solo una cuestión de gramática: es una decisión <b>comunicativa</b>. El hablante elige entre indicativo y subjuntivo según presente la información como <b>real y conocida</b> o como <b>hipotética, futura o irrelevante</b>.',
        '<b>1. Oraciones concesivas.</b> Expresan un obstáculo que no impide la acción principal.',
        { t: 'table', head: ['Nexo', 'Con indicativo', 'Con subjuntivo'], rows: [
          ['aunque', 'Hecho real o información nueva: Aunque llueve, salgo.', 'Hipótesis o dato irrelevante: Aunque llueva, saldré.'],
          ['a pesar de que', 'Hecho real: A pesar de que hace frío, salimos.', 'Obstáculo hipotético o sin importancia: A pesar de que haga frío, saldremos.'],
          ['por más que / por mucho que', 'Hecho real y habitual: Por más que estudia, suspende.', 'Obstáculo hipotético o futuro: Por más que insistas, no cambiaré de opinión.'],
        ] },
        '<b>2. Finales, temporales y condicionales restrictivas.</b> Aquí la elección es más clara.',
        { t: 'table', head: ['Tipo', 'Nexos', 'Modo', 'Ejemplo'], rows: [
          ['Finales', 'para que, a fin de que', 'Siempre subjuntivo', 'Te escribo a fin de que lo sepas.'],
          ['Anterioridad', 'antes de que', 'Siempre subjuntivo', 'Llámame antes de que salgas.'],
          ['Temporales de futuro', 'cuando, en cuanto, hasta que, después de que', 'Subjuntivo si hablamos del futuro', 'Cuando llegues, hablaremos.'],
          ['Condición restrictiva', 'con tal de que, siempre y cuando, a menos que', 'Siempre subjuntivo', 'Iré a menos que surja algo urgente.'],
        ] },
        'Si la acción temporal es <b>habitual</b> o <b>pasada</b>, usamos indicativo: «Cuando llega, saluda a todos», «Cuando llegó, saludó a todos».',
        '<b>3. «Sea como sea» y «comoquiera que».</b> «Sea como sea» es una expresión fija que significa «de todos modos». «Comoquiera que» tiene dos usos: con subjuntivo significa «de cualquier manera que» (Comoquiera que lo hagas, hazlo con cuidado) y con indicativo equivale a «dado que» (Comoquiera que no hay acuerdo, se aplazará la votación).',
        { t: 'ex', list: ['Aunque haga mal tiempo, la excursión se celebrará.', 'A pesar de que lo sabía, no dijo nada.', 'No firmaré nada antes de que lo revise el abogado.', 'Cuando termines el informe, envíamelo.', 'Sea como sea, terminaremos a tiempo.'] },
        { t: 'tip', text: 'Errores frecuentes: «antes de que + indicativo» y «cuando + futuro» son incorrectos. Se dice «antes de que llegues» (no «antes de que llegas») y «cuando llegues» o «cuando llegue» (no «cuando llegarás»). El futuro se expresa con el presente de subjuntivo.' },
      ],
    },
    listen: ['Aunque llueva mañana, la excursión se celebrará.', 'Cuando llegues a la oficina, avísame.', 'Te lo explico a fin de que no queden dudas.', 'Sea como sea, terminaremos antes del viernes.', 'No firmaré nada antes de que lo revise el abogado.'],
    practice: [
      mc('Por más que ellos ___, no cambiaré de opinión. (insistir)', 'insistan', ['insistirán', 'insistieran', 'insistirían'], 'Con «por más que» ante un obstáculo hipotético o futuro usamos presente de subjuntivo: «insistan».', { tag: 'concesivas' }),
      fill('Cuando ___ el informe, envíamelo. (terminar, tú)', 'termines', 'En una temporal que se refiere al futuro, usamos presente de subjuntivo, no futuro: «cuando termines».', { tag: 'temporales-futuro' }),
      order('Habla despacio para que todos te entiendan', 'Las finales con «para que» exigen subjuntivo: «entiendan».', { tag: 'finales' }),
      mc('¿Qué frase es correcta?', 'Avísame antes de que salgas.', ['Avísame antes de que sales.', 'Avísame antes de que saldrás.', 'Avísame antes que saldrás.'], '«Antes de que» va siempre con subjuntivo.', { tag: 'temporales-futuro' }),
    ],
    quiz: [
      mc('Todavía no sabemos si lloverá. ¿Qué frase es la más natural?', 'Aunque llueva, iremos al campo.', ['Aunque lloverá, iremos al campo.', 'Aunque llovería, iremos al campo.', 'Aunque lloverás, iremos al campo.'], 'Ante una hipótesis futura usamos «aunque + presente de subjuntivo». Nunca se usa el futuro tras «aunque» en este caso.', { tag: 'concesivas' }),
      fill('Hablaré con ellos antes de que ___ la decisión. (tomar, ellos)', 'tomen', '«Antes de que» exige subjuntivo: «tomen».', { tag: 'antes-de-que' }),
      listen('Te lo explico a fin de que no queden dudas.', 'Escucha: ¿para qué se da la explicación?', 'Para que no queden dudas', ['Para que haya más dudas', 'Porque ya no quedan dudas'], '«A fin de que» expresa finalidad, igual que «para que»: el objetivo es que no queden dudas.', { tag: 'finales' }),
      dict('A menos que surja algún imprevisto, saldremos el lunes.', 'Practica «a menos que», que va siempre con subjuntivo: «surja».', { tag: 'condicion-restrictiva' }),
      match([['a fin de que', 'Para que (finalidad)'], ['a menos que', 'Salvo que (excepción)'], ['sea como sea', 'De todos modos'], ['con tal de que', 'Si al menos (condición mínima)']], 'Repasa el valor de cada nexo.', { tag: 'nexos-subjuntivo' }),
      order('Saldremos mañana siempre y cuando no llueva', '«Siempre y cuando» expresa una condición necesaria y exige subjuntivo: «llueva».', { tag: 'condicion-restrictiva' }),
    ],
  });

  C.addLesson({
    id: 'c1.u5.l2', level: 'C1', unit: 5, n: 2, title: 'Oraciones enfáticas y orden de las palabras', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás destacar información con oraciones hendidas, anteposición, dislocación e inversión del orden habitual de las palabras.',
    vocab: [
      ['recalcar', 'verbo', 'Decir algo con fuerza para que se note bien.', 'La directora recalcó que el plazo no se ampliará.', 'The director stressed that the deadline will not be extended.'],
      ['anteponer', 'verbo', 'Poner una palabra o una idea delante de otra.', 'En esta frase se antepone el complemento al verbo.', 'In this sentence the complement is placed before the verb.'],
      ['el énfasis', 'sustantivo', 'Fuerza especial con que se dice o se destaca algo.', 'Habló con énfasis de la importancia de la educación.', 'He spoke emphatically about the importance of education.'],
      ['la oración hendida', 'sustantivo', 'Construcción con el verbo «ser» que destaca una parte de la frase.', 'La oración hendida «Fue Ana quien llamó» destaca el sujeto.', 'The cleft sentence "It was Ana who called" highlights the subject.'],
      ['la dislocación', 'sustantivo', 'Colocación de un elemento al principio o al final de la frase, repetido con un pronombre.', 'En «Las llaves las dejé aquí» hay una dislocación a la izquierda.', 'In "Las llaves las dejé aquí" (I left the keys here) there is a left dislocation.'],
      ['el hipérbaton', 'sustantivo', 'Alteración del orden habitual de las palabras de una frase.', 'El hipérbaton es frecuente en la prosa literaria.', 'Hyperbaton is frequent in literary prose.'],
      ['la inversión', 'sustantivo', 'Cambio de posición entre el sujeto y el verbo.', 'La inversión del sujeto da un tono más literario a la frase.', 'Inverting the subject gives the sentence a more literary tone.'],
      ['el realce', 'sustantivo', 'Importancia especial que se da a algo para que destaque.', 'La entonación da realce a la palabra más importante.', 'Intonation gives prominence to the most important word.'],
    ],
    explain: {
      title: 'Cómo destacar la información en español',
      body: [
        'El orden básico en español es flexible: <b>sujeto + verbo + complementos</b>, pero podemos alterarlo para dar <b>énfasis</b> a una parte de la frase. Cada estructura tiene su función y su registro.',
        { t: 'table', head: ['Estructura', 'Esquema', 'Ejemplo'], rows: [
          ['Oración hendida', 'Ser + elemento + que / quien / donde / cuando', 'Fue ayer cuando lo supe.'],
          ['Oración pseudohendida', 'Lo que + verbo + ser + elemento', 'Lo que más me sorprendió fue su calma.'],
          ['Anteposición con foco', 'Elemento destacado + verbo (sin pronombre)', 'Mucho cuidado hay que tener con las cifras.'],
          ['Dislocación', 'Tema + pronombre (lo, la, los, las, le...) + verbo', 'El informe lo redactó Marta.'],
          ['Adverbio negativo inicial', 'Jamás / Nunca / Apenas + verbo', 'Jamás había oído algo así.'],
        ] },
        '<b>Oraciones hendidas.</b> El verbo «ser» destaca un elemento. Los relativos «quien», «donde» y «cuando» concuerdan con el sentido del elemento destacado: «Fue en esta sala donde se decidió todo», «Fueron los vecinos quienes dieron la alarma».',
        '<b>Pseudohendidas.</b> Presentan primero el tema con «lo que» y después destacan la información nueva: «Lo que necesitamos es tiempo». También existen con «quien»: «Quien lo dijo fue el director».',
        '<b>Dislocación.</b> Cuando el complemento directo es un tema que ya conocemos y lo ponemos al principio, es obligatorio repetirlo con un pronombre: «Las conclusiones las presentará la doctora». Con complemento indirecto también se repite: «A los alumnos les entregaré las notas».',
        { t: 'ex', list: ['Fue en marzo cuando se aprobó la reforma.', 'Lo que más valoro es la sinceridad.', 'Al director lo conocí en una conferencia.', 'Nunca había visto yo tanta gente reunida.', 'Apenas había salido cuando empezó a llover.'] },
        'La <b>inversión</b> y el <b>hipérbaton</b> son recursos más propios de la lengua escrita o literaria: «Tarde llegó la respuesta». En el habla, el realce se consigue sobre todo con la <b>entonación</b>.',
        { t: 'tip', text: 'Cuidado: con anteposición de foco contrastivo no se repite el pronombre («LAS LLAVES perdí, no la cartera»), pero con dislocación temática sí («Las llaves las perdí»). Otro error frecuente es perder la concordancia en las hendidas: «Fueron los vecinos quienes avisaron», no «Fue los vecinos quien avisó».' },
      ],
    },
    listen: ['Fue en marzo cuando se aprobó la reforma.', 'Lo que más me preocupa es la falta de tiempo.', 'El informe lo redactó la directora.', 'Jamás había visto una cosa semejante.', 'Fueron los vecinos quienes dieron la alarma.'],
    practice: [
      mc('Quieres destacar el momento de esta información: «Se firmó el acuerdo en abril». ¿Cuál es la oración hendida?', 'Fue en abril cuando se firmó el acuerdo.', ['En abril se firmó el acuerdo.', 'Se firmó el acuerdo en abril.', 'Cuando se firmó fue el acuerdo en abril.'], 'La oración hendida usa «ser + elemento destacado + cuando / donde / quien / que».', { tag: 'hendidas' }),
      fill('Lo que más me gusta de este trabajo ___ la autonomía.', 'es', 'En las pseudohendidas, «lo que...» va seguido de «ser» y del elemento destacado.', { tag: 'pseudohendidas' }),
      order('Al director lo conocí en una conferencia', 'Con un complemento directo antepuesto como tema, repetimos con el pronombre «lo».', { tag: 'dislocacion' }),
      mc('Completa: «Las conclusiones ___ presentará la doctora el lunes».', 'las', ['les', 'los', 'le'], 'El complemento directo antepuesto «las conclusiones» se repite con el pronombre femenino plural «las».', { tag: 'dislocacion' }),
    ],
    quiz: [
      mc('¿Cuál de estas frases es una oración hendida?', 'Fue Ana quien resolvió el problema.', ['Ana resolvió el problema ayer.', 'El problema lo resolvió Ana.', 'Resolvió el problema Ana.'], 'La oración hendida usa «ser» para destacar un elemento y lo une con un relativo: «Fue Ana quien...».', { tag: 'hendidas' }),
      fill('Lo ___ más valoro de ti es la honestidad.', 'que', 'La pseudohendida se forma con «lo que + verbo + ser + elemento».', { tag: 'pseudohendidas' }),
      listen('Fue en marzo cuando se aprobó la reforma.', 'Escucha: ¿qué información se destaca?', 'El momento: en marzo', ['El lugar donde se aprobó', 'La persona que aprobó la ley'], 'La estructura «fue... cuando» destaca la información temporal.', { tag: 'hendidas' }),
      dict('Lo que más me preocupa es la falta de tiempo.', 'Practica la pseudohendida: «lo que... es...».', { tag: 'pseudohendidas' }),
      match([['Fue ayer cuando lo supe.', 'Oración hendida'], ['El informe lo redactó Marta.', 'Dislocación con pronombre'], ['Lo que necesito es calma.', 'Oración pseudohendida'], ['Jamás había oído algo así.', 'Adverbio negativo al inicio']], 'Identifica cada recurso de énfasis.', { tag: 'estructuras-enfaticas' }),
      order('Lo que más valoro es la sinceridad', 'En la pseudohendida, «lo que» introduce el tema y «es» destaca el elemento.', { tag: 'pseudohendidas' }),
    ],
  });

  C.addLesson({
    id: 'c1.u5.l3', level: 'C1', unit: 5, n: 3, title: 'Vocabulario abstracto: política, economía y ciencia', topic: 'Vocabulario',
    goal: 'Al terminar esta lección, podrás usar con precisión léxico abstracto de política, economía y ciencia, con sus colocaciones y su registro.',
    vocab: [
      ['el escaño', 'sustantivo', 'Puesto que ocupa un parlamentario en un parlamento.', 'El partido obtuvo treinta escaños en las últimas elecciones.', 'The party won thirty seats in the latest elections.'],
      ['el sufragio', 'sustantivo', 'Derecho y acto de votar para elegir a los representantes.', 'El sufragio universal se reconoció en muchos países durante el siglo XX.', 'Universal suffrage was recognized in many countries during the twentieth century.'],
      ['el mandato', 'sustantivo', 'Periodo durante el cual una persona ejerce un cargo público.', 'El presidente cumple su segundo mandato.', 'The president is serving his second term.'],
      ['la recaudación', 'sustantivo', 'Cantidad de dinero que el Estado cobra en impuestos.', 'La recaudación fiscal aumentó un cinco por ciento.', 'Tax revenue rose by five percent.'],
      ['el déficit', 'sustantivo', 'Cantidad en que los gastos superan a los ingresos.', 'El Gobierno prometió reducir el déficit público.', 'The government promised to reduce the public deficit.'],
      ['la inflación', 'sustantivo', 'Subida general y sostenida de los precios.', 'La inflación erosiona el poder adquisitivo de los salarios.', 'Inflation erodes the purchasing power of wages.'],
      ['la variable', 'sustantivo', 'Factor que puede cambiar en un experimento o en un estudio.', 'En el experimento solo se modificó una variable.', 'In the experiment only one variable was changed.'],
      ['refutar', 'verbo', 'Demostrar que una teoría o un argumento es falso.', 'Los nuevos datos refutan la hipótesis inicial.', 'The new data refute the initial hypothesis.'],
    ],
    explain: {
      title: 'Léxico abstracto: precisión, colocaciones y registro',
      body: [
        'En el nivel C1 no basta con conocer la palabra: hay que saber con qué otras palabras se combina (sus <b>colocaciones</b>) y en qué <b>registro</b> se usa. Estas son las combinaciones más habituales en tres ámbitos.',
        { t: 'table', head: ['Ámbito', 'Palabra', 'Colocaciones frecuentes'], rows: [
          ['Política', 'el escaño', 'obtener / perder un escaño; repartir los escaños'],
          ['Política', 'el sufragio', 'ejercer el derecho al sufragio; sufragio universal'],
          ['Política', 'el mandato', 'cumplir / agotar un mandato; renovar el mandato'],
          ['Economía', 'la recaudación', 'recaudación fiscal; aumentar / caer la recaudación'],
          ['Economía', 'el déficit', 'reducir / contener el déficit público'],
          ['Economía', 'la inflación', 'la inflación se dispara / se modera; controlar la inflación'],
          ['Ciencia', 'la variable', 'controlar / medir una variable'],
          ['Ciencia', 'refutar', 'refutar una teoría / una hipótesis'],
        ] },
        'Otras palabras útiles del mismo campo: <b>el arancel</b> (impuesto sobre productos importados: «imponer aranceles»), <b>la coyuntura</b> (situación del momento: «la coyuntura económica»), <b>el sondeo</b> (encuesta de opinión: «según los sondeos») y <b>la muestra</b> («una muestra representativa»).',
        '<b>Registro.</b> En textos formales preferimos términos precisos en lugar de expresiones coloquiales:',
        { t: 'table', head: ['Registro coloquial', 'Registro formal'], rows: [
          ['Todo el mundo está de acuerdo.', 'Existe consenso.'],
          ['Quitar una ley.', 'Derogar una ley.'],
          ['Los precios suben mucho.', 'Se produce un incremento generalizado de los precios.'],
          ['Gastar más de lo que se gana.', 'Incurrir en déficit.'],
        ] },
        { t: 'ex', list: ['El partido perdió cinco escaños en el Parlamento.', 'La coyuntura económica obliga a contener el déficit.', 'Los autores refutan la hipótesis con una muestra representativa.', 'El Gobierno impuso aranceles a los productos importados.'] },
        { t: 'tip', text: 'Matiz importante: una hipótesis no se «prueba» sin más; se <b>contrasta</b>, se <b>confirma</b> o se <b>refuta</b>. Y «sufragio» es más formal que «voto»: se usa en textos jurídicos, históricos y periodísticos.' },
      ],
    },
    listen: ['El partido obtuvo treinta escaños en el Parlamento.', 'El Gobierno prometió reducir el déficit público.', 'La inflación se moderó durante el último trimestre.', 'Los nuevos datos refutan la hipótesis inicial.', 'El presidente agotó su segundo mandato.'],
    practice: [
      mc('Un partido gana treinta puestos en el parlamento. ¿Qué sustantivo usas?', 'escaños', ['mandatos', 'sufragios', 'déficits'], 'El «escaño» es el puesto de un parlamentario; se «obtienen» o se «pierden» escaños.', { tag: 'vocabulario-politica' }),
      fill('La ___ fiscal aumentó este año porque el Estado cobró más impuestos.', 'recaudación', 'La «recaudación» es el dinero que el Estado cobra en impuestos; la colocación habitual es «recaudación fiscal».', { tag: 'vocabulario-economia' }),
      mc('Los precios suben de forma general y sostenida. ¿Qué fenómeno es?', 'La inflación', ['El déficit', 'La recaudación', 'El sufragio'], 'La «inflación» es la subida general y sostenida de los precios.', { tag: 'vocabulario-economia' }),
      mc('En un informe formal, ¿cómo expresas «Todo el mundo está de acuerdo»?', 'Existe consenso.', ['Hay un escaño.', 'Se refuta la variable.', 'Se agota el mandato.'], '«Existir consenso» es la expresión formal para indicar un acuerdo general.', { tag: 'registro' }),
    ],
    quiz: [
      mc('Completa: «Los nuevos datos ___ la hipótesis inicial».', 'refutan', ['recaudan', 'convocan', 'derogan'], '«Refutar» significa demostrar que una teoría o un argumento es falso, y se combina con «hipótesis» o «teoría».', { tag: 'vocabulario-ciencia' }),
      fill('El presidente cumple su segundo ___ al frente del país.', 'mandato', 'El «mandato» es el periodo en que se ejerce un cargo público; se «cumple» o se «agota».', { tag: 'vocabulario-politica' }),
      listen('La inflación erosiona el poder adquisitivo de los salarios.', 'Escucha: ¿qué efecto tiene la inflación?', 'Reduce lo que se puede comprar con el salario', ['Aumenta el poder de compra', 'Reduce el número de escaños'], '«Erosionar el poder adquisitivo» significa que con el mismo salario se puede comprar menos.', { tag: 'vocabulario-economia' }),
      dict('El sufragio universal es un pilar de la democracia.', 'Practica la ortografía de «sufragio» y de «universal».', { tag: 'vocabulario-politica' }),
      match([['el escaño', 'Puesto de un parlamentario'], ['el déficit', 'Gastos superiores a los ingresos'], ['la variable', 'Factor que cambia en un estudio'], ['el sufragio', 'Derecho a votar']], 'Repasa el vocabulario abstracto de la lección.', { tag: 'vocabulario-abstracto' }),
      order('En el experimento solo se controló una variable', 'Una «variable» es un factor que se mide o se controla en un experimento.', { tag: 'vocabulario-ciencia' }),
    ],
  });
})(window.LWS);
