# ALCANCE LEGAL PENAL

## Análisis Comercial y Valuación

**Sistema de Inteligencia Jurídica para la Defensa Penal · Provincia de Buenos Aires**

*Julio 2026*

---

## Resumen ejecutivo

Alcance Legal Penal es un producto terminado y en producción: plataforma web, extensión Chrome publicada en la Web Store integrada a la MEV de la SCBA, y servidor MCP que permite operar el sistema desde Claude. Su estructura de costos es la de un SaaS puro —costo variable de centavos de dólar por análisis contra planes de US$ 29 a 99 mensuales— con un margen bruto estimado del 80–95% según intensidad de uso.

El mercado direccionable inmediato supera los **60.000 abogados matriculados** en la Provincia de Buenos Aires. En el mercado legaltech argentino no existe hoy un competidor directo en su categoría: las plataformas establecidas (RivoLegal, MetaJurídico, Veredicta) son herramientas de **gestión de estudio y búsqueda de jurisprudencia**; ninguna produce un **análisis defensivo estructurado del expediente** con detección de nulidades y control de calidad. Alcance Legal Penal no compite por el mismo presupuesto: las complementa.

**Valuación estimada del sistema tal cual está (solo software): US$ 28.000 – 55.000.**
**Valuación con 100 abogados suscriptos: US$ 215.000 – 285.000.**

El motor es multi-fuero por diseño: los fueros Civil, Familia y Comercial son verticales gemelas sobre la misma estructura, y la expansión a PJN y a otras provincias multiplica el mercado direccionable sin reescribir el producto.

---

## 1. El activo hoy

### Producto completo, no prototipo

- **Plataforma web en producción** con cuatro herramientas: Analizar Caso (pipeline defensivo de 5 fases con informe numerado), Auditar Estrategia, Redactar Escrito (exportable a PDF y Word) y Consultor del Caso (chat anclado a la causa analizada).
- **Extensión Chrome «MEV Navigator»** publicada en la Chrome Web Store: extrae carátula y actuaciones del expediente con la sesión propia del abogado y las envía a análisis con un clic.
- **Servidor MCP operativo**: el sistema puede consultarse directamente desde una conversación con Claude (analizar casos, buscar criterios, mantener el brief del expediente).
- **Corpus jurídico curado**: 95 criterios con especial profundidad en nulidades (arts. 201-210 CPP PBA), prueba ilícita (art. 211), excarcelación (arts. 169 y 189), prisión preventiva (arts. 157 y 439) y garantías constitucionales.
- Manual de usuario, página de precios, disclaimer institucional versionado e historial de análisis con numeración correlativa.

### Estructura de costos

| Concepto | Costo |
|---|---|
| Infraestructura (hosting web + base de datos) | ~US$ 0–25 / mes a esta escala |
| Consultor del caso (IA) | ~US$ 0,04 primera consulta · ~US$ 0,02 siguientes |
| Análisis completo de caso (IA) | estimado < US$ 0,50 aun con expedientes largos |
| **Margen bruto estimado sobre planes de US$ 29–99** | **80–95%** (según intensidad de uso) |

### Diferenciales frente al mercado

1. **Especialización defensiva.** No es "IA para abogados": es un pipeline que solo hace defensa penal, con protocolo inmutable, control anti-sesgo automático y rechazo fundado cuando no puede analizar con seriedad. La restricción es el argumento de venta ante un profesional que desconfía —con razón— de los chatbots genéricos.
2. **Flujo MEV → informe en un clic.** Elimina la fricción de carga del expediente, el punto donde mueren las herramientas de IA jurídica.
3. **Motor multi-fuero.** La arquitectura de perfiles convierte a Civil, Familia y Comercial en configuración + corpus, no en desarrollo desde cero. El catálogo se multiplica sin multiplicar el costo.
4. **Canal MCP.** Integración nativa con Claude, resuelta y en funcionamiento.

---

## 2. Mercado

- **ColProBA agrupa a más de 60.000 abogados y procuradores matriculados** en la Provincia de Buenos Aires.
- Con un recorte muy conservador (3–5% con práctica penal regular), el nicho objetivo inicial es de **1.800 a 3.000 penalistas activos**, sin contar defensores oficiales ni el resto del país.
- **Disposición a pagar:** US$ 59 mensuales es menos de lo que un penalista factura por una hora de trabajo. Un solo planteo de nulidad detectado a tiempo paga años de suscripción.
- Los fueros Civil, Familia y Comercial —las verticales gemelas— tienen **más abogados activos que Penal**: el despliegue multi-fuero multiplica el mercado direccionable por 5 o más.

---

## 3. Comparativo con las herramientas del mercado

Precios según lo publicado por cada proveedor (julio 2026, moneda original de cada uno):

| | **Alcance Legal Penal** | RivoLegal | MetaJurídico | Veredicta | IA genérica (ChatGPT / Claude) |
|---|---|---|---|---|---|
| **Categoría** | Análisis defensivo del expediente | Gestión integral del estudio | Gestión + procuración automática | Gestión + búsqueda de jurisprudencia | Asistente de propósito general |
| **Precio publicado** | US$ 29 / 59 / 99 por mes | AR$ 49.000 / 149.000 / 399.000 por mes | desde AR$ 11.999 por mes | US$ 10 / 50 / 100 por usuario/mes | US$ 0–20 por mes |
| **Integración con sistemas judiciales** | MEV (SCBA) con extracción a análisis en un clic | PJN, MEV, SCBA, EJE (sincronización) | PJN, MEV, SRT (novedades e importación) | PJN, MEV, EJE (solo lectura) | Ninguna |
| **Qué hace su IA** | Informe defensivo estructurado: encuadre, prueba de cargo, nulidades, contraargumentación, conclusión | Redacción de escritos en español jurídico | Conexión MCP de los expedientes con Claude/ChatGPT; chatbot WhatsApp | Búsqueda de jurisprudencia sobre +500.000 fuentes; asistente sobre los casos | Responde lo que se le pregunte, sin expediente, sin corpus verificado |
| **Perspectiva defensiva penal** | ✅ Exclusiva y protocolizada | — | — | — | — |
| **Detección sistemática de nulidades y vicios** | ✅ | — | — | — | Solo si el abogado sabe qué preguntar |
| **Control de calidad anti-sesgo del resultado** | ✅ Validación automática en cada informe | — | — | — | — |
| **Rechazo fundado cuando no puede analizar** | ✅ | — | — | — | No: responde siempre (riesgo de alucinación) |
| **Borradores de escritos precargados desde el análisis** | ✅ PDF y Word | Redacción genérica | — | Plantillas | Genéricos, sin el expediente |

### Lectura del comparativo

- **Las tres plataformas argentinas son herramientas horizontales**: administran el estudio, siguen los expedientes, buscan jurisprudencia. Resuelven la *logística* del trabajo jurídico. Ninguna analiza el fondo de una causa desde la posición de la defensa.
- **Alcance Legal Penal es vertical**: hace una sola cosa —el trabajo analítico que haría un asociado senior de defensa penal— y la hace con método verificable. Es la única herramienta de su categoría en el mercado argentino.
- **No compiten por el mismo presupuesto.** Un estudio puede pagar MetaJurídico o RivoLegal para gestionar y Alcance Legal Penal para analizar. Son complementarios — lo que además convierte a esas plataformas en potenciales socios o compradores estratégicos, no solo en competencia.
- **Contra la IA genérica** —que es lo que muchos abogados usan hoy— la diferencia es de confiabilidad profesional: corpus curado del CPP PBA, protocolo defensivo inmutable, control anti-sesgo y un sistema que dice "no puedo analizar esto con seriedad" en lugar de inventar. Una alucinación citada en un escrito judicial tiene costo reputacional; el diseño completo de Alcance existe para impedirla.

---

## 4. Modelo de ingresos

Planes vigentes de la plataforma:

| Plan | Precio | Incluye |
|---|---|---|
| **Básico** | US$ 29 / mes | 20 análisis mensuales, informe PDF, corpus CPP PBA |
| **Profesional** | US$ 59 / mes | 100 análisis mensuales, imágenes y pericias adjuntas, soporte |
| **Estudio** | US$ 99 / mes | Análisis ilimitados*, hasta 5 usuarios, soporte prioritario |

\* Recomendación: incorporar cláusula de uso razonable antes de la apertura comercial.

### Escenarios de facturación (referencia: plan Profesional)

| Escenario | Suscriptores | Facturación anual aprox. |
|---|---|---|
| Validación | 20 | ~US$ 14.000 |
| Negocio consolidado | 100 | ~US$ 71.000 |
| Penetración 10% del nicho penal PBA | 300 | ~US$ 212.000 |

Con la estructura de costos actual, el punto de equilibrio operativo se alcanza con un puñado de suscriptores: prácticamente todo lo facturado es margen.

---

## 5. Valuación

> Estimación fundada según las convenciones del mercado de compraventa de software; no constituye una tasación formal.

### 5.1 Valor actual — el sistema tal cual está (solo software)

**Rango estimado: US$ 28.000 – 55.000.**

Método: **costo de reposición** — lo que le costaría a un tercero construir lo mismo desde cero.

| Componente | Estimación |
|---|---|
| Desarrollo (web + 5 servicios backend + extensión Chrome publicada + servidor MCP + suite de tests) | 800 – 1.100 horas de desarrollador senior |
| A tarifa freelance senior regional (US$ 35–50/hora) | US$ 28.000 – 55.000 |
| Curaduría jurídica del corpus (95 criterios con criterio de defensor) | + US$ 3.000 – 8.000 |
| **Costo de reposición total** | **US$ 31.000 – 63.000** |

En una venta real, el software sin base de usuarios se negocia por debajo de su costo de reposición (el comprador asume el riesgo comercial completo). Precio probable con un único interesado: **US$ 30.000 – 40.000**; por encima de US$ 45.000 solo con más de un oferente — escenario realista si el interesado es una plataforma de gestión que quiera incorporar la categoría "análisis defensivo" a su suite.

### 5.2 Valor con abogados suscriptos

Con facturación recurrente, el método cambia: los SaaS de este tamaño se negocian a **3–4 veces la facturación anual** (convención de los marketplaces de adquisición de software como Acquire.com).

| Abogados pagos | Facturación anual | Valor estimado de venta |
|---|---|---|
| 10 | ~US$ 7.000 | US$ 45.000 – 60.000 ¹ |
| 50 | ~US$ 35.000 | US$ 105.000 – 140.000 |
| 100 | ~US$ 71.000 | US$ 215.000 – 285.000 |
| 300 | ~US$ 212.000 | US$ 640.000 – 1.000.000 ² |

¹ Con pocos suscriptores el sistema se valúa como "activo + tracción validada": el piso sube respecto del software solo, aunque el múltiplo puro daría menos.
² Con 300 suscriptores y crecimiento sostenido el múltiplo sube a 4–5×: ya no se compra un producto sino un negocio con métricas.

### 5.3 Lectura práctica

- **Pasar de 0 a 50 abogados triplica el valor del sistema** (de ~US$ 35.000 a ~US$ 120.000). Ninguna funcionalidad nueva produce ese salto; solo las suscripciones.
- Cada abogado pago agrega **~US$ 2.000 – 2.800 al valor de venta** del sistema (su facturación anual × el múltiplo).
- **Retener puede ganar a vender:** con 100 abogados el sistema deja ~US$ 65.000 anuales de margen operativo — en dos o tres años de retención se factura más que el precio de venta. La venta solo conviene ante un comprador estratégico que pague por encima de múltiplo.

---

## 6. Proyecciones — los multiplicadores de valor

En orden de impacto comercial:

1. **Los cuatro fueros.** Alcance Legal es el motor; Penal, Civil, Familia y Comercial son verticales gemelas con la misma estructura. Civil y Familia tienen más profesionales activos que Penal: el despliegue completo multiplica el mercado direccionable por 5 o más con el mismo motor, y habilita la oferta "estudio integral" (los cuatro fueros en una suscripción).
2. **Segmentación por provincias.** Cada provincia es un perfil jurídico + corpus propio sobre el motor existente. Córdoba y Santa Fe son los mercados naturales siguientes.
3. **Acceso al PJN.** Abre el fuero federal y nacional — donde se concentra la mayor densidad de estudios con capacidad de pago del país.
4. **Análisis probatorio documental completo.** Incorporación automática de los PDF de cada actuación del expediente, para que el análisis abarque el contenido íntegro de las presentaciones. Sube el valor percibido y habilita un plan premium por encima de los US$ 99.
5. **Jurisprudencia citable.** Fallos individualizados de la SCBA y la CSJN en los informes, listos para invocar: la mejora de mayor impacto en retención.

---

## 7. Riesgos comerciales y mitigación

| Riesgo | Mitigación |
|---|---|
| Adopción lenta (perfil profesional conservador) | Venta por demostración con un expediente real del propio abogado; beta con referentes que recomienden |
| Cambios en el sitio de la MEV | Mantenimiento del extractor; riesgo operativo conocido y acotado |
| Plataformas de gestión que agreguen "análisis con IA" | La profundidad (protocolo defensivo + corpus curado + control de calidad) no se improvisa; posible sociedad o integración con esas plataformas |
| Confianza profesional (riesgo de alucinación) | Diseño completo orientado a impedirla: rechazo fundado, sección de limitaciones, citas a cargo del abogado. Es argumento de venta, no solo mitigación |
| Plan "ilimitado" sin techo | Cláusula de uso razonable en el plan Estudio |

---

## 8. Recomendación estratégica

Secuencia que maximiza valor por esfuerzo invertido:

1. **Cerrar los primeros 5–10 abogados suscriptos** con el producto actual. Es el único movimiento que convierte el activo en negocio y el que más mueve la valuación.
2. **Lanzar el análisis probatorio documental completo** con el feedback de esos casos reales.
3. **Desplegar el segundo fuero** (Familia o Civil, según la cercanía comercial), replicando un producto ya validado por usuarios pagos.
4. **PJN y provincias** con los ingresos financiando el crecimiento del corpus.

---

## Fuentes

- ColProBA — más de 60.000 abogados y procuradores matriculados en la Provincia de Buenos Aires (estimación sobre fuentes del Colegio y datos agregados de colegios departamentales)
- [ColProBA — Colegio de Abogados de la Provincia de Buenos Aires](https://colproba.org.ar/wp/)
- [RivoLegal — planes y funciones](https://rivolegal.com/)
- [MetaJurídico — planes y precios](https://metajuridico.com/planes-precios/)
- [Veredicta — precios](https://veredicta.com.ar/pricing)
- [Innovación Digital 360 — LegalTech en Argentina 2026](https://www.innovaciondigital360.com/software/software-legaltech-argentina-2026-software-estudios-juridicos-consultoras/)

---

*Documento de análisis comercial interno. Las valuaciones son estimaciones fundadas en convenciones de mercado y no constituyen tasación formal. Los precios de terceros corresponden a lo publicado por cada proveedor a julio de 2026.*
