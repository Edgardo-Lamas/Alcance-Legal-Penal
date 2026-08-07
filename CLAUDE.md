# Alcance Legal Penal — Guía para Claude Code

## Qué es este proyecto

Sistema de Inteligencia Jurídica (LIS) especializado en **Defensa Penal** — Buenos Aires Province.
No es un chatbot — es un pipeline de análisis estructurado que replica la metodología de un asociado
senior de defensa penal. **Objetivo: monetización**. Producto único:

| Producto | Perfil | ID | Corpus |
|---|---|---|---|
| Alcance Legal Penal | `PROFILE_PENAL_PBA` | `penal_pba` | CPP PBA (Ley 11.922) / Código Penal |

El sistema opera **exclusivamente desde la perspectiva defensiva** (in dubio pro reo, presunción de inocencia).

---

## ⚠️ ESTADO ACTUAL Y PLAN DE TRABAJO PARA PRODUCCIÓN

> **Leer esto primero al comenzar cualquier sesión.** Estamos preparando el paso a
> producción. Auditoría completa realizada el **2026-07-05**. Estado: **apto para
> beta cerrada; NO listo para producción abierta** hasta cerrar los ítems 🔴 y 🟠.
> A medida que se completa una tarea, marcar `[x]` y anotar el commit.

### Ya verificado (no re-hacer salvo que se pida)
- ✅ Build de Vite compila (`npm run build`).
- ✅ Migraciones sanas: el overload duplicado de `buscar_criterios` está corregido en
  `008` y es el **único** caso del patrón (revisadas las 8).
- ✅ IDs de modelo Claude válidos y vigentes (`claude-sonnet-4-6`, `claude-haiku-4-5-20251001`).
- ✅ Extensión Chrome **sin API keys embebidas**: migrada a login Supabase, solo lleva
  la `anon key` (pública por diseño).

### Plan de trabajo — estado (actualizado 2026-07-05)

**✅ COMPLETADO EN CÓDIGO** (verificado: `deno check` de las 4 funciones OK, `npm run build` OK,
`npm run lint` exit 0, suite Playwright verde):

- [x] **C-1** · `validateOutput()` ya **no rechaza** por patrones de superficie: degrada a
  `limited` con advertencia. Deja de descartar análisis correctos que citan a la acusación.
- [x] **C-2** · `fuerosExcluidosKeywords`: se quitaron `'quiebra'`/`'alimentos'` y se pasó a
  frases específicas de otro fuero.
- [x] **A-1 (código)** · Verificación real de JWT (`supabase.auth.getUser`) + flag
  `REQUIRE_AUTH` + rate-limit persistente vía RPC `check_rate_limit` (migración **009**).
  ⤷ *Pendiente tuyo:* aplicar migración, setear envs y alertas de gasto (ver abajo).
- [x] **A-4** · `fetchConReintento` (backoff en 429/5xx) en OpenAI + Anthropic;
  `detectarPatrones` (código muerto) eliminado.
- [x] **A-2** · Suite Playwright **verde** (helpers/TEXTOS + flujos de auditar/redactar
  reescritos; se removieron tests de features eliminadas). Sigue siendo **solo mocks**
  → *pendiente:* 1 test de integración contra staging real.
- [x] **M-1** · Validación server-side de tamaño de imágenes (6MB) y PDF (13MB).
- [x] **M-2** · Gemini ya no pisa `hechos` en silencio: agrega advertencia visible al informe.
- [x] **M-3** · RAG con `filter_fuero: 'penal'` en `analizar-caso` y `mcp-server`.
- [x] **M-4** · Las 4 funciones devuelven mensaje genérico; el detalle solo va a `console.error`.
- [x] **M-5** · `MCP_SECRET` ya no cae al anon key (fail-closed si no está configurado).
- [x] **M-6** · `eslint.config.js` ignora artefactos + globals node en scripts → `npm run lint`
  exit 0 (6 warnings informativos).
- [x] **B-2 (README)** · `chrome-extension/README.md` actualizado al flujo de login Supabase.
- [x] **B-3** · `src/core/README.md` documenta que es referencia, no producción.

**✅ COMPLETADO EN INFRA (2026-07-07, verificado en vivo):**
- [x] **A-1 (deploy)** · Migración 009 aplicada (`supabase db push`); `REQUIRE_AUTH=true` y
  `MCP_SECRET` seteados en el proyecto nuevo. Verificado: anon key → 401 `NO_AUTENTICADO`;
  MCP → informe `ALC-PENAL-PBA-2026-000002` OK. **Nota:** `verificarUsuario()` en
  `analizar-caso` ahora acepta el service role key como caller interno del mcp-server
  (sin eso, REQUIRE_AUTH rompía la tool `analizar_caso`).
- [x] **A-3** · `npm audit fix` + reinstalación limpia → **0 vulnerabilidades**.
  `react-router-dom` 7.18.1 (RCE parcheado). Build OK, lint exit 0, 56 tests Playwright verdes.
- [x] **B-2 (zip)** · `alcance-legal-mev-navigator-v1.0.0.zip` eliminado (no estaba en git).
- [x] **Deploy Preview** · Envs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` agregadas al
  entorno Preview de Vercel; deploy de Preview verificado **Ready**. CLI actualizado a 54.21.1.
- [x] **MCP server** · Redesplegado con `--no-verify-jwt` (el gateway bloqueaba el token propio).
  ⚠️ Siempre deployar con: `supabase functions deploy mcp-server --no-verify-jwt`

**⏳ PENDIENTE — acciones tuyas (requieren tu entorno / red / dashboards)**
- [ ] **Alertas de gasto** en dashboards de Anthropic/OpenAI/Gemini (manual, solo vos).
- [ ] **A-2 (integración)** · Agregar ≥1 test que pegue contra un Supabase de **staging real**
  (no mock) para el happy-path del pipeline.
- [ ] **B-4** · `match_criterios_juridicos` (migración 006) queda como función huérfana
  (no la usa el código de producción). Cosmético — borrar si se confirma sin uso.
- [ ] **Seguridad** · Rotar `MCP_SECRET` por uno aleatorio (`openssl rand -hex 32`) antes de
  abrir la beta; actualizarlo en Supabase + Claude.ai + `~/.claude.json`.
- [ ] **Verificación E2E humana** · Login real de abogado → análisis completo en producción.

### Cómo salir a producción (checklist de release)
1. En tu máquina: `npm audit fix` + bump react-router-dom → `npm run build` OK.
2. Supabase: `supabase db push` (aplica migración 009) y recargar corpus si hace falta.
3. Envs de Edge Functions: `SUPABASE_ANON_KEY`, `REQUIRE_AUTH=true`, `MCP_SECRET`,
   `ALLOWED_ORIGIN` (dominio prod), + las claves de IA ya existentes.
4. Deploy funciones: `supabase functions deploy analizar-caso auditar-estrategia redactar-escrito consultor-caso mcp-server`.
5. Vercel: configurar env Production **y Preview**; deploy.
6. Alertas de gasto en los 3 proveedores de IA.
7. Verificación end-to-end con un caso real (login del abogado → análisis).

---

## Stack

- **Frontend**: React 19 + Vite 7 + React Router 7
- **Backend**: Supabase Edge Functions (Deno) — `supabase/functions/analizar-caso/`
- **DB**: Supabase PostgreSQL + pgvector (tabla `criterios_juridicos`)
- **Embeddings**: OpenAI `text-embedding-ada-002`
- **LLM primario**: Claude (Anthropic) — ver `guidedPenalReasoning.ts`
- **LLM fallback**: GPT-4 Turbo (OpenAI)
- **Extensión Chrome**: `chrome-extension/` — MEV Navigator (Manifest V3)
- **MCP Server**: `supabase/functions/mcp-server/` — integración con Claude Cowork

---

## Arquitectura del pipeline (5 fases)

```
Entrada → FASE 1 Admisibilidad → FASE 2 RAG → FASE 3 Razonamiento LIS → FASE 4 Validación → FASE 5 Informe
```

Cada fase puede rechazar. El rechazo fundado es un output válido. **Nunca improvisar.**

---

## Archivos críticos del core

```
src/core/
├── profile.ts                    ← CONTRATO DE CONFIGURACIÓN — toca esto primero
├── checkAdmissibility.ts         ← Gate del pipeline, agnóstico al perfil
├── rag/
│   └── retrievePenalCriteria.ts  ← RAG sobre pgvector (tabla: criterios_juridicos)
├── reasoning/
│   └── guidedPenalReasoning.ts   ← LLM con system prompt penal inmutable
├── validation/
│   └── validatePenalOutput.ts    ← Control senior: detecta sesgo acusatorio, certeza excesiva
└── report/
    ├── buildPenalReport.ts       ← Genera JSON del informe (PenalReport)
    └── renderPenalReportPDF.ts   ← HTML → PDF, sin LLM
```

---

## Edge Functions (Supabase)

```
supabase/functions/
├── analizar-caso/index.ts       ← Endpoint principal: POST /analizar-caso (pipeline 5 fases)
├── auditar-estrategia/index.ts  ← POST /auditar-estrategia (auditoría de estrategia defensiva)
├── redactar-escrito/index.ts    ← POST /redactar-escrito (borradores de escritos judiciales)
├── consultor-caso/index.ts      ← POST /consultor-caso (chat anclado a un análisis previo)
├── mcp-server/index.ts          ← MCP Server: POST /mcp-server (JSON-RPC 2.0)
└── _shared/profile-config.ts    ← System prompt + config del perfil penal (compartido)
```

> **Son 5 Edge Functions**. `analizar-caso` incluye la capa de extracción/validación
> con Gemini Flash (pre-procesamiento).

### Consultor del caso (`consultor-caso`, agregado 2026-07-18)
- Chat de seguimiento sobre una causa YA analizada — el widget `ConsultorChat` en
  Resultado (paso 2) manda `{ pregunta, contexto, historial }`.
- Secuencia propia (SIN Gemini — el expediente ya llega estructurado):
  gate de pertinencia (Haiku, fail-open) → RAG `buscar_criterios` (opcional) →
  Claude con **prompt caching** (system + contexto del caso = prefijo cacheado).
- Modelo por env `CONSULTOR_MODEL` (default **`claude-opus-5`** desde 2026-08-03) y esfuerzo
  por `CONSULTOR_EFFORT` (default `medium`). Para volver a Sonnet sin redeploy:
  `supabase secrets set CONSULTOR_MODEL=claude-sonnet-4-6`.
  ⚠️ Opus 5 razona antes de responder y ese razonamiento sale del mismo `max_tokens` que
  la respuesta: por eso `MAX_TOKENS_RESPUESTA` es 4000 aunque el prompt pida ≤300 palabras.
  Medido: el pensamiento se lleva ~65% de los tokens de salida. Latencia ~18s por pregunta.
- Rate limit persistente: 10/min + techo diario 40 (freno anti-abuso). El límite del
  **plan** es mensual y vive aparte — ver "Cuotas por plan".
- System prompt propio (el del perfil exige JSON — acá es conversacional, texto plano, ≤300 palabras).

### Cuotas por plan (migración 010, 2026-08-03)

Antes de esto, los límites publicados en `/precios` no los aplicaba **ninguna línea de código**:
un abogado del plan Básico podía correr 500 análisis. Ahora se aplican de verdad.

| Tabla | Rol |
|---|---|
| `planes` | Catálogo de topes. **Editable por SQL — cambiar un límite NO exige redeploy.** |
| `suscripciones` | Plan de cada cuenta + `creditos_analisis` / `creditos_consultas` comprados aparte |
| `consumo_mensual` | Consumo del período corriente (`YYYY-MM` en UTC) |

Límites vigentes: Básico 20 análisis + 100 consultas · Profesional 60 + 250 · Estudio 150 + 500.
Dimensionados con la regla **"lo incluido cuesta ≈25% del precio"** → margen ~75% parejo y
ganancia en dólares que crece con el plan. **Los topes son por CUENTA, no por usuario.**

Funciones: `consumir_cuota(uuid, 'analisis'|'consultas')` (atómica, `FOR UPDATE` por cuenta)
y `otorgar_creditos(uuid, analisis, consultas)` (venta manual de paquetes; cuando exista
pasarela de pago la llama el webhook). Cliente compartido en `_shared/cuotas.ts`.

**Cuatro reglas de diseño que no hay que romper:**
1. **Fail-closed.** Si `consumir_cuota` no responde, se rechaza. Es lo contrario del rate
   limit por minuto (que falla abierto): un error de base no puede habilitar uso ilimitado.
   ⚠️ Consecuencia operativa: **nunca deployar estas funciones sin la migración aplicada.**
2. Se cobra **después** de admisibilidad (`analizar-caso`) y **después** del gate de
   pertinencia (`consultor-caso`): un rechazo del sistema no le descuenta cupo al abogado.
3. Primero se gasta la cuota del abono; recién cuando se agota, el crédito comprado.
4. ⚠️ **El camino MCP (service role) NO consume cuota** — `esCuentaDeAbogado()` solo cobra a
   UUIDs reales. Está bien para uso propio; si se le da el MCP a un abogado, queda sin tope.

⛔ **Decisión comercial de Edgardo: la calidad del análisis es IGUAL en los tres planes.**
Nunca diferenciar planes por modelo (Sonnet abajo / Opus arriba). Lo que varía es el volumen
de uso y algunas funciones. Es una herramienta de defensa penal: el que paga las consecuencias
de un análisis más flojo no es el abogado, es su cliente detenido.

### Autenticación del frontend (fix 2026-07-18)
`src/services/api.js` ahora manda el **access_token de la sesión** del abogado
(`getAuthToken()`), con fallback al anon key solo sin sesión. Antes mandaba siempre
el anon key → con `REQUIRE_AUTH=true` los 3 endpoints daban 401 desde la web.

**MCP Server URL:** `https://nclpzmyjjmglpjalmrri.supabase.co/functions/v1/mcp-server`
**Tools expuestas:** `analizar_caso`, `buscar_jurisprudencia`
**Config local:** `~/.claude.json` → `mcpServers.alcance-legal-penal`

Para deployar cambios al MCP:
```bash
supabase functions deploy mcp-server
```

---

## Extensión Chrome — MEV Navigator

```
chrome-extension/
├── manifest.json     ← MV3, permisos: sidePanel, storage, activeTab, scripting
├── background.js     ← Service worker, manejo de mensajes
├── content.js        ← Inyectado en mev.scba.gov.ar — extrae DOM de la causa
├── sidepanel.html/js/css  ← UI principal del panel lateral
├── popup.html/js     ← Popup mínimo para abrir el panel
├── generate-icons.html   ← Abrí en Chrome para generar icons/
└── README.md
```

**Estado actual (2026-08-07):** probada dos veces contra el MEV real. Anda **cargada
descomprimida** desde `chrome-extension/`; la publicada en la Web Store (`gojomc…`, v1.1.0)
quedó **inservible** y debe seguir desactivada — ver "Estado del flujo MEV" más arriba.
**Autenticación:** ✅ ya migrada — `sidepanel.js` usa **login Supabase (email/password)** y
el `access_token` del abogado. Solo embebe la `SUPABASE_ANON_KEY` (pública por diseño).
**NO** hay API keys de Anthropic/OpenAI embebidas. (El `README.md` de la extensión todavía
describe el flujo viejo de API key — ver ítem B-2 del plan de trabajo.)

---

## Estructura de la respuesta API

```json
{
  "success": true,
  "status": "approved | limited | rejected",
  "data": {
    "numero_informe": "ALC-PENAL-PBA-2026-000001",
    "encuadre_procesal": "...",
    "analisis_prueba_cargo": "...",
    "nulidades_y_vicios": "...",
    "contraargumentacion": "...",
    "conclusion_defensiva": "...",
    "limitaciones": "..."
  },
  "advertencias": [],
  "disclaimer": { "version": "1.2-penal" },
  "meta": { "criterios_utilizados": 4, "pipeline_version": "1.0-lis-penal_pba" }
}
```

---

## Convenciones de código

- **Todo TypeScript tipado estrictamente** — sin `any`
- **Exports nombrados** para todos los módulos del core
- **`_internals`** export en cada módulo para testing sin exponer en API pública
- **Parámetros opcionales con default** — `profile = PROFILE_PENAL_PBA`
- Numeración de informes: `ALC-PENAL-PBA-{YEAR}-{SEQ6}` — ej: `ALC-PENAL-PBA-2026-000042`

---

## Perfil activo

El perfil `PROFILE_PENAL_PBA` controla:
1. `fueroAdmitido` — `penal`
2. `fuerosExcluidos` — civil, comercial, laboral, familia
3. `codigoInforme` — `PENAL-PBA`
4. `politicaRechazo` — mensajes específicos al fuero penal

---

## Mock vs producción

`src/services/api.js` usa mocks **solo si** `VITE_USE_MOCKS === 'true'` (explícito).
En producción (env sin setear) usa Supabase real. Corpus: `node scripts/load-criterios.js`.

---

## Disclaimer institucional

Versionado `v1.2-penal` en `buildPenalReport.ts`. Para actualizarlo:
- `DISCLAIMER_INSTITUCIONAL` en `buildPenalReport.ts`
- `SYSTEM_PROMPT_LIS_PENAL_PBA` en `guidedPenalReasoning.ts` (sección de prohibiciones absolutas)

---

## Skills disponibles para este proyecto

| Skill | Cuándo usar |
|---|---|
| `mev-navigator` | Navegar MEV, extraer expedientes, integrar con Chrome |
| `pdf` | Mejorar generación de PDF, extraer texto de PDFs del MEV |
| `docx` | Generar escritos judiciales en Word exportables |
| `mcp-builder` | Mejorar o agregar tools al MCP server |

---

## Deuda técnica conocida

- **Imágenes en base64**: actualmente se envían como base64 en el JSON body (+33% tamaño). Migrar a `multipart/form-data` cuando el volumen de abogados justifique el refactor (rompe la API actual).

## Roadmap acordado (próximas tareas)

1. **Prueba real de extensión en MEV** — ajustar `content.js` según DOM real
2. ~~**Autenticación Supabase en extensión**~~ — ✅ HECHO (login del abogado en `sidepanel.js`)
3. **Chrome Web Store (unlisted)** — distribución a abogados beta
4. **Exportar análisis a Word** — skill `docx`, escritos editables desde el informe
5. **Corpus juridico RAG** — ampliar `criterios_juridicos` con más jurisprudencia SCBA/CSJN

### 🔴 Estado del flujo MEV tras la prueba real del 2026-08-07 — LEER ANTES DE TOCAR LA EXTENSIÓN

Segunda prueba contra el MEV real (incidente de ejecución `INC-5354-EJEC`, Tribunal en lo
Criminal N°1 La Plata, 12 actuaciones). **El tramo extensión → backend nunca había
funcionado**: cinco defectos encadenados, ninguno visible sin sesión real del MEV.

Ya corregido y en este commit:

1. `content.js` — el MEV maqueta con **tablas anidadas**, así que la celda exterior contiene
   el texto de toda la página: buscar "la primera celda que menciona el label" devolvía un
   contenedor gigante. Ahora sólo se miran **celdas hoja** y se parsea `Label: valor` dentro
   de la misma celda. ⚠️ El MEV mezcla `º` (ordinal) con `°` (grado) y separa con **NBSP**.
   ⚠️ El nº de expediente **no siempre es numérico**: acá era `INC - 5354 - EJEC`.
2. `sidepanel.js` — al pasar a otra pestaña llegaba `isMev:false` y se **escondía** la sección
   de la causa, con el botón de analizar adentro. Los datos nunca se perdían.
3. `manifest.json` — faltaba `host_permissions` para Supabase ⇒ **"Failed to fetch"** en todo
   análisis lanzado desde el panel. **Resuelto por host permission, no por lista de orígenes
   en el backend: funciona con cualquier ID de extensión y republicar no exige tocar el server.**
4. Login del panel — descartaba el `refresh_token`. Con `jwt_exp = 3600`, a la hora exacta
   todo daba **401** mientras Config seguía mostrando "Cuenta conectada". Ahora renueva.
5. `analisis` **no estaba publicada en Realtime** → migración **012**. Sin eso la web queda en
   "Escuchando resultados…" para siempre, sin error en ningún lado.

⛔ **La regla que no hay que olvidar:** tildar los checkboxes de "Documentos" **no traía el
texto**; hacía falta apretar además "Traer texto de seleccionadas", paso que la interfaz no
pedía. Medido sobre la misma causa: **sin contenido el sistema no se abstiene, completa** —
dio por vicio principal una "paralización de 38 meses" y propuso **prescripción de la acción
sobre una condena firme**. Con el texto real encontró tres errores concretos y citables, dos
de ellos verificados palabra por palabra contra el expediente. `runAnalysis()` ahora trae el
texto solo y avisa si va a analizar únicamente el índice.

**Pendientes en este orden:**
- [ ] Verificar que la web **salta sola** al resultado por Realtime (único tramo sin ver funcionar).
- [ ] Corrida de validación de los 5 fixes (recargar extensión + **re-login en Config**: las
      sesiones viejas no tienen `refresh_token`).
- [ ] Web: la **barra de progreso del pipeline nunca avanza** y el paso **"Abrí el MEV" nunca
      se tilda** (`src/pages/Capacidades/Analizar/Analizar.jsx`).
- [ ] **Republicar la extensión**: la de la Web Store (`gojomc…`) está inservible y
      `manifest.json` sigue en `1.1.0` → subir a `1.2.0`. **No entregarla a ningún abogado antes.**

### 🔜 Tema abierto para la próxima sesión (2026-08-06)

**Leer `docs/arquitectura/claude_for_legal_referencia.md` antes de empezar.** Es el análisis
de la suite oficial de plugins jurídicos de Anthropic (jurisdicción EE.UU., sin fuero penal:
su contenido no sirve, su arquitectura sí). Trae 8 patrones mapeados contra este código.

Los dos primeros a atacar, en orden:

1. **Revisión tabular con cita textual por fila** (§4.3 del doc) — triar las 193 actuaciones
   de un expediente del MEV con criterio en vez del regex `PRIORITY_TYPES` de
   `chrome-extension/sidepanel.js`, que contra el expediente real **acertó 1 de 42 tipos**.
   Fase previa a FASE 1.5, sobre Gemini Flash por costo.
2. **Perfil de práctica persistente** (§4.1) — hoy no guardamos nada del abogado entre
   análisis (departamento judicial, etapa que más trabaja, juzgados, estilo de redacción).
   Es la causa del output correcto pero impersonal, y es prerrequisito del multi-fuero.

⚠️ **Bloqueante detectado para las verticales gemelas** (§4.2): `criterios_juridicos` no
discrimina fuero. Hay que decidir columna `fuero` + filtro en `buscar_criterios` **o** base
separada por vertical, **antes** de abrir civil/comercial/familia.

---

## Comandos útiles

```bash
npm run dev      # Servidor local (Vite) → http://localhost:5173
npm run build    # Build producción
npm run lint     # ESLint
```

## Supabase local

```bash
supabase start              # Levanta Supabase local en :54321
supabase stop               # Detiene Supabase local
supabase functions deploy analizar-caso   # Deploy edge function
supabase functions deploy mcp-server      # Deploy MCP server
```

---

## Referencias críticas del CPP PBA

- Hábeas corpus: **Ley 23.098** y art. 18 CN (NUNCA art. 405 CPP PBA)
- Excarcelación: **arts. 169 y 189** CPP PBA
- Nulidades absolutas: **arts. 201-210** CPP PBA (no requieren protesta previa)
- Prisión preventiva: **art. 157** CPP PBA — impugnar por **art. 439** CPP PBA
- Detención legal: **art. 151** CPP PBA
- Allanamiento: **art. 219** CPP PBA
- Prueba ilícita: **art. 211** CPP PBA
