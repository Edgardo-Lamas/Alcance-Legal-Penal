/**
 * Supabase Edge Function: POST /redactar-escrito
 *
 * Alcance Legal Penal — Defensa Penal PBA
 * Genera un borrador de escrito judicial penal:
 *   - Excarcelación / Morigeración PP
 *   - Apelación de Prisión Preventiva
 *   - Planteo de Nulidad Procesal
 *   - Hábeas Corpus
 *   - Solicitud de Sobreseimiento
 *   - Recurso de Casación Penal
 *
 * El borrador es editable y exportable a Word (.docx).
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

interface RedactarRequest {
    tipo_escrito: string
    nombre_imputado: string
    causa_numero?: string
    hechos_relevantes: string
    pretension_defensiva: string
    fundamentos_extra?: string
    incluir_citas_scba: boolean
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseJsonSafe(raw: string): unknown {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
}

function generarNumeroRedaccion(): string {
    const year = new Date().getFullYear()
    const seq = String(Date.now()).slice(-6)
    return `ALC-RED-${year}-${seq}`
}

const TIPO_LABELS: Record<string, string> = {
    excarcelacion:    'Excarcelación / Morigeración de Prisión Preventiva',
    apelacion_pp:     'Recurso de Apelación — Prisión Preventiva',
    nulidad:          'Planteo de Nulidad Procesal',
    habeas_corpus:    'Acción de Hábeas Corpus',
    sobreseimiento:   'Solicitud de Sobreseimiento',
    recurso_casacion: 'Recurso de Casación Penal',
}

// ─── SYSTEM PROMPTS POR TIPO ──────────────────────────────────────────────────

function getSystemPrompt(tipoEscrito: string): string {
    const base = `Sos un abogado defensor penal experto en CPP PBA (Ley 11.922) y CN/CADH.
Tu función es redactar escritos judiciales de defensa en causas penales de la Provincia de Buenos Aires.
Redactás siempre desde la perspectiva de la defensa. Nunca desde la acusación.
Usás el lenguaje forense correcto para los tribunales bonaerenses.

## REGLAS DE REDACCIÓN
- Encabezado formal: "Sr./Sra. [Juez/Jueza/Tribunal]:" según corresponda
- Identificación del letrado con campos [COMPLETAR] donde faltan datos
- Estructura: OBJETO, HECHOS Y ANTECEDENTES, DERECHO, PETITORIO
- Citás artículos del CPP PBA con su número exacto
- Usás el tuteo forense: "V.S.", "V.E.", "a V.S. respetuosamente digo"
- Las secciones que necesitan datos del caso van como [COMPLETAR: descripción]
- El escrito debe ser completo y presentable con solo completar los datos faltantes

## FORMATO DE RESPUESTA (JSON obligatorio)
{
  "contenido": "texto completo del escrito judicial con saltos de línea \\n",
  "secciones_pendientes": [
    {
      "seccion": "nombre de la sección",
      "motivo": "qué necesita completar el letrado",
      "criticidad": "alta|media|baja"
    }
  ]
}

Incluí en secciones_pendientes SOLO las que tienen [COMPLETAR] en el texto.
El texto debe estar en el campo "contenido" como string con \\n para saltos de línea.`

    const especifico: Record<string, string> = {
        excarcelacion: `
## EXCARCELACIÓN / MORIGERACIÓN PP
Artículos clave: art. 169 CPP PBA (excarcelación), art. 189 CPP PBA (caución), art. 157 CPP PBA (PP).
Argumentos que debés incluir:
- Los peligros procesales del art. 157 CPP PBA (fuga y entorpecimiento) no se dan en el caso
- El arraigo del imputado (domicilio fijo, trabajo, familia)
- Ausencia de antecedentes o su irrelevancia para el riesgo procesal
- El plazo de la PP y su razonabilidad
- Propuesta de caución real o personal concreta`,
        apelacion_pp: `
## APELACIÓN DE PRISIÓN PREVENTIVA
Artículos clave: art. 157 CPP PBA (PP), art. 439 CPP PBA (apelación), art. 163 CPP PBA (cese PP).
Argumentos:
- Ausencia de alguno de los presupuestos materiales (fumus delicti/periculum in mora)
- Plazo irrazonable de la prisión preventiva (CADH art. 7.5)
- Ausencia de peligros procesales verificados y concretos
- Medidas alternativas (art. 159 CPP PBA) como alternativa a la PP`,
        nulidad: `
## NULIDAD PROCESAL
Artículos clave: arts. 201-210 CPP PBA (nulidades), art. 211 CPP PBA (prueba ilícita).
Nulidades absolutas: no requieren protesta previa, son saneable de oficio (art. 202 CPP PBA).
Argumentos:
- Vicio específico del acto procesal cuestionado (cómo se obtuvo o incorporó la prueba)
- Norma violada y su carácter de garantía constitucional
- Teoría del árbol envenenado: exclusión de toda prueba derivada (art. 211 CPP PBA)
- Si es allanamiento: art. 219 CPP PBA + CN art. 18`,
        habeas_corpus: `
## HÁBEAS CORPUS
Marco normativo: Ley 23.098 y art. 18 CN (NUNCA art. 405 CPP PBA que fue derogado).
Tipos: hábeas corpus reparador, preventivo, correctivo, restringido.
Argumentos:
- Privación ilegítima de libertad o amenaza cierta e inminente
- Ilegalidad del acto que motiva la privación
- Urgencia que justifica la vía (art. 3 Ley 23.098)
- Si hay detención: ausencia de orden judicial o vencimiento de plazos`,
        sobreseimiento: `
## SOBRESEIMIENTO
Artículos clave: art. 323 CPP PBA (causales), art. 334 CPP PBA (sobreseimiento en juicio).
Causales del art. 323: inc.1 (atipicidad), inc. 2 (justificación/inculpabilidad), inc. 3 (insuficiencia probatoria), inc. 4 (extinción de la acción), inc. 5 (ausencia de delito).
Argumentos:
- Causal específica que corresponde al caso
- Fundamento normativo y fáctico de cada elemento
- Por qué no puede probarse lo contrario en un eventual juicio oral`,
        recurso_casacion: `
## RECURSO DE CASACIÓN PENAL
Marco: arts. 448-467 CPP PBA, Ley 12.059 (Sala Penal SCBA).
Motivos de casación: inobservancia o errónea aplicación de la ley penal (art. 448 inc. 1) / inobservancia de normas procesales que ocasionen nulidad (art. 448 inc. 2).
Argumentos:
- Errónea interpretación del tipo penal o de las garantías constitucionales
- Violación a reglas de valoración de la prueba (in dubio pro reo)
- Arbitrariedad de la sentencia (doctrina CSJN)
- Plazo: 20 días hábiles desde notificación (art. 450 CPP PBA)`,
    }

    return base + (especifico[tipoEscrito] || '')
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

        const body: RedactarRequest = await req.json()

        if (!body.tipo_escrito) {
            return new Response(JSON.stringify({
                success: false,
                fundamento: 'Seleccione el tipo de escrito.'
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        if (!body.nombre_imputado?.trim()) {
            return new Response(JSON.stringify({
                success: false,
                fundamento: 'El nombre del imputado es requerido.'
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        if (!body.hechos_relevantes || body.hechos_relevantes.trim().length < 100) {
            return new Response(JSON.stringify({
                success: false,
                fundamento: 'Describa los hechos relevantes (mínimo 100 caracteres).'
            }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
        }

        const tipoLabel = TIPO_LABELS[body.tipo_escrito] || body.tipo_escrito

        const prompt =
            `Redactá un escrito judicial de **${tipoLabel}** con los siguientes datos:\n\n` +
            `**Imputado/a:** ${body.nombre_imputado}\n` +
            (body.causa_numero ? `**N° de causa:** ${body.causa_numero}\n` : '') +
            `\n**HECHOS Y ANTECEDENTES:**\n${body.hechos_relevantes}\n\n` +
            `**PRETENSIÓN DEFENSIVA:**\n${body.pretension_defensiva}\n` +
            (body.fundamentos_extra ? `\n**FUNDAMENTOS ADICIONALES A INCLUIR:**\n${body.fundamentos_extra}\n` : '') +
            (body.incluir_citas_scba ? '\n**Incluí jurisprudencia relevante del SCBA y/o CSJN en la sección de DERECHO.**\n' : '') +
            `\nRespondé SOLO con el JSON especificado. El escrito debe estar listo para editar y presentar.`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 5000,
                system: getSystemPrompt(body.tipo_escrito),
                messages: [{ role: 'user', content: prompt }]
            }),
        })

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${await response.text()}`)
        }

        const llmData = await response.json()
        const parsed = parseJsonSafe(llmData.content[0].text) as {
            contenido: string
            secciones_pendientes: Array<{ seccion: string; motivo: string; criticidad: string }>
        }

        const numeroInforme = generarNumeroRedaccion()

        return new Response(JSON.stringify({
            success: true,
            data: {
                numero_informe: numeroInforme,
                fecha_emision: new Date().toLocaleDateString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }),
                estado: 'BORRADOR ASISTIDO',
                estado_detalle: 'Documento de trabajo — NO PRESENTAR sin revisión profesional',
                tipo_escrito: tipoLabel,
                contenido: parsed.contenido || '',
                secciones_pendientes: parsed.secciones_pendientes || [],
                advertencias: {
                    principal: 'ADVERTENCIA CRÍTICA: Este documento es un BORRADOR DE TRABAJO generado por asistencia automatizada. Su presentación judicial sin revisión profesional completa del letrado constituye ejercicio inadecuado de la profesión.',
                    items: [
                        'El letrado firmante asume responsabilidad exclusiva por el contenido presentado.',
                        'Verificar datos del imputado, juzgado y números de expediente antes de cualquier uso.',
                        'Las citas normativas deben validarse contra el CPP PBA y CP vigentes.',
                        'El estilo y estructura pueden requerir ajustes según la práctica del juzgado/tribunal.'
                    ]
                }
            }
        }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('[redactar-escrito] Error:', error)
        return new Response(JSON.stringify({
            success: false,
            fundamento: error instanceof Error ? error.message : 'Error interno del servidor'
        }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
})
