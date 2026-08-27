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
- **Embeddings**: OpenAI `text-embedding-ada-002` — **único uso de OpenAI en el sistema**
  (3 call sites: `analizar-caso`, `consultor-caso`, `mcp-server`). No redacta nada.
- **LLM primario**: Claude (Anthropic) — `claude-sonnet-4-6` en el razonamiento (FASE 3)
- **LLM de lectura previa y analogía**: Gemini (Google) — FASE 1.5 y FASE 2.5
- ⚠️ **NO existe fallback a GPT-4 Turbo.** Lo decía esta guía y era falso: no hay una sola
  referencia a `gpt-4` en `src/` ni en `supabase/`. El único fallback real es el de FASE 2.5,
  que cae de Gemini a `claude-haiku-4-5` si falta `GEMINI_API_KEY`. (Corregido 2026-08-27.)
- **Extensión Chrome**: `chrome-extension/` — MEV Navigator (Manifest V3)
- **MCP Server**: `supabase/functions/mcp-server/` — integración con Claude Cowork

---

## Arquitectura del pipeline (5 fases)

```
Entrada → FASE 1 Admisibilidad → FASE 1.2 Suficiencia del insumo → FASE 1.5 Lectura previa (Gemini)
        → FASE 2 RAG → FASE 2.5 Analogía fáctica → FASE 3 Razonamiento LIS → FASE 4 Validación → FASE 5 Informe
```

Cada fase puede rechazar. El rechazo fundado es un output válido. **Nunca improvisar.**

Las tres preguntas que hacen las capas de control son distintas y por eso hacen falta las tres:

| Capa | Pregunta |
|---|---|
| FASE 1 `checkAdmissibility` | ¿Esta consulta es de mi competencia? (penal, PBA, hechos mínimos) |
| **FASE 1.2 `evaluarSuficienciaInsumo`** | **¿Hay con qué? ¿Llegó materia prima o sólo metadato?** |
| FASE 4 `validateOutput` | ¿El texto que salió tiene sesgo acusatorio o certeza excesiva? |

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
└── _shared/
    ├── profile-config.ts        ← System prompt + config del perfil penal (compartido)
    ├── cuotas.ts                ← Cliente de consumir_cuota() (migración 010)
    └── suficiencia.ts           ← FASE 1.2: gate de suficiencia del insumo (+ .test.ts)
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
- Rate limit: **20/min** (`RATE_LIMIT_MAX`, es conversacional) + techo diario 40
  (`RATE_DIARIO_MAX`). ⚠️ Esta guía decía **10/min** y era falso — corregido 2026-08-27 contra
  `consultor-caso/index.ts:97-99`. El límite del **plan** es mensual y vive aparte — ver
  "Cuotas por plan".
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

🔴 **HALLAZGO 2026-08-27 — `redactar-escrito` y `auditar-estrategia` quedaron FUERA de todo
esto, y también fuera de `REQUIRE_AUTH`.** Verificado leyendo las dos funciones enteras.
**La mitad de autenticación ya está CORREGIDA** (ver abajo); la de cuota sigue abierta.

| | `analizar-caso` | `consultor-caso` | `redactar-escrito` | `auditar-estrategia` |
|---|---|---|---|---|
| Verifica el JWT del abogado | ✅ | ✅ | ❌ | ❌ |
| Descuenta cuota del plan | ✅ | ✅ | ❌ | ❌ |
| Rate limit | 10/min | 20/min + 40/día | 10/min por IP | 10/min por IP |
| `max_tokens` por llamada | — | 4000 | **5000** | **3000** |

Las dos van del rate limit por IP **directo** a la llamada a Anthropic: no importan
`_shared/cuotas.ts`, no llaman a `verificarUsuario()` y ni siquiera crean cliente de Supabase.
Lo único que las cubre es la verificación de JWT del **gateway** de Supabase, que se satisface
con la **anon key** — pública por diseño y embebida en la web y en la extensión.

⚠️ Ojo con la nota vieja del 2026-07-18 que dice *"con `REQUIRE_AUTH=true` los 3 endpoints daban
401"*: eso describía el síntoma en la web, no que las 3 validen. **Sólo 2 validan.**

**Consecuencia práctica:** un abogado del plan Básico puede generar escritos y auditorías sin
tope, y cada uno es una llamada a Sonnet. Es el mismo agujero que la migración 010 vino a tapar,
sin aplicar a la mitad del producto.

#### ✅ Mitad 1 CERRADA (2026-08-27) — autenticación

Nuevo módulo **`_shared/auth.ts`** (`verificarUsuario` + `requiereAuth`), importado por
`redactar-escrito` y `auditar-estrategia`. Rechazan `401 NO_AUTENTICADO` con `REQUIRE_AUTH=true`
y loguean `user=… ip=… auth=…` como hace `analizar-caso`.

Verificado antes de tocar nada, para no repetir el bug del 2026-07-18:
- ✅ `src/services/api.js` **ya mandaba** `Bearer ${await getAuthToken()}` a los dos endpoints
  (líneas 322 y 359). Un abogado logueado manda su `access_token` y pasa; sin sesión cae al
  anon key y ahora corta. **No rompe la web.**
- ✅ Ni la extensión ni el `mcp-server` llaman a estos dos endpoints → sin impacto.
- ✅ `deno check` OK en las 5 funciones · `npm run lint` 0 errores.

**✅ DEPLOYADO Y VERIFICADO CONTRA PRODUCCIÓN (2026-08-27).** Las tres funciones deployadas
(`redactar-escrito auditar-estrategia analizar-caso`) — el CLI subió `_shared/auth.ts` junto a
las dos primeras, confirmando que el módulo compartido se bundlea bien.

| Prueba | Resultado |
|---|---|
| `redactar-escrito` con **anon key** | **401 `NO_AUTENTICADO`** ✅ |
| `auditar-estrategia` con **anon key** | **401 `NO_AUTENTICADO`** ✅ |
| `redactar-escrito` con **sesión real** | 400 "El nombre del imputado es requerido" → pasó auth ✅ |
| `auditar-estrategia` con **sesión real** | 400 "Indique el objetivo defensivo" → pasó auth ✅ |
| `analizar-caso` con **sesión real** | 400 `RECHAZADA_HECHOS_INSUFICIENTES` (FASE 1 sana) ✅ |

🔑 **Por qué el 401 con anon key es la prueba que vale:** el anon key *pasa* el gateway de
Supabase (es un JWT válido). Que devuelva 401 significa que llegó hasta el código y lo frenó
`verificarUsuario()`. **Antes de este fix esa misma request llegaba a Anthropic y redactaba un
escrito.** Ninguna de las 5 pruebas tocó un proveedor de IA: todas cortaron antes.

⚠️ `analizar-caso` y `consultor-caso` conservan su copia inline de `verificarUsuario`. No se
tocaron a propósito: es código de producción verificado y unificarlo no arregla nada hoy.
Deuda menor.

#### ⬜ Mitad 2 ABIERTA — cuota

Falta que consuman cuota. **Decisión de Edgardo pendiente: qué recurso.** Recomendación dada
el 27/8: **recurso nuevo** en `planes` (no `analisis`, que haría competir redactar contra
analizar casos nuevos; no `consultas`, que fue dimensionado para chat y perdería visibilidad).
Dimensionado sugerido ~1,5× los análisis (Básico 30 · Profesional 90 · Estudio 225) para
respetar la regla "lo incluido cuesta ≈25% del precio".
⚠️ **Ese número es estimación sobre `max_tokens`, NO medición.** Antes de fijarlo, correr 2-3
escritos reales y mirar el gasto — como se hizo con los umbrales de suficiencia. `planes` es
editable por SQL, así que errarle no cuesta redeploy.

⛔ **Decisión comercial de Edgardo: la calidad del análisis es IGUAL en los tres planes.**
Nunca diferenciar planes por modelo (Sonnet abajo / Opus arriba). Lo que varía es el volumen
de uso y algunas funciones. Es una herramienta de defensa penal: el que paga las consecuencias
de un análisis más flojo no es el abogado, es su cliente detenido.

### Autenticación del frontend (fix 2026-07-18)
`src/services/api.js` ahora manda el **access_token de la sesión** del abogado
(`getAuthToken()`), con fallback al anon key solo sin sesión. Antes mandaba siempre
el anon key → con `REQUIRE_AUTH=true` los 3 endpoints daban 401 desde la web.

**MCP Server URL:** `https://nclpzmyjjmglpjalmrri.supabase.co/functions/v1/mcp-server`
**Tools expuestas: son 4**, no 2 como decía esta guía (corregido 2026-08-27 contra
`mcp-server/index.ts`): `analizar_caso`, `buscar_jurisprudencia`, `guardar_brief_expediente`,
`obtener_brief_expediente`.
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
- ~~**`GEMINI_MODEL` gobierna sólo la mitad**~~ — ✅ **CORREGIDO 2026-08-27.** FASE 2.5 tenía
  `gemini-2.0-flash` escrito fijo dentro de la URL, así que "cambiar el modelo sin redeploy"
  era cierto sólo para la lectura previa. Ahora hay una segunda env, **`GEMINI_MODEL_ANALOGIA`**
  (default `gemini-2.0-flash`), y los dos call sites arman la URL por constante.
  ⚠️ **Se dejaron separadas a propósito, no unificadas:** son dos trabajos distintos. La lectura
  previa exige **citas literales exactas** (por eso se pagó el salto a 3.6-flash, medido 8/8);
  la analogía sólo etiqueta cada criterio en una de cuatro categorías y corre sobre N criterios,
  donde el modelo barato alcanza. Meter las dos en `GEMINI_MODEL` habría cambiado el modelo de
  producción de FASE 2.5 en silencio, con su costo. `deno check` OK.

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
- [ ] **Deuda de UX del flujo MEV** — los tres son del mismo problema: *la interfaz no enseña
      el camino*. Relevados con Edgardo usando el sistema como lo usaría un abogado:
  1. **El panel no dice en ningún lado que hay que ir a `Documentos`, tildar actuaciones y
     traer el texto.** Es el más grave: el abogado se conecta, ve "Causa detectada" y aprieta
     Analizar. El arreglo de hoy tapa el agujero (trae solo lo tildado), pero por defecto vienen
     tildadas **2 de 12** y nada le sugiere que puede o debe marcar más. Tampoco se entiende
     qué hace el botón "Traer texto de seleccionadas" ni por qué importa.
  2. `Analizar.jsx` — el paso **"Abrí el MEV y navegá a tu causa"** y el paso 3 están
     **hardcodeados** como pendientes (líneas ~577-590): no existe estado que refleje si hay
     una causa abierta. Habría que hacer que `detector.js` publique en el DOM el estado de la
     causa, como ya hace con `data-alp-mev-installed`, y que la web lo lea.
  3. `Analizar.jsx` — los **5 pasos del pipeline nunca avanzan** en el flujo MEV. `pipelineFases`
     sólo se anima en el camino del formulario manual (~línea 359); cuando el análisis entra por
     Realtime nadie mueve ese estado.
- [ ] **Las tres capacidades que siguen al análisis, NUNCA probadas sobre un caso del MEV.**
      Se probaron sueltas, con carga manual; lo que no se probó es el encadenado, que es
      justamente donde vive la precarga de `src/utils/precargaAnalisis.js` (transporta
      `_hechos` / `_tipo_penal` / `_etapa_procesal` desde Resultado paso 2):
  - [ ] **Auditar Estrategia** desde el botón del análisis.
  - [ ] **Redactar Escrito** desde el botón del análisis.
  - [ ] **Consultor del caso** (`ConsultorChat`): iterar preguntas sobre un análisis del MEV.
        Verificado el 2026-08-03 pero sobre carga manual. ⚠️ Latencia ~18-20 s con Opus 5:
        parece colgado. ⚠️ La precarga parsea la carátula del **formato fijo de la extensión**,
        que hoy trae campos nuevos (organismo, fuero, imputado) — hay que ver que siga parseando.
- [ ] **Republicar la extensión**: la de la Web Store (`gojomc…`) está inservible y
      `manifest.json` sigue en `1.1.0` → subir a `1.2.0`. **No entregarla a ningún abogado antes.**

### ✅ Tema de fondo CERRADO (2026-08-26) — gate de suficiencia del insumo

**Era:** `ALC-PENAL-PBA-2026-000006` y `000007` corrieron con el índice de actuaciones y **sin
una sola línea del expediente**. Los dos salieron con el sello **INFORME APROBADO**, y adentro
propusieron prescripción de la acción sobre una condena firme. La sección "LIMITACIONES"
avisaba, pero el encabezado decía aprobado: el abogado lee el sello.

**Por qué pasaba:** había dos controles y ninguno miraba la materia prima. `checkAdmissibility`
pregunta *"¿es de mi competencia?"* (penal, PBA, hechos mínimos) — con la carátula alcanza.
`validateOutput` juzga **el texto de salida** (sesgo acusatorio, certeza excesiva) — un informe
vacío pero bien redactado y prudente pasa.

**Ahora hay un tercer control**, `supabase/functions/_shared/suficiencia.ts`, que corre como
**FASE 1.2**: después de admisibilidad y **antes de la cuota y de Gemini**, para que un rechazo
por falta de material no le descuente análisis al abogado ni gaste un peso en los proveedores.

Mide **materia prima**, que no es lo mismo que caracteres recibidos. Descuenta dos cosas que
parecen expediente y no lo son:

| Se descuenta | Por qué |
|---|---|
| El **índice de actuaciones** | Dice QUÉ actuaciones hay, no qué DICEN. No sostiene una nulidad. |
| La **carátula autogenerada** por la extensión | ~250 chars de metadato del MEV que no escribió nadie. Contarlos como relato del abogado era justamente lo que dejaba pasar a `000006`. |

Un relato de hechos **escrito por una persona** sí cuenta, y los PDF/imágenes adjuntos también
(el modelo los lee enteros): a quien adjuntó el expediente no se le devuelve el trabajo.

**Decisión de Edgardo (2026-08-26): mixto, rechazo o límite según el caso.**

| Nivel | Cuándo | Qué hace |
|---|---|---|
| `insuficiente` | sustancia < `MIN_SUSTANCIA_CHARS` | **422 `RECHAZADA_INSUMO_INSUFICIENTE`**, `fase_rechazo: 'insumo'`. No consume cuota, no llama a nadie. El fundamento enseña el camino. |
| `parcial` | vino del MEV y el cuerpo < `CUERPO_SUFICIENTE_CHARS` | Sale como **`limited`** y —esto es lo importante— se inyecta una **constancia obligatoria en el prompt**, no sólo en el encabezado. |
| `suficiente` | resto | Igual que antes. |

**Umbrales por env, calibrados contra los dos extremos reales — no elegidos de arriba:**
- `MIN_SUSTANCIA_CHARS` (default **400**): `000006` con la carátula y el índice descontados
  deja ~60 chars de sustancia; un relato manual serio de un abogado (delito, fecha, lugar,
  prueba de cargo, teoría del caso) mide ~725. 400 cae en el medio con margen para los dos
  lados. ⚠️ Subirlo le rebota trabajo legítimo a quien carga a mano, que es **peor** que dejar
  pasar un análisis flojo: el rechazo indebido lo hace desconfiar del sistema.
- `CUERPO_SUFICIENTE_CHARS` (default **2000**): una actuación real del MEV promedia 1.900–2.050
  caracteres. Menos que eso sobre un expediente entero es secuencia procesal, no fondo.

**La constancia va DENTRO del informe.** Es la corrección al parche del 2026-08-07, que sólo
avisaba en el panel de la extensión. Con `parcial`, el prompt le ordena al modelo: (1) no
afirmar como ocurrido nada que no esté en el material; (2) abrir "limitaciones" declarando
sobre qué trabajó, con números; (3) **no proponer una vía procesal cuyo presupuesto fáctico no
pueda verificar** — el punto 3 es el que hubiera frenado la prescripción sobre la condena firme.

**Tests:** `deno test --allow-env supabase/functions/_shared/suficiencia.test.ts` — 11 casos,
con fixtures que reproducen el formato exacto de `sidepanel.js → runAnalysis()`. Incluye el
falso positivo que más caro sale: **prosa judicial con fechas adentro no se confunde con un
índice**. ⚠️ Si cambia el formato del índice en la extensión, estos tests cambian con él: el
gate reconoce el índice por ese formato.

**La extensión ya no manda el análisis sin texto**: `runAnalysis()` corta antes y explica qué
falta hacer, en vez de decir "se va a analizar SOLO el índice" (que ahora sería falso).

🔴 **Hallazgo abierto de la misma sesión, NO tocado — `index.ts:1144`:** el prompt manda
`body.documentacion_caso.slice(0, 20000)`, y ese es el **único** camino por el que el expediente
llega a Claude. Pero el backend acepta `MAX_DOCUMENTACION_CHARS = 120.000` y la extensión
presupuesta 110.000. **De un expediente de 110.000 caracteres el modelo ve el 18%**, y encima
la lectura previa que Gemini antepone come de esos mismos 20.000. Es el mismo defecto de fondo
—firmar un informe sin haber leído el material— por otra vía. Subirlo cuesta plata real
(120.000 chars ≈ 30.000 tokens ≈ US$0,09 de input por análisis contra ~US$0,015 hoy): decisión
de Edgardo, no técnica.

### 🔴 Tema de fondo ABIERTO (2026-08-07) — confidencialidad: por dónde circulan los datos del expediente

Cada análisis manda texto íntegro de actuaciones judiciales a **terceros fuera del país**:
Gemini (Google) en FASE 1.5, Claude (Anthropic) en el razonamiento, y OpenAI en los embeddings
del RAG. El caso de prueba del 2026-08-07 era una causa **real** por abuso sexual agravado con
corrupción de menores: datos personalísimos del imputado **y de la víctima**, que no consintió
nada.

A resolver antes de vender esto a estudios:
- Retención de cada proveedor: confirmar **zero data retention** donde exista, y dejarlo escrito.
- Qué se le informa al abogado, y dónde. Hoy el aviso legal no dice que el expediente sale
  hacia proveedores de IA.
- Si conviene **seudonimizar** antes de enviar (nombres → iniciales). Tensión real: las citas
  textuales son el valor del sistema y los nombres aparecen dentro de esas citas.
- Encuadre: secreto profesional del abogado + **Ley 25.326** (datos sensibles). ⚠️ Esto lo tiene
  que revisar un abogado; no resolverlo por criterio técnico.

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
