/**
 * Generador de Reportes Word (DOCX) — Alcance Legal Penal
 *
 * Genera documentos editables .docx para los 3 tipos de resultado:
 *   - analizar  → Informe de Defensa Penal
 *   - auditar   → Dictamen de Auditoría Estratégica
 *   - redactar  → Borrador de Escrito Judicial (editable por el letrado)
 *
 * VENTAJA vs PDF: el abogado puede editar directamente — completar datos del
 * caso, firmar digitalmente, personalizar y presentar en sede judicial.
 *
 * Uso: await generarReporteWord(informe, capacidad)
 */

import {
    Document, Packer, Paragraph, TextRun,
    Table, TableRow, TableCell,
    Header, Footer,
    AlignmentType, BorderStyle, WidthType,
    PageNumber, ShadingType,
    convertMillimetersToTwip,
} from 'docx'

// ─── Constantes de página (A4) ────────────────────────────────────────────────
const MARGIN   = convertMillimetersToTwip(25)   // 2.5 cm en twips
const PAGE_W   = 11906                           // A4 ancho en twips
const PAGE_H   = 16838                           // A4 alto en twips
const CONTENT_W = PAGE_W - MARGIN * 2           // 160 mm ≈ 9072 twips

// ─── Paleta (hex sin #) ───────────────────────────────────────────────────────
const C = {
    gold:     'C9A227',
    dark:     '0F172A',
    text:     '1E293B',
    muted:    '64748B',
    lighter:  '94A3B8',
    sectBg:   'F1F5F9',
    gray300:  'CBD5E1',
    green:    '16A34A',
    greenBg:  'F0FDF4',
    amber:    'B45309',
    amberBg:  'FFFBEB',
    red:      'B91C1C',
    redBg:    'FEF2F2',
    infoText: '1D4ED8',
    infoBg:   'EFF6FF',
    watermark:'E2E8F0',
    white:    'FFFFFF',
}

const TITULOS = {
    analizar: 'Informe de Defensa Penal',
    auditar:  'Dictamen de Auditoría Estratégica',
    redactar: 'Borrador de Escrito Judicial',
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatFecha(raw) {
    if (!raw) return ''
    if (typeof raw === 'string' && raw.includes('T')) {
        return new Date(raw).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'long', day: 'numeric',
        })
    }
    return String(raw)
}

/** Borde simple en los 4 lados */
function border4(color, size = 4) {
    const b = { style: BorderStyle.SINGLE, size, color }
    return { top: b, bottom: b, left: b, right: b }
}

/** Párrafo vacío (separador) */
const sep = (pt = 80) =>
    new Paragraph({ spacing: { before: pt, after: 0 }, children: [new TextRun('')] })

/** Run con fuente Times New Roman */
function run(text, opts = {}) {
    return new TextRun({ text, font: 'Times New Roman', size: 24, color: C.text, ...opts })
}

// ─── Header del documento ─────────────────────────────────────────────────────

function buildHeader(informe, capacidad) {
    return new Header({
        children: [
            new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.gold } },
                spacing: { after: 40 },
                children: [
                    run('ALCANCE LEGAL PENAL — Defensa CPP PBA (Ley 11.922)', {
                        bold: true, size: 18, color: C.dark,
                    }),
                    run(`   ·   N° ${informe.numero_informe || ''}   ·   ${formatFecha(informe.fecha_emision)}`, {
                        size: 16, color: C.muted,
                    }),
                ],
            }),
        ],
    })
}

// ─── Footer con numeración de páginas ────────────────────────────────────────

function buildFooter() {
    return new Footer({
        children: [
            new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.gray300 } },
                spacing: { before: 40 },
                children: [
                    run('© 2026 Edgardo Lamas — Studio Lamas   ·   Alcance Legal Penal   ·   Página ', {
                        size: 14, color: C.muted,
                    }),
                    new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 14, color: C.muted }),
                    run(' de ', { size: 14, color: C.muted }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Times New Roman', size: 14, color: C.muted }),
                ],
            }),
        ],
    })
}

// ─── Título principal del documento ──────────────────────────────────────────

function buildTituloDocumento(informe, capacidad) {
    return [
        new Paragraph({
            shading: { type: ShadingType.SOLID, fill: C.dark, color: C.dark },
            spacing: { before: 0, after: 0 },
            children: [
                run(`  ALCANCE LEGAL PENAL — ${TITULOS[capacidad].toUpperCase()}`, {
                    bold: true, size: 26, color: C.gold,
                }),
            ],
        }),
        new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
                run(`N° ${informe.numero_informe || '[COMPLETAR]'}`, { bold: true, size: 20, color: C.gold }),
                run(`   ·   ${informe.estado || TITULOS[capacidad]}`, { size: 20 }),
                run(`   ·   ${formatFecha(informe.fecha_emision)}`, { size: 18, color: C.muted }),
            ],
        }),
        sep(40),
    ]
}

// ─── Título de sección ────────────────────────────────────────────────────────

function buildSectionTitle(roman, titulo) {
    return new Paragraph({
        shading: { type: ShadingType.SOLID, fill: C.sectBg, color: C.sectBg },
        border: { left: { style: BorderStyle.THICK, size: 14, color: C.gold } },
        spacing: { before: 280, after: 100 },
        children: [
            run(`  ${roman}  ${titulo.toUpperCase()}`, { bold: true, size: 22, color: C.dark }),
        ],
    })
}

// ─── Contenido de párrafo ─────────────────────────────────────────────────────

function buildContent(text) {
    if (!text) return []
    return text.trim().split('\n\n').filter(Boolean).map(p =>
        new Paragraph({
            spacing: { before: 60, after: 120 },
            indent: { left: 220 },
            children: [run(p.trim())],
        })
    )
}

// ─── Campo [COMPLETAR] ────────────────────────────────────────────────────────

function buildCampoCompletar(label) {
    return new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 220 },
        children: [
            run(`${label}: `, { bold: true }),
            run('[COMPLETAR]', { color: C.amber, underline: {}, italics: true }),
        ],
    })
}

// ─── Bloque de datos básicos del caso ────────────────────────────────────────

function buildDatosBaseCaso() {
    return [
        sep(60),
        new Paragraph({
            shading: { type: ShadingType.SOLID, fill: C.infoBg, color: C.infoBg },
            spacing: { before: 0, after: 0 },
            children: [
                run('  DATOS DEL CASO — Completar antes de presentar', {
                    bold: true, size: 20, color: C.infoText,
                }),
            ],
        }),
        buildCampoCompletar('Imputado/a'),
        buildCampoCompletar('N° de Expediente'),
        buildCampoCompletar('Juzgado / Tribunal interviniente'),
        buildCampoCompletar('Nombre del Defensor/a'),
        buildCampoCompletar('Carátula de la causa'),
        sep(60),
    ]
}

// ─── Alerta coloreada ─────────────────────────────────────────────────────────

function buildAlerta(texto, textColor, bgColor) {
    return new Paragraph({
        shading: { type: ShadingType.SOLID, fill: bgColor, color: bgColor },
        spacing: { before: 120, after: 120 },
        indent: { left: 220, right: 220 },
        children: [run(`⚠  ${texto}`, { bold: true, size: 20, color: textColor })],
    })
}

// ─── Disclaimer ──────────────────────────────────────────────────────────────

function buildDisclaimer(disclaimer) {
    if (!disclaimer) return []
    const rows = [sep(60), buildSectionTitle('', 'Aviso Legal y Limitaciones')]
    if (disclaimer.texto) {
        rows.push(new Paragraph({
            spacing: { before: 60, after: 60 },
            indent: { left: 220 },
            children: [run(disclaimer.texto, { italics: true, size: 20, color: C.muted })],
        }))
    }
    for (const a of disclaimer.advertencias || []) {
        rows.push(new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 440 },
            children: [run(`· ${a}`, { size: 20, color: C.muted })],
        }))
    }
    return rows
}

// ─── Tabla de patrones procesales ─────────────────────────────────────────────

function buildTablaPatrones(patrones) {
    // Anchos de columnas (total = CONTENT_W ≈ 9072 twips)
    const COL = [1600, 5500, 1972]

    const headerCells = ['Código', 'Descripción', 'Severidad'].map((txt, i) =>
        new TableCell({
            width: { size: COL[i], type: WidthType.DXA },
            shading: { type: ShadingType.SOLID, fill: C.dark, color: C.dark },
            children: [new Paragraph({ children: [run(txt, { bold: true, size: 20, color: C.gold })] })],
        })
    )

    const dataRows = patrones.map(p => {
        const nivelColor = p.nivel_alerta === 'alto' ? C.red : p.nivel_alerta === 'medio' ? C.amber : C.muted
        const nivelBg    = p.nivel_alerta === 'alto' ? C.redBg : p.nivel_alerta === 'medio' ? C.amberBg : C.sectBg
        const bdr        = border4(C.gray300)
        return new TableRow({
            children: [
                new TableCell({
                    width: { size: COL[0], type: WidthType.DXA },
                    borders: bdr,
                    children: [new Paragraph({ children: [run(p.id || p.nombre_corto || '', { bold: true, size: 20 })] })],
                }),
                new TableCell({
                    width: { size: COL[1], type: WidthType.DXA },
                    borders: bdr,
                    children: [new Paragraph({ children: [run(p.nota_resumen || p.nombre_corto || '', { size: 20 })] })],
                }),
                new TableCell({
                    width: { size: COL[2], type: WidthType.DXA },
                    borders: bdr,
                    shading: { type: ShadingType.SOLID, fill: nivelBg, color: nivelBg },
                    children: [new Paragraph({ children: [run((p.nivel_alerta || '').toUpperCase(), { bold: true, size: 20, color: nivelColor })] })],
                }),
            ],
        })
    })

    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        rows: [new TableRow({ children: headerCells }), ...dataRows],
    })
}

// ─── Renderizadores por tipo ──────────────────────────────────────────────────

function renderAnalizar(informe) {
    const ch = []
    ch.push(...buildTituloDocumento(informe, 'analizar'))
    ch.push(...buildDatosBaseCaso())

    const secciones = [
        { roman: 'I.',    titulo: 'Encuadre Procesal',                   campo: 'encuadre_procesal' },
        { roman: 'II.',   titulo: 'Análisis de Prueba de Cargo',          campo: 'analisis_prueba_cargo' },
        { roman: 'III.',  titulo: 'Nulidades y Vicios Procesales',        campo: 'nulidades_y_vicios' },
        { roman: 'IV.',   titulo: 'Contraargumentación de la Acusación',  campo: 'contraargumentacion' },
        { roman: 'V.',    titulo: 'Conclusión Defensiva',                 campo: 'conclusion_defensiva' },
        { roman: 'VI.',   titulo: 'Limitaciones del Análisis',            campo: 'limitaciones' },
    ]
    for (const s of secciones) {
        if (!informe[s.campo]) continue
        ch.push(buildSectionTitle(s.roman, s.titulo))
        ch.push(...buildContent(informe[s.campo]))
    }

    // Patrones procesales — tabla
    const patrones = informe.patrones_detectados?.filter(p => p.presente)
    if (patrones?.length > 0) {
        const sorted = [...patrones].sort((a, b) =>
            ({ alto: 0, medio: 1, bajo: 2 }[a.nivel_alerta] - { alto: 0, medio: 1, bajo: 2 }[b.nivel_alerta])
        )
        ch.push(buildSectionTitle('VII.', 'Patrones Procesales Detectados'))
        ch.push(buildTablaPatrones(sorted))
    }

    // Advertencias de validación (status: limited)
    if (informe._status === 'limited' && informe._advertencias?.length > 0) {
        ch.push(sep(80))
        for (const a of informe._advertencias) {
            ch.push(buildAlerta(a, C.amber, C.amberBg))
        }
    }

    ch.push(...buildDisclaimer(informe._disclaimer))

    // Meta técnica
    if (informe._meta) {
        ch.push(sep(80))
        ch.push(new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [run(
                `Criterios RAG: ${informe._meta.criterios_utilizados}  ·  Pipeline: ${informe._meta.pipeline_version}  ·  ${formatFecha(informe._meta.timestamp)}`,
                { size: 16, color: C.muted }
            )],
        }))
    }

    return ch
}

function renderAuditar(informe) {
    const ch = []
    ch.push(...buildTituloDocumento(informe, 'auditar'))
    ch.push(...buildDatosBaseCaso())

    // Consistencia
    const val      = informe.consistencia?.valor || ''
    const valColor = val === 'SÓLIDA' ? C.green : val === 'PARCIAL' ? C.amber : C.red
    const valBg    = val === 'SÓLIDA' ? C.greenBg : val === 'PARCIAL' ? C.amberBg : C.redBg

    ch.push(buildSectionTitle('I.', 'Evaluación de Consistencia Estratégica'))
    ch.push(new Paragraph({
        shading: { type: ShadingType.SOLID, fill: valBg, color: valBg },
        spacing: { before: 80, after: 80 },
        indent: { left: 220 },
        children: [run(val, { bold: true, size: 56, color: valColor })],
    }))
    ch.push(...buildContent(informe.consistencia?.explicacion))
    if (informe.consistencia?.advertencia) {
        ch.push(buildAlerta(informe.consistencia.advertencia, C.amber, C.amberBg))
    }

    // Observaciones
    if (informe.observaciones?.length > 0) {
        ch.push(buildSectionTitle('II.', 'Observaciones Críticas'))
        for (const o of informe.observaciones) {
            const sevColor = o.severidad === 'alta' ? C.red : o.severidad === 'media' ? C.amber : C.muted
            const sevBg    = o.severidad === 'alta' ? C.redBg : o.severidad === 'media' ? C.amberBg : C.sectBg
            ch.push(new Paragraph({
                shading: { type: ShadingType.SOLID, fill: sevBg, color: sevBg },
                spacing: { before: 120, after: 40 },
                indent: { left: 220 },
                children: [
                    run(`${o.codigo}  ·  SEVERIDAD ${(o.severidad || '').toUpperCase()}`, {
                        bold: true, size: 20, color: sevColor,
                    }),
                ],
            }))
            ch.push(...buildContent(o.descripcion))
            ch.push(new Paragraph({
                spacing: { before: 40, after: 80 },
                indent: { left: 220 },
                children: [
                    run('Impacto potencial: ', { bold: true, size: 22, color: C.muted }),
                    run(o.impacto || '', { size: 22 }),
                ],
            }))
        }
    }

    // Recomendaciones
    if (informe.recomendaciones?.length > 0) {
        ch.push(buildSectionTitle('III.', 'Recomendaciones de Acción'))
        for (const r of informe.recomendaciones) {
            const priColor = r.prioridad === 'alta' ? C.red : r.prioridad === 'media' ? C.amber : C.muted
            ch.push(new Paragraph({
                spacing: { before: 120, after: 40 },
                indent: { left: 220 },
                children: [run(`PRIORIDAD ${(r.prioridad || '').toUpperCase()}`, { bold: true, size: 20, color: priColor })],
            }))
            ch.push(...buildContent(r.accion))
        }
    }

    // Advertencias
    if (informe.advertencias?.principal) {
        ch.push(buildAlerta(informe.advertencias.principal, C.amber, C.amberBg))
    }
    for (const item of informe.advertencias?.items || []) {
        ch.push(new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 440 },
            children: [run(`· ${item}`, { size: 20, color: C.muted })],
        }))
    }

    return ch
}

function renderRedactar(informe) {
    const ch = []
    ch.push(...buildTituloDocumento(informe, 'redactar'))

    // Marca de agua textual (no hay API nativa de watermark en docx sin XML crudo)
    ch.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, fill: C.watermark, color: C.watermark },
        spacing: { before: 0, after: 0 },
        children: [run(
            '— BORRADOR —  NO PRESENTAR SIN REVISIÓN PROFESIONAL COMPLETA  — BORRADOR —',
            { bold: true, size: 28, color: C.muted }
        )],
    }))

    ch.push(...buildDatosBaseCaso())

    // Alerta crítica
    const pendCount = informe.secciones_pendientes?.length || 0
    ch.push(buildAlerta(
        `DOCUMENTO DE TRABAJO: Se identifican ${pendCount} sección${pendCount !== 1 ? 'es' : ''} que requieren intervención del letrado.`,
        C.amber, C.amberBg
    ))

    // Tipo de escrito
    ch.push(sep(80))
    ch.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
            run('Tipo de Escrito: ', { bold: true }),
            run(informe.tipo_escrito || '[COMPLETAR]'),
        ],
    }))

    // Secciones pendientes
    if (informe.secciones_pendientes?.length > 0) {
        ch.push(buildSectionTitle('I.', 'Secciones Pendientes de Completar'))
        for (const s of informe.secciones_pendientes) {
            const cColor = s.criticidad === 'alta' ? C.red : C.amber
            const cBg    = s.criticidad === 'alta' ? C.redBg : C.amberBg
            ch.push(new Paragraph({
                shading: { type: ShadingType.SOLID, fill: cBg, color: cBg },
                spacing: { before: 80, after: 40 },
                indent: { left: 220 },
                children: [run(`${s.seccion}  ·  ${(s.criticidad || '').toUpperCase()}`, { bold: true, size: 20, color: cColor })],
            }))
            ch.push(new Paragraph({
                spacing: { before: 40, after: 80 },
                indent: { left: 440 },
                children: [run(s.motivo || '', { size: 20 })],
            }))
        }
    }

    // Borrador editable — el valor diferencial del Word vs PDF
    ch.push(buildSectionTitle('II.', 'Borrador del Escrito (Editable)'))
    ch.push(new Paragraph({
        spacing: { before: 40, after: 80 },
        indent: { left: 220 },
        children: [run(
            '↓ Complete los campos [COMPLETAR] y edite el texto antes de presentar.',
            { italics: true, size: 20, color: C.muted }
        )],
    }))

    if (informe.contenido) {
        for (const linea of informe.contenido.split('\n')) {
            ch.push(new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [run(linea || ' ')],
            }))
        }
    }

    // Advertencias críticas al final
    ch.push(sep(80))
    if (informe.advertencias?.principal) {
        ch.push(buildAlerta(informe.advertencias.principal, C.red, C.redBg))
    }
    for (const item of informe.advertencias?.items || []) {
        ch.push(new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: 440 },
            children: [run(`· ${item}`, { size: 20, color: C.red })],
        }))
    }

    return ch
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Genera y descarga el DOCX del informe.
 *
 * @param {Object}                          informe   - Datos del informe
 * @param {'analizar'|'auditar'|'redactar'} capacidad
 */
export async function generarReporteWord(informe, capacidad) {
    let children
    switch (capacidad) {
        case 'analizar': children = renderAnalizar(informe); break
        case 'auditar':  children = renderAuditar(informe);  break
        case 'redactar': children = renderRedactar(informe); break
        default:         children = []
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Times New Roman', size: 24, color: C.text },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    size: { width: PAGE_W, height: PAGE_H },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
                },
            },
            headers: { default: buildHeader(informe, capacidad) },
            footers: { default: buildFooter() },
            children,
        }],
    })

    const blob = await Packer.toBlob(doc)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${informe.numero_informe || 'ALC-PENAL'}_${capacidad}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
