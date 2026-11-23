;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match, read } = L.Q;

  C.addLesson({
    id: 'a2.u5.l1', level: 'A2', unit: 5, n: 1, title: 'Pronombres de objeto directo e indirecto', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás usar lo, la, los, las, me, te, le, nos y les para no repetir nombres.',
    vocab: [
      ['prestar', 'verbo', 'Dar una cosa a una persona por un tiempo. Después la persona la devuelve.', 'Te presto mi bicicleta esta tarde.', "I'll lend you my bike this afternoon."],
      ['regalar', 'verbo', 'Dar una cosa a una persona, sin dinero, para hacerla feliz.', 'Le regalo flores a mi madre.', 'I give my mother flowers as a gift.'],
      ['enviar', 'verbo', 'Mandar algo a otra persona por correo o por internet.', 'Te envío el mensaje ahora.', "I'm sending you the message now."],
      ['mostrar', 'verbo', 'Poner algo delante de una persona para que lo vea.', 'Nos muestra las fotos del viaje.', 'He shows us the photos from the trip.'],
      ['devolver', 'verbo', 'Dar una cosa a la persona que te la prestó.', 'Mañana te devuelvo el libro.', "Tomorrow I'll give you the book back."],
      ['el paquete', 'sustantivo', 'Caja o bolsa cerrada que se manda por correo.', 'El paquete llega el lunes.', 'The package arrives on Monday.'],
      ['el sobre', 'sustantivo', 'Papel doblado donde ponemos una carta.', 'Pongo la carta en el sobre.', 'I put the letter in the envelope.'],
      ['el cartero', 'sustantivo', 'Persona que lleva las cartas y los paquetes a las casas.', 'El cartero nos trae el paquete.', 'The mail carrier brings us the package.'],
    ],
    explain: {
      title: 'Lo, la, le: no repetir los nombres',
      body: [
        'Un <b>pronombre de objeto</b> sustituye a un nombre para no repetirlo. En lugar de «Compro el pan», decimos «<b>Lo</b> compro».',
        'El <b>objeto directo</b> responde a «¿qué?». Estos son los pronombres:',
        { t: 'table', head: ['Singular', 'Plural'], rows: [['me', 'nos'], ['te', 'os'], ['lo (masculino) / la (femenino)', 'los (masculino) / las (femenino)']] },
        'El <b>objeto indirecto</b> responde a «¿a quién?» o «¿para quién?». Es la persona que recibe algo.',
        { t: 'table', head: ['Singular', 'Plural'], rows: [['me', 'nos'], ['te', 'os'], ['le', 'les']] },
        'Los pronombres van <b>antes del verbo</b>.',
        { t: 'ex', list: ['Compro el pan. → Lo compro.', 'Veo las flores. → Las veo.', 'Doy un regalo a Ana. → Le doy un regalo.', 'Escribo a mis padres. → Les escribo.', 'El cartero me trae un paquete.'] },
        'Con dos pronombres, el indirecto va primero: «Me lo envía», «Te la presto». Pero «le» y «les» cambian a <b>se</b> delante de lo, la, los, las: «Le doy el regalo» → «<b>Se lo</b> doy».',
        { t: 'tip', text: 'Error común: «Tengo lo» o «Lo doy el libro a Ana». El pronombre va antes del verbo, y para la persona que recibe usamos «le» o «les»: «Le doy el libro».' },
      ],
    },
    listen: ['Te presto mi cuaderno.', 'Mi madre me envía un paquete.', '¿Tienes el sobre? Sí, lo tengo.', 'El cartero nos trae las cartas.', 'Le regalo un libro a mi hermana.'],
    practice: [
      mc('¿Tienes mi cuaderno? Sí, ___ tengo aquí.', 'lo', ['la', 'los', 'le'], '«Cuaderno» es masculino singular, por eso usamos «lo».', { tag: 'objeto-directo' }),
      fill('¿Dónde está la llave? Aquí ___ tengo.', ['la', 'La'], '«Llave» es femenino singular, por eso usamos «la».', { tag: 'objeto-directo' }),
      mc('Mi padre ___ regala un libro a mis hermanos.', 'les', ['le', 'los', 'nos'], 'Los hermanos reciben el libro: es objeto indirecto plural, por eso usamos «les».', { tag: 'objeto-indirecto' }),
      order('Le presto mi cuaderno a Juan', 'El pronombre «le» va antes del verbo.', { tag: 'posicion' }),
    ],
    quiz: [
      mc('Quieres decir «Veo el paquete» con un pronombre. ¿Qué dices?', 'Lo veo.', ['Veo lo.', 'La veo.', 'Le veo.'], '«Paquete» es masculino y es objeto directo, y el pronombre va antes del verbo: «Lo veo».', { tag: 'objeto-directo' }),
      fill('Ana es mi amiga. ___ envío un mensaje todos los días.', ['Le', 'le'], 'El mensaje es para Ana: es objeto indirecto singular, por eso usamos «le».', { tag: 'objeto-indirecto' }),
      listen('Te devuelvo el libro mañana.', 'Escucha: ¿qué pronombre oyes?', 'te', ['me', 'le'], 'Se oye «te devuelvo»: la persona que recibe el libro es «tú».', { tag: 'objeto-indirecto' }),
      dict('Les muestro las fotos a mis amigos.', 'Practica «les» (amigos) y «muestro».', { tag: 'objeto-indirecto' }),
      match([['Compro el pan.', 'Lo compro.'], ['Veo las flores.', 'Las veo.'], ['Escribo a mis padres.', 'Les escribo.'], ['Doy un regalo a Ana.', 'Le doy un regalo.']], 'Objeto directo: lo, la, los, las. Objeto indirecto: le, les.', { tag: 'posicion' }),
      order('Mi madre nos envía un paquete', 'El pronombre «nos» va antes del verbo conjugado.', { tag: 'posicion' }),
    ],
  });

  C.addLesson({
    id: 'a2.u5.l2', level: 'A2', unit: 5, n: 2, title: 'El imperativo', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás dar órdenes, consejos e instrucciones con tú, usted y vosotros.',
    vocab: [
      ['cerrar', 'verbo', 'Hacer que una puerta o una ventana no esté abierta.', 'Cierra la puerta, por favor.', 'Close the door, please.'],
      ['esperar', 'verbo', 'Quedarte en un lugar hasta que llega algo o alguien.', 'Espera aquí un momento.', 'Wait here a moment.'],
      ['apagar', 'verbo', 'Hacer que una luz o un aparato deje de funcionar.', 'Apaga la tele y haz la tarea.', 'Turn off the TV and do your homework.'],
      ['la luz', 'sustantivo', 'Lo que usamos para ver cuando hay oscuridad.', 'La luz de mi cuarto es amarilla.', 'The light in my room is yellow.'],
      ['la puerta', 'sustantivo', 'Parte de una casa por donde entramos y salimos.', 'La puerta de mi casa es azul.', 'The door of my house is blue.'],
      ['despacio', 'adverbio', 'A poca velocidad, sin prisa.', 'Habla despacio, por favor.', 'Speak slowly, please.'],
      ['sentarse', 'verbo', 'Poner el cuerpo sobre una silla.', 'Siéntate aquí, hay una silla libre.', 'Sit here, there is a free chair.'],
      ['el interruptor', 'sustantivo', 'Botón de la pared que enciende y apaga la luz.', 'Pulsa el interruptor para apagar la luz.', 'Press the switch to turn off the light.'],
    ],
    explain: {
      title: 'Dar órdenes y consejos',
      body: [
        'Usamos el <b>imperativo</b> para dar órdenes, consejos e instrucciones. Con «por favor» suena más amable.',
        'Imperativo afirmativo de los verbos regulares:',
        { t: 'table', head: ['Verbo', 'tú', 'usted', 'vosotros', 'ustedes'], rows: [['hablar', 'habla', 'hable', 'hablad', 'hablen'], ['comer', 'come', 'coma', 'comed', 'coman'], ['escribir', 'escribe', 'escriba', 'escribid', 'escriban']] },
        'La forma de <b>tú</b> es igual que «él» en presente: él habla → <b>habla</b>. La forma de <b>vosotros</b> cambia la «-r» del infinitivo por «-d».',
        { t: 'ex', list: ['Habla más despacio, por favor.', 'Coma la sopa, señor.', 'Escribid vuestros nombres.', 'Esperen aquí, señores.'] },
        'Algunos verbos tienen un imperativo irregular con <b>tú</b>:',
        { t: 'table', head: ['Infinitivo', 'tú', 'usted'], rows: [['decir', 'di', 'diga'], ['hacer', 'haz', 'haga'], ['ir', 've', 'vaya'], ['poner', 'pon', 'ponga'], ['salir', 'sal', 'salga'], ['tener', 'ten', 'tenga'], ['venir', 'ven', 'venga'], ['ser', 'sé', 'sea']] },
        'Para dar una orden negativa usamos <b>no</b> + otra forma del verbo. Con tú: los verbos en -ar terminan en <b>-es</b>; los verbos en -er e -ir terminan en <b>-as</b>.',
        { t: 'table', head: ['Afirmativo', 'Negativo'], rows: [['Habla.', 'No hables.'], ['Come.', 'No comas.'], ['Escribe.', 'No escribas.'], ['Haz la tarea.', 'No hagas la tarea.'], ['Ve a casa.', 'No vayas a casa.']] },
        'Con el imperativo afirmativo, los pronombres van <b>pegados al verbo</b>: «Dame el libro», «Siéntate aquí». Con «no», van antes: «No te sientes aquí».',
        { t: 'tip', text: 'Error común: «No hablas» no es una orden. La orden negativa es «No hables». Y no olvides la tilde: siéntate.' },
      ],
    },
    listen: ['Cierra la puerta, por favor.', 'Ven aquí y siéntate.', 'No hables tan rápido.', 'Dame el paraguas, por favor.', 'Señora, espere aquí, por favor.'],
    practice: [
      mc('Hablas con un amigo y quieres que cierre la puerta. ¿Qué dices?', 'Cierra la puerta.', ['Cierre la puerta.', 'Cierras la puerta.', 'Cerrar la puerta.'], 'Con un amigo usamos «tú»: el imperativo de «cerrar» es «cierra».', { tag: 'imperativo-tu' }),
      fill('___ la verdad, por favor. (decir, tú)', ['Di', 'di'], 'El imperativo irregular de «decir» con tú es «di».', { tag: 'imperativo-irregular' }),
      mc('Hablas con una señora mayor. ¿Cómo le pides que espere?', 'Espere aquí, por favor.', ['Espera aquí, por favor.', 'Esperad aquí, por favor.', 'Esperas aquí, por favor.'], 'Con «usted» usamos la forma «espere».', { tag: 'imperativo-usted' }),
      fill('No ___ tan rápido. (hablar, tú)', 'hables', 'En la orden negativa con tú, los verbos en -ar terminan en -es: «no hables».', { tag: 'imperativo-negativo' }),
    ],
    quiz: [
      mc('¿Cuál es el imperativo de «ir» para tú?', 've', ['va', 'vas', 'vaya'], 'El imperativo irregular de «ir» con tú es «ve».', { tag: 'imperativo-irregular' }),
      fill('Va a llover. ___ el paraguas. (llevar, tú)', ['Lleva', 'lleva'], 'Con tú, el imperativo regular es igual que «él» en presente: «lleva».', { tag: 'imperativo-tu' }),
      listen('No cierres la puerta, por favor.', 'Escucha: ¿qué te pide la persona?', 'Que no cierres la puerta', ['Que cierres la puerta', 'Que apagues la luz'], 'Se oye «no cierres»: es una orden negativa.', { tag: 'imperativo-negativo' }),
      dict('Apaga la luz y espera un momento.', 'Practica «apaga» y «espera», imperativos con tú.', { tag: 'imperativo-tu' }),
      match([['hacer', 'haz'], ['poner', 'pon'], ['salir', 'sal'], ['venir', 'ven']], 'Estos verbos tienen un imperativo irregular con tú.', { tag: 'imperativo-irregular' }),
      order('Siéntate aquí un momento', 'En el imperativo afirmativo, el pronombre va pegado al verbo: «siéntate».', { tag: 'imperativo-pronombres' }),
    ],
  });

  C.addLesson({
    id: 'a2.u5.l3', level: 'A2', unit: 5, n: 3, title: 'Ser y estar: diferencias', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás elegir entre ser y estar para hablar de identidad, lugar y estado.',
    vocab: [
      ['aburrido', 'adjetivo', 'Que no es interesante. Con «estar», una persona que no se divierte.', 'La película es muy aburrida.', 'The movie is very boring.'],
      ['listo', 'adjetivo', 'Con «ser», una persona inteligente. Con «estar», preparado.', 'Mi hermana es muy lista.', 'My sister is very smart.'],
      ['cansado', 'adjetivo', 'Con poca energía después de trabajar mucho.', 'Estoy cansado después del trabajo.', "I'm tired after work."],
      ['abierto', 'adjetivo', 'Que no está cerrado.', 'La tienda está abierta hasta las ocho.', 'The shop is open until eight.'],
      ['la reunión', 'sustantivo', 'Momento en que varias personas hablan de un tema.', 'La reunión es a las diez.', 'The meeting is at ten.'],
      ['el cumpleaños', 'sustantivo', 'El día del año en que naciste.', 'Mi cumpleaños es en marzo.', 'My birthday is in March.'],
      ['el vecino', 'sustantivo', 'Persona que vive cerca de tu casa.', 'Mi vecino es médico.', 'My neighbor is a doctor.'],
      ['la fiesta', 'sustantivo', 'Reunión de personas para celebrar algo.', 'La fiesta es en casa de Marta.', "The party is at Marta's house."],
    ],
    explain: {
      title: 'Ser o estar',
      body: [
        'En español, «to be» tiene dos verbos: <b>ser</b> y <b>estar</b>. Cada verbo tiene sus usos.',
        'Usa <b>SER</b> para identificar: quién o qué es algo.',
        { t: 'table', head: ['Uso de SER', 'Ejemplo'], rows: [['Identidad y características', 'Soy Ana. Mi vecino es alto.'], ['Origen', 'Ella es de Perú.'], ['Profesión', 'Mi padre es médico.'], ['Hora y fecha', 'Son las tres. Hoy es lunes.'], ['Un evento (dónde ocurre)', 'La fiesta es en mi casa.']] },
        'Usa <b>ESTAR</b> para el lugar y el estado:',
        { t: 'table', head: ['Uso de ESTAR', 'Ejemplo'], rows: [['Lugar de una persona o cosa', 'Mi cuaderno está en la mesa.'], ['Estado (de ánimo o salud)', 'Hoy estoy cansado.'], ['Resultado de una acción', 'La tienda está abierta.']] },
        'El verbo «estar» en presente: <b>estoy, estás, está, estamos, estáis, están</b>.',
        'Algunos adjetivos cambian de significado con ser y con estar:',
        { t: 'table', head: ['Adjetivo', 'Con SER', 'Con ESTAR'], rows: [['aburrido', 'La clase es aburrida. (no es interesante)', 'Estoy aburrido. (no me divierto)'], ['listo', 'Ella es lista. (es inteligente)', 'Ya estoy listo. (estoy preparado)']] },
        { t: 'tip', text: 'Errores comunes: «Soy cansado» (correcto: estoy cansado) y «Estoy de México» (correcto: soy de México). Los eventos usan ser: «La reunión es en la oficina».' },
      ],
    },
    listen: ['Mi vecino es médico.', 'La reunión es a las diez.', 'Hoy estoy muy cansado.', 'La tienda está abierta.', 'Mi hermana es muy lista.'],
    practice: [
      mc('Mi madre ___ profesora.', 'es', ['está', 'estoy', 'somos'], 'Para decir una profesión usamos «ser»: «es».', { tag: 'ser-profesion' }),
      fill('Yo ___ muy cansado hoy.', 'estoy', 'Para un estado usamos «estar»: «yo estoy».', { tag: 'estar-estado' }),
      mc('Mis llaves ___ en la mesa.', 'están', ['son', 'es', 'está'], 'Para el lugar usamos «estar». «Llaves» es plural: «están».', { tag: 'estar-lugar' }),
      order('Mi padre es de Chile', 'Para el origen usamos «ser + de».', { tag: 'ser-origen' }),
    ],
    quiz: [
      mc('Marta no se divierte en la clase. ¿Qué frase es correcta?', 'Marta está aburrida.', ['Marta es aburrida.', 'Marta está aburrido.', 'Marta están aburrida.'], 'Para decir cómo se siente Marta ahora usamos «estar». «Es aburrida» significa que Marta no es interesante.', { tag: 'ser-estar-adjetivos' }),
      fill('El cumpleaños de Pablo ___ el sábado.', 'es', 'Un evento usa «ser» para decir cuándo o dónde ocurre.', { tag: 'ser-evento' }),
      listen('Mi vecino está en la reunión.', 'Escucha: ¿dónde está el vecino?', 'En la reunión', ['En la fiesta', 'En casa'], 'Se oye «está en la reunión». Para el lugar de una persona usamos «estar».', { tag: 'estar-lugar' }),
      dict('Mi vecino es médico y hoy está cansado.', 'Practica «es» (profesión) y «está» (estado).', { tag: 'ser-estar-contraste' }),
      match([['Es de Perú.', 'Origen'], ['Son las tres.', 'La hora'], ['Está en casa.', 'Lugar'], ['Está cansado.', 'Estado']], 'Ser: origen y hora. Estar: lugar y estado.', { tag: 'ser-estar-contraste' }),
      order('La fiesta de mi vecino es mañana', 'Un evento usa «ser» para decir cuándo ocurre.', { tag: 'ser-evento' }),
    ],
  });
})(window.LWS);
