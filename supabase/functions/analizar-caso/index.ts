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

// ============================================
// CONFIGURACIÓN
// ============================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const response = await fetch('https://api.openai.com/v1/embeddings', {
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
        throw new Error(`OpenAI Embeddings error: ${await response.text()}`)
    }

    const data = await response.json()
    return data.data[0].embedding
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
        const userContent = tieneAdjuntos
            ? [
                { type: 'text', text: context },
                ...(documentosPdf ?? []).slice(0, 2).map(pdf => ({
                    type: 'document',
                    source: { type: 'base64', media_type: 'application/pdf', data: pdf.data }
                })),
                ...(imagenes ?? []).slice(0, 4).map(img => ({
                    type: 'image',
                    source: { type: 'base64', media_type: img.mediaType, data: img.data }
                }))
              ]
            : context

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 8192,
                system: PROFILE_PENAL_PBA_CONFIG.systemPrompt,
                messages: [{ role: 'user', content: userContent }]
            }),
        })

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${await response.text()}`)
        }

        const data = await response.json()
        return parseJsonSafe(data.content[0].text) as Record<string, string>
    }

    // Fallback a OpenAI GPT-4 (solo texto — no soporta vision en este flujo)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: PROFILE_PENAL_PBA_CONFIG.systemPrompt },
                { role: 'user', content: context }
            ]
        }),
    })

    if (!response.ok) {
        throw new Error(`OpenAI Chat error: ${await response.text()}`)
    }

    const data = await response.json()
    return parseJsonSafe(data.choices[0].message.content) as Record<string, string>
}

// Helper: limpia markdown fences antes de JSON.parse
function parseJsonSafe(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
}

// ============================================
// DETECCIÓN DE PATRONES PROCESALES (FASE 4 sub-tarea)
// ============================================

async function detectarPatrones(
    casoContext: string,
    borrador: Record<string, string>
): Promise<PatronDetectado[]> {
    const borradorTexto = Object.entries(borrador)
        .map(([k, v]) => `### ${k}\n${v}`)
        .join('\n\n')

    const prompt =
        `Tenés el siguiente caso penal y el borrador de informe defensivo.\n\n` +
        `## CASO\n${casoContext}\n\n` +
        `## BORRADOR DE INFORME\n${borradorTexto}\n\n` +
        `## PATRONES PROCESALES PENALES\n${PATRONES_PROCESALES_DESCRIPCION}\n\n` +
        `Revisá el caso y el borrador. Para cada uno de los 8 patrones (PDN-001 a CGP-008) determiná:\n` +
        `- presente: true si hay indicios del patrón en el caso o la prueba descripta\n` +
        `- nivel_alerta: "alto", "medio" o "bajo" según la gravedad\n` +
        `- nota_resumen: 1-2 frases en lenguaje claro explicando por qué está o no presente\n` +
        `- secciones_relacionadas: array con las secciones donde debe reflejarse (analisis_prueba_cargo, nulidades_y_vicios, contraargumentacion, encuadre_procesal, conclusion_defensiva)\n\n` +
        `Devolvé SOLO el JSON array sin texto adicional:\n` +
        `[{"id":"PDN-001","nombre_corto":"...","nivel_alerta":"alto","presente":true,"nota_resumen":"...","secciones_relacionadas":["..."]}]`

    if (ANTHROPIC_API_KEY) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }]
            }),
        })

        if (!response.ok) {
            throw new Error(`Anthropic API error (patrones): ${await response.text()}`)
        }

        const data = await response.json()
        return parseJsonSafe(data.content[0].text) as PatronDetectado[]
    }

    // Fallback OpenAI — json_object requiere wrapper de objeto
    const promptOpenAI = prompt.replace(
        'Devolvé SOLO el JSON array sin texto adicional:\n[{',
        'Devolvé un JSON object con la clave "patrones_detectados" conteniendo el array:\n{"patrones_detectados":[{'
    ).replace(/\]$/, ']}'
    )

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'Eres un asistente jurídico especializado en defensa penal PBA. Devuelve solo JSON.' },
                { role: 'user', content: promptOpenAI }
            ]
        }),
    })

    if (!response.ok) {
        throw new Error(`OpenAI error (patrones): ${await response.text()}`)
    }

    const data = await response.json()
    const parsed = parseJsonSafe(data.choices[0].message.content) as Record<string, unknown>
    return ((parsed.patrones_detectados ?? parsed) as PatronDetectado[])
}

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
    supabase: ReturnType<typeof createClient>,
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
        filter_alcance: 'criterios_generales'
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
    let errorCount = 0
    const textoCompleto = Object.values(contenido).join(' ')

    // Detectar certeza excesiva
    for (const pattern of CERTEZA_PATTERNS) {
        if (pattern.test(textoCompleto)) {
            advertencias.push('El análisis expresa niveles de certeza que deben interpretarse con cautela profesional.')
            errorCount++
            break
        }
    }

    // Detectar bias hacia la acusación (violación de scope crítica)
    for (const pattern of ACUSACION_BIAS_PATTERNS) {
        if (pattern.test(textoCompleto)) {
            return {
                status: 'rejected',
                advertencias: ['Se detectó razonamiento desde la perspectiva de la acusación. El sistema opera exclusivamente desde la defensa.'],
                esViolacionScope: true
            }
        }
    }

    // Detectar mención a fueros excluidos
    for (const keyword of PROFILE_PENAL_PBA_CONFIG.fuerosExcluidosKeywords) {
        if (textoCompleto.toLowerCase().includes(keyword.toLowerCase())) {
            return {
                status: 'rejected',
                advertencias: [`Se detectó mención a materia fuera del scope penal: "${keyword}"`],
                esViolacionScope: true
            }
        }
    }

    if (errorCount >= 2) return { status: 'rejected', advertencias }
    if (errorCount === 1 || advertencias.length > 0) return { status: 'limited', advertencias }
    return { status: 'approved', advertencias: [] }
}

// ============================================
// NUMERACIÓN DE INFORMES (secuencia DB)
// ============================================

async function generarNumeroInforme(
    supabase: ReturnType<typeof createClient>
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
// HANDLER PRINCIPAL
// ============================================

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Variables de entorno no configuradas')
        }

        const body: AnalizarCasoRequest = await req.json()

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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 2: RAG PENAL
        // ==========================================
        const textoConsulta = [
            body.hechos,
            body.tipo_penal ? `Tipo penal: ${body.tipo_penal}` : '',
            body.etapa_procesal ? `Etapa: ${body.etapa_procesal}` : '',
            body.prueba_acusacion ? `Prueba de cargo: ${body.prueba_acusacion}` : '',
            body.pretension_defensiva ? `Pretensión: ${body.pretension_defensiva}` : '',
            body.documentacion_caso ? `Documentación del expediente: ${body.documentacion_caso.slice(0, 8000)}` : '',
        ].filter(Boolean).join('\n\n')

        const embedding = await generarEmbedding(textoConsulta)

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 3: RAZONAMIENTO GUIADO (LIS)
        // ==========================================
        const criteriosTexto = rag.criterios.map((c) =>
            `### Criterio: ${c.criterio} (${c.id})\n**Regla:** ${c.regla_general}\n**Artículos:** ${c.articulos_cpp?.join(', ') || 'N/A'}`
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
            `---\nResponde en formato JSON con las claves exactas: encuadre_procesal, analisis_prueba_cargo, nulidades_y_vicios, contraargumentacion, conclusion_defensiva, limitaciones.`

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
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        const razonamiento = await invocarRazonamiento(contextReasoning, body.imagenes, body.documentos_pdf)

        // ==========================================
        // FASE 4: VALIDACIÓN DE SALIDA + DETECCIÓN DE PATRONES
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Detectar patrones procesales (no bloquea el pipeline)
        let patrones: PatronDetectado[] = []
        try {
            patrones = await detectarPatrones(textoConsulta, razonamiento)
        } catch (e) {
            console.warn('Error en detección de patrones:', e)
        }

        // ==========================================
        // FASE 5: RESPUESTA
        // ==========================================
        const numeroInforme = await generarNumeroInforme(supabase)

        const respuesta: AnalizarCasoResponse = {
            success: true,
            status: validacion.status,
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
            advertencias: validacion.status === 'limited' ? validacion.advertencias : undefined,
            disclaimer: DISCLAIMER,
            meta: {
                criterios_utilizados: rag.criterios.length,
                pipeline_version: `1.0-lis-${PROFILE_PENAL_PBA_CONFIG.id}`,
                timestamp: new Date().toISOString()
            }
        }

        return new Response(JSON.stringify(respuesta), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error en Edge Function:', error)
        const mensaje = error instanceof Error ? error.message : 'Error interno del servidor'

        return new Response(
            JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'ERROR_INTERNO',
                fundamento: mensaje,
                disclaimer: DISCLAIMER
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
