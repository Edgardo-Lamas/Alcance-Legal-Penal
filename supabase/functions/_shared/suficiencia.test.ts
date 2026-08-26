/**
 * Tests del gate de suficiencia del insumo.
 *
 * Se corren con: deno test supabase/functions/_shared/suficiencia.test.ts
 *
 * Los fixtures reproducen el formato EXACTO que arma la extensión en
 * chrome-extension/sidepanel.js → runAnalysis(). Si ese formato cambia, estos
 * tests tienen que cambiar con él: el gate reconoce el índice por ese formato.
 *
 * Los dos casos de referencia son reales, del expediente
 * procesales.asp?nidCausa=283253 (incidente INC - 5354 - EJEC, Tribunal en lo
 * Criminal N°1 de La Plata, 12 actuaciones) corrido el 2026-08-07:
 *   - 000006 / 000007: índice pelado → hoy salían "INFORME APROBADO"
 *   - 000008: 8 actuaciones, 15.887 caracteres de texto → informe válido
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { CUERPO_SUFICIENTE_CHARS, evaluarSuficienciaInsumo, separarIndiceDeCuerpo } from './suficiencia.ts'

// ============================================
// FIXTURES — formato real de la extensión
// ============================================

const ACTUACIONES = [
    ['03/07/2026', 'PASE A', 'JUZGADO DE EJECUCION PENAL N°1', 'Pase a Cámara de Apelación y Garantías'],
    ['28/06/2026', 'RESOLUCION', 'TRIBUNAL EN LO CRIMINAL N°1', 'Resuelve sobre cómputo de pena'],
    ['15/06/2026', 'PRESENTACION', 'DEFENSA PARTICULAR', 'Solicita aplicación art. 7 Ley 24.390'],
    ['02/06/2026', 'OFICIO', 'SERVICIO PENITENCIARIO BONAERENSE', 'Informe de conducta y concepto'],
    ['20/05/2026', 'PROVEIDO', 'TRIBUNAL EN LO CRIMINAL N°1', 'Tiénese presente'],
    ['11/05/2026', 'INFORME CRIMINOLOGICO', 'UNIDAD 9 LA PLATA', 'Evaluación del interno'],
    ['30/04/2026', 'PRESENTACION', 'DEFENSA PARTICULAR', 'Interpone recurso de apelación'],
    ['22/04/2026', 'RESOLUCION', 'TRIBUNAL EN LO CRIMINAL N°1', 'Rechaza incidente'],
    ['10/04/2026', 'VISTA A', 'FISCALIA', 'Corre vista al Ministerio Público Fiscal'],
    ['01/04/2026', 'PRESENTACION', 'DEFENSA PARTICULAR', 'Promueve incidente de ejecución'],
    ['25/03/2026', 'PROVEIDO', 'TRIBUNAL EN LO CRIMINAL N°1', 'Formese incidente'],
    ['18/03/2026', 'PASE A', 'MESA DE ENTRADAS', 'Pase a despacho'],
]

/** Reproduce el índice tal como lo arma sidepanel.js. */
function indiceMev(n = ACTUACIONES.length): string {
    return ACTUACIONES.slice(0, n).map(([fecha, tipo, autor, detalle], i) =>
        `Actuación ${i + 1}: [${fecha}] - Tipo: ${tipo} - Autor: ${autor} - Detalle: ${detalle}`
    ).join('\n')
}

/** Reproduce el bloque de cuerpo tal como lo arma sidepanel.js. */
function bloqueTexto(tipo: string, fecha: string, texto: string): string {
    return `\n\n--- ${tipo} (${fecha}) ---\n${texto}`
}

/** Carátula autogenerada por la extensión: ~250 chars, siempre presente. */
const HECHOS_MEV =
    'Causa penal: "BARGAS JUAN ARNALDO S/ INCIDENTE DE EJECUCION" (Expediente Nro: INC - 5354 - EJEC). ' +
    'Imputado/a: BARGAS JUAN ARNALDO. Delito investigado: ABUSO SEXUAL AGRAVADO. ' +
    'Etapa: EJECUCION DE PENA. Cautelar: PRISION FIRME.'

/** Prosa judicial real: párrafos largos, alguna fecha adentro. */
const TEXTO_RESOLUCION =
    'La Plata, 28 de junio de 2026. AUTOS Y VISTOS: Para resolver en el presente incidente de ejecución ' +
    'formado en autos, del que RESULTA: Que la defensa particular del penado solicita se practique nuevo ' +
    'cómputo de pena con aplicación del artículo 7 de la Ley 24.390, en su redacción original, por resultar ' +
    'ley penal más benigna conforme el artículo 2 del Código Penal. Sostiene que el hecho por el cual su ' +
    'asistido resultó condenado data del año 2011, esto es, durante la vigencia del régimen del dos por uno, ' +
    'y que la Ley 27.362 no puede aplicarse retroactivamente en su perjuicio. Y CONSIDERANDO: Que el planteo ' +
    'debe ser rechazado. La Ley 27.362 es una norma interpretativa que se integra a la ley interpretada y ' +
    'rige desde la fecha de entrada en vigencia de esta última. Por ello, y lo dispuesto por los artículos ' +
    '493 y siguientes del Código Procesal Penal, RESUELVO: NO HACER LUGAR al pedido de nuevo cómputo. ' +
    'Regístrese, notifíquese y oportunamente archívese.'

// ============================================
// EL CASO QUE MOTIVÓ EL GATE
// ============================================

Deno.test('000006/000007 — índice pelado del MEV: se rechaza', () => {
    const r = evaluarSuficienciaInsumo({
        hechos: HECHOS_MEV,
        documentacion_caso: indiceMev(),
        prueba_acusacion: 'RESOLUCION, PRESENTACION, OFICIO, INFORME CRIMINOLOGICO, VISTA A',
    })

    assertEquals(r.nivel, 'insuficiente')
    assertEquals(r.vieneDelMev, true)
    assertEquals(r.actuacionesIndice, 12)
    assertEquals(r.charsCuerpo, 0)
})

Deno.test('000008 — mismo expediente con el texto real: pasa como suficiente', () => {
    // 8 actuaciones traídas, 15.887 chars — la corrida que encontró tres errores citables.
    const cuerpo = Array.from({ length: 8 }, (_, i) =>
        bloqueTexto(ACTUACIONES[i][1], ACTUACIONES[i][0], TEXTO_RESOLUCION.repeat(2))
    ).join('')

    const r = evaluarSuficienciaInsumo({
        hechos: HECHOS_MEV,
        documentacion_caso: indiceMev() + cuerpo,
        prueba_acusacion: 'RESOLUCION, PRESENTACION, OFICIO',
    })

    assertEquals(r.nivel, 'suficiente')
    assertEquals(r.actuacionesIndice, 12)
    // El índice no se cuenta como material analizable, aunque llegue en el mismo campo.
    assertEquals(r.charsCuerpo > 15000, true)
})

// ============================================
// EL ESCALÓN DEL MEDIO
// ============================================

Deno.test('una sola actuación real del MEV sobre doce: sale, pero como parcial', () => {
    const r = evaluarSuficienciaInsumo({
        hechos: HECHOS_MEV,
        documentacion_caso: indiceMev() + bloqueTexto('RESOLUCION', '28/06/2026', TEXTO_RESOLUCION),
    })

    assertEquals(r.nivel, 'parcial')
    assertEquals(r.charsCuerpo < CUERPO_SUFICIENTE_CHARS, true)
})

Deno.test('un "tiénese presente" no alcanza: se rechaza igual que el índice pelado', () => {
    // Traer UNA actuación no compra un informe: hay que traer contenido.
    const r = evaluarSuficienciaInsumo({
        hechos: HECHOS_MEV,
        documentacion_caso: indiceMev() + bloqueTexto('PROVEIDO', '20/05/2026',
            'Tiénese presente lo manifestado. Notifíquese. Fdo. Juez de Ejecución.'),
    })

    assertEquals(r.nivel, 'insuficiente')
})

Deno.test('la carátula que autogenera la extensión no cuenta como materia prima', () => {
    // Es el corazón del gate: ~250 caracteres de metadato del MEV que nadie
    // escribió. Contarlos como relato del abogado es lo que dejaba pasar a 000006.
    const conCaratula = evaluarSuficienciaInsumo({ hechos: HECHOS_MEV })
    const escritoPorUnHumano = evaluarSuficienciaInsumo({
        hechos: 'Se imputa a mi asistido ' + 'el hecho descripto en la acusación. '.repeat(20),
    })

    assertEquals(conCaratula.charsRelato, 0)
    assertEquals(conCaratula.nivel, 'insuficiente')
    assertEquals(escritoPorUnHumano.nivel, 'suficiente')
})

// ============================================
// CARGA MANUAL — el fallback declarado
// ============================================

Deno.test('carga manual con relato serio: suficiente (el abogado sabe qué cargó)', () => {
    const r = evaluarSuficienciaInsumo({
        hechos: 'Se imputa a mi asistido el delito de robo simple en grado de tentativa, ocurrido el 12 de marzo de 2026 en la vía pública de la localidad de Lanús. ' +
                'La imputación se sostiene exclusivamente en el reconocimiento en rueda de personas practicado el 15 de marzo, sin la presencia del defensor técnico ' +
                'y sin que se hubiera notificado previamente a esta parte, y en el testimonio único de la presunta damnificada, que en su primera declaración ' +
                'describió a un sujeto de contextura y estatura que no coinciden con las de mi asistido.',
        prueba_acusacion: 'Reconocimiento en rueda de personas del 15/03/2026 y testimonio de la damnificada.',
        pretension_defensiva: 'Nulidad del reconocimiento en rueda por violación del derecho de defensa y sobreseimiento por insuficiencia probatoria.',
    })

    assertEquals(r.nivel, 'suficiente')
    assertEquals(r.vieneDelMev, false)
})

Deno.test('carga manual mínima: se rechaza (hoy pasaba con 20 caracteres)', () => {
    // checkAdmissibility sólo exige hechos.length >= 20. Con esto salía un informe
    // completo con sello APROBADO, enteramente inventado.
    const r = evaluarSuficienciaInsumo({
        hechos: 'Robo en Lanús, marzo de 2026.',
    })

    assertEquals(r.nivel, 'insuficiente')
    assertEquals(r.vieneDelMev, false)
})

Deno.test('sin documentación pero con PDF adjunto: no se rechaza', () => {
    // El modelo lee el PDF entero. No se le devuelve el trabajo a quien SÍ
    // adjuntó el expediente sólo porque no lo transcribió en el formulario.
    const r = evaluarSuficienciaInsumo({
        hechos: 'Adjunto la resolución que rechaza el pedido.',
        documentos_pdf: [{ nombre: 'resolucion.pdf', data: 'JVBERi0x' }],
    })

    assertEquals(r.nivel, 'suficiente')
})

// ============================================
// SEPARACIÓN ÍNDICE / CUERPO
// ============================================

Deno.test('índice pegado a mano (sin el formato de la extensión) se reconoce igual', () => {
    const pegado = ACTUACIONES.map(([fecha, tipo, autor]) => `${fecha}  ${tipo}  ${autor}`).join('\n')
    const r = separarIndiceDeCuerpo(pegado)

    assertEquals(r.charsCuerpo, 0)
    assertEquals(r.actuacionesIndice, 12)
})

Deno.test('prosa judicial con fechas adentro NO se confunde con un índice', () => {
    // Guarda contra el falso positivo que más caro sale: rechazarle a un abogado
    // una resolución real porque menciona fechas.
    const r = separarIndiceDeCuerpo(TEXTO_RESOLUCION)

    assertEquals(r.actuacionesIndice, 0)
    assertEquals(r.charsCuerpo > 900, true)
    assertEquals(r.charsIndice, 0)
})

Deno.test('documentación vacía: cero de todo, sin explotar', () => {
    const r = separarIndiceDeCuerpo('')

    assertEquals(r.charsCuerpo, 0)
    assertEquals(r.charsIndice, 0)
    assertEquals(r.actuacionesIndice, 0)
})
