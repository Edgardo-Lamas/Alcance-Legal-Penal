# Alcance Legal Penal
## Descripción del Sistema

**Versión:** 1.0-lis-penal_pba
**Fecha:** Marzo 2026
**Clasificación:** Documento de presentación

---

## 1. ¿Qué es Alcance Legal Penal?

Alcance Legal Penal es un **Sistema de Inteligencia Jurídica** (*Legal Intelligence System* — LIS) especializado exclusivamente en **Defensa Penal — Provincia de Buenos Aires** (CPP PBA, Ley 11.922).

No es un chatbot, no es un buscador de jurisprudencia, y no es una API genérica de preguntas y respuestas. Es un **pipeline de análisis estructurado** que replica la metodología de trabajo de un asociado senior de defensa penal: recibe los hechos del caso, los encuadra procesalmente, recupera criterios jurídicos verificados de su corpus interno, razona desde la perspectiva defensiva, y emite una conclusión fundada con limitaciones expresas.

### Principio rector

> El sistema opera **exclusivamente desde la perspectiva de la defensa** (in dubio pro reo, presunción de inocencia). Nunca adopta la perspectiva acusatoria ni sugiere estrategias que perjudiquen al imputado.

### Definición formal

> **Alcance Legal Penal es una plataforma LegalTech** que integra un motor de análisis penal con razonamiento guiado por IA, recuperación de jurisprudencia verificada (RAG), detección de patrones procesales, validación de calidad profesional y generación automatizada de informes — accesible a través de una interfaz web profesional y de endpoints API.

---

## 2. Arquitectura del Pipeline

Cada consulta atraviesa **5 fases secuenciales** antes de generar una respuesta. Si falla en cualquier fase, el sistema rechaza la consulta con fundamento estructurado. **Nunca improvisa.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE ANÁLISIS PENAL                   │
│                                                                 │
│  📥 Entrada    →  Hechos + etapa procesal + documentación adj.  │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ FASE 1   │   │ FASE 2   │   │ FASE 3   │   │ FASE 4   │    │
│  │ Admisi-  │──▶│ RAG      │──▶│ Razona-  │──▶│ Valida-  │    │
│  │ bilidad  │   │ Penal    │   │ miento   │   │ ción     │    │
│  │          │   │ pgvector │   │ LIS      │   │ Senior   │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │              │              │            │
│    Rechaza        Rechaza       Estructuras      Rechaza        │
│    si no es       si no hay     el análisis     si hay sesgo    │
│    penal PBA      base RAG      defensivo       acusatorio      │
│                                                    │            │
│                                              ┌──────────┐      │
│                                              │ FASE 5   │      │
│                                              │ Informe  │      │
│                                              │ + PDF    │      │
│                                              └──────────┘      │
│                                                    │            │
│  📤 Salida  →  Informe ALC-PENAL-PBA-YYYY-NNNNNN  │            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos del Sistema

### 3.1 Perfil Jurídico (`profile.ts`)

Define el contrato de configuración estático del sistema. No es modificable en runtime.

| Parámetro | Valor |
|-----------|-------|
| **Fuero admitido** | Penal — Provincia de Buenos Aires |
| **Fueros excluidos** | Civil, comercial, laboral, familia |
| **Perspectiva** | Exclusivamente defensiva |
| **Código de perfil** | `PROFILE_PENAL_PBA` |
| **Código de informe** | `PENAL-PBA` |

---

### 3.2 Control de Admisibilidad (`checkAdmissibility.ts`)

Guardián de entrada del sistema. Evalúa toda consulta **antes** de consumir recursos de IA o base de datos.

**Validaciones en orden:**
1. El acto jurídico solicitado está admitido en el perfil
2. Existen hechos mínimos con contenido sustancial
3. El fuero corresponde al perfil Penal PBA
4. No es consulta híbrida entre fueros

**Códigos de resultado:**
- `ADMITIDA` — Pasa a la siguiente fase
- `RECHAZADA_FUERO_EXCLUIDO` — La materia no es penal
- `RECHAZADA_HECHOS_INSUFICIENTES` — Faltan hechos para analizar
- `RECHAZADA_CONSULTA_HIBRIDA` — Mezcla fueros incompatibles
- `RECHAZADA_ACTO_NO_ADMITIDO` — El tipo de acto no está soportado

---

### 3.3 Recuperación RAG Penal (`retrievePenalCriteria.ts`)

Recupera criterios jurídicos del corpus verificado mediante búsqueda semántica (embeddings vectoriales + similitud coseno sobre pgvector).

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| **Top K** | 5 | Cubre variantes sin ruido |
| **Umbral de similitud** | 0.72 (72%) | Alta relevancia requerida |
| **Mínimo de criterios** | 1 | Un criterio relevante es suficiente para razonar |

**Regla clave:** Si no hay al menos 1 criterio con ≥72% de relevancia semántica, el sistema rechaza sin razonar. Un rechazo fundamentado es preferible a una respuesta sin base.

**Corpus actual:** Criterios organizados en categorías temáticas + archivo de fallos verificados con citas textuales reales (CSJN, CNCP, Cámaras PBA).

---

### 3.4 Razonamiento Guiado LIS (`guidedPenalReasoning.ts`)

Núcleo intelectual del sistema. Ejecuta razonamiento jurídico estructurado con un **system prompt penal fijo e inmutable**, anclado en el CPP PBA y el Código Penal.

**Metodología obligatoria — 5 secciones fijas:**
1. **Encuadre procesal** — Figura penal, etapa del proceso, normativa aplicable
2. **Análisis de prueba de cargo** — Identificación de debilidades probatorias de la acusación
3. **Nulidades y vicios** — Irregularidades procesales, prueba ilícita, vicios formales
4. **Contraargumentación** — Estrategia defensiva fundada en los criterios del RAG
5. **Conclusión defensiva** — Fundada, limitada o abstención metodológica

**Prohibiciones absolutas del sistema:**
- No usar conocimiento fuera del contexto RAG proporcionado
- No inventar jurisprudencia, doctrina ni artículos
- No adoptar perspectiva acusatoria
- No simular certeza donde hay duda
- No completar vacíos informativos con suposiciones

**Flujo de 2 pasos disponible:**
- **Paso 1:** Análisis preliminar con hipótesis defensiva (respuesta rápida)
- **Paso 2:** Estrategia defensiva detallada, activada por el usuario cuando lo necesita

---

### 3.5 Detección de Patrones Procesales

Motor independiente que analiza los hechos en busca de **patrones problemáticos frecuentes** antes del razonamiento principal.

**Patrones detectados actualmente:**
- Prueba digital sin cadena de custodia autenticada
- Prueba de imposibilidad material ignorada (coartada)
- Cambio en la plataforma fáctica (violación de congruencia)
- Riesgo de parcialidad del tribunal
- Pena desproporcionada / doble valoración de agravantes
- Ausencia de revisión efectiva en la cadena recursiva
- Pericia psicológica de baja calidad con alto peso probatorio
- Uso problemático de Cámara Gesell

**Salida:** alertas con nivel de riesgo (alto/medio) incorporadas al informe final.

---

### 3.6 Validación de Calidad (`validatePenalOutput.ts`)

Control senior post-razonamiento. Puede **bloquear respuestas riesgosas** antes de que lleguen al usuario.

| Control | Qué detecta | Severidad |
|---------|-------------|-----------|
| Sesgo acusatorio | Análisis que perjudica al imputado | Crítico |
| Certeza excesiva | "sin duda", "garantizo", "100% seguro" | Error |
| Extrapolación | Doctrina citada sin respaldo del RAG | Warning |
| Violación de scope | Menciones a fueros excluidos | Crítico |
| Conclusión sin base | Juicio fuerte sin encuadre normativo | Error |

**Resultados:**
- **Approved** — Sin issues significativos
- **Limited** — Se entrega con advertencias profesionales visibles
- **Rejected** — No se entrega; se informa el motivo al usuario

---

### 3.7 Generación de Informes (`buildPenalReport.ts` + `renderPenalReportPDF.ts`)

Transforma el análisis validado en un informe profesional numerado. No genera contenido nuevo — organiza y formaliza.

**Estructura del informe:**
1. Header institucional — Marca Alcance Legal Penal
2. Número de informe — `ALC-PENAL-PBA-YYYY-NNNNNN` (único y trazable)
3. Advertencias — si el status es "limited"
4. Encuadre procesal
5. Análisis de prueba de cargo
6. Nulidades y vicios procesales
7. Contraargumentación defensiva
8. Conclusión defensiva
9. Patrones procesales detectados
10. Limitaciones expresas
11. Disclaimer institucional versionado (v1.2-penal)
12. Footer técnico — pipeline version, criterios utilizados, timestamp

**Formatos de salida:**
- JSON estructurado (consumo programático / API)
- Vista web en pantalla (informe renderizado)
- **PDF exportable** (con nombre de archivo basado en número de informe)

---

## 4. Capacidades de Entrada

### Texto estructurado
- Descripción de hechos
- Tipo penal imputado
- Etapa procesal (IPP, juicio, recursos)

### Documentación adjunta
- **PDFs del expediente** — hasta 2 archivos, 10 MB cada uno. El sistema extrae y analiza el texto.
- **Imágenes del expediente** — hasta 4 imágenes (JPG, PNG, WebP). El sistema las analiza visualmente como prueba.
- **Análisis de metadatos EXIF** — detecta automáticamente: fecha/hora de captura real, coordenadas GPS, dispositivo, señales de edición (software de retoque), y ausencia de datos EXIF (posible indicador de captura de pantalla o imagen editada).

---

## 5. Endpoint API

### `POST /analizar-caso`

**Tipo:** Supabase Edge Function (Deno runtime)

**Request:**
```json
{
    "hechos": "Descripción de los hechos del caso (requerido)",
    "tipo_penal": "Figura penal imputada (opcional)",
    "etapa_procesal": "IPP | juicio | recursos (opcional)",
    "documentos": ["base64 o URL de adjuntos (opcional)"]
}
```

**Response exitosa (HTTP 200):**
```json
{
    "success": true,
    "status": "approved | limited | rejected",
    "data": {
        "numero_informe": "ALC-PENAL-PBA-2026-000042",
        "fecha_emision": "2026-03-27T10:00:00Z",
        "encuadre_procesal": "...",
        "analisis_prueba_cargo": "...",
        "nulidades_y_vicios": "...",
        "contraargumentacion": "...",
        "conclusion_defensiva": "...",
        "limitaciones": "..."
    },
    "advertencias": [],
    "disclaimer": { "version": "1.2-penal", "texto": "..." },
    "meta": {
        "criterios_utilizados": 4,
        "pipeline_version": "1.0-lis-penal_pba",
        "timestamp": "..."
    }
}
```

**Códigos HTTP de rechazo:**

| Código | Fase | Significado |
|--------|------|-------------|
| **400** | Admisibilidad | Consulta fuera de competencia o hechos insuficientes |
| **403** | Validación | Respuesta con sesgo acusatorio detectado |
| **422** | RAG / Validación | Base insuficiente o calidad no profesional |
| **500** | Sistema | Error interno del servidor |

---

## 6. Historial y Trazabilidad

Cada análisis realizado por un usuario autenticado queda registrado en la base de datos con:

- Número de informe único
- Fecha y hora de emisión
- Status del análisis (approved / limited / rejected)
- Tipo de análisis y etapa procesal
- Hechos ingresados
- JSON completo del resultado
- Criterios jurídicos utilizados y versión del pipeline

**Funcionalidades del historial:**
- Acceso a todos los análisis propios en orden cronológico
- Reapertura de cualquier análisis anterior con su informe completo
- Exportación a PDF desde el historial

---

## 7. Corpus Jurídico (RAG)

El sistema no usa conocimiento genérico del modelo de IA. Razona exclusivamente sobre un **corpus jurídico estructurado** cargado en base de datos vectorial.

### Estructura del corpus

| Categoría | Contenido |
|-----------|-----------|
| **Garantías procesales** | Presunción de inocencia, in dubio, nemo tenetur, ne bis in idem, juez natural, defensa en juicio, plazo razonable, comunicaciones, prisión preventiva, recurso amplio |
| **Valoración de prueba** | Estándar de certeza para condena, sana crítica, límites de la pericia, prueba digital, capturas de pantalla, regla de exclusión, coimputado colaborador, prueba indiciaria |
| **Abuso sexual e intrafamiliar** | Elementos del tipo, testimonio único, perspectiva de género, Cámara Gesell, pericia psicológica, retractación, denuncia tardía, contexto de convivencia |
| **Irregularidades procesales** | Nulidades absolutas, allanamiento sin orden, congruencia fáctica, prisión preventiva excesiva, defensa técnica ineficaz, cadena de custodia |
| **Fallos verificados** | Criterios basados en citas textuales reales de CSJN y Cámaras PBA, con número de Fallos y fecha verificables |

### Fallos verificados en el corpus (selección)

| Fallo | Tribunal | Cita | Regla |
|-------|----------|------|-------|
| "Díaz Bessone" | CNCP Plenario | Acuerdo N°1/2008 | PP solo por peligro de fuga o entorpecimiento |
| "Arriola" | CSJN | Fallos 332:1963 | Inconstitucionalidad art. 14.2 Ley 23.737 (consumo personal) |
| "Montenegro" | CSJN | Fallos 303:1938 | Regla de exclusión de prueba ilícita |
| "Rayford" | CSJN | Fallos 308:733 | Fruto del árbol venenoso (prueba derivada) |
| "Mattei" | CSJN | Fallos 272:188 | Plazo razonable — fundamento constitucional |
| "Mozzatti" | CSJN | Fallos 300:1102 | Plazo razonable — insubsistencia de la acción |

---

## 8. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Frontend** | React 19 + Vite 7 + React Router 7 |
| **Backend** | Supabase Edge Functions (Deno runtime) |
| **Base de datos** | Supabase PostgreSQL + pgvector (búsqueda vectorial) |
| **Embeddings** | OpenAI `text-embedding-ada-002` (1536 dimensiones) |
| **LLM primario** | Claude (Anthropic) — Sonnet / Haiku según carga |
| **LLM fallback** | GPT-4 Turbo (OpenAI) |
| **Búsqueda semántica** | pgvector + función RPC `buscar_criterios()` |
| **Análisis de imágenes** | Claude Vision (multimodal) |
| **Extracción EXIF** | exifr (browser-side, sin servidor) |
| **Extracción de texto PDF** | PDF.js (browser-side) |
| **Autenticación** | Supabase Auth (JWT + RLS por usuario) |
| **Exportación PDF** | HTML template → `window.print()` |
| **Deploy** | GitHub Actions → Netlify (CI/CD automático) |

---

## 9. Seguridad y Garantías

### Garantías anti-improvisación
1. **System prompt fijo e inmutable** — No modificable en runtime
2. **Contexto cerrado** — Solo criterios del corpus RAG verificado
3. **Estructura de respuesta obligatoria** — 5 secciones fijas
4. **Validación post-razonamiento** — Bloquea respuestas con sesgo acusatorio o certeza excesiva
5. **Disclaimer institucional versionado** — Siempre presente en el informe

### Política de rechazo
El sistema **prefiere rechazar** antes que improvisar. Cada rechazo es:
- Fundamentado con código específico
- Acompañado de recomendación al usuario
- Registrado con metadata para análisis posterior

### Datos del usuario
- Autenticación por email y contraseña
- RLS (Row Level Security): cada usuario solo accede a sus propios análisis
- Sin almacenamiento de documentos adjuntos — se procesan en memoria y se descartan
- Sin retención de hechos más allá del análisis solicitado

---

## 10. ¿Qué diferencia a Alcance Legal Penal?

| Característica | Chatbots genéricos | Buscadores de jurisprudencia | **Alcance Legal Penal** |
|---|---|---|---|
| Perspectiva | Neutral o acusatoria | Sin perspectiva | ✅ Exclusivamente defensiva |
| Base jurídica | Conocimiento general del modelo | Texto de fallos sin análisis | ✅ RAG con criterios aplicados al caso |
| Control de calidad | Ninguno | No aplica | ✅ Validación anti-sesgo post-razonamiento |
| Rechazo fundamentado | Siempre responden algo | No analizan | ✅ Abstención con explicación |
| Informe profesional | Texto de chat | No genera | ✅ PDF numerado con disclaimer |
| Análisis de documentos | Limitado | No | ✅ PDFs + imágenes + metadatos EXIF |
| Detección de patrones | No | No | ✅ 8 patrones procesales frecuentes |
| Trazabilidad | Nula | Por número de fallo | ✅ Número de informe + historial del usuario |

---

## 11. Resumen Ejecutivo

Alcance Legal Penal no es "una API que responde preguntas penales". Es un **sistema de inteligencia jurídica especializado en defensa penal** que:

1. **Filtra** — Solo admite consultas penales PBA con hechos suficientes
2. **Fundamenta** — Solo razona con criterios y fallos verificados del corpus
3. **Detecta** — Identifica patrones procesales problemáticos automáticamente
4. **Controla** — Valida que el análisis sea defensivo y no improvise
5. **Formaliza** — Genera informes profesionales numerados y exportables
6. **Registra** — Historial trazable por usuario con exportación PDF
7. **Se abstiene** — Prefiere rechazar antes que improvisar

Es la diferencia entre preguntar en un chat genérico *"¿tengo chances en mi causa?"* y consultar a un sistema que revisa la norma procesal, aplica criterios jurídicos verificados, detecta nulidades potenciales, analiza la prueba de cargo, y emite un informe defensivo con limitaciones expresas y número de registro.

---

*Alcance Legal Penal — v1.0-lis-penal_pba*
*Marzo 2026*
