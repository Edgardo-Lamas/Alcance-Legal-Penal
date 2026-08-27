/**
 * Verificación de identidad del abogado — compartida entre Edge Functions.
 *
 * Existe desde el 2026-08-27, cuando se detectó que `redactar-escrito` y
 * `auditar-estrategia` NO verificaban el JWT: iban del rate limit por IP directo
 * a la llamada a Anthropic. Lo único que las cubría era la verificación del
 * gateway de Supabase, que se satisface con la ANON KEY — pública por diseño y
 * embebida en la web y en la extensión.
 *
 * 🔑 El punto que hace falta entender: un JWT válido NO es un usuario logueado.
 * El anon key es un JWT perfectamente válido, con `role: 'anon'` y sin usuario
 * adentro. Por eso no alcanza con que el gateway lo acepte: hay que preguntarle
 * a `auth.getUser()` si detrás de ese token hay una persona.
 *
 * ⚠️ `analizar-caso` y `consultor-caso` tienen su propia copia inline de esta
 * misma lógica, anterior a este módulo. Funcionan y no se tocaron para no mover
 * código de producción verificado; unificarlas es deuda menor pendiente.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export interface ResultadoAuth {
    userId: string | null
    autenticado: boolean
}

/**
 * Devuelve el user_id sólo si el JWT corresponde a un login real de abogado.
 * El anon key devuelve `autenticado: false`, que es todo el sentido de esto.
 */
export async function verificarUsuario(req: Request): Promise<ResultadoAuth> {
    const authHeader = req.headers.get('authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '').trim()

    if (!jwt || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { userId: null, autenticado: false }
    }

    // Caller interno backend → backend. El service role key nunca sale del
    // servidor, así que autentica como servicio sin pasar por auth.getUser().
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

/** Lee el flag de producción. Igual que en `analizar-caso`. */
export function requiereAuth(): boolean {
    return Deno.env.get('REQUIRE_AUTH') === 'true'
}
