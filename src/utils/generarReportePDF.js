/**
 * Generador de Reportes PDF — Alcance Legal Penal
 *
 * Genera PDFs profesionales para los 3 tipos de resultado:
 *   - analizar  → Informe de Defensa Penal
 *   - auditar   → Dictamen de Auditoría Estratégica
 *   - redactar  → Borrador de Escrito Judicial
 *
 * Uso: generarReportePDF(informe, capacidad)
 */

import { jsPDF } from 'jspdf'

// ─── Layout ───────────────────────────────────────────────────────────────────
const PW = 210, PH = 297
const ML = 20, MR = 20, MT = 25, MB = 22
const CW = PW - ML - MR      // 170 mm
const FOOTER_H = 16          // zona reservada para footer

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
    dark:     [15, 23, 42],
    gold:     [201, 162, 39],
    goldBg:   [253, 246, 215],
    text:     [30, 41, 59],
    muted:    [100, 116, 139],
    lighter:  [148, 163, 184],
    sectBg:   [248, 250, 252],
    border:   [226, 232, 240],
    white:    [255, 255, 255],
    green:    [22, 163, 74],
    greenBg:  [240, 253, 244],
    greenBdr: [187, 247, 208],
    red:      [185, 28, 28],
    redBg:    [254, 242, 242],
    redBdr:   [254, 202, 202],
    amber:    [180, 83, 9],
    amberBg:  [255, 251, 235],
    amberBdr: [253, 230, 138],
    infoBg:   [239, 246, 255],
    infoBdr:  [191, 219, 254],
    infoText: [29, 78, 216],
}

const TITULOS = {
    analizar: 'Informe de Defensa Penal',
    auditar:  'Dictamen de Auditoría Estratégica',
    redactar: 'Borrador de Escrito Judicial',
}

// ─── Estado del módulo (se reinicia en cada llamada) ─────────────────────────
let _doc, _y

const getY  = ()    => _y
const setY  = (v)   => { _y = v }
const addY  = (v)   => { _y += v }

function maybeBreak(needed = 20) {
    if (_y + needed > PH - MB - FOOTER_H) {
        _doc.addPage()
        _y = MT
        return true
    }
    return false
}

// ─── Helpers de dibujo ────────────────────────────────────────────────────────

function font(weight = 'normal', size = 10, color = C.text) {
    _doc.setFont('helvetica', weight)
    _doc.setFontSize(size)
    _doc.setTextColor(...color)
}

function hline(yy, color = C.border, lw = 0.3) {
    _doc.setDrawColor(...color)
    _doc.setLineWidth(lw)
    _doc.line(ML, yy, PW - MR, yy)
}

function fillBox(x, yy, w, h, fill, strokeColor = null, radius = 2) {
    _doc.setFillColor(...fill)
    if (strokeColor) {
        _doc.setDrawColor(...strokeColor)
        _doc.setLineWidth(0.4)
        _doc.roundedRect(x, yy, w, h, radius, radius, 'FD')
    } else {
        _doc.roundedRect(x, yy, w, h, radius, radius, 'F')
    }
}

/** Escribe un bloque de texto multilínea con salto de página por línea */
function textBlock(str, x, maxW, lineH = 5.5) {
    if (!str) return
    const lines = _doc.splitTextToSize(String(str).trim(), maxW)
    for (const ln of lines) {
        maybeBreak(lineH + 3)
        _doc.text(ln, x, _y)
        addY(lineH)
    }
}

/** Escribe una línea simple (sin wrap). Si no cabe, salta de página. */
function textLine(str, x, options = {}) {
    maybeBreak(7)
    _doc.text(String(str), x, _y, options)
}

// ─── Fecha ────────────────────────────────────────────────────────────────────
function formatFecha(raw) {
    if (!raw) return ''
    if (typeof raw === 'string' && raw.includes('T')) {
        return new Date(raw).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
    }
    return String(raw)
}

// ─── Encabezado de primera página ────────────────────────────────────────────
function drawHeader(informe, capacidad) {
    // Banda oscura superior
    _doc.setFillColor(...C.dark)
    _doc.rect(0, 0, PW, 30, 'F')

    // Marca decorativa (símbolo "L" Studio Lamas)
    _doc.setFillColor(...C.gold)
    _doc.rect(ML, 6, 2.5, 18, 'F')
    _doc.rect(ML, 6, 9, 2.5, 'F')
    _doc.rect(ML, 21.5, 9, 2.5, 'F')

    // Título principal
    font('bold', 15, C.gold)
    _doc.text('ALCANCE LEGAL PENAL', ML + 13, 14)

    // Subtítulo
    font('normal', 7.5, C.lighter)
    _doc.text('Sistema de Inteligencia Jurídica  ·  Defensa Penal  ·  CPP PBA (Ley 11.922)', ML + 13, 20)

    // Fecha (derecha)
    font('normal', 8, C.lighter)
    _doc.text(formatFecha(informe.fecha_emision), PW - MR, 20, { align: 'right' })

    setY(36)

    // N° informe + tipo
    font('bold', 8.5, C.gold)
    _doc.text(`N° ${informe.numero_informe}`, ML, _y)
    font('normal', 8.5, C.muted)
    _doc.text(TITULOS[capacidad], PW - MR, _y, { align: 'right' })
    addY(6)

    hline(_y, C.gold, 0.6)
    addY(6)

    // Badge de estado
    const badge = getBadgeStyle(capacidad, informe._status)
    fillBox(ML, _y, CW, 15, badge.bg, badge.bdr)
    font('bold', 10.5, badge.textColor)
    _doc.text(informe.estado || TITULOS[capacidad], ML + 5, _y + 7)
    if (informe.estado_detalle) {
        font('normal', 7.5, badge.muted)
        _doc.text(informe.estado_detalle, ML + 5, _y + 12)
    }
    addY(19)
    hline(_y, C.border)
    addY(7)
}

function getBadgeStyle(capacidad, status) {
    if (capacidad === 'analizar' && status !== 'rejected') {
        return { bg: C.greenBg, bdr: C.greenBdr, textColor: C.green, muted: [21, 128, 61] }
    }
    if (capacidad === 'redactar') {
        return { bg: C.amberBg, bdr: C.amberBdr, textColor: C.amber, muted: [120, 53, 15] }
    }
    // auditar / default
    return { bg: C.infoBg, bdr: C.infoBdr, textColor: C.infoText, muted: [30, 64, 175] }
}

// ─── Encabezado de sección ────────────────────────────────────────────────────
function sectionTitle(titulo, iconText = '') {
    maybeBreak(22)
    addY(4)
    fillBox(ML, _y, CW, 9, C.sectBg, C.border)
    font('bold', 9.5, C.gold)
    _doc.text((iconText ? `${iconText}  ` : '') + titulo.toUpperCase(), ML + 4, _y + 6)
    addY(13)
}

// ─── Footer en todas las páginas ──────────────────────────────────────────────
function drawAllFooters(informe) {
    const total = _doc.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
        _doc.setPage(i)
        const fy = PH - MB + 4
        hline(fy - 4, C.border)
        font('normal', 7, C.muted)
        _doc.text(
            'Alcance Legal Penal  ·  Uso exclusivo del profesional actuante  ·  No constituye consejo legal definitivo',
            ML, fy
        )
        _doc.text(`© 2026 Edgardo Lamas — Studio Lamas`, ML, fy + 4.5)
        font('normal', 7.5, C.lighter)
        _doc.text(`Página ${i} de ${total}`, PW - MR, fy, { align: 'right' })
        if (informe.numero_informe) {
            font('normal', 7, [203, 213, 225])
            _doc.text(informe.numero_informe, PW - MR, fy + 4.5, { align: 'right' })
        }
    }
}

// ─── Renderizadores por tipo ──────────────────────────────────────────────────

function renderAnalizar(informe) {
    const secciones = [
        { titulo: 'Encuadre Procesal',                  icono: 'I.',  campo: 'encuadre_procesal' },
        { titulo: 'Análisis de Prueba de Cargo',        icono: 'II.', campo: 'analisis_prueba_cargo' },
        { titulo: 'Nulidades y Vicios Procesales',      icono: 'III.',campo: 'nulidades_y_vicios' },
        { titulo: 'Contraargumentación de la Acusación',icono: 'IV.', campo: 'contraargumentacion' },
        { titulo: 'Conclusión Defensiva',               icono: 'V.',  campo: 'conclusion_defensiva' },
        { titulo: 'Limitaciones del Análisis',          icono: 'VI.', campo: 'limitaciones' },
    ]

    for (const s of secciones) {
        if (!informe[s.campo]) continue
        sectionTitle(s.titulo, s.icono)
        font('normal', 9.5, C.text)
        textBlock(informe[s.campo], ML + 3, CW - 6, 5.5)
        addY(3)
    }

    // Patrones procesales
    const patrones = informe.patrones_detectados?.filter(p => p.presente)
    if (patrones?.length > 0) {
        const sorted = [...patrones].sort((a, b) =>
            ({ alto: 0, medio: 1, bajo: 2 }[a.nivel_alerta] - { alto: 0, medio: 1, bajo: 2 }[b.nivel_alerta])
        )
        sectionTitle('Patrones Procesales Detectados', 'VII.')
        for (const p of sorted) {
            maybeBreak(22)
            const nivelColor = p.nivel_alerta === 'alto' ? C.red : p.nivel_alerta === 'medio' ? C.amber : C.muted
            const nivelBg    = p.nivel_alerta === 'alto' ? C.redBg : p.nivel_alerta === 'medio' ? C.amberBg : C.sectBg
            const nivelBdr   = p.nivel_alerta === 'alto' ? C.redBdr : p.nivel_alerta === 'medio' ? C.amberBdr : C.border
            fillBox(ML, _y, CW, 7, nivelBg, nivelBdr)
            font('bold', 8, nivelColor)
            _doc.text(`[${p.nivel_alerta.toUpperCase()}]  ${p.nombre_corto || p.id}`, ML + 3, _y + 5)
            addY(9)
            if (p.nota_resumen) {
                font('normal', 8.5, C.text)
                textBlock(p.nota_resumen, ML + 4, CW - 8, 5)
            }
            addY(2)
        }
    }

    // Advertencias validación (status: limited)
    if (informe._status === 'limited' && informe._advertencias?.length > 0) {
        sectionTitle('Advertencias de Validación')
        for (const a of informe._advertencias) {
            maybeBreak(10)
            fillBox(ML, _y, CW, 7, C.amberBg, C.amberBdr)
            font('normal', 8.5, C.amber)
            _doc.text(`⚠  ${a}`, ML + 3, _y + 5)
            addY(9)
        }
    }

    // Disclaimer
    if (informe._disclaimer) {
        renderDisclaimer(informe._disclaimer)
    }

    // Meta técnica
    if (informe._meta) {
        addY(4)
        hline(_y, C.border)
        addY(5)
        font('normal', 7.5, C.muted)
        _doc.text(
            `Criterios RAG: ${informe._meta.criterios_utilizados}  ·  Pipeline: ${informe._meta.pipeline_version}  ·  ${formatFecha(informe._meta.timestamp)}`,
            ML, _y
        )
        addY(5)
    }
}

function renderAuditar(informe) {
    // Consistencia
    sectionTitle('Evaluación de Consistencia Estratégica', 'I.')
    const val = informe.consistencia?.valor || ''
    const valColor = val === 'SÓLIDA' ? C.green : val === 'PARCIAL' ? C.amber : C.red
    const valBg    = val === 'SÓLIDA' ? C.greenBg : val === 'PARCIAL' ? C.amberBg : C.redBg
    const valBdr   = val === 'SÓLIDA' ? C.greenBdr : val === 'PARCIAL' ? C.amberBdr : C.redBdr

    maybeBreak(30)
    fillBox(ML, _y, CW, 22, valBg, valBdr)
    font('bold', 18, valColor)
    _doc.text(val, ML + 5, _y + 13)
    font('normal', 8.5, C.text)
    if (informe.consistencia?.explicacion) {
        const lines = _doc.splitTextToSize(informe.consistencia.explicacion, CW - 40)
        lines.forEach((ln, i) => _doc.text(ln, ML + 35, _y + 7 + (i * 5)))
    }
    addY(26)

    if (informe.consistencia?.advertencia) {
        font('normal', 8.5, C.amber)
        textBlock(`⚠  ${informe.consistencia.advertencia}`, ML + 2, CW - 4, 5)
        addY(3)
    }

    // Observaciones
    if (informe.observaciones?.length > 0) {
        sectionTitle('Observaciones Críticas', 'II.')
        informe.observaciones.forEach((o, i) => {
            maybeBreak(30)
            const sevColor = o.severidad === 'alta' ? C.red : o.severidad === 'media' ? C.amber : C.muted
            const sevBg    = o.severidad === 'alta' ? C.redBg : o.severidad === 'media' ? C.amberBg : C.sectBg
            const sevBdr   = o.severidad === 'alta' ? C.redBdr : o.severidad === 'media' ? C.amberBdr : C.border

            fillBox(ML, _y, CW, 7, sevBg, sevBdr)
            font('bold', 8.5, sevColor)
            _doc.text(
                `${o.codigo}  ·  ${o.tipo === 'supuesto_implicito' ? 'Supuesto Implícito' : 'Inconsistencia Detectada'}  ·  SEVERIDAD ${(o.severidad || '').toUpperCase()}`,
                ML + 3, _y + 5
            )
            addY(9)
            font('normal', 9.5, C.text)
            textBlock(o.descripcion, ML + 3, CW - 6, 5.5)
            addY(1)
            font('bold', 8.5, C.muted)
            _doc.text('Impacto potencial:', ML + 3, _y)
            addY(5)
            font('normal', 8.5, C.text)
            textBlock(o.impacto, ML + 3, CW - 6, 5)
            addY(5)
        })
    }

    // Recomendaciones
    if (informe.recomendaciones?.length > 0) {
        sectionTitle('Recomendaciones de Acción', 'III.')
        informe.recomendaciones.forEach((r, i) => {
            maybeBreak(18)
            const priColor = r.prioridad === 'alta' ? C.red : r.prioridad === 'media' ? C.amber : C.muted
            font('bold', 8, priColor)
            _doc.text(`PRIORIDAD ${(r.prioridad || '').toUpperCase()}`, ML + 3, _y)
            addY(5)
            font('normal', 9.5, C.text)
            textBlock(r.accion, ML + 3, CW - 6, 5.5)
            addY(4)
        })
    }

    // Advertencias
    renderAdvertencias(informe.advertencias)
}

function renderRedactar(informe) {
    // Alerta crítica
    maybeBreak(22)
    fillBox(ML, _y, CW, 16, C.amberBg, C.amberBdr)
    font('bold', 9, C.amber)
    _doc.text('DOCUMENTO DE TRABAJO — NO PRESENTAR SIN REVISIÓN PROFESIONAL COMPLETA', ML + 4, _y + 7)
    font('normal', 7.5, C.amber)
    const pendCount = informe.secciones_pendientes?.length || 0
    _doc.text(`Se identifican ${pendCount} sección${pendCount !== 1 ? 'es' : ''} que requieren intervención del letrado.`, ML + 4, _y + 12.5)
    addY(20)

    // Tipo de escrito
    font('bold', 9, C.muted)
    _doc.text('Tipo de Escrito:', ML, _y)
    font('normal', 9.5, C.text)
    _doc.text(informe.tipo_escrito || '—', ML + 32, _y)
    addY(8)
    hline(_y, C.border)
    addY(6)

    // Secciones pendientes
    if (informe.secciones_pendientes?.length > 0) {
        sectionTitle('Secciones Pendientes de Completar', 'I.')
        for (const s of informe.secciones_pendientes) {
            maybeBreak(16)
            const cColor = s.criticidad === 'alta' ? C.red : C.amber
            const cBg    = s.criticidad === 'alta' ? C.redBg : C.amberBg
            const cBdr   = s.criticidad === 'alta' ? C.redBdr : C.amberBdr
            fillBox(ML, _y, CW, 7, cBg, cBdr)
            font('bold', 8, cColor)
            _doc.text(`${s.seccion}  ·  ${(s.criticidad || '').toUpperCase()}`, ML + 3, _y + 5)
            addY(9)
            font('normal', 8.5, C.text)
            textBlock(s.motivo, ML + 4, CW - 8, 5)
            addY(3)
        }
    }

    // Borrador del escrito
    sectionTitle('Borrador del Escrito', 'II.')

    // Marca de agua BORRADOR
    _doc.setFontSize(52)
    _doc.setTextColor(230, 230, 230)
    _doc.setFont('helvetica', 'bold')
    // La marca de agua se pone en la página actual, centrada
    _doc.text('BORRADOR', PW / 2, PH / 2, { align: 'center', angle: 45 })

    font('normal', 8.5, C.text)
    if (informe.contenido) {
        const lines = informe.contenido.split('\n')
        for (const ln of lines) {
            maybeBreak(5)
            _doc.text(ln.length > 0 ? ln : ' ', ML + 2, _y)
            addY(5)
        }
    }

    // Advertencias
    renderAdvertencias(informe.advertencias, true)
}

// ─── Secciones compartidas ────────────────────────────────────────────────────

function renderDisclaimer(disclaimer) {
    if (!disclaimer) return
    addY(4)
    hline(_y, C.gold, 0.4)
    addY(6)
    sectionTitle('Aviso Legal y Limitaciones')
    if (disclaimer.texto) {
        font('bold', 9, C.muted)
        textBlock(disclaimer.texto, ML + 3, CW - 6, 5.5)
        addY(3)
    }
    if (disclaimer.advertencias?.length > 0) {
        for (const a of disclaimer.advertencias) {
            maybeBreak(8)
            font('normal', 8.5, C.muted)
            _doc.text('·', ML + 2, _y)
            textBlock(a, ML + 7, CW - 9, 5)
            addY(2)
        }
    }
}

function renderAdvertencias(advertencias, critica = false) {
    if (!advertencias) return
    addY(5)
    const boxBg  = critica ? C.redBg  : C.amberBg
    const boxBdr = critica ? C.redBdr : C.amberBdr
    const txtCol = critica ? C.red    : C.amber

    if (advertencias.principal) {
        maybeBreak(20)
        const lines = _doc.splitTextToSize(advertencias.principal, CW - 10)
        const h = Math.max(14, lines.length * 5.5 + 6)
        fillBox(ML, _y, CW, h, boxBg, boxBdr)
        font('bold', 8.5, txtCol)
        lines.forEach((ln, i) => _doc.text(ln, ML + 4, _y + 6 + i * 5.5))
        addY(h + 4)
    }

    if (advertencias.items?.length > 0) {
        for (const item of advertencias.items) {
            maybeBreak(8)
            font('normal', 8, C.muted)
            _doc.text('·', ML + 2, _y)
            textBlock(item, ML + 7, CW - 9, 5)
            addY(2)
        }
    }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Genera y descarga el PDF del informe.
 *
 * @param {Object} informe - Datos del informe (disponibles en Resultado.jsx como `informe`)
 * @param {'analizar'|'auditar'|'redactar'} capacidad
 */
export function generarReportePDF(informe, capacidad) {
    _doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    _y = MT

    drawHeader(informe, capacidad)

    switch (capacidad) {
        case 'analizar': renderAnalizar(informe); break
        case 'auditar':  renderAuditar(informe);  break
        case 'redactar': renderRedactar(informe); break
    }

    drawAllFooters(informe)

    const nombreArchivo = `${informe.numero_informe || 'ALC-PENAL'}_${capacidad}.pdf`
    _doc.save(nombreArchivo)
}
