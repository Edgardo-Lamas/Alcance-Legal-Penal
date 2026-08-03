/**
 * Cuotas por plan — cliente de la función SQL consumir_cuota() (migración 010).
 *
 * Un consumo = una llamada. La función SQL hace el chequeo y el descuento en la
 * misma transacción, así que no hay ventana para que dos pedidos simultáneos
 * pasen el mismo tope.
 *
 * Orden de cobro: primero la cuota del abono del mes; recién cuando se agota,
 * los créditos comprados aparte.
 *
 * FAIL-CLOSED a propósito: si la función SQL no responde, se rechaza. Es lo
 * contrario del rate limit por minuto (que falla abierto), porque acá lo que
 * está en juego es plata: un error de base no puede habilitar uso ilimitado.
 */

// deno-lint-ignore no-explicit-any
type SupabaseSvc = any

export type Recurso = 'analisis' | 'consultas'

export interface ResultadoCuota {
    permitido: boolean
    plan: string
    usado: number
    limite: number
    creditos: number
    uso_credito: boolean
    /** true si el rechazo viene de un fallo de infraestructura, no del tope */
    error?: boolean
}

/**
 * Los callers internos (mcp-server vía service role) no son cuentas de abogado
 * y no tienen fila en `suscripciones`: se identifican con un string fijo en vez
 * de un UUID. No se les cobra cuota.
 */
export function esCuentaDeAbogado(userId: string | null, autenticado: boolean): boolean {
    if (!autenticado || !userId) return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
}

export async function consumirCuota(
    supabase: SupabaseSvc,
    userId: string,
    recurso: Recurso,
): Promise<ResultadoCuota> {
    try {
        const { data, error } = await supabase.rpc('consumir_cuota', {
            p_user_id: userId,
            p_recurso: recurso,
        })

        if (error || !data) {
            console.error(`[CUOTA] consumir_cuota falló (${recurso}):`, error?.message ?? 'sin datos')
            return { permitido: false, plan: 'desconocido', usado: 0, limite: 0, creditos: 0, uso_credito: false, error: true }
        }

        return data as ResultadoCuota
    } catch (err) {
        console.error(`[CUOTA] excepción en consumir_cuota (${recurso}):`, (err as Error).message)
        return { permitido: false, plan: 'desconocido', usado: 0, limite: 0, creditos: 0, uso_credito: false, error: true }
    }
}

/** Mensaje para el abogado. Distingue tope alcanzado de falla del sistema. */
export function mensajeCuotaAgotada(r: ResultadoCuota, recurso: Recurso): string {
    if (r.error) {
        return 'No se pudo verificar tu plan en este momento. Intentá nuevamente en unos minutos.'
    }
    const unidad = recurso === 'analisis' ? 'análisis' : 'consultas al Consultor'
    return `Alcanzaste el límite de tu plan: ${r.usado} de ${r.limite} ${unidad} este mes. ` +
        `El cupo se renueva el día 1. Si necesitás más para un caso puntual, podés adquirir un paquete adicional.`
}
