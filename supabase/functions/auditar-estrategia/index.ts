/**
 * Supabase Edge Function: POST /auditar-estrategia
 *
 * Alcance Legal Penal — Defensa Penal PBA
 * Audita la estrategia defensiva de un abogado:
 *   - Detecta supuestos implícitos no validados
 *   - Identifica inconsistencias lógicas internas
 *   - Evalúa la consistencia estrategia ↔ objetivo
 *   - Señala riesgos no contemplados
 *
 * Perspectiva: SIEMPRE desde la defensa. In dubio pro reo.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'

// ─── CORS ─────────────────────────────────────────────────────────────────────

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

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || now - entry.windowStart > 60_000) {
        rateLimitMap.set(ip, { count: 1, windowStart: now })
        return true
    }
    if (entry.count >= 10) return false
    entry.count++
    return true
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuditarRequest {
    etapa_procesal: string
    tipo_delito_imputado?: string
    situacion_procesal: string
    estrategia_actual: string
    objetivo_defensivo: string
    riesgos_identificados?: string
    contexto_adicional?: string
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_AUDITOR = `Sos un experto en derecho penal argentino (CPP PBA, Ley 11.922) especializado en AUDITORÍA DE ESTRATEGIAS DEFENSIVAS.

Tu función es evaluar críticamente la estrategia de defensa que te presenta un abogado y detectar:
1. Supuestos implícitos que el abogado da por ciertos sin haberlos validado
2. Inconsistencias lógicas internas entre los componentes de la estrategia
3. Riesgos no contemplados que podrían perjudicar la defensa
4. Brechas entre la estrategia declarada y el objetivo defensivo

## REGLAS DE AUDITORÍA

- Nunca validés la estrategia sin análisis genuino
- Cada observación debe tener impacto concreto en el caso
- Las recomendaciones deben ser accionables y específicas al CPP PBA
- Evaluá la consistencia lógica: ¿la estrategia puede llevar al objetivo?
- Identificá si hay supuestos que dependen de hechos no probados o inciertos
- Detectá si hay riesgos que la estrategia ignora (testigos, prueba sobreviniente, plazos)
- Valorá si el objetivo es alcanzable con la estrategia propuesta

## VALORES DE CONSISTENCIA
- SÓLIDA: la estrategia es coherente, los supuestos están validados, el objetivo es alcanzable
- PARCIAL: hay elementos sólidos pero existen supuestos o inconsistencias que requieren corrección
- DÉBIL: la estrategia tiene problemas estructurales que la comprometen

## FORMATO DE RESPUESTA (JSON obligatorio)
{
  "consistencia": {
    "valor": "SÓLIDA|PARCIAL|DÉBIL",
    "explicacion": "2-3 párrafos evaluando la coherencia global de la estrategia",
    "advertencia": "mensaje específico de acción para el abogado"
  },
  "observaciones": [
    {
      "tipo": "supuesto_implicito|inconsistencia|riesgo_no_contemplado",
      "codigo": "OBS-001",
      "descripcion": "descripción clara del problema detectado",
      "impacto": "consecuencia concreta si el problema no se resuelve",
      "severidad": "alta|media|baja"
    }
  ],
  "recomendaciones": [
    {
      "prioridad": "alta|media|baja",
      "accion": "acción concreta y específica al CPP PBA"
    }
  ]
}

Máximo 3-5 observaciones (las más relevantes). Máximo 4 recomendaciones.
Sé directo. No repitas información. No uses jerga que el abogado no use.`

// ─── HELPER ───────────────────────────────────────────────────────────────────

function parseJsonSafe(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
}

function generarNumeroAuditoria(): string {
    const year = new Date().getFullYear()
    const seq = String(Date.now()).slice(-6)
    return `ALC-AUD-${year}-${seq}`
}

const ETAPA_LABELS: Record<string, string> = {
    ipp: 'Investigación Penal Preparatoria (IPP)',
    intermedia: 'Etapa Intermedia',
    juicio_oral: 'Juicio Oral',
    recursos: 'Recursos / Casación',
    ejecucion_pena: 'Ejecución de Pena',
}

const SITUACION_LABELS: Record<string, string> = {
    libre: 'en libertad',
    detenido: 'detenido con prisión preventiva vigente',
    domiciliaria: 'bajo detención domiciliaria',
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

serve(async (req: Request) => {
    const cors = getCorsHeaders(req.headers.get('origin'))

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: cors })
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

    if (!checkRateLimit(clientIp)) {
        return new Response(JSON.stringify({
            success: false,
            fundamento: 'Límite de solicitudes alcanzado. Máximo 10 por minuto.'
        }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    try {
        if (!ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY no configurada.')
        }

        const body: AuditarRequest = await req.json()

        if (!body.estrategia_actual || body.estrategia_actual.trim().length < 100) {
            return new Response(JSON.stringify({
                success: false,
                fundamento: 'La descripción de la estrategia es insuficiente para una auditoría rigurosa (mínimo 100 caracteres).'
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        if (!body.objetivo_defensivo || body.objetivo_defensivo.trim().length < 10) {
            return new Response(JSON.stringify({
                success: false,
                fundamento: 'Indique el objetivo defensivo concreto que persigue la estrategia.'
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        const etapaLabel = ETAPA_LABELS[body.etapa_procesal] || body.etapa_procesal
        const situacionLabel = SITUACION_LABELS[body.situacion_procesal] || body.situacion_procesal

        const prompt =
            `## CASO A AUDITAR\n\n` +
            `**Etapa procesal:** ${etapaLabel}\n` +
            `**Situación del imputado:** ${situacionLabel}\n` +
            (body.tipo_delito_imputado ? `**Delito imputado:** ${body.tipo_delito_imputado}\n` : '') +
            `\n**ESTRATEGIA DEFENSIVA PROPUESTA:**\n${body.estrategia_actual}\n\n` +
            `**OBJETIVO DEFENSIVO DECLARADO:**\n${body.objetivo_defensivo}\n` +
            (body.riesgos_identificados ? `\n**RIESGOS YA IDENTIFICADOS POR EL ABOGADO:**\n${body.riesgos_identificados}\n` : '') +
            (body.contexto_adicional ? `\n**CONTEXTO ADICIONAL:**\n${body.contexto_adicional}\n` : '') +
            `\nAuditá esta estrategia defensiva. Respondé SOLO con el JSON especificado.`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 3000,
                system: SYSTEM_PROMPT_AUDITOR,
                messages: [{ role: 'user', content: prompt }]
            }),
        })

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${await response.text()}`)
        }

        const llmData = await response.json()
        const parsed = parseJsonSafe(llmData.content[0].text) as {
            consistencia: { valor: string; explicacion: string; advertencia: string }
            observaciones: Array<{ tipo: string; codigo: string; descripcion: string; impacto: string; severidad: string }>
            recomendaciones: Array<{ prioridad: string; accion: string }>
        }

        const numeroInforme = generarNumeroAuditoria()

        return new Response(JSON.stringify({
            success: true,
            data: {
                numero_informe: numeroInforme,
                fecha_emision: new Date().toLocaleDateString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }),
                estado: 'DICTAMEN DE AUDITORÍA',
                estado_detalle: parsed.consistencia.valor === 'SÓLIDA'
                    ? 'Estrategia consistente — revisar observaciones menores'
                    : parsed.consistencia.valor === 'PARCIAL'
                        ? 'Requiere revisión de los puntos señalados'
                        : 'Estrategia requiere reformulación significativa',
                consistencia: parsed.consistencia,
                observaciones: parsed.observaciones || [],
                recomendaciones: parsed.recomendaciones || [],
                advertencias: {
                    principal: 'La auditoría evalúa consistencia lógica y detecta riesgos, no garantiza resultados procesales. La decisión final corresponde al profesional actuante.',
                    items: [
                        'Este dictamen evalúa coherencia interna, no el mérito del caso.',
                        'Supuestos no declarados pueden contener riesgos adicionales no identificados.',
                        'La validación final requiere conocimiento completo del expediente.'
                    ]
                }
            }
        }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    } catch (error) {
        // Loguear detalle; no devolver el mensaje crudo al cliente.
        console.error('[auditar-estrategia] Error:', error)
        return new Response(JSON.stringify({
            success: false,
            fundamento: 'Ocurrió un error al auditar la estrategia. Intente nuevamente en unos minutos.'
        }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
})
