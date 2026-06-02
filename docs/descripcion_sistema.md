# Alcance Legal Penal
## Descripción del Sistema

**Versión:** 2.0-lis-penal_pba
**Fecha:** Mayo 2026
**Clasificación:** Documento de presentación y arquitectura técnica

---

## 1. ¿Qué es Alcance Legal Penal?

Alcance Legal Penal es un **Sistema de Inteligencia Jurídica** (*Legal Intelligence System* — LIS) especializado exclusivamente en **Defensa Penal — Provincia de Buenos Aires** (CPP PBA, Ley 11.922).

No es un chatbot, no es un buscador de jurisprudencia, y no es una API genérica de preguntas y respuestas. Es un **pipeline de análisis estructurado** que replica la metodología de trabajo de un asociado senior de defensa penal: recibe los hechos del caso, los encuadra procesalmente, recupera criterios jurídicos verificados de su corpus interno, razona desde la perspectiva defensiva, y emite una conclusión fundada con limitaciones expresas.

### Principio rector

> El sistema opera **exclusivamente desde la perspectiva de la defensa** (in dubio pro reo, presunción de inocencia). Nunca adopta la perspectiva acusatoria ni sugiere estrategias que perjudiquen al imputado.

### Definición formal

> **Alcance Legal Penal es una plataforma LegalTech** que integra un motor de análisis penal con razonamiento guiado por **Claude** (Anthropic), recuperación de jurisprudencia verificada (RAG), detección de patrones procesales, **análisis multimodal de imágenes y documentos PDF**, validación de calidad profesional y generación automatizada de informes — accesible a través de una **interfaz web profesional (PWA)**, una **extensión de Chrome para el MEV** (Mesa de Entradas Virtual), un **servidor MCP para integración con Claude** y endpoints API.

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
- Etapa procesal (IPP, juicio oral, recursos/casación, ejecución)
- Prueba invocada por la acusación
- Pretensión defensiva específica
- Texto del expediente (copiado del MEV u otra fuente)

### Documentación adjunta
- **PDFs del expediente** — hasta 2 archivos, 10 MB cada uno. **Claude analiza el contenido completo del PDF** (pericias, actas, declaraciones, autos) y lo incorpora al razonamiento defensivo.
- **Imágenes del expediente** — hasta 4 imágenes (JPG, PNG, WebP). **Claude Vision las analiza visualmente** como prueba documental: pericias escaneadas, capturas de WhatsApp, fotos de evidencia física.
- **Análisis de metadatos EXIF** — la librería `exifr` extrae client-side: fecha/hora de captura real, coordenadas GPS, dispositivo, señales de edición (software de retoque), y ausencia de datos EXIF (posible indicador de captura de pantalla o imagen editada). Los metadatos se incluyen como contexto defensivo para Claude.
- **Moderación automática de imágenes** — antes del análisis principal, Claude Haiku verifica que las imágenes sean documentación judicial apropiada. Si detecta contenido inapropiado, rechaza la consulta.

### Persistencia del formulario
- El borrador del formulario se guarda automáticamente en `sessionStorage` para evitar pérdida de datos accidental.

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

## 5b. Motor de Análisis: Claude (Anthropic)

### ¿Quién analiza los casos?

El análisis de cada caso lo realiza **Claude** (Anthropic), un modelo de lenguaje avanzado que opera bajo un **system prompt penal fijo e inmutable** de 162 líneas. Claude no improvisa: recibe un contexto cerrado (hechos + criterios RAG verificados + documentos adjuntos) y produce un análisis estructurado en formato JSON con 6 secciones obligatorias.

### Modelo principal: `claude-sonnet-4-6`

| Parámetro | Valor |
|-----------|-------|
| **Motor de razonamiento** | Claude Sonnet 4.6 (Anthropic) |
| **Motor de moderación** | Claude Haiku 4.5 (Anthropic) |
| **Max tokens** | 5.500 (análisis) · 2.048 (patrones) · 10 (moderación) |
| **System prompt** | 162 líneas, inmutable en runtime |
| **Fallback** | No hay fallback — el análisis defensivo requiere Claude |

> **Decisión de diseño:** A diferencia de las versiones Civil/Comercial/Familiar que pueden usar GPT-4 como fallback, Alcance Legal Penal **exige Claude como motor exclusivo** para el análisis defensivo. La línea 356 del Edge Function dice: *"Sin fallback a otros LLMs — el análisis defensivo debe ser siempre por Claude."*

### Capacidades multimodales de Claude

- **Análisis de PDFs completos** — Claude recibe los PDFs como documentos base64 y lee su contenido íntegro (pericias, declaraciones, autos de procesamiento)
- **Análisis visual de imágenes** — Claude Vision analiza capturas de pantalla, pericias escaneadas, fotos de evidencia, y las contrasta contra la versión acusatoria
- **Detección de patrones procesales** — Claude evalúa los 8 patrones procesales en una llamada separada con modelo Sonnet

---

## 5c. Conexión con el MEV — Extensión Chrome "MEV Navigator"

El sistema incluye una **extensión de Chrome** (`chrome-extension/`) que permite al abogado conectarse directamente a la **Mesa de Entradas Virtual (MEV)** de la Suprema Corte de Buenos Aires (SCBA) y analizar expedientes sin copiar/pegar manualmente.

### ¿Qué es el MEV?

La **Mesa de Entradas Virtual** (`mev.scba.gov.ar`) es el sistema de gestión de expedientes judiciales de la Provincia de Buenos Aires. Los abogados acceden a causas, actuaciones, notificaciones y documentos del expediente digital.

### Funcionalidades de la extensión

| Función | Descripción |
|---------|-------------|
| **Extracción automática** | `content.js` inyecta código en `mev.scba.gov.ar` y extrae datos de la carátula y actuaciones del expediente |
| **Panel lateral (Side Panel)** | UI completa en el panel lateral de Chrome con pestañas: Análisis, Documentos, Historial, Config |
| **Análisis en 5 fases** | Ejecuta el pipeline completo de defensa penal sobre los datos extraídos del MEV |
| **Gestión de PDFs** | Lista los PDFs del expediente, selecciona documentos prioritarios (acta de detención, indagatoria, auto de procesamiento), y permite descarga directa |
| **Historial local** | Guarda los últimos 20 análisis en `chrome.storage.local` |

### Arquitectura técnica

```
chrome-extension/
├── manifest.json      ← Manifest V3, permisos: sidePanel, storage, activeTab, scripting
├── background.js      ← Service worker, manejo de mensajes entre content y sidepanel
├── content.js         ← Inyectado en mev.scba.gov.ar — extrae DOM de la causa
├── sidepanel.html/js/css  ← UI del panel lateral (análisis, documentos, historial, config)
├── popup.html/js      ← Popup mínimo para abrir el panel
└── icons/             ← Íconos generados (16, 48, 128px)
```

**Estado actual:** Funcional, pendiente de prueba real en MEV y distribución vía Chrome Web Store (unlisted para abogados beta).

**Próximo paso crítico:** Reemplazar API Key de Anthropic directa por autenticación con Supabase (login del abogado → JWT → Edge Function).

### Alcance y proyecciones del MEV Navigator

- **Fase actual**: Extracción de carátula y actuaciones del DOM del MEV
- **Proyección inmediata**: Descarga y análisis automático de PDFs prioritarios del expediente
- **Proyección media**: Monitoreo de actuaciones nuevas (notificaciones, vistas de causa, resoluciones)
- **Proyección avanzada**: Integración con el PJN (Poder Judicial de la Nación) para causas federales

---

## 5d. Servidor MCP — Integración con Claude Desktop/Cowork

El sistema expone un **servidor MCP (Model Context Protocol)** como Edge Function de Supabase, permitiendo que Claude Desktop o Claude Cowork se conecten directamente al pipeline de defensa penal.

### ¿Qué permite?

Un abogado que use Claude Desktop puede registrar Alcance Legal Penal como herramienta MCP. Cuando comparte hechos de una causa penal en la conversación, Claude invoca automáticamente el pipeline de 5 fases y devuelve el informe defensivo dentro del chat.

### Herramientas MCP expuestas

| Herramienta | Descripción |
|-------------|-------------|
| `analizar_caso` | Ejecuta el pipeline completo de 5 fases sobre los hechos de una causa penal |
| `buscar_jurisprudencia` | Busca criterios jurisprudenciales en el corpus pgvector verificado |

### Configuración

```
URL: https://bwwlgfgjxslbavhfuhia.supabase.co/functions/v1/mcp-server
Protocolo: JSON-RPC 2.0
Auth: Bearer <SUPABASE_ANON_KEY>
Rate limit: 30 llamadas/minuto por cliente
```

### Alcance y proyecciones del MCP

- **Fase actual**: Análisis de texto y búsqueda de jurisprudencia vía MCP
- **Proyección inmediata**: Soporte para adjuntar PDFs del MEV vía `documentacion_caso`
- **Proyección media**: Herramienta `redactar_escrito` para generar borradores judiciales desde Claude Desktop
- **Proyección avanzada**: Conexión bidireccional — Claude Desktop puede consultar el historial de análisis del abogado

---

## 5e. Conexión con el PJN (Poder Judicial de la Nación)

### Estado actual

La extensión MEV Navigator está diseñada para el MEV de la SCBA (Provincia de Buenos Aires). La integración con el **PJN** (Poder Judicial de la Nación, `pjn.gov.ar`) es una **proyección natural** del sistema.

### Proyección técnica

| Aspecto | MEV (actual) | PJN (proyección) |
|---------|-------------|-------------------|
| **Jurisdicción** | Provincial (PBA) | Federal |
| **URL** | mev.scba.gov.ar | pjn.gov.ar / lex100.csjn.gov.ar |
| **Acceso** | Login propio del abogado | Login propio del abogado |
| **Corpus RAG** | CPP PBA (Ley 11.922) | CPPN (Ley 23.984) / CPPF (Ley 27.063) |
| **Extensión** | content.js específico MEV | Nuevo content.js para DOM del PJN |

### Pasos necesarios

1. Desarrollar `content-pjn.js` que extraiga datos del DOM del PJN
2. Ampliar el corpus RAG con criterios del Código Procesal Penal de la Nación
3. Agregar perfil `PROFILE_PENAL_NACION` en el backend
4. Configurar la extensión para detectar automáticamente si está en MEV o PJN

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
| **LLM primario** | Claude Sonnet 4.6 (Anthropic) — motor exclusivo de análisis defensivo |
| **LLM moderación** | Claude Haiku 4.5 (Anthropic) — moderación de imágenes |
| **LLM fallback** | ❌ No hay fallback — decisión de diseño: defensa penal requiere Claude |
| **Búsqueda semántica** | pgvector + función RPC `buscar_criterios()` |
| **Análisis de imágenes** | Claude Vision (multimodal) — pericias, capturas, evidencia |
| **Análisis de PDFs** | Claude (documentos base64) — pericias, actas, declaraciones |
| **Extracción EXIF** | exifr v7 (browser-side, sin servidor) |
| **Autenticación** | Supabase Auth (JWT + RLS por usuario) |
| **Exportación PDF** | jsPDF v4 (`generarReportePDF.js`) |
| **Exportación Word** | docx v9 (`generarReporteWord.js`) — escritos editables para presentación judicial |
| **PWA** | vite-plugin-pwa — instalable en móvil y escritorio |
| **Extensión Chrome** | MEV Navigator (Manifest V3) — `chrome-extension/` |
| **MCP Server** | JSON-RPC 2.0 sobre Edge Function — integración con Claude Desktop |
| **Testing** | Playwright v1.59 — tests E2E automatizados |
| **Deploy** | GitHub Actions → GitHub Pages (CI/CD automático) |
| **Gráficos** | Recharts v3 + Mermaid v11 |

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
| Motor de IA | Modelos genéricos | No usan IA | ✅ Claude (Anthropic) con system prompt penal inmutable |
| Base jurídica | Conocimiento general del modelo | Texto de fallos sin análisis | ✅ RAG con criterios verificados aplicados al caso |
| Control de calidad | Ninguno | No aplica | ✅ Validación anti-sesgo post-razonamiento |
| Rechazo fundamentado | Siempre responden algo | No analizan | ✅ Abstención con explicación |
| Informe profesional | Texto de chat | No genera | ✅ PDF + Word numerado con disclaimer |
| Análisis de documentos | Limitado | No | ✅ PDFs completos + imágenes con Claude Vision + EXIF |
| Detección de patrones | No | No | ✅ 8 patrones procesales frecuentes |
| Conexión con MEV | No | No | ✅ Extensión Chrome que extrae expedientes del MEV |
| Integración con Claude | No aplica | No aplica | ✅ MCP Server para usar desde Claude Desktop |
| Trazabilidad | Nula | Por número de fallo | ✅ Número de informe + historial del usuario |
| Instalable | No | No | ✅ PWA instalable en móvil y escritorio |

---

## 11. Formatos de Exportación

### PDF profesional (`generarReportePDF.js`)
- Informe numerado con header institucional, secciones formales y disclaimer
- Nombre de archivo basado en número de informe: `ALC-PENAL-PBA-2026-000042.pdf`

### Word editable (`generarReporteWord.js`)
- Documento `.docx` editable con fuente Times New Roman, formato A4
- **Ventaja clave**: el abogado puede editar directamente el informe, completar datos del caso (imputado, expediente, juzgado, defensor, carátula), firmar digitalmente y presentar en sede judicial
- Incluye campos `[COMPLETAR]` para datos que el sistema no puede conocer
- 3 tipos de documento: Informe de Defensa Penal, Dictamen de Auditoría Estratégica, Borrador de Escrito Judicial
- Footer con copyright y numeración de páginas

---

## 12. PWA (Progressive Web App)

Alcance Legal Penal es una **aplicación web progresiva** instalable en dispositivos móviles y escritorio.

| Característica | Detalle |
|---|---|
| **Registro** | `autoUpdate` — actualizaciones automáticas |
| **Íconos** | 192px y 512px (maskable) |
| **Display** | Standalone (sin barra del navegador) |
| **Orientación** | Portrait |
| **Offline** | Service Worker con Workbox — caché de assets estáticos |
| **Hero Screen** | Pantalla de bienvenida para móvil (una vez por sesión) |

---

## 13. Testing Automatizado

El proyecto incluye tests E2E con **Playwright** (`tests/`, `playwright.config.js`).

```bash
npm test              # Ejecutar tests
npm run test:headed   # Tests con navegador visible
npm run test:report   # Ver reporte HTML
```

---

## 14. Resumen Ejecutivo

Alcance Legal Penal no es "una API que responde preguntas penales". Es un **sistema de inteligencia jurídica especializado en defensa penal**, impulsado por **Claude (Anthropic)**, que:

1. **Filtra** — Solo admite consultas penales PBA con hechos suficientes
2. **Fundamenta** — Solo razona con criterios y fallos verificados del corpus RAG
3. **Analiza documentos** — Claude Vision procesa PDFs completos, imágenes y metadatos EXIF
4. **Detecta** — Identifica 8 patrones procesales problemáticos automáticamente
5. **Controla** — Valida que el análisis sea defensivo y no improvise
6. **Formaliza** — Genera informes profesionales en PDF y Word editables
7. **Conecta con el MEV** — Extensión Chrome que extrae expedientes de la Mesa de Entradas Virtual
8. **Se integra con Claude** — Servidor MCP para usar desde Claude Desktop/Cowork
9. **Registra** — Historial trazable por usuario con exportación
10. **Se abstiene** — Prefiere rechazar antes que improvisar
11. **Es instalable** — PWA para móvil y escritorio

Es la diferencia entre preguntar en un chat genérico *"¿tengo chances en mi causa?"* y consultar a un sistema que recibe documentos del expediente (incluso directo del MEV), los analiza con Claude, revisa la norma procesal, aplica criterios jurídicos verificados, detecta nulidades potenciales, analiza la prueba de cargo con visión artificial, y emite un informe defensivo editable en Word con limitaciones expresas y número de registro.

---

## 15. Proyecciones Tecnológicas

| Área | Estado actual | Proyección |
|------|--------------|------------|
| **MEV** | Extensión Chrome funcional para SCBA | Prueba real + Chrome Web Store (unlisted) |
| **PJN** | No implementado | content-pjn.js + corpus CPPN + perfil federal |
| **MCP** | 2 herramientas (analizar, buscar) | Agregar redactar_escrito + consultar_historial |
| **Auth extensión** | API Key directa de Anthropic | Migrar a login Supabase del abogado |
| **Imágenes** | Base64 en JSON body (+33% tamaño) | Migrar a `multipart/form-data` |
| **Corpus RAG** | Criterios iniciales CSJN/SCBA/CNCP | Ampliar con más jurisprudencia y doctrina |
| **Word** | 3 tipos de documento | Templates por tipo de escrito (habeas corpus, excarcelación, nulidad) |
| **Monetización** | Producto único en desarrollo | Suscripción por abogado con créditos de análisis |

---

*Alcance Legal Penal — v2.0-lis-penal_pba*
*Mayo 2026*
*Motor de análisis: Claude Sonnet 4.6 (Anthropic)*
*Desarrollado por Edgardo Lamas — Studio Lamas*
