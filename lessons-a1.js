;
(function (L) {
  'use strict';
  const C = L.C, { mc, fill, order, listen, dict, match, read } = L.Q;

  C.addLesson({
    id: 'a1.u5.l1', level: 'A1', unit: 5, n: 1, title: 'Género, número y artículos', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás usar el género, el plural y los artículos «el, la, los, las, un, una» con los sustantivos.',
    vocab: [
      ['el día', 'sustantivo', 'Las veinticuatro horas: tiene mañana, tarde y noche. Es masculino, aunque termina en -a.', 'Hoy es un día bonito.', 'Today is a nice day.'],
      ['la mano', 'sustantivo', 'Parte del cuerpo con cinco dedos. Es femenino, aunque termina en -o.', 'Tengo el bolígrafo en la mano.', 'I have the pen in my hand.'],
      ['la silla', 'sustantivo', 'Mueble para sentarse una persona.', 'La silla es azul.', 'The chair is blue.'],
      ['el cuaderno', 'sustantivo', 'Libro con hojas en blanco para escribir.', 'Escribo mis palabras en el cuaderno.', 'I write my words in the notebook.'],
      ['el bolígrafo', 'sustantivo', 'Objeto que usamos para escribir con tinta.', 'Escribo mi nombre con el bolígrafo.', 'I write my name with the pen.'],
      ['la bicicleta', 'sustantivo', 'Vehículo de dos ruedas que se mueve con los pies.', 'Tengo una bicicleta nueva.', 'I have a new bicycle.'],
      ['el paraguas', 'sustantivo', 'Objeto que usamos cuando llueve. En plural no cambia: «los paraguas».', 'Los paraguas son negros.', 'The umbrellas are black.'],
      ['el sofá', 'sustantivo', 'Asiento cómodo para dos o tres personas.', 'El sofá es grande y cómodo.', 'The sofa is big and comfortable.'],
    ],
    explain: {
      title: 'Género, plural y artículos',
      body: [
        'En español todos los sustantivos tienen <b>género</b>: son <b>masculinos</b> o <b>femeninos</b>. Esto es así también con las cosas: «el cuaderno» es masculino y «la silla» es femenina.',
        { t: 'table', head: ['Género', 'Final normal', 'Ejemplos'], rows: [['Masculino', '-o', 'el cuaderno, el bolígrafo'], ['Femenino', '-a', 'la silla, la bicicleta']] },
        'Hay <b>excepciones</b>. Estas palabras debes aprenderlas de memoria:',
        { t: 'table', head: ['Masculino con -a', 'Femenino con -o'], rows: [['el día', 'la mano'], ['el mapa', 'la foto'], ['el sofá', 'la radio']] },
        'Para el <b>plural</b> hay tres reglas muy fáciles:',
        { t: 'table', head: ['Final del singular', 'Plural', 'Ejemplo'], rows: [['vocal (a, e, i, o, u)', '+ -s', 'silla → sillas; sofá → sofás'], ['consonante', '+ -es', 'flor → flores; papel → papeles'], ['-z', '-z → -ces', 'lápiz → lápices'], ['-s (palabra con acento en otra sílaba)', 'no cambia', 'el paraguas → los paraguas']] },
        'Los <b>artículos</b> cambian con el género y el número del sustantivo. Los artículos definidos hablan de algo conocido; los indefinidos, de algo nuevo o no conocido.',
        { t: 'table', head: ['', 'Masculino', 'Femenino'], rows: [['Definido singular', 'el', 'la'], ['Definido plural', 'los', 'las'], ['Indefinido singular', 'un', 'una'], ['Indefinido plural', 'unos', 'unas']] },
        { t: 'ex', list: ['El cuaderno es rojo.', 'Las sillas son nuevas.', 'Tengo una bicicleta.', 'Unos bolígrafos son azules.', 'Hoy es un día bonito.'] },
        { t: 'tip', text: 'Aprende cada palabra con su artículo: «la mano», no solo «mano». Un error muy común es decir «el mano» o «la día».' },
      ],
    },
    listen: ['Hoy es un día bonito.', 'La silla es azul.', 'Tengo unos cuadernos nuevos.', 'Los paraguas son negros.', 'Tengo el bolígrafo en la mano.'],
    practice: [
      mc('¿Qué opción es correcta?', 'la mano', ['el mano', 'los mano', 'un mano'], '«Mano» termina en -o, pero es una excepción: es femenina. Decimos «la mano».', { tag: 'genero' }),
      fill('Un sofá, dos ___.', 'sofás', '«Sofá» termina en vocal: el plural es «sofás» (+ -s).', { tag: 'plural' }),
      mc('___ día es muy largo. Elige el artículo correcto.', 'El', ['La', 'Las', 'Una'], '«Día» termina en -a, pero es masculino: «el día».', { tag: 'genero' }),
      order('Las sillas son nuevas', 'El artículo, el sustantivo y el adjetivo están en femenino plural: «las sillas nuevas».', { tag: 'articulos' }),
    ],
    quiz: [
      mc('¿Cuál es el plural de «paraguas»?', 'los paraguas', ['los paraguases', 'las paraguas', 'los paraguaes'], 'Las palabras que terminan en -s y no tienen el acento en la última sílaba no cambian: «el paraguas, los paraguas».', { tag: 'plural' }),
      fill('Tengo ___ bicicleta nueva. (artículo indefinido, femenino singular)', 'una', '«Bicicleta» es femenina singular y el artículo indefinido es «una».', { tag: 'articulos' }),
      listen('Los paraguas son negros.', 'Escucha: ¿qué frase oyes?', 'Los paraguas son negros.', ['El paraguas es negro.', 'Las sillas son negras.'], 'Se oye «los paraguas son negros»: plural masculino.', { tag: 'plural' }),
      dict('Tengo el bolígrafo en la mano.', 'Practica «el bolígrafo» (masculino) y «la mano» (femenino).', { tag: 'genero' }),
      match([['el día', 'Masculino, aunque termina en -a'], ['la mano', 'Femenino, aunque termina en -o'], ['la silla', 'Femenino, termina en -a'], ['el cuaderno', 'Masculino, termina en -o']], 'Repasa el género de los sustantivos de la lección.', { tag: 'genero' }),
      order('Las bicicletas son rojas', 'Femenino plural: «las bicicletas rojas».', { tag: 'articulos' }),
    ],
  });

  C.addLesson({
    id: 'a1.u5.l2', level: 'A1', unit: 5, n: 2, title: 'Estar, tener y hay', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás decir dónde están las cosas, qué tienes y qué hay en un lugar.',
    vocab: [
      ['la nevera', 'sustantivo', 'Aparato de la cocina que guarda la comida fría.', 'La leche está en la nevera.', 'The milk is in the fridge.'],
      ['el espejo', 'sustantivo', 'Objeto de cristal donde ves tu cara.', 'Hay un espejo en el baño.', 'There is a mirror in the bathroom.'],
      ['el armario', 'sustantivo', 'Mueble grande donde guardamos la ropa.', 'La ropa está en el armario.', 'The clothes are in the wardrobe.'],
      ['la pared', 'sustantivo', 'Cada lado de una habitación.', 'Hay un reloj en la pared.', 'There is a clock on the wall.'],
      ['la cortina', 'sustantivo', 'Tela que cubre la ventana.', 'Tengo cortinas blancas en mi habitación.', 'I have white curtains in my room.'],
      ['la mascota', 'sustantivo', 'Animal que vive en casa con una familia.', 'Mi mascota es un gato pequeño.', 'My pet is a small cat.'],
      ['las gafas', 'sustantivo', 'Objeto que ponemos delante de los ojos para ver mejor.', 'Mis gafas están en la mesa.', 'My glasses are on the table.'],
      ['el juguete', 'sustantivo', 'Objeto para jugar.', 'Hay muchos juguetes en la habitación.', 'There are many toys in the room.'],
    ],
    explain: {
      title: 'Estar, tener y hay',
      body: [
        'Estos tres verbos son muy importantes. Cada uno tiene un uso diferente.',
        'Usamos <b>estar</b> para el <b>lugar</b> (dónde está algo o alguien) y para el <b>estado</b> (cómo estás).',
        { t: 'table', head: ['Persona', 'Estar'], rows: [['yo', 'estoy'], ['tú', 'estás'], ['él / ella / usted', 'está'], ['nosotros / nosotras', 'estamos'], ['vosotros / vosotras', 'estáis'], ['ellos / ellas / ustedes', 'están']] },
        { t: 'ex', list: ['Mi madre está en casa.', 'Las gafas están en la mesa.', 'Estoy cansado.'] },
        'Usamos <b>tener</b> para la <b>posesión</b> (lo que tienes) y para la <b>edad</b>.',
        { t: 'table', head: ['Persona', 'Tener'], rows: [['yo', 'tengo'], ['tú', 'tienes'], ['él / ella / usted', 'tiene'], ['nosotros / nosotras', 'tenemos'], ['vosotros / vosotras', 'tenéis'], ['ellos / ellas / ustedes', 'tienen']] },
        { t: 'ex', list: ['Tengo una mascota.', 'Mi hermana tiene diez años.', 'Tenemos una nevera nueva.'] },
        'Usamos <b>hay</b> para decir que algo <b>existe</b> en un lugar. «Hay» no cambia: sirve para singular y para plural. Después de «hay» usamos un, una, unos, unas, un número o «muchos / muchas», pero no «el, la, los, las».',
        { t: 'ex', list: ['Hay un espejo en la pared.', 'Hay tres sillas en la cocina.', 'Hay muchos juguetes.'] },
        { t: 'table', head: ['Verbo', 'Uso', 'Ejemplo'], rows: [['ser', 'quién eres, tu origen, tu profesión', 'Soy de Chile.'], ['estar', 'lugar y estado', 'Estoy en casa.'], ['tener', 'posesión y edad', 'Tengo quince años.'], ['hay', 'existencia', 'Hay un perro en la calle.']] },
        { t: 'tip', text: 'Con algo conocido usamos «estar»: «La nevera está en la cocina». Con algo nuevo usamos «hay»: «Hay una nevera en la cocina». Errores comunes: «Hay la nevera» (incorrecto) y «Soy quince años» (incorrecto; decimos «Tengo quince años»).' },
      ],
    },
    listen: ['La nevera está en la cocina.', 'Hay un espejo en la pared.', 'Tengo una mascota pequeña.', 'Mis gafas están en el armario.', 'Mi hermana tiene diez años.'],
    practice: [
      fill('Mis gafas ___ en la mesa.', 'están', 'Hablamos del lugar de un objeto: usamos «estar». Las gafas son plural: «están».', { tag: 'estar' }),
      mc('Mi hermano ___ doce años.', 'tiene', ['es', 'está', 'hay'], 'Para la edad usamos «tener»: «tiene doce años».', { tag: 'tener' }),
      mc('¿Qué frase es correcta?', 'Hay una cortina en la habitación.', ['Hay la cortina en la habitación.', 'Hay unas cortina en la habitación.', 'Son una cortina en la habitación.'], 'Después de «hay» usamos un artículo indefinido que concuerda con el sustantivo: «una cortina».', { tag: 'hay' }),
      order('Hay un espejo en la pared', 'Con «hay» decimos que algo existe en un lugar: «hay + un + sustantivo + lugar».', { tag: 'hay' }),
    ],
    quiz: [
      fill('Yo ___ cansado. (estado)', 'estoy', 'Un estado se dice con «estar». Con «yo» usamos «estoy».', { tag: 'estar' }),
      mc('La nevera ___ en la cocina.', 'está', ['hay', 'tiene', 'es'], 'Es una cosa conocida («la nevera») y decimos su lugar: usamos «está».', { tag: 'estar-hay' }),
      listen('Hay una nevera en la cocina.', 'Escucha: ¿qué hay en la cocina?', 'Una nevera', ['Un armario', 'Un espejo'], 'Se oye «hay una nevera en la cocina».', { tag: 'hay' }),
      dict('Mis gafas están en el armario.', 'Practica «están» (lugar, plural) y el acento de «están».', { tag: 'estar' }),
      match([['estar', 'Lugar y estado'], ['tener', 'Posesión y edad'], ['hay', 'Existencia de algo'], ['ser', 'Identidad y origen']], 'Cada verbo tiene su uso principal.', { tag: 'estar-tener-hay' }),
      order('Mi mascota tiene un juguete nuevo', 'Con «tener» decimos qué posee alguien: «tiene un juguete».', { tag: 'tener' }),
    ],
  });

  C.addLesson({
    id: 'a1.u5.l3', level: 'A1', unit: 5, n: 3, title: 'Gustar, posesivos y demostrativos', topic: 'Gramática',
    goal: 'Al terminar esta lección, podrás decir lo que te gusta, de quién es algo y señalar objetos con «este» y «ese».',
    vocab: [
      ['el helado', 'sustantivo', 'Postre frío y dulce.', 'Me gusta el helado.', 'I like ice cream.'],
      ['el sombrero', 'sustantivo', 'Prenda que ponemos en la cabeza para el sol.', 'Mi sombrero es grande.', 'My hat is big.'],
      ['la cartera', 'sustantivo', 'Objeto pequeño donde guardamos el dinero.', 'Mi cartera es negra.', 'My wallet is black.'],
      ['la bufanda', 'sustantivo', 'Prenda que ponemos en el cuello cuando hace frío.', 'Tu bufanda es muy bonita.', 'Your scarf is very pretty.'],
      ['el globo', 'sustantivo', 'Objeto de colores lleno de aire; lo usamos en las fiestas.', 'Ese globo es rojo.', 'That balloon is red.'],
      ['el cuadro', 'sustantivo', 'Imagen pintada que ponemos en la pared.', 'Este cuadro es muy bonito.', 'This painting is very pretty.'],
      ['las tijeras', 'sustantivo', 'Objeto para cortar papel. Siempre se usa en plural.', 'Estas tijeras son nuevas.', 'These scissors are new.'],
      ['la gorra', 'sustantivo', 'Prenda para la cabeza con una parte delante.', 'Su gorra es azul.', 'His cap is blue.'],
    ],
    explain: {
      title: 'Gustar, posesivos y demostrativos',
      body: [
        'Para decir lo que te gusta usamos <b>gustar</b>. Este verbo es especial: concuerda con <b>lo que te gusta</b> (la cosa), no con la persona.',
        { t: 'table', head: ['Persona', 'Pronombre', 'Una cosa o un verbo', 'Varias cosas'], rows: [['(a mí)', 'me', 'me gusta', 'me gustan'], ['(a ti)', 'te', 'te gusta', 'te gustan'], ['(a él / ella / usted)', 'le', 'le gusta', 'le gustan'], ['(a nosotros)', 'nos', 'nos gusta', 'nos gustan'], ['(a vosotros)', 'os', 'os gusta', 'os gustan'], ['(a ellos / ustedes)', 'les', 'les gusta', 'les gustan']] },
        { t: 'ex', list: ['Me gusta el helado.', 'Me gustan los globos.', 'Te gusta leer.', 'A mi hermana le gustan las gorras.'] },
        'Los <b>posesivos</b> dicen de quién es algo. Concuerdan con la cosa, no con el dueño.',
        { t: 'table', head: ['Persona', 'Una cosa', 'Varias cosas'], rows: [['yo', 'mi', 'mis'], ['tú', 'tu', 'tus'], ['él / ella / usted', 'su', 'sus'], ['nosotros', 'nuestro / nuestra', 'nuestros / nuestras'], ['vosotros', 'vuestro / vuestra', 'vuestros / vuestras'], ['ellos / ustedes', 'su', 'sus']] },
        { t: 'ex', list: ['Mi gorra es azul.', 'Tus gafas están en la mesa.', 'Su cartera es negra.', 'Nuestra casa es grande.'] },
        'Los <b>demostrativos</b> señalan una cosa. «Este» es para algo <b>cerca</b> de mí; «ese» es para algo <b>más lejos</b>.',
        { t: 'table', head: ['', 'Masculino', 'Femenino'], rows: [['Cerca, singular', 'este', 'esta'], ['Cerca, plural', 'estos', 'estas'], ['Lejos, singular', 'ese', 'esa'], ['Lejos, plural', 'esos', 'esas']] },
        { t: 'ex', list: ['Este cuadro es bonito.', 'Esa bufanda es nueva.', 'Estas tijeras son pequeñas.', 'Esos globos son rojos.'] },
        { t: 'tip', text: 'Con una sola cosa usamos «gusta»; con varias, «gustan»: «Me gusta la gorra», pero «Me gustan las gorras». Recuerda: «tu» (de ti) no lleva tilde, pero «tú» (la persona) sí.' },
      ],
    },
    listen: ['Me gusta el helado.', 'Me gustan los globos rojos.', 'Mi sombrero es grande.', 'Este cuadro es muy bonito.', 'A mi hermana le gustan las gorras.'],
    practice: [
      fill('Me ___ los globos. (gustar)', 'gustan', '«Los globos» es un sustantivo plural, por eso usamos «gustan».', { tag: 'gustar' }),
      mc('A mi hermana ___ gusta el helado.', 'le', ['me', 'les', 'nos'], 'Para «ella» usamos el pronombre «le».', { tag: 'gustar' }),
      mc('La gorra está cerca de mí. Digo: ___ gorra es azul.', 'Esta', ['Esa', 'Estos', 'Esos'], '«Esta» es femenino singular y señala algo cerca de mí.', { tag: 'demostrativos' }),
      order('Tu bufanda es muy bonita', '«Tu» es el posesivo de «tú» y va antes del sustantivo: «tu bufanda».', { tag: 'posesivos' }),
    ],
    quiz: [
      fill('Esta es ___ casa. (de nosotros)', 'nuestra', 'La casa es femenina singular y el dueño es «nosotros»: «nuestra casa».', { tag: 'posesivos' }),
      mc('¿Qué frase es correcta?', 'Me gustan las bufandas.', ['Me gusta las bufandas.', 'Me gustas las bufandas.', 'Me gustan la bufanda.'], 'El plural «las bufandas» pide «gustan».', { tag: 'gustar' }),
      listen('Ese globo es rojo y este globo es azul.', 'Escucha: ¿de qué color es el globo «ese»?', 'Rojo', ['Azul', 'Verde'], '«Ese globo es rojo»: «ese» está más lejos y es rojo.', { tag: 'demostrativos' }),
      dict('Me gusta mi sombrero nuevo.', 'Practica «me gusta» y el posesivo «mi».', { tag: 'gustar' }),
      match([['me gusta', 'Se usa con una cosa o un verbo'], ['me gustan', 'Se usa con varias cosas'], ['este / esta', 'Algo cerca de mí'], ['ese / esa', 'Algo más lejos de mí']], 'Repasa las reglas de la lección.', { tag: 'gustar-demostrativos' }),
      order('Estos cuadros son muy bonitos', 'Los demostrativos concuerdan: «estos cuadros» (masculino plural).', { tag: 'demostrativos' }),
    ],
  });
})(window.LWS);
