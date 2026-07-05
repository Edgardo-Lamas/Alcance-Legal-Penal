/**
 * Supabase Edge Function: MCP Server — Alcance Legal Penal
 *
 * Implementa el protocolo MCP (Model Context Protocol) sobre HTTP
 * para conectar Claude Cowork con el pipeline de defensa penal PBA.
 *
 * Herramientas expuestas:
 *   - analizar_caso: corre el pipeline completo de 5 fases
 *   - buscar_jurisprudencia: busca en el corpus pgvector
 *
 * Registro en Claude Cowork:
 *   URL: https://<project>.supabase.co/functions/v1/mcp-server
 *   Auth: Bearer <SUPABASE_ANON_KEY>
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Entorno ───────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!
const OPENAI_API_KEY            = Deno.env.get('OPENAI_API_KEY')!
// Secreto propio del MCP. NO cae al anon key (que es público): si no está configurado,
// se rechazan todas las solicitudes autenticadas (fail-closed).
const MCP_SECRET                = Deno.env.get('MCP_SECRET')
if (!MCP_SECRET) {
    console.error('[MCP][STARTUP] MCP_SECRET no configurado — las solicitudes autenticadas serán rechazadas. Configurar en producción.')
}

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://claude.ai',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
}

// ─── Rate limiting MCP ──────────────────────────────────────────────────────
const mcpRateMap = new Map<string, { count: number; windowStart: number }>()
const MCP_RATE_MAX    = 30    // 30 llamadas MCP por minuto por cliente
const MCP_RATE_WINDOW = 60_000

function checkMcpRateLimit(key: string): boolean {
    const now = Date.now()
    const entry = mcpRateMap.get(key)
    if (!entry || now - entry.windowStart > MCP_RATE_WINDOW) {
        mcpRateMap.set(key, { count: 1, windowStart: now })
        return true
    }
    if (entry.count >= MCP_RATE_MAX) return false
    entry.count++
    return true
}

// ─── Autenticación MCP ──────────────────────────────────────────────────────
function validateAuth(req: Request): { ok: boolean; clientId: string } {
    const auth = req.headers.get('authorization') ?? ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!MCP_SECRET || !token || token !== MCP_SECRET) {
        return { ok: false, clientId: 'unknown' }
    }
    // Usa los primeros 8 chars del token como ID de cliente para rate limiting
    return { ok: true, clientId: token.slice(0, 8) }
}

// ─── Definición de herramientas MCP ────────────────────────────────────────

const TOOL_ANALIZAR_CASO = {
    name: 'analizar_caso',
    description: `Ejecuta el pipeline de análisis de defensa penal de 5 fases sobre los hechos
de una causa penal bajo CPP PBA (Ley 11.922). Retorna encuadre procesal, análisis de prueba
de cargo, nulidades y vicios procesales, contraargumentación defensiva y conclusión estratégica.
Usar siempre que el usuario comparta hechos de una causa penal para analizar.`,
    inputSchema: {
        type: 'object',
        properties: {
            hechos: {
                type: 'string',
                description: 'Descripción de los hechos imputados o del expediente (requerido, mínimo 50 caracteres)',
            },
            etapa_procesal: {
                type: 'string',
                description: 'Etapa procesal actual: IPP, intermedia, juicio_oral, recursos',
            },
            prueba_acusacion: {
                type: 'string',
                description: 'Prueba invocada por la acusación (testigos, pericias, evidencia)',
            },
            pretension_defensiva: {
                type: 'string',
                description: 'Pretensión concreta de la defensa (ej: sobreseimiento, excarcelación, nulidad)',
            },
            tipo_penal: {
                type: 'string',
                description: 'Norma o tipo penal aplicado por la acusación (ej: art. 79 CP, art. 119 CP)',
            },
            documentacion_caso: {
                type: 'string',
                description: 'Texto de documentación del expediente: actas, pericias, declaraciones (del MEV u otro origen)',
            },
        },
        required: ['hechos'],
    },
}

const TOOL_BUSCAR_JURISPRUDENCIA = {
    name: 'buscar_jurisprudencia',
    description: `Busca criterios jurisprudenciales y doctrinarios en el corpus penal PBA verificado.
Útil para encontrar precedentes de la SCBA y CSJN aplicables a un instituto procesal específico.
Para mejores resultados, incluir pretension_defensiva y hechos_clave cuando se tiene contexto de la causa.`,
    inputSchema: {
        type: 'object',
        properties: {
            consulta: {
                type: 'string',
                description: 'Tema o instituto a buscar (ej: "prisión preventiva peligro de fuga", "nulidad allanamiento")',
            },
            instituto: {
                type: 'string',
                description: 'Filtro por instituto procesal: nulidades, excarcelacion, prueba, garantias',
            },
            pretension_defensiva: {
                type: 'string',
                description: 'Objetivo concreto de la defensa para esta causa (ej: "nulidad del reconocimiento en rueda", "excarcelación por exceso de plazo")',
            },
            hechos_clave: {
                type: 'string',
                description: 'Hechos más relevantes de la causa para afinar la analogía fáctica (máx. 300 chars)',
            },
        },
        required: ['consulta'],
    },
}

const TOOL_GUARDAR_BRIEF = {
    name: 'guardar_brief_expediente',
    description: `Guarda o actualiza el brief estructurado de un expediente en Supabase.
Llamar siempre al cerrar una sesión de trabajo con una causa para preservar el contexto.
En la próxima sesión, obtener_brief_expediente recupera este resumen sin necesidad de releer PDFs.`,
    inputSchema: {
        type: 'object',
        properties: {
            numero_expediente: {
                type: 'string',
                description: 'Número de expediente (ej: "LP-12345-2023", "IPP 23456/2024")',
            },
            nombre_imputado: { type: 'string', description: 'Nombre completo del imputado/condenado' },
            condena_o_situacion: { type: 'string', description: 'Condena o situación procesal actual (ej: "3 años, TOC 1 Lomas, 12/03/2023, firme")' },
            delito: { type: 'string', description: 'Tipo penal imputado o delito condenado (art. CP)' },
            etapa_procesal: { type: 'string', description: 'Etapa actual: IPP, intermedia, juicio_oral, ejecucion, recursos' },
            defensor: { type: 'string', description: 'Nombre del defensor y matrícula si se conoce' },
            situacion_actual: { type: 'string', description: 'Última resolución o estado del expediente con fecha' },
            obstaculo_central: { type: 'string', description: 'Principal argumento o hecho adverso que enfrenta la defensa' },
            proximo_paso: { type: 'string', description: 'Acción procesal pendiente más urgente' },
            notas: { type: 'string', description: 'Información adicional relevante: unidad penitenciaria, vencimiento de plazos, contactos' },
        },
        required: ['numero_expediente'],
    },
}

const TOOL_OBTENER_BRIEF = {
    name: 'obtener_brief_expediente',
    description: `Recupera el brief guardado de un expediente para retomar el trabajo sin releer PDFs.
Llamar al inicio de cualquier sesión de trabajo con una causa conocida.`,
    inputSchema: {
        type: 'object',
        properties: {
            numero_expediente: {
                type: 'string',
                description: 'Número de expediente a recuperar',
            },
        },
        required: ['numero_expediente'],
    },
}

// ─── Handlers de herramientas ───────────────────────────────────────────────

async function ejecutarGuardarBrief(args: Record<string, string>): Promise<string> {
    const { numero_expediente, ...resto } = args
    if (!numero_expediente) return 'Error: numero_expediente es requerido.'

    const datos = {
        nombre_imputado:      resto.nombre_imputado      || null,
        condena_o_situacion:  resto.condena_o_situacion  || null,
        delito:               resto.delito               || null,
        etapa_procesal:       resto.etapa_procesal       || null,
        defensor:             resto.defensor             || null,
        situacion_actual:     resto.situacion_actual     || null,
        obstaculo_central:    resto.obstaculo_central    || null,
        proximo_paso:         resto.proximo_paso         || null,
        notas:                resto.notas                || null,
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase.rpc('upsert_brief_expediente', {
        p_numero_expediente: numero_expediente,
        p_datos: datos,
    })

    if (error) return `Error al guardar el brief: ${error.message}`

    const fechaSesion = new Date(data.ultima_sesion).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    return `✅ Brief guardado para expediente **${numero_expediente}**\nÚltima sesión registrada: ${fechaSesion}\n\nEn la próxima sesión, usá \`obtener_brief_expediente\` con este número para retomar sin releer los documentos.`
}

async function ejecutarObtenerBrief(args: Record<string, string>): Promise<string> {
    const { numero_expediente } = args
    if (!numero_expediente) return 'Error: numero_expediente es requerido.'

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
        .from('briefs_expediente')
        .select('*')
        .eq('numero_expediente', numero_expediente)
        .maybeSingle()

    if (error) return `Error al recuperar el brief: ${error.message}`
    if (!data) return `No se encontró brief guardado para el expediente "${numero_expediente}". Si es la primera sesión con esta causa, trabajá normalmente y guardá el brief al finalizar.`

    const d = data.datos as Record<string, string | null>
    const fechaSesion = new Date(data.ultima_sesion).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })

    const campos = [
        d.nombre_imputado     ? `**Imputado/Condenado:** ${d.nombre_imputado}` : '',
        d.condena_o_situacion ? `**Condena/Situación:** ${d.condena_o_situacion}` : '',
        d.delito              ? `**Delito:** ${d.delito}` : '',
        d.etapa_procesal      ? `**Etapa procesal:** ${d.etapa_procesal}` : '',
        d.defensor            ? `**Defensor:** ${d.defensor}` : '',
        d.situacion_actual    ? `**Situación actual:** ${d.situacion_actual}` : '',
        d.obstaculo_central   ? `**Obstáculo central:** ${d.obstaculo_central}` : '',
        d.proximo_paso        ? `**Próximo paso:** ${d.proximo_paso}` : '',
        d.notas               ? `**Notas:** ${d.notas}` : '',
    ].filter(Boolean).join('\n')

    return `## Brief — Expediente ${numero_expediente}\n*Última sesión: ${fechaSesion}*\n\n${campos}`
}

async function ejecutarAnalizarCaso(args: Record<string, string>): Promise<string> {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/analizar-caso`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
            hechos:               args.hechos,
            etapa_procesal:       args.etapa_procesal,
            prueba_acusacion:     args.prueba_acusacion,
            pretension_defensiva: args.pretension_defensiva,
            tipo_penal:           args.tipo_penal,
            documentacion_caso:   args.documentacion_caso,
        }),
    })

    const data = await resp.json()

    if (!data.success) {
        return `**Análisis rechazado**\n\nFase: ${data.fase_rechazo}\nMotivo: ${data.fundamento}\n${data.recomendacion ? `\nRecomendación: ${data.recomendacion}` : ''}`
    }

    const d = data.data
    const status = data.status === 'limited' ? '⚠️ ANÁLISIS CON LIMITACIONES' : '✅ ANÁLISIS COMPLETADO'

    return `${status} — ${d.numero_informe}

## Encuadre Procesal
${d.encuadre_procesal}

## Análisis de Prueba de Cargo
${d.analisis_prueba_cargo}

## Nulidades y Vicios Procesales
${d.nulidades_y_vicios}

## Contraargumentación Defensiva
${d.contraargumentacion}

## Conclusión Defensiva
${d.conclusion_defensiva}

${d.limitaciones ? `## Limitaciones\n${d.limitaciones}` : ''}
${data.advertencias?.length ? `\n⚠️ Advertencias: ${data.advertencias.join(' | ')}` : ''}

---
*Criterios jurisprudenciales utilizados: ${data.meta.criterios_utilizados} | Pipeline: ${data.meta.pipeline_version}*
*Este análisis es un insumo técnico. La validación y decisión final corresponde al profesional actuante.*`
}

async function ejecutarBuscarJurisprudencia(args: Record<string, string>): Promise<string> {
    // Capa 1: si hay contexto de causa, construir query contextualizado.
    // Pretension defensiva y hechos clave al frente — señal semántica más fuerte.
    const queryEmbedding = [
        args.pretension_defensiva ? `Objetivo defensivo: ${args.pretension_defensiva}` : '',
        args.consulta,
        args.hechos_clave         ? `Hechos: ${args.hechos_clave.slice(0, 300)}` : '',
    ].filter(Boolean).join('\n')

    // Generar embedding de la consulta via OpenAI
    const embeddingResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            input: queryEmbedding,
            model: 'text-embedding-ada-002',
        }),
    })

    const embeddingData = await embeddingResp.json()
    const embedding = embeddingData.data?.[0]?.embedding

    if (!embedding) {
        return 'Error al generar el embedding de búsqueda. Intente nuevamente.'
    }

    // Buscar en pgvector
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: criterios, error } = await supabase.rpc('buscar_criterios', {
        query_embedding: embedding,
        match_count: 5,
        filter_alcance: 'criterios_generales',
        filter_fuero: 'penal',   // corpus penal únicamente
        ...(args.instituto ? { filter_instituto: args.instituto } : {}),
    })

    if (error || !criterios?.length) {
        return `No se encontraron criterios jurisprudenciales para: "${args.consulta}". Probá con otros términos o ampliá la consulta.`
    }

    const resultados = criterios.map((c: Record<string, unknown>, i: number) => {
        const data = c.data as Record<string, unknown> | null
        const fuente = data?.fuente as Record<string, string> | null
        const fuenteTexto = fuente?.norma || fuente?.jurisprudencia_referente || ''
        return `### ${i + 1}. ${c.criterio || c.instituto || 'Criterio'}\n${c.regla_general || ''}\n${fuenteTexto ? `*Fuente: ${fuenteTexto}*` : ''}`
    }).join('\n\n')

    return `## Jurisprudencia encontrada para: "${args.consulta}"\n\n${resultados}\n\n---\n*Corpus: Alcance Legal Penal — CPP PBA verificado*`
}

// ─── Dispatcher de tools/call ───────────────────────────────────────────────

async function handleToolCall(params: { name: string; arguments: Record<string, string> }) {
    const { name, arguments: args } = params

    try {
        let text: string
        if (name === 'analizar_caso') {
            text = await ejecutarAnalizarCaso(args)
        } else if (name === 'buscar_jurisprudencia') {
            text = await ejecutarBuscarJurisprudencia(args)
        } else if (name === 'guardar_brief_expediente') {
            text = await ejecutarGuardarBrief(args)
        } else if (name === 'obtener_brief_expediente') {
            text = await ejecutarObtenerBrief(args)
        } else {
            return { isError: true, content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }] }
        }
        return { content: [{ type: 'text', text }] }
    } catch (err) {
        console.error('[MCP] Error en tool call:', err)
        return { isError: true, content: [{ type: 'text', text: 'Error interno al ejecutar la herramienta. Intente nuevamente.' }] }
    }
}

// ─── JSON-RPC helpers ───────────────────────────────────────────────────────

function jsonResponse(id: unknown, result: unknown) {
    return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

function jsonError(id: unknown, code: number, message: string) {
    return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

// ─── Servidor MCP ───────────────────────────────────────────────────────────

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return jsonError(null, -32700, 'Solo se aceptan solicitudes POST')
    }

    // Autenticación — excepto para initialize (handshake inicial del protocolo MCP)
    let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown }
    try {
        body = await req.json()
    } catch {
        return jsonError(null, -32700, 'JSON inválido')
    }

    const skipAuth = body.method === 'initialize' || body.method === 'notifications/initialized'
    if (!skipAuth) {
        const { ok, clientId } = validateAuth(req)
        if (!ok) {
            return jsonError(body.id, -32001, 'No autorizado. Se requiere Bearer token válido.')
        }
        if (!checkMcpRateLimit(clientId)) {
            return jsonError(body.id, -32002, 'Límite de solicitudes alcanzado. Máximo 30 por minuto.')
        }
    }

    const { method, params, id } = body

    switch (method) {
        case 'initialize':
            return jsonResponse(id, {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'alcance-legal-penal', version: '1.0.0' },
            })

        case 'notifications/initialized':
            return new Response(null, { status: 204, headers: corsHeaders })

        case 'tools/list':
            return jsonResponse(id, {
                tools: [TOOL_ANALIZAR_CASO, TOOL_BUSCAR_JURISPRUDENCIA, TOOL_GUARDAR_BRIEF, TOOL_OBTENER_BRIEF],
            })

        case 'tools/call':
            return jsonResponse(id, await handleToolCall(params as { name: string; arguments: Record<string, string> }))

        default:
            return jsonError(id, -32601, `Método no soportado: ${method}`)
    }
})
