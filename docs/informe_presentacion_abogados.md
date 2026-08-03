# ALCANCE LEGAL PENAL

## Sistema de Inteligencia Jurídica para la Defensa Penal

**Provincia de Buenos Aires — Código Procesal Penal (Ley 11.922) y Código Penal de la Nación**

---

## Resumen ejecutivo

**Alcance Legal Penal** es un sistema de inteligencia jurídica especializado en defensa penal. Toma un expediente —directamente desde la Mesa de Entradas Virtual (MEV) de la Suprema Corte de Justicia de la Provincia de Buenos Aires— y produce en minutos un **informe defensivo estructurado**: encuadre procesal, análisis crítico de la prueba de cargo, detección de nulidades y vicios procesales, líneas de contraargumentación y conclusión defensiva.

El sistema opera **exclusivamente desde la perspectiva de la defensa**. Sus principios rectores son la presunción de inocencia y el *in dubio pro reo*: no resume el expediente en términos neutros, lo examina como lo haría un defensor experimentado buscando dónde la acusación es vulnerable.

Alcance Legal Penal **asiste al abogado, no lo reemplaza**. Cada informe es un insumo de trabajo profesional: la estrategia, el criterio y la firma son siempre del letrado.

---

## Qué es — y qué no es

Alcance Legal Penal **no es un chatbot** al que se le pregunta cualquier cosa y responde cualquier cosa. Es un **pipeline de análisis estructurado** que replica la metodología de trabajo de un asociado senior de defensa penal: lee el expediente completo, lo confronta contra una base de criterios jurídicos curada, razona bajo un protocolo defensivo estricto y somete su propio resultado a un control de calidad antes de entregarlo.

Esa disciplina tiene una consecuencia importante para el profesional: **el sistema sabe decir que no**. Si el caso no es materia penal de la Provincia de Buenos Aires, o si la información disponible no alcanza para un análisis serio, el sistema lo dice expresamente y fundamenta el rechazo o la limitación, en lugar de improvisar una respuesta. Para un abogado, un asistente que reconoce sus límites es más valioso que uno que opina de todo.

---

## El flujo de trabajo: del expediente al informe

### 1. Extensión Chrome «MEV Navigator»

La puerta de entrada principal es una **extensión oficial para Google Chrome**, publicada en la Chrome Web Store. El abogado navega la MEV como lo hace todos los días, **con su propia sesión y sus propias credenciales** —el sistema nunca las solicita ni las almacena—. Con el expediente en pantalla, un clic en el panel lateral extrae la carátula y el listado completo de actuaciones, y lo envía a analizar.

El resultado aparece automáticamente en la plataforma web, en tiempo real. No hay que copiar, pegar ni transcribir nada.

### 2. Carga manual

Para causas que no están en la MEV, o para trabajar con documentación suelta, la plataforma ofrece un **formulario de carga manual** que acepta texto, documentos PDF e imágenes (por ejemplo, fotografías de fojas). El resultado es el mismo informe estructurado.

---

## Cómo analiza: las cinco fases

Cada análisis atraviesa cinco fases sucesivas. Cualquiera de ellas puede detener el proceso con fundamento — esa es una garantía, no una falla.

**Fase 1 — Admisibilidad.** Verifica que el caso sea materia penal de la Provincia de Buenos Aires. Si pertenece a otro fuero u otra jurisdicción, el sistema lo indica expresamente.

**Fase 2 — Recuperación de criterios jurídicos.** Busca en su base de conocimiento —**95 criterios jurídicos curados**, con especial profundidad en nulidades, garantías constitucionales y prueba— los criterios aplicables al caso concreto.

**Fase 3 — Razonamiento defensivo.** Un modelo de inteligencia artificial de última generación (Claude, de Anthropic) analiza el expediente bajo un **protocolo penal inmutable** que le impone la perspectiva defensiva, le prohíbe la especulación y le exige fundar cada afirmación.

**Fase 4 — Control de calidad.** Una instancia de validación automática revisa el resultado como lo haría un socio senior: detecta sesgo acusatorio, certeza excesiva o afirmaciones sin sustento. Si encuentra debilidades, degrada el informe y lo advierte de manera visible.

**Fase 5 — Informe numerado.** El resultado se entrega como informe formal con numeración única y correlativa (formato `ALC-PENAL-PBA-2026-000042`), con disclaimer institucional versionado.

---

## Las cuatro herramientas

### Analizar caso

La herramienta central. Produce el informe defensivo completo, organizado en secciones:

| Sección | Contenido |
|---|---|
| **Encuadre procesal** | Etapa de la causa, tipo penal en juego, situación procesal del imputado |
| **Análisis de la prueba de cargo** | Examen crítico de cada elemento probatorio de la acusación: debilidades, contradicciones, origen |
| **Nulidades y vicios** | Vicios procesales detectados: detenciones irregulares, allanamientos defectuosos, cadena de custodia, plazos, actos sin las formalidades legales |
| **Contraargumentación** | Líneas argumentales concretas para enfrentar la posición de la acusación |
| **Conclusión defensiva** | Síntesis estratégica orientada a la decisión del defensor |
| **Limitaciones** | Qué no pudo analizarse y por qué — el sistema lo declara siempre |

### Auditar estrategia

El abogado describe la estrategia defensiva que tiene pensada y el sistema la somete a crítica constructiva: puntos débiles, riesgos procesales, escenarios adversos y alternativas que quizá no se consideraron. Funciona como una **discusión de caso con un colega** disponible a cualquier hora.

### Redactar escrito

Genera **borradores de escritos judiciales** —planteos de nulidad, excarcelaciones, apelaciones y otros— a partir del análisis del caso. Los borradores se exportan a **PDF y a Word**, listos para que el abogado los edite, complete las citas y les dé su impronta antes de presentarlos.

### Consultor del caso

Un chat de seguimiento **anclado a la causa ya analizada** —no un asistente genérico—. El abogado puede repreguntar sobre su expediente concreto ("¿y si planteo la nulidad del acta de procedimiento?", "¿qué dice el 189 para este supuesto?") y el consultor responde con el contexto completo del caso ya cargado.

**Las herramientas están encadenadas**: desde el resultado del análisis, «Redactar Escrito» y «Auditar Estrategia» se abren precargadas con los hechos, el tipo penal y la etapa procesal. El abogado no vuelve a tipear nada.

---

## Base de conocimiento jurídico

El corpus del sistema está **curado manualmente**, con especial fortaleza en la zona donde la defensa penal gana o pierde los casos:

- **Nulidades absolutas** — arts. 201 a 210 CPP PBA
- **Prueba ilícita y regla de exclusión** — art. 211 CPP PBA
- **Detención y aprehensión** — art. 151 CPP PBA
- **Allanamiento y requisitos de la orden** — art. 219 CPP PBA
- **Excarcelación** — arts. 169 y 189 CPP PBA
- **Prisión preventiva y su impugnación** — arts. 157 y 439 CPP PBA
- **Hábeas corpus** — Ley 23.098 y art. 18 de la Constitución Nacional

Las citas de jurisprudencia individualizada (carátula, tribunal, fecha) quedan a cargo del profesional: el sistema fundamenta en criterios y señala el camino; el abogado completa la cita con el fallo que elija invocar.

---

## Garantías profesionales

- **Perspectiva defensiva exclusiva.** El sistema no puede utilizarse para construir acusaciones. Su protocolo se lo impide.
- **Rechazo fundado.** Cuando no puede analizar con seriedad, lo dice. Nunca inventa.
- **Control anti-sesgo.** Cada informe pasa por una validación que detecta sesgo acusatorio y certeza excesiva antes de entregarse.
- **Confidencialidad.** Acceso con cuenta personal del abogado. La extensión trabaja con la sesión propia del profesional en la MEV y no almacena credenciales judiciales.
- **Trazabilidad.** Informes numerados, con historial de análisis consultable en la plataforma y disclaimer institucional versionado.
- **El abogado decide.** Cada informe es un insumo de trabajo. La valoración final, la estrategia y la responsabilidad profesional son siempre del letrado.

---

## Qué gana el abogado en la práctica

- **Horas de lectura convertidas en minutos.** La lectura sistemática y completa de un expediente —esa que en el estudio hace el asociado senior— se obtiene en minutos, con el expediente recién extraído de la MEV.
- **Nulidades que no se escapan.** El sistema revisa cada actuación buscando vicios. El planteo de nulidad que aparece a tiempo puede definir la causa.
- **La prueba de cargo, atacada desde el primer día.** En lugar de un resumen neutro, un mapa de las debilidades de la acusación.
- **Escritos que arrancan por la mitad del camino.** Borradores en Word con la estructura y el fundamento ya armados.
- **Una segunda opinión permanente.** Auditoría de estrategia y consultor del caso: la discusión de un caso difícil ya no depende de encontrar con quién tenerla.
- **Integración con Claude.** Para los estudios que ya trabajan con inteligencia artificial, el sistema puede consultarse directamente desde una conversación con Claude: analizar un caso, buscar criterios jurisprudenciales y mantener el brief del expediente, sin salir del chat.

---

## Un motor, cuatro fueros

**Alcance Legal es el motor.** La arquitectura del sistema —extracción del expediente, pipeline de cinco fases, base de conocimiento curada, control de calidad e informe numerado— es un motor único sobre el que se construyen verticales gemelas por fuero:

| Vertical | Fuero |
|---|---|
| **Alcance Legal Penal** | Defensa penal — el producto que presenta este informe |
| **Alcance Legal Civil** | Fuero civil |
| **Alcance Legal Familia** | Fuero de familia |
| **Alcance Legal Comercial** | Fuero comercial |

Los cuatro fueros comparten el mismo motor y la misma estructura: cada uno con su perfil jurídico propio, su corpus especializado y sus criterios de admisibilidad, pero con idénticas garantías de método, control de calidad y confidencialidad. El abogado que domina una vertical ya sabe usar las cuatro.

---

## Proyecciones

- **Acceso al PJN.** Integración con los sistemas del Poder Judicial de la Nación, para extender el alcance del sistema a las causas del fuero federal y nacional con el mismo flujo directo que hoy ofrece la MEV bonaerense.
- **Segmentación por provincias.** Verticales provinciales con el código procesal y el corpus propio de cada jurisdicción — el mismo motor, calibrado a la ley de cada provincia.
- **Análisis probatorio documental completo.** Incorporación automática de los PDF de cada actuación del expediente —descargados con la sesión del propio abogado— para que el análisis abarque el contenido íntegro de las presentaciones, no solo la carátula y el listado de actuaciones.
- **Jurisprudencia citable.** Ampliación del corpus con fallos individualizados de la SCBA y la CSJN, para que los informes citen precedentes concretos listos para invocar.
- **Despliegue de los fueros Civil, Familia y Comercial** sobre el motor ya probado en Penal.

---

## Cómo empezar

1. **Plataforma web:** https://alcance-legal-penal.vercel.app — acceso con cuenta personal.
2. **Extensión Chrome «MEV Navigator»:** se instala desde la Chrome Web Store y se inicia sesión con la misma cuenta de la plataforma.
3. **Manual de uso:** disponible dentro de la propia plataforma, con el paso a paso del flujo MEV, la carga manual y la exportación de escritos.

---

*Alcance Legal Penal — Sistema de Inteligencia Jurídica para la Defensa Penal. El informe asiste al profesional; la estrategia y la decisión son siempre del abogado.*
