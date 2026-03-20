# Alcance Legal — Guía para Claude Code

## Qué es este proyecto

Sistema de Inteligencia Jurídica (LIS) para Derecho Argentino. No es un chatbot — es un
pipeline de análisis estructurado que replica la metodología de un asociado senior de estudio.
**Objetivo: monetización**. Tres productos bajo la misma base de código:

| Producto | Perfil | ID | Corpus |
|---|---|---|---|
| Alcance Legal – Civil | `PROFILE_CIVIL` | `civil` | Derecho Civil / CCyC |
| Alcance Legal – Comercial | `PROFILE_COMERCIAL` | `comercial` | Derecho Comercial / Societario |
| Alcance Legal – Familiar | `PROFILE_FAMILIAR` | `familiar` | Derecho de Familia / CCyC Libro II |

## Stack

- **Frontend**: React 19 + Vite 7 + React Router 7
- **Backend**: Supabase Edge Functions (Deno)
- **DB**: Supabase PostgreSQL + pgvector (corpus RAG por fuero)
- **Embeddings**: OpenAI `text-embedding-ada-002`
- **LLM primario**: Claude (Anthropic) — ver `guidedCivilReasoning.ts`
- **LLM fallback**: GPT-4 Turbo (OpenAI)

## Arquitectura del pipeline (5 fases)

```
Entrada → FASE 1 Admisibilidad → FASE 2 RAG → FASE 3 Razonamiento LIS → FASE 4 Validación → FASE 5 Informe
```

Cada fase puede rechazar. El rechazo fundado es un output válido. **Nunca improvisar.**

## Archivos críticos del core

```
src/core/
├── profile.ts              ← CONTRATO DE CONFIGURACIÓN — toca esto primero
├── checkAdmissibility.ts   ← Gate del pipeline, agnóstico al perfil
├── rag/
│   └── retrieveCivilCriteria.ts   ← RAG sobre pgvector (pendiente: genericizar por perfil)
├── reasoning/
│   └── guidedCivilReasoning.ts    ← LLM con system prompt inmutable
├── validation/
│   └── validateCivilOutput.ts     ← Control senior, detecta certeza excesiva
└── report/
    ├── buildCivilReport.ts        ← Genera JSON del informe, agnóstico al perfil
    └── renderCivilReportPDF.ts    ← HTML → PDF, sin LLM
```

## Convenciones de código

- **Todo TypeScript tipado estrictamente** — sin `any`
- **Exports nombrados** para todos los módulos del core
- **`_internals`** export en cada módulo para testing sin exponer en API pública
- **Parámetros opcionales con default** para retrocompatibilidad (ej: `profile = PROFILE_CIVIL`)
- Numeración de informes: `ALC-{CODIGO}-{YEAR}-{SEQ6}` — ej: `ALC-COMERCIAL-2026-000042`

## Arquitectura de perfiles (gemelos)

Los tres productos comparten el mismo pipeline. El perfil controla:
1. `fueroAdmitido` — qué materia analiza
2. `fuerosExcluidos` — qué rechaza en admisibilidad
3. `codigoInforme` — prefijo del número de informe
4. `politicaRechazo` — mensajes de rechazo específicos al fuero
5. (pendiente) system prompt del razonador — en `guidedCivilReasoning.ts`
6. (pendiente) tabla del corpus en Supabase — en `retrieveCivilCriteria.ts`

## Pendiente para completar los gemelos

1. **RAG por fuero**: `retrieveCivilCriteria.ts` → aceptar `profile` y usar tabla/RPC distinta por fuero
2. **System prompt por perfil**: `guidedCivilReasoning.ts` → prompt específico para Comercial/Familiar
3. **Validación por perfil**: `validateCivilOutput.ts` → `FUERO_EXCLUIDO_KEYWORDS` dinámico por perfil
4. **Corpus Supabase**: crear tablas `criterios_comercial` y `criterios_familiar` con sus embeddings
5. **openapi.yaml**: duplicar spec para `/analizar-caso-comercial` y `/analizar-caso-familiar`

## Manual de ética

El sistema incluye un disclaimer institucional versionado (`v1.1`) en `buildCivilReport.ts`.
El manual de ética se está mejorando — cuando esté listo, actualizar:
- `DISCLAIMER_INSTITUCIONAL` en `buildCivilReport.ts`
- `SYSTEM_PROMPT` en `guidedCivilReasoning.ts` (sección de prohibiciones absolutas)

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
