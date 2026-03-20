# Plan: Deploy independiente de gemelos Comercial y Familiar

## Goal

Desplegar Alcance Legal – Comercial y Alcance Legal – Familiar como productos independientes,
cada uno con su propio proyecto Supabase, corpus jurídico, y Edge Function, compartiendo la misma base de código.

---

## Estado actual

| Componente | Civil | Comercial | Familiar |
|---|---|---|---|
| `src/core/profile.ts` | ✅ PROFILE_CIVIL | ✅ PROFILE_COMERCIAL | ✅ PROFILE_FAMILIAR |
| `src/core/checkAdmissibility.ts` | ✅ genérico | ✅ genérico | ✅ genérico |
| `src/core/rag/retrieveCivilCriteria.ts` | ✅ genérico | ✅ genérico | ✅ genérico |
| `src/core/reasoning/guidedCivilReasoning.ts` | ✅ system prompt | ✅ system prompt | ✅ system prompt |
| `src/core/validation/validateCivilOutput.ts` | ✅ genérico | ✅ genérico | ✅ genérico |
| `src/core/report/buildCivilReport.ts` | ✅ genérico | ✅ genérico | ✅ genérico |
| Edge Function | ✅ desplegado | ❌ pendiente | ❌ pendiente |
| Supabase proyecto | ✅ existente | ❌ pendiente crear | ❌ pendiente crear |
| Migration SQL | ✅ existente | ❌ pendiente | ❌ pendiente |
| Corpus cargado | ✅ parcial | ❌ vacío | ❌ vacío |

**Problema conocido:** La Edge Function `supabase/functions/analizar-caso/index.ts` tiene lógica inline
duplicada de `src/core/`. Es técnicamente deuda, pero no bloquea el deploy de los gemelos.
Se refactoriza en Tarea 3.3 (opcional, al final).

---

## Arquitectura: Un repo, tres Supabase

```
GitHub repo: alcance-legal
│
├── supabase/functions/analizar-caso/          → Supabase proyecto CIVIL
├── supabase/functions/analizar-caso-comercial/ → Supabase proyecto COMERCIAL
└── supabase/functions/analizar-caso-familiar/  → Supabase proyecto FAMILIAR
```

Cada producto tiene:
- Su propio `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Su propio pool de conexiones PostgreSQL (sin contención entre productos)
- Su propia tabla `criterios_juridicos` con corpus especializado
- Billing separado en Supabase (monetización independiente)

---

## Bloque 0: Shared code para Edge Functions

### Tarea 0.1 — Crear `supabase/functions/_shared/profile-config.ts`

**Archivo:** `supabase/functions/_shared/profile-config.ts` (nuevo)

**Qué:** Configuración de perfiles en formato Deno (sin imports de `src/core/` que son Node/bundler).
Los Edge Functions corren en Deno y no pueden importar desde `src/core/` directamente.

**Test primero:**
- No aplica (configuración pura, sin lógica)
- Verificar compilación: `deno check supabase/functions/_shared/profile-config.ts`

**Implementación:**
```typescript
// supabase/functions/_shared/profile-config.ts
export type ProfileId = 'civil' | 'comercial' | 'familiar'

export interface ProfileConfig {
  id: ProfileId
  nombre: string
  fueroAdmitido: string
  fuerosExcluidos: string[]
  codigoInforme: string
  fuerosExcluidosKeywords: string[]
  civilKeywords: string[]
  systemPrompt: string
  disclaimerCorpus: string
}
```

**Luego agregar `PROFILE_CIVIL_CONFIG`, `PROFILE_COMERCIAL_CONFIG`, `PROFILE_FAMILIAR_CONFIG`**
con los datos de los perfiles (copiar de `src/core/profile.ts` y `src/core/reasoning/guidedCivilReasoning.ts`).

**Verificar:** `deno check supabase/functions/_shared/profile-config.ts` → sin errores

**Commit:** `git commit -m "feat(edge): add shared profile-config.ts for Deno Edge Functions"`

---

### Tarea 0.2 — Crear `.env.civil`, `.env.comercial`, `.env.familiar`

**Archivos:** `.env.civil`, `.env.comercial`, `.env.familiar` (nuevos, en `.gitignore`)

**Qué:** Variables de entorno separadas por producto. Cada archivo apunta al Supabase project correspondiente.

**Test primero:**
- Verificar que `.gitignore` ya ignora archivos `.env.*`:
  ```bash
  cat .gitignore | grep env
  ```
- Si no está, agregar: `echo ".env.*" >> .gitignore`

**Implementación — plantilla por archivo:**
```bash
# .env.civil (apunta al proyecto Supabase existente)
SUPABASE_URL=https://[ID-CIVIL].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[KEY-CIVIL]
OPENAI_API_KEY=[OPENAI-KEY]
ANTHROPIC_API_KEY=[ANTHROPIC-KEY]

# .env.comercial (nuevo proyecto Supabase)
SUPABASE_URL=https://[ID-COMERCIAL].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[KEY-COMERCIAL]
OPENAI_API_KEY=[OPENAI-KEY]
ANTHROPIC_API_KEY=[ANTHROPIC-KEY]

# .env.familiar (nuevo proyecto Supabase)
SUPABASE_URL=https://[ID-FAMILIAR].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[KEY-FAMILIAR]
OPENAI_API_KEY=[OPENAI-KEY]
ANTHROPIC_API_KEY=[ANTHROPIC-KEY]
```

**Nota:** Los `[ID-X]` y `[KEY-X]` se completan en Tarea 4.x cuando se crean los proyectos.

**Verificar:** `git status` → `.env.*` aparece como untracked pero NO en stage

**Commit:** `git commit -m "chore: add .env.* to .gitignore for multi-product config"`

---

## Bloque 1: Supabase Comercial — Base de datos

### Tarea 1.1 — Crear proyecto Supabase Comercial

**Qué:** Crear nuevo proyecto en dashboard Supabase para Comercial.

**Pasos:**
1. Ir a https://supabase.com/dashboard
2. New project → nombre: `alcance-legal-comercial`
3. Anotar `Project URL` y `service_role` key → pegar en `.env.comercial`
4. Enlazar CLI localmente:
   ```bash
   supabase link --project-ref [ID-COMERCIAL]
   ```

**Verificar:**
```bash
supabase projects list  # debe mostrar el nuevo proyecto
```

---

### Tarea 1.2 — Migración `criterios_comercial` en proyecto Comercial

**Archivo:** `supabase/migrations/002_create_criterios_comercial.sql` (nuevo)

**Qué:** Misma estructura que `001_create_criterios_table.sql` pero para el proyecto Comercial.
Como es un proyecto Supabase separado, la tabla puede llamarse igual (`criterios_juridicos`).

**Test primero:**
```bash
# Verificar que el proyecto Comercial está vacío
supabase db remote commit  # debe mostrar sin cambios pendientes
```

**Implementación:** Copiar `001_create_criterios_table.sql` como `002_create_criterios_comercial.sql`
con estos cambios:
- Comentario: `Alcance Legal – Comercial`
- `COMMENT ON TABLE`: `'Almacena criterios jurídicos comerciales vectorizados'`

```bash
# Aplicar al proyecto Comercial
supabase db push --project-ref [ID-COMERCIAL]
```

**Verificar:**
```bash
# La tabla existe en el proyecto Comercial
supabase db diff --project-ref [ID-COMERCIAL]  # debe mostrar "No schema changes"
```

**Commit:** `git commit -m "feat(db): add migration 002 for criterios_comercial schema"`

---

### Tarea 1.3 — Script de ingesta de corpus Comercial

**Archivo:** `supabase/seed/seed-comercial.ts` (nuevo)

**Qué:** Script que carga criterios jurídicos comerciales en la tabla del proyecto Comercial.

**Corpus inicial mínimo (LGS 19.550 + LCQ 24.522):**
```typescript
const CRITERIOS_COMERCIAL = [
  {
    id: "COM-001",
    instituto: "sociedades_comerciales",
    subtipo: "sociedad_de_responsabilidad_limitada",
    criterio: "Responsabilidad limitada del socio en SRL",
    regla_general: "Los socios de una SRL limitan su responsabilidad al capital aportado (Art. 146, LGS 19.550)",
    articulos_ccyc: ["Art. 146 LGS", "Art. 148 LGS"],
    nivel_autoridad: "vinculante",
    alcance: "criterios_generales",
    jurisdiccion: "argentina_nacional",
    contenido: "En una SRL, los socios responden por las obligaciones sociales hasta el límite de su aporte. La responsabilidad personal del socio no puede ser extendida salvo fraude o uso abusivo de la personalidad jurídica (Art. 54 LGS)."
  },
  // ... más criterios
]
```

**Test primero:**
```bash
# Verificar conexión al proyecto Comercial
deno run --allow-net --allow-env \
  --env-file=.env.comercial \
  supabase/seed/test-connection.ts
```

**Implementación del script de ingesta:**
- Lee `CRITERIOS_COMERCIAL`
- Genera embedding con OpenAI para cada `contenido`
- Inserta en `criterios_juridicos` del proyecto Comercial

**Verificar:**
```bash
deno run --allow-net --allow-env \
  --env-file=.env.comercial \
  supabase/seed/seed-comercial.ts
# Output esperado: "Cargados 10 criterios en criterios_juridicos (Comercial)"
```

**Commit:** `git commit -m "feat(seed): add corpus comercial inicial (LGS + LCQ)"`

---

## Bloque 2: Supabase Familiar — Base de datos

### Tarea 2.1 — Crear proyecto Supabase Familiar

**Igual que Tarea 1.1 pero para Familiar.**

- Nombre proyecto: `alcance-legal-familiar`
- Anotar URL y key → pegar en `.env.familiar`

```bash
supabase link --project-ref [ID-FAMILIAR]
```

---

### Tarea 2.2 — Migración `criterios_familiar`

**Archivo:** `supabase/migrations/003_create_criterios_familiar.sql` (nuevo)

**Igual que Tarea 1.2 pero para proyecto Familiar:**

```bash
supabase db push --project-ref [ID-FAMILIAR]
```

**Commit:** `git commit -m "feat(db): add migration 003 for criterios_familiar schema"`

---

### Tarea 2.3 — Script de ingesta corpus Familiar

**Archivo:** `supabase/seed/seed-familiar.ts` (nuevo)

**Corpus inicial mínimo (CCyC Libro II + Ley 26.061 + Ley 26.485):**
```typescript
const CRITERIOS_FAMILIAR = [
  {
    id: "FAM-001",
    instituto: "alimentos",
    subtipo: "cuota_alimentaria",
    criterio: "Determinación de cuota alimentaria",
    regla_general: "La cuota alimentaria se fija según las necesidades del alimentado y posibilidades del alimentante (Art. 659 CCyC)",
    articulos_ccyc: ["Art. 659 CCyC", "Art. 660 CCyC", "Art. 661 CCyC"],
    nivel_autoridad: "vinculante",
    alcance: "criterios_generales",
    jurisdiccion: "argentina_nacional",
    contenido: "El derecho alimentario comprende lo necesario para subsistencia, habitación, vestuario, asistencia médica, educación, esparcimiento, y todo lo requerido para la formación integral del menor. El juez fija la cuota considerando ingresos, gastos y nivel de vida."
  },
  // ... más criterios
]
```

**Verificar:**
```bash
deno run --allow-net --allow-env \
  --env-file=.env.familiar \
  supabase/seed/seed-familiar.ts
# Output esperado: "Cargados 10 criterios en criterios_juridicos (Familiar)"
```

**Commit:** `git commit -m "feat(seed): add corpus familiar inicial (CCyC Libro II + Ley 26.061)"`

---

## Bloque 3: Edge Functions

### Tarea 3.1 — Crear Edge Function Comercial

**Archivo:** `supabase/functions/analizar-caso-comercial/index.ts` (nuevo)

**Qué:** Copia de `supabase/functions/analizar-caso/index.ts` con estas diferencias:
1. `SYSTEM_PROMPT_LIS` → system prompt Comercial (de `src/core/reasoning/guidedCivilReasoning.ts`)
2. `FUERO_EXCLUIDO_KEYWORDS` → keywords Comercial (sin 'quiebra', 'LGS' — esos son DEL fuero)
3. `CIVIL_KEYWORDS` → keywords de materia Comercial
4. Número de informe: `ALC-COMERCIAL-${año}-${seq}`
5. `pipeline_version: '2.0-lis-comercial'`
6. Mensajes de rechazo: `"Alcance Legal – Comercial opera exclusivamente..."`

**Cambios específicos en el system prompt (reemplazar completamente):**
```
Eres un Asociado Senior de Derecho Comercial Argentino.
Operás exclusivamente dentro del derecho comercial y societario argentino.
Normas base: LGS 19.550, LCQ 24.522, CCyC Libro III (obligaciones y contratos comerciales).
```

**Keywords Comercial (admitidos):**
```typescript
const COMERCIAL_KEYWORDS = [
  'sociedad', 'srl', 'sa', 'fideicomiso', 'leasing', 'concurso', 'quiebra',
  'accionista', 'directorio', 'cheque', 'pagaré', 'letra de cambio',
  'contrato comercial', 'fondo de comercio', 'marca', 'patente'
]
```

**Keywords excluidos (para Comercial):**
```typescript
const FUERO_EXCLUIDO_KEYWORDS_COMERCIAL = [
  'penal', 'delito', 'crimen', 'prisión', 'homicidio',
  'laboral', 'despido', 'LCT',
  'divorcio', 'alimentos', 'tenencia', 'adopción', 'régimen de visitas',
  'responsabilidad civil extracontractual'
]
```

**Test primero:**
```bash
# Verificar que la función compila sin errores
deno check supabase/functions/analizar-caso-comercial/index.ts
```

**Verificar:**
```bash
deno check supabase/functions/analizar-caso-comercial/index.ts
# Output esperado: sin errores de tipo
```

**Commit:** `git commit -m "feat(edge): add analizar-caso-comercial Edge Function"`

---

### Tarea 3.2 — Crear Edge Function Familiar

**Archivo:** `supabase/functions/analizar-caso-familiar/index.ts` (nuevo)

**Igual que Tarea 3.1 pero para Familiar:**

**System prompt Familiar:**
```
Eres un Asociado Senior de Derecho de Familia y Personas del Derecho Argentino.
Operás exclusivamente dentro del derecho de familia argentino.
Normas base: CCyC Libro II (Relaciones de Familia), Ley 26.061 (Protección Integral del Niño),
Ley 26.485 (Violencia contra la Mujer), Ley 26.994 CCyC.
Principio rector: INTERÉS SUPERIOR DEL NIÑO Y ADOLESCENTE.
```

**Keywords Familiar (admitidos):**
```typescript
const FAMILIAR_KEYWORDS = [
  'divorcio', 'alimentos', 'tenencia', 'cuidado personal', 'adopción',
  'régimen de visitas', 'comunicación', 'unión convivencial',
  'responsabilidad parental', 'filiación', 'tutela', 'curatela',
  'violencia familiar', 'violencia de género', 'bien de familia'
]
```

**Keywords excluidos (para Familiar):**
```typescript
const FUERO_EXCLUIDO_KEYWORDS_FAMILIAR = [
  'penal', 'delito', 'crimen', 'prisión', 'homicidio',
  'laboral', 'despido', 'LCT',
  'sociedad', 'quiebra', 'concurso', 'cheque', 'pagaré',
  'responsabilidad civil extracontractual'
]
```

**Número de informe:** `ALC-FAMILIAR-${año}-${seq}`

**Test primero:**
```bash
deno check supabase/functions/analizar-caso-familiar/index.ts
```

**Commit:** `git commit -m "feat(edge): add analizar-caso-familiar Edge Function"`

---

### Tarea 3.3 — (Opcional) Refactorizar Edge Function Civil [DEUDA TÉCNICA]

**Esta tarea NO bloquea el deploy.** Completar después de validar que los tres productos están up.

**Qué:** La Edge Function Civil (`supabase/functions/analizar-caso/index.ts`) tiene lógica duplicada
de `src/core/`. Refactorizar para importar desde `supabase/functions/_shared/profile-config.ts`
y eliminar duplicaciones.

**Beneficio:** Un solo lugar para cambiar el system prompt, keywords, y lógica de validación.

**Commit:** `git commit -m "refactor(edge): consolidate Civil EF to use shared profile-config"`

---

## Bloque 4: Deploy

### Tarea 4.1 — Deploy Edge Function Comercial

**Pre-requisito:** Tarea 1.1 (proyecto Supabase Comercial creado) y Tarea 3.1 completada.

```bash
# Setear variables de entorno en el proyecto Comercial
supabase secrets set \
  --project-ref [ID-COMERCIAL] \
  OPENAI_API_KEY=[KEY] \
  ANTHROPIC_API_KEY=[KEY] \
  SUPABASE_URL=https://[ID-COMERCIAL].supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=[KEY]

# Deploy de la función
supabase functions deploy analizar-caso-comercial \
  --project-ref [ID-COMERCIAL]
```

**Verificar:**
```bash
# Smoke test: caso admisible comercial
curl -X POST \
  https://[ID-COMERCIAL].supabase.co/functions/v1/analizar-caso-comercial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON-KEY-COMERCIAL]" \
  -d '{
    "hechos": "Socio de una SRL pretende ejercer receso por cambio de objeto social sin su consentimiento. La sociedad tiene capital de $500.000 y el socio posee el 30% de las cuotas.",
    "pretension": "Determinar si procede el ejercicio del derecho de receso y cómo valuarlo."
  }'
```

**Output esperado:**
```json
{
  "success": true,
  "status": "approved",
  "data": {
    "numero_informe": "ALC-COMERCIAL-2026-XXXXXX",
    ...
  }
}
```

---

### Tarea 4.2 — Deploy Edge Function Familiar

**Igual que Tarea 4.1 pero para Familiar:**

```bash
supabase secrets set --project-ref [ID-FAMILIAR] ...

supabase functions deploy analizar-caso-familiar \
  --project-ref [ID-FAMILIAR]
```

**Smoke test: caso admisible familiar:**
```bash
curl -X POST \
  https://[ID-FAMILIAR].supabase.co/functions/v1/analizar-caso-familiar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON-KEY-FAMILIAR]" \
  -d '{
    "hechos": "Progenitor no conviviente incumple el régimen de comunicación establecido judicialmente con hija de 8 años. La madre solicita modificación del régimen.",
    "pretension": "Revisar y modificar el régimen de comunicación a favor del interés superior de la niña."
  }'
```

---

### Tarea 4.3 — Verificar aislamiento de tráfico

```bash
# Verificar que una consulta de materia equivocada es rechazada con HTTP 400
# Enviar consulta COMERCIAL al endpoint FAMILIAR → debe rechazar
curl -X POST \
  https://[ID-FAMILIAR].supabase.co/functions/v1/analizar-caso-familiar \
  -d '{"hechos": "Socio de una SRL pretende receso. La sociedad tiene capital de $500.000."}'

# Output esperado: HTTP 400, codigo: "RECHAZADA_FUERO_EXCLUIDO"
```

---

## Bloque 5: Checkpoints de monetización

### Checklist antes de abrir acceso a clientes

- [ ] **Civil**: endpoint responde con `pipeline_version: 2.0-lis-civil`
- [ ] **Comercial**: endpoint responde con `pipeline_version: 2.0-lis-comercial`
- [ ] **Familiar**: endpoint responde con `pipeline_version: 2.0-lis-familiar`
- [ ] **Aislamiento probado**: consulta de fuero incorrecto → HTTP 400 en los tres productos
- [ ] **Corpus cargado**: al menos 10 criterios por producto en pgvector
- [ ] **Billing separado**: tres proyectos Supabase con billing independiente confirmado
- [ ] **API keys separadas**: tres conjuntos de anon keys (una por producto) para pricing diferenciado
- [ ] **Informe numerado**: `ALC-CIVIL-`, `ALC-COMERCIAL-`, `ALC-FAMILIAR-` según corresponde

---

## Orden de ejecución recomendado

```
Bloque 0 (preparación)
  → Tarea 0.1 (shared config)
  → Tarea 0.2 (archivos .env)
      ↓ en paralelo
┌─────────────────────────────────────────┐
│ Bloque 1 (DB Comercial)   │ Bloque 2 (DB Familiar)     │
│  1.1 → 1.2 → 1.3          │  2.1 → 2.2 → 2.3          │
└─────────────────────────────────────────┘
      ↓ en paralelo (independiente de DB)
┌─────────────────────────────────────────┐
│  Tarea 3.1 (EF Comercial) │ Tarea 3.2 (EF Familiar)    │
└─────────────────────────────────────────┘
      ↓ cuando ambos bloques listos
Bloque 4 (deploy)
  → 4.1 (deploy Comercial) → 4.2 (deploy Familiar) → 4.3 (aislamiento)
      ↓
Bloque 5 (checklist monetización)
      ↓ (deuda técnica, no urgente)
Tarea 3.3 (refactor Civil EF)
```

---

## Notas importantes

### Por qué tres proyectos Supabase y no uno

Con un solo proyecto Supabase compartido:
- El pool de conexiones PostgreSQL es compartido entre los tres productos
- Un pico de tráfico en Comercial puede afectar la latencia de Civil y Familiar
- El billing no se puede separar por producto
- Las API keys de acceso al corpus son las mismas (no se puede cobrar diferente por producto)

Con tres proyectos separados:
- Cada producto escala de forma independiente
- El billing refleja el uso real por producto
- Se puede vender acceso diferenciado con distintas API keys
- Un fallo en un proyecto no afecta a los otros

### Corpus mínimo viable para launch

Para que el RAG funcione con `MIN_RELEVANT_CRITERIA = 2` y `SIMILARITY_THRESHOLD = 0.75`,
el corpus necesita al menos **20-30 criterios por fuero** bien redactados.
Con menos criterios, el sistema va a rechazar demasiadas consultas en Fase 2 (RAG).

Se recomienda cargar primero con 10 criterios de alta calidad para validar el pipeline,
luego expandir a 30+ antes de abrir a clientes.
