/**
 * Supabase Edge Function: POST /crear-suscripcion
 *
 * El abogado elige un plan en /precios → esta función crea la suscripción
 * mensual en Mercado Pago y devuelve el link del checkout (init_point). Cuando
 * paga, MP avisa a `mercadopago-webhook`, que le activa el plan.
 *
 * Body: { plan: 'basico' | 'profesional' | 'estudio' }
 * Headers: Authorization: Bearer <access_token del abogado>
 *
 * 🔑 El monto sale de la tabla `planes` (columna precio_ars), NUNCA del
 *    navegador. Si viajara desde el front, cualquiera se suscribía a Estudio
 *    por un peso.
 *
 * Secrets: MP_ACCESS_TOKEN · APP_URL (a dónde vuelve el abogado desde MP).
 * Portado del SaaS de Criterio Térmico (create-subscription), donde se probó
 * contra la API de MP el 2026-09-05.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verificarUsuario } from '../_shared/auth.ts'
import { esCuentaDeAbogado } from '../_shared/cuotas.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://alcance-legal-penal.vercel.app'
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'

const PLANES_PAGOS = new Set(['basico', 'profesional', 'estudio'])

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

function json(data: unknown, status: number, cors: Record<string, string>) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
    })
}

Deno.serve(async (req) => {
    const cors = getCorsHeaders(req.headers.get('origin'))

    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, cors)

    if (!MP_ACCESS_TOKEN) {
        console.error('[SUSCRIPCION] MP_ACCESS_TOKEN no configurado')
        return json({ error: 'El cobro no está disponible en este momento.' }, 503, cors)
    }

    // Sólo un abogado logueado. El anon key pasa el gateway pero no es nadie.
    const { userId, autenticado } = await verificarUsuario(req)
    if (!esCuentaDeAbogado(userId, autenticado)) {
        return json({ error: 'Iniciá sesión para suscribirte.' }, 401, cors)
    }

    try {
        const { plan } = await req.json() as { plan?: string }
        if (!plan || !PLANES_PAGOS.has(plan)) {
            return json({ error: 'Plan inválido.' }, 400, cors)
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        const { data: fila, error: errorPlan } = await supabase
            .from('planes')
            .select('nombre, precio_ars')
            .eq('plan', plan)
            .single()

        if (errorPlan || !fila?.precio_ars) {
            console.error('[SUSCRIPCION] Plan sin precio en la base:', plan, errorPlan?.message)
            return json({ error: 'El plan no tiene precio configurado.' }, 500, cors)
        }

        const { data: usuario, error: errorUsuario } = await supabase.auth.admin.getUserById(userId!)
        if (errorUsuario || !usuario?.user?.email) {
            console.error('[SUSCRIPCION] No se pudo leer el correo del usuario:', errorUsuario?.message)
            return json({ error: 'No se pudo leer tu cuenta.' }, 500, cors)
        }

        // ── Suscripción SIN plan de MP asociado, a propósito ──────────────────
        // Mandar `preapproval_plan_id` exige `card_token_id` (tarjeta tokenizada
        // en un formulario propio): MP contesta 400. El link público de un plan
        // de MP tampoco sirve porque no admite `external_reference`, y sin eso
        // el webhook no sabe a QUÉ cuenta activarle el plan. Sin plan asociado,
        // MP crea la suscripción en `pending`, devuelve el checkout y conserva
        // la referencia. (Aprendido en Criterio Térmico, 2026-09-05.)
        const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                reason: `Alcance Legal Penal · Plan ${fila.nombre}`,
                payer_email: usuario.user.email,
                back_url: `${APP_URL}/precios?suscripcion=volver`,
                external_reference: `${userId}|${plan}`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: fila.precio_ars,
                    currency_id: 'ARS',
                },
            }),
        })

        const mpData = await mpRes.json()

        if (!mpRes.ok || !mpData.init_point) {
            // El motivo viaja al front: en CT el error se tragaba y el botón no
            // hacía nada, sin ningún mensaje.
            console.error('[SUSCRIPCION] MP rechazó la suscripción:', JSON.stringify(mpData))
            return json({ error: mpData.message ?? 'Mercado Pago rechazó la suscripción.' }, 502, cors)
        }

        console.log(`[SUSCRIPCION] user=${userId} plan=${plan} preapproval=${mpData.id} (pending)`)
        return json({ init_point: mpData.init_point }, 200, cors)

    } catch (e) {
        console.error('[SUSCRIPCION] Error inesperado:', (e as Error).message)
        return json({ error: 'Error interno.' }, 500, cors)
    }
})
