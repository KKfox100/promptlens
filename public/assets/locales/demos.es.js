'use strict';

/**
 * PromptLens 文本对照示例 · es
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-demos-locale.js es`
 *    译文表：`scripts/i18n-src/es/demos/*.json`
 *
 * 结构是 `{ 题目id: { before, opts: { 选项id: 文本 } } }`，
 * 题目 / 选项 id 与语种无关（和界面文案那套「中文当 key」不同）。
 * 生成时会和 demos.js 的 TEXT 逐 id 对账，少一条就不写文件 ——
 * 对照示例缺一半，比整块不显示更容易让人以为是自己看错了。
 *
 * 壳必须照抄：和 knowledge.js 都是普通脚本，顶层 const 共用同一个全局
 * 词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {

const PACK = {
  "role": {
    "before": "La atención al cliente con IA es una dirección clave para modernizar el servicio en las empresas, y hay que evaluarla a la vez desde la tecnología, el costo y la experiencia.",
    "opts": {
      "role.expert": "Empieza por tres datos duros: tickets diarios, tasa de resolución al primer contacto y peso del costo de personal. Por debajo de 500 tickets al día, pasarse a la IA casi nunca sale a cuenta.",
      "role.critic": "La premisa no se sostiene: lo tratas como una herramienta para bajar costos, pero lo que de verdad se come es la confianza del cliente, y esa cuenta nadie la hace.",
      "role.doer": "Se puede, pero en dos pasos: deja que la IA absorba el 60% de las preguntas habituales y que las personas solo tomen los tickets complejos. En dos semanas ya verás los números.",
      "role.coach": "No corras a cambiar el sistema. Exporta los tickets del último mes y te muestro cuáles nunca necesitaron que los contestara una persona.",
      "role.researcher": "Los resultados existentes no coinciden: un informe habla de un 30% de ahorro, pero la muestra es sobre todo de grandes empresas. No está claro que eso se traslade a operaciones más pequeñas.",
      "role.user": "La última vez que contacté a soporte le di tres vueltas al bot sin llegar a nada y acabé igual haciendo fila para una persona. Si van a cambiarlo, no me hagan pasar por eso otra vez.",
      "role.beginner": "De esto no entiendo mucho. Si nos pasamos a la atención con IA, ¿de verdad va a entender lo que pregunta el cliente así de entrada?"
    }
  },
  "role.stance": {
    "before": "El video corto sí que es hoy un canal importante para crecer en tráfico, y apostar más por él es una opción que vale la pena considerar.",
    "opts": {
      "stance.honest": "Apostarlo todo al video corto es muy arriesgado: si la plataforma cambia sus reglas, tu costo de adquisición puede duplicarse de un día para otro.",
      "stance.balanced": "Apostarlo todo al video corto tiene la ventaja de que creces rápido y experimentar sale barato; el precio es que el tráfico es de la plataforma y tu poder de negociación es mínimo.",
      "stance.supportive": "Apostar por el video corto es la decisión correcta y sí que creces rápido. Si quieres algo más estable, reserva un 20% del presupuesto para canales propios.",
      "stance.challenge": "Dices \"todo\". ¿Ya calculaste cuál es tu plan B si la plataforma cambia su algoritmo de recomendación?"
    }
  },
  "audience": {
    "before": "El diseño de esta función siguió un enfoque centrado en el usuario y mejoró la eficiencia general optimizando el recorrido de interacción.",
    "opts": {
      "aud.public": "En pocas palabras: dos toques menos. Lo que antes eran tres niveles de menú, ahora es uno.",
      "aud.peer": "Aplanamos la navegación de tres niveles, quitamos dos cambios de contexto y la conversión en la primera pantalla subió un 11%.",
      "aud.decision": "Conclusión: este cambio sube un 11% la conversión de compra por dos personas-mes de trabajo. Lo que necesito que decidas es si retrasamos la próxima versión.",
      "aud.client": "Tras el ajuste, el usuario da dos pasos menos desde que ve el producto hasta que compra; en la práctica, eso le suma un punto a su tasa de conversión.",
      "aud.student": "Empieza por una pregunta: para comprar un café, ¿cuántos toques en la pantalla estás dispuesto a dar? Nuestro cambio lleva ese número al mínimo.",
      "aud.self": "Navegación aplanada → dos clics menos → conversión +11%. Pendientes: añadir el tracking y validar el despliegue gradual."
    }
  },
  "audience.term": {
    "before": "El sistema usa una arquitectura de generación aumentada por recuperación, que combina la recuperación vectorizada con un módulo de reordenamiento, y al final el LLM organiza la respuesta.",
    "opts": {
      "term.explain": "El sistema usa RAG (primero busca información y luego responde). Saca los fragmentos relevantes de una base de datos vectorial (un almacén que guarda la información por significado).",
      "term.direct": "El sistema usa generación aumentada por recuperación (RAG) y recurre a una base de datos vectorial para recuperar los fragmentos relevantes.",
      "term.bilingual": "El sistema usa RAG (Retrieval-Augmented Generation, generación aumentada por recuperación) y recurre a una base de datos vectorial (Vector Database) para recuperar fragmentos.",
      "term.avoid": "El sistema primero saca de su almacén de documentos los fragmentos más relevantes y luego responde a partir de ellos, en lugar de inventar de memoria."
    }
  },
  "format": {
    "before": "Cocinar en casa y pedir comida a domicilio tienen cada uno sus ventajas y desventajas, y la elección depende de tu situación. Cocinar en casa es más sano y más barato; pedir a domicilio ahorra tiempo.",
    "opts": {
      "fmt.report": "## Conclusión\nCocinar en casa gana en costo a largo plazo; pedir a domicilio gana en tiempo.\n\n## Comparación de costos\n…\n\n## Recomendación\n…",
      "fmt.checklist": "1. Calcula cuánto vale una hora de tu tiempo\n2. Suma los recibos de una semana de pedidos\n3. Compáralo con el costo de los ingredientes de los mismos platos\n4. Trata por separado los días de semana y los fines de semana",
      "fmt.dialogue": "No es para tanto. Si ganas una hora al día, si esa hora vale o no la diferencia de precio es tu respuesta.",
      "fmt.table": "| Dimensión | Cocinar en casa | Pedir a domicilio |\n| --- | --- | --- |\n| Costo por comida | $15 | $35 |\n| Tiempo | 50 min | 5 min |",
      "fmt.article": "Un artículo completo y listo para publicar, de unas 1500 palabras, con un inicio y un cierre de verdad.",
      "fmt.code": "Código que se pueda ejecutar tal cual, por ejemplo para calcular el punto de equilibrio de cocinar en casa a partir del precio de los ingredientes y el tiempo que lleva.",
      "fmt.outline": "1. Costo\n   1. Ingredientes\n   2. Tiempo\n2. Salud\n   1. Aceite y sal\n   2. Control sobre los ingredientes\n3. Conclusión",
      "fmt.message": "Un mensaje que puedas enviarle a tu compañero de piso tal cual, con saludo, el punto principal y una despedida.",
      "fmt.slides": "Diapositiva 1 | El problema: por qué la cuenta de los pedidos no para de subir\n· Gasto mensual\n· Costo de tiempo\n\nDiapositiva 2 | El plan: pedir a domicilio entre semana y cocinar los fines de semana"
    }
  },
  "format.report.length": {
    "before": "Por defecto, la IA escribe entre 800 y 1200 palabras sin ningún énfasis claro. Acabas de leer y no sabes qué frase era la conclusión.",
    "opts": {
      "rlen.short": "Unas 700 palabras: la conclusión y los dos argumentos más fuertes, para leer en una página.",
      "rlen.mid": "Unas 1500 palabras: conclusión, tres argumentos y una sección de riesgos. Dos o tres páginas.",
      "rlen.long": "Unas 2800 palabras: contexto, razonamiento, datos, riesgos y recomendaciones, todo cubierto."
    }
  },
  "format.report.structure": {
    "before": "## Análisis\nSolo el cuerpo del texto. Sin conclusión, sin riesgos y sin próximos pasos.",
    "opts": {
      "rstr.conclusion": "## Conclusión primero\n(En el primer párrafo ya dejas claro el veredicto)\n\n## Análisis\n…",
      "rstr.evidence": "Punto 1: … (dato: 1200 tickets muestreados en 2024)\nPunto 2: … (caso: la empresa A)",
      "rstr.table": "| Opción | Costo | Plazo |\n| --- | --- | --- |\n| A | $120k | 3 meses |",
      "rstr.risk": "## Riesgos y la postura contraria\nSi las reglas de la plataforma cambian, la conclusión anterior deja de valer.",
      "rstr.action": "## Próximos pasos\n1. Esta semana: exportar los datos (Operaciones)\n2. La próxima: lanzar el despliegue gradual (Desarrollo)",
      "rstr.open": "## Por confirmar\n· ¿Cuál es el tope de presupuesto?\n· ¿Se permite retrasar el lanzamiento?"
    }
  },
  "format.checklist.granularity": {
    "before": "1. Prepara los materiales\n2. Haz la operación\n3. Completa la revisión",
    "opts": {
      "cgran.coarse": "1. Reúne los tickets de los últimos 30 días\n2. Agrupa las preguntas más frecuentes\n3. Configura las respuestas automáticas\n4. Lanza el despliegue gradual y observa",
      "cgran.medium": "1. Reúne los tickets de los últimos 30 días\n   Qué: exportar todos los tickets\n   Cómo: Panel → Datos → Exportar CSV\n   Listo cuando: tengas un archivo CSV",
      "cgran.fine": "1. Entra al panel de soporte (con la cuenta de administrador)\n2. Haz clic en \"Datos\" → \"Tickets\" y elige el rango \"Últimos 30 días\"\n3. Haz clic en \"Exportar\", formato CSV, codificación UTF-8\n4. Abre el archivo y ordena por la columna \"Descripción del problema\""
    }
  },
  "format.dialogue.length": {
    "before": "Por defecto, la IA escribe más de 600 palabras y no puede evitar dividirlo en viñetas.",
    "opts": {
      "dlen.short": "Sí, pero solo para productos estándar. Para piezas personalizadas, no.",
      "dlen.mid": "Sí, pero depende de la categoría. Con las piezas estándar la IA va bien, con una resolución al primer contacto de en torno al 70%. En los pedidos personalizados todo son detalles, y cuando la IA falla cuesta más tiempo humano, no menos.",
      "dlen.long": "Sí, pero hay que desglosarlo por categoría. … (tres o cuatro niveles de profundidad, siempre en párrafos naturales, sin cortarlo nunca en una lista)"
    }
  },
  "format.table.dimension": {
    "before": "| Opción |\n| --- |\n| Soporte con IA |\n| Soporte humano |",
    "opts": {
      "tdim.core": "| Opción | Rasgo clave |\n| --- | --- |\n| Soporte con IA | Respuesta al instante 24/7 |",
      "tdim.pro": "| Opción | Ventaja |\n| --- | --- |\n| Soporte con IA | Costo bajo y sin filas |",
      "tdim.con": "| Opción | Limitación |\n| --- | --- |\n| Soporte con IA | Poco fiable en preguntas complejas |",
      "tdim.scene": "| Opción | Ideal para |\n| --- | --- |\n| Soporte con IA | Preguntas estándar muy frecuentes |",
      "tdim.cost": "| Opción | Costo / esfuerzo |\n| --- | --- |\n| Soporte con IA | Unas 2 personas-mes para arrancar |",
      "tdim.verdict": "| Opción | Recomendación |\n| --- | --- |\n| Soporte con IA | Empezar con un despliegue gradual |"
    }
  },
  "format.article.length": {
    "before": "Por defecto, la IA escribe unas 1000 palabras. Ni largo ni corto, sin elegir nada y sin dejar nada fuera.",
    "opts": {
      "alen.short": "Unas 800 palabras, una sola idea, para leer de un tirón.",
      "alen.mid": "Unas 1800 palabras, con un inicio, un desarrollo y un cierre. Un arco completo.",
      "alen.long": "Más de 3000 palabras, avanzando capa por capa, con un caso concreto para cada argumento."
    }
  },
  "format.article.structure": {
    "before": "Por defecto, la IA escribe el típico ensayo de tesis, argumentos y tesis repetida.",
    "opts": {
      "astr.hook": "Inicio: \"La semana pasada borré la app número 47 de mi teléfono.\"\nDesarrollo: por qué la borré y qué pasó después\nCierre: volver a \"¿cuántas apps necesitamos de verdad\"",
      "astr.story": "Todo el texto sigue a una persona concreta: cambió tres veces de sistema de soporte y cada vez cayó en una trampa distinta. El argumento va dentro de la historia.",
      "astr.list": "1. El problema del costo\n2. El problema de la experiencia\n3. El problema de los datos\nTres secciones independientes, para que el lector pueda saltar entre ellas.",
      "astr.q": "¿Por qué cada vez es más difícil llegar a soporte? → Porque los costos se exprimieron al límite. → ¿Y a dónde fue el dinero ahorrado? → …"
    }
  },
  "format.code.language": {
    "before": "Por defecto, la IA elige por su cuenta lo más común, y cambia de una vez a otra.",
    "opts": {
      "clang.unspecified": "Voy con Python: el ecosistema más amplio y el mejor respaldo de la comunidad. La razón es…",
      "clang.python": "Implementado en Python 3.11, siguiendo PEP 8.",
      "clang.js": "Implementado en TypeScript 5, siguiendo las convenciones modernas de ES.",
      "clang.other": "Implementado con el stack que me indiques."
    }
  },
  "format.code.comments": {
    "before": "Por defecto, la IA o comenta cada línea o no escribe ni una.",
    "opts": {
      "ccmt.inline": "if cache.get(k):  # acierto de caché, devolvemos ya para no volver a llamar a la API de abajo",
      "ccmt.after": "(código)\n\nEnfoque general: primero consulta la caché, si no hay acierto va al origen y, al ir al origen, deduplica una vez.",
      "ccmt.both": "Comentarios clave dentro del código y, después, una breve explicación del enfoque general.",
      "ccmt.none": "Solo el bloque de código, ni una palabra de explicación."
    }
  },
  "format.outline.depth": {
    "before": "1. Costo\n2. Experiencia\n3. Conclusión",
    "opts": {
      "odep.two": "1. Costo\n   · Ingredientes\n   · Tiempo\n2. Salud",
      "odep.three": "1. Costo\n   · Ingredientes\n      - Comparación de precios de productos frescos\n      - Tasa de desperdicio\n   · Tiempo\n      - Tiempo de preparación",
      "odep.withNote": "1. Costo\n   (esta sección responde a \"¿cocinar en casa sale de verdad más barato\", usando los recibos de un mes como material)\n   · Ingredientes…"
    }
  },
  "format.message.tone": {
    "before": "Por defecto, la IA escribe \"Hola, en relación con este asunto…\" y termina sin pedir nada concreto.",
    "opts": {
      "mtone.push": "…así que me gustaría que me lo confirmaras antes de este viernes, para poder organizar el siguiente paso.",
      "mtone.explain": "…ese es el estado actual. El impacto se limita a A y B, por ahora no hace falta que hagas nada y te aviso en cuanto haya cambios.",
      "mtone.negotiate": "…si esta vez puedes sumar una persona más, obtienes el resultado dos semanas antes y yo no tengo que recortar la fase de pruebas.",
      "mtone.apologize": "…esto fue culpa nuestra, planificamos mal los tiempos. La solución: esta semana sacamos una versión usable y la próxima completamos el resto."
    }
  },
  "format.slides.count": {
    "before": "Por defecto, la IA te da unas 10 diapositivas.",
    "opts": {
      "scnt.short": "5-8 diapositivas, una idea por diapositiva, ideal para una presentación de 10 minutos.",
      "scnt.mid": "10-15 diapositivas, con contexto, propuesta, datos de apoyo y conclusión.",
      "scnt.long": "Más de 20 diapositivas, con razonamiento detallado, datos y anexo."
    }
  },
  "tone": {
    "before": "Este artículo analizará la propuesta de forma sistemática desde tres dimensiones: costo, eficiencia y experiencia, con el fin de ofrecer una referencia para la decisión.",
    "opts": {
      "tone.pro": "Desde el costo, la eficiencia y la experiencia, la propuesta es viable en las condiciones actuales, aunque conviene vigilar el plazo de implementación.",
      "tone.warm": "Esto no es tan complicado como parece. Miremos tres cosas y ya lo tendrás claro.",
      "tone.sharp": "Ahorra un 30% del costo, pero suma dos meses. Si vale la pena depende de si andas corto de dinero o de tiempo.",
      "tone.humor": "Esta propuesta es como una prenda de talla única: cualquiera se la pone y a nadie le queda bien.",
      "tone.calm": "La propuesta baja el costo en torno a un 30% y añade unos 2 meses al plazo. Ambas cifras son cuantificables.",
      "tone.vivid": "Imagínalo: a fin de mes la cuenta es un tercio más pequeña, pero en tu calendario aparecen dos meses enteros de espera."
    }
  },
  "depth": {
    "before": "Por defecto, la IA te da un texto de longitud media con la conclusión y los motivos mezclados.",
    "opts": {
      "depth.min": "Se puede, pero no sale a cuenta.",
      "depth.light": "Se puede. Pero ojo con dos cosas: el plazo se alarga dos meses y la resolución al primer contacto baja antes de recuperarse.",
      "depth.mid": "Se puede, por tres motivos: la estructura de costos…, la situación actual del equipo… y los casos del sector…. El tercero es el que más atención merece.",
      "depth.deep": "Se puede, pero solo bajo condiciones muy estrechas. El razonamiento: …; el límite: más de 500 tickets al día; un contraejemplo: la empresa B lo adoptó con 200 tickets al día y le salió más caro; la incógnita: faltan datos de retención a largo plazo."
    }
  },
  "depth.why": {
    "before": "Por defecto, la IA sí explica, pero casi siempre explica qué es algo, no por qué.",
    "opts": {
      "why.no": "Primero deja que la IA absorba los casos habituales y que las personas tomen solo los tickets complejos.",
      "why.key": "Deja que la IA absorba los casos habituales y que las personas tomen solo los tickets complejos, porque la métrica que importa es la resolución al primer contacto, no el volumen total atendido.",
      "why.full": "Empecemos por el motivo de esta división: el costo del soporte no está en la respuesta, está en el cambio de contexto. Cada ticket obliga a releer el historial, y eso solo se come el 40% de las horas totales. Si le pasas las preguntas estándar a la IA, eliminas buena parte de ese 40%, así que…"
    }
  },
  "constraints": {
    "before": "¡Es una muy buena pregunta! Veámoslo desde varios ángulos… (cierre) En resumen, espero que te haya sido de ayuda.",
    "opts": {
      "con.nogreet": "Empieza directo con el cuerpo. Sin \"es una muy buena pregunta\".",
      "con.norepeat": "No repite tu pregunta. La primera frase ya es la respuesta.",
      "con.nohallucinate": "En 2024 el sector movió unos 1,2 billones de dólares (no estoy seguro de esta cifra, conviene verificarla).",
      "con.nodigress": "Responde solo a lo que preguntaste, sin irse por las ramas con \"de paso hablemos de los canales propios\".",
      "con.nosummary": "Termina después del último punto. Sin \"en resumen\".",
      "con.wordlimit": "Exactamente 800 palabras. 799 u 801 cuentan igual como fallo.",
      "con.source": "Conversión +11% (fuente: prueba A/B interna, 2026-03, n = 4200).",
      "con.noemoji": "Sin símbolos decorativos como ✨🚀💡.",
      "con.noask": "Asumo 500 tickets al día. Si tu volumen real es distinto, la conclusión cambia.",
      "con.askfirst": "Dos cosas que confirmar antes de empezar: ¿más o menos cuántos tickets al día reciben y cuántas personas los atienden ahora?"
    }
  },
  "antiAi": {
    "before": "Primero, tenemos que aclarar el objetivo. Segundo, hay que analizar la situación actual. Por último, cabe destacar que lo que importa es la ejecución. En conclusión, espero que lo anterior te haya sido de ayuda.",
    "opts": {
      "ai.cliche": "Sin \"primero / segundo / por último\", sin \"cabe destacar\" y sin \"en conclusión\".",
      "ai.parallel": "Sin tríadas, es decir, tres frases paralelas seguidas.",
      "ai.antithesis": "Sin construcciones del tipo \"no es A, sino B\".",
      "ai.rhythm": "Primero haz las cuentas. Cuando las hagas, verás que lo caro no es la comida, son los cincuenta minutos que pasas frente al fogón.",
      "ai.concrete": "Un pedido a domicilio son $35. Cocinar tú mismo, $15. Esos $20 de diferencia te compran 45 minutos.",
      "ai.colloquial": "La verdad, yo también lo hacía. Luego hice las cuentas y dejé de pedir.",
      "ai.noperpara": "Los párrafos ya no terminan con una frase de resumen. El contenido sigue avanzando.",
      "ai.hedge": "Sin matices como \"en cierta medida\" o \"de algún modo\".",
      "ai.emotion": "El cierre no se eleva a \"esto no es solo cocinar, es toda una forma de vivir\".",
      "ai.contrast": "Sin más guiones para explicar o dar un giro."
    }
  },
  "examples": {
    "before": "La IA te entrega el resultado final y tú no sabes si entendió bien lo que querías.",
    "opts": {
      "ex.good": "Aquí tienes un ejemplo que a mí me parece bien escrito: \"…\". Lo bueno es esto: …. A continuación escribo con este criterio.",
      "ex.contrast": "Bien: \"Un pedido a domicilio son $35; cocinarlo tú mismo, $15.\"\nMal: \"En resumen, espero que te ayude.\"\nLa diferencia: puro relleno, ni un dato concreto.",
      "ex.none": "Sáltate los ejemplos y dame directamente el resultado final."
    }
  }
};

root.PromptLensDemosText = root.PromptLensDemosText || {};
root.PromptLensDemosText['es'] = PACK;

if (typeof module !== 'undefined' && module.exports) module.exports = PACK;

})(typeof globalThis !== 'undefined' ? globalThis : this);
