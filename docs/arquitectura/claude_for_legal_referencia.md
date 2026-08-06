# Claude for Legal — referencia externa y patrones a replicar

> **Qué es este documento.** Anthropic publicó en mayo de 2026 una suite oficial de plugins
> jurídicos. Es **jurisdicción Estados Unidos** y **no cubre derecho penal**, así que no se
> puede usar tal cual en ALP. Lo que sí vale es su **arquitectura**: resuelve problemas que
> nosotros tenemos abiertos. Este documento separa las dos cosas — qué descartamos y qué
> copiamos — para no volver a investigarlo desde cero.
>
> Relevado el **2026-08-06** leyendo el repo oficial. Nada de acá está implementado todavía.

---

## 1. Los hechos

| | |
|---|---|
| Nombre | **Claude for Legal** |
| Lanzamiento | 14 de mayo de 2026 |
| Repo | `github.com/anthropics/claude-for-legal` |
| Licencia | Apache 2.0 (se puede leer, adaptar y derivar) |
| Formato | **13 plugins**, ~94 skills en total |
| Instalación | Claude Code (`/plugin marketplace add`) o Claude Cowork |
| Integraciones | 20 plataformas (iManage, NetDocuments, Relativity, Everlaw, Westlaw, Docusign…) |

No son skills sueltas: cada **plugin** es un paquete por área de práctica, y adentro trae
entre 4 y 15 **skills**. Esa distinción importa — es el patrón #2 de la sección 4.

| Plugin | Skills | De qué va |
|---|---|---|
| `commercial-legal` | 7 | Contratos: NDA triage, revisión contra playbook, vencimientos |
| `corporate-legal` | 8 | M&A: due diligence tabular, closing checklist, actas de directorio |
| `employment-legal` | 8 | Laboral: despidos, clasificación de trabajadores, licencias |
| `privacy-legal` | 6 | Datos: DSAR, DPA, evaluaciones de impacto, GDPR |
| `product-legal` | 4 | Revisión legal de lanzamientos y publicidad |
| `regulatory-legal` | 6 | Monitoreo regulatorio y gap analysis contra políticas |
| `ai-governance-legal` | 5 | Gobernanza de IA: registro de casos de uso, evaluación de impacto |
| `ip-legal` | 9 | PI: marcas, cese y desista, DMCA, licencias open source |
| `litigation-legal` | 15 | Litigio civil: cronologías, gestión de casos, escritos |
| `legal-clinic` | 9 | Clínicas jurídicas universitarias |
| `law-student` | 10 | Estudiantes: IRAC, preparación de examen de bar |
| `legal-builder-hub` | 6 | Descubrir, instalar y **auditar** skills jurídicas de terceros |
| `cocounsel-legal` | 1 | Conector a Westlaw Deep Research (Thomson Reuters) |

**Disclaimer que ellos mismos publican** — vale la pena leerlo porque es la misma postura
que ALP ya sostiene:

> "Todo output de estos plugins es un **borrador para revisión de un abogado — no es
> asesoramiento legal, no es una conclusión jurídica, no reemplaza a un abogado.** […] El
> abogado que usa el plugin — no el plugin, y no Anthropic — es responsable por las
> posiciones jurídicas de su trabajo."

---

## 2. Jurisdicción: Estados Unidos

No lo declaran explícitamente en ningún lado, pero está en todo el andamiaje:

- **Laboral** — FMLA, CFRA, PFL, ADA; "controlling **state** test" para clasificar trabajadores.
- **Litigio** — FRE 408 (regla federal de evidencia), dockets federales por CourtListener,
  dockets estaduales por Trellis.
- **PI** — DMCA §512(g).
- **Estudiantes** — práctica para el **MBE**, el examen de bar norteamericano.
- **Societario** — disclosure schedules, unanimous written consents.

Lo único no-norteamericano es **GDPR**, dentro de `privacy-legal`.

⛔ **Conclusión: el contenido sustantivo y procesal no se toma. Nada.** Se toma la forma.

---

## 3. Aplicabilidad por vertical de ALP

El encuadre comercial del proyecto es que **Alcance Legal es el motor** y penal / civil /
familia / comercial son verticales gemelas. Esto es lo que aporta la suite a cada una:

| Vertical ALP | Plugin más cercano | Aprovechable | Por qué |
|---|---|---|---|
| **Penal** | *ninguno* | **0 %** | No existe plugin penal en los 13. Ni de fondo ni de forma. |
| **Comercial** | `commercial-legal` + `corporate-legal` | **~60-70 %** de la estructura | La práctica societaria y de M&A argentina ya está calcada de la norteamericana: data room, due diligence, closing checklist, playbook de cláusulas. Mismo vocabulario, mismo flujo. |
| **Civil** | `litigation-legal` | **~30-40 %**, solo gestión | Sirve la gestión de caso (cronología, intake, briefing, estado de cartera). **No sirve nada de *discovery*** — deposiciones, privilege log, subpoenas, legal hold: esa etapa procesal no existe en el CPCC. |
| **Familia** | `legal-clinic` (genérico) | **~10 %** | No hay plugin de familia ni siquiera para EE.UU. Y es la materia más atada a lo local: CCyC + procedimiento provincial + Ley 26.485. Solo se rescata el andamiaje administrativo (entrevista inicial, memo, cartas al cliente, plazos). |

---

## 4. Patrones de arquitectura a replicar

Esto es lo que justifica el documento. Cada patrón está mapeado contra el estado real de ALP.

### 4.1 · Entrevista de arranque → perfil de práctica persistente

**Qué hacen.** Cada plugin corre una vez `/<plugin>:cold-start-interview` antes del primer
uso. Esa entrevista escribe un **perfil de práctica** que después leen **todas** las skills
del paquete. El repo lo marca en negrita:

> *"Corré la entrevista de arranque primero. Cada skill lee del perfil de práctica que la
> entrevista escribe. Saltear el setup es la razón más común de output genérico."*

**Por qué nos sirve.** Hoy ALP no tiene memoria del abogado. Cada análisis manda
`hechos` / `tipo_penal` / `etapa_procesal` y nada más: el sistema no sabe en qué
departamento judicial trabaja, ante qué juzgados litiga, si hace instrucción o ejecución,
ni con qué estilo redacta. Eso es exactamente lo que produce un output correcto pero
impersonal.

**Dónde impactaría.** Tabla nueva en Supabase (`perfil_practica`, una fila por cuenta),
leída por `analizar-caso`, `consultor-caso` y las capacidades de redactar y auditar.
Candidatos a campos: fuero, departamento judicial, rol (defensa oficial / particular),
etapas que más trabaja, juzgados frecuentes, preferencias de redacción.

⚠️ Ojo con el costo: el perfil entra en el prompt de cada llamada. Conviene que sea corto
y que viaje en la parte **cacheada** del prompt, como ya hace `consultor-caso` con el
contexto del caso.

---

### 4.2 · Un paquete por fuero, motor compartido

**Qué hacen.** No hay una skill gigante de "derecho". Hay 13 paquetes independientes, cada
uno con su propio perfil, sus propias skills y su propio vocabulario. No se contaminan.

**Por qué nos sirve.** Valida la decisión comercial ya tomada (verticales gemelas), pero le
pone una exigencia técnica que hoy no está resuelta: **lo que se comparte es el motor, no
el criterio.** Cada fuero necesita corpus propio, prompts propios y compuerta de
admisibilidad propia.

**Dónde impactaría.** `criterios_juridicos` hoy no discrimina fuero. Antes de abrir la
segunda vertical hay que decidir si se agrega columna `fuero` con filtro en
`buscar_criterios`, o si va base separada por vertical. También `fuerosExcluidosKeywords`
de `analizar-caso` deja de ser una lista y pasa a ser un **ruteo**.

---

### 4.3 · Revisión tabular con cita obligatoria por celda

**Qué hacen.** `corporate-legal` tiene *Tabular Diligence Review*: revisión tabular sobre un
data room, **una fila por documento y cada celda citada** a su fuente.

**Por qué nos sirve — este es el que más urge.** Es la forma exacta del problema que nos
dejó la prueba real contra el MEV: un expediente de **193 actuaciones ≈ 400.000 caracteres**.
El desafío ahí no es leer, es **seleccionar y priorizar**, y hoy eso lo resuelve un regex de
`PRIORITY_TYPES` en `sidepanel.js` que contra el expediente real acertó **1 de 42 tipos**.

Una pasada tabular barata (una fila por actuación: fecha, tipo, quién firma, relevancia
defensiva, cita textual del pasaje que la hace relevante) reemplazaría al regex por
criterio, y dejaría el presupuesto de caracteres para lo que importa.

**Dónde impactaría.** Sería una fase previa a FASE 1.5, sobre Gemini Flash por costo — la
misma decisión de arquitectura que ya se tomó para el texto de los proveídos.

---

### 4.4 · Skills programadas (watchers)

**Qué hacen.** Varias skills están marcadas *(scheduled)*: corren solas cada tanto y
escriben un informe. *Renewal Watcher* (vencimientos contractuales), *Docket Watcher*
(movimientos del expediente), *Reg Feed Watcher* (digesto regulatorio de los lunes). Se
despliegan headless con `scripts/deploy-managed-agent.sh`.

**Por qué nos sirve.** El *docket watcher* es literalmente el MEV. Ya tenemos la extensión
que sabe leer `procesales.asp`; falta la pieza que vigile y avise. Y del lado civil/comercial,
el vigilante de vencimientos es plazos procesales.

⚠️ Bloqueante conocido: la sesión del MEV es del abogado y vive en su navegador. Un watcher
server-side no tiene esa sesión. O corre dentro de la extensión, o hay que resolver
credenciales — que es una decisión de producto y de privacidad, no técnica.

---

### 4.5 · Compuerta explícita antes de que algo salga

**Qué hacen.** Toda skill que produce algo que sale del estudio tiene un *send gate*
declarado. El *Demand Letter Drafter* redacta con conciencia de FRE 408 y **frena** antes
de enviar.

**Por qué nos sirve.** ALP ya tiene el instinto — banner de disclaimer, tabla "DATOS DEL
CASO — Completar antes de presentar" en el Word. Lo que aporta la suite es **formalizarlo
como regla de diseño**, no como decisión caso por caso: ninguna capacidad que genere algo
presentable puede terminar sin compuerta.

---

### 4.6 · Cita textual obligatoria (convergencia — ya lo hacemos)

Ellos: *"atribución de fuente en cada cita, defaults conservadores en privilegio y en
calificaciones jurídicas subjetivas, supuestos de jurisdicción explicitados"*.

Nosotros: FASE 1.5 de `analizar-caso` ya exige `senalamientos[].cita_textual` a Gemini,
justamente porque **un resumen no sostiene una nulidad**.

Se documenta como validación externa de una decisión ya tomada. No hay nada que cambiar.

---

### 4.7 · Framework de auditoría de skills

`legal-builder-hub` incluye una skill *Skill QA* que evalúa cualquier skill jurídica contra
un **Legal Skill Design Framework** propio. Sirve para auditar nuestros propios prompts y
criterios con criterio ajeno. Pendiente: leer el framework en detalle — todavía no se hizo.

---

### 4.8 · Cartera de casos, no caso suelto

`litigation-legal` tiene *Matter Intake*, *Matter Briefing*, *Portfolio Status* (distribución
de riesgo, vencimientos próximos, casos estancados) y *Outside Counsel Status*.

ALP ya tiene la tabla `briefs_expediente` y el MCP con `guardar_brief_expediente` /
`obtener_brief_expediente`: la pieza de datos existe. Falta la **vista de cartera** — hoy el
abogado ve un análisis por vez, no su conjunto de causas.

---

## 5. Trampas al adaptar

Copiar skills con forma norteamericana importa supuestos falsos. El problema es que **no dan
error**: producen un output que suena bien y está mal.

| Trampa | Qué asume EE.UU. | Qué rige en PBA |
|---|---|---|
| **Precedente vinculante** | *Stare decisis*: el fallo anterior obliga | La jurisprudencia es **persuasiva**, no obligatoria (salvo casación y plenarios). Una skill que razone "existe este precedente, entonces corresponde X" razona mal para acá. |
| ***Discovery*** | Producción de prueba entre partes antes del juicio | Proceso escrito dirigido por el juez. Deposiciones, privilege logs y subpoenas no tienen equivalente. |
| **Rol del abogado** | Litigante adversarial con amplia carga de gestión probatoria | En penal PBA, el eje es el expediente ya formado y la actuación del Ministerio Público. |

**Regla práctica:** de cada skill que se adapte, se tira la capa sustantiva y la procesal
completas y se conserva únicamente el esqueleto de workflow.

---

## 6. Qué NO se toma

- ❌ Contenido jurídico de fondo — todo es derecho estadounidense.
- ❌ Los conectores (Westlaw, Relativity, iManage): son de mercado norteamericano y además
  exigen suscripción propia del cliente.
- ❌ El plugin `cocounsel-legal` — es un conector propietario de Thomson Reuters.
- ❌ Los plugins educativos (`law-student`, `legal-clinic`) como producto: están calibrados
  para el bar exam y para clínicas universitarias norteamericanas.

---

## 7. Prioridad sugerida

Ordenado por relación entre lo que resuelve y lo que cuesta. **Es una propuesta, no una
decisión tomada.**

| # | Patrón | Resuelve | Esfuerzo |
|---|---|---|---|
| 1 | **4.3** Revisión tabular con cita | El problema abierto de las 193 actuaciones y el regex que acierta 1/42 | Medio |
| 2 | **4.1** Perfil de práctica | Output genérico; base necesaria para multi-fuero | Medio |
| 3 | **4.2** Paquete por fuero | Bloqueante real antes de abrir la segunda vertical | Alto |
| 4 | **4.8** Vista de cartera | Retención — el abogado vuelve todos los días, no una vez por causa | Bajo |
| 5 | **4.4** Watcher del MEV | Diferencial fuerte, pero bloqueado por la sesión del abogado | Alto |

---

## Fuentes

- [github.com/anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal) — repo oficial (Apache 2.0)
- [ABA Journal — Anthropic launches Claude for Legal](https://www.abajournal.com/news/article/anthropic-launches-claude-for-legal-giving-lawyers-20-new-program-integrations-and-12-practice-area-plugins)
- [Artificial Lawyer — Claude For Legal Launches](https://www.artificiallawyer.com/2026/05/12/claude-for-legal-launches-may-reshape-the-legal-tech-world/)
