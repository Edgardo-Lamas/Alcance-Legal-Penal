/**
 * Supabase Edge Function: POST /analizar-caso
 *
 * Alcance Legal Penal — Defensa Penal PBA
 * Orquesta el pipeline completo de 5 fases:
 *   1. Admisibilidad → 2. RAG Penal → 3. Razonamiento LIS → 4. Validación → 5. Respuesta
 *
 * Perspectiva: SIEMPRE desde la defensa. Nunca desde la acusación.
 * Toda la configuración del perfil viene de _shared/profile-config.ts.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PROFILE_PENAL_PBA_CONFIG } from '../_shared/profile-config.ts'

// Tipo del cliente Supabase con schema explícito ('public') para que .rpc()/.from()
// tipen correctamente (ReturnType<typeof createClient> resuelve el schema a `never`).
type SupabaseSvc = ReturnType<typeof createClient<any, 'public'>>

// ============================================
// CONFIGURACIÓN
// ============================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'

// Si es 'true', se exige un JWT de usuario válido (login del abogado). Activar en PRODUCCIÓN.
// Se deja en false por defecto para no romper la beta / los tests con mocks.
const REQUIRE_AUTH = Deno.env.get('REQUIRE_AUTH') === 'true'

// Umbral mínimo de caracteres para activar extracción con Gemini
const GEMINI_EXTRACTION_MIN_CHARS = 500

// Límites de tamaño de adjuntos (validados server-side, no solo en el frontend)
const MAX_IMAGE_BYTES = 6 * 1024 * 1024   // ~6MB por imagen (frontend limita a 4MB)
const MAX_PDF_BYTES   = 13 * 1024 * 1024  // ~13MB por PDF (frontend limita a 10MB)

// Estima los bytes reales a partir del largo de una cadena base64 (~3/4).
function base64Bytes(b64: string): number {
    return Math.floor((b64?.length ?? 0) * 0.75)
}

// fetch con reintento y backoff para errores transitorios de proveedores (429, 5xx, red).
async function fetchConReintento(
    url: string,
    init: RequestInit,
    { retries = 2, baseDelayMs = 500 } = {}
): Promise<Response> {
    let ultimoError: unknown
    for (let intento = 0; intento <= retries; intento++) {
        try {
            const resp = await fetch(url, init)
            if (resp.status === 429 || resp.status >= 500) {
                if (intento < retries) {
                    await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, intento)))
                    continue
                }
            }
            return resp
        } catch (err) {
            ultimoError = err
            if (intento < retries) {
                await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, intento)))
                continue
            }
        }
    }
    throw ultimoError ?? new Error('fetchConReintento agotó los intentos')
}

// ============================================
// RATE LIMITING (en memoria por instancia)
// ============================================

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX      = 10   // máximo de requests
const RATE_LIMIT_WINDOW   = 60_000 // ventana de 60 segundos

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, windowStart: now })
        return true
    }

    if (entry.count >= RATE_LIMIT_MAX) return false

    entry.count++
    return true
}

// Validación temprana de variables de entorno críticas
const missingEnvVars = [
    !OPENAI_API_KEY && 'OPENAI_API_KEY',
    !SUPABASE_URL && 'SUPABASE_URL',
    !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY',
].filter(Boolean)

if (missingEnvVars.length > 0) {
    console.error(`[STARTUP] Variables de entorno faltantes: ${missingEnvVars.join(', ')}`)
}

// CORS restringido al dominio configurado
function getCorsHeaders(requestOrigin: string | null) {
    const allowed = ALLOWED_ORIGIN.split(',').map(o => o.trim())
    const origin = requestOrigin && allowed.includes(requestOrigin)
        ? requestOrigin
        : allowed[0]
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Vary': 'Origin',
    }
}

const RAG_CONFIG = {
    TOP_K: 5,
    SIMILARITY_THRESHOLD: 0.72,  // Levemente más permisivo que Civil por corpus más técnico
    MIN_RELEVANT_CRITERIA: 1,    // Un criterio sólido puede ser suficiente en defensa
}

// ============================================
// CONTRATOS REQUEST/RESPONSE
// ============================================

interface ImagenAdjunta {
    /** Base64 del archivo de imagen, sin el prefijo "data:..." */
    data: string
    /** MIME type de la imagen */
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
    /** Nombre original del archivo (opcional, para logs) */
    nombre?: string
    /** Resumen de metadatos EXIF extraídos client-side — incluye alertas defensivas sobre ausencia de EXIF, software de edición, etc. */
    metadatos_texto?: string
}

interface DocumentoPdf {
    /** Base64 del PDF, sin el prefijo "data:..." */
    data: string
    /** Nombre original del archivo (opcional, para logs) */
    nombre?: string
}

interface AnalizarCasoRequest {
    /** Descripción de los hechos imputados (requerido) */
    hechos: string
    /** Etapa procesal actual (opcional: IPP, juicio oral, recursos) */
    etapa_procesal?: string
    /** Prueba invocada por la acusación (opcional pero recomendado) */
    prueba_acusacion?: string
    /** Pretensión defensiva específica (opcional) */
    pretension_defensiva?: string
    /** Norma o tipo penal aplicado por la acusación (opcional) */
    tipo_penal?: string
    /** Texto de documentación del expediente: pericias, declaraciones, actas (opcional) */
    documentacion_caso?: string
    /** PDFs del expediente adjuntos (máx. 2) */
    documentos_pdf?: DocumentoPdf[]
    /** Imágenes adjuntas: pericias escaneadas, capturas, fotos de evidencia (máx. 4) */
    imagenes?: ImagenAdjunta[]
}

interface AnalizarCasoResponse {
    success: true
    status: 'approved' | 'limited' | 'rejected'
    data: {
        numero_informe: string
        fecha_emision: string
        encuadre_procesal: string
        analisis_prueba_cargo: string
        nulidades_y_vicios: string
        contraargumentacion: string
        conclusion_defensiva: string
        limitaciones: string
        patrones_detectados: PatronDetectado[]
    }
    advertencias?: string[]
    disclaimer: typeof DISCLAIMER
    meta: {
        criterios_utilizados: number
        criterios_raw_rag?: number
        pipeline_version: string
        timestamp: string
    }
}

interface RechazoResponse {
    success: false
    fase_rechazo: 'admisibilidad' | 'rag' | 'validacion' | 'sistema'
    codigo: string
    fundamento: string
    recomendacion?: string
    disclaimer: typeof DISCLAIMER
}

interface PatronDetectado {
    id: string
    nombre_corto: string
    nivel_alerta: 'alto' | 'medio' | 'bajo'
    presente: boolean
    nota_resumen: string
    secciones_relacionadas: string[]
}

// ============================================
// PATRONES PROCESALES PENALES (descripción compacta para el LLM)
// ============================================

// ============================================
// CACHÉ DE EMBEDDINGS (en memoria por instancia)
// ============================================

const embeddingCache = new Map<string, number[]>()
const CACHE_MAX_SIZE = 100

function getCachedEmbedding(key: string): number[] | undefined {
    return embeddingCache.get(key)
}

function setCachedEmbedding(key: string, embedding: number[]): void {
    if (embeddingCache.size >= CACHE_MAX_SIZE) {
        // Elimina el primer elemento (FIFO simple)
        const primera = embeddingCache.keys().next().value
        if (primera !== undefined) embeddingCache.delete(primera)
    }
    embeddingCache.set(key, embedding)
}

const PATRONES_PROCESALES_DESCRIPCION = `
PDN-001 – Prueba digital no autenticada: capturas de pantalla, WhatsApp, correo electrónico, imágenes enviadas sin pericia informática que acredite integridad y autoría. Indicadores: captura de pantalla, mensaje de WhatsApp, chat, correo electrónico, impresión de pantalla, peritaje informático. Nivel base: alto.
PIM-002 – Prueba de imposibilidad material ignorada: coartada no tratada, testigo de descargo ignorado, registro de ingreso/cámara de seguridad/GPS no incorporado, salón no construido, obra en construcción. Nivel base: alto.
CPF-003 – Cambio en la plataforma fáctica: modificación de fecha, lugar o modalidad del hecho entre la imputación y la sentencia; hechos indeterminados o "en reiteradas oportunidades". Nivel base: alto.
RIM-004 – Riesgo de imparcialidad del tribunal: perspectiva de género usada como presunción de culpabilidad, jurado popular, cobertura mediática previa, alegatos emocionales, campaña, activismo. Nivel base: medio.
PDP-005 – Pena desproporcionada / doble valoración de agravantes: se usaron circunstancias que ya integran el tipo agravado (vínculo, convivencia, menor de edad) para agravar además la pena; pena cercana al máximo legal. Nivel base: medio.
ARE-006 – Ausencia de revisión efectiva en la cadena recursiva: tribunal de alzada que confirma sin revisar la prueba; "cuestión de hecho", "valoración del a quo", casación rechazada sin respuesta a los agravios. Nivel base: alto.
PPM-007 – Pericia psicológica oficial de baja calidad con alto peso probatorio: pericia sin metodología validada (SVA/CBCA/NICHD), conclusión de "credibilidad" que usurpa función del juez, usada como eje de la condena sin contrapericia. Nivel base: alto.
CGP-008 – Uso problemático de Cámara Gesell: entrevista sin protocolo NICHD, declaraciones previas que contaminaron el relato, defensa sin control del acto, video no íntegro, múltiples declaraciones, transcripción incompleta. Nivel base: alto.
`.trim()

// ============================================
// DISCLAIMER INSTITUCIONAL
// ============================================

const DISCLAIMER = {
    version: '1.0',
    texto: 'Este análisis es un insumo técnico para la defensa técnica. No constituye consejo legal definitivo. La validación y decisión final corresponde exclusivamente al profesional actuante.',
    advertencias: [
        'Este análisis NO constituye opinión legal vinculante.',
        PROFILE_PENAL_PBA_CONFIG.disclaimerCorpus,
        'La precisión depende de la completitud de la información proporcionada.',
        'La decisión final corresponde exclusivamente al profesional actuante.'
    ]
} as const

// ============================================
// PATRONES DE VALIDACIÓN
// ============================================

const CERTEZA_PATTERNS = [
    /sin duda alguna/i, /absolutamente cierto/i, /garantizo que/i,
    /100% seguro/i, /es imposible que/i, /con total certeza/i,
    /seguramente será absuelto/i, /nunca podrá condenar/i,
    /es culpable/i, /claramente cometió/i,
]

// Patrones que indican que el LLM razonó desde la acusación (violación de scope)
const ACUSACION_BIAS_PATTERNS = [
    /el imputado es culpable/i,
    /la víctima claramente fue/i,
    /no hay duda de la culpabilidad/i,
    /se acredita la responsabilidad/i,
]

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function generarEmbedding(texto: string): Promise<number[]> {
    // Normalizar y usar como cache key (primeros 500 chars son suficientes)
    const cacheKey = texto.slice(0, 500).trim().toLowerCase()
    const cached = getCachedEmbedding(cacheKey)
    if (cached) {
        console.log('[RAG] Embedding desde caché')
        return cached
    }

    const response = await fetchConReintento('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: texto,
        }),
    })

    if (!response.ok) {
        // No exponer el cuerpo del error del proveedor al cliente: loguear detalle, lanzar genérico.
        console.error(`[OpenAI] Embeddings error ${response.status}: ${await response.text()}`)
        throw new Error('Fallo al generar el embedding de la consulta.')
    }

    const data = await response.json()
    const embedding = data.data[0].embedding
    setCachedEmbedding(cacheKey, embedding)
    return embedding
}

// Modera imágenes antes del análisis principal
// Devuelve null si todo OK, o el nombre del archivo rechazado
async function moderarImagenes(imagenes: ImagenAdjunta[]): Promise<string | null> {
    if (!ANTHROPIC_API_KEY || imagenes.length === 0) return null

    const content = [
        {
            type: 'text',
            text: 'Revisá las siguientes imágenes. Respondé SOLO con "APROBADO" si todas son documentación judicial apropiada (pericias, actas, capturas de mensajes, fotos de evidencia, escritos), o "RECHAZADO" si alguna contiene contenido inapropiado (pornografía, violencia explícita, contenido que no sea documentación legal). Una sola palabra.'
        },
        ...imagenes.slice(0, 4).map(img => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.data }
        }))
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 10,
            messages: [{ role: 'user', content }]
        }),
    })

    if (!response.ok) return null // si falla la moderación, no bloqueamos
    const data = await response.json()
    const result = data.content[0].text.trim().toUpperCase()
    return result.startsWith('RECHAZADO') ? 'contenido_inapropiado' : null
}

async function invocarRazonamiento(
    context: string,
    imagenes?: ImagenAdjunta[],
    documentosPdf?: DocumentoPdf[]
): Promise<Record<string, string>> {
    if (ANTHROPIC_API_KEY) {
        const tieneAdjuntos = (imagenes && imagenes.length > 0) || (documentosPdf && documentosPdf.length > 0)
        const pdfsValidos = (documentosPdf ?? []).slice(0, 2).filter(pdf => {
            // Validar header PDF (%PDF-) decodificando los primeros bytes del base64
            try {
                const header = atob(pdf.data.slice(0, 8))
                return header.startsWith('%PDF-')
            } catch {
                return false
            }
        })

        const userContent = tieneAdjuntos
            ? [
                { type: 'text', text: context },
                ...pdfsValidos.map(pdf => ({
                    type: 'document',
                    source: { type: 'base64', media_type: 'application/pdf', data: pdf.data }
                })),
                ...(imagenes ?? []).slice(0, 4).map(img => ({
                    type: 'image',
                    source: { type: 'base64', media_type: img.mediaType, data: img.data }
                }))
              ]
            : context

        const response = await fetchConReintento('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 5500,
                system: PROFILE_PENAL_PBA_CONFIG.systemPrompt,
                messages: [{ role: 'user', content: userContent }]
            }),
        }, { retries: 2 })

        if (!response.ok) {
            console.error(`[Anthropic] razonamiento error ${response.status}: ${await response.text()}`)
            throw new Error('El servicio de análisis no está disponible en este momento. Intente nuevamente en unos minutos.')
        }

        const data = await response.json()
        return parseJsonSafe(data.content[0].text) as Record<string, string>
    }

    // Sin fallback a otros LLMs — el análisis defensivo debe ser siempre por Claude
    throw new Error('El servicio de análisis no está configurado correctamente.')
}

// Helper: limpia markdown fences antes de JSON.parse
function parseJsonSafe(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
}

// ============================================
// CAPA 2 — VALIDACIÓN DE ANALOGÍA FÁCTICA
// ============================================
//
// Segundo filtro del sistema de doble validación de jurisprudencia.
// Cada criterio RAG recuperado se evalúa contra los hechos concretos
// de la causa: ¿son análogos los hechos determinantes del fallo?
// Nunca bloquea el pipeline — en caso de error devuelve todos los criterios.

interface CriterioConAnalogia {
    id: string
    criterio: string
    regla_general: string
    articulos_cpp: string[]
    similarity: number
    analogia: 'directa' | 'parcial' | 'doble_filo' | 'inaplicable'
    razon_analogia: string
}

// ============================================
// EXTRACCIÓN DE DATOS CON GEMINI FLASH
// Convierte texto crudo del MEV en JSON estructurado.
// Reduce hasta 15.000 chars de texto a ~2.000 chars antes de Claude Sonnet.
// ============================================

interface ExtraccionGemini {
    hechos_clave: string
    tipo_penal: string | null
    etapa_procesal: string | null
    imputado: string | null
    actuaciones_resumen: string
    alertas_preliminares: string
}

async function extraerDatosConGemini(documentacion_caso: string): Promise<ExtraccionGemini | null> {
    if (!GEMINI_API_KEY) return null

    const prompt =
        `Sos un asistente jurídico especializado en derecho penal de la Provincia de Buenos Aires.\n\n` +
        `Analizá el siguiente texto del expediente y extraé los datos estructurados clave.\n\n` +
        `TEXTO DEL EXPEDIENTE:\n${documentacion_caso.slice(0, 15000)}\n\n` +
        `Respondé ÚNICAMENTE con un JSON válido con esta estructura:\n` +
        `{\n` +
        `  "hechos_clave": "Descripción concisa de los hechos imputados (máx. 500 chars)",\n` +
        `  "tipo_penal": "Delito o calificación legal imputada, o null",\n` +
        `  "etapa_procesal": "IPP | juicio_oral | intermedia | recursos | ejecucion, o null",\n` +
        `  "imputado": "Nombre del imputado o null",\n` +
        `  "actuaciones_resumen": "Lista cronológica de actuaciones clave (máx. 800 chars)",\n` +
        `  "alertas_preliminares": "Posibles nulidades o irregularidades visibles (máx. 400 chars)"\n` +
        `}`

    const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 1024,
                    temperature: 0.1
                }
            })
        }
    )

    if (!resp.ok) {
        console.warn(`[GEMINI] API error ${resp.status}`)
        return null
    }

    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    return parseJsonSafe(text) as ExtraccionGemini | null
}

async function validarAnalogiaFactica(
    criterios: Array<{ id: string; criterio: string; regla_general: string; articulos_cpp: string[]; similarity: number }>,
    body: AnalizarCasoRequest
): Promise<CriterioConAnalogia[]> {
    const fallback = (): CriterioConAnalogia[] =>
        criterios.map(c => ({ ...c, analogia: 'directa' as const, razon_analogia: '' }))

    if (criterios.length === 0) return fallback()
    if (!GEMINI_API_KEY && !ANTHROPIC_API_KEY) return fallback()

    const criteriosList = criterios.map((c, i) =>
        `${i + 1}. ID: ${c.id}\n   Criterio: ${c.criterio}\n   Regla: ${c.regla_general}`
    ).join('\n\n')

    const prompt =
        `Causa: ${body.hechos.slice(0, 600)}\n` +
        (body.tipo_penal           ? `Tipo penal: ${body.tipo_penal}\n` : '') +
        (body.pretension_defensiva ? `Pretensión defensiva: ${body.pretension_defensiva}\n` : '') +
        (body.prueba_acusacion     ? `Prueba cuestionada: ${body.prueba_acusacion.slice(0, 300)}\n` : '') +
        `\nEvaluá cada criterio: ¿son los hechos determinantes del fallo análogos a esta causa?\n\n` +
        criteriosList +
        `\n\nResponde SOLO con JSON array (sin texto extra):\n` +
        `[{"id":"...","analogia":"directa|parcial|doble_filo|inaplicable","razon":"una oración"}]\n\n` +
        `- directa: hechos análogos, beneficia claramente a la defensa\n` +
        `- parcial: analogía limitada, aplicar con precaución\n` +
        `- doble_filo: puede ser utilizado en contra si se invoca sin cuidado\n` +
        `- inaplicable: los hechos son distintos, no hay analogía real`

    try {
        let responseText: string

        if (GEMINI_API_KEY) {
            // Gemini Flash — path primario (más económico que Haiku)
            const resp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            maxOutputTokens: 1024,
                            temperature: 0.1
                        }
                    })
                }
            )
            if (!resp.ok) {
                console.warn('[CAPA2] Gemini no disponible, usando criterios sin filtrar')
                return fallback()
            }
            const data = await resp.json()
            responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
        } else {
            // Claude Haiku — fallback cuando no hay Gemini configurado
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY!,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                }),
            })
            if (!resp.ok) {
                console.warn('[CAPA2] Haiku no disponible, usando criterios sin filtrar')
                return fallback()
            }
            const data = await resp.json()
            responseText = data.content[0].text
        }

        const validaciones = parseJsonSafe(responseText) as Array<{
            id: string; analogia: 'directa' | 'parcial' | 'doble_filo' | 'inaplicable'; razon: string
        }>

        const vMap = new Map(validaciones.map(v => [v.id, v]))

        return criterios
            .filter(c => vMap.get(c.id)?.analogia !== 'inaplicable')
            .map(c => {
                const v = vMap.get(c.id)
                return { ...c, analogia: v?.analogia ?? 'directa', razon_analogia: v?.razon ?? '' }
            })
    } catch {
        console.warn('[CAPA2] Error en validación de analogía, usando criterios sin filtrar')
        return fallback()
    }
}

// Nota: los patrones procesales se detectan dentro de la misma llamada de razonamiento
// (ver contextReasoning + FASE 3). La antigua función `detectarPatrones` era código muerto
// y se eliminó en la preparación a producción (auditoría A-4).

// ============================================
// FASE 1: ADMISIBILIDAD
// ============================================

function checkAdmissibility(body: AnalizarCasoRequest): {
    admitida: boolean
    codigo: string
    fundamento?: string
} {
    if (!body.hechos || body.hechos.trim().length < 20) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_HECHOS_INSUFICIENTES',
            fundamento: PROFILE_PENAL_PBA_CONFIG.politicaRechazo.mensajeHechosInsuficientes
        }
    }

    const textoCompleto = `${body.hechos} ${body.pretension_defensiva || ''} ${body.tipo_penal || ''} ${body.documentacion_caso || ''}`.toLowerCase()

    const tieneFueroExcluido = PROFILE_PENAL_PBA_CONFIG.fuerosExcluidosKeywords
        .some(kw => textoCompleto.includes(kw.toLowerCase()))

    if (tieneFueroExcluido) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_FUERO_EXCLUIDO',
            fundamento: PROFILE_PENAL_PBA_CONFIG.politicaRechazo.mensajeFueraDeCompetencia
        }
    }

    return { admitida: true, codigo: 'ADMITIDA' }
}

// ============================================
// FASE 2: RAG PENAL
// ============================================

async function retrieveCriteria(
    supabase: SupabaseSvc,
    embedding: number[]
): Promise<{
    baseSuficiente: boolean
    codigo: string
    criterios: Array<{ id: string; criterio: string; regla_general: string; articulos_cpp: string[]; similarity: number }>
    fundamento?: string
}> {
    const { data: criterios, error } = await supabase.rpc('buscar_criterios', {
        query_embedding: embedding,
        match_count: RAG_CONFIG.TOP_K,
        filter_alcance: 'criterios_generales',
        filter_fuero: 'penal'   // evita traer criterios de otros fueros si la DB se vuelve multi-fuero
    })

    if (error) {
        throw new Error(`Error en búsqueda RAG: ${error.message}`)
    }

    if (!criterios || criterios.length === 0) {
        return {
            baseSuficiente: false,
            codigo: 'BASE_INSUFICIENTE_SIN_RESULTADOS',
            criterios: [],
            fundamento: `No se encontraron criterios en el corpus ${PROFILE_PENAL_PBA_CONFIG.nombre} para esta consulta.`
        }
    }

    const criteriosRelevantes = criterios.filter((c: { similarity: number }) =>
        c.similarity >= RAG_CONFIG.SIMILARITY_THRESHOLD
    )

    if (criteriosRelevantes.length < RAG_CONFIG.MIN_RELEVANT_CRITERIA) {
        return {
            baseSuficiente: false,
            codigo: 'BASE_INSUFICIENTE_BAJA_RELEVANCIA',
            criterios,
            fundamento:
                `Se encontraron ${criterios.length} criterios, pero ninguno ` +
                `supera el umbral de relevancia requerido (${RAG_CONFIG.SIMILARITY_THRESHOLD}).`
        }
    }

    return { baseSuficiente: true, codigo: 'BASE_SUFICIENTE', criterios: criteriosRelevantes }
}

// ============================================
// FASE 4: VALIDACIÓN DE SALIDA
// ============================================

function validateOutput(contenido: Record<string, string>): {
    status: 'approved' | 'limited' | 'rejected'
    advertencias: string[]
    esViolacionScope?: boolean
} {
    const advertencias: string[] = []
    const textoCompleto = Object.values(contenido).join(' ')

    // Certeza excesiva → advertencia (no bloquea).
    for (const pattern of CERTEZA_PATTERNS) {
        if (pattern.test(textoCompleto)) {
            advertencias.push('El análisis expresa niveles de certeza que deben interpretarse con cautela profesional.')
            break
        }
    }

    // Posible razonamiento desde la acusación → ADVERTENCIA, no bloqueo.
    // Los patrones de superficie no distinguen una cita/refutación de la acusación
    // ("la fiscalía sostiene que el imputado es culpable, pero no lo probó…") de una
    // violación real de scope. Bloquear con 403 producía falsos rechazos de análisis
    // defensivos correctos (auditoría C-1). El reemplazo ideal es un juicio LLM
    // "¿el informe razona DESDE la acusación? sí/no"; hasta entonces, degradamos a aviso.
    for (const pattern of ACUSACION_BIAS_PATTERNS) {
        if (pattern.test(textoCompleto)) {
            advertencias.push('Revisión manual sugerida: el texto contiene frases que podrían leerse como razonamiento desde la acusación. Verificar que se citan solo para refutarlas.')
            break
        }
    }

    // Mención a materia de otro fuero → ADVERTENCIA, no bloqueo: suele ser una
    // referencia legítima (ej. acción civil dentro del proceso penal). Auditoría C-1/C-2.
    for (const keyword of PROFILE_PENAL_PBA_CONFIG.fuerosExcluidosKeywords) {
        if (textoCompleto.toLowerCase().includes(keyword.toLowerCase())) {
            advertencias.push(`Revisión manual sugerida: el análisis menciona "${keyword}" (materia potencialmente ajena al fuero penal).`)
            break
        }
    }

    // Esta capa nunca rechaza por sí sola: solo aprueba o marca como "limited" con avisos.
    return advertencias.length > 0
        ? { status: 'limited', advertencias }
        : { status: 'approved', advertencias: [] }
}

// ============================================
// NUMERACIÓN DE INFORMES (secuencia DB)
// ============================================

async function generarNumeroInforme(
    supabase: SupabaseSvc
): Promise<string> {
    const year = new Date().getFullYear()

    const { data, error } = await supabase.rpc('siguiente_numero_informe_penal')

    if (error || data === null) {
        // Fallback si la secuencia aún no fue aplicada
        const fallback = String(Date.now()).slice(-6)
        console.warn('Secuencia no disponible, usando fallback timestamp:', fallback)
        return `ALC-${PROFILE_PENAL_PBA_CONFIG.codigoInforme}-${year}-${fallback}`
    }

    return `ALC-${PROFILE_PENAL_PBA_CONFIG.codigoInforme}-${year}-${String(data).padStart(6, '0')}`
}

// ============================================
// AUTENTICACIÓN DE USUARIO (JWT real, no solo decodificado)
// ============================================
// Devuelve el user_id sólo si el JWT es un token de USUARIO válido (login del abogado).
// El anon key también es un JWT válido pero con role='anon' y sin usuario → no cuenta.
async function verificarUsuario(
    req: Request
): Promise<{ userId: string | null; autenticado: boolean }> {
    const authHeader = req.headers.get('authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '').trim()
    if (!jwt || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { userId: null, autenticado: false }
    }
    // Caller interno (mcp-server → analizar-caso): el service role key nunca sale
    // del backend, por lo que autentica como servicio sin pasar por auth.getUser().
    if (SUPABASE_SERVICE_ROLE_KEY && jwt === SUPABASE_SERVICE_ROLE_KEY) {
        return { userId: 'mcp-server', autenticado: true }
    }
    try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${jwt}` } },
        })
        const { data, error } = await client.auth.getUser(jwt)
        if (error || !data?.user) return { userId: null, autenticado: false }
        return { userId: data.user.id, autenticado: true }
    } catch {
        return { userId: null, autenticado: false }
    }
}

// ============================================
// RATE LIMITING PERSISTENTE (tabla Postgres — sobrevive a instancias efímeras)
// ============================================
// Requiere la migración 009 (tabla rate_limits + función check_rate_limit).
// Si la función aún no está aplicada, hace fail-open (no bloquea) y loguea aviso,
// para que el deploy sea seguro incluso antes de correr la migración.
async function checkRateLimitPersistente(
    supabase: SupabaseSvc,
    key: string,
    max: number,
    windowSeconds: number
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_rate_limit', {
            p_key: key,
            p_max: max,
            p_window_seconds: windowSeconds,
        })
        if (error) {
            console.warn('[RATE] check_rate_limit no disponible, fail-open:', error.message)
            return true
        }
        return data === true
    } catch (err) {
        console.warn('[RATE] Error en rate limit persistente, fail-open:', (err as Error).message)
        return true
    }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req: Request) => {
    const cors = getCorsHeaders(req.headers.get('origin'))

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: cors })
    }

    // Rate limiting por IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('cf-connecting-ip')
        ?? 'unknown'

    if (!checkRateLimit(clientIp)) {
        return new Response(
            JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'RATE_LIMIT_EXCEEDED',
                fundamento: 'Límite de solicitudes alcanzado. Máximo 10 análisis por minuto.',
                recomendacion: 'Aguardá un momento antes de realizar otra consulta.',
                disclaimer: DISCLAIMER
            }),
            { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
        )
    }

    try {
        if (missingEnvVars.length > 0) {
            throw new Error(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`)
        }

        // Verificar identidad del usuario (JWT real, no solo decodificado).
        // En PRODUCCIÓN (REQUIRE_AUTH=true) se rechaza cualquier request sin login válido.
        const { userId: userIdVerificado, autenticado } = await verificarUsuario(req)
        if (REQUIRE_AUTH && !autenticado) {
            return new Response(JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'NO_AUTENTICADO',
                fundamento: 'Se requiere iniciar sesión para usar el análisis.',
                disclaimer: DISCLAIMER
            }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
        }
        const userId = userIdVerificado ?? 'anonimo'
        console.log(`[PIPELINE] user=${userId} ip=${clientIp} auth=${autenticado}`)

        // Cliente Supabase (service role) — usado para RAG, rate limit y numeración.
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Rate limiting persistente (autoritativo, sobrevive a instancias efímeras).
        // Clave: usuario si está logueado, si no la IP.
        const rateKey = `analizar:${autenticado ? userId : clientIp}`
        if (!(await checkRateLimitPersistente(supabase, rateKey, RATE_LIMIT_MAX, 60))) {
            return new Response(JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'RATE_LIMIT_EXCEEDED',
                fundamento: `Límite de solicitudes alcanzado. Máximo ${RATE_LIMIT_MAX} análisis por minuto.`,
                recomendacion: 'Aguardá un momento antes de realizar otra consulta.',
                disclaimer: DISCLAIMER
            }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        const body: AnalizarCasoRequest = await req.json()

        // Avisos que se agregan al informe final (ej. hechos extraídos por IA).
        const advertenciasPipeline: string[] = []

        // Validación de tamaño → respuesta 400 directa (no throw: evita filtrar mensajes por el catch).
        if ((body.hechos?.length ?? 0) > 10000) {
            return new Response(JSON.stringify({
                success: false, fase_rechazo: 'sistema', codigo: 'INPUT_DEMASIADO_GRANDE',
                fundamento: 'El campo "hechos" supera el límite de 10.000 caracteres.', disclaimer: DISCLAIMER
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }
        if ((body.documentacion_caso?.length ?? 0) > 20000) {
            return new Response(JSON.stringify({
                success: false, fase_rechazo: 'sistema', codigo: 'INPUT_DEMASIADO_GRANDE',
                fundamento: 'El campo "documentacion_caso" supera el límite de 20.000 caracteres.', disclaimer: DISCLAIMER
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        // Validación de tamaño de adjuntos (server-side). El frontend ya limita, pero un
        // caller directo podría enviar base64 gigante → memoria/costo/timeout.
        if ((body.imagenes ?? []).some(img => base64Bytes(img.data) > MAX_IMAGE_BYTES)) {
            return new Response(JSON.stringify({
                success: false, fase_rechazo: 'sistema', codigo: 'ADJUNTO_DEMASIADO_GRANDE',
                fundamento: `Una imagen adjunta supera el límite de ${Math.round(MAX_IMAGE_BYTES / 1048576)}MB.`, disclaimer: DISCLAIMER
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }
        if ((body.documentos_pdf ?? []).some(pdf => base64Bytes(pdf.data) > MAX_PDF_BYTES)) {
            return new Response(JSON.stringify({
                success: false, fase_rechazo: 'sistema', codigo: 'ADJUNTO_DEMASIADO_GRANDE',
                fundamento: `Un PDF adjunto supera el límite de ${Math.round(MAX_PDF_BYTES / 1048576)}MB.`, disclaimer: DISCLAIMER
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        // ==========================================
        // FASE 1: ADMISIBILIDAD
        // ==========================================
        const admisibilidad = checkAdmissibility(body)

        if (!admisibilidad.admitida) {
            const rechazo: RechazoResponse = {
                success: false,
                fase_rechazo: 'admisibilidad',
                codigo: admisibilidad.codigo,
                fundamento: admisibilidad.fundamento!,
                recomendacion: 'Reformule la consulta incluyendo: hechos imputados, norma penal aplicada, prueba invocada, y pretensión defensiva.',
                disclaimer: DISCLAIMER
            }
            return new Response(JSON.stringify(rechazo), {
                status: 400,
                headers: { ...cors, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 1.5: EXTRACCIÓN CON GEMINI (pre-procesamiento MEV)
        // Reduce texto crudo del MEV a resumen estructurado antes de Claude.
        // Si Gemini no está disponible, el pipeline sigue sin cambios.
        // ==========================================
        if (GEMINI_API_KEY && body.documentacion_caso && body.documentacion_caso.length >= GEMINI_EXTRACTION_MIN_CHARS) {
            try {
                const extraccion = await extraerDatosConGemini(body.documentacion_caso)
                if (extraccion) {
                    const longitudOriginal = body.documentacion_caso.length
                    if (!body.tipo_penal && extraccion.tipo_penal) body.tipo_penal = extraccion.tipo_penal
                    if (!body.etapa_procesal && extraccion.etapa_procesal) body.etapa_procesal = extraccion.etapa_procesal
                    if (body.hechos.length < 80 && extraccion.hechos_clave) {
                        body.hechos = extraccion.hechos_clave
                        // Gemini es una capa nueva y sin probar a fondo: dejar traza visible
                        // al abogado de que los "hechos" fueron extraídos automáticamente.
                        advertenciasPipeline.push('Los "hechos" analizados fueron extraídos automáticamente por IA a partir del texto del expediente (el campo original era breve). Verificá que reflejen fielmente la causa.')
                    }
                    body.documentacion_caso =
                        `[RESUMEN AUTOMÁTICO — texto original: ${longitudOriginal} caracteres]\n\n` +
                        `HECHOS CLAVE: ${extraccion.hechos_clave}\n\n` +
                        `ACTUACIONES RELEVANTES:\n${extraccion.actuaciones_resumen}` +
                        (extraccion.alertas_preliminares
                            ? `\n\nALERTAS PRELIMINARES:\n${extraccion.alertas_preliminares}`
                            : '')
                    console.log(`[GEMINI] Extracción OK. ${longitudOriginal} → ${body.documentacion_caso.length} chars`)
                }
            } catch (err) {
                console.warn('[GEMINI] Extracción fallida, continuando con datos originales:', (err as Error).message)
            }
        }

        // ==========================================
        // FASE 2: RAG PENAL
        // ==========================================
        //
        // El query del RAG se construye con orden de prioridad explícita:
        // pretension_defensiva primero (señal más fuerte), luego tipo_penal,
        // etapa, y núcleo de hechos. La documentacion_caso se excluye
        // deliberadamente: es extensa, diluye la señal semántica y el LLM
        // la lee completa en Fase 3. Dos filtros > uno solo al final.
        const queryRAG = [
            body.pretension_defensiva ? `Objetivo defensivo: ${body.pretension_defensiva}` : '',
            body.tipo_penal           ? `Tipo penal imputado: ${body.tipo_penal}` : '',
            body.etapa_procesal       ? `Etapa procesal: ${body.etapa_procesal}` : '',
            `Hechos: ${body.hechos.slice(0, 400)}`,
            body.prueba_acusacion     ? `Prueba de cargo: ${body.prueba_acusacion.slice(0, 200)}` : '',
        ].filter(Boolean).join('\n')

        const embedding = await generarEmbedding(queryRAG)

        const rag = await retrieveCriteria(supabase, embedding)

        if (!rag.baseSuficiente) {
            const rechazo: RechazoResponse = {
                success: false,
                fase_rechazo: 'rag',
                codigo: rag.codigo,
                fundamento: rag.fundamento!,
                recomendacion: `La consulta no tiene base suficiente en el corpus ${PROFILE_PENAL_PBA_CONFIG.nombre} verificado.`,
                disclaimer: DISCLAIMER
            }
            return new Response(JSON.stringify(rechazo), {
                status: 422,
                headers: { ...cors, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 2.5: CAPA 2 — VALIDACIÓN DE ANALOGÍA FÁCTICA
        // ==========================================
        // Haiku evalúa si los hechos determinantes de cada criterio RAG
        // son análogos a los de esta causa. Excluye inaplicables y anota
        // parciales y doble-filo para que el LLM principal los trate correctamente.
        const criteriosValidados = await validarAnalogiaFactica(rag.criterios, body)
        console.log(`[CAPA2] ${rag.criterios.length} criterios RAG → ${criteriosValidados.length} validados`)

        // ==========================================
        // FASE 3: RAZONAMIENTO GUIADO (LIS)
        // ==========================================
        const ANALOGIA_LABEL: Record<string, string> = {
            'directa':    '✓ Aplicable directamente a esta causa',
            'parcial':    '⚡ Aplicable con precaución — analogía limitada',
            'doble_filo': '⚠️ DOBLE FILO — puede ser usado en contra si se invoca sin cuidado',
        }
        const criteriosTexto = criteriosValidados.map((c) =>
            `### Criterio: ${c.criterio} (${c.id})\n` +
            `**Regla:** ${c.regla_general}\n` +
            `**Artículos:** ${c.articulos_cpp?.join(', ') || 'N/A'}\n` +
            `**Analogía con esta causa:** ${ANALOGIA_LABEL[c.analogia] ?? c.analogia}` +
            (c.razon_analogia ? ` — ${c.razon_analogia}` : '')
        ).join('\n\n')

        const imagenesCount = body.imagenes?.length ?? 0
        const pdfCount = body.documentos_pdf?.length ?? 0

        const contextReasoning =
            `## HECHOS IMPUTADOS\n${body.hechos}\n\n` +
            (body.tipo_penal ? `## TIPO PENAL APLICADO POR LA ACUSACIÓN\n${body.tipo_penal}\n\n` : '') +
            (body.etapa_procesal ? `## ETAPA PROCESAL\n${body.etapa_procesal}\n\n` : '') +
            (body.prueba_acusacion ? `## PRUEBA INVOCADA POR LA ACUSACIÓN\n${body.prueba_acusacion}\n\n` : '') +
            (body.pretension_defensiva ? `## PRETENSIÓN DEFENSIVA\n${body.pretension_defensiva}\n\n` : '') +
            (body.documentacion_caso ? `## DOCUMENTACIÓN DEL EXPEDIENTE (texto)\n${body.documentacion_caso.slice(0, 20000)}\n\n` : '') +
            (pdfCount > 0
                ? `## DOCUMENTOS PDF ADJUNTOS (${pdfCount} archivo/s)\n` +
                  `El abogado adjuntó ${pdfCount} PDF/s del expediente. Analice su contenido completo e incorpórelo al informe defensivo.\n\n`
                : '') +
            (imagenesCount > 0
                ? `## IMÁGENES ADJUNTAS (${imagenesCount} imagen/es)\n` +
                  `El abogado ha adjuntado ${imagenesCount} imagen/es. Metadatos EXIF extraídos client-side:\n\n` +
                  (body.imagenes ?? []).slice(0, 4).map((img, i) =>
                      `### Imagen ${i + 1}${img.nombre ? ` — ${img.nombre}` : ''}\n` +
                      (img.metadatos_texto
                          ? img.metadatos_texto
                          : `- Metadatos: No disponibles\nALERTA: Sin metadatos EXIF. Posible captura de pantalla o imagen editada. Requiere pericia informática (art. 244 CPP PBA).`)
                  ).join('\n\n') + '\n\n'
                : '') +
            `## CRITERIOS PENALES APLICABLES (CPP PBA / CP)\n${criteriosTexto}\n\n` +
            `## PATRONES PROCESALES — DETECCIÓN OBLIGATORIA\n` +
            `Además del análisis principal, evaluá cada uno de estos 8 patrones procesales:\n${PATRONES_PROCESALES_DESCRIPCION}\n\n` +
            `---\nResponde en formato JSON con las claves exactas:\n` +
            `encuadre_procesal, analisis_prueba_cargo, nulidades_y_vicios, contraargumentacion, conclusion_defensiva, limitaciones,\n` +
            `patrones_detectados (array con los 8 patrones evaluados, formato: [{id, nombre_corto, nivel_alerta, presente, nota_resumen, secciones_relacionadas}]).`

        // Moderación de imágenes antes del análisis principal
        if (body.imagenes && body.imagenes.length > 0) {
            const moderacion = await moderarImagenes(body.imagenes)
            if (moderacion) {
                return new Response(JSON.stringify({
                    success: false,
                    fase_rechazo: 'admisibilidad',
                    codigo: 'RECHAZADA_CONTENIDO_INAPROPIADO',
                    fundamento: 'Las imágenes adjuntas no corresponden a documentación judicial válida. Solo se admiten imágenes de pericias, actas, capturas de mensajes y evidencia procesal.',
                    recomendacion: 'Adjunte únicamente imágenes relacionadas con el expediente judicial.',
                    disclaimer: DISCLAIMER
                }), {
                    status: 400,
                    headers: { ...cors, 'Content-Type': 'application/json' }
                })
            }
        }

        const respuestaCompleta = await invocarRazonamiento(contextReasoning, body.imagenes, body.documentos_pdf)

        // Extraer patrones del resultado (vienen en la misma llamada LLM)
        let patrones: PatronDetectado[] = []
        if (Array.isArray(respuestaCompleta.patrones_detectados)) {
            patrones = respuestaCompleta.patrones_detectados as PatronDetectado[]
            delete (respuestaCompleta as Record<string, unknown>).patrones_detectados
        }

        const razonamiento = respuestaCompleta

        // ==========================================
        // FASE 4: VALIDACIÓN DE SALIDA
        // ==========================================
        const validacion = validateOutput(razonamiento)

        if (validacion.status === 'rejected') {
            const rechazo: RechazoResponse = {
                success: false,
                fase_rechazo: 'validacion',
                codigo: 'RECHAZADA_VALIDACION',
                fundamento: 'El análisis no superó los controles de calidad profesional.',
                recomendacion: validacion.advertencias.join(' '),
                disclaimer: DISCLAIMER
            }
            const httpStatus = validacion.esViolacionScope ? 403 : 422
            return new Response(JSON.stringify(rechazo), {
                status: httpStatus,
                headers: { ...cors, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 5: RESPUESTA
        // ==========================================
        const numeroInforme = await generarNumeroInforme(supabase)

        // Fusionar avisos: los del pipeline (ej. hechos por IA) + los de la validación.
        const advertenciasFinal = [
            ...advertenciasPipeline,
            ...(validacion.status === 'limited' ? validacion.advertencias : []),
        ]
        const statusFinal = advertenciasFinal.length > 0 && validacion.status === 'approved'
            ? 'limited' as const
            : validacion.status

        const respuesta: AnalizarCasoResponse = {
            success: true,
            status: statusFinal,
            data: {
                numero_informe: numeroInforme,
                fecha_emision: new Date().toISOString(),
                encuadre_procesal:      razonamiento.encuadre_procesal      || '',
                analisis_prueba_cargo:  razonamiento.analisis_prueba_cargo  || '',
                nulidades_y_vicios:     razonamiento.nulidades_y_vicios     || '',
                contraargumentacion:    razonamiento.contraargumentacion     || '',
                conclusion_defensiva:   razonamiento.conclusion_defensiva   || '',
                limitaciones:           razonamiento.limitaciones            || '',
                patrones_detectados:    patrones
            },
            advertencias: advertenciasFinal.length > 0 ? advertenciasFinal : undefined,
            disclaimer: DISCLAIMER,
            meta: {
                criterios_utilizados: criteriosValidados.length,
                criterios_raw_rag: rag.criterios.length,
                pipeline_version: `1.0-lis-${PROFILE_PENAL_PBA_CONFIG.id}`,
                timestamp: new Date().toISOString()
            }
        }

        return new Response(JSON.stringify(respuesta), {
            headers: { ...cors, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        // Loguear el detalle server-side; NUNCA devolver el mensaje crudo al cliente
        // (puede contener errores de proveedores / info interna).
        console.error('Error en Edge Function:', error)

        return new Response(
            JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'ERROR_INTERNO',
                fundamento: 'Ocurrió un error al procesar el análisis. Intente nuevamente en unos minutos.',
                disclaimer: DISCLAIMER
            }),
            {
                status: 500,
                headers: { ...cors, 'Content-Type': 'application/json' }
            }
        )
    }
})
