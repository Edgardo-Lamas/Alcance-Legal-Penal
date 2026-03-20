# Alcance Legal — Sistema de Inteligencia Jurídica
## Descripción para Inversores

**Versión:** 1.0 | **Fecha:** Febrero 2026 | **Clasificación:** Confidencial

---

## ¿Qué es Alcance Legal?

Alcance Legal es una plataforma **LegalTech** que automatiza el análisis jurídico de casos en Argentina. No es un chatbot ni un buscador de leyes: es un **pipeline de razonamiento estructurado** que replica la metodología de trabajo de un asociado senior de estudio jurídico.

El sistema recibe los hechos de un caso, verifica si tiene base normativa suficiente para opinar, razona con criterios jurídicos verificados, valida la calidad del análisis, y entrega un informe profesional numerado — o se abstiene con fundamento si no puede hacerlo responsablemente.

> **Diferencia clave:** el sistema prefiere rechazar antes que improvisar.
> Cada rechazo es tan válido y trazable como una respuesta.

---

## Tres productos, una base de código

La misma arquitectura sostiene tres productos independientes, cada uno con su propio corpus jurídico, base de datos y endpoint de API. Pueden comercializarse por separado o en conjunto.

| Producto | Fuero | Normas base | Estado |
|---|---|---|---|
| **Alcance Legal Civil** | Derecho Civil | CCyC Ley 26.994 | En producción |
| **Alcance Legal Comercial** | Derecho Comercial y Societario | LGS 19.550 · LCQ 24.522 · CCyC | En desarrollo |
| **Alcance Legal Familiar** | Derecho de Familia | CCyC Libro II · Ley 26.061 · Ley 26.485 | En desarrollo |

---

## Cómo funciona: el pipeline de 5 fases

Cada consulta atraviesa cinco fases secuenciales. Cualquier fase puede rechazar antes de continuar, lo que evita consumir recursos o entregar análisis sin base suficiente.

```
  Entrada: hechos del caso + pretensión del cliente
      │
      ▼
  FASE 1 — Admisibilidad
  ─────────────────────────────────────────────────
  Verifica que la consulta sea del fuero correcto y
  contenga hechos mínimos suficientes para opinar.
  Rechaza: fuera de competencia · consulta híbrida ·
           hechos insuficientes
      │
      ▼
  FASE 2 — RAG (Búsqueda semántica en corpus)
  ─────────────────────────────────────────────────
  Recupera los criterios jurídicos más relevantes del
  corpus verificado mediante búsqueda vectorial.
  Rechaza si no encuentra al menos 2 criterios con
  75% o más de similitud semántica.
      │
      ▼
  FASE 3 — Razonamiento LIS
  ─────────────────────────────────────────────────
  Claude analiza el caso aplicando SOLO los criterios
  recuperados. Estructura fija obligatoria:
  encuadre normativo → análisis → riesgos → conclusión
  Prohibido: inventar doctrina, jurisprudencia o artículos.
      │
      ▼
  FASE 4 — Validación senior
  ─────────────────────────────────────────────────
  Detecta certeza excesiva, extrapolaciones no fundadas
  y violaciones de scope. Puede bloquear el análisis
  antes de que llegue al usuario.
      │
      ▼
  FASE 5 — Informe profesional
  ─────────────────────────────────────────────────
  Genera informe numerado (ALC-CIVIL-2026-000042)
  con disclaimer institucional.
  Formatos: JSON · HTML · PDF
```

---

## Capacidades del sistema

### Control de admisibilidad
- Detecta automáticamente el fuero jurídico de la consulta
- Rechaza consultas de materia incorrecta con mensaje fundado
- Identifica consultas híbridas (mezcla de fueros)
- Verifica que existan hechos mínimos antes de consumir IA

### Búsqueda semántica (RAG)
- Corpus jurídico curado por fuero, vectorizado con embeddings de OpenAI
- Búsqueda por similitud coseno con umbral de relevancia del 75%
- Si la base no es suficiente, el sistema no razona — se abstiene
- El corpus es expandible sin cambiar el código del pipeline

### Razonamiento jurídico guiado
- Prompt metodológico fijo e inmutable por perfil jurídico
- El LLM solo puede usar la información proporcionada en el contexto
- Cinco tipos de conclusión posibles: fundada, parcial, condicionada, abstención, limitación expresa
- LLM primario: Claude Sonnet 4.6 (Anthropic) · Fallback: GPT-4 Turbo (OpenAI)

### Validación de calidad
- Detecta lenguaje de certeza excesiva ("garantizo", "sin duda alguna")
- Detecta extrapolaciones a fuentes no verificadas
- Detecta menciones a materias fuera del scope del perfil
- Detecta contradicciones internas entre conclusión y riesgos
- Tres estados de salida: Aprobado · Limitado · Rechazado

### Informe profesional
- Numeración secuencial única garantizada por base de datos: `ALC-CIVIL-2026-000042`
- Disclaimer institucional versionado (v1.1) en todos los informes
- Metadata completa: criterios usados, versión del pipeline, timestamp
- Exportable como JSON (API), HTML (web) o PDF (imprimible)

---

## Stack tecnológico

| Capa | Tecnología | Característica clave |
|---|---|---|
| **Frontend** | React 19 + Vite 7 | SPA moderna, build optimizado |
| **Backend** | Supabase Edge Functions (Deno) | Serverless, auto-escala sin gestión de servidores |
| **Base de datos** | PostgreSQL + pgvector (Supabase) | Búsqueda vectorial nativa integrada |
| **Embeddings** | OpenAI text-embedding-ada-002 | Estándar de industria para búsqueda semántica |
| **LLM primario** | Claude Sonnet 4.6 (Anthropic) | Mayor capacidad de razonamiento estructurado |
| **LLM fallback** | GPT-4 Turbo (OpenAI) | Alta disponibilidad ante fallas del primario |
| **Corpus jurídico** | pgvector + RPC PostgreSQL | Consultas vectoriales con filtros estructurados |
| **Informes** | TypeScript → HTML → PDF | Sin dependencias externas de renderizado |

Todo el stack es **serverless y administrado**. No requiere gestión de servidores, parches de sistema operativo ni escalado manual.

---

## Escalabilidad

### Escala técnica — sin límite de rediseño

El sistema fue diseñado desde el inicio para crecer horizontalmente. Agregar un cuarto fuero (Laboral, Penal, Administrativo) requiere únicamente:

1. Definir un perfil de configuración — un archivo TypeScript de ~50 líneas
2. Crear la tabla de corpus en un nuevo proyecto Supabase — SQL de 2 minutos
3. Cargar los criterios jurídicos correspondientes — script automatizado

El pipeline, el razonador, la validación y el generador de informes **no cambian**. El mismo código sirve para N fueros.

### Aislamiento por producto

Cada producto tiene su propio proyecto Supabase con pool de conexiones y facturación independiente. Un pico de tráfico en Comercial no afecta la disponibilidad de Civil o Familiar. Las Edge Functions de Supabase escalan automáticamente a miles de solicitudes concurrentes.

### Tres vectores de crecimiento de producto

| Vector | Descripción | Inversión requerida |
|---|---|---|
| **Más fueros** | Penal, Laboral, Administrativo | Corpus jurídico + configuración |
| **Más jurisdicciones** | Uruguay, Chile, Colombia | Corpus local + adaptación normativa |
| **Mayor profundidad** | Agregar jurisprudencia al corpus | Corpus + sin cambio de arquitectura |

### Modelos de negocio habilitados por la arquitectura

- **Créditos por informe** — el usuario paga por consulta
- **Suscripción mensual** — con cuota de informes incluidos
- **API para estudios jurídicos** — integración directa en sus sistemas
- **Plan multi-producto** — Civil + Comercial + Familiar con descuento
- **White label** — el pipeline vendido como infraestructura a terceros

---

## Lo que diferencia a Alcance Legal

| Característica | Chatbot legal genérico | Buscador de jurisprudencia | **Alcance Legal** |
|---|---|---|---|
| Restricción de materia | ❌ Responde cualquier cosa | ❌ Solo busca, no razona | ✅ Solo su fuero, rechaza lo demás |
| Base normativa verificada | ❌ Memoria del modelo | ✅ Parcial | ✅ Corpus curado con umbral de relevancia |
| Control de certeza | ❌ El modelo decide solo | ❌ No aplica | ✅ Validación post-razonamiento automática |
| Abstención responsable | ❌ Siempre responde algo | ❌ No aplica | ✅ Rechaza con fundamento si no puede opinar |
| Informe trazable | ❌ Texto de chat | ❌ No genera | ✅ Numerado, con disclaimer, exportable a PDF |
| API para integración B2B | ❌ Solo interfaz web | ❌ Limitada | ✅ Endpoint documentado por producto |
| Multi-producto escalable | ❌ Un solo dominio | ❌ Un solo dominio | ✅ Tres fueros, arquitectura extensible |

---

## Estado actual del desarrollo

| Componente | Estado |
|---|---|
| Pipeline de 5 fases (Civil) | ✅ Completo y en producción |
| Corpus Civil inicial (26 criterios CCyC) | ✅ Listo para carga |
| Arquitectura multi-perfil (Civil/Comercial/Familiar) | ✅ Implementada |
| Edge Functions Comercial y Familiar | ✅ Desarrolladas, pendiente deploy |
| Esquema de base de datos Comercial y Familiar | ✅ Migraciones listas |
| Informe PDF con numeración secuencial | ✅ Implementado |
| Frontend React (consola profesional) | ✅ Funcional |

---

*Alcance Legal v2.0-lis — Febrero 2026*
*Documento confidencial — Para distribución restringida a inversores*
