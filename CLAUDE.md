# Alcance Legal Penal — Guía para Claude Code

## Qué es este proyecto

Sistema de Inteligencia Jurídica (LIS) especializado en **Defensa Penal** — Buenos Aires Province.
No es un chatbot — es un pipeline de análisis estructurado que replica la metodología de un asociado
senior de defensa penal. **Objetivo: monetización**. Producto único:

| Producto | Perfil | ID | Corpus |
|---|---|---|---|
| Alcance Legal Penal | `PROFILE_PENAL_PBA` | `penal_pba` | CPP PBA (Ley 11.922) / Código Penal |

El sistema opera **exclusivamente desde la perspectiva defensiva** (in dubio pro reo, presunción de inocencia).

## Stack

- **Frontend**: React 19 + Vite 7 + React Router 7
- **Backend**: Supabase Edge Functions (Deno) — `supabase/functions/analizar-caso/`
- **DB**: Supabase PostgreSQL + pgvector (tabla `criterios_penales`)
- **Embeddings**: OpenAI `text-embedding-ada-002`
- **LLM primario**: Claude (Anthropic) — ver `guidedPenalReasoning.ts`
- **LLM fallback**: GPT-4 Turbo (OpenAI)

## Arquitectura del pipeline (5 fases)

```
Entrada → FASE 1 Admisibilidad → FASE 2 RAG → FASE 3 Razonamiento LIS → FASE 4 Validación → FASE 5 Informe
```

Cada fase puede rechazar. El rechazo fundado es un output válido. **Nunca improvisar.**

## Archivos críticos del core

```
src/core/
├── profile.ts                    ← CONTRATO DE CONFIGURACIÓN — toca esto primero
├── checkAdmissibility.ts         ← Gate del pipeline, agnóstico al perfil
├── rag/
│   └── retrievePenalCriteria.ts  ← RAG sobre pgvector (tabla: criterios_penales)
├── reasoning/
│   └── guidedPenalReasoning.ts   ← LLM con system prompt penal inmutable
├── validation/
│   └── validatePenalOutput.ts    ← Control senior: detecta sesgo acusatorio, certeza excesiva
└── report/
    ├── buildPenalReport.ts       ← Genera JSON del informe (PenalReport)
    └── renderPenalReportPDF.ts   ← HTML → PDF, sin LLM
```

## Edge Function

```
supabase/functions/
└── analizar-caso/index.ts   ← Endpoint activo: POST /analizar-caso
```

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
  "disclaimer": { "version": "1.2-penal", ... },
  "meta": { "criterios_utilizados": 4, "pipeline_version": "1.0-lis-penal_pba" }
}
```

## Convenciones de código

- **Todo TypeScript tipado estrictamente** — sin `any`
- **Exports nombrados** para todos los módulos del core
- **`_internals`** export en cada módulo para testing sin exponer en API pública
- **Parámetros opcionales con default** — `profile = PROFILE_PENAL_PBA`
- Numeración de informes: `ALC-PENAL-PBA-{YEAR}-{SEQ6}` — ej: `ALC-PENAL-PBA-2026-000042`

## Perfil activo

El perfil `PROFILE_PENAL_PBA` controla:
1. `fueroAdmitido` — `penal`
2. `fuerosExcluidos` — civil, comercial, laboral, familia
3. `codigoInforme` — `PENAL-PBA`
4. `politicaRechazo` — mensajes específicos al fuero penal

## Mock vs producción

`src/services/api.js` usa mocks cuando `VITE_USE_MOCKS !== 'false'`.
Para activar Supabase real: `VITE_USE_MOCKS=false` + corpus cargado (`node scripts/load-criterios.js`).

## Disclaimer institucional

Versionado `v1.2-penal` en `buildPenalReport.ts`. Para actualizarlo:
- `DISCLAIMER_INSTITUCIONAL` en `buildPenalReport.ts`
- `SYSTEM_PROMPT_LIS_PENAL_PBA` en `guidedPenalReasoning.ts` (sección de prohibiciones absolutas)

## Comandos útiles

```bash
npm run dev      # Servidor local (Vite)
npm run build    # Build producción
npm run lint     # ESLint
```

## Supabase local

```bash
supabase start   # Levanta Supabase local en :54321
supabase stop    # Detiene Supabase local
```
