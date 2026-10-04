/**
 * Verificación de la firma de los avisos de Mercado Pago.
 * Aparte del webhook para poder testearla sin levantar el servidor
 * (firma-mp.test.ts).
 */

// ── Firma HMAC-SHA256 ─────────────────────────────────────────────────────────
// MP manda `x-signature: ts=<ts>,v1=<hmac>` y firma, textual:
//     id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// con `data.id` sacado del QUERY de la URL, no del cuerpo. La parte que falta
// se omite junto con su clave.
export function armarManifest(dataId: string | null, requestId: string | null, ts: string): string {
    let manifest = ''
    if (dataId) manifest += `id:${dataId};`
    if (requestId) manifest += `request-id:${requestId};`
    if (ts) manifest += `ts:${ts};`
    return manifest
}

// Recorre siempre los dos strings enteros: comparar con === le dice a quien
// mida los tiempos cuántos caracteres acertó.
function comparacionSegura(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diferencia = 0
    for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diferencia === 0
}

export async function firmaValida(
    secreto: string,
    signature: string,
    requestId: string | null,
    dataId: string | null,
): Promise<boolean> {
    if (!secreto) return false

    const parts: Record<string, string> = {}
    for (const trozo of signature.split(',')) {
        const [clave, valor] = trozo.split('=')
        if (clave && valor) parts[clave.trim()] = valor.trim()
    }
    const { ts, v1 } = parts
    if (!ts || !v1) return false

    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(secreto),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const firma = await crypto.subtle.sign(
        'HMAC', key, new TextEncoder().encode(armarManifest(dataId, requestId, ts)),
    )
    const esperado = Array.from(new Uint8Array(firma)).map(b => b.toString(16).padStart(2, '0')).join('')
    return comparacionSegura(esperado, v1)
}
