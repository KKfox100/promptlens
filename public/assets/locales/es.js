'use strict';

/**
 * PromptLens 文案包 · es
 * ------------------------------------------------------------------
 * ⚠️ **这个文件是生成的，不要手改。**
 *    生成器：`node scripts/mk-locale.js es`
 *    译文表：`scripts/i18n-src/es/kb/*.json`
 *
 * 结构（题目 id / dim / 互斥组 / multi 开关 / 认字正则 / flags）全部照抄
 * `zh-Hans.js`，生成前后会用结构自检比对 —— 手改这里会被下一次生成覆盖，
 * 而且很容易把某个 `multi: true` 改没，那种错不报错、只是规则变形。
 *
 * 文案包必须整体包 IIFE：它和 knowledge.js 都是普通脚本，
 * 顶层 const 共用同一个全局词法作用域，裸写会 SyntaxError 且整页 JS 全挂。
 */

(function (root) {
  const locale = {
  "tag": "es",
  "name": "Español",
  "scenarios": [
    {
      "id": "writing",
      "name": "Redacción de contenido",
      "icon": "✍️",
      "desc": "Artículos, textos, historias, guiones",
      "keywords": [
        "artículo",
        "escrib",
        "escritura",
        "copywriting",
        "artículo de wechat",
        "blog",
        "zhihu",
        "xiaohongshu",
        "borrador",
        "novela",
        "historia",
        "guion",
        "guion",
        "tuit",
        "momentos de wechat",
        "ensayo",
        "reportaje",
        "publirreportaje",
        "titular"
      ]
    },
    {
      "id": "coding",
      "name": "Programación",
      "icon": "💻",
      "desc": "Escribir código, depurar, refactorizar",
      "keywords": [
        "código",
        "función",
        "método",
        "bug",
        "error",
        "excepción",
        "refactoriz",
        "api",
        "endpoint",
        "programa",
        "guion",
        "sql",
        "base de datos",
        "algoritmo",
        "frontend",
        "backend",
        "python",
        "javascript",
        "java",
        "react",
        "vue",
        "golang",
        "despliegue",
        "prueba unitaria",
        "optimización de rendimiento"
      ]
    },
    {
      "id": "analysis",
      "name": "Análisis e investigación",
      "icon": "📊",
      "desc": "Datos, investigación, criterio",
      "keywords": [
        "anal",
        "datos",
        "informe",
        "tendencia",
        "estadístic",
        "compar",
        "encuesta",
        "insight",
        "investigación",
        "evaluación",
        "estimación",
        "atribución",
        "predicción",
        "sector",
        "mercado",
        "competencia",
        "métrica",
        "conclusión"
      ]
    },
    {
      "id": "marketing",
      "name": "Marketing",
      "icon": "📣",
      "desc": "Promoción, recomendación, campañas",
      "keywords": [
        "marketing",
        "promoción",
        "recomendación",
        "publicidad",
        "pauta",
        "campaña",
        "dominio privado",
        "conversión",
        "póster",
        "slogan",
        "argumento de venta",
        "venta en directo",
        "transmisión en vivo",
        "crecimiento de usuarios",
        "referidos",
        "copy de campaña",
        "marca"
      ]
    },
    {
      "id": "learning",
      "name": "Enseñanza",
      "icon": "🎓",
      "desc": "Explicar, aprender, lenguaje sencillo",
      "keywords": [
        "explic",
        "explic",
        "enséñame",
        "aprend",
        "principiante",
        "divulgación",
        "curso",
        "apuntes",
        "resumen",
        "lenguaje sencillo",
        "pon un ejemplo",
        "qué es",
        "por qué",
        "cómo entender",
        "repasa",
        "conceptos clave",
        "feynman"
      ]
    },
    {
      "id": "business",
      "name": "Entorno laboral",
      "icon": "📈",
      "desc": "Propuestas, informes, comunicación",
      "keywords": [
        "propuesta",
        "informe",
        "ppt",
        "propuesta",
        "plan",
        "retrospectiva",
        "correo",
        "informe semanal",
        "informe mensual",
        "okr",
        "objetivo",
        "reunión",
        "acta",
        "evaluación de desempeño",
        "currículum",
        "entrevista",
        "proceso",
        "política",
        "negocio"
      ]
    },
    {
      "id": "creative",
      "name": "Ideación",
      "icon": "💡",
      "desc": "Ideas, nombres, lluvia de ideas",
      "keywords": [
        "creativ",
        "idea",
        "lluvia de ideas",
        "nombrar",
        "nombres",
        "poner nombre",
        "nombre",
        "eslogan",
        "lema",
        "ideación",
        "inspiración",
        "concepto",
        "diseño de concepto",
        "mecánica"
      ]
    },
    {
      "id": "general",
      "name": "General",
      "icon": "🧩",
      "desc": "Cualquier otra cosa",
      "keywords": []
    },
    {
      "id": "image",
      "name": "Generación de imágenes",
      "icon": "🎨",
      "desc": "Ilustraciones, pósteres, arte",
      "keywords": [
        "imagen",
        "imagen",
        "ilustración",
        "dibuja",
        "dibuja",
        "pinta",
        "dibuja una imagen",
        "genera una imagen",
        "saca una imagen",
        "texto a imagen",
        "ilustración para",
        "fondo de pantalla",
        "avatar",
        "logo",
        "icono",
        "dibujo",
        "pintura",
        "render",
        "arte conceptual",
        "arte conceptual",
        "imagen de producto",
        "foto de producto",
        "póster",
        "portada",
        "arte anime",
        "arte anime",
        "fotografía",
        "midjourney",
        "stable diffusion",
        "dall-e",
        "dalle",
        "Texto a imagen",
        "Imagen a imagen",
        "imagen de referencia",
        "retocar",
        "estilizado",
        "maqueta visual",
        "estilo ilustración",
        "dibujo a mano",
        "cyberpunk",
        "fotorrealista",
        "óleo",
        "tinta aguada",
        "look de película",
        "minimalista",
        "pixel art",
        "low poly",
        "composición",
        "profundidad de campo",
        "desenfoque",
        "Primer plano",
        "macro",
        "vista desde arriba",
        "ángulo bajo",
        "hora dorada",
        "tono de color",
        "atmósfera",
        "textura",
        "iluminación",
        "esquema de luces",
        "fondo desenfocado"
      ]
    },
    {
      "id": "video",
      "name": "Generación de vídeo",
      "icon": "🎬",
      "desc": "Cortometrajes, movimientos de cámara, storyboards",
      "keywords": [
        "vídeo",
        "vídeo corto",
        "cortometraje",
        "movimiento de cámara",
        "movimiento de cámara",
        "Generación de vídeo",
        "storyboard",
        "transición",
        "guion de vídeo",
        "varios planos",
        "cambio de plano",
        "corte entre planos",
        "plano continuo",
        "vídeo promocional",
        "spot publicitario",
        "cortometraje",
        "plano secuencia",
        "metraje",
        "b-roll",
        "mv",
        "sora",
        "runway",
        "kling",
        "jimeng",
        "pika",
        "veo",
        "texto a vídeo",
        "imagen a vídeo",
        "graba",
        "graba",
        "graba",
        "rodaje",
        "timelapse",
        "cámara lenta",
        "cámara lenta",
        "stop motion",
        "caminando",
        "corriendo",
        "sobrevolando",
        "cayendo",
        "acercamiento",
        "alejamiento",
        "paneo",
        "plano de seguimiento",
        "voz en off",
        "banda sonora",
        "efecto de sonido",
        "transición"
      ]
    }
  ],
  "questions": {
    "intent": {
      "id": "intent",
      "dim": "task",
      "title": "El núcleo de la tarea",
      "question": "¿Qué es lo único que quieres que la IA haga por ti?",
      "helper": "Elige la opción más cercana. Si no lo tienes claro, no pasa nada: puedes cambiarla en cualquier ronda posterior.",
      "multi": false,
      "perScenario": {
        "writing": [
          {
            "id": "write.create",
            "label": "Escribir desde cero",
            "hint": "Contenido original",
            "fragment": "El objetivo es producir desde cero un contenido original y completo, no solo un esquema o un montón de ideas."
          },
          {
            "id": "write.rewrite",
            "label": "Reescribir y pulir",
            "hint": "Mismo sentido, mejor redacción",
            "fragment": "Reescribe conservando por completo el sentido original y todos los datos, y mejora la calidad de la redacción. No añadas hechos que yo no haya confirmado."
          },
          {
            "id": "write.expand",
            "label": "Ampliar y profundizar",
            "hint": "Desarrolla lo que está flojo",
            "fragment": "Amplía sobre el contenido existente: añade detalles, ejemplos y argumentos, y desarrolla bien las partes esquemáticas. No empieces de cero."
          },
          {
            "id": "write.shorten",
            "label": "Recortar y destilar",
            "hint": "Que quede la mitad y se lea mejor",
            "fragment": "Comprime la extensión, conserva el mensaje central y los detalles clave, y elimina repeticiones, relleno y paja."
          },
          {
            "id": "write.outline",
            "label": "Armar el esquema",
            "hint": "Primero el esqueleto",
            "fragment": "Produce solo el esquema de la estructura y los puntos clave de cada sección. No lo redactes entero."
          }
        ],
        "coding": [
          {
            "id": "code.build",
            "label": "Implementar desde cero",
            "hint": "Código que pueda ejecutar",
            "fragment": "Dame una implementación completa que pueda ejecutar directamente, no pseudocódigo ni un fragmento ilustrativo."
          },
          {
            "id": "code.debug",
            "label": "Diagnosticar y arreglar",
            "hint": "Encuentra el problema real",
            "fragment": "Localiza la causa raíz y dame una solución, explicando por qué falla, y no solo el código ya corregido."
          },
          {
            "id": "code.refactor",
            "label": "Refactorizar",
            "hint": "Estructura más limpia",
            "fragment": "Refactoriza sin cambiar el comportamiento externo, mejorando la legibilidad, el mantenimiento y la escalabilidad."
          },
          {
            "id": "code.review",
            "label": "Revisión de código",
            "hint": "Encuentra los fallos",
            "fragment": "Revisa esto con rigor y enumera los problemas uno por uno, ordenados por gravedad, cada uno con su riesgo y una propuesta de cambio."
          },
          {
            "id": "code.explain",
            "label": "Explicar este código",
            "hint": "No lo entiendo",
            "fragment": "Explica cómo se ejecuta este código y por qué se diseñó así, centrándote en las partes que se malinterpretan con facilidad."
          },
          {
            "id": "code.test",
            "label": "Escribir tests",
            "hint": "Cubre los bordes",
            "fragment": "Escribe casos de prueba que cubran el camino normal, los casos límite y las entradas inválidas."
          }
        ],
        "analysis": [
          {
            "id": "an.insight",
            "label": "Sacar conclusiones de los datos",
            "hint": "Qué dicen los datos",
            "fragment": "Extrae de los datos las conclusiones que importan, señala lo que resulta contraintuitivo y di hasta dónde son fiables y dónde dejan de serlo."
          },
          {
            "id": "an.compare",
            "label": "Comparar opciones",
            "hint": "Ayúdame a elegir",
            "fragment": "Compara las opciones en paralelo, aclara cuándo aplica cada una y cuánto cuesta, y termina con una recomendación y su razonamiento."
          },
          {
            "id": "an.research",
            "label": "Investigar un tema",
            "hint": "Ver el panorama completo",
            "fragment": "Dame un repaso sistemático del tema: el estado actual, los actores principales, las variables clave y lo que sigue siendo incierto."
          },
          {
            "id": "an.diagnose",
            "label": "Análisis causal",
            "hint": "Por qué está pasando esto",
            "fragment": "Haz un análisis causal que separe los factores correlacionados de los que de verdad provocan el resultado, y explica cómo distinguirlos."
          },
          {
            "id": "an.forecast",
            "label": "Leer la tendencia",
            "hint": "Qué pasa después",
            "fragment": "Dame una lectura de hacia dónde va esto y el razonamiento que hay detrás, separando con claridad los hechos, la inferencia razonable y las conjeturas."
          }
        ],
        "marketing": [
          {
            "id": "mk.idea",
            "label": "Direcciones creativas",
            "hint": "Primero las ideas",
            "fragment": "Dame varias direcciones creativas distintas; para cada una, indica la propuesta central, el público objetivo y el gancho que la hace memorable."
          },
          {
            "id": "mk.copy",
            "label": "Texto promocional",
            "hint": "Listo para publicar",
            "fragment": "Produce texto promocional que pueda usar tal cual, escrito para encajar con el tono de la plataforma de destino y sin autobombo."
          },
          {
            "id": "mk.title",
            "label": "Afinar el titular",
            "hint": "Subir el porcentaje de clics",
            "fragment": "Dame varias opciones de titular que ataquen desde emociones distintas, e indica a quién le encaja cada una y qué riesgo tiene."
          },
          {
            "id": "mk.persona",
            "label": "Perfil del público",
            "hint": "Saber para quién es",
            "fragment": "Perfila al público objetivo: en qué situaciones reales está, cuáles son sus dolores principales, qué le frena a la hora de decidir y dónde se informa."
          },
          {
            "id": "mk.campaign",
            "label": "Plan de campaña",
            "hint": "Un plan completo",
            "fragment": "Dame un plan de campaña que se pueda ejecutar de verdad: la mecánica, el recorrido por el que se difunde, el gancho de conversión y cómo se mide el resultado."
          }
        ],
        "learning": [
          {
            "id": "ln.explain",
            "label": "Explicar un concepto",
            "hint": "Quiero entenderlo de verdad",
            "fragment": "Explícame este concepto hasta que lo entienda de verdad: empieza por la intuición y luego pasa a la versión rigurosa."
          },
          {
            "id": "ln.path",
            "label": "Planificar una ruta de aprendizaje",
            "hint": "¿En qué orden debería aprender?",
            "fragment": "Dame una ruta de aprendizaje paso a paso, marcando en cada etapa el foco, los hitos y los errores más habituales."
          },
          {
            "id": "ln.note",
            "label": "Convertirlo en apuntes",
            "hint": "Fácil de repasar",
            "fragment": "Organiza esto en una estructura de apuntes fácil de repasar, destacando la línea principal de razonamiento y los puntos que se olvidan."
          },
          {
            "id": "ln.quiz",
            "label": "Ponme a prueba",
            "hint": "Comprobar lo que sé",
            "fragment": "Plantea preguntas que pongan a prueba de verdad mi comprensión, con suficiente variedad para distinguir lo que sé de lo que adivino, y da las respuestas y las explicaciones al final."
          },
          {
            "id": "ln.summary",
            "label": "Resumir un documento",
            "hint": "Ve al grano",
            "fragment": "Destila el núcleo de este material, manteniendo la línea argumental del autor. No mezcles tu propia valoración."
          }
        ],
        "business": [
          {
            "id": "bz.proposal",
            "label": "Escribir una propuesta",
            "hint": "Tiene que aprobarse",
            "fragment": "Produce una propuesta bien estructurada cuya lógica aguante las preguntas de quien decide, dejando claros el valor, el coste y la viabilidad."
          },
          {
            "id": "bz.report",
            "label": "Preparar un informe",
            "hint": "Presentarlo hacia arriba",
            "fragment": "Organiza esto para una presentación: la conclusión primero y la evidencia recortada, para que pueda contarlo en poco tiempo."
          },
          {
            "id": "bz.review",
            "label": "Retrospectiva",
            "hint": "Qué funcionó y qué no",
            "fragment": "Haz una retrospectiva que separe lo que dependía de nosotros de lo que no, y señala qué prácticas merece la pena convertir en proceso."
          },
          {
            "id": "bz.mail",
            "label": "Redactar un mensaje",
            "hint": "Decirlo con claridad",
            "fragment": "Redacta el mensaje de modo que queden claros la petición, el contexto y el siguiente paso, con un tono adecuado pero una postura clara."
          },
          {
            "id": "bz.breakdown",
            "label": "Desglosar el objetivo",
            "hint": "Que sea accionable",
            "fragment": "Desglosa el objetivo en tareas ejecutables, con prioridades, dependencias y criterios de aceptación claros."
          }
        ],
        "creative": [
          {
            "id": "cr.brainstorm",
            "label": "lluvia de ideas",
            "hint": "Cuantas más, mejor",
            "fragment": "Haz una lluvia de ideas divergente: primero la cantidad, y las ideas deben diferenciarse claramente entre sí en vez de ser variantes de una misma ocurrencia."
          },
          {
            "id": "cr.naming",
            "label": "Nombres / eslóganes",
            "hint": "Que se diga solo",
            "fragment": "Dame varias opciones de nombre en distintas direcciones de estilo, explicando qué significa cada una y dónde encaja."
          },
          {
            "id": "cr.story",
            "label": "Esbozo de la historia",
            "hint": "Personajes y conflicto",
            "fragment": "Construye un marco narrativo con un conflicto central claro, la motivación de los personajes y el arco emocional."
          },
          {
            "id": "cr.concept",
            "label": "Concepto visual",
            "hint": "Describe la imagen",
            "fragment": "Dame una descripción del concepto con presencia visual real: sujeto, atmósfera, dirección de color y los elementos visuales clave."
          }
        ],
        "general": [
          {
            "id": "gn.organize",
            "label": "Organizar la información",
            "hint": "Que se entienda el desorden",
            "fragment": "Reorganiza esto en una estructura clara por categorías, quitando lo redundante y conservando los detalles clave."
          },
          {
            "id": "gn.generate",
            "label": "Generar contenido",
            "hint": "Dame el resultado directamente",
            "fragment": "Produce directamente contenido terminado y utilizable, no solo ideas o un marco."
          },
          {
            "id": "gn.judge",
            "label": "Analizar y juzgar",
            "hint": "Dame una conclusión",
            "fragment": "Dame un juicio claro y expón las razones clave que lo sostienen y las condiciones de las que depende."
          },
          {
            "id": "gn.solve",
            "label": "Resolver un problema",
            "hint": "Cómo conseguimos que funcione",
            "fragment": "Dame una ruta concreta para resolverlo, señalando los cuellos de botella y cómo superarlos."
          },
          {
            "id": "gn.decide",
            "label": "Tomar una decisión",
            "hint": "¿Cuál debería elegir?",
            "fragment": "Ayúdame a decidir: di qué opción recomiendas y qué tendría que cambiar para que otra elección fuera la correcta."
          }
        ],
        "image": [
          {
            "id": "im.intent.poster",
            "label": "Póster / imagen publicitaria",
            "hint": "Necesita foco y aire",
            "fragment": "Uso de póster comercial: el encuadre necesita un punto focal claro y la composición debe dejar espacio para el texto del titular"
          },
          {
            "id": "im.intent.social",
            "label": "Imagen para redes sociales",
            "hint": "Tiene que parar el scroll",
            "fragment": "Uso en redes sociales: tiene que captar la atención al primer vistazo dentro de un feed"
          },
          {
            "id": "im.intent.product",
            "label": "Imagen de producto",
            "hint": "Que el producto se vea bien",
            "fragment": "Uso de presentación de producto: hay que mostrar con claridad su aspecto, su material y sus detalles"
          },
          {
            "id": "im.intent.character",
            "label": "Retrato / personaje",
            "hint": "Proporciones correctas",
            "fragment": "Uso de diseño de personaje: rasgos claros, proporciones corporales correctas y postura natural"
          },
          {
            "id": "im.intent.concept",
            "label": "Exploración de conceptos",
            "hint": "Puedes arriesgar",
            "fragment": "Para explorar conceptos: puedes forzarlo, no hace falta que sea del todo realista"
          },
          {
            "id": "im.intent.art",
            "label": "Ilustración / obra de arte",
            "hint": "Expresión estilizada",
            "fragment": "Uso artístico: se anima a la expresión estilizada y a un lenguaje visual personal"
          },
          {
            "id": "im.intent.scene",
            "label": "Escenario / construcción de mundo",
            "hint": "Manda el entorno",
            "fragment": "Uso de diseño de escenario: el peso está en la atmósfera, la profundidad del espacio y un mundo que resulte creíble"
          }
        ],
        "video": [
          {
            "id": "vd.intent.ad",
            "label": "Anuncio / vídeo promocional",
            "hint": "Que se vea premium",
            "fragment": "Uso publicitario: la imagen necesita una textura de nivel comercial y un mensaje claro"
          },
          {
            "id": "vd.intent.short",
            "label": "Vídeo corto / redes sociales",
            "hint": "Engancha en los primeros 3 segundos",
            "fragment": "Uso en vídeo corto: los primeros tres segundos tienen que captar la atención y el ritmo debe ser ajustado"
          },
          {
            "id": "vd.intent.story",
            "label": "Historia / cortometraje",
            "hint": "Emoción y narración",
            "fragment": "Uso narrativo: un arco emocional claro y un lenguaje de cámara deliberado"
          },
          {
            "id": "vd.intent.anim",
            "label": "Animación / anime",
            "hint": "Estética anime",
            "fragment": "Estilo animado: líneas limpias y un estilo de dibujo consistente"
          },
          {
            "id": "vd.intent.product",
            "label": "Producto en movimiento",
            "hint": "Que el producto cobre vida",
            "fragment": "Uso de presentación de producto: hay que mostrar su forma, su material y el contexto de uso"
          },
          {
            "id": "vd.intent.mood",
            "label": "Atmósfera / b-roll",
            "hint": "Sin sujeto también vale",
            "fragment": "Uso como material de atmósfera: el foco está en el movimiento del entorno, los cambios de luz y la creación de ambiente; no hace falta un sujeto humano"
          }
        ]
      }
    },
    "role": {
      "id": "role",
      "dim": "role",
      "title": "Rol",
      "question": "¿Con qué identidad quieres que te responda la IA?",
      "helper": "La identidad define sus criterios, su forma de hablar y en qué se fija. Es el paso que más marca la diferencia en la calidad de la respuesta.",
      "multi": false,
      "options": [
        {
          "id": "role.expert",
          "label": "Experto de referencia en el sector",
          "hint": "Alguien con callo",
          "fragment": "Eres un experto de referencia con más de diez años de experiencia sobre el terreno en este campo. Combinas un criterio sistemático con pasos concretos y aplicables.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.critic",
          "label": "Revisor exigente",
          "hint": "Busca fallos, no halagos",
          "fragment": "Eres un revisor profesional de fama implacable. Tu trabajo es encontrar problemas, no que yo esté cómodo: mejor afilado que cortés.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.doer",
          "label": "Perfil ejecutor y pragmático",
          "hint": "Solo le importa si sale",
          "fragment": "Eres alguien que ejecuta sobre el terreno y solo se preocupa por una cosa: si se puede hacer, cómo exactamente y a qué coste. No te andas con teorías abstractas.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.coach",
          "label": "Coach paciente",
          "hint": "Me lleva paso a paso",
          "fragment": "Eres un coach paciente. Descompones los problemas complejos en pasos que puedo dar de inmediato y me avisas de antemano de los puntos donde la gente suele tropezar.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.researcher",
          "label": "Investigador neutral",
          "hint": "Solo pruebas, sin bando",
          "fragment": "Eres un investigador neutral y objetivo. Hablas solo desde pruebas fiables, no partes de una postura previa y, donde la evidencia es escasa, dices con claridad que ahí hay incertidumbre.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.user",
          "label": "Ponte en el lugar del usuario",
          "hint": "Piensa desde su situación",
          "fragment": "Ponte dentro de la situación real del usuario objetivo: qué sabe, qué le preocupa de verdad y cómo lo usaría en la práctica, en lugar de aconsejar desde la barrera.",
          "followUps": [
            "role.stance"
          ]
        },
        {
          "id": "role.beginner",
          "label": "Principiante total",
          "hint": "Pregunta como alguien de fuera",
          "fragment": "Responde como alguien que acaba de empezar: párate y pregunta cada vez que un término te resulte desconocido, no finjas que entiendes y no dejes pasar ningún salto lógico.",
          "followUps": [
            "role.stance"
          ]
        }
      ]
    },
    "role.stance": {
      "id": "role.stance",
      "dim": "role",
      "title": "Postura",
      "question": "¿Qué postura quieres que adopte al hablar?",
      "helper": "El mismo rol se puede ejercer con un tacto completamente distinto.",
      "multi": false,
      "options": [
        {
          "id": "stance.honest",
          "label": "Di lo incómodo",
          "hint": "Suelta el jarro de agua fría si hace falta",
          "fragment": "Si mi idea tiene un problema, dímelo sin rodeos. No lo maquilles solo por no herir mis sentimientos."
        },
        {
          "id": "stance.balanced",
          "label": "Neutral",
          "hint": "Las dos caras, claras",
          "fragment": "Presenta con objetividad las dos caras, lo bueno y lo malo. No infles lo favorable solo por quedar bien conmigo."
        },
        {
          "id": "stance.supportive",
          "label": "Constructiva",
          "hint": "Primero lo que vale, luego lo mejorable",
          "fragment": "Exprésalo de forma constructiva: primero lo que funciona y después lo que se puede mejorar."
        },
        {
          "id": "stance.challenge",
          "label": "Cuestióname",
          "hint": "Llévame la contraria",
          "fragment": "Cuestiona mis supuestos por iniciativa propia y señala los puntos ciegos que puedo haber pasado por alto, aunque no te lo haya pedido."
        }
      ]
    },
    "audience": {
      "id": "audience",
      "dim": "context",
      "title": "Público",
      "question": "¿Para quién es este contenido en última instancia?",
      "helper": "El mismo contenido, para públicos distintos, exige un enfoque y una profundidad completamente distintos.",
      "multi": false,
      "options": [
        {
          "id": "aud.public",
          "label": "Principiantes absolutos",
          "hint": "Sin ningún tipo de base",
          "fragment": "El público no tiene ningún conocimiento del tema. Cualquier término técnico hay que explicarlo en lenguaje cotidiano la primera vez que aparezca.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.peer",
          "label": "Colegas / profesionales",
          "hint": "Se puede entrar en detalle",
          "fragment": "El público son colegas con el mismo nivel profesional. Puedes usar términos técnicos y convenciones del sector sin preámbulos explicativos.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.decision",
          "label": "Quien decide",
          "hint": "Conclusiones y costes",
          "fragment": "El público son responsables que tienen que decidir. Andan mal de tiempo y lo que les importa es la conclusión, el coste, el riesgo y lo que necesitan aprobar.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.client",
          "label": "Clientes",
          "hint": "Profesional pero fácil de seguir",
          "fragment": "El público es el cliente. Hay que sonar profesional y creíble sin obligarle a hacer un esfuerzo por entenderlo.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.student",
          "label": "Estudiantes / principiantes",
          "hint": "Respeta el ritmo de aprendizaje",
          "fragment": "El público está aprendiendo. Ve de lo sencillo a lo profundo, con ejemplos y contrastes, y no le sueltes demasiados conceptos de golpe.",
          "followUps": [
            "audience.term"
          ]
        },
        {
          "id": "aud.self",
          "label": "Solo para mí",
          "hint": "Borrador interno, sin cortesías",
          "fragment": "Esto es un borrador de trabajo para mí. No hace falta ningún relleno de cortesía: cuanto más densa sea la información, mejor.",
          "followUps": [
            "audience.term"
          ]
        }
      ]
    },
    "audience.term": {
      "id": "audience.term",
      "dim": "context",
      "title": "Cómo tratar los términos",
      "question": "¿Qué hacemos cuando aparece un término técnico?",
      "helper": "Esto es lo que decide si el texto suena distante o no.",
      "multi": false,
      "options": [
        {
          "id": "term.explain",
          "label": "Explícalo la primera vez",
          "hint": "Una frase sencilla",
          "fragment": "Cuando un término técnico aparezca por primera vez, dale una explicación sencilla en una frase. Después ya se puede usar con libertad."
        },
        {
          "id": "term.direct",
          "label": "Úsalos tal cual",
          "hint": "El lector los conoce",
          "fragment": "Se pueden usar los términos técnicos directamente, sin explicación extra, lo que ahorra espacio."
        },
        {
          "id": "term.bilingual",
          "label": "Término y aclaración",
          "hint": "Añade una aclaración sencilla",
          "fragment": "En los términos clave, escribe el término y añade una breve aclaración en lenguaje llano la primera vez que aparezca."
        },
        {
          "id": "term.avoid",
          "label": "Evítalos si puedes",
          "hint": "Todo en lenguaje llano",
          "fragment": "Evita los términos técnicos siempre que puedas. Si alguno no tiene reemplazo, explícalo con una comparación cotidiana."
        }
      ]
    },
    "format": {
      "id": "format",
      "dim": "format",
      "title": "Forma de salida",
      "question": "¿Cómo quieres que sea el resultado final?",
      "helper": "Es el paso que más se pasa por alto y el que más afecta al resultado. Si eliges mal la forma, el contenido puede ser bueno y aun así no servir.",
      "multi": false,
      "options": [
        {
          "id": "fmt.report",
          "label": "Informe estructurado",
          "hint": "Con secciones y conclusión",
          "fragment": "Preséntalo como un informe estructurado, dividido en secciones con encabezados de nivel 2 de Markdown y una jerarquía clara.",
          "followUps": [
            "format.report.length",
            "format.report.structure"
          ]
        },
        {
          "id": "fmt.checklist",
          "label": "Lista de pasos",
          "hint": "Solo hay que seguirla",
          "fragment": "Preséntalo como pasos numerados, cada uno una acción que se pueda ejecutar directamente.",
          "followUps": [
            "format.checklist.granularity"
          ]
        },
        {
          "id": "fmt.dialogue",
          "label": "Lenguaje llano, como una conversación",
          "hint": "Sin subtítulos ni listas",
          "fragment": "Responde con párrafos naturales y fluidos, como si hablaras cara a cara. No uses subtítulos, viñetas ni listas numeradas.",
          "followUps": [
            "format.dialogue.length"
          ]
        },
        {
          "id": "fmt.table",
          "label": "Tabla comparativa",
          "hint": "Ver las diferencias de un vistazo",
          "fragment": "Presenta la comparación como una tabla de Markdown, para poder leer las opciones en paralelo.",
          "followUps": [
            "format.table.dimension"
          ]
        },
        {
          "id": "fmt.article",
          "label": "Artículo completo",
          "hint": "Listo para publicar",
          "fragment": "Entrega un texto completo y bien estructurado, listo para publicar, sin nada que yo tenga que rellenar.",
          "followUps": [
            "format.article.length",
            "format.article.structure"
          ]
        },
        {
          "id": "fmt.code",
          "label": "Código + explicación",
          "hint": "Tiene que ejecutarse",
          "fragment": "Entrega código completo y ejecutable, con los comentarios necesarios en los puntos clave.",
          "followUps": [
            "format.code.language",
            "format.code.comments"
          ]
        },
        {
          "id": "fmt.outline",
          "label": "Esquema / mapa mental",
          "hint": "Solo el esqueleto",
          "fragment": "Entrega solo un esquema bien jerarquizado, usando listas anidadas para las relaciones. No lo desarrolles en frases completas.",
          "followUps": [
            "format.outline.depth"
          ]
        },
        {
          "id": "fmt.message",
          "label": "Correo / mensaje",
          "hint": "Listo para enviar",
          "fragment": "Entrega un mensaje completo listo para enviar, con un saludo y un cierre adecuados.",
          "followUps": [
            "format.message.tone"
          ]
        },
        {
          "id": "fmt.slides",
          "label": "Esquema de diapositivas",
          "hint": "Una idea por diapositiva",
          "fragment": "Organiza el contenido diapositiva a diapositiva, con un título y de tres a cinco puntos breves en cada una.",
          "followUps": [
            "format.slides.count"
          ]
        }
      ]
    },
    "format.report.length": {
      "id": "format.report.length",
      "dim": "format",
      "title": "Extensión del informe",
      "question": "¿Cuánto debería ocupar el informe?",
      "multi": false,
      "options": [
        {
          "id": "rlen.short",
          "label": "Breve · menos de una página",
          "hint": "Solo la conclusión y las pruebas clave",
          "fragment": "Mantén todo por debajo de 800 palabras, con solo la conclusión y los dos o tres argumentos que más pesan."
        },
        {
          "id": "rlen.mid",
          "label": "Estándar · dos o tres páginas",
          "hint": "Pruebas completas, sin relleno",
          "fragment": "Unas 1200-1800 palabras, con pruebas completas y sin una sola frase que no aporte información."
        },
        {
          "id": "rlen.long",
          "label": "Detallado · cinco páginas o más",
          "hint": "Contexto, razonamiento y riesgos, todo cubierto",
          "fragment": "Al menos 2500 palabras, cubriendo el contexto, el análisis, el razonamiento, los riesgos y las recomendaciones."
        }
      ]
    },
    "format.report.structure": {
      "id": "format.report.structure",
      "dim": "format",
      "title": "Qué debe incluir el informe",
      "question": "¿Qué partes tiene que incluir el informe?",
      "helper": "Puedes marcar varias.",
      "multi": true,
      "options": [
        {
          "id": "rstr.conclusion",
          "label": "Conclusión primero",
          "hint": "El veredicto al principio",
          "fragment": "Abre con un breve resumen de la conclusión, para que quien lea sepa el juicio central en tres segundos."
        },
        {
          "id": "rstr.evidence",
          "label": "Argumentos con pruebas",
          "hint": "Cada afirmación respaldada",
          "fragment": "Cada argumento debe ir seguido de pruebas, datos o casos concretos. No se admiten afirmaciones sin respaldo."
        },
        {
          "id": "rstr.table",
          "label": "Tablas de datos",
          "hint": "Pon las cifras en una tabla",
          "fragment": "Presenta los datos clave en tablas, con encabezados y unidades claros."
        },
        {
          "id": "rstr.risk",
          "label": "Riesgos y la otra cara",
          "hint": "Di también dónde puede salir mal",
          "fragment": "Dedica una sección aparte a los riesgos, las opiniones contrarias y las condiciones que darían la vuelta a la conclusión."
        },
        {
          "id": "rstr.action",
          "label": "Lista de acciones",
          "hint": "Termina con los siguientes pasos",
          "fragment": "Termina con una lista de acciones ejecutables, cada una con el rol responsable y su prioridad."
        },
        {
          "id": "rstr.open",
          "label": "Preguntas abiertas",
          "hint": "Enumera lo que aún tengo que decidir",
          "fragment": "Termina con las preguntas que aún necesitan mi confirmación o más información. No des nada por supuesto en mi lugar."
        }
      ]
    },
    "format.checklist.granularity": {
      "id": "format.checklist.granularity",
      "dim": "format",
      "title": "Nivel de detalle de los pasos",
      "question": "¿Hasta qué punto hay que desglosar los pasos?",
      "multi": false,
      "options": [
        {
          "id": "cgran.coarse",
          "label": "Grueso · 3-5 pasos",
          "hint": "El tronco principal",
          "fragment": "Divide el proceso en tres a cinco pasos grandes, cada uno con una frase que explique su objetivo."
        },
        {
          "id": "cgran.medium",
          "label": "Medio · cada paso explicado",
          "hint": "Suficiente para seguirlo",
          "fragment": "Bajo cada paso, añade tres cosas: qué hacer, cómo hacerlo y cómo se ve cuando está terminado."
        },
        {
          "id": "cgran.fine",
          "label": "Fino · para ir marcando",
          "hint": "Tan detallado que no haya que pensar",
          "fragment": "Divide cada paso en acciones atómicas que se puedan ir marcando, incluyendo las herramientas, los parámetros o las palabras exactas."
        }
      ]
    },
    "format.dialogue.length": {
      "id": "format.dialogue.length",
      "dim": "format",
      "title": "Longitud de la respuesta",
      "question": "¿Cuánto quieres que ocupe la respuesta?",
      "multi": false,
      "options": [
        {
          "id": "dlen.short",
          "label": "Unas pocas frases",
          "hint": "Sin preámbulos",
          "fragment": "Que toda la respuesta quepa en 200 palabras. Ve directo a lo importante, sin ningún preámbulo."
        },
        {
          "id": "dlen.mid",
          "label": "Uno o dos párrafos",
          "hint": "Lo justo para que quede claro",
          "fragment": "Dilo en uno o dos párrafos, de 300 a 500 palabras."
        },
        {
          "id": "dlen.long",
          "label": "Desarróllalo",
          "hint": "Unas cuantas capas más",
          "fragment": "Puedes profundizar unas cuantas capas más, pero mantén párrafos naturales en vez de convertirlo en una lista."
        }
      ]
    },
    "format.table.dimension": {
      "id": "format.table.dimension",
      "dim": "format",
      "title": "Dimensiones de la comparación",
      "question": "¿Qué dimensiones debe comparar la tabla?",
      "multi": true,
      "options": [
        {
          "id": "tdim.core",
          "label": "Rasgos principales",
          "hint": "Qué es cada uno",
          "fragment": "La tabla debe incluir una columna «Rasgos principales», resumida en una frase."
        },
        {
          "id": "tdim.pro",
          "label": "Ventajas",
          "hint": "Dónde gana",
          "fragment": "La tabla debe incluir una columna «Ventajas»."
        },
        {
          "id": "tdim.con",
          "label": "Límites / coste",
          "hint": "Dónde se queda corto",
          "fragment": "La tabla debe incluir una columna «Límites o coste». Sé sincero en ella: no la dejes en blanco."
        },
        {
          "id": "tdim.scene",
          "label": "Cuándo usarlo",
          "hint": "Cuándo encaja",
          "fragment": "La tabla debe incluir una columna «Cuándo usarlo», indicando en qué condiciones es la opción correcta."
        },
        {
          "id": "tdim.cost",
          "label": "Coste / barrera",
          "hint": "Qué hace falta",
          "fragment": "La tabla debe incluir una columna «Coste o barrera», con el tiempo, el dinero y el esfuerzo de aprendizaje."
        },
        {
          "id": "tdim.verdict",
          "label": "Mi recomendación",
          "hint": "El veredicto en la última columna",
          "fragment": "La última columna da una «Recomendación», diciendo con claridad si se aconseja o no."
        }
      ]
    },
    "format.article.length": {
      "id": "format.article.length",
      "dim": "format",
      "title": "Extensión del artículo",
      "question": "¿Cuánto debería ocupar el artículo?",
      "multi": false,
      "options": [
        {
          "id": "alen.short",
          "label": "Corto · unas 800 palabras",
          "hint": "Una idea bien desarrollada",
          "fragment": "Unas 800 palabras, construidas en torno a una única idea central."
        },
        {
          "id": "alen.mid",
          "label": "Medio · 1500-2000 palabras",
          "hint": "Longitud habitual de un artículo",
          "fragment": "Unas 1500-2000 palabras, con un arco completo: planteamiento, desarrollo, giro y cierre."
        },
        {
          "id": "alen.long",
          "label": "Largo · 3000 palabras o más",
          "hint": "Contenido profundo",
          "fragment": "Al menos 3000 palabras, con una argumentación que avance capa a capa y suficientes ejemplos concretos."
        }
      ]
    },
    "format.article.structure": {
      "id": "format.article.structure",
      "dim": "format",
      "title": "Estructura del artículo",
      "question": "¿Qué estructura debe tener el artículo?",
      "multi": false,
      "options": [
        {
          "id": "astr.hook",
          "label": "Gancho → desarrollo → cierre",
          "hint": "Pensado para difundirse",
          "fragment": "Abre con una escena concreta, un dato contraintuitivo o una pregunta afilada que atrape a quien lee. Desarrolla el argumento en el medio y vuelve al tema al final."
        },
        {
          "id": "astr.story",
          "label": "Una historia de principio a fin",
          "hint": "Enlazado con un solo caso",
          "fragment": "Lleva todo el texto sobre una historia o un caso, integrando las ideas en la narración en vez de escribir un tratado."
        },
        {
          "id": "astr.list",
          "label": "Secciones paralelas",
          "hint": "Bien organizado",
          "fragment": "Organiza el texto en secciones paralelas, cada una con sentido propio, para que se pueda leer a saltos."
        },
        {
          "id": "astr.q",
          "label": "Guiado por preguntas",
          "hint": "Sigue preguntando",
          "fragment": "Impulsa el texto con una cadena de preguntas: cada respuesta abre la siguiente, creando un ritmo que avanza paso a paso."
        }
      ]
    },
    "format.code.language": {
      "id": "format.code.language",
      "dim": "format",
      "title": "Lenguaje / stack",
      "question": "¿En qué lenguaje o stack?",
      "multi": false,
      "options": [
        {
          "id": "clang.unspecified",
          "label": "No lo has dicho: que elija la IA",
          "hint": "Elegirá el más común",
          "fragment": "Cuando no se especifique el stack, elige la opción más extendida y con mejor respaldo de la comunidad, y explica tu elección al principio."
        },
        {
          "id": "clang.python",
          "label": "Python",
          "hint": "",
          "fragment": "Impleméntalo en Python, siguiendo el estilo PEP 8."
        },
        {
          "id": "clang.js",
          "label": "JavaScript / TypeScript",
          "hint": "",
          "fragment": "Impleméntalo en JavaScript o TypeScript, siguiendo las convenciones modernas de ES."
        },
        {
          "id": "clang.other",
          "label": "Otro (lo indicaré yo)",
          "hint": "",
          "fragment": ""
        }
      ]
    },
    "format.code.comments": {
      "id": "format.code.comments",
      "dim": "format",
      "title": "Cómo se explica el código",
      "question": "¿Cómo quieres que te explique el código?",
      "multi": false,
      "options": [
        {
          "id": "ccmt.inline",
          "label": "Comentarios en los puntos clave",
          "hint": "El código debería hablarse solo",
          "fragment": "Añade comentarios en línea en la lógica clave, explicando por qué está escrito así y no qué hace cada línea."
        },
        {
          "id": "ccmt.after",
          "label": "Explicación después del código",
          "hint": "Cuenta el enfoque aparte",
          "fragment": "Después del código, añade un apartado aparte que explique el enfoque general, las decisiones clave y los posibles escollos."
        },
        {
          "id": "ccmt.both",
          "label": "Las dos cosas",
          "hint": "Comentarios y explicación",
          "fragment": "Añade comentarios en línea en los puntos clave y, después del código, un apartado con el enfoque general."
        },
        {
          "id": "ccmt.none",
          "label": "Solo el código",
          "hint": "Ya lo leo yo",
          "fragment": "Entrega solo el código, sin explicación adicional."
        }
      ]
    },
    "format.outline.depth": {
      "id": "format.outline.depth",
      "dim": "format",
      "title": "Profundidad del esquema",
      "question": "¿Hasta cuántos niveles debe llegar el esquema?",
      "multi": false,
      "options": [
        {
          "id": "odep.two",
          "label": "Con dos niveles basta",
          "hint": "Secciones + puntos",
          "fragment": "Con dos niveles basta; el segundo nivel debe usar frases cortas en lugar de oraciones completas."
        },
        {
          "id": "odep.three",
          "label": "Tres niveles",
          "hint": "Hasta los subpuntos",
          "fragment": "Tres niveles, con el tercero lo bastante concreto como para ponerse a escribir directamente."
        },
        {
          "id": "odep.withNote",
          "label": "Tres niveles + qué cubre cada sección",
          "hint": "Con notas de escritura",
          "fragment": "Sobre el esquema jerárquico, añade una frase por sección que diga qué trata y con qué material."
        }
      ]
    },
    "format.message.tone": {
      "id": "format.message.tone",
      "dim": "format",
      "title": "Para qué es el mensaje",
      "question": "¿Qué pretende conseguir este mensaje?",
      "multi": false,
      "options": [
        {
          "id": "mtone.push",
          "label": "Mover las cosas",
          "hint": "Que actúe",
          "fragment": "El objetivo es que las cosas avancen. El cierre debe dar un siguiente paso claro y un plazo esperado."
        },
        {
          "id": "mtone.explain",
          "label": "Informar",
          "hint": "Que se entere",
          "fragment": "El objetivo es informar. Lo importante es dejar claros el contexto, la situación actual y el impacto. No hace falta respuesta inmediata."
        },
        {
          "id": "mtone.negotiate",
          "label": "Pedir recursos / negociar",
          "hint": "Convencerle",
          "fragment": "El objetivo es ganar apoyo. Explica primero qué gana la otra parte y luego plantea lo que pido."
        },
        {
          "id": "mtone.apologize",
          "label": "Explicar un problema / disculparse",
          "hint": "Gestionar malas noticias",
          "fragment": "El objetivo es gestionar una situación negativa. Asume la responsabilidad primero, explica cómo está la cosa y luego ofrece una solución. No te justifiques."
        }
      ]
    },
    "format.slides.count": {
      "id": "format.slides.count",
      "dim": "format",
      "title": "Número de páginas",
      "question": "¿Cuántas páginas hacen falta?",
      "multi": false,
      "options": [
        {
          "id": "scnt.short",
          "label": "5-8 páginas",
          "hint": "Informe breve",
          "fragment": "Que quepa en cinco a ocho páginas, con una sola idea por página."
        },
        {
          "id": "scnt.mid",
          "label": "10-15 páginas",
          "hint": "Propuesta estándar",
          "fragment": "De diez a quince páginas, con contexto, propuesta, respaldo y conclusión completos."
        },
        {
          "id": "scnt.long",
          "label": "Más de 20 páginas",
          "hint": "Un plan completo",
          "fragment": "Veinte páginas o más, con el argumento detallado, los datos de respaldo y un anexo."
        }
      ]
    },
    "tone": {
      "id": "tone",
      "dim": "style",
      "title": "Tono",
      "question": "¿Con qué tono quieres que te hable?",
      "helper": "El tono decide si esto suena a una persona hablando, y es donde más se concentra el deje de IA.",
      "multi": false,
      "options": [
        {
          "id": "tone.pro",
          "label": "Profesional y riguroso",
          "hint": "Medido y preciso",
          "fragment": "Tono profesional y riguroso, con un vocabulario preciso y medido. Evita el lenguaje emocional y las exageraciones."
        },
        {
          "id": "tone.warm",
          "label": "Cercano y natural",
          "hint": "Como charlar con un amigo",
          "fragment": "Cercano y natural, como una charla entre amigos. Se permiten expresiones coloquiales y algo de emoción."
        },
        {
          "id": "tone.sharp",
          "label": "Directo y afilado",
          "hint": "Sin rodeos",
          "fragment": "Directo y afilado. Ve al grano, déjate las cortesías y toma partido cuando haya que tomarlo."
        },
        {
          "id": "tone.humor",
          "label": "Ligero y con gracia",
          "hint": "Que saque una sonrisa",
          "fragment": "Ligero y con humor. Las comparaciones y los chistes ayudan a bajar la barrera, pero nunca sacrifiques contenido por hacer gracia."
        },
        {
          "id": "tone.calm",
          "label": "Frío y objetivo",
          "hint": "Sin carga emocional",
          "fragment": "Frío y objetivo. Expón solo los hechos y el razonamiento, sin sesgo emocional."
        },
        {
          "id": "tone.vivid",
          "label": "Evocador",
          "hint": "Que se vea",
          "fragment": "Escribe de forma evocadora, con imágenes y detalles concretos, para que quien lea pueda ver lo que describes."
        }
      ]
    },
    "depth": {
      "id": "depth",
      "dim": "style",
      "title": "Nivel de detalle",
      "question": "¿Hasta qué punto quieres que entre en detalle?",
      "helper": "El nivel de detalle decide si el resultado se puede usar tal cual: si quieres una conclusión, no le pidas una tesis.",
      "multi": false,
      "options": [
        {
          "id": "depth.min",
          "label": "Mínimo",
          "hint": "Solo la conclusión",
          "fragment": "Da solo la conclusión y la explicación mínima imprescindible. No desarrolles el razonamiento.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.light",
          "label": "Conciso",
          "hint": "Conclusión + razones clave",
          "fragment": "Da la conclusión con las dos o tres razones que más pesan. Omite el resto.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.mid",
          "label": "Intermedio",
          "hint": "Argumentación completa",
          "fragment": "Desarrolla la argumentación completa, dejando claras tanto las afirmaciones como las pruebas que las sostienen.",
          "followUps": [
            "depth.why"
          ]
        },
        {
          "id": "depth.deep",
          "label": "En profundidad",
          "hint": "Razonamiento, límites y contraejemplos",
          "fragment": "Entra a fondo: la deducción, hasta dónde aplica, contraejemplos y lo que sigue siendo incierto.",
          "followUps": [
            "depth.why"
          ]
        }
      ]
    },
    "depth.why": {
      "id": "depth.why",
      "dim": "style",
      "title": "¿Explicar el porqué?",
      "question": "¿Hace falta que explique el porqué?",
      "multi": false,
      "options": [
        {
          "id": "why.no",
          "label": "No, con la respuesta basta",
          "hint": "Solo quiero el resultado",
          "fragment": "No hace falta explicar el razonamiento. Da la respuesta directamente."
        },
        {
          "id": "why.key",
          "label": "Solo el paso clave",
          "hint": "Lo justo",
          "fragment": "Explica el motivo solo en el paso que más importa o que se malinterpreta con más facilidad. Del resto, pasa."
        },
        {
          "id": "why.full",
          "label": "Sí, a fondo",
          "hint": "Quiero aprender el método",
          "fragment": "Explica a fondo el principio que hay detrás y toda la cadena de razonamiento, para que no me quede solo con la respuesta sino también con el método."
        }
      ]
    },
    "constraints": {
      "id": "constraints",
      "dim": "constraint",
      "title": "Restricciones firmes",
      "question": "¿Qué no debe pasar nunca y qué tiene que cumplirse siempre?",
      "helper": "Puedes marcar varias o ninguna. Son las barandillas que evitan que la IA se desvíe.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "con.nogreet",
          "label": "Sin preámbulos ni cortesías",
          "hint": "Nada de «buena pregunta»",
          "fragment": "Sin preámbulos, sin cortesías y sin repetir mi pregunta. Empieza directamente por el contenido."
        },
        {
          "id": "con.norepeat",
          "label": "No repitas mi pregunta",
          "hint": "Responde sin más",
          "fragment": "No repitas ni reformules mi pregunta. Ve directo a la respuesta."
        },
        {
          "id": "con.nohallucinate",
          "label": "Di cuando no estés seguro",
          "hint": "No te lo inventes",
          "fragment": "Si falta información o no estás seguro, di claramente que ahí no lo tienes claro. Queda prohibido inventar datos, fuentes o hechos."
        },
        {
          "id": "con.nodigress",
          "label": "No te salgas del tema",
          "hint": "No te vayas por las ramas",
          "fragment": "No te extiendas hacia contenidos que no vienen al caso ni amplíes por tu cuenta el alcance de lo que te pido."
        },
        {
          "id": "con.nosummary",
          "label": "Sin resumen final",
          "hint": "No lo repitas todo otra vez",
          "fragment": "No cierres con un resumen, ni eleves el tono, ni repitas lo ya dicho. Cuando termines, para."
        },
        {
          "id": "con.wordlimit",
          "label": "Respeta la extensión al pie de la letra",
          "hint": "Pasarse es fallar",
          "fragment": "Cumple exactamente la extensión que te he dado. Pasarse o quedarse corto cuentan como no haber hecho la tarea."
        },
        {
          "id": "con.source",
          "label": "Cita la fuente de los hechos",
          "hint": "O márcalos como inciertos",
          "fragment": "Siempre que haya cifras, fechas, nombres o conclusiones de estudios concretos, cita la fuente. Lo que no puedas confirmar, márcalo claramente como pendiente de verificar."
        },
        {
          "id": "con.noemoji",
          "label": "Sin emoji ni adornos",
          "hint": "Texto plano",
          "fragment": "No uses emoji ni símbolos decorativos."
        },
        {
          "id": "con.noask",
          "label": "No me devuelvas preguntas",
          "hint": "Usa tu criterio",
          "fragment": "No me hagas preguntas ni me pidas más información. Haz la suposición más razonable con lo que tienes y di qué has supuesto.",
          "group": "ask"
        },
        {
          "id": "con.askfirst",
          "label": "Si falta información, pregúntame antes",
          "hint": "No adivines",
          "fragment": "Si falta información clave, hazme primero las una a tres preguntas más necesarias y espera mi respuesta antes de empezar. No arranques a base de suposiciones.",
          "group": "ask"
        }
      ]
    },
    "antiAi": {
      "id": "antiAi",
      "dim": "constraint",
      "title": "Quitar el tono de IA",
      "question": "¿Quieres que le quitemos ese deje de IA?",
      "helper": "Es la parte que más importa a mucha gente. Lo que marques se convierte en una prohibición de escritura explícita.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ai.cliche",
          "label": "Prohíbe las muletillas",
          "hint": "«en primer lugar», «cabe destacar»",
          "fragment": "Prohibido usar estas muletillas: «en primer lugar / en segundo lugar / por último», «cabe destacar que», «en definitiva», «en resumen», «en la sociedad actual», «con el desarrollo de», «vamos allá», «espero que te sirva de ayuda»."
        },
        {
          "id": "ai.parallel",
          "label": "Sin series de tres",
          "hint": "No encadenes tres de todo",
          "fragment": "No uses series retóricas de tres elementos ni estructuras simétricas buscadas a propósito, y no amontones frases cortas solo por dar ritmo."
        },
        {
          "id": "ai.antithesis",
          "label": "Sin antítesis",
          "hint": "«no es A, sino B»",
          "fragment": "No uses construcciones de antítesis como «no es A, sino B» o «más que X, es Y»."
        },
        {
          "id": "ai.rhythm",
          "label": "Varía la longitud de las frases",
          "hint": "Rompe el metrónomo",
          "fragment": "La longitud de las frases debe variar de forma perceptible. Se permiten frases cortas e incluso incompletas. Evita un ritmo mecánicamente uniforme."
        },
        {
          "id": "ai.concrete",
          "label": "Nombres y verbos concretos",
          "hint": "Menos adjetivos",
          "fragment": "Prefiere nombres y verbos concretos antes que adjetivos, adverbios y abstracciones. Cuando un ejemplo lo deje claro, no generalices."
        },
        {
          "id": "ai.colloquial",
          "label": "Permite coloquialismos y frases sueltas",
          "hint": "Que parezca escrito por una persona",
          "fragment": "Se permiten expresiones coloquiales, incisos y frases elípticas. No hace falta que cada frase sea completa y correcta."
        },
        {
          "id": "ai.noperpara",
          "label": "No resumas cada párrafo",
          "hint": "No cierres cada frase",
          "fragment": "No termines todos los párrafos con una frase de resumen. Deja que el contenido avance solo."
        },
        {
          "id": "ai.hedge",
          "label": "Menos matices vagos",
          "hint": "«en cierta medida», «de algún modo»",
          "fragment": "Usa menos matices vagos del tipo «en cierta medida», «de algún modo» o «en cierto sentido»."
        },
        {
          "id": "ai.emotion",
          "label": "Sin grandilocuencia forzada",
          "hint": "No infles el tema",
          "fragment": "No infles el tema ni busques un clímax emocional al final. Para donde toca parar."
        },
        {
          "id": "ai.contrast",
          "label": "Cuidado con las rayas",
          "hint": "— no abuses",
          "fragment": "No abuses de la raya para introducir aclaraciones o giros. Usa una estructura de frase normal."
        }
      ]
    },
    "examples": {
      "id": "examples",
      "dim": "example",
      "title": "Ejemplos",
      "question": "¿Quieres que ponga un ejemplo antes?",
      "helper": "Un ejemplo es la forma más eficaz de alinear: reduce muchísimo el ir y venir.",
      "multi": false,
      "options": [
        {
          "id": "ex.good",
          "label": "Primero uno o dos buenos ejemplos",
          "hint": "Luego iguala esa sensación",
          "fragment": "Antes de la salida definitiva, muestra uno o dos buenos ejemplos que dejen claro qué significa hacerlo bien, y luego produce el contenido con ese estándar."
        },
        {
          "id": "ex.contrast",
          "label": "Ejemplos buenos y malos",
          "hint": "Un ejemplo de lo que no hay que hacer",
          "fragment": "Antes de la salida definitiva, da un ejemplo bueno y uno malo, y explica qué falla en el malo."
        },
        {
          "id": "ex.none",
          "label": "No, directo",
          "hint": "No perdamos tiempo",
          "fragment": "No hacen falta ejemplos. Da directamente el contenido final."
        }
      ]
    },
    "img.subject": {
      "id": "img.subject",
      "dim": "subject",
      "title": "Sujeto",
      "question": "¿Qué es lo más importante de la imagen?",
      "helper": "El sujeto es el ancla de toda la imagen. Déjalo claro primero; solo entonces el estilo y la luz significan algo.",
      "multi": false,
      "options": [
        {
          "id": "isub.person",
          "label": "Persona",
          "hint": "Retratos, personajes",
          "fragment": "el sujeto principal es una persona",
          "followUps": [
            "img.subject.person"
          ]
        },
        {
          "id": "isub.animal",
          "label": "Animal",
          "hint": "Mascotas, fauna salvaje",
          "fragment": "el sujeto principal es un animal",
          "followUps": [
            "img.subject.animal"
          ]
        },
        {
          "id": "isub.product",
          "label": "Producto / bodegón",
          "hint": "Artículos, objetos",
          "fragment": "el sujeto principal es un producto o un bodegón",
          "followUps": [
            "img.subject.product"
          ]
        },
        {
          "id": "isub.scene",
          "label": "Paisaje / escena",
          "hint": "Naturaleza, ciudad, espacio",
          "fragment": "el sujeto principal es un entorno o una escena, sin ninguna persona destacada"
        },
        {
          "id": "isub.arch",
          "label": "Arquitectura / espacio",
          "hint": "Interiores, exteriores",
          "fragment": "el sujeto principal es un espacio arquitectónico y hay que dejar claras su estructura y su perspectiva"
        },
        {
          "id": "isub.food",
          "label": "Comida",
          "hint": "Platos, bebidas",
          "fragment": "el sujeto principal es comida y hay que destacar su color y una textura apetitosa"
        },
        {
          "id": "isub.vehicle",
          "label": "Máquina / vehículo",
          "hint": "Coches, mechas, naves",
          "fragment": "el sujeto principal es una máquina o un vehículo y hay que mostrar el detalle estructural y las superficies metálicas"
        },
        {
          "id": "isub.abstract",
          "label": "Concepto abstracto",
          "hint": "Emociones, ideas hechas imagen",
          "fragment": "el sujeto principal es una visualización de un concepto abstracto, no una representación literal"
        }
      ]
    },
    "img.subject.person": {
      "id": "img.subject.person",
      "dim": "subject",
      "title": "Sensación del personaje",
      "question": "¿Cuál de estas se acerca más a cómo debe percibirse la persona?",
      "multi": false,
      "options": [
        {
          "id": "iper.natural",
          "label": "Retrato natural y realista",
          "hint": "Que parezca una foto real",
          "fragment": "una persona realista y natural, con textura de piel auténtica y una expresión relajada, sin pose"
        },
        {
          "id": "iper.action",
          "label": "En plena acción",
          "hint": "Movimiento y sensación de historia",
          "fragment": "la persona está absorta haciendo algo, con la inmediatez espontánea de una foto tomada al vuelo"
        },
        {
          "id": "iper.fashion",
          "label": "Editorial de moda",
          "hint": "Con estilismo y tensión",
          "fragment": "calidad de editorial de revista de moda, con estilismo deliberado y una pose con tensión"
        },
        {
          "id": "iper.anime",
          "label": "Personaje de anime / 2D",
          "hint": "No realista",
          "fragment": "un estilo de personaje anime, con líneas limpias y una paleta luminosa"
        },
        {
          "id": "iper.group",
          "label": "Retrato de grupo",
          "hint": "Dos o más personas",
          "fragment": "varias personas en el encuadre, con sus posiciones y sus miradas bien relacionadas entre sí"
        }
      ]
    },
    "img.subject.animal": {
      "id": "img.subject.animal",
      "dim": "subject",
      "title": "Sensación del animal",
      "question": "¿En qué estado debe aparecer el animal?",
      "multi": false,
      "options": [
        {
          "id": "iani.cute",
          "label": "Mascota adorable",
          "hint": "Que den ganas de tocar",
          "fragment": "una mascota adorable, con pelo suave y esponjoso y unos ojos vivos y brillantes"
        },
        {
          "id": "iani.wild",
          "label": "Documental de fauna",
          "hint": "Natural y con fuerza",
          "fragment": "un aire de documental de fauna que transmita la fuerza del animal y su hábitat natural"
        },
        {
          "id": "iani.humanized",
          "label": "Antropomórfico",
          "hint": "Viste ropa y hace cosas de humanos",
          "fragment": "un animal antropomórfico que lleva ropa o hace cosas de humanos, con sentido del humor"
        },
        {
          "id": "iani.art",
          "label": "Tratamiento artístico",
          "hint": "Ilustrado o estilizado",
          "fragment": "un animal con tratamiento artístico, sin buscar el realismo"
        }
      ]
    },
    "img.subject.product": {
      "id": "img.subject.product",
      "dim": "subject",
      "title": "Presentación del producto",
      "question": "¿Cómo se debe mostrar el producto?",
      "multi": false,
      "options": [
        {
          "id": "iprd.clean",
          "label": "Producto sobre fondo liso",
          "hint": "Imagen principal de e-commerce",
          "fragment": "un fondo limpio de un solo color, el producto centrado, luz uniforme y nada más en el encuadre"
        },
        {
          "id": "iprd.scene",
          "label": "Producto en contexto",
          "hint": "Colocado en una situación real",
          "fragment": "el producto integrado en una situación real, con el entorno sugiriendo para qué sirve y qué aire tiene"
        },
        {
          "id": "iprd.detail",
          "label": "Primer plano de material",
          "hint": "Destaca el tacto y la factura",
          "fragment": "un primer plano cerrado centrado en el material, la textura y la calidad de acabado del producto"
        },
        {
          "id": "iprd.concept",
          "label": "Póster conceptual",
          "hint": "Con una idea creativa",
          "fragment": "un póster conceptual de producto que exprese su propuesta con una idea visual creativa"
        }
      ]
    },
    "img.composition": {
      "id": "img.composition",
      "dim": "composition",
      "title": "Tipo de plano y encuadre",
      "question": "¿A qué distancia está la cámara del sujeto y cómo se encuadra?",
      "helper": "El tipo de plano decide cuánta información hay: el primer plano va al detalle y el plano general a las relaciones.",
      "multi": false,
      "options": [
        {
          "id": "icomp.closeup",
          "label": "Primer plano",
          "hint": "Solo una parte, el detalle primero",
          "fragment": "un encuadre de primer plano, con el sujeto ocupando la mayor parte del cuadro",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.medium",
          "label": "Plano medio",
          "hint": "La distancia de siempre",
          "fragment": "un encuadre medio que muestra el sujeto entero y conserva una cantidad moderada de entorno",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.wide",
          "label": "Plano general / retrato ambiental",
          "hint": "Figura pequeña, escena grande",
          "fragment": "un encuadre general en el que manda el entorno y el sujeto ocupa solo una parte pequeña de la escena",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.macro",
          "label": "macro",
          "hint": "Pegado al sujeto",
          "fragment": "un primer plano macro a distancia extrema, que revela la textura superficial y el detalle mínimo",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.centered",
          "label": "Simétrico y centrado",
          "hint": "Estable y formal",
          "fragment": "una composición simétrica y centrada, equilibrada a izquierda y derecha, con el peso visual justo en el medio",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.rule",
          "label": "Regla de los tercios",
          "hint": "Natural y cómodo",
          "fragment": "una composición con la regla de los tercios, con el sujeto sobre un punto de la sección áurea",
          "followUps": [
            "img.angle"
          ]
        },
        {
          "id": "icomp.blank",
          "label": "Mucho espacio negativo",
          "hint": "Espacio para el texto",
          "fragment": "grandes zonas de espacio negativo con el sujeto descentrado, dejando sitio para componer texto",
          "followUps": [
            "img.angle"
          ]
        }
      ]
    },
    "img.angle": {
      "id": "img.angle",
      "dim": "composition",
      "title": "Ángulo de cámara",
      "question": "¿Desde qué ángulo lo miramos?",
      "multi": false,
      "options": [
        {
          "id": "iang.eye",
          "label": "A nivel de ojos",
          "hint": "El ángulo natural de observación",
          "fragment": "una vista a nivel de ojos, cerca de la altura humana"
        },
        {
          "id": "iang.low",
          "label": "Ángulo bajo",
          "hint": "Alto e imponente",
          "fragment": "un plano desde abajo en ángulo bajo, que hace que el sujeto se vea alto e imponente"
        },
        {
          "id": "iang.high",
          "label": "Ángulo alto",
          "hint": "Todo a la vista, sensación de pequeñez",
          "fragment": "un plano desde arriba en ángulo alto que muestra cómo se relaciona todo"
        },
        {
          "id": "iang.dutch",
          "label": "Ángulo holandés",
          "hint": "Inquietud y movimiento",
          "fragment": "una composición inclinada al estilo holandés, que añade una ligera sensación de inestabilidad"
        },
        {
          "id": "iang.pov",
          "label": "Visión en primera persona",
          "hint": "Sensación de estar ahí",
          "fragment": "un punto de vista en primera persona, como si lo vieran los propios ojos del espectador"
        },
        {
          "id": "iang.aerial",
          "label": "Aérea",
          "hint": "Gran paisaje",
          "fragment": "una vista aérea desde arriba que destaca el terreno y la disposición del espacio"
        },
        {
          "id": "iang.over",
          "label": "Sobre el hombro / de espaldas",
          "hint": "El primer término guía la mirada",
          "fragment": "una vista sobre el hombro o de espaldas que usa una figura en primer término para llevar la mirada hacia el fondo del encuadre"
        }
      ]
    },
    "img.lighting": {
      "id": "img.lighting",
      "dim": "lighting",
      "title": "Iluminación",
      "question": "¿Cómo está puesta la luz?",
      "helper": "La luz es lo más caro de una imagen. La misma composición, otra luz, otra historia.",
      "multi": true,
      "options": [
        {
          "id": "ilt.soft",
          "label": "Luz natural suave",
          "hint": "Día nublado, junto a una ventana",
          "fragment": "luz natural suave y uniforme, con transiciones de sombra delicadas",
          "group": [
            "source",
            "quality"
          ]
        },
        {
          "id": "ilt.golden",
          "label": "Calidez de hora dorada",
          "hint": "Amanecer, atardecer",
          "fragment": "luz cálida de hora dorada con ángulo bajo, con el encuadre bañado en oro y naranja",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.blue",
          "label": "Frío de hora azul",
          "hint": "Justo al caer la noche",
          "fragment": "luz ambiente fría de hora azul, con todo el encuadre tendiendo al cian azulado",
          "group": [
            "source",
            "time"
          ]
        },
        {
          "id": "ilt.rim",
          "label": "Contraluz lateral / luz de contorno",
          "hint": "Dibuja el borde del sujeto",
          "fragment": "un contraluz lateral fuerte que dibuja una línea de contorno luminosa en el borde del sujeto"
        },
        {
          "id": "ilt.studio",
          "label": "Iluminación de estudio",
          "hint": "Limpia y controlable",
          "fragment": "iluminación de estudio con una jerarquía clara de luz principal y de relleno sobre un fondo limpio",
          "group": "source"
        },
        {
          "id": "ilt.hard",
          "label": "Luz dura / sombra marcada",
          "hint": "Contraste fuerte",
          "fragment": "luz directa y dura, con bordes de sombra nítidos y un contraste fuerte entre luces y sombras",
          "group": "quality"
        },
        {
          "id": "ilt.neon",
          "label": "Neón / color cyber",
          "hint": "Luz artificial de color",
          "fragment": "neones y fuentes artificiales de color que arrojan reflejos intensos por todo el encuadre",
          "group": "source"
        },
        {
          "id": "ilt.lowkey",
          "label": "Iluminación en clave baja",
          "hint": "Casi todo oscuro, una zona iluminada",
          "fragment": "iluminación en clave baja, con el encuadre dominado por las sombras y solo una zona iluminada",
          "group": "key"
        },
        {
          "id": "ilt.highkey",
          "label": "Clave alta y luminosa",
          "hint": "Luminoso y limpio",
          "fragment": "iluminación en clave alta, luminosa y aireada, casi sin sombras densas",
          "group": "key"
        },
        {
          "id": "ilt.godray",
          "label": "Luz volumétrica / rayos",
          "hint": "Haces visibles",
          "fragment": "un efecto de luz volumétrica con haces visibles y motas de polvo suspendidas en el aire"
        }
      ]
    },
    "img.style": {
      "id": "img.style",
      "dim": "style",
      "title": "Estilo",
      "question": "¿Qué estilo visual quieres?",
      "helper": "Dos como máximo. Solo puedes elegir un estilo de dibujo, pero se le puede añadir una atmósfera: por ejemplo, realismo fotográfico más aire cinematográfico.",
      "multi": true,
      "maxPick": 2,
      "options": [
        {
          "id": "ist.photo",
          "label": "Realismo fotográfico",
          "hint": "Que parezca una foto real",
          "fragment": "un estilo de realismo fotográfico, donde la luz y los materiales se comportan como en la realidad",
          "group": "medium"
        },
        {
          "id": "ist.cinema",
          "label": "Cinematográfico",
          "hint": "Color de película, alto rango dinámico",
          "fragment": "un aire cinematográfico con color de película y alto rango dinámico"
        },
        {
          "id": "ist.jp",
          "label": "Estilo japonés luminoso",
          "hint": "Luminoso y de bajo contraste",
          "fragment": "un estilo japonés luminoso: mucha claridad, poco contraste, limpio y aireado"
        },
        {
          "id": "ist.ink",
          "label": "Tinta aguada china",
          "hint": "Espacio vacío, sugerente",
          "fragment": "un estilo chino de tinta aguada que valora el vacío y la sugerencia, con una pincelada que respira",
          "group": "medium"
        },
        {
          "id": "ist.3d",
          "label": "Render 3D",
          "hint": "Aire C4D / Blender",
          "fragment": "un render tridimensional en el que materiales y luz siguen las leyes del renderizado físico",
          "group": "medium"
        },
        {
          "id": "ist.cyber",
          "label": "cyberpunk",
          "hint": "Neón, noche de lluvia, tecnología",
          "fragment": "un estilo cyberpunk: contaminación lumínica de neón frente al contraste visual de alta tecnología y vida precaria"
        },
        {
          "id": "ist.film",
          "label": "Película vintage",
          "hint": "Grano y color desvaído",
          "fragment": "un aire de película vintage, con grano visible y colores ligeramente desvaídos"
        },
        {
          "id": "ist.flat",
          "label": "Ilustración plana minimalista",
          "hint": "Limpio, con aire vectorial",
          "fragment": "un estilo de ilustración plana minimalista, con formas geométricas y bloques de color bien separados",
          "group": "medium"
        },
        {
          "id": "ist.oil",
          "label": "Óleo / empaste",
          "hint": "Pincelada visible",
          "fragment": "óleo aplicado con empaste, pinceladas claramente legibles y capas de color ricas",
          "group": "medium"
        },
        {
          "id": "ist.concept",
          "label": "Arte conceptual",
          "hint": "Aire de arte de producción",
          "fragment": "un estilo de arte conceptual que destaca el criterio de diseño y la imaginación"
        },
        {
          "id": "ist.pixel",
          "label": "pixel art",
          "hint": "Juego retro",
          "fragment": "un estilo pixel art con bloques de color definidos y bordes duros",
          "group": "medium"
        },
        {
          "id": "ist.vapor",
          "label": "Vaporwave",
          "hint": "Degradados rosa y lila, tecnología nostálgica",
          "fragment": "un estilo vaporwave con degradados rosa y lila y elementos tecnológicos nostálgicos de los años ochenta"
        }
      ]
    },
    "img.mood": {
      "id": "img.mood",
      "dim": "mood",
      "title": "Atmósfera",
      "question": "¿Qué sensación debe transmitir esta imagen?",
      "helper": "La atmósfera decide lo que siente el público, no solo lo que ve.",
      "multi": false,
      "options": [
        {
          "id": "imd.calm",
          "label": "Tranquilidad y calma",
          "hint": "Que te serene",
          "fragment": "un ambiente general de calma y relax, sin prisa"
        },
        {
          "id": "imd.warm",
          "label": "Cálido y reconfortante",
          "hint": "Sensación de seguridad",
          "fragment": "un ambiente cálido y reconfortante que se siente como un abrazo"
        },
        {
          "id": "imd.tense",
          "label": "Tensión y opresión",
          "hint": "Cargado",
          "fragment": "un ambiente tenso y opresivo, con una carga inquietante"
        },
        {
          "id": "imd.lonely",
          "label": "Soledad y distancia",
          "hint": "Vacío y silencio",
          "fragment": "un ambiente solitario y distante, con una separación clara entre el sujeto y su entorno"
        },
        {
          "id": "imd.mystery",
          "label": "Misterio y lo desconocido",
          "hint": "Como si escondiera algo",
          "fragment": "un ambiente misterioso, como si el encuadre guardara algo aún por revelar"
        },
        {
          "id": "imd.energy",
          "label": "Vitalidad y energía",
          "hint": "Con empuje",
          "fragment": "un ambiente lleno de energía y empuje, muy dinámico"
        },
        {
          "id": "imd.noble",
          "label": "Sobrio y refinado",
          "hint": "Aire de lujo",
          "fragment": "un ambiente sobrio y refinado que habla a través del vacío y de la calidad del material, no amontonando elementos"
        },
        {
          "id": "imd.retro",
          "label": "Nostálgico",
          "hint": "El calor de otros tiempos",
          "fragment": "un ambiente nostálgico, con sabor de época y el calor de la memoria"
        }
      ]
    },
    "img.palette": {
      "id": "img.palette",
      "dim": "color",
      "title": "Color",
      "question": "¿Cuál es la tendencia general del color?",
      "helper": "Elige una sola. Con dos colores dominantes el cuadro se vuelve turbio.",
      "multi": false,
      "options": [
        {
          "id": "ipal.warm",
          "label": "Cálido",
          "hint": "Naranja, amarillo, rojo",
          "fragment": "dominado por el calor, con naranja, amarillo y rojo como tonos principales"
        },
        {
          "id": "ipal.cool",
          "label": "Frío",
          "hint": "Cian y azul",
          "fragment": "dominado por el frío, con cian y azul como tonos principales"
        },
        {
          "id": "ipal.mono",
          "label": "Baja saturación / monocromo",
          "hint": "Sobrio",
          "fragment": "una paleta de baja saturación, casi monocroma"
        },
        {
          "id": "ipal.morandi",
          "label": "Paleta Morandi",
          "hint": "Grises sofisticados",
          "fragment": "una paleta Morandi: tonos grisáceos suaves en los que los colores se ceden protagonismo entre sí"
        },
        {
          "id": "ipal.contrast",
          "label": "Choque de alta saturación",
          "hint": "Contundente",
          "fragment": "colores de alta saturación que chocan entre sí, con un contraste fuerte"
        },
        {
          "id": "ipal.bw",
          "label": "Blanco y negro",
          "hint": "Solo luz y sombra",
          "fragment": "una tonalidad en blanco y negro que construye la imagen solo con luces y sombras"
        },
        {
          "id": "ipal.faded",
          "label": "Vintage desvaído",
          "hint": "Como una foto antigua",
          "fragment": "una tonalidad vintage desvaída, como si el tiempo hubiera lavado el color"
        },
        {
          "id": "ipal.dual",
          "label": "Bicromía cálida y fría",
          "hint": "Dos tonos en tensión",
          "fragment": "una bicromía cálida y fría, con el encuadre en tensión entre dos tonos"
        }
      ]
    },
    "img.ratio": {
      "id": "img.ratio",
      "dim": "composition",
      "title": "Relación de aspecto",
      "question": "¿Dónde se va a usar esta imagen?",
      "helper": "Con la proporción equivocada, hasta una gran imagen acaba recortada.",
      "multi": false,
      "options": [
        {
          "id": "irat.square",
          "label": "1:1 cuadrado",
          "hint": "Avatares, imagen principal de e-commerce",
          "fragment": "formato cuadrado 1:1"
        },
        {
          "id": "irat.p34",
          "label": "3:4 vertical",
          "hint": "Xiaohongshu, pósteres",
          "fragment": "formato vertical 3:4"
        },
        {
          "id": "irat.p916",
          "label": "9:16 vertical",
          "hint": "Fondo de pantalla, portada de vídeo corto",
          "fragment": "formato vertical 9:16"
        },
        {
          "id": "irat.l169",
          "label": "16:9 horizontal",
          "hint": "Fondos, diapositivas, portadas de vídeo",
          "fragment": "formato panorámico 16:9"
        },
        {
          "id": "irat.p23",
          "label": "2:3 vertical",
          "hint": "fotografía",
          "fragment": "el clásico formato fotográfico vertical 2:3"
        },
        {
          "id": "irat.cinema",
          "label": "21:9 ultra panorámico",
          "hint": "Cinematográfico",
          "fragment": "un formato ultra panorámico 21:9, cercano a las proporciones de la pantalla de cine"
        }
      ]
    },
    "img.quality": {
      "id": "img.quality",
      "dim": "quality",
      "title": "Calidad y objetivo",
      "question": "¿Qué nivel de detalle y de carácter de objetivo quieres?",
      "helper": "Esta parte decide si una imagen parece cara o no.",
      "multi": true,
      "options": [
        {
          "id": "iql.detail",
          "label": "Mucho detalle, textura fina",
          "hint": "Aguanta el zoom",
          "fragment": "detalle altísimo, con materiales y texturas que siguen leyéndose bien al ampliar"
        },
        {
          "id": "iql.dof",
          "label": "Poca profundidad de campo",
          "hint": "Realza el sujeto",
          "fragment": "una profundidad de campo reducida con el fondo suavemente desenfocado, que separa al sujeto de su entorno"
        },
        {
          "id": "iql.p85",
          "label": "Objetivo de retrato 85mm",
          "hint": "Compresión y rostros favorecidos",
          "fragment": "el carácter de un teleobjetivo corto de retrato de 85mm: compresión natural y proporciones faciales favorecedoras",
          "group": "lens"
        },
        {
          "id": "iql.w24",
          "label": "Tensión de gran angular",
          "hint": "Gran sensación de espacio",
          "fragment": "el carácter de un gran angular de 24mm: perspectiva exagerada y gran profundidad espacial",
          "group": "lens"
        },
        {
          "id": "iql.motion",
          "label": "Larga exposición / desenfoque de movimiento",
          "hint": "El tiempo hecho visible",
          "fragment": "un efecto de larga exposición en el que los objetos en movimiento dejan estelas suaves"
        },
        {
          "id": "iql.grain",
          "label": "Grano de película",
          "hint": "Con textura, imperfecto",
          "fragment": "un grano de película apreciable, sin ninguna intención de quedar impoluto"
        },
        {
          "id": "iql.8k",
          "label": "8K ultra HD",
          "hint": "Máxima nitidez",
          "fragment": "calidad 8K de ultra alta definición, con un detalle nítido"
        },
        {
          "id": "iql.skin",
          "label": "Textura de piel real",
          "hint": "Sin aspecto de plástico",
          "fragment": "textura de piel real, con poros y pequeñas imperfecciones intactas, sin suavizado excesivo"
        }
      ]
    },
    "img.negative": {
      "id": "img.negative",
      "dim": "negative",
      "title": "Prompt negativo",
      "question": "¿Qué no debe aparecer nunca en la imagen?",
      "helper": "El prompt negativo es la forma más barata de subir la calidad. También puedes no elegir ninguno.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "ineg.quality",
          "label": "baja calidad, borroso, con ruido",
          "hint": "low quality, blurry",
          "fragment": "low quality, blurry, noisy, jpeg artifacts"
        },
        {
          "id": "ineg.hands",
          "label": "manos deformes, extremidades de más",
          "hint": "bad hands",
          "fragment": "bad hands, extra fingers, extra limbs, deformed hands"
        },
        {
          "id": "ineg.face",
          "label": "rostro distorsionado",
          "hint": "deformed face",
          "fragment": "distorted face, deformed face, asymmetric eyes"
        },
        {
          "id": "ineg.text",
          "label": "texto y marcas de agua",
          "hint": "text, watermark",
          "fragment": "text, watermark, signature, logo"
        },
        {
          "id": "ineg.plastic",
          "label": "piel de plástico, suavizado excesivo",
          "hint": "plastic skin",
          "fragment": "plastic skin, over-smoothed skin, waxy texture"
        },
        {
          "id": "ineg.hdr",
          "label": "aspecto HDR sobresaturado",
          "hint": "over-saturated",
          "fragment": "over-saturated, excessive HDR, oversharpened"
        },
        {
          "id": "ineg.clutter",
          "label": "composición desordenada, demasiados elementos",
          "hint": "cluttered",
          "fragment": "cluttered composition, too many elements, busy background"
        },
        {
          "id": "ineg.faceavg",
          "label": "rostros genéricos de influencer",
          "hint": "generic AI face",
          "fragment": "generic AI face, same-face syndrome, instagram filter face"
        },
        {
          "id": "ineg.irrelevant",
          "label": "objetos que no vienen al caso en el encuadre",
          "hint": "random items",
          "fragment": "irrelevant objects, random items in frame"
        },
        {
          "id": "ineg.artifacts",
          "label": "artefactos evidentes de generación con IA",
          "hint": "AI artifacts",
          "fragment": "obvious AI artifacts, unnatural anatomy, uncanny valley"
        }
      ]
    },
    "vid.action": {
      "id": "vid.action",
      "dim": "action",
      "title": "Acción",
      "question": "¿Qué ocurre en el plano?",
      "helper": "Lo único que tiene el vídeo y no tiene una imagen fija es el cambio. Describe el cambio primero.",
      "multi": false,
      "options": [
        {
          "id": "vact.still",
          "label": "Sujeto quieto, entorno en movimiento",
          "hint": "Viento, ondas, luz cambiante",
          "fragment": "el sujeto permanece prácticamente inmóvil mientras el entorno aporta el movimiento: viento, agua, luz cambiante o una multitud"
        },
        {
          "id": "vact.single",
          "label": "Una acción continua",
          "hint": "Girarse, levantar una mano, caminar",
          "fragment": "el sujeto realiza una sola acción continua y todo el movimiento queda visible"
        },
        {
          "id": "vact.sequence",
          "label": "Secuencia de varias acciones",
          "hint": "Primero… luego…",
          "fragment": "el sujeto realiza varias acciones en orden, con una sucesión clara entre ellas"
        },
        {
          "id": "vact.enter",
          "label": "Entra desde fuera de cuadro",
          "hint": "Entra caminando y se detiene",
          "fragment": "el sujeto entra en el encuadre desde fuera y se detiene dentro de él"
        },
        {
          "id": "vact.express",
          "label": "Expresión y cambio emocional",
          "hint": "Sobre todo primeros planos",
          "fragment": "el foco está en los cambios sutiles de la expresión facial y en el fluir de la emoción"
        },
        {
          "id": "vact.interact",
          "label": "Interacción entre dos sujetos",
          "hint": "Diálogo, contacto",
          "fragment": "dos sujetos interactúan y sus movimientos deben responderse entre sí"
        }
      ]
    },
    "vid.shot": {
      "id": "vid.shot",
      "dim": "shot",
      "title": "Tipo de plano",
      "question": "¿Qué tipos de plano?",
      "helper": "Puedes marcar varios. Se reparten por orden entre los planos del storyboard. Si la pieza es un solo plano o varios lo decide la estructura de montaje.",
      "multi": true,
      "options": [
        {
          "id": "vsh.extreme",
          "label": "Gran plano general",
          "hint": "Sitúa el entorno",
          "fragment": "un gran plano general, con el sujeto ocupando solo una parte mínima de un entorno vasto"
        },
        {
          "id": "vsh.wide",
          "label": "Plano general",
          "hint": "Sujeto y entorno, igual de importantes",
          "fragment": "un plano general con el sujeto entero en cuadro y bastante contexto alrededor"
        },
        {
          "id": "vsh.medium",
          "label": "Plano medio",
          "hint": "El de siempre",
          "fragment": "un plano medio, encuadrado de cintura para arriba"
        },
        {
          "id": "vsh.close",
          "label": "Plano cercano",
          "hint": "La expresión primero",
          "fragment": "un plano cercano, encuadrado de pecho para arriba, que resalta la expresión facial"
        },
        {
          "id": "vsh.cu",
          "label": "Primer plano",
          "hint": "Solo el detalle",
          "fragment": "un plano de primer plano centrado en el rostro o en un detalle clave"
        },
        {
          "id": "vsh.macro",
          "label": "Primerísimo plano",
          "hint": "macro",
          "fragment": "un primerísimo plano macro que revela detalles que el ojo apenas distingue"
        }
      ]
    },
    "vid.move": {
      "id": "vid.move",
      "dim": "move",
      "title": "Movimiento de cámara",
      "question": "¿Cómo se mueve la cámara?",
      "helper": "El movimiento de cámara es el tono de voz del vídeo. La misma escena con cámara fija y con órbita son dos cosas distintas. Si marcas varios, se reparten por orden entre los planos (el primero al plano 1, y así sucesivamente); en un vídeo de un solo plano solo se usa el primero.",
      "multi": true,
      "maxPick": 4,
      "options": [
        {
          "id": "vmv.static",
          "label": "Cámara fija",
          "hint": "Estable y contenido",
          "fragment": "cámara fija, completamente inmóvil"
        },
        {
          "id": "vmv.push",
          "label": "Acercamiento lento",
          "hint": "Atrae la mirada",
          "fragment": "la cámara se acerca despacio y va centrando el foco en el sujeto"
        },
        {
          "id": "vmv.pull",
          "label": "Alejamiento lento",
          "hint": "Revela el entorno",
          "fragment": "la cámara se aleja despacio y va revelando el entorno del sujeto"
        },
        {
          "id": "vmv.pan",
          "label": "Paneo",
          "hint": "Como si barriera la escena",
          "fragment": "la cámara panea en horizontal, como si recorriera toda la escena"
        },
        {
          "id": "vmv.track",
          "label": "Desplazamiento lateral / seguimiento",
          "hint": "Viaja con el sujeto",
          "fragment": "la cámara se desplaza en lateral a la misma velocidad que el sujeto, manteniéndolo en el mismo sitio del encuadre"
        },
        {
          "id": "vmv.orbit",
          "label": "Órbita",
          "hint": "Da vueltas al sujeto",
          "fragment": "la cámara orbita alrededor del sujeto"
        },
        {
          "id": "vmv.crane",
          "label": "Grúa arriba / abajo",
          "hint": "Cambia de altura",
          "fragment": "la cámara sube o baja en vertical, cambiando la altura de observación"
        },
        {
          "id": "vmv.handheld",
          "label": "Cámara en mano",
          "hint": "Aire documental",
          "fragment": "rodaje a mano, con un temblor leve y natural que le da aire documental"
        },
        {
          "id": "vmv.drone",
          "label": "Aéreo con dron",
          "hint": "Recorre mucho terreno",
          "fragment": "un punto de vista aéreo con dron, con la cámara desplazándose mucho o sobrevolando la escena"
        },
        {
          "id": "vmv.pov",
          "label": "Visión en primera persona",
          "hint": "Sensación de estar ahí",
          "fragment": "movimiento en primera persona, como si fuera el espectador quien se mueve"
        }
      ]
    },
    "vid.style": {
      "id": "vid.style",
      "dim": "style",
      "title": "Look",
      "question": "¿Cuál es el look general?",
      "multi": false,
      "options": [
        {
          "id": "vst.cinema",
          "label": "Cinematográfico",
          "hint": "Película, profundidad tonal",
          "fragment": "calidad de imagen cinematográfica, con color de película y una rica gama tonal"
        },
        {
          "id": "vst.doc",
          "label": "Realismo documental",
          "hint": "Real, sin retoques",
          "fragment": "un estilo documental, con luz e imagen naturales y sin adorno"
        },
        {
          "id": "vst.ad",
          "label": "Acabado publicitario",
          "hint": "Limpio y premium",
          "fragment": "un acabado de spot de gama alta: imagen limpia y luz refinada"
        },
        {
          "id": "vst.anime",
          "label": "Anime / 2D",
          "hint": "Aire dibujado a mano",
          "fragment": "un estilo de animación 2D con líneas limpias y un movimiento dibujado a mano"
        },
        {
          "id": "vst.stop",
          "label": "stop motion",
          "hint": "Fotograma a fotograma",
          "fragment": "un estilo stop motion, con la ligera discontinuidad de rodar fotograma a fotograma"
        },
        {
          "id": "vst.vhs",
          "label": "VHS retro",
          "hint": "Cinta de vídeo antigua",
          "fragment": "un aire de cinta de vídeo retro, con ruido, sangrado de color y un temblor leve"
        },
        {
          "id": "vst.cyber",
          "label": "cyberpunk",
          "hint": "Futuro de neón",
          "fragment": "un look cyberpunk, con fuentes de neón sobre una ciudad de tonos fríos"
        }
      ]
    },
    "vid.cut": {
      "id": "vid.cut",
      "dim": "cut",
      "title": "Estructura de montaje",
      "question": "¿Cómo se monta la pieza?",
      "helper": "Esto decide cuántos planos tiene la pieza: con un solo plano no hacen falta varios tipos de plano.",
      "multi": false,
      "options": [
        {
          "id": "vcut.cut",
          "label": "Montaje por planos",
          "hint": "Varios planos, cortados entre sí",
          "fragment": "montado en el orden del storyboard, con transiciones limpias y decididas entre planos"
        },
        {
          "id": "vcut.oner",
          "label": "plano secuencia",
          "hint": "Un solo plano en toda la pieza",
          "fragment": "un plano secuencia continuo, sin ningún corte en toda la pieza"
        }
      ]
    },
    "vid.lighting": {
      "id": "vid.lighting",
      "dim": "lighting",
      "title": "Iluminación",
      "question": "¿Cómo es la luz?",
      "multi": true,
      "options": [
        {
          "id": "vlt.natural",
          "label": "Luz de día natural",
          "hint": "Fiel a la realidad",
          "fragment": "luz de día natural, auténtica y sin forzar",
          "group": "source"
        },
        {
          "id": "vlt.golden",
          "label": "hora dorada",
          "hint": "Calidez de amanecer y atardecer",
          "fragment": "luz cálida de hora dorada con ángulo bajo",
          "group": "source"
        },
        {
          "id": "vlt.night",
          "label": "Noche de neón",
          "hint": "Fuentes artificiales complejas",
          "fragment": "luces de ciudad y neones nocturnos, con fuentes complejas y por capas",
          "group": "source"
        },
        {
          "id": "vlt.studio",
          "label": "Iluminación de estudio",
          "hint": "Limpia y controlable",
          "fragment": "iluminación de estudio, limpia y controlable",
          "group": "source"
        },
        {
          "id": "vlt.back",
          "label": "Silueta a contraluz",
          "hint": "Solo se lee el contorno",
          "fragment": "rodado a contraluz, de modo que el sujeto se lee como silueta o semisilueta"
        },
        {
          "id": "vlt.overcast",
          "label": "Luz suave de día nublado",
          "hint": "Sin sombras duras",
          "fragment": "luz difusa y suave bajo un cielo nublado, casi sin sombras duras",
          "group": "source"
        }
      ]
    },
    "vid.duration": {
      "id": "vid.duration",
      "dim": "duration",
      "title": "Duración y ritmo",
      "question": "¿Cuánto dura y a qué ritmo?",
      "helper": "La duración decide cuántos planos caben: si metes cuatro en tres a cinco segundos, ninguno llega a verse.",
      "multi": false,
      "options": [
        {
          "id": "vdur.s5",
          "label": "3-5 s · plano único",
          "hint": "Con un plano basta",
          "fragment": "de tres a cinco segundos, con un ritmo pausado",
          "seconds": 5,
          "maxShots": 1
        },
        {
          "id": "vdur.s10",
          "label": "5-10 s · plano único",
          "hint": "La acción se desarrolla entera",
          "fragment": "de cinco a diez segundos, para que la acción se despliegue entera",
          "seconds": 10,
          "maxShots": 1
        },
        {
          "id": "vdur.s15",
          "label": "10-15 s · varios planos",
          "hint": "Con cortes",
          "fragment": "de diez a quince segundos, con un ritmo que avanza",
          "seconds": 15,
          "maxShots": 3
        },
        {
          "id": "vdur.long",
          "label": "Más de 15 s · necesita storyboard",
          "hint": "Primero el storyboard",
          "fragment": "más de quince segundos, con un ritmo que sube y baja",
          "seconds": 20,
          "maxShots": 4
        }
      ]
    },
    "vid.audio": {
      "id": "vid.audio",
      "dim": "audio",
      "title": "Audio",
      "question": "¿Quieres sonido? ¿De qué tipo?",
      "helper": "Si tu herramienta no soporta audio, elige sin sonido y listo.",
      "multi": true,
      "options": [
        {
          "id": "vaud.none",
          "label": "Sin sonido",
          "hint": "Solo imagen",
          "fragment": "describe solo la imagen, sin audio",
          "group": "*"
        },
        {
          "id": "vaud.ambient",
          "label": "Sonido ambiente",
          "hint": "Viento, lluvia, calle",
          "fragment": "con sonido ambiente: viento, agua o fondo urbano"
        },
        {
          "id": "vaud.music",
          "label": "Música emotiva",
          "hint": "Marca el ritmo",
          "fragment": "con música de fondo emotiva",
          "followUps": [
            "vid.bgm"
          ]
        },
        {
          "id": "vaud.voice",
          "label": "Voz en off / diálogo",
          "hint": "Con voces",
          "fragment": "incluyendo voz en off o diálogo"
        },
        {
          "id": "vaud.sfx",
          "label": "Efectos sobre la acción",
          "hint": "Refuerza la acción",
          "fragment": "con efectos de sonido que subrayan las acciones clave"
        }
      ]
    },
    "vid.bgm": {
      "id": "vid.bgm",
      "dim": "bgm",
      "title": "Tipo de música",
      "question": "¿Qué sensación debe tener la música exactamente?",
      "helper": "Concreta los instrumentos y el tempo y la música no se irá por otro camino.",
      "multi": false,
      "options": [
        {
          "id": "vbgm.piano",
          "label": "Piano lento",
          "hint": "Limpio y contenido",
          "fragment": "sobre todo piano solo lento, con notas dispersas y mucho espacio entre ellas"
        },
        {
          "id": "vbgm.cello",
          "label": "Violonchelo grave",
          "hint": "Denso y con sensación de historia",
          "fragment": "notas largas y graves de violonchelo por debajo, con un peso emocional y sensación de historia"
        },
        {
          "id": "vbgm.ambient",
          "label": "Ambient",
          "hint": "Por debajo, sin robar protagonismo",
          "fragment": "música ambient, con un colchón continuo por debajo que nunca compite con la imagen"
        },
        {
          "id": "vbgm.lofi",
          "label": "Lo-fi tranquilo",
          "hint": "Relajado, cotidiano",
          "fragment": "un estilo lo-fi, con un leve siseo de fondo y una batería perezosa, lleno de textura cotidiana"
        },
        {
          "id": "vbgm.strings",
          "label": "Cuerdas en crescendo",
          "hint": "Lleva al clímax",
          "fragment": "las cuerdas crecen desde lo suave y llevan la emoción a su punto más alto en la parte central-final"
        },
        {
          "id": "vbgm.electronic",
          "label": "Ambiente electrónico",
          "hint": "Frío y futurista",
          "fragment": "timbres de sintetizador, fríos y futuristas, sobre un pulso constante"
        }
      ]
    },
    "vid.arc": {
      "id": "vid.arc",
      "dim": "arc",
      "title": "Arco emocional",
      "question": "¿Cómo debe viajar la emoción del espectador a lo largo de la pieza?",
      "helper": "Cuatro planos con el mismo nivel emocional se sienten planos. Si fijas una dirección, el ambiente de cada plano tiene hacia dónde ir.",
      "multi": false,
      "options": [
        {
          "id": "varc.rise",
          "label": "De quieto a en movimiento",
          "hint": "Sube despacio y remata con fuerza",
          "fragment": "la emoción pasa de quieta a móvil: contenida en la primera mitad, con empuje en la segunda",
          "arc": [
            "Primero se asienta",
            "Va creciendo",
            "Remata",
            "Se libera"
          ]
        },
        {
          "id": "varc.warm",
          "label": "De frío a cálido",
          "hint": "De distante a cercano",
          "fragment": "la emoción pasa de fría a cálida, desplazándose de lo distante y contenido hacia el calor",
          "arc": [
            "Distante y contenido",
            "Empieza a aflojar",
            "Se acerca",
            "Termina en calidez"
          ]
        },
        {
          "id": "varc.build",
          "label": "Capa a capa",
          "hint": "Cada plano más tenso",
          "fragment": "la emoción crece capa a capa, con cada plano más tenso que el anterior",
          "arc": [
            "Abre la escena",
            "Entra en materia",
            "Aprieta la tensión",
            "Se asienta para cerrar"
          ]
        },
        {
          "id": "varc.release",
          "label": "De tenso a suelto",
          "hint": "Contenido y luego liberado",
          "fragment": "la emoción pasa de tensa a suelta: contenida en la primera mitad, liberada en la segunda",
          "arc": [
            "Conteniendo la emoción",
            "En tablas",
            "Empieza a aflojar",
            "Del todo abierto"
          ]
        },
        {
          "id": "varc.flow",
          "label": "Fluye suave",
          "hint": "Sin altibajos forzados",
          "fragment": "la emoción fluye con suavidad, sin subidas ni bajadas fuertes",
          "arc": [
            "Entra con suavidad",
            "Se desliza",
            "Un leve sube y baja",
            "Se posa"
          ]
        }
      ]
    },
    "vid.focus": {
      "id": "vid.focus",
      "dim": "focus",
      "title": "Foco de detalle",
      "question": "Cuando la cámara se acerca, ¿qué es lo que más importa que se vea claro?",
      "helper": "Si no fijas el foco en un primer plano o un plano cercano, el modelo elige uno por su cuenta, y a menudo elige mal.",
      "multi": false,
      "options": [
        {
          "id": "vfoc.face",
          "label": "Expresión facial",
          "fragment": "lleva la atención del espectador a la expresión facial"
        },
        {
          "id": "vfoc.eyes",
          "label": "Ojos y mirada",
          "fragment": "lleva la atención del espectador a los ojos y a la dirección de la mirada"
        },
        {
          "id": "vfoc.hands",
          "label": "Movimiento de las manos",
          "fragment": "lleva la atención del espectador al movimiento de las manos"
        },
        {
          "id": "vfoc.prop",
          "label": "Objeto clave",
          "fragment": "lleva la atención del espectador al material y los detalles del objeto clave"
        },
        {
          "id": "vfoc.env",
          "label": "Detalles del entorno",
          "fragment": "lleva la atención del espectador a los detalles del entorno, manteniendo nítida la textura del fondo"
        },
        {
          "id": "vfoc.light",
          "label": "Cambios de luz",
          "fragment": "lleva la atención del espectador a los cambios de luz y sombra"
        }
      ]
    },
    "vid.detail": {
      "id": "vid.detail",
      "dim": "detail",
      "title": "Detalles visuales",
      "question": "¿Qué detalles tienen que aparecer en el encuadre?",
      "helper": "Los detalles que escribas tú van primero, uno por plano. Para ser más concreto, elige escribirlo yo y teclea directamente, por ejemplo: gotas en el paraguas, reflejos en los charcos, el letrero de neón. Sepáralos con comas, uno por cada plano.",
      "multi": true,
      "maxPick": 6,
      "optional": true,
      "options": [
        {
          "id": "vdet.outfit",
          "label": "Ropa y aspecto del sujeto",
          "hint": "Ropa, peinado, lo que lleva encima",
          "fragment": "la ropa y los detalles del aspecto del sujeto se ven con claridad"
        },
        {
          "id": "vdet.face",
          "label": "Rostro y expresión",
          "hint": "Cambios en la expresión",
          "fragment": "los cambios en el rostro y en su expresión se ven con claridad"
        },
        {
          "id": "vdet.env",
          "label": "Textura del entorno",
          "hint": "Paredes, suelo, calle",
          "fragment": "los materiales y las texturas del entorno se ven con claridad"
        },
        {
          "id": "vdet.air",
          "label": "Sensación de aire",
          "hint": "Humedad, polvo, destellos",
          "fragment": "la humedad, el polvo o los destellos de luz en el aire se ven con claridad"
        },
        {
          "id": "vdet.reflect",
          "label": "Reflejos",
          "hint": "Agua, cristal, metal",
          "fragment": "los reflejos en el suelo o en las superficies se ven con claridad"
        },
        {
          "id": "vdet.prop",
          "label": "Objeto clave",
          "hint": "Paraguas, taza, móvil…",
          "fragment": "los detalles del objeto clave se ven con claridad"
        },
        {
          "id": "vdet.crowd",
          "label": "Multitudes y tráfico",
          "hint": "Actividad de fondo",
          "fragment": "multitudes o tráfico que se mueven despacio al fondo"
        },
        {
          "id": "vdet.texture",
          "label": "Textura superficial",
          "hint": "Tela, veta de madera, piedra",
          "fragment": "la textura de las superficies se amplifica"
        }
      ]
    },
    "vid.ratio": {
      "id": "vid.ratio",
      "dim": "shot",
      "title": "Relación de aspecto",
      "question": "¿Dónde se va a mostrar este vídeo?",
      "helper": "Si eliges mal la orientación, la plataforma lo recorta por su cuenta y el encuadre se pierde.",
      "multi": false,
      "options": [
        {
          "id": "vrat.l169",
          "label": "16:9 horizontal",
          "hint": "Bilibili, YouTube, web",
          "fragment": "formato panorámico 16:9"
        },
        {
          "id": "vrat.p916",
          "label": "9:16 vertical",
          "hint": "Douyin, Xiaohongshu, Reels",
          "fragment": "un formato vertical 9:16, pensado para verse a pantalla completa en el móvil"
        },
        {
          "id": "vrat.square",
          "label": "1:1 cuadrado",
          "hint": "Anuncios en el feed",
          "fragment": "formato cuadrado 1:1"
        },
        {
          "id": "vrat.cinema",
          "label": "21:9 ultra panorámico",
          "hint": "Tráiler cinematográfico",
          "fragment": "un formato ultra panorámico 21:9, cercano a las proporciones de la pantalla de cine"
        },
        {
          "id": "vrat.p45",
          "label": "4:5 vertical",
          "hint": "Feed de Instagram",
          "fragment": "formato vertical 4:5"
        }
      ]
    },
    "vid.negative": {
      "id": "vid.negative",
      "dim": "negative",
      "title": "Prompt negativo",
      "question": "¿Qué problemas no pueden aparecer nunca?",
      "helper": "Aquí están los fallos más típicos de los modelos de vídeo. Se recomienda marcar al menos unos cuantos.",
      "multi": true,
      "optional": true,
      "options": [
        {
          "id": "vneg.shake",
          "label": "temblor de imagen, efecto gelatina",
          "hint": "shaky footage",
          "fragment": "shaky footage, jello effect, rolling shutter"
        },
        {
          "id": "vneg.face",
          "label": "rostros o extremidades deformados",
          "hint": "deformed",
          "fragment": "deformed face, distorted body, extra limbs"
        },
        {
          "id": "vneg.pop",
          "label": "objetos que aparecen o desaparecen de golpe",
          "hint": "morphing",
          "fragment": "objects appearing or disappearing, morphing"
        },
        {
          "id": "vneg.motion",
          "label": "movimiento poco natural, estelas",
          "hint": "ghosting",
          "fragment": "unnatural motion, motion blur artifacts, ghosting"
        },
        {
          "id": "vneg.flicker",
          "label": "parpadeo, saltos de fotogramas",
          "hint": "flickering",
          "fragment": "flickering, frame skipping, stuttering"
        },
        {
          "id": "vneg.text",
          "label": "texto y marcas de agua",
          "hint": "text, watermark",
          "fragment": "text, watermark, subtitles"
        },
        {
          "id": "vneg.quality",
          "label": "baja resolución, borroso",
          "hint": "low resolution",
          "fragment": "low resolution, blurry, pixelated"
        },
        {
          "id": "vneg.chaos",
          "label": "acción caótica entre varios sujetos",
          "hint": "chaotic",
          "fragment": "chaotic action, multiple subjects moving inconsistently"
        }
      ]
    }
  },
  "sectionTitles": {
    "role": "Rol",
    "context": "Contexto",
    "task": "Tarea",
    "requirement": "Requisitos",
    "format": "Formato",
    "style": "Tono y detalle",
    "constraint": "Restricciones",
    "example": "Ejemplos",
    "subject": "Sujeto",
    "composition": "Composición y objetivo",
    "lighting": "Iluminación",
    "mood": "Atmósfera",
    "color": "Color",
    "quality": "Calidad y textura",
    "negative": "Prompt negativo",
    "action": "Acción",
    "shot": "Tipo de plano",
    "focus": "Foco de detalle",
    "move": "Movimiento de cámara",
    "cut": "Estructura de montaje",
    "arc": "Arco emocional",
    "detail": "Detalles visuales",
    "duration": "Duración y ritmo",
    "audio": "Audio"
  },
  "shotContent": {
    "vsh.extreme": "Llena el encuadre con el entorno; el sujeto es solo un punto pequeño dentro de él",
    "vsh.wide": "El sujeto entra completo en el encuadre y el entorno ocupa la mayor parte del plano",
    "vsh.medium": "Encuadra de cintura para arriba; la acción y el entorno se ven a la vez",
    "vsh.close": "Encuadra de pecho para arriba; el fondo empieza a desenfocarse",
    "vsh.cu": "Conserva solo un detalle del sujeto; desenfoca todo lo demás",
    "vsh.macro": "Acércate al máximo para que la textura llene todo el encuadre"
  },
  "shotRole": {
    "vsh.extreme": "Asienta primero el tiempo, el lugar y el ambiente general; la persona es solo un punto en el entorno",
    "vsh.wide": "Coloca al sujeto completo dentro del entorno para que se entienda de un vistazo quién está y dónde",
    "vsh.medium": "La acción y la postura se leen con total claridad; es el plano que sostiene la narración",
    "vsh.close": "La emoción empieza a aflorar y el público puede leer la expresión",
    "vsh.cu": "Clava la atención en un detalle y amplifica su textura",
    "vsh.macro": "Acércate a una escala que el ojo no distingue y genera una sensación de extrañeza"
  },
  "visualJoiner": {
    "image": ", ",
    "video": ". "
  },
  "visualEnd": {
    "image": "",
    "video": "."
  },
  "sectionExplain": {
    "role": "Le dice a la IA en qué piel se tiene que poner, y ella cambia sola a los criterios y las formas de hablar de ese rol. La misma pregunta recibe una respuesta completamente distinta de un experto que de un principiante.",
    "context": "Di para quién es y en qué situación se va a usar, y la IA ajusta sola el vocabulario y los ejemplos. Es el bloque que más se olvida y el que más rentabilidad da.",
    "task": "Tus propias palabras, no la paráfrasis de la IA. Tu forma de decirlo lleva tu tono y tu intención real, y cada paráfrasis pierde un poco de los dos.",
    "requirement": "Escribe los detalles que das por sentados. Justamente porque a ti te parecen obvios, son los que la IA se salta.",
    "format": "Fija la forma, la extensión y la estructura de la salida. Casi todos los resultados inservibles vienen de aquí: el contenido estaba bien, la forma no.",
    "style": "El tono y el nivel de detalle deciden si suena a persona o no. Cuanto más concreto sea este bloque, menos huele el resultado a IA.",
    "constraint": "Marca la frontera: lo que no quieres y lo que tiene que cumplirse siempre. Las restricciones dan más estabilidad que los pedidos, porque le cierran a la IA el espacio para improvisar.",
    "example": "Un ejemplo es la forma más rápida de alinear. Una muestra concreta suele transmitir más que diez frases abstractas.",
    "subject": "Un modelo de imagen solo dibuja lo que escribes. Cuanto más concreto sea el sujeto, menos espacio tiene para improvisar, es decir, para irse por las ramas.",
    "composition": "El tipo de plano y el ángulo deciden desde dónde mira el espectador. Es lo que separa una foto tomada al azar de una imagen pensada.",
    "lighting": "La luz es lo más caro del encuadre. Cambia la luz de la misma composición y tienes otra historia, y otra sensación de precio.",
    "mood": "La atmósfera responde a qué se siente al terminar de verla. Si solo describes el contenido y no la emoción, la imagen sale correcta pero sin fuerza.",
    "color": "El color es lo primero que se percibe y lo último que se nota. Fija la paleta y la imagen deja de verse desordenada.",
    "quality": "La calidad y las palabras de objetivo deciden lo refinado que se ve el resultado, y son la forma más directa de quitarle a una imagen el aire barato.",
    "negative": "El prompt negativo es el paso con mejor relación coste-beneficio: decir lo que no quieres es mucho más rápido que reajustar lo que sí quieres.",
    "action": "La única diferencia entre un vídeo y una imagen fija es el cambio. Describe bien el cambio y el modelo sabrá qué tiene que moverse.",
    "shot": "El tipo de plano es la gramática del vídeo. Un solo tipo suena monótono; varios implican que hay que montar los planos entre sí.",
    "focus": "Si un plano cerrado no dice qué hay que mirar, el modelo elige algo por su cuenta, y casi siempre lo menos importante. Por eso esto solo se aplica a primeros planos y planos cercanos: en un plano general no existe el punto de foco.",
    "move": "El movimiento de cámara es el tono de voz del vídeo: la cámara fija es contención, la órbita es énfasis, el plano en mano es documental.",
    "cut": "La estructura de montaje es el esqueleto: si es un solo plano o varios, decides cuántos tipos de plano tienes que cubrir. Un plano secuencia no tiene puntos de corte, así que la información la llevan el bloqueo y el movimiento de cámara; el montaje por storyboard puede unir distintos tipos de plano y meter más información.",
    "arc": "El arco emocional es el esqueleto del storyboard. Cuatro planos con la misma emoción se sienten planos; si fijas un arco, cada plano sabe qué parte de la pieza completa lleva.",
    "detail": "Los detalles visuales son la única forma de volver concreta una descripción. Cualquiera puede escribir que alguien camina bajo la lluvia, pero las gotas sobre el paraguas y el reflejo en el charco son lo que el modelo sí puede dibujar.",
    "duration": "La duración decide lo que el modelo puede sacar. Todo lo que pase de 15 segundos hay que partirlo en planos, o se deshilacha.",
    "audio": "El sonido es la mitad de la experiencia. Si tu herramienta no soporta audio, decir que no lo necesitas evita que le pongan música a la imagen de todas formas"
  },
  "cues": {
    "textTask": "escríbeme|escribe|escribir|redacta|redactar|resume|resumir|analiz|análisis|explica|explicar|traduce|traducir|pule|reescrib|reescritura|corrige|código|programa|guion|propuesta|informe|copy|esquema|correo|email|lluvia de ideas|dame ideas|ponle nombre|cuenta palabras",
    "visual": "lleva puesto|llevando|viste|sentado|sentada|de pie|tumbado|tumbada|apoyado|apoyada|caminando|corriendo|sobrevolando|suspendido|de espaldas|de perfil|primer plano|plano medio|plano general|plano cercano|cámara|encuadre|el fondo es|iluminación|luz|tono de color|atmósfera|profundidad de campo|desenfoque|textura|ilustración|fotorrealista|cyberpunk|anime|un gato|un perro|una mujer|un hombre|calle|escena nocturna|neón|reflejo|sombra|montaña nevada|lago|bosque|desierto|cielo|luz del sol|luz de luna|luz de neón|habitación|interior|edificio|rascacielos|azotea|suelo|césped|playa|metro|cafetería|librería|mesa de comedor|hojas|atardecer|amanecer|anochecer|salida del sol|puesta de sol|cielo estrellado|galaxia|niebla|charco|balcón|alféizar|callejón",
    "motion": "caminando|corriendo|sobrevolando|cayendo|fluyendo|girando|mirando atrás|timelapse|time-lapse|cámara lenta|slow motion|movimiento de cámara|plano secuencia|varios planos|cambio de plano|corte entre planos|graba|grabar|rodaje|filmando|movimiento (de )?cámara|(acerca|aleja|panea|sigue|sube|baja) la cámara"
  },
  "recommendRules": {
    "img.subject": [
      [
        "isub.person",
        "/retrato|persona|personas|hombre|mujer|chica|chico|joven|anciano|niño|niña|modelo|silueta|perfil|espalda/i"
      ],
      [
        "isub.animal",
        "/gato|perro|pájaro|animal|mascota|tigre|león|lobo|conejo|caballo|oso|panda|zorro|ballena|pez|dragón|mariposa|águila|ciervo/i"
      ],
      [
        "isub.food",
        "/comida|platillo|plato|cocina|arroz|fideos|café|pastel|postre|fruta|bebida|vino|\\bté\\b/i"
      ],
      [
        "isub.product",
        "/producto|botella|perfume|reloj|zapato|bolso|cosmético|cosmética|cuidado de la piel|bebida|envase|empaque|audífonos|teléfono/i"
      ],
      [
        "isub.vehicle",
        "/\\bcoche\\b|\\bauto\\b|mecanismo|nave espacial|robot|moto|avión|tanque|acorazado|vehículo|camión|tren/i"
      ],
      [
        "isub.arch",
        "/arquitectura|interior|habitación|sala|oficina|tienda|iglesia|puente|rascacielos|diseño de espacios/i"
      ],
      [
        "isub.scene",
        "/paisaje|ciudad|montaña|\\bmar\\b|bosque|desierto|nieve|cielo|calle|vista nocturna|amanecer|atardecer|pradera|lago|estrellado|lluvia/i"
      ],
      [
        "isub.abstract",
        "/abstracto|concepto|emoción|soledad|libertad|tiempo|memoria|sueño/i"
      ]
    ],
    "img.ratio": [
      [
        "irat.p916",
        "/9:16|vertical|fondo de pantalla del móvil|portada de video corto|douyin|tiktok|xiaohongshu|rednote|momentos de wechat/i"
      ],
      [
        "irat.l169",
        "/16:9|horizontal|fondo de pantalla|diapositiva|presentación|escritorio|sitio web|banner|portada de video/i"
      ],
      [
        "irat.square",
        "/1:1|cuadrado|avatar|e-commerce|logotipo|\\blogo\\b/i"
      ],
      [
        "irat.p34",
        "/3:4|póster|cartel|xiaohongshu|rednote|\\bportada\\b/i"
      ]
    ],
    "vid.ratio": [
      [
        "vrat.p916",
        "/tiktok|douyin|xiaohongshu|rednote|reels|9:16|vertical|móvil|celular/i"
      ],
      [
        "vrat.l169",
        "/bilibili|sitio web|youtube|16:9|horizontal|video promocional/i"
      ],
      [
        "vrat.square",
        "/feed|anuncio|publicidad|1:1|cuadrado/i"
      ]
    ]
  },
  "signalLabels": {
    "text": [
      [
        "hasRole",
        "Rol"
      ],
      [
        "hasAudience",
        "Público"
      ],
      [
        "hasFormat",
        "Formato"
      ],
      [
        "hasTone",
        "Tono"
      ],
      [
        "hasConstraint",
        "Restricciones"
      ],
      [
        "hasExample",
        "Ejemplos"
      ],
      [
        "hasBackground",
        "Contexto"
      ]
    ],
    "image": [
      [
        "hasSubject",
        "Sujeto"
      ],
      [
        "hasComposition",
        "Composición"
      ],
      [
        "hasLighting",
        "Iluminación"
      ],
      [
        "hasStyle",
        "Estilo"
      ],
      [
        "hasColor",
        "Color"
      ],
      [
        "hasRatio",
        "Relación de aspecto"
      ],
      [
        "hasNegative",
        "Restricciones negativas"
      ]
    ],
    "video": [
      [
        "hasSubject",
        "Sujeto"
      ],
      [
        "hasAction",
        "Acción"
      ],
      [
        "hasShot",
        "Tipo de plano"
      ],
      [
        "hasMove",
        "movimiento de cámara"
      ],
      [
        "hasStyle",
        "Look"
      ],
      [
        "hasLighting",
        "Iluminación"
      ],
      [
        "hasDuration",
        "Duración"
      ],
      [
        "hasAudio",
        "Audio"
      ],
      [
        "hasNegative",
        "Restricciones negativas"
      ]
    ]
  },
  "scoreItems": {
    "text": [
      {
        "key": "task",
        "label": "Claridad de la tarea",
        "weight": 20,
        "hint": "Si queda claro qué hay que hacer"
      },
      {
        "key": "role",
        "label": "Rol",
        "weight": 12,
        "hint": "Si se define el rol de la IA"
      },
      {
        "key": "context",
        "label": "Contexto",
        "weight": 16,
        "hint": "Si se explican los antecedentes y para quién es"
      },
      {
        "key": "format",
        "label": "Especificación de salida",
        "weight": 16,
        "hint": "Si se fijan forma, extensión y estructura"
      },
      {
        "key": "style",
        "label": "Tono y profundidad",
        "weight": 14,
        "hint": "Si se fijan el tono y el nivel de detalle"
      },
      {
        "key": "constraint",
        "label": "Restricciones",
        "weight": 12,
        "hint": "Si se delimita lo que no hay que hacer"
      },
      {
        "key": "example",
        "label": "Ejemplos",
        "weight": 10,
        "hint": "Si se da un ejemplo de referencia"
      }
    ],
    "image": [
      {
        "key": "subject",
        "label": "Sujeto",
        "weight": 24,
        "hint": "Si queda claro qué se dibuja"
      },
      {
        "key": "composition",
        "label": "Composición",
        "weight": 16,
        "hint": "Tipo de plano, ángulo y formato"
      },
      {
        "key": "lighting",
        "label": "Iluminación",
        "weight": 16,
        "hint": "Dirección y calidad de la luz"
      },
      {
        "key": "style",
        "label": "Estilo",
        "weight": 18,
        "hint": "Si el estilo visual está claro"
      },
      {
        "key": "color",
        "label": "Color",
        "weight": 12,
        "hint": "Tendencia general del color"
      },
      {
        "key": "negative",
        "label": "Restricciones negativas",
        "weight": 14,
        "hint": "Qué problemas se descartan"
      }
    ],
    "video": [
      {
        "key": "subject",
        "label": "Sujeto y acción",
        "weight": 22,
        "hint": "Qué se ve y qué ocurre"
      },
      {
        "key": "shot",
        "label": "Tipo de plano",
        "weight": 13,
        "hint": "Qué tipos de plano se usan"
      },
      {
        "key": "move",
        "label": "Movimiento de cámara",
        "weight": 15,
        "hint": "Cómo se mueve la cámara"
      },
      {
        "key": "style",
        "label": "Look",
        "weight": 16,
        "hint": "Textura general de la imagen"
      },
      {
        "key": "lighting",
        "label": "Iluminación",
        "weight": 12,
        "hint": "Cómo es la luz"
      },
      {
        "key": "audio",
        "label": "Audio",
        "weight": 10,
        "hint": "Cómo suena"
      },
      {
        "key": "negative",
        "label": "Restricciones negativas",
        "weight": 12,
        "hint": "Qué problemas se descartan"
      }
    ]
  },
  "frameModeLabels": {
    "none": "Sin especificar",
    "text": "Texto a imagen",
    "file": "Desde archivo",
    "prev": "Continuar desde el plano anterior"
  },
  "extractPatterns": {
    "image": {
      "hasComposition": "plano general|plano medio|plano americano|primer plano|primerísimo|plano detalle|vista desde arriba|ángulo bajo|ángulo alto|a nivel de ojos|punto de vista|composición|regla de los tercios|centrado|espacio negativo|macro|aéreo|simetr",
      "hasLighting": "luz|iluminación|contraluz|a contraluz|luz lateral|luz suave|luz dura|neón|atardecer|hora dorada|ambiente|tonos oscuros|clave alta|clave baja",
      "hasStyle": "estilo|fotorreal|ilustración|anime|manga|3d|render|óleo|pintura al óleo|tinta aguada|cyberpunk|look de película|píxel|foto|dibujo a mano|arte conceptual|acuarela|diseño plano",
      "hasColor": "color|paleta|tonos cálidos|tonos fríos|blanco y negro|monocromo|saturación|saturado|apagado|sepia",
      "hasRatio": "\\d+\\s*:\\s*\\d+|relación de aspecto|cuadrado|orientación vertical|orientación horizontal|vertical|horizontal|formato completo",
      "hasNegative": "sin |evita|evitar|excluye|excluir|nada de|no incluyas|no quiero|prompt negativo"
    },
    "video": {
      "hasAction": "acción|gira|girar|camina|caminando|corre|corriendo|vuela|volando|levanta|entra|sale|salir|cambia|cambio|interactúa|habla|sonríe|asiente|viento|fluye|se mueve|movimiento|baila|salta|alcanza",
      "hasShot": "plano|primer plano|plano medio|plano general|plano americano|plano detalle|gran plano general|ángulo|encuadre",
      "hasMove": "movimiento de cámara|acercamiento|alejamiento|paneo|paneado|travelling|seguimiento|órbita|grúa|en mano|cámara en mano|aéreo|dron|plano secuencia|cámara fija|zoom|dolly|tilt",
      "hasStyle": "estilo|cinematográfic|documental|publicitari|anime|animación|stop motion|vhs|cyberpunk|realista|textura|look de película",
      "hasLighting": "luz|iluminación|noche|nocturn|luz de día|contraluz|a contraluz|neón|hora dorada|atardecer",
      "hasDuration": "\\d+\\s*(s|seg|segs|segundo|segundos)\\b|duración|cuánto dura|minutos|storyboard|plano único|un solo plano",
      "hasAudio": "banda sonora|música de fondo|bgm|sonido ambiente|ambiente sonoro|efecto de sonido|sfx|voz en off|narración|diálogo|pista de audio|silenciado|sin audio|música|sin sonido",
      "hasNegative": "sin |evita|evitar|excluye|excluir|nada de|no incluyas|no quiero|prompt negativo"
    },
    "text": {
      "hasRole": "actúa como|actuando como|eres (un|una|el|la)|asume el papel|haz de|en el papel de|como experto|como un experto|como una experta|como senior|como un profesional|ponte en el papel",
      "hasAudience": "para (principiantes|expertos|niños|estudiantes|directivos|lectores|usuarios|mi equipo)|público|lectores|dirigido a|destinado a|escrito para|hablando a|explicar a|sin conocimientos técnicos|para gente",
      "hasFormat": "formato|tabla|viñeta|lista|markdown|esquema|outline|límite de palabras|\\d+\\s*palabras|estructura|secciones|json|bloque de código|numerad|lista de comprobación|encabezados",
      "hasTone": "tono|estilo|voz|humor|formal|informal|coloquial|relajado|serio|profesional|cercano|riguroso|divertido|desenfadado",
      "hasConstraint": "\\bno\\b |evita|evitar|nunca|debe|debes|obligatorio|asegúrate|sin |prohibido|no puede",
      "hasExample": "por ejemplo|p\\. ej\\.|ej\\.|como por ejemplo|tal como|ejemplo|muestra|referencia|similar a",
      "hasLength": "(\\d+)\\s*(palabras|caracteres|páginas?)|recuento de palabras|extensión|una página|dos páginas|cuántas páginas|máximo de palabras",
      "hasBackground": "contexto|antecedentes|porque|ya que|actualmente|somos|tenemos|nuestra (empresa|compañía|equipo|producto)|el contexto es|la situación es|el objetivo es|esto es para"
    }
  },
  "extractFlags": {
    "image": {
      "hasComposition": "i",
      "hasLighting": "i",
      "hasStyle": "i",
      "hasColor": "i",
      "hasRatio": "i",
      "hasNegative": "i"
    },
    "video": {
      "hasAction": "i",
      "hasShot": "i",
      "hasMove": "i",
      "hasStyle": "i",
      "hasLighting": "i",
      "hasDuration": "i",
      "hasAudio": "i",
      "hasNegative": "i"
    },
    "text": {
      "hasRole": "i",
      "hasAudience": "i",
      "hasFormat": "i",
      "hasTone": "i",
      "hasConstraint": "i",
      "hasExample": "i",
      "hasLength": "i",
      "hasBackground": "i"
    }
  },
  "detailPatterns": {
    "visualSubject": "lleva puesto|viste|de pie|sentado|sentada|tumbado|tumbada|apoyado|sosteniendo|posando|retrato|una foto de|una imagen de|una escena de|primer plano de|plano de",
    "image": {
      "lighting": "suave|dura|duro|cálid|frí|contraluz|a contraluz|luz lateral|luz natural|luz de estudio",
      "style": "estilo|textura|look$",
      "color": "cálid|frí|satur|apagad|monocrom|blanco y negro"
    },
    "video": {
      "shot": "plano",
      "move": "acercamiento|alejamiento|paneo|paneado|travelling|seguimiento|órbita|aéreo|dron|dolly|zoom|tilt",
      "style": "cinematográfic|documental|publicitari|anime|plano secuencia|look de película",
      "lighting": "hora dorada|noche|nocturn|contraluz|a contraluz",
      "audio": "banda sonora|música de fondo|bgm|sonido ambiente|efecto de sonido|sfx|voz en off|narración|piano|violonchelo|cuerdas|sonido de lluvia|pista de audio|silenciado|sin sonido"
    },
    "text": {
      "task": "escríbeme|escribe|por favor|quiero|necesito|me gustaría|genera|crea|analiz|diseña|organiza|dame|haz",
      "role": "experto|experta|senior|profesional|especialista",
      "format": "tabla|lista|viñeta|esquema|json",
      "styleTone": "tono|voz|estilo|formal|coloquial|informal|humor|riguroso|sencillo|profesional|cercano",
      "styleDepth": "en profundidad|detallad|breve|resumen|visión general|conciso|paso a paso|amplía|desarrolla|punto por punto"
    }
  },
  "detailFlags": {
    "visualSubject": "i",
    "image": {
      "lighting": "i",
      "style": "i",
      "color": "i"
    },
    "video": {
      "shot": "i",
      "move": "i",
      "style": "i",
      "lighting": "i",
      "audio": "i"
    },
    "text": {
      "task": "i",
      "role": "i",
      "format": "i",
      "styleTone": "i",
      "styleDepth": "i"
    }
  }
};

  root.PromptLensLocales = root.PromptLensLocales || {};
  root.PromptLensLocales['es'] = locale;
  if (typeof module !== 'undefined' && module.exports) module.exports = locale;
})(typeof globalThis !== 'undefined' ? globalThis : this);
