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
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY           = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
Útil para encontrar precedentes de la SCBA y CSJN aplicables a un instituto procesal específico,
antes o después de analizar una causa.`,
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
        },
        required: ['consulta'],
    },
}

// ─── Handlers de herramientas ───────────────────────────────────────────────

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
    // Generar embedding de la consulta via OpenAI
    const embeddingResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            input: args.consulta,
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
        ...(args.instituto ? { filter_instituto: args.instituto } : {}),
    })

    if (error || !criterios?.length) {
        return `No se encontraron criterios jurisprudenciales para: "${args.consulta}". Probá con otros términos o ampliá la consulta.`
    }

    const resultados = criterios.map((c: Record<string, string>, i: number) =>
        `### ${i + 1}. ${c.nombre || c.instituto || 'Criterio'}\n${c.contenido || c.texto || ''}\n${c.fuente ? `*Fuente: ${c.fuente}*` : ''}`
    ).join('\n\n')

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
        } else {
            return { isError: true, content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }] }
        }
        return { content: [{ type: 'text', text }] }
    } catch (err) {
        return { isError: true, content: [{ type: 'text', text: `Error interno: ${err instanceof Error ? err.message : String(err)}` }] }
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

    let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown }
    try {
        body = await req.json()
    } catch {
        return jsonError(null, -32700, 'JSON inválido')
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
                tools: [TOOL_ANALIZAR_CASO, TOOL_BUSCAR_JURISPRUDENCIA],
            })

        case 'tools/call':
            return jsonResponse(id, await handleToolCall(params as { name: string; arguments: Record<string, string> }))

        default:
            return jsonError(id, -32601, `Método no soportado: ${method}`)
    }
})
