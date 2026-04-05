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
├── analizar-caso/index.ts   ← Endpoint principal: POST /analizar-caso
└── mcp-server/index.ts      ← MCP Server: POST /mcp-server (JSON-RPC 2.0)
```

**MCP Server URL:** `https://bwwlgfgjxslbavhfuhia.supabase.co/functions/v1/mcp-server`
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

**Estado actual:** funcional, pendiente de prueba real en MEV.
**Próximo paso crítico:** reemplazar API Key de Anthropic por autenticación con Supabase (login del abogado).

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

`src/services/api.js` usa mocks cuando `VITE_USE_MOCKS !== 'false'`.
Para activar Supabase real: `VITE_USE_MOCKS=false` + corpus cargado (`node scripts/load-criterios.js`).

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
2. **Autenticación Supabase en extensión** — reemplazar API Key por login del abogado
3. **Chrome Web Store (unlisted)** — distribución a abogados beta
4. **Exportar análisis a Word** — skill `docx`, escritos editables desde el informe
5. **Corpus juridico RAG** — ampliar `criterios_juridicos` con más jurisprudencia SCBA/CSJN

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
