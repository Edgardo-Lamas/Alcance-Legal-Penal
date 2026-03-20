# Alcance Legal – Civil
## Descripción del Sistema

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Clasificación:** Documento de consulta  

---

## 1. ¿Qué es Alcance Legal?

Alcance Legal es un **Sistema de Inteligencia Jurídica** (*Legal Intelligence System* — LIS) especializado exclusivamente en **Derecho Civil Argentino**.

No es un chatbot, no es una simple API, y no es un buscador de jurisprudencia. Es un **pipeline de análisis jurídico estructurado** que replica la metodología de trabajo de un asociado senior de un estudio jurídico: recibe hechos, los encuadra normativamente, analiza criterios verificados, identifica riesgos, y emite una conclusión fundada con sus limitaciones expresas.

### Definición formal

> **Alcance Legal es un sistema LegalTech** que integra un motor de análisis civil con razonamiento guiado por IA, validación de calidad profesional y generación automatizada de informes — accesible tanto a través de una interfaz web profesional como de endpoints API seguros.

---

## 2. Arquitectura del Pipeline

Cada consulta atraviesa **5 fases secuenciales** antes de generar una respuesta. Si falla en cualquier fase, el sistema rechaza la consulta con fundamento estructurado — **nunca improvisa**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE ANÁLISIS                         │
│                                                                 │
│  📥 Entrada    →  Hechos del caso + pretensión del usuario      │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ FASE 1   │   │ FASE 2   │   │ FASE 3   │   │ FASE 4   │    │
│  │ Admisi-  │──▶│ RAG      │──▶│ Razona-  │──▶│ Valida-  │    │
│  │ bilidad  │   │ Civil    │   │ miento   │   │ ción     │    │
│  │          │   │          │   │ LIS      │   │ Senior   │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │              │              │            │
│    Rechaza        Rechaza       Estructura      Rechaza         │
│    si no es       si no hay     el análisis     si hay          │
│    civil          base RAG      con criterios   riesgo          │
│                                                    │            │
│                                              ┌──────────┐      │
│                                              │ FASE 5   │      │
│                                              │ Informe  │      │
│                                              │ + PDF    │      │
│                                              └──────────┘      │
│                                                    │            │
│  📤 Salida    →  Informe estructurado con número   │            │
│                  ALC-CIVIL-YYYY-NNNNNN             │            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos del Sistema

### 3.1 Perfil Jurídico (`profile.ts`)

Define el **contrato de configuración estático** del sistema:

| Parámetro | Valor |
|-----------|-------|
| **Fuero admitido** | Civil |
| **Fueros excluidos** | Comercial, Penal, Laboral, Familia |
| **Actos admitidos** | Analizar caso, Auditar estrategia, Redactar escrito, Revisar documento |
| **Política de rechazo** | Activa — rechaza con fundamento si la consulta está fuera de alcance |

---

### 3.2 Control de Admisibilidad (`checkAdmissibility.ts`)

**Función:** Guardián de entrada del sistema. Valida toda consulta **antes** de consumir recursos de IA o base de datos.

**Validaciones en orden:**
1. ✅ El acto jurídico solicitado está admitido en el perfil
2. ✅ Existen hechos mínimos (≥20 caracteres, ≥3 palabras sustanciales)
3. ✅ El fuero corresponde al perfil Civil
4. ✅ No es consulta híbrida (mezcla de fueros)

**Códigos de resultado:**
- `ADMITIDA` — Pasa a la siguiente fase
- `RECHAZADA_FUERO_EXCLUIDO` — La materia no es civil
- `RECHAZADA_HECHOS_INSUFICIENTES` — Faltan hechos para opinar
- `RECHAZADA_CONSULTA_HIBRIDA` — Mezcla fueros civiles y no civiles
- `RECHAZADA_ACTO_NO_ADMITIDO` — El tipo de acto no está soportado

---

### 3.3 Búsqueda RAG Civil (`retrieveCivilCriteria.ts`)

**Función:** Recupera criterios jurídicos del corpus verificado mediante búsqueda semántica (embeddings + similitud coseno).

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| **Top K** | 5 | Cubre variantes sin ruido |
| **Umbral de similitud** | 0.75 (75%) | Alta relevancia requerida |
| **Mínimo de criterios** | 2 | Garantiza base suficiente |

**Regla clave:** Si no hay al menos 2 criterios con ≥75% de relevancia semántica, el sistema **rechaza sin razonar**. Un rechazo fundamentado es preferible a una respuesta sin base suficiente.

**Tecnología:** Supabase RPC + OpenAI Embeddings (`text-embedding-ada-002`)

---

### 3.4 Razonamiento Guiado LIS (`guidedCivilReasoning.ts`)

**Función:** Núcleo intelectual del sistema. Ejecuta razonamiento jurídico estructurado utilizando IA con un **prompt metodológico fijo e inmutable**.

**Metodología obligatoria (4 pasos):**
1. **Encuadre Jurídico** — Instituto civil y artículos del CCyC aplicables
2. **Análisis de Criterios** — Aplicación exclusiva de criterios del RAG verificado
3. **Gestión del Riesgo** — Puntos débiles, contingencias, interpretaciones alternativas
4. **Conclusión** — Fundada, parcial, condicionada o abstención

**Prohibiciones absolutas del sistema:**
- ❌ No usar conocimiento fuera del contexto proporcionado
- ❌ No inventar jurisprudencia, doctrina ni artículos
- ❌ No hacer analogías con otros fueros
- ❌ No simular certeza
- ❌ No completar vacíos informativos con suposiciones

**Tipos de conclusión posibles:**
- `ANALISIS_FUNDADO` — Opinión completa con respaldo
- `ANALISIS_PARCIAL` — Opinión limitada a aspectos cubiertos
- `ANALISIS_CONDICIONADO` — Opinión sujeta a verificación de hechos
- `ABSTENCION_METODOLOGICA` — Se abstiene por falta de base
- `LIMITACION_EXPRESA` — Emite con advertencias de alcance

**LLMs soportados:** Claude (Anthropic) como primario, GPT-4 (OpenAI) como fallback.

---

### 3.5 Validación de Salida (`validateCivilOutput.ts`)

**Función:** Control senior post-razonamiento. Puede **bloquear respuestas riesgosas** antes de que lleguen al usuario. No mejora el análisis — lo evalúa y controla.

**Controles de calidad:**

| Control | Qué detecta | Severidad |
|---------|-------------|-----------|
| Certeza excesiva | "sin duda alguna", "garantizo que", "100% seguro" | Error |
| Extrapolación | "en mi experiencia", "la doctrina mayoritaria" (sin cita) | Warning |
| Violación de scope | Menciones a penal, laboral, comercial, familia | Crítico |
| Contradicciones | Conclusión favorable + riesgos graves | Error |
| Conclusión sin base | Juicio fuerte sin encuadre normativo previo | Error |

**Resultados de validación:**
- **Approved** — Sin issues significativos, se entrega al usuario
- **Limited** — Se entrega con advertencias profesionales visibles
- **Rejected** — No se entrega; se informa al usuario el motivo

---

### 3.6 Generación de Informes (`buildCivilReport.ts` + `renderCivilReportPDF.ts`)

**Función:** Transforma el análisis validado en un informe profesional. No genera contenido nuevo — solo organiza y formaliza.

**Estructura del informe:**
1. **Header institucional** — Marca Alcance Legal + perfil Civil
2. **Datos del informe** — Número único (ALC-CIVIL-YYYY-NNNNNN), fecha, status
3. **Advertencias** — Si el status es "limited"
4. **Secciones de análisis** — I. Encuadre, II. Análisis, III. Riesgos, IV. Conclusión, V. Limitaciones
5. **Disclaimer institucional** — Texto legal fijo, versión 1.1
6. **Footer técnico** — Pipeline version, criterios, validaciones, timestamp

**Formatos de salida:**
- JSON estructurado (para consumo programático)
- HTML profesional (para vista previa web)
- PDF imprimible (vía `window.print()` o renderizado server-side)

---

## 4. Endpoint API

### `POST /analizar-caso`

**Tipo:** Supabase Edge Function (Deno)

**Request:**
```json
{
    "hechos": "Descripción de los hechos del caso (requerido)",
    "pretension": "Pretensión del cliente (opcional)",
    "instituto": "Instituto jurídico principal (opcional)",
    "documentacion": ["lista", "de", "documentos"]
}
```

**Response exitosa (HTTP 200):**
```json
{
    "success": true,
    "status": "approved | limited",
    "data": {
        "numero_informe": "ALC-CIVIL-2026-000123",
        "fecha_emision": "2026-02-11T14:00:00Z",
        "encuadre": "...",
        "analisis": "...",
        "riesgos": "...",
        "conclusion": "...",
        "limitaciones": "..."
    },
    "advertencias": ["(solo si status = limited)"],
    "disclaimer": { "..." },
    "meta": {
        "criterios_utilizados": 4,
        "pipeline_version": "2.0-lis-civil",
        "timestamp": "..."
    }
}
```

**Códigos HTTP de rechazo:**

| Código | Fase | Significado |
|--------|------|-------------|
| **400** | Admisibilidad | Consulta fuera de competencia o hechos insuficientes |
| **403** | Validación | Violación de scope (materia no civil en la respuesta) |
| **422** | RAG / Validación | Base insuficiente o calidad no profesional |
| **500** | Sistema | Error interno del servidor |

---

## 5. Interfaz Web

La aplicación web React (Vite) proporciona una **consola profesional** con flujos separados para cada capacidad:

- **Analizar caso** — Flujo estructurado con inputs guiados
- **Auditar estrategia** — Revisión de estrategia procesal
- **Redactar escrito** — Generación de borradores
- **Revisar documento** — Análisis de documentos existentes

**Principios UX:**
- Sin chat libre — inputs estructurados
- Outputs profesionales tipo informe — no conversacionales
- Separación clara de flujos por acto jurídico

---

## 6. Seguridad y Garantías

### Garantías anti-improvisación
1. **System prompt fijo e inmutable** — No modificable en runtime
2. **Contexto cerrado** — Solo criterios verificados del RAG
3. **Estructura de respuesta obligatoria** — 5 secciones fijas
4. **Validación post-razonamiento** — Bloquea respuestas riesgosas
5. **Disclaimer institucional versionado** — Siempre presente

### Política de rechazo
El sistema **prefiere rechazar** a improvisar. Cada rechazo es:
- Fundamentado con código específico
- Acompañado de recomendación al usuario
- Registrado con metadata para análisis posterior

---

## 7. ¿Qué hace diferente a Alcance Legal?

| Característica | APIs genéricas | Chatbots legales | **Alcance Legal** |
|---|---|---|---|
| Restricción de fuero | ❌ Responden cualquier cosa | ❌ Opinan de todo | ✅ Solo Civil, rechaza lo demás |
| Base normativa | ❌ Conocimiento general | ❌ Memoria del modelo | ✅ RAG con corpus verificado |
| Control de certeza | ❌ No controlan | ❌ El modelo decide | ✅ Validación post-razonamiento |
| Rechazo fundamentado | ❌ Siempre responden algo | ❌ Inventan si no saben | ✅ Abstención con explicación |
| Informe profesional | ❌ Texto plano | ❌ Formato chat | ✅ PDF numerado con disclaimer |
| Trazabilidad | ❌ Nula | ❌ Mínima | ✅ Número de informe + metadata |

---

## 8. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Frontend** | React 19 + Vite 7 + React Router 7 |
| **Backend** | Supabase Edge Functions (Deno) |
| **Base de datos** | Supabase (PostgreSQL + pgvector) |
| **Embeddings** | OpenAI `text-embedding-ada-002` |
| **Razonamiento** | Claude 3 Haiku (Anthropic) / GPT-4 Turbo (OpenAI) |
| **Búsqueda semántica** | pgvector + Supabase RPC |
| **Visualización** | Recharts + Mermaid |
| **PDF** | HTML template → print/render |

---

## 9. Resumen Ejecutivo

Alcance Legal no es "una API que responde preguntas legales". Es un **sistema de inteligencia jurídica especializado** que:

1. **Filtra** — Solo admite consultas civiles con hechos suficientes
2. **Fundamenta** — Solo razona con criterios verificados del corpus
3. **Controla** — Valida la calidad del análisis antes de entregarlo
4. **Formaliza** — Genera informes profesionales numerados
5. **Se abstiene** — Prefiere rechazar antes que improvisar

Es la diferencia entre preguntar en un chat genérico *"¿qué opinas de mi caso?"* y consultar a un asociado senior que revisa la norma, aplica criterios verificados, advierte riesgos, y firma un informe con limitaciones expresas.

---

*Documento de consulta — Alcance Legal v2.0-lis-civil*  
*Generado: Febrero 2026*
