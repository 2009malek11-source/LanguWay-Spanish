;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match, read } = L.Q;

  C.addLesson({
    id: 'b2.u5.l1', level: 'B2', unit: 5, n: 1, title: 'La pasiva y las construcciones con se', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás elegir entre la pasiva con «ser», la pasiva refleja y el «se» impersonal según lo que quieras destacar.',
    vocab: [
      ['construir', 'verbo', 'Hacer un edificio, una carretera o una obra de ingeniería.', 'La biblioteca fue construida en el siglo pasado.', 'The library was built in the last century.'],
      ['restaurar', 'verbo', 'Reparar algo antiguo para que recupere su aspecto original.', 'La catedral fue restaurada por un equipo de expertos.', 'The cathedral was restored by a team of experts.'],
      ['inaugurar', 'verbo', 'Abrir oficialmente un lugar o iniciar un evento con una ceremonia.', 'El museo será inaugurado el próximo lunes.', 'The museum will be inaugurated next Monday.'],
      ['promulgar', 'verbo', 'Publicar oficialmente una ley para que entre en vigor.', 'Se promulgó la nueva ley de protección de datos.', 'The new data protection law was enacted.'],
      ['derogar', 'verbo', 'Anular una ley o una norma que estaba vigente.', 'Esa norma fue derogada hace diez años.', 'That rule was repealed ten years ago.'],
      ['la sede', 'sustantivo', 'Lugar principal donde una organización tiene su centro de trabajo.', 'La sede de la empresa se encuentra en Valencia.', "The company's headquarters is in Valencia."],
      ['el patrimonio', 'sustantivo', 'Conjunto de bienes culturales o históricos que se heredan.', 'Se protege el patrimonio histórico de la ciudad.', "The city's historical heritage is protected."],
      ['el puente', 'sustantivo', 'Construcción que permite cruzar un río o una carretera.', 'Cruzamos el puente a pie para llegar al otro barrio.', 'We crossed the bridge on foot to get to the other neighborhood.'],
    ],
    explain: {
      title: 'Pasiva con «ser», pasiva refleja y «se» impersonal',
      body: [
        'En español tenemos varias formas de <b>no mencionar al agente</b> o de poner en primer plano lo que recibe la acción. Las tres más importantes son la <b>pasiva con «ser»</b>, la <b>pasiva refleja</b> y el <b>«se» impersonal</b>.',
        '<b>1. Pasiva con «ser» + participio.</b> El participio concuerda en género y número con el sujeto. El agente, si aparece, va con <b>por</b>. Es frecuente en textos escritos, periodísticos y formales.',
        { t: 'table', head: ['Tiempo', 'Ejemplo'], rows: [['Presente', 'El edificio es restaurado por especialistas.'], ['Pretérito indefinido', 'Los puentes fueron construidos en 1950.'], ['Pretérito perfecto', 'La ley ha sido derogada por el Parlamento.'], ['Futuro', 'La sede será inaugurada por la alcaldesa.']] },
        'Si el agente es desconocido, obvio o poco importante, lo omitimos: «La nueva ley fue promulgada ayer». Si lo que nos interesa es quién hizo la acción, lo mantenemos: «La ley fue promulgada <b>por el Gobierno</b>».',
        '<b>2. Pasiva refleja: se + verbo en tercera persona.</b> Se usa cuando el sujeto paciente es una cosa y no hay agente. El verbo concuerda con ese sujeto: singular o plural. Es la forma más natural en la lengua hablada.',
        { t: 'ex', list: ['Se construyó un puente nuevo. / Se construyeron dos puentes nuevos.', 'Se venden pisos en el centro.', 'Se restauró el patrimonio de la ciudad.'] },
        '<b>3. «Se» impersonal.</b> No hay sujeto concreto: el verbo va siempre en <b>singular</b>. Con complemento directo de persona se usa la preposición «a». Esta construcción no se combina con un agente introducido por «por».',
        { t: 'table', head: ['Construcción', 'Ejemplo', 'Rasgo clave'], rows: [['Pasiva refleja', 'Se buscan voluntarios.', 'El verbo concuerda con el sujeto (cosa).'], ['Se impersonal', 'Se busca a los responsables.', 'Verbo en singular; «a» ante persona.'], ['Se impersonal', 'En esta oficina se trabaja bien.', 'No hay sujeto ni objeto.']] },
        { t: 'tip', text: 'Errores frecuentes: «Se vende casas» (correcto: «Se venden casas») y «Se construyó el puente por el Gobierno» (con agente usamos «ser»: «El puente fue construido por el Gobierno»). Además, «La puerta fue cerrada» expresa la acción; «La puerta está cerrada» expresa el resultado.' },
      ],
    },
    listen: [
      'El puente fue construido hace más de cien años.',
      'Se prohibió la entrada a los vehículos pesados.',
      'La ley fue promulgada por el Parlamento.',
      'Aquí se hablan varios idiomas.',
      'El edificio ha sido restaurado por un equipo internacional.',
    ],
    practice: [
      mc('El puente ___ por una empresa local en 2019.', 'fue construido', ['fue construida', 'fueron construidos', 'estaba construyendo'], 'En la pasiva con «ser» el participio concuerda con el sujeto: «el puente» es masculino singular, por eso «fue construido».', { tag: 'pasiva-ser' }),
      fill('Las casas antiguas fueron ___ por los vecinos. (restaurar)', 'restauradas', 'El participio de la pasiva concuerda con el sujeto: «las casas» es femenino plural, por eso «restauradas».', { tag: 'pasiva-ser' }),
      mc('¿Qué oración es un ejemplo de pasiva refleja?', 'Se venden bicicletas usadas.', ['Las bicicletas fueron vendidas por Ana.', 'Ana vende bicicletas usadas.', 'Las bicicletas están vendidas.'], 'La pasiva refleja se forma con «se» + verbo en tercera persona que concuerda con el sujeto paciente: «se venden bicicletas».', { tag: 'pasiva-refleja' }),
      order('La ley fue promulgada por el Parlamento', 'Pasiva con «ser»: sujeto + ser + participio concordado + por + agente.', { tag: 'pasiva-ser' }),
    ],
    quiz: [
      mc('¿Qué oración es correcta?', 'En esta tienda se venden productos ecológicos.', ['En esta tienda se vende productos ecológicos.', 'En esta tienda se venden productos ecológico.', 'En esta tienda se vendemos productos ecológicos.'], 'En la pasiva refleja el verbo concuerda con el sujeto paciente: «productos» es plural, así que «se venden».', { tag: 'pasiva-refleja' }),
      fill('En esta oficina se ___ muy bien. (trabajar)', 'trabaja', 'Con el «se» impersonal el verbo va siempre en tercera persona del singular.', { tag: 'se-impersonal' }),
      listen('El nuevo hospital será inaugurado por la alcaldesa.', 'Escucha: ¿quién inaugurará el hospital?', 'La alcaldesa', ['El director', 'Los vecinos'], 'El agente de la pasiva aparece después de «por»: «por la alcaldesa».', { tag: 'agente-por' }),
      dict('La sede de la organización fue trasladada a otra ciudad.', 'Practica la pasiva con «ser»: «fue trasladada» concuerda con «la sede».', { tag: 'pasiva-ser' }),
      order('Se necesitan voluntarios para restaurar el edificio', 'En la pasiva refleja el verbo «necesitan» concuerda con «voluntarios».', { tag: 'pasiva-refleja' }),
      match([['derogar', 'Anular una ley que estaba vigente.'], ['inaugurar', 'Abrir oficialmente un lugar con una ceremonia.'], ['la sede', 'Lugar principal de una organización.'], ['el patrimonio', 'Bienes culturales que se heredan.']], 'Repasa el vocabulario de la lección.', { tag: 'vocabulario-pasiva' }),
    ],
  });

  C.addLesson({
    id: 'b2.u5.l2', level: 'B2', unit: 5, n: 2, title: 'Hipótesis imposibles en el pasado', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás hablar de situaciones pasadas que no ocurrieron y expresar arrepentimiento con «si + pluscuamperfecto de subjuntivo», «ojalá» y «como si».',
    vocab: [
      ['arrepentirse', 'verbo', 'Sentir pena por haber hecho o por no haber hecho algo.', 'Me arrepiento de no haber estudiado más idiomas.', 'I regret not having studied more languages.'],
      ['lamentar', 'verbo', 'Sentir pena o disgusto por algo que ha ocurrido.', 'Lamento no haber llegado a tiempo a la reunión.', 'I am sorry I did not arrive at the meeting on time.'],
      ['el malentendido', 'sustantivo', 'Error al interpretar lo que alguien dice o hace.', 'Fue un malentendido: nadie quería ofender a nadie.', 'It was a misunderstanding: nobody meant to offend anybody.'],
      ['desaprovechar', 'verbo', 'No usar bien una oportunidad o un recurso.', 'Si no hubieras desaprovechado la beca, ahora estarías en el extranjero.', 'If you had not wasted the scholarship, you would be abroad now.'],
      ['la oportunidad', 'sustantivo', 'Momento o situación favorable para hacer algo.', 'Tuvo la oportunidad de viajar y la aceptó sin dudar.', 'She had the chance to travel and accepted it without hesitation.'],
      ['el rumbo', 'sustantivo', 'Dirección que sigue una persona, un barco o un proyecto.', 'Aquella decisión cambió el rumbo de su carrera.', 'That decision changed the course of his career.'],
      ['darse cuenta', 'locución verbal', 'Notar o comprender algo que antes no sabías o no veías.', 'Me di cuenta del error demasiado tarde.', 'I realized the mistake too late.'],
      ['advertir', 'verbo', 'Avisar a alguien de un peligro o de algo importante.', 'Si me hubieran advertido del cambio, habría salido antes.', 'If they had warned me about the change, I would have left earlier.'],
    ],
    explain: {
      title: 'Condicionales irreales de pasado',
      body: [
        'Usamos la hipótesis imposible cuando hablamos de algo que <b>no ocurrió</b> en el pasado y que ya no se puede cambiar. Imaginamos qué habría pasado en otras circunstancias.',
        '<b>Estructura básica:</b> si + pluscuamperfecto de subjuntivo → condicional compuesto.',
        { t: 'table', head: ['Persona', 'haber (pluscuamperfecto de subjuntivo)', 'haber (condicional)'], rows: [['yo', 'hubiera / hubiese', 'habría'], ['tú', 'hubieras / hubieses', 'habrías'], ['él / ella / usted', 'hubiera / hubiese', 'habría'], ['nosotros', 'hubiéramos / hubiésemos', 'habríamos'], ['vosotros', 'hubierais / hubieseis', 'habríais'], ['ellos / ustedes', 'hubieran / hubiesen', 'habrían']] },
        { t: 'ex', list: ['Si hubiera sabido la verdad, habría actuado de otra manera.', 'Si no hubieras perdido el tren, habrías llegado a tiempo.', 'Si nos hubieran advertido, no habríamos cometido ese error.'] },
        'En la oración principal también se puede usar el <b>pluscuamperfecto de subjuntivo</b> en lugar del condicional compuesto: «Si lo hubiera sabido, no <b>hubiera ido</b>» (= «no habría ido»). Es muy habitual. En cambio, en la oración con «si» no se puede usar el condicional.',
        'Si el resultado afecta al presente, se combina «si + pluscuamperfecto de subjuntivo» con el <b>condicional simple</b>: «Si hubiera estudiado medicina, ahora sería médico».',
        '<b>Ojalá + pluscuamperfecto de subjuntivo</b> expresa un deseo imposible sobre el pasado, es decir, un arrepentimiento: «Ojalá hubiera aprovechado aquella oportunidad». <b>Como si + imperfecto o pluscuamperfecto de subjuntivo</b> compara con una situación irreal: «Habla como si hubiera vivido allí».',
        { t: 'tip', text: 'Error típico: «Si habría sabido...». Después de «si» condicional nunca usamos el condicional: decimos «Si hubiera sabido...». Recuerda también que «hubiera» y «hubiese» son equivalentes.' },
      ],
    },
    listen: [
      'Si hubiera sabido la verdad, habría actuado de otra manera.',
      'Ojalá hubiéramos llegado a tiempo.',
      'Habla como si hubiera estado allí.',
      'Si no hubieras perdido el tren, ahora estarías en casa.',
      'Lamento no haber aprovechado aquella oportunidad.',
    ],
    practice: [
      mc('¿Qué oración es incorrecta?', 'Si habría sabido la verdad, te lo habría dicho.', ['Si hubiera sabido la verdad, te lo habría dicho.', 'Si hubiese sabido la verdad, te lo hubiera dicho.', 'Si hubiera sabido la verdad, te lo hubiera dicho.'], 'Después de «si» condicional no se usa el condicional. Se dice «si hubiera sabido», no «si habría sabido».', { tag: 'condicional-irreal-pasado' }),
      fill('Si me lo hubieran dicho, yo te ___ ayudado. (haber)', ['habría', 'hubiera', 'hubiese'], 'En la oración principal usamos el condicional compuesto («habría ayudado») o, también correcto, el pluscuamperfecto de subjuntivo («hubiera ayudado»).', { tag: 'condicional-irreal-pasado' }),
      mc('Tu abuelo ya no está y lamentas no haber estado más con él. Dices: «Ojalá ___ más tiempo con él».', 'hubiera pasado', ['habría pasado', 'pasaría', 'he pasado'], 'Para un deseo imposible sobre el pasado usamos «ojalá + pluscuamperfecto de subjuntivo».', { tag: 'ojala-hubiera' }),
      order('Habríamos llegado antes si hubiéramos tomado otro camino', 'Oración principal con condicional compuesto + «si» con pluscuamperfecto de subjuntivo.', { tag: 'condicional-irreal-pasado' }),
    ],
    quiz: [
      mc('Habla de Japón como si ___ allí toda la vida.', 'hubiera vivido', ['habría vivido', 'vivió', 'ha vivido'], 'Después de «como si» usamos el imperfecto o el pluscuamperfecto de subjuntivo; aquí, «hubiera vivido».', { tag: 'como-si' }),
      fill('Si no hubiera llovido tanto, nosotros ___ salido a pasear. (haber)', ['habríamos', 'hubiéramos', 'hubiésemos'], 'Con «nosotros» el condicional compuesto es «habríamos»; también es válido «hubiéramos» o «hubiésemos».', { tag: 'condicional-irreal-pasado' }),
      listen('Si hubiera aprovechado esa oportunidad, ahora tendría otro trabajo.', 'Escucha: ¿qué ocurrió realmente?', 'No aprovechó la oportunidad.', ['Aprovechó la oportunidad.', 'Todavía tiene la oportunidad.'], 'La hipótesis es irreal: «si hubiera aprovechado» significa que no la aprovechó. Es una condicional mixta (pasado y presente).', { tag: 'condicional-mixta' }),
      dict('Si me hubieran advertido, no habría cometido ese error.', 'Practica la escritura de «hubieran advertido» y «habría cometido».', { tag: 'condicional-irreal-pasado' }),
      order('Ojalá no hubiera habido ese malentendido', 'Ojalá + pluscuamperfecto de subjuntivo expresa un deseo imposible sobre el pasado.', { tag: 'ojala-hubiera' }),
      match([['arrepentirse', 'Sentir pena por haber hecho o no haber hecho algo.'], ['el rumbo', 'Dirección que sigue una persona o un proyecto.'], ['el malentendido', 'Error al interpretar lo que alguien dice.'], ['desaprovechar', 'No usar bien una oportunidad.']], 'Repasa el vocabulario de la lección.', { tag: 'vocabulario-hipotesis' }),
    ],
  });

  C.addLesson({
    id: 'b2.u5.l3', level: 'B2', unit: 5, n: 3, title: 'Tecnología, medio ambiente y sociedad', topic: 'Vocabulario',
    goal: 'Al terminar esta lección, podrás usar léxico preciso sobre tecnología y medio ambiente con sus colocaciones y familias de palabras más frecuentes.',
    vocab: [
      ['la huella de carbono', 'sustantivo', 'Cantidad de gases contaminantes que produce una persona, una empresa o una actividad.', 'Ir en bicicleta ayuda a reducir tu huella de carbono.', 'Cycling helps reduce your carbon footprint.'],
      ['el vertido', 'sustantivo', 'Residuos que se echan al agua, al suelo o al aire.', 'El vertido de petróleo contaminó la costa durante semanas.', 'The oil spill polluted the coast for weeks.'],
      ['sostenible', 'adjetivo', 'Que se puede mantener en el tiempo sin agotar los recursos ni dañar el medio ambiente.', 'Necesitamos un modelo de desarrollo más sostenible.', 'We need a more sustainable development model.'],
      ['la brecha digital', 'sustantivo', 'Diferencia de acceso a las tecnologías entre grupos de personas o regiones.', 'La brecha digital afecta sobre todo a las zonas rurales.', 'The digital divide mainly affects rural areas.'],
      ['el algoritmo', 'sustantivo', 'Conjunto ordenado de pasos que sigue un programa para resolver un problema.', 'El algoritmo de la aplicación analiza los datos de los usuarios.', "The app's algorithm analyzes users' data."],
      ['el reciclaje', 'sustantivo', 'Proceso de transformar residuos para volver a usarlos.', 'El reciclaje del plástico ha aumentado en nuestra ciudad.', 'Plastic recycling has increased in our city.'],
      ['agotar', 'verbo', 'Gastar algo por completo hasta que no quede nada.', 'Los recursos naturales se están agotando rápidamente.', 'Natural resources are running out quickly.'],
      ['las emisiones', 'sustantivo', 'Gases que se liberan a la atmósfera, por ejemplo por el tráfico o la industria.', 'Las emisiones de CO2 han descendido en la última década.', 'CO2 emissions have fallen over the last decade.'],
    ],
    explain: {
      title: 'Colocaciones y familias de palabras',
      body: [
        'En el nivel B2 no basta con conocer una palabra: hay que saber <b>con qué otras palabras se combina</b>. Esas combinaciones habituales se llaman <b>colocaciones</b>. Un verbo inadecuado suena poco natural, aunque se entienda.',
        { t: 'table', head: ['Colocación', 'Ejemplo'], rows: [['reducir la huella de carbono', 'Las empresas deben reducir su huella de carbono.'], ['agotar los recursos naturales', 'Agotamos los recursos naturales más rápido de lo que se regeneran.'], ['cerrar la brecha digital', 'Las becas ayudan a cerrar la brecha digital.'], ['fomentar el reciclaje', 'El ayuntamiento fomenta el reciclaje con campañas.'], ['un modelo / desarrollo sostenible', 'Buscamos un desarrollo sostenible.']] },
        'Aprender <b>familias de palabras</b> multiplica tu vocabulario: a partir de una raíz se forman verbos, sustantivos y adjetivos con sufijos conocidos.',
        { t: 'table', head: ['Verbo', 'Sustantivo', 'Adjetivo'], rows: [['sostener', 'la sostenibilidad', 'sostenible'], ['contaminar', 'la contaminación', 'contaminante'], ['reciclar', 'el reciclaje', 'reciclable'], ['emitir', 'la emisión', 'emisor'], ['agotar', 'el agotamiento', 'agotador']] },
        { t: 'ex', list: ['La contaminación del aire preocupa a los ciudadanos.', 'Este envase es reciclable y respetuoso con el medio ambiente.', 'La sostenibilidad ya es un criterio para elegir proveedores.', 'Un algoritmo puede reproducir los prejuicios de los datos con los que se entrena.'] },
        'El vocabulario tecnológico y ecológico aparece mucho en prensa y en debates. Fíjate en que muchas palabras son <b>técnicas pero habituales</b>: «el vertido», «las emisiones» o «el algoritmo» se usan en noticias de todos los días.',
        { t: 'tip', text: 'No traduzcas palabra por palabra: en español decimos «reducir la huella de carbono», no «hacer menos la huella». Además, «sostenible» es la forma más usada en España; en algunos países de América también se dice «sustentable».' },
      ],
    },
    listen: [
      'Reducir la huella de carbono es un reto para todos.',
      'La brecha digital afecta sobre todo a las zonas rurales.',
      'El vertido contaminó el río durante semanas.',
      'Los recursos naturales se están agotando rápidamente.',
      'Necesitamos un modelo de desarrollo más sostenible.',
    ],
    practice: [
      mc('Para proteger el planeta, debemos ___ la huella de carbono.', 'reducir', ['agotar', 'sostener', 'inaugurar'], 'La colocación habitual es «reducir la huella de carbono». «Agotar» se usa con recursos, no con la huella.', { tag: 'colocaciones' }),
      fill('Muchas personas mayores no tienen acceso a internet: es un ejemplo de la ___ digital.', 'brecha', 'La expresión fija es «brecha digital»: la diferencia de acceso a la tecnología.', { tag: 'colocaciones' }),
      mc('¿Qué palabra de la familia de «reciclar» es un adjetivo?', 'reciclable', ['reciclaje', 'reciclando', 'reciclé'], 'El sufijo «-able» forma adjetivos: «reciclable» significa que se puede reciclar. «Reciclaje» es un sustantivo.', { tag: 'familias-de-palabras' }),
      order('La empresa fue multada por el vertido de residuos tóxicos', 'Pasiva con «ser» y agente con «por»: la empresa recibe la multa por el vertido.', { tag: 'vocabulario-ecologia' }),
    ],
    quiz: [
      mc('¿Qué combinación de palabras es natural en español?', 'agotar los recursos naturales', ['cansar los recursos naturales', 'romper la huella de carbono', 'abrir el reciclaje'], 'Los recursos naturales se «agotan». Las otras combinaciones no son colocaciones habituales.', { tag: 'colocaciones' }),
      fill('Un modelo económico ___ no destruye los recursos del futuro. (adjetivo de «sostener»)', ['sostenible', 'sustentable'], 'El adjetivo de la familia de «sostener» es «sostenible» (en algunos países, «sustentable»).', { tag: 'familias-de-palabras' }),
      listen('El algoritmo de la aplicación analiza los datos de los usuarios.', 'Escucha: ¿qué hace el algoritmo?', 'Analiza los datos de los usuarios.', ['Borra los mensajes de los usuarios.', 'Vende los dispositivos.'], 'La frase dice que el algoritmo «analiza los datos de los usuarios».', { tag: 'vocabulario-tecnologia' }),
      dict('Es necesario reducir las emisiones para frenar el cambio climático.', 'Practica la escritura de «emisiones» y de «reducir».', { tag: 'vocabulario-ecologia' }),
      order('Es importante fomentar el reciclaje en las escuelas', 'La colocación habitual es «fomentar el reciclaje».', { tag: 'colocaciones' }),
      match([['la huella de carbono', 'Cantidad de gases que produce una persona o una actividad.'], ['el vertido', 'Residuos que se echan al agua o al suelo.'], ['la brecha digital', 'Diferencia de acceso a la tecnología entre grupos.'], ['el algoritmo', 'Pasos que sigue un programa para resolver un problema.']], 'Repasa el vocabulario de la lección.', { tag: 'vocabulario-tecnologia' }),
    ],
  });
})(window.LWS);
