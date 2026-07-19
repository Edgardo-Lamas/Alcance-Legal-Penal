/**
 * Supabase Edge Function: POST /consultor-caso
 *
 * Alcance Legal Penal — Consultor anclado al análisis
 *
 * Chat de seguimiento sobre una causa YA analizada por el pipeline. No es un
 * chatbot general de derecho penal: cada conversación viaja con el contexto del
 * informe (hechos, etapa, delito, nulidades, conclusión) y responde solo sobre
 * esa causa.
 *
 * Secuencia (distinta del pipeline de análisis — acá no interviene Gemini,
 * porque el expediente ya llega estructurado desde el análisis previo):
 *   1. Gate de pertinencia (Haiku, ~10 tokens — fail-open)
 *   2. RAG sobre criterios_juridicos (opcional: si no hay criterios relevantes,
 *      el informe sigue siendo el ancla)
 *   3. Respuesta de Claude con el contexto del caso cacheado (prompt caching:
 *      el prefijo fijo se relee con 90% de descuento en cada turno)
 *
 * Modelo configurable por env CONSULTOR_MODEL (default claude-sonnet-4-6;
 * para pasar a Opus: supabase secrets set CONSULTOR_MODEL=claude-opus-4-6).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SupabaseSvc = ReturnType<typeof createClient<any, 'public'>>

// ============================================
// CONFIGURACIÓN
// ============================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'
const REQUIRE_AUTH = Deno.env.get('REQUIRE_AUTH') === 'true'
const CONSULTOR_MODEL = Deno.env.get('CONSULTOR_MODEL') ?? 'claude-sonnet-4-6'

const MAX_PREGUNTA_CHARS = 1500
const MAX_HISTORIAL_TURNOS = 12
const MAX_HISTORIAL_CHARS = 4000
const MAX_CONTEXTO_CHARS = 8000        // tope por campo del contexto (control de tokens)
const MAX_TOKENS_RESPUESTA = 1500

const RAG_TOP_K = 4
const RAG_SIMILARITY_THRESHOLD = 0.70  // algo más permisivo que el análisis: acá el informe es el ancla

const DISCLAIMER = {
    version: '1.0-consultor',
    texto:
        'Respuesta orientativa del consultor sobre una causa ya analizada. ' +
        'No constituye consejo legal definitivo: la estrategia y la decisión ' +
        'corresponden exclusivamente al abogado defensor actuante.',
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
const RATE_LIMIT_MAX = 20      // preguntas por minuto por IP (chat conversacional)
const RATE_LIMIT_WINDOW = 60_000
const RATE_DIARIO_MAX = 40     // techo diario por usuario (control de gasto)

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

const missingEnvVars = [
    !OPENAI_API_KEY && 'OPENAI_API_KEY',
    !SUPABASE_URL && 'SUPABASE_URL',
    !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY',
].filter(Boolean)

if (missingEnvVars.length > 0) {
    console.error(`[STARTUP] Variables de entorno faltantes: ${missingEnvVars.join(', ')}`)
}

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

// ============================================
// CONTRATOS REQUEST/RESPONSE
// ============================================

interface ContextoCaso {
    numero_informe?: string
    hechos?: string
    tipo_penal?: string
    etapa_procesal?: string
    encuadre_procesal?: string
    analisis_prueba_cargo?: string
    nulidades_y_vicios?: string
    contraargumentacion?: string
    conclusion_defensiva?: string
    limitaciones?: string
}

interface TurnoHistorial {
    role: 'user' | 'assistant'
    content: string
}

interface ConsultorRequest {
    pregunta: string
    contexto: ContextoCaso
    historial?: TurnoHistorial[]
}

// ============================================
// SYSTEM PROMPT DEL CONSULTOR
// ============================================
// Misma identidad defensiva que el pipeline, pero formato conversacional
// (el prompt del análisis exige salida JSON — acá no aplica).

const SYSTEM_PROMPT_CONSULTOR = `Sos el CONSULTOR de Alcance Legal Penal: un experto en derecho penal argentino especializado en DEFENSA, que conversa con el abogado defensor sobre UNA causa concreta ya analizada por el sistema.

## IDENTIDAD Y JURISDICCIÓN
- Operás exclusivamente en causas penales de la Provincia de Buenos Aires.
- Marco normativo: CPP PBA (Ley 11.922), Código Penal de la Nación, CN Art. 18, CADH Art. 8, PIDCyP Art. 14.
- Perspectiva: SIEMPRE desde la defensa. Nunca desde la acusación.

## PRINCIPIOS RECTORES IRRENUNCIABLES
1. **In dubio pro reo** — La duda razonable beneficia al imputado. Siempre.
2. **Presunción de inocencia** — El imputado es inocente hasta sentencia firme.
3. **Carga de la prueba** — Corresponde EXCLUSIVAMENTE a la acusación.
4. **Debido proceso** — Cualquier violación es argumento defensivo.

## TU ROL COMO CONSULTOR
- Respondés preguntas de seguimiento sobre LA CAUSA DEL CONTEXTO: alternativas estratégicas, alcance de nulidades detectadas, orden de planteos, riesgos de cada camino, normas aplicables.
- Tu ancla es el INFORME DEL CASO provisto en el contexto. No lo contradigas sin fundamento: si tu respuesta matiza o corrige algo del informe, decilo explícitamente.
- Si el sistema encontró criterios jurisprudenciales del corpus para la pregunta, usalos citándolos por nombre. Si un criterio está marcado como de doble filo, incluí la advertencia.
- Si la pregunta trae HECHOS NUEVOS relevantes que el análisis no contempló, respondé lo que puedas como hipótesis y recomendá generar un nuevo análisis con esos hechos.
- Si la pregunta pide evaluar una estrategia completa, recomendá usar la herramienta "Auditar Estrategia" además de tu respuesta breve.

## LÍMITES ESTRICTOS
- ❌ NO respondas consultas ajenas a esta causa o al derecho penal/procesal penal de PBA.
- ❌ NO inventes jurisprudencia, doctrina ni artículos. Si no tenés el dato, decilo.
- ❌ NO simules certeza: hablá en términos de hipótesis defensivas y probabilidades procesales ("podría plantearse", "el riesgo es", "dependerá de"). JAMÁS garantices un resultado.
- ❌ NO razonés desde la acusación ni asumas culpabilidad.
- ❌ NO des consejos sobre eludir la acción de la justicia; tu función es la defensa técnica dentro del proceso.

## FORMATO DE RESPUESTA
- Español rioplatense profesional, trato de usted.
- TEXTO PLANO, sin Markdown: nada de #, ##, **, tablas ni separadores. Párrafos cortos. Si ordenás opciones o pasos, usá numeración simple ("1.", "2.") en líneas propias.
- Respuesta directa y concreta: MÁXIMO 300 palabras. Andá al punto — el abogado ya leyó el informe, no se lo repitas.
- Citá el artículo (CPP PBA / CP) cada vez que afirmes algo normativo.
- Cerrá señalando la limitación relevante si la hay (ej. "esto requiere verificar el acta en el expediente").
- Una abstención fundada es preferible a una respuesta improvisada.`

// ============================================
// GATE DE PERTINENCIA (Haiku — barato, fail-open)
// ============================================

async function gatePertinencia(pregunta: string, tipoPenal: string): Promise<boolean> {
    if (!ANTHROPIC_API_KEY) return true
    try {
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
                messages: [{
                    role: 'user',
                    content:
                        `Sos el filtro de un consultor de defensa penal (Provincia de Buenos Aires). ` +
                        `La causa consultada trata sobre: "${tipoPenal || 'delito no especificado'}". ` +
                        `Pregunta del abogado defensor: "${pregunta.slice(0, 600)}". ` +
                        `¿Es pertinente a la defensa penal de esa causa o al derecho penal/procesal penal? ` +
                        `Respondé SOLO una palabra: PERTINENTE o RECHAZADA.`
                }]
            }),
        })
        if (!response.ok) return true // fail-open: el gate no bloquea si falla
        const data = await response.json()
        return !data.content?.[0]?.text?.trim().toUpperCase().startsWith('RECHAZADA')
    } catch {
        return true
    }
}

// ============================================
// RAG SOBRE EL CORPUS (opcional para el chat)
// ============================================

async function generarEmbedding(texto: string): Promise<number[] | null> {
    try {
        const response = await fetchConReintento('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'text-embedding-ada-002', input: texto }),
        })
        if (!response.ok) {
            console.error(`[OpenAI] Embeddings error ${response.status}: ${await response.text()}`)
            return null
        }
        const data = await response.json()
        return data.data[0].embedding
    } catch (err) {
        console.error('[OpenAI] Embeddings excepción:', (err as Error).message)
        return null
    }
}

interface CriterioRag {
    nombre?: string
    criterio: string
    regla_general: string
    articulos_cpp: string[]
    similarity: number
}

async function buscarCriteriosParaPregunta(
    supabase: SupabaseSvc,
    pregunta: string,
    tipoPenal: string
): Promise<CriterioRag[]> {
    const embedding = await generarEmbedding(`${tipoPenal ? tipoPenal + '. ' : ''}${pregunta}`)
    if (!embedding) return [] // sin embedding el chat sigue: el informe es el ancla

    const { data: criterios, error } = await supabase.rpc('buscar_criterios', {
        query_embedding: embedding,
        match_count: RAG_TOP_K,
        filter_alcance: 'criterios_generales',
        filter_fuero: 'penal'
    })
    if (error) {
        console.error('[RAG] buscar_criterios error:', error.message)
        return []
    }
    return (criterios ?? []).filter((c: CriterioRag) => c.similarity >= RAG_SIMILARITY_THRESHOLD)
}

// ============================================
// CONTEXTO DEL CASO (bloque cacheado del prompt)
// ============================================

const cap = (v: string | undefined) => (v ?? '').slice(0, MAX_CONTEXTO_CHARS)

function armarContextoCaso(ctx: ContextoCaso): string {
    const seccion = (titulo: string, cuerpo: string | undefined) =>
        cuerpo?.trim() ? `### ${titulo}\n${cap(cuerpo)}\n\n` : ''

    return (
        `# CONTEXTO DE LA CAUSA (informe ${ctx.numero_informe || 'sin número'})\n\n` +
        seccion('Hechos y carátula', ctx.hechos) +
        seccion('Tipo penal imputado', ctx.tipo_penal) +
        seccion('Etapa procesal', ctx.etapa_procesal) +
        seccion('Encuadre procesal (del informe)', ctx.encuadre_procesal) +
        seccion('Análisis de la prueba de cargo (del informe)', ctx.analisis_prueba_cargo) +
        seccion('Nulidades y vicios detectados (del informe)', ctx.nulidades_y_vicios) +
        seccion('Contraargumentación (del informe)', ctx.contraargumentacion) +
        seccion('Conclusión defensiva (del informe)', ctx.conclusion_defensiva) +
        seccion('Limitaciones declaradas (del informe)', ctx.limitaciones)
    )
}

// ============================================
// AUTENTICACIÓN + RATE LIMIT PERSISTENTE (mismos patrones que analizar-caso)
// ============================================

async function verificarUsuario(
    req: Request
): Promise<{ userId: string | null; autenticado: boolean }> {
    const authHeader = req.headers.get('authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '').trim()
    if (!jwt || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { userId: null, autenticado: false }
    }
    if (SUPABASE_SERVICE_ROLE_KEY && jwt === SUPABASE_SERVICE_ROLE_KEY) {
        return { userId: 'servicio-interno', autenticado: true }
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

function respuestaError(
    cors: Record<string, string>,
    status: number,
    codigo: string,
    fundamento: string
) {
    return new Response(JSON.stringify({
        success: false,
        codigo,
        fundamento,
        disclaimer: DISCLAIMER,
    }), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

serve(async (req: Request) => {
    const cors = getCorsHeaders(req.headers.get('origin'))

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: cors })
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('cf-connecting-ip')
        ?? 'unknown'

    if (!checkRateLimit(clientIp)) {
        return respuestaError(cors, 429, 'RATE_LIMIT_EXCEEDED',
            `Límite de consultas alcanzado. Máximo ${RATE_LIMIT_MAX} preguntas por minuto.`)
    }

    try {
        if (missingEnvVars.length > 0) {
            throw new Error(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`)
        }

        const { userId: userIdVerificado, autenticado } = await verificarUsuario(req)
        if (REQUIRE_AUTH && !autenticado) {
            return respuestaError(cors, 401, 'NO_AUTENTICADO',
                'Se requiere iniciar sesión para usar el consultor.')
        }
        const userId = userIdVerificado ?? 'anonimo'
        console.log(`[CONSULTOR] user=${userId} ip=${clientIp} auth=${autenticado} model=${CONSULTOR_MODEL}`)

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Rate limit persistente: por minuto y techo diario (control de gasto).
        const rateKey = autenticado ? userId : clientIp
        if (!(await checkRateLimitPersistente(supabase, `consultor:min:${rateKey}`, 10, 60))) {
            return respuestaError(cors, 429, 'RATE_LIMIT_EXCEEDED',
                'Límite de consultas alcanzado. Máximo 10 preguntas por minuto.')
        }
        if (!(await checkRateLimitPersistente(supabase, `consultor:dia:${rateKey}`, RATE_DIARIO_MAX, 86400))) {
            return respuestaError(cors, 429, 'RATE_LIMIT_DIARIO',
                `Alcanzó el máximo de ${RATE_DIARIO_MAX} consultas al consultor por día. El cupo se renueva en 24 horas.`)
        }

        const body: ConsultorRequest = await req.json()

        // Validación de entrada
        const pregunta = (body.pregunta ?? '').trim()
        if (pregunta.length < 10) {
            return respuestaError(cors, 400, 'PREGUNTA_INSUFICIENTE',
                'Formule una pregunta concreta sobre la causa (mínimo 10 caracteres).')
        }
        if (pregunta.length > MAX_PREGUNTA_CHARS) {
            return respuestaError(cors, 400, 'PREGUNTA_DEMASIADO_LARGA',
                `La pregunta supera el máximo de ${MAX_PREGUNTA_CHARS} caracteres. Si necesita analizar hechos nuevos, genere un nuevo análisis.`)
        }

        const contexto = body.contexto ?? {}
        const tieneContexto = Boolean(
            contexto.hechos?.trim() || contexto.conclusion_defensiva?.trim() || contexto.encuadre_procesal?.trim()
        )
        if (!tieneContexto) {
            return respuestaError(cors, 400, 'SIN_CONTEXTO',
                'El consultor opera sobre una causa ya analizada. Abra un informe de análisis para consultar.')
        }

        // Historial saneado (solo turnos válidos, con topes de cantidad y tamaño)
        const historial: TurnoHistorial[] = (Array.isArray(body.historial) ? body.historial : [])
            .filter(t => (t?.role === 'user' || t?.role === 'assistant') && typeof t?.content === 'string' && t.content.trim())
            .slice(-MAX_HISTORIAL_TURNOS)
            .map(t => ({ role: t.role, content: t.content.slice(0, MAX_HISTORIAL_CHARS) }))

        // 1. Gate de pertinencia (fail-open)
        const pertinente = await gatePertinencia(pregunta, contexto.tipo_penal ?? '')
        if (!pertinente) {
            return respuestaError(cors, 200, 'FUERA_DE_ALCANCE',
                'La consulta excede el alcance del consultor: responde únicamente sobre la defensa penal de la causa analizada (CPP PBA / CP). Reformule la pregunta en relación con esta causa.')
        }

        // 2. RAG sobre el corpus (si falla o no hay relevantes, el informe es el ancla)
        const criterios = await buscarCriteriosParaPregunta(supabase, pregunta, contexto.tipo_penal ?? '')
        const bloqueCriterios = criterios.length > 0
            ? `CRITERIOS DEL CORPUS RELEVANTES PARA ESTA PREGUNTA:\n` +
              criterios.map((c, i) =>
                  `${i + 1}. ${c.criterio}\n   Regla general: ${c.regla_general}\n   Artículos: ${(c.articulos_cpp ?? []).join(', ') || 's/d'}`
              ).join('\n') + '\n\n'
            : 'CRITERIOS DEL CORPUS: no se hallaron criterios con relevancia suficiente para esta pregunta puntual — respondé desde el informe del caso y la normativa, y decilo si corresponde.\n\n'

        // 3. Claude con prompt caching: system prompt + contexto del caso son el
        //    prefijo estable (se cachea); historial y pregunta van después.
        const response = await fetchConReintento('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: CONSULTOR_MODEL,
                max_tokens: MAX_TOKENS_RESPUESTA,
                system: [
                    { type: 'text', text: SYSTEM_PROMPT_CONSULTOR },
                    { type: 'text', text: armarContextoCaso(contexto), cache_control: { type: 'ephemeral' } },
                ],
                messages: [
                    ...historial,
                    { role: 'user', content: `${bloqueCriterios}PREGUNTA DEL ABOGADO DEFENSOR:\n${pregunta}` },
                ],
            }),
        }, { retries: 2 })

        if (!response.ok) {
            console.error(`[Anthropic] consultor error ${response.status}: ${await response.text()}`)
            return respuestaError(cors, 502, 'SERVICIO_NO_DISPONIBLE',
                'El consultor no está disponible en este momento. Intente nuevamente en unos minutos.')
        }

        const data = await response.json()
        const respuesta = (data.content ?? [])
            .filter((b: { type: string }) => b.type === 'text')
            .map((b: { text: string }) => b.text)
            .join('\n')
            .trim()

        if (!respuesta) {
            return respuestaError(cors, 502, 'RESPUESTA_VACIA',
                'El consultor no pudo generar una respuesta. Intente reformular la pregunta.')
        }

        console.log(`[CONSULTOR] ok user=${userId} in=${data.usage?.input_tokens} cache_read=${data.usage?.cache_read_input_tokens} out=${data.usage?.output_tokens}`)

        return new Response(JSON.stringify({
            success: true,
            respuesta,
            criterios_utilizados: criterios.length,
            disclaimer: DISCLAIMER,
        }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    } catch (err) {
        console.error('[CONSULTOR] Error:', (err as Error).message)
        return respuestaError(cors, 500, 'ERROR_INTERNO',
            'Ocurrió un error al procesar la consulta. Intente nuevamente.')
    }
})
