/**
 * Supabase Edge Function: POST /analizar-caso
 *
 * Endpoint principal de Alcance Legal – Civil.
 * Orquesta el pipeline completo de 5 fases:
 *   1. Admisibilidad → 2. RAG Civil → 3. Razonamiento LIS → 4. Validación → 5. Respuesta
 *
 * Este endpoint representa un ACTO JURÍDICO-INTELECTUAL, no un chat.
 * Toda la configuración del perfil viene de _shared/profile-config.ts.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PROFILE_CIVIL_CONFIG } from '../_shared/profile-config.ts'

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
    SIMILARITY_THRESHOLD: 0.75,
    MIN_RELEVANT_CRITERIA: 2,
}

// ============================================
// CONTRATOS REQUEST/RESPONSE
// ============================================

interface AnalizarCasoRequest {
    /** Descripción de los hechos del caso (requerido) */
    hechos: string
    /** Pretensión del cliente (opcional pero recomendado) */
    pretension?: string
    /** Instituto jurídico principal (opcional, se infiere si no se proporciona) */
    instituto?: string
    /** Documentación disponible */
    documentacion?: string[]
}

interface AnalizarCasoResponse {
    success: true
    status: 'approved' | 'limited' | 'rejected'
    data: {
        numero_informe: string
        fecha_emision: string
        encuadre: string
        analisis: string
        riesgos: string
        conclusion: string
        limitaciones: string
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
    fase_rechazo: 'admisibilidad' | 'rag' | 'validacion'
    codigo: string
    fundamento: string
    recomendacion?: string
    disclaimer: typeof DISCLAIMER
}

// ============================================
// DISCLAIMER INSTITUCIONAL
// ============================================

const DISCLAIMER = {
    version: '1.1',
    texto: 'Este análisis es un insumo técnico basado en criterios jurídicos verificados. No constituye consejo legal definitivo. La validación y decisión final corresponde exclusivamente al profesional actuante.',
    advertencias: [
        'Este análisis NO constituye opinión legal vinculante.',
        PROFILE_CIVIL_CONFIG.disclaimerCorpus,
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
    /seguramente ganará/i, /nunca podrá/i
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

async function invocarRazonamiento(context: string): Promise<Record<string, string>> {
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
                max_tokens: 4096,
                system: PROFILE_CIVIL_CONFIG.systemPrompt,
                messages: [{ role: 'user', content: context }]
            }),
        })

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${await response.text()}`)
        }

        const data = await response.json()
        return JSON.parse(data.content[0].text)
    }

    // Fallback a OpenAI GPT-4
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
                { role: 'system', content: PROFILE_CIVIL_CONFIG.systemPrompt },
                { role: 'user', content: context }
            ]
        }),
    })

    if (!response.ok) {
        throw new Error(`OpenAI Chat error: ${await response.text()}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
}

// ============================================
// FASE 1: ADMISIBILIDAD
// ============================================

function checkAdmissibility(body: AnalizarCasoRequest): {
    admitida: boolean
    codigo: string
    fundamento?: string
} {
    const textoCompleto = `${body.hechos} ${body.pretension || ''}`.toLowerCase()

    if (!body.hechos || body.hechos.trim().length < 20) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_HECHOS_INSUFICIENTES',
            fundamento: PROFILE_CIVIL_CONFIG.politicaRechazo.mensajeHechosInsuficientes
        }
    }

    const tieneFueroExcluido = PROFILE_CIVIL_CONFIG.fuerosExcluidosKeywords
        .some(kw => textoCompleto.includes(kw.toLowerCase()))

    const tieneFueroCivil = PROFILE_CIVIL_CONFIG.fueroAdmitidoKeywords
        .some(kw => textoCompleto.includes(kw.toLowerCase()))

    if (tieneFueroExcluido && !tieneFueroCivil) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_FUERO_EXCLUIDO',
            fundamento: PROFILE_CIVIL_CONFIG.politicaRechazo.mensajeFueraDeCompetencia
        }
    }

    if (tieneFueroExcluido && tieneFueroCivil) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_CONSULTA_HIBRIDA',
            fundamento: PROFILE_CIVIL_CONFIG.politicaRechazo.mensajeConsultaHibrida
        }
    }

    return { admitida: true, codigo: 'ADMITIDA' }
}

// ============================================
// FASE 2: RAG CIVIL
// ============================================

async function retrieveCriteria(
    supabase: ReturnType<typeof createClient>,
    embedding: number[]
): Promise<{
    baseSuficiente: boolean
    codigo: string
    criterios: Array<{ id: string; criterio: string; regla_general: string; articulos_ccyc: string[]; similarity: number }>
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
            fundamento: `No se encontraron criterios en el corpus ${PROFILE_CIVIL_CONFIG.nombre} para esta consulta.`
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
                `Se encontraron ${criterios.length} criterios, pero solo ${criteriosRelevantes.length} ` +
                `superan el umbral de relevancia requerido (${RAG_CONFIG.SIMILARITY_THRESHOLD}).`
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

    // Detectar violación de scope (el LLM habló de otro fuero)
    for (const keyword of PROFILE_CIVIL_CONFIG.fuerosExcluidosKeywords.slice(0, 12)) {
        if (textoCompleto.toLowerCase().includes(keyword.toLowerCase())) {
            return {
                status: 'rejected',
                advertencias: [`Se detectó mención a materia fuera del scope ${PROFILE_CIVIL_CONFIG.nombre}: "${keyword}"`],
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

    const { data, error } = await supabase.rpc('siguiente_numero_informe_civil')

    if (error || data === null) {
        // Fallback si la migración 004 aún no fue aplicada
        const fallback = String(Date.now()).slice(-6)
        console.warn('Secuencia no disponible, usando fallback timestamp:', fallback)
        return `ALC-${PROFILE_CIVIL_CONFIG.codigoInforme}-${year}-${fallback}`
    }

    return `ALC-${PROFILE_CIVIL_CONFIG.codigoInforme}-${year}-${String(data).padStart(6, '0')}`
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
                recomendacion: 'Reformule la consulta limitándola a aspectos estrictamente civiles.',
                disclaimer: DISCLAIMER
            }
            return new Response(JSON.stringify(rechazo), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ==========================================
        // FASE 2: RAG CIVIL
        // ==========================================
        const textoConsulta = `${body.hechos}\n\nPretensión: ${body.pretension || 'No especificada'}`
        const embedding = await generarEmbedding(textoConsulta)

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const rag = await retrieveCriteria(supabase, embedding)

        if (!rag.baseSuficiente) {
            const rechazo: RechazoResponse = {
                success: false,
                fase_rechazo: 'rag',
                codigo: rag.codigo,
                fundamento: rag.fundamento!,
                recomendacion: `La consulta no tiene base suficiente en el corpus ${PROFILE_CIVIL_CONFIG.nombre} verificado.`,
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
            `### Criterio: ${c.criterio} (${c.id})\n**Regla:** ${c.regla_general}\n**Artículos:** ${c.articulos_ccyc?.join(', ') || 'N/A'}`
        ).join('\n\n')

        const contextReasoning =
            `## HECHOS DEL CASO\n${body.hechos}\n\n` +
            `## PRETENSIÓN\n${body.pretension || 'No especificada'}\n\n` +
            `## CRITERIOS CIVILES APLICABLES\n${criteriosTexto}\n\n` +
            `---\nResponde en formato JSON con las claves: encuadre, analisis, riesgos, conclusion, limitaciones.`

        const razonamiento = await invocarRazonamiento(contextReasoning)

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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
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
                encuadre:      razonamiento.encuadre     || '',
                analisis:      razonamiento.analisis     || '',
                riesgos:       razonamiento.riesgos      || '',
                conclusion:    razonamiento.conclusion   || '',
                limitaciones:  razonamiento.limitaciones || ''
            },
            advertencias: validacion.status === 'limited' ? validacion.advertencias : undefined,
            disclaimer: DISCLAIMER,
            meta: {
                criterios_utilizados: rag.criterios.length,
                pipeline_version: `2.0-lis-${PROFILE_CIVIL_CONFIG.id}`,
                timestamp: new Date().toISOString()
            }
        }

        return new Response(JSON.stringify(respuesta), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error en Edge Function:', error)

        return new Response(
            JSON.stringify({
                success: false,
                fase_rechazo: 'sistema',
                codigo: 'ERROR_INTERNO',
                fundamento: error.message || 'Error interno del servidor',
                disclaimer: DISCLAIMER
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
