/**
 * Supabase Edge Function: POST /mercadopago-webhook
 *
 * Mercado Pago avisa acá cada alta, cambio de estado y cobro mensual de una
 * suscripción. La función le pregunta a MP el estado real, lo guarda en
 * `suscripciones_mp` y recalcula el plan de la cuenta con recalcular_plan().
 *
 * Portado del SaaS de Criterio Térmico, con sus tres arreglos de producción:
 * firma HMAC con el manifest real de MP, 200 a los avisos con referencia rota
 * (para que MP no reintente para siempre) y el plan recalculado desde la tabla.
 *
 * SECRETS: MP_ACCESS_TOKEN · MP_WEBHOOK_SECRET (la clave del webhook en el panel de MP)
 *
 * CONFIGURAR EN MP (panel de la aplicación de ALP → Webhooks):
 *   URL: https://nclpzmyjjmglpjalmrri.supabase.co/functions/v1/mercadopago-webhook
 *   Eventos: «Planes y suscripciones» → subscription_preapproval Y
 *            subscription_authorized_payment. Los DOS: con sólo el primero, a
 *            un abogado al que le rebota la tarjeta el segundo mes no se le
 *            entera nadie hasta que MP dé la suscripción por vencida.
 *
 *   ⚠ Va en la aplicación PROPIA de ALP en MP. Guardar la configuración de
 *     webhooks emite una clave secreta nueva y descarta la anterior: hacerlo en
 *     una app de Criterio Térmico le rompe el cobro a esa app.
 *
 * 🔴 DESPLEGAR SIN VERIFICACIÓN DE JWT (ya declarado en supabase/config.toml):
 *     supabase functions deploy mercadopago-webhook --no-verify-jwt
 *   MP no manda JWT. Con la verificación puesta, el gateway rechaza cada aviso
 *   con 401 antes de ejecutar este archivo y el plan nunca se activa.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firmaValida } from '../_shared/firma-mp.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLANES_PAGOS = new Set(['basico', 'profesional', 'estudio'])

// El user_id del external_reference va a una columna uuid: cualquier otro
// texto hacía reventar el upsert con 22P02 (visto en CT el 2026-09-08).
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Mercado Pago ──────────────────────────────────────────────────────────────

async function mpGet(ruta: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(`https://api.mercadopago.com${ruta}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!res.ok) {
        console.error(`[WEBHOOK] MP ${ruta} devolvió ${res.status}`)
        return null
    }
    return await res.json()
}

/**
 * Le vuelve a preguntar a MP el estado de la suscripción y deja la base igual.
 * No se deduce nada del cuerpo del aviso: llega duplicado, tarde o
 * desordenado. El aviso sólo dice QUÉ mirar; el estado lo dice MP.
 */
async function sincronizar(
    supabase: SupabaseClient,
    preapprovalId: string,
    pago: { fecha: string | null; estado: string | null } | null,
): Promise<Response> {
    const suscripcion = await mpGet(`/preapproval/${preapprovalId}`)
    // 500 a propósito: MP reintenta, y un fallo de red no puede quedar como si
    // la suscripción no existiera.
    if (!suscripcion) return new Response('MP error', { status: 500 })

    const ref = String(suscripcion.external_reference ?? '')
    const [userId, plan] = ref.split('|')

    // 200 aunque esté mal: una referencia rota no se arregla reintentando, y MP
    // reintenta todo lo que no sea 200/201. Se descarta dejando rastro.
    if (!RE_UUID.test(userId ?? '') || !PLANES_PAGOS.has(plan ?? '')) {
        console.error(`[WEBHOOK] external_reference inválido, descartado: "${ref}" (preapproval ${preapprovalId})`)
        return new Response('OK', { status: 200 })
    }

    const estado = String(suscripcion.status ?? 'unknown')
    const recurrente = (suscripcion.auto_recurring ?? {}) as Record<string, unknown>

    const fila: Record<string, unknown> = {
        preapproval_id: preapprovalId,
        user_id: userId,
        plan,
        estado,
        monto: recurrente.transaction_amount ?? null,
        moneda: recurrente.currency_id ?? null,
        proximo_cobro_at: suscripcion.next_payment_date ?? null,
        actualizada_at: new Date().toISOString(),
    }
    // Un cambio de estado no puede borrar la fecha del último pago.
    if (pago) {
        fila.ultimo_pago_at = pago.fecha
        fila.ultimo_pago_estado = pago.estado
    }

    const { error } = await supabase.from('suscripciones_mp').upsert(fila, { onConflict: 'preapproval_id' })
    if (error) {
        console.error('[WEBHOOK] Error guardando la suscripción:', error.message)
        return new Response('DB error', { status: 500 })
    }

    const { data: planFinal, error: errorPlan } = await supabase.rpc('recalcular_plan', { p_user_id: userId })
    if (errorPlan) {
        console.error('[WEBHOOK] Error recalculando el plan:', errorPlan.message)
        return new Response('DB error', { status: 500 })
    }

    console.log(
        `[WEBHOOK] ${preapprovalId} → MP: ${estado}` +
        (pago ? ` · cobro ${pago.estado}` : '') +
        ` · cuenta ${userId} queda en: ${planFinal}`,
    )
    return new Response('OK', { status: 200 })
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    if (!MP_ACCESS_TOKEN || !MP_WEBHOOK_SECRET || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[WEBHOOK] Faltan secrets: MP_ACCESS_TOKEN / MP_WEBHOOK_SECRET / SUPABASE_SERVICE_ROLE_KEY')
        return new Response('Configuration error', { status: 500 })
    }

    const dataIdDelQuery = new URL(req.url).searchParams.get('data.id')
    const valida = await firmaValida(
        MP_WEBHOOK_SECRET,
        req.headers.get('x-signature') ?? '',
        req.headers.get('x-request-id'),
        dataIdDelQuery,
    )
    if (!valida) {
        console.error('[WEBHOOK] Firma inválida — aviso rechazado')
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const { type, data } = await req.json()
        const id = String(data?.id ?? dataIdDelQuery ?? '')
        if (!id) {
            console.error('[WEBHOOK] Aviso sin id, descartado')
            return new Response('OK', { status: 200 })
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Alta de la suscripción y cada cambio de estado.
        if (type === 'subscription_preapproval') {
            return await sincronizar(supabase, id, null)
        }

        // Cada cobro mensual. Trae el id de la FACTURA, no el de la suscripción.
        if (type === 'subscription_authorized_payment') {
            const factura = await mpGet(`/authorized_payments/${id}`)
            if (!factura) return new Response('MP error', { status: 500 })

            const preapprovalId = String(factura.preapproval_id ?? '')
            if (!preapprovalId) {
                console.error('[WEBHOOK] Factura sin preapproval_id, descartada:', id)
                return new Response('OK', { status: 200 })
            }

            const detalle = (factura.payment ?? {}) as Record<string, unknown>
            return await sincronizar(supabase, preapprovalId, {
                fecha: (factura.date_created as string) ?? null,
                estado: (detalle.status as string) ?? (factura.status as string) ?? null,
            })
        }

        // Cualquier otro tópico: OK para que MP no reintente.
        return new Response('OK', { status: 200 })

    } catch (e) {
        console.error('[WEBHOOK] Error inesperado:', (e as Error).message)
        return new Response('Internal error', { status: 500 })
    }
})
