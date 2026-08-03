#!/usr/bin/env python3
"""
Genera PDF de Análisis Comercial y Valuación — Alcance Legal Penal
Ejecutar: python3 docs/generar_analisis_comercial.py

Produce: docs/Alcance_Legal_Penal_Analisis_Comercial.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, KeepTogether,
                                 HRFlowable)
from reportlab.lib.styles import ParagraphStyle
import os

# ── Colores ──
DARK = HexColor('#0F172A')
GOLD = HexColor('#C9A227')
GOLD_LIGHT = HexColor('#D4AF37')
GOLD_PALE = HexColor('#F5ECD7')
BLUE_DARK = HexColor('#1E3A5F')
SLATE = HexColor('#334155')
MUTED = HexColor('#64748B')
LIGHT_BG = HexColor('#F8FAFC')
WARM_BG = HexColor('#FFFBF0')
WHITE = HexColor('#FFFFFF')
GREEN = HexColor('#16A34A')
GREEN_BG = HexColor('#F0FDF4')
GREEN_DARK = HexColor('#166534')
BORDER_LIGHT = HexColor('#E2E8F0')
BORDER_GOLD = HexColor('#E8D48B')

OUT = os.path.join(os.path.dirname(__file__),
                   'Alcance_Legal_Penal_Analisis_Comercial.pdf')

# ── Estilos ──
def make_styles():
    s = {}
    s['cover_title'] = ParagraphStyle('ct', fontSize=32, leading=40,
        textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER,
        spaceAfter=6*mm)
    s['cover_sub'] = ParagraphStyle('cs', fontSize=14, leading=20,
        textColor=WHITE, fontName='Helvetica', alignment=TA_CENTER,
        spaceAfter=3*mm)
    s['cover_legal'] = ParagraphStyle('cl', fontSize=11, leading=16,
        textColor=MUTED, fontName='Helvetica-Oblique', alignment=TA_CENTER)
    s['section_num'] = ParagraphStyle('sn', fontSize=11, leading=14,
        textColor=GOLD, fontName='Helvetica-Bold', spaceAfter=1*mm)
    s['section_title'] = ParagraphStyle('st', fontSize=20, leading=26,
        textColor=DARK, fontName='Helvetica-Bold', spaceAfter=6*mm)
    s['h2'] = ParagraphStyle('h2', fontSize=13, leading=18,
        textColor=BLUE_DARK, fontName='Helvetica-Bold',
        spaceBefore=5*mm, spaceAfter=3*mm)
    s['h3'] = ParagraphStyle('h3', fontSize=11, leading=15,
        textColor=DARK, fontName='Helvetica-Bold',
        spaceBefore=4*mm, spaceAfter=2*mm)
    s['body'] = ParagraphStyle('body', fontSize=10, leading=15,
        textColor=SLATE, fontName='Helvetica', alignment=TA_JUSTIFY,
        spaceAfter=3*mm)
    s['body_bold'] = ParagraphStyle('bb', fontSize=10, leading=15,
        textColor=DARK, fontName='Helvetica-Bold', alignment=TA_JUSTIFY,
        spaceAfter=3*mm)
    s['bullet'] = ParagraphStyle('bullet', fontSize=10, leading=15,
        textColor=SLATE, fontName='Helvetica', leftIndent=10*mm,
        bulletIndent=4*mm, spaceBefore=1*mm, spaceAfter=1*mm)
    s['bullet_gold'] = ParagraphStyle('bg', fontSize=10, leading=15,
        textColor=SLATE, fontName='Helvetica', leftIndent=10*mm,
        bulletIndent=4*mm, spaceBefore=1.5*mm, spaceAfter=1.5*mm)
    s['callout'] = ParagraphStyle('callout', fontSize=10.5, leading=16,
        textColor=DARK, fontName='Helvetica-Oblique', alignment=TA_CENTER,
        spaceBefore=4*mm, spaceAfter=4*mm)
    s['quote'] = ParagraphStyle('quote', fontSize=10, leading=15,
        textColor=SLATE, fontName='Helvetica-Oblique',
        leftIndent=12*mm, rightIndent=12*mm,
        spaceBefore=3*mm, spaceAfter=3*mm)
    s['table_header'] = ParagraphStyle('th', fontSize=9, leading=12,
        textColor=WHITE, fontName='Helvetica-Bold')
    s['table_cell'] = ParagraphStyle('tc', fontSize=9, leading=12,
        textColor=SLATE, fontName='Helvetica')
    s['table_cell_bold'] = ParagraphStyle('tcb', fontSize=9, leading=12,
        textColor=DARK, fontName='Helvetica-Bold')
    s['footnote'] = ParagraphStyle('fn', fontSize=8, leading=11,
        textColor=MUTED, fontName='Helvetica-Oblique', spaceAfter=2*mm)
    s['footer'] = ParagraphStyle('footer', fontSize=7.5, leading=10,
        textColor=MUTED, fontName='Helvetica', alignment=TA_CENTER)
    s['disclaimer'] = ParagraphStyle('disc', fontSize=8, leading=11,
        textColor=MUTED, fontName='Helvetica-Oblique', alignment=TA_JUSTIFY,
        leftIndent=5*mm, rightIndent=5*mm)
    # KPI
    s['kpi_num'] = ParagraphStyle('kn', fontSize=24, leading=30,
        textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER)
    s['kpi_label'] = ParagraphStyle('kl', fontSize=8, leading=11,
        textColor=SLATE, fontName='Helvetica', alignment=TA_CENTER)
    return s

S = make_styles()

# ── Helpers ──
def gold_rule():
    return HRFlowable(width='100%', thickness=1.5, color=GOLD,
                      spaceBefore=2*mm, spaceAfter=2*mm)

def section_header(number, title):
    return [Spacer(1, 4*mm), gold_rule(),
            Paragraph(number, S['section_num']),
            Paragraph(title, S['section_title'])]

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', S['bullet'])

def bullet_gold(text):
    return Paragraph(f'<bullet><font color="#C9A227">\u25B8</font></bullet> {text}',
                     S['bullet_gold'])

def callout_box(text, bg=WARM_BG, border=BORDER_GOLD):
    inner = Paragraph(text, S['callout'])
    t = Table([[inner]], colWidths=[155*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('BOX', (0, 0), (-1, -1), 1, border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t

def quote_block(text):
    inner = Paragraph(text, S['quote'])
    bar = Table([['', inner]], colWidths=[3*mm, 152*mm])
    bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (0, -1), 0),
        ('LEFTPADDING', (1, 0), (1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return bar

def make_table(headers, rows, col_widths=None):
    uw = 160*mm
    w = col_widths or [uw / len(headers)] * len(headers)
    data = [[Paragraph(h, S['table_header']) for h in headers]]
    for row in rows:
        data.append([
            Paragraph(c, S['table_cell_bold']) if i == 0
            else Paragraph(c, S['table_cell'])
            for i, c in enumerate(row)
        ])
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.8, HexColor('#94A3B8')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t

def kpi_row(items):
    """Create a row of KPI cards. items = [(number, label), ...]"""
    num_row = [Paragraph(n, S['kpi_num']) for n, _ in items]
    label_row = [Paragraph(l, S['kpi_label']) for _, l in items]
    cw = [160*mm / len(items)] * len(items)
    t = Table([num_row, label_row], colWidths=cw)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 1), (-1, 1), 2),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 6),
    ]))
    return t


# ── Page callbacks ──
def on_page(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(20*mm, A4[1] - 15*mm, A4[0] - 20*mm, A4[1] - 15*mm)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(20*mm, A4[1] - 13*mm,
                          'ALCANCE LEGAL PENAL  ·  Análisis Comercial y Valuación')
    canvas_obj.drawRightString(A4[0] - 20*mm, A4[1] - 13*mm,
                               'Documento Confidencial')
    canvas_obj.setStrokeColor(BORDER_LIGHT)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20*mm, 14*mm, A4[0] - 20*mm, 14*mm)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(20*mm, 9*mm, 'Alcance Legal Penal — Julio 2026')
    canvas_obj.drawRightString(A4[0] - 20*mm, 9*mm, f'Página {doc.page}')
    canvas_obj.restoreState()

def on_cover(canvas_obj, doc):
    canvas_obj.saveState()
    # ── Fondo claro premium ──
    canvas_obj.setFillColor(HexColor('#FAFAF7'))
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=1)
    # Banda dorada superior gruesa
    canvas_obj.setFillColor(GOLD)
    canvas_obj.rect(0, A4[1] - 12*mm, A4[0], 12*mm, fill=1)
    # Banda oscura fina debajo de la dorada
    canvas_obj.setFillColor(DARK)
    canvas_obj.rect(0, A4[1] - 15*mm, A4[0], 3*mm, fill=1)
    # Banda dorada inferior
    canvas_obj.setFillColor(GOLD)
    canvas_obj.rect(0, 0, A4[0], 6*mm, fill=1)
    # Banda oscura encima de la inferior
    canvas_obj.setFillColor(DARK)
    canvas_obj.rect(0, 6*mm, A4[0], 3*mm, fill=1)
    # Línea dorada de encuadre superior del bloque de contenido
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(1)
    canvas_obj.line(30*mm, A4[1] - 60*mm, A4[0] - 30*mm, A4[1] - 60*mm)
    # Línea dorada de encuadre inferior
    canvas_obj.line(30*mm, 85*mm, A4[0] - 30*mm, 85*mm)
    # Marca de agua sutil — balanza en gris muy suave
    canvas_obj.setFillColor(HexColor('#EDEDEA'))
    canvas_obj.setFont('Helvetica', 220)
    canvas_obj.drawCentredString(A4[0] / 2, A4[1] / 2 - 30*mm, '⚖')
    # Acento vertical dorado izquierdo
    canvas_obj.setFillColor(GOLD)
    canvas_obj.rect(25*mm, 90*mm, 2*mm, A4[1] - 155*mm, fill=1)
    # Footer portada
    canvas_obj.setFillColor(SLATE)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawCentredString(A4[0] / 2, 28*mm,
        '© 2026 Edgardo Lamas — Studio Lamas · Todos los derechos reservados')
    canvas_obj.setFillColor(GOLD)
    url_text = 'https://studio-lamas.vercel.app'
    canvas_obj.drawCentredString(A4[0] / 2, 21*mm, url_text)
    url_width = canvas_obj.stringWidth(url_text, 'Helvetica', 8)
    url_x1 = A4[0] / 2 - url_width / 2
    canvas_obj.linkURL('https://studio-lamas.vercel.app',
                       (url_x1, 20*mm, url_x1 + url_width, 21*mm + 8), relative=0)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawCentredString(A4[0] / 2, 14*mm,
        'Documento confidencial — Uso exclusivo para evaluación estratégica')
    canvas_obj.restoreState()


# ══════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        topMargin=22*mm, bottomMargin=20*mm,
        leftMargin=20*mm, rightMargin=20*mm)
    story = []
    uw = 160*mm

    # ═══════════ PORTADA ═══════════
    story.append(Spacer(1, 48*mm))
    story.append(Paragraph('⚖', ParagraphStyle('icon',
        fontSize=48, alignment=TA_CENTER, textColor=GOLD)))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ALCANCE LEGAL PENAL',
        ParagraphStyle('ct_light', fontSize=32, leading=40,
            textColor=DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(
        'Análisis Comercial y Valuación',
        ParagraphStyle('cs_light', fontSize=16, leading=22,
            textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(
        'Sistema de Inteligencia Jurídica para la Defensa Penal<br/>'
        'Provincia de Buenos Aires',
        ParagraphStyle('cl_light', fontSize=11, leading=16,
            textColor=SLATE, fontName='Helvetica-Oblique', alignment=TA_CENTER)))
    story.append(Spacer(1, 18*mm))
    story.append(Paragraph('JULIO 2026',
        ParagraphStyle('pt', fontSize=13, textColor=GOLD,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(PageBreak())

    # ═══════════ ÍNDICE ═══════════
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ÍNDICE', ParagraphStyle('idx',
        fontSize=22, textColor=DARK, fontName='Helvetica-Bold',
        alignment=TA_LEFT, spaceAfter=8*mm)))
    story.append(gold_rule())
    story.append(Spacer(1, 4*mm))
    indice = [
        ('1', 'Resumen Ejecutivo'),
        ('2', 'El activo hoy'),
        ('3', 'Mercado'),
        ('4', 'Comparativo con las herramientas del mercado'),
        ('5', 'Modelo de ingresos'),
        ('6', 'Valuación'),
        ('7', 'Proyecciones — los multiplicadores de valor'),
        ('8', 'Riesgos comerciales y mitigación'),
        ('9', 'Recomendación estratégica'),
    ]
    for num, title in indice:
        story.append(Paragraph(
            f'<font color="#C9A227"><b>{num}.</b></font>&nbsp;&nbsp;&nbsp;{title}',
            ParagraphStyle('idx_item', fontSize=12, leading=22,
                           textColor=SLATE, fontName='Helvetica')))
    story.append(Spacer(1, 10*mm))
    story.append(gold_rule())
    story.append(PageBreak())

    # ═══════════ 1. RESUMEN EJECUTIVO ═══════════
    story.extend(section_header('1', 'Resumen Ejecutivo'))
    story.append(Paragraph(
        'Alcance Legal Penal es un producto terminado y en producción: plataforma web, extensión '
        'Chrome publicada en la Web Store integrada a la MEV de la SCBA, y servidor MCP que permite '
        'operar el sistema desde Claude. Su estructura de costos es la de un SaaS puro —costo '
        'variable de centavos de dólar por análisis contra planes de US$ 29 a 99 mensuales— con '
        'un margen bruto estimado del <b>80–95%</b> según intensidad de uso.',
        S['body']))
    story.append(Paragraph(
        'El mercado direccionable inmediato supera los <b>60.000 abogados matriculados</b> '
        'en la Provincia de Buenos Aires. En el mercado legaltech argentino no existe hoy un '
        'competidor directo en su categoría: las plataformas establecidas son herramientas de '
        '<b>gestión de estudio y búsqueda de jurisprudencia</b>; ninguna produce un '
        '<b>análisis defensivo estructurado del expediente</b> con detección de nulidades y '
        'control de calidad.',
        S['body']))

    story.append(Spacer(1, 4*mm))
    story.append(kpi_row([
        ('US$ 28–55K', 'Valuación software'),
        ('US$ 215–285K', 'Con 100 suscriptores'),
        ('80–95%', 'Margen bruto'),
        ('60.000+', 'Mercado PBA'),
    ]))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'El motor es multi-fuero por diseño: los fueros Civil, Familia y Comercial son '
        'verticales gemelas sobre la misma estructura, y la expansión a PJN y a otras '
        'provincias multiplica el mercado direccionable sin reescribir el producto.',
        S['body']))
    story.append(PageBreak())

    # ═══════════ 2. EL ACTIVO HOY ═══════════
    story.extend(section_header('2', 'El activo hoy'))
    story.append(Paragraph('Producto completo, no prototipo', S['h2']))
    for t in [
        '<b>Plataforma web en producción</b> con cuatro herramientas: Analizar Caso (pipeline '
        'defensivo de 5 fases con informe numerado), Auditar Estrategia, Redactar Escrito '
        '(exportable a PDF y Word) y Consultor del Caso.',
        '<b>Extensión Chrome «MEV Navigator»</b> publicada en la Chrome Web Store: extrae '
        'carátula y actuaciones del expediente con la sesión propia del abogado.',
        '<b>Servidor MCP operativo:</b> el sistema puede consultarse directamente desde una '
        'conversación con Claude.',
        '<b>Corpus jurídico curado:</b> 95 criterios con especial profundidad en nulidades, '
        'prueba ilícita, excarcelación, prisión preventiva y garantías constitucionales.',
        'Manual de usuario, página de precios, disclaimer institucional versionado e historial '
        'de análisis con numeración correlativa.',
    ]:
        story.append(bullet_gold(t))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Estructura de costos', S['h2']))
    story.append(make_table(
        ['Concepto', 'Costo'],
        [
            ['Infraestructura (hosting + BD)', '~US$ 0–25 / mes a esta escala'],
            ['Consultor del caso (IA)', '~US$ 0,04 primera consulta · ~US$ 0,02 siguientes'],
            ['Análisis completo de caso (IA)', 'estimado < US$ 0,50 aun con expedientes largos'],
            ['Margen bruto estimado', '80–95% (según intensidad de uso)'],
        ],
        [55*mm, uw - 55*mm]))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Diferenciales frente al mercado', S['h2']))
    diferenciales = [
        ('<b>Especialización defensiva.</b> Pipeline que solo hace defensa penal, con protocolo '
         'inmutable, control anti-sesgo y rechazo fundado cuando no puede analizar.'),
        ('<b>Flujo MEV → informe en un clic.</b> Elimina la fricción de carga del expediente.'),
        ('<b>Motor multi-fuero.</b> Civil, Familia y Comercial son configuración + corpus, '
         'no desarrollo desde cero.'),
        ('<b>Canal MCP.</b> Integración nativa con Claude, resuelta y en funcionamiento.'),
    ]
    for d in diferenciales:
        story.append(bullet_gold(d))
    story.append(PageBreak())

    # ═══════════ 3. MERCADO ═══════════
    story.extend(section_header('3', 'Mercado'))
    mercado_items = [
        'ColProBA agrupa a más de <b>60.000 abogados y procuradores matriculados</b> '
        'en la Provincia de Buenos Aires.',
        'Con un recorte conservador (3–5% con práctica penal regular), el nicho objetivo '
        'inicial es de <b>1.800 a 3.000 penalistas activos</b>, sin contar defensores '
        'oficiales ni el resto del país.',
        '<b>Disposición a pagar:</b> US$ 59 mensuales es menos de lo que un penalista factura '
        'por una hora de trabajo. Un solo planteo de nulidad detectado a tiempo paga años de '
        'suscripción.',
        'Los fueros Civil, Familia y Comercial tienen <b>más abogados activos que Penal</b>: '
        'el despliegue multi-fuero multiplica el mercado direccionable por 5 o más.',
    ]
    for m in mercado_items:
        story.append(bullet_gold(m))
    story.append(PageBreak())

    # ═══════════ 4. COMPARATIVO ═══════════
    story.extend(section_header('4', 'Comparativo con las herramientas del mercado'))
    story.append(Paragraph(
        'Precios según lo publicado por cada proveedor (julio 2026, moneda original):',
        S['footnote']))
    # Tabla comparativa simplificada (la completa no cabe bien)
    comp_rows = [
        ['Categoría', 'Análisis defensivo\ndel expediente', 'Gestión integral\ndel estudio',
         'Gestión +\nprocuración con IA', 'Gestión + búsqueda\nde jurisprudencia'],
        ['Precio', 'US$ 29 / 59 / 99\npor mes', 'AR$ 49.000 /\n149.000 / 399.000',
         'desde AR$ 11.999\npor mes', 'US$ 10 / 50 / 100\npor usuario/mes'],
        ['Perspectiva\ndefensiva penal', '✅ Exclusiva', '—', '—', '—'],
        ['Detección de\nnulidades', '✅ Sistemática', '—', '—', '—'],
        ['Control anti-sesgo', '✅ Automático', '—', '—', '—'],
    ]
    comp_headers = ['', 'Alcance Legal\nPenal', 'RivoLegal', 'MetaJurídico', 'Veredicta']
    comp_data = [[Paragraph(h, S['table_header']) for h in comp_headers]]
    for row in comp_rows:
        comp_data.append([
            Paragraph(row[0], S['table_cell_bold']),
            *[Paragraph(c, S['table_cell']) for c in row[1:]]
        ])
    comp_t = Table(comp_data, colWidths=[28*mm, 36*mm, 32*mm, 32*mm, 32*mm], repeatRows=1)
    comp_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (1, 1), (1, -1), GOLD_PALE),
        ('ROWBACKGROUNDS', (0, 1), (0, -1), [WHITE, LIGHT_BG]),
        ('ROWBACKGROUNDS', (2, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.8, HexColor('#94A3B8')),
        ('BOX', (1, 0), (1, -1), 1.5, GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(comp_t)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph('Lectura del comparativo', S['h2']))
    story.append(Paragraph(
        'Las tres plataformas argentinas son herramientas <b>horizontales</b>: administran el '
        'estudio, siguen los expedientes, buscan jurisprudencia. Resuelven la <i>logística</i>. '
        'Alcance Legal Penal es <b>vertical</b>: hace una sola cosa —el trabajo analítico que '
        'haría un asociado senior de defensa penal— y la hace con método verificable.',
        S['body']))
    story.append(callout_box(
        '<b>No compiten por el mismo presupuesto.</b> Un estudio puede pagar MetaJurídico o '
        'RivoLegal para gestionar y Alcance Legal Penal para analizar. Son complementarios — '
        'lo que convierte a esas plataformas en potenciales socios o compradores estratégicos.'))
    story.append(PageBreak())

    # ═══════════ 5. MODELO DE INGRESOS ═══════════
    story.extend(section_header('5', 'Modelo de ingresos'))
    story.append(Paragraph('Planes vigentes de la plataforma:', S['body']))
    story.append(make_table(
        ['Plan', 'Precio', 'Incluye'],
        [
            ['Básico', 'US$ 29 / mes', '20 análisis mensuales, informe PDF, corpus CPP PBA'],
            ['Profesional', 'US$ 59 / mes', '100 análisis mensuales, imágenes y pericias, soporte'],
            ['Estudio', 'US$ 99 / mes', 'Análisis ilimitados*, hasta 5 usuarios, soporte prioritario'],
        ],
        [30*mm, 30*mm, uw - 60*mm]))
    story.append(Paragraph(
        '* Recomendación: incorporar cláusula de uso razonable antes de la apertura comercial.',
        S['footnote']))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('Escenarios de facturación (referencia: plan Profesional)', S['h2']))
    story.append(make_table(
        ['Escenario', 'Suscriptores', 'Facturación anual aprox.'],
        [
            ['Validación', '20', '~US$ 14.000'],
            ['Negocio consolidado', '100', '~US$ 71.000'],
            ['Penetración 10% nicho penal PBA', '300', '~US$ 212.000'],
        ],
        [55*mm, 35*mm, uw - 90*mm]))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Con la estructura de costos actual, el punto de equilibrio operativo se alcanza con un '
        'puñado de suscriptores: prácticamente todo lo facturado es margen.',
        S['body']))
    story.append(PageBreak())

    # ═══════════ 6. VALUACIÓN ═══════════
    story.extend(section_header('6', 'Valuación'))
    story.append(quote_block(
        'Estimación fundada según las convenciones del mercado de compraventa de software; '
        'no constituye una tasación formal.'))

    # 6.1
    story.append(Paragraph('6.1 Valor actual — el sistema tal cual está (solo software)', S['h2']))
    story.append(Paragraph('<b>Rango estimado: US$ 28.000 – 55.000.</b>', S['body_bold']))
    story.append(Paragraph(
        'Método: <b>costo de reposición</b> — lo que le costaría a un tercero construir '
        'lo mismo desde cero.', S['body']))
    story.append(make_table(
        ['Componente', 'Estimación'],
        [
            ['Desarrollo (web + 5 servicios backend +\nextensión Chrome + MCP + tests)',
             '800 – 1.100 horas de desarrollador senior'],
            ['A tarifa freelance senior regional\n(US$ 35–50/hora)',
             'US$ 28.000 – 55.000'],
            ['Curaduría jurídica del corpus\n(95 criterios)',
             '+ US$ 3.000 – 8.000'],
            ['Costo de reposición total',
             'US$ 31.000 – 63.000'],
        ],
        [70*mm, uw - 70*mm]))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'En una venta real, el software sin base de usuarios se negocia por debajo de su costo '
        'de reposición. Precio probable con un único interesado: <b>US$ 30.000 – 40.000</b>; '
        'por encima de US$ 45.000 solo con más de un oferente.',
        S['body']))

    # 6.2
    story.append(Paragraph('6.2 Valor con abogados suscriptos', S['h2']))
    story.append(Paragraph(
        'Con facturación recurrente, los SaaS de este tamaño se negocian a <b>3–4 veces la '
        'facturación anual</b> (convención Acquire.com).', S['body']))
    story.append(make_table(
        ['Abogados pagos', 'Facturación anual', 'Valor estimado de venta'],
        [
            ['10', '~US$ 7.000', 'US$ 45.000 – 60.000 ¹'],
            ['50', '~US$ 35.000', 'US$ 105.000 – 140.000'],
            ['100', '~US$ 71.000', 'US$ 215.000 – 285.000'],
            ['300', '~US$ 212.000', 'US$ 640.000 – 1.000.000 ²'],
        ],
        [40*mm, 45*mm, uw - 85*mm]))
    story.append(Paragraph(
        '¹ Con pocos suscriptores: "activo + tracción validada". '
        '² Con 300 suscriptores y crecimiento sostenido el múltiplo sube a 4–5×.',
        S['footnote']))

    # 6.3
    story.append(Paragraph('6.3 Lectura práctica', S['h2']))
    lecturas = [
        '<b>Pasar de 0 a 50 abogados triplica el valor del sistema</b> '
        '(de ~US$ 35.000 a ~US$ 120.000). Ninguna funcionalidad nueva produce ese salto.',
        'Cada abogado pago agrega <b>~US$ 2.000 – 2.800 al valor de venta</b> del sistema.',
        '<b>Retener puede ganar a vender:</b> con 100 abogados el sistema deja ~US$ 65.000 '
        'anuales de margen operativo — en dos o tres años se factura más que el precio de venta.',
    ]
    for l in lecturas:
        story.append(bullet_gold(l))
    story.append(PageBreak())

    # ═══════════ 7. PROYECCIONES ═══════════
    story.extend(section_header('7', 'Proyecciones — los multiplicadores de valor'))
    story.append(Paragraph('En orden de impacto comercial:', S['body']))
    proy = [
        ('<b>Los cuatro fueros.</b> Civil y Familia tienen más profesionales que Penal: '
         'el despliegue completo multiplica el mercado por 5 o más con el mismo motor.'),
        ('<b>Segmentación por provincias.</b> Córdoba y Santa Fe son los mercados naturales '
         'siguientes. Cada provincia es un perfil jurídico + corpus sobre el motor existente.'),
        ('<b>Acceso al PJN.</b> Abre el fuero federal y nacional — donde se concentra la '
         'mayor densidad de estudios con capacidad de pago.'),
        ('<b>Análisis probatorio documental completo.</b> Incorporación de los PDF de cada '
         'actuación. Sube el valor percibido y habilita un plan premium por encima de US$ 99.'),
        ('<b>Jurisprudencia citable.</b> Fallos individualizados de la SCBA y la CSJN: '
         'la mejora de mayor impacto en retención.'),
    ]
    for i, p in enumerate(proy, 1):
        story.append(Paragraph(
            f'<font color="#C9A227"><b>{i}.</b></font>&nbsp;&nbsp;{p}',
            ParagraphStyle(f'proy{i}', fontSize=10, leading=15,
                           textColor=SLATE, fontName='Helvetica',
                           leftIndent=8*mm, spaceAfter=3*mm)))

    story.append(Spacer(1, 4*mm))

    # ═══════════ 8. RIESGOS ═══════════
    story.extend(section_header('8', 'Riesgos comerciales y mitigación'))
    story.append(make_table(
        ['Riesgo', 'Mitigación'],
        [
            ['Adopción lenta (perfil\nprofesional conservador)',
             'Venta por demostración con un expediente real; beta con referentes'],
            ['Cambios en el sitio de la MEV',
             'Mantenimiento del extractor; riesgo operativo acotado'],
            ['Plataformas de gestión que\nagreguen "análisis con IA"',
             'La profundidad no se improvisa; posible sociedad o integración'],
            ['Confianza profesional\n(riesgo de alucinación)',
             'Diseño completo orientado a impedirla: rechazo fundado, sección de '
             'limitaciones, citas a cargo del abogado'],
            ['Plan "ilimitado" sin techo',
             'Cláusula de uso razonable en el plan Estudio'],
        ],
        [50*mm, uw - 50*mm]))
    story.append(PageBreak())

    # ═══════════ 9. RECOMENDACIÓN ═══════════
    story.extend(section_header('9', 'Recomendación estratégica'))
    story.append(Paragraph(
        'Secuencia que maximiza valor por esfuerzo invertido:', S['body']))

    pasos = [
        ('1', 'Cerrar los primeros 5–10 abogados suscriptos',
         'Con el producto actual. Es el único movimiento que convierte el activo en negocio y '
         'el que más mueve la valuación.'),
        ('2', 'Lanzar el análisis probatorio documental completo',
         'Con el feedback de esos casos reales.'),
        ('3', 'Desplegar el segundo fuero',
         'Familia o Civil, según la cercanía comercial. Replicando un producto ya validado.'),
        ('4', 'PJN y provincias',
         'Con los ingresos financiando el crecimiento del corpus.'),
    ]
    for num, titulo, desc in pasos:
        paso_t = Table([
            [Paragraph(f'<font color="#C9A227" size=16><b>{num}</b></font>',
                       ParagraphStyle('pn', fontSize=16, alignment=TA_CENTER, textColor=GOLD)),
             Paragraph(f'<b>{titulo}</b><br/>'
                       f'<font size=9 color="#334155">{desc}</font>',
                       ParagraphStyle('pd', fontSize=11, leading=15,
                                      textColor=DARK, fontName='Helvetica-Bold'))],
        ], colWidths=[16*mm, uw - 20*mm])
        paso_t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(KeepTogether([paso_t, Spacer(1, 2*mm)]))

    story.append(Spacer(1, 10*mm))

    # ═══════════ CIERRE ═══════════
    story.append(gold_rule())
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ALCANCE LEGAL PENAL',
        ParagraphStyle('end_title', fontSize=24, textColor=DARK,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('Análisis Comercial y Valuación',
        ParagraphStyle('end_sub', fontSize=13, textColor=SLATE,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph('Edgardo Lamas — Studio Lamas',
        ParagraphStyle('contact', fontSize=14, textColor=DARK,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        '<a href="https://studio-lamas.vercel.app" color="#C9A227"'
        '>https://studio-lamas.vercel.app</a>',
        ParagraphStyle('url', fontSize=11, textColor=GOLD,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Julio 2026',
        ParagraphStyle('ver', fontSize=11, textColor=MUTED,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 12*mm))
    story.append(gold_rule())
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'Documento de análisis comercial interno. Las valuaciones son estimaciones fundadas '
        'en convenciones de mercado y no constituyen tasación formal. Los precios de terceros '
        'corresponden a lo publicado por cada proveedor a julio de 2026.',
        S['disclaimer']))

    # ── Fuentes ──
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('Fuentes', S['h3']))
    fuentes = [
        'ColProBA — estimación sobre fuentes del Colegio y colegios departamentales',
        'RivoLegal — rivolegal.com (planes y funciones)',
        'MetaJurídico — metajuridico.com/planes-precios/',
        'Veredicta — veredicta.com.ar/pricing',
        'Acquire.com — convenciones de múltiplo SaaS para micro-SaaS 2026',
    ]
    for f in fuentes:
        story.append(Paragraph(f'· {f}', S['footnote']))

    doc.build(story, onFirstPage=on_cover, onLaterPages=on_page)
    print(f'\n✅ PDF generado: {OUT}')
    print(f'   Tamaño: {os.path.getsize(OUT) / 1024:.0f} KB')


if __name__ == '__main__':
    build()
