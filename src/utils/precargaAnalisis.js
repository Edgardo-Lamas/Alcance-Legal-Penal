/**
 * Precarga de formularios (Redactar / Auditar) desde un análisis previo.
 *
 * El flujo MEV guarda los hechos con formato fijo generado por la extensión:
 *   Causa penal: "..." (Expediente Nro: X). Imputado/a: Y. Delito investigado: Z. Etapa: W. Cautelar: V.
 * De ese texto se recuperan los datos de carátula. Si el análisis se cargó por
 * el formulario manual, los campos que no se puedan extraer quedan vacíos y el
 * abogado los completa.
 */

const sinDato = (v) => !v || /^(no especificad|sin car[aá]tula)/i.test(v.trim())

const extraer = (texto, regex) => {
    const m = (texto || '').match(regex)
    if (!m) return ''
    return sinDato(m[1]) ? '' : m[1].trim()
}

export function parseCaratula(hechos = '') {
    return {
        imputado: extraer(hechos, /Imputado\/a:\s*(.+?)\.\s*Delito investigado:/),
        expediente: extraer(hechos, /\(Expediente Nro:\s*([^)]+)\)/),
        delito: extraer(hechos, /Delito investigado:\s*(.+?)\.\s*Etapa:/),
        etapa: extraer(hechos, /Etapa:\s*(.+?)\.\s*Cautelar:/),
    }
}

export function mapearEtapa(texto = '') {
    const t = texto.toLowerCase()
    if (t.includes('juicio')) return 'juicio_oral'
    if (t.includes('intermedia')) return 'intermedia'
    if (t.includes('recurso') || t.includes('casaci')) return 'recursos'
    if (t.includes('ejecuci')) return 'ejecucion_pena'
    if (t.includes('ipp') || t.includes('preparatoria')) return 'ipp'
    return ''
}
