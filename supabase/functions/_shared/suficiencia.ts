/**
 * Suficiencia del insumo — el tercer control del pipeline de análisis.
 *
 * Los otros dos miran otra cosa:
 *   - checkAdmissibility pregunta "¿esta consulta es de mi competencia?"
 *     (penal, PBA, con hechos mínimos). Con la carátula del MEV alcanza.
 *   - validateOutput juzga el TEXTO DE SALIDA (sesgo acusatorio, certeza
 *     excesiva). Un informe vacío pero bien redactado y prudente pasa.
 *
 * Ninguno mira la materia prima. El 2026-08-07, los informes
 * ALC-PENAL-PBA-2026-000006 y 000007 salieron con el sello "INFORME APROBADO"
 * habiendo recibido SOLO el índice de actuaciones del MEV —ni una línea del
 * expediente— y adentro proponían prescripción de la acción sobre una condena
 * firme. El mismo expediente, con el texto real de 8 actuaciones (000008), dio
 * tres errores concretos y citables.
 *
 * Sin contenido el sistema no se calla: completa con lo que suele pasar en
 * causas parecidas. Este módulo es lo que lo hace callar.
 *
 * Principio del proyecto que sostiene: el rechazo fundado es un output válido;
 * nunca improvisar.
 */

/** Lo que este módulo necesita saber de un pedido de análisis. */
export interface InsumoRequest {
    hechos?: string
    prueba_acusacion?: string
    pretension_defensiva?: string
    documentacion_caso?: string
    documentos_pdf?: unknown[]
    imagenes?: unknown[]
}

// Umbral por debajo del cual no hay materia prima y el análisis se rechaza.
//
// Calibrado contra los dos extremos reales, no elegido de arriba:
//   - 000006 (el desastre): con la carátula y el índice descontados quedan ~60
//     caracteres de sustancia. No hay nada.
//   - Un relato manual serio del abogado —delito, fecha, lugar, la prueba de
//     cargo y la teoría del caso— mide ~725 caracteres. Tiene que pasar.
// 400 cae en el medio con margen para los dos lados. Un umbral más alto le
// rebota trabajo legítimo a quien cargó el caso a mano, que es peor que dejar
// pasar un análisis flojo: el rechazo indebido lo hace desconfiar del sistema.
// Por env para poder recalibrarlo sin redeploy.
export const MIN_SUSTANCIA_CHARS = Number(Deno.env.get('MIN_SUSTANCIA_CHARS') ?? 400)

// Cuerpo de expediente por debajo del cual un análisis que SÍ vino del MEV sale
// como 'limited': el sistema tiene el listado de N actuaciones y menos de una
// actuación promedio de texto. Puede razonar la secuencia procesal, no el fondo.
export const CUERPO_SUFICIENTE_CHARS = Number(Deno.env.get('CUERPO_SUFICIENTE_CHARS') ?? 2000)

// Línea del índice que arma la extensión en sidepanel.js runAnalysis():
//   "Actuación 12: [03/07/2026] - Tipo: PASE A - Autor: ... - Detalle: ..."
// Es formato propio, así que el reconocimiento es exacto y no heurístico.
const LINEA_INDICE_MEV = /^\s*Actuaci[oó]n\s+\d+\s*:\s*\[/i

// Fecha dd/mm/aaaa — segunda señal, para índices pegados a mano por el abogado
// (copiar y pegar del listado del MEV no pasa por el formato de la extensión).
const FECHA_EN_LINEA = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/

// Carátula que autogenera la extensión para pasar el mínimo de admisibilidad:
//   Causa penal: "..." (Expediente Nro: ...). Imputado/a: ... Delito ... Etapa: ...
// Son ~250 caracteres que NO los escribió el abogado: es metadato del MEV, igual
// que el índice, y contarlos como materia prima es justamente lo que dejaba pasar
// a 000006. Un relato de hechos escrito por una persona sí cuenta.
const CARATULA_AUTOGENERADA = /^\s*Causa penal:\s*".*"\s*\(Expediente Nro:/i

export interface SuficienciaInsumo {
    nivel: 'suficiente' | 'parcial' | 'insuficiente'
    /** Caracteres de texto del expediente, ya descontado el índice. */
    charsCuerpo: number
    /** Caracteres que ocupa el índice: dice QUÉ actuaciones hay, no qué DICEN. */
    charsIndice: number
    /** Actuaciones reconocidas en el índice. */
    actuacionesIndice: number
    /** Caracteres escritos por el abogado: hechos + prueba de cargo + pretensión. */
    charsRelato: number
    /** Materia prima real sobre la que se puede razonar. */
    sustancia: number
    /** El insumo llegó por el flujo MEV (se reconoció un índice de actuaciones). */
    vieneDelMev: boolean
    fundamento: string
    recomendacion: string
}

/**
 * Separa el índice de actuaciones del cuerpo del expediente.
 *
 * El índice es el listado que se ve en el MEV: fecha, tipo, autor, detalle. Sirve
 * para razonar la secuencia procesal y nada más. El cuerpo es lo que sostiene una
 * nulidad: la firma que falta, el horario del acta, la cadena de custodia.
 */
export function separarIndiceDeCuerpo(documentacion: string): {
    charsIndice: number
    charsCuerpo: number
    actuacionesIndice: number
} {
    const lineas = documentacion.split('\n')
    let charsIndice = 0
    let charsCuerpo = 0
    let actuacionesIndice = 0

    for (const linea of lineas) {
        if (LINEA_INDICE_MEV.test(linea)) {
            charsIndice += linea.length
            actuacionesIndice++
        } else {
            charsCuerpo += linea.length
        }
    }

    // Un índice copiado y pegado a mano no pasa por el formato de la extensión,
    // pero conserva la forma: muchas líneas cortas, casi todas con fecha. La prosa
    // de un acta o una pericia no lleva fecha en 7 de cada 10 renglones.
    // Se exige que la señal sea fuerte: ante la duda se cuenta como cuerpo, porque
    // un falso rechazo le devuelve el trabajo al abogado sin motivo.
    if (actuacionesIndice === 0) {
        const utiles = lineas.filter(l => l.trim().length > 0)
        if (utiles.length >= 5) {
            const conFecha = utiles.filter(l => FECHA_EN_LINEA.test(l)).length
            const largoPromedio = utiles.reduce((acc, l) => acc + l.length, 0) / utiles.length
            if (largoPromedio < 150 && conFecha / utiles.length >= 0.7) {
                return { charsIndice: charsCuerpo, charsCuerpo: 0, actuacionesIndice: utiles.length }
            }
        }
    }

    return { charsIndice, charsCuerpo, actuacionesIndice }
}

export function evaluarSuficienciaInsumo(body: InsumoRequest): SuficienciaInsumo {
    const { charsIndice, charsCuerpo, actuacionesIndice } =
        separarIndiceDeCuerpo(body.documentacion_caso ?? '')

    const hechos = body.hechos?.trim() ?? ''
    const hechosAutogenerados = CARATULA_AUTOGENERADA.test(hechos)

    const charsRelato =
        (hechosAutogenerados ? 0 : hechos.length) +
        (body.prueba_acusacion?.trim().length ?? 0) +
        (body.pretension_defensiva?.trim().length ?? 0)

    const adjuntos = (body.documentos_pdf?.length ?? 0) + (body.imagenes?.length ?? 0)
    const sustancia = charsCuerpo + charsRelato
    const vieneDelMev = actuacionesIndice > 0

    const base = { charsCuerpo, charsIndice, actuacionesIndice, charsRelato, sustancia, vieneDelMev }

    // Un PDF o una imagen del expediente son material real: el modelo los lee
    // enteros. No se pueden medir en caracteres desde acá, pero no se rechaza
    // por falta de insumo a quien adjuntó el expediente.
    if (adjuntos > 0) {
        return {
            ...base,
            nivel: 'suficiente',
            fundamento: '',
            recomendacion: '',
        }
    }

    if (sustancia < MIN_SUSTANCIA_CHARS) {
        return {
            ...base,
            nivel: 'insuficiente',
            fundamento: vieneDelMev
                ? `Se recibió el índice de ${actuacionesIndice} actuación/es del expediente, pero ninguna aportó su texto. ` +
                  `El listado dice qué actuaciones existen; no dice qué dicen, y es el contenido lo que sostiene una nulidad o un agravio. ` +
                  `Sobre el índice solo, el análisis sería una conjetura con formato de informe.`
                : `La consulta aporta ${sustancia.toLocaleString('es-AR')} caracteres de material analizable, por debajo del mínimo de ${MIN_SUSTANCIA_CHARS.toLocaleString('es-AR')}. ` +
                  `No hay expediente ni relato de hechos suficiente para fundar un análisis defensivo.`,
            recomendacion: vieneDelMev
                ? 'En la extensión, abrí la pestaña "Documentos", tildá las actuaciones relevantes y usá "Traer texto de seleccionadas". Después volvé a analizar.'
                : 'Ampliá los hechos imputados (qué se le atribuye, cuándo, con qué prueba) o pegá el texto de las actuaciones en "Documentación del caso".',
        }
    }

    // Vino del MEV con el listado completo y menos de una actuación promedio de
    // texto: alcanza para la secuencia procesal, no para el fondo. Sale, pero
    // rotulado y con la constancia adentro del informe.
    if (vieneDelMev && charsCuerpo < CUERPO_SUFICIENTE_CHARS) {
        return {
            ...base,
            nivel: 'parcial',
            fundamento: `Se analizaron ${charsCuerpo.toLocaleString('es-AR')} caracteres de texto de actuaciones sobre un expediente de ${actuacionesIndice}. ` +
                        `El resto del expediente entró solo como índice.`,
            recomendacion: 'Para un análisis de fondo, traé el texto de más actuaciones desde la pestaña "Documentos".',
        }
    }

    return { ...base, nivel: 'suficiente', fundamento: '', recomendacion: '' }
}
