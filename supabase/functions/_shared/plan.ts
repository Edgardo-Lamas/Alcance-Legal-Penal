/**
 * Freno de plan para redactar-escrito y auditar-estrategia (migración 013).
 *
 * Esas dos funciones todavía no consumen cupo: qué recurso descuentan es una
 * decisión pendiente. Mientras el alta fue manual eso era un agujero acotado;
 * desde que cualquiera crea su cuenta gratis con 3 análisis de prueba, dejaba
 * escritos y auditorías SIN TOPE para cualquiera. Así que con la cuenta en
 * prueba quedan cerradas, y con un plan pago siguen como estaban.
 *
 * FAIL-CLOSED, igual que la cuota: si no se puede leer el plan, se rechaza.
 * Los callers internos (service role) no son cuentas de abogado y pasan.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { esCuentaDeAbogado, planDeCuenta } from './cuotas.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

/**
 * Devuelve la respuesta de rechazo si la cuenta no puede usar la función, o
 * null si puede seguir.
 */
export async function rechazoSiNoTienePlan(
    userId: string | null,
    autenticado: boolean,
    cors: Record<string, string>,
    accion: string,
): Promise<Response | null> {
    if (!esCuentaDeAbogado(userId, autenticado)) return null

    const plan = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? await planDeCuenta(createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY), userId!)
        : null

    if (plan === null) {
        return new Response(JSON.stringify({
            success: false,
            codigo: 'PLAN_NO_VERIFICADO',
            fundamento: 'No se pudo verificar tu plan en este momento. Intentá nuevamente en unos minutos.',
        }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (plan === 'prueba') {
        return new Response(JSON.stringify({
            success: false,
            codigo: 'REQUIERE_SUSCRIPCION',
            fundamento: `Para ${accion} necesitás un plan. La prueba gratuita incluye el análisis de causas; ` +
                'elegí un plan en la página de Planes para usar todas las herramientas.',
        }), { status: 402, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    return null
}
