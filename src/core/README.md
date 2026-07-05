# src/core — Pipeline de referencia (NO es el pipeline de producción)

> ⚠️ **Importante:** estos módulos TypeScript **no** los importa la app (React) ni
> corren en producción. El pipeline real de 5 fases vive en la Edge Function
> `supabase/functions/analizar-caso/index.ts` (Deno), que es la única fuente de verdad
> en runtime.

## Qué es esto

`src/core/*` es una implementación de referencia / tipada del pipeline LIS penal
(admisibilidad → RAG → razonamiento → validación → informe). Sirve como:

- Documentación ejecutable de los contratos y las fases.
- Base para tests unitarios de lógica pura sin depender del backend.

## Riesgo a vigilar

Al existir dos implementaciones (esta y la Edge Function), pueden **divergir**.
Si se toca lógica de negocio del pipeline, hacerlo en la Edge Function primero
(es la que se ejecuta) y, si corresponde, reflejarlo acá.

## Decisión (auditoría de producción, 2026-07-05)

Se mantiene como referencia. Si a futuro no se usa para tests ni documentación,
evaluar eliminarlo para evitar confusión (ítem B-3 del plan en `CLAUDE.md`).
