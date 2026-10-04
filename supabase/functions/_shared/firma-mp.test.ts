/**
 * deno test supabase/functions/_shared/firma-mp.test.ts
 *
 * Las firmas se arman acá con HMAC real, igual que las arma MP. El caso que
 * importa es el del formato viejo de CT: aceptaba sólo firmas que MP no manda,
 * así que rechazaba todos los pagos legítimos sin dar error.
 */

import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { armarManifest, firmaValida } from './firma-mp.ts'

const SECRETO = 'clave-de-prueba'

async function hmac(texto: string, secreto = SECRETO): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const firma = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto))
    return Array.from(new Uint8Array(firma)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.test('manifest con las tres partes, en el orden de MP', () => {
    assertEquals(armarManifest('123', 'req-1', '1700'), 'id:123;request-id:req-1;ts:1700;')
})

Deno.test('manifest omite la parte que falta junto con su clave', () => {
    assertEquals(armarManifest(null, 'req-1', '1700'), 'request-id:req-1;ts:1700;')
})

Deno.test('acepta una firma armada como la arma MP', async () => {
    const v1 = await hmac('id:123;request-id:req-1;ts:1700;')
    assertEquals(await firmaValida(SECRETO, `ts=1700,v1=${v1}`, 'req-1', '123'), true)
})

Deno.test('rechaza el formato viejo de CT (request-id en lugar del data.id)', async () => {
    const v1 = await hmac('id:req-1;request-date:1700;')
    assertEquals(await firmaValida(SECRETO, `ts=1700,v1=${v1}`, 'req-1', '123'), false)
})

Deno.test('rechaza la firma hecha con otra clave', async () => {
    const v1 = await hmac('id:123;request-id:req-1;ts:1700;', 'otra-clave')
    assertEquals(await firmaValida(SECRETO, `ts=1700,v1=${v1}`, 'req-1', '123'), false)
})

Deno.test('rechaza si el data.id del query no es el firmado', async () => {
    const v1 = await hmac('id:123;request-id:req-1;ts:1700;')
    assertEquals(await firmaValida(SECRETO, `ts=1700,v1=${v1}`, 'req-1', '999'), false)
})

Deno.test('rechaza cabecera vacía o sin secreto configurado', async () => {
    assertEquals(await firmaValida(SECRETO, '', 'req-1', '123'), false)
    assertEquals(await firmaValida('', 'ts=1,v1=abc', 'req-1', '123'), false)
})
