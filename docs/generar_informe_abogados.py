#!/usr/bin/env python3
"""
Genera PDF de presentación para Estudios Jurídicos — Alcance Legal Penal
Ejecutar: python3 docs/generar_informe_abogados.py

Produce: docs/Alcance_Legal_Penal_Informe_Estudios_Juridicos.pdf
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas as canvas_mod
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, KeepTogether,
                                 HRFlowable, Frame, PageTemplate)
from reportlab.lib.styles import ParagraphStyle
import os
import datetime

# ── Colores ──
DARK = HexColor('#0F172A')
DARK_LIGHTER = HexColor('#1E293B')
GOLD = HexColor('#C9A227')
GOLD_LIGHT = HexColor('#D4AF37')
GOLD_PALE = HexColor('#F5ECD7')
BLUE = HexColor('#1E40AF')
BLUE_DARK = HexColor('#1E3A5F')
SLATE = HexColor('#334155')
MUTED = HexColor('#64748B')
LIGHT_BG = HexColor('#F8FAFC')
WARM_BG = HexColor('#FFFBF0')
WHITE = HexColor('#FFFFFF')
GREEN = HexColor('#16A34A')
GREEN_BG = HexColor('#F0FDF4')
RED = HexColor('#DC2626')
BORDER_LIGHT = HexColor('#E2E8F0')
BORDER_GOLD = HexColor('#E8D48B')

OUT = os.path.join(os.path.dirname(__file__),
                   'Alcance_Legal_Penal_Informe_Estudios_Juridicos.pdf')

FECHA_HOY = datetime.date.today().strftime('%d de %B de %Y').replace(
    'January', 'enero').replace('February', 'febrero').replace('March', 'marzo'
    ).replace('April', 'abril').replace('May', 'mayo').replace('June', 'junio'
    ).replace('July', 'julio').replace('August', 'agosto').replace(
    'September', 'septiembre').replace('October', 'octubre').replace(
    'November', 'noviembre').replace('December', 'diciembre')


# ── Estilos ──
def make_styles():
    s = {}
    # Portada
    s['cover_title'] = ParagraphStyle('ct', fontSize=34, leading=42,
        textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER,
        spaceAfter=6*mm)
    s['cover_sub'] = ParagraphStyle('cs', fontSize=15, leading=22,
        textColor=WHITE, fontName='Helvetica', alignment=TA_CENTER,
        spaceAfter=3*mm)
    s['cover_legal'] = ParagraphStyle('cl', fontSize=11, leading=16,
        textColor=MUTED, fontName='Helvetica-Oblique', alignment=TA_CENTER)
    # Secciones
    s['section_num'] = ParagraphStyle('sn', fontSize=11, leading=14,
        textColor=GOLD, fontName='Helvetica-Bold', spaceAfter=1*mm)
    s['section_title'] = ParagraphStyle('st', fontSize=20, leading=26,
        textColor=DARK, fontName='Helvetica-Bold', spaceAfter=6*mm)
    s['h2'] = ParagraphStyle('h2', fontSize=14, leading=19,
        textColor=BLUE_DARK, fontName='Helvetica-Bold',
        spaceBefore=6*mm, spaceAfter=3*mm)
    s['h3'] = ParagraphStyle('h3', fontSize=12, leading=16,
        textColor=DARK, fontName='Helvetica-Bold',
        spaceBefore=4*mm, spaceAfter=2*mm)
    # Texto
    s['body'] = ParagraphStyle('body', fontSize=10.5, leading=16,
        textColor=SLATE, fontName='Helvetica', alignment=TA_JUSTIFY,
        spaceAfter=3*mm)
    s['body_emphasis'] = ParagraphStyle('body_em', fontSize=10.5, leading=16,
        textColor=DARK, fontName='Helvetica-Bold', alignment=TA_JUSTIFY,
        spaceAfter=3*mm)
    s['body_italic'] = ParagraphStyle('body_it', fontSize=10.5, leading=16,
        textColor=SLATE, fontName='Helvetica-Oblique', alignment=TA_JUSTIFY,
        spaceAfter=3*mm)
    s['bullet'] = ParagraphStyle('bullet', fontSize=10.5, leading=16,
        textColor=SLATE, fontName='Helvetica', leftIndent=10*mm,
        bulletIndent=4*mm, spaceBefore=1*mm, spaceAfter=1*mm)
    s['bullet_gold'] = ParagraphStyle('bullet_gold', fontSize=10.5, leading=16,
        textColor=SLATE, fontName='Helvetica', leftIndent=10*mm,
        bulletIndent=4*mm, spaceBefore=1.5*mm, spaceAfter=1.5*mm)
    # Destacados
    s['callout'] = ParagraphStyle('callout', fontSize=11, leading=17,
        textColor=DARK, fontName='Helvetica-Oblique', alignment=TA_CENTER,
        spaceBefore=4*mm, spaceAfter=4*mm)
    s['quote'] = ParagraphStyle('quote', fontSize=11, leading=17,
        textColor=SLATE, fontName='Helvetica-Oblique',
        leftIndent=12*mm, rightIndent=12*mm,
        spaceBefore=4*mm, spaceAfter=4*mm,
        borderWidth=0, borderPadding=0)
    # Tablas
    s['table_header'] = ParagraphStyle('th', fontSize=9.5, leading=13,
        textColor=WHITE, fontName='Helvetica-Bold')
    s['table_cell'] = ParagraphStyle('tc', fontSize=9.5, leading=13,
        textColor=SLATE, fontName='Helvetica')
    s['table_cell_bold'] = ParagraphStyle('tcb', fontSize=9.5, leading=13,
        textColor=DARK, fontName='Helvetica-Bold')
    # Notas y footer
    s['footnote'] = ParagraphStyle('fn', fontSize=8.5, leading=12,
        textColor=MUTED, fontName='Helvetica-Oblique', spaceAfter=2*mm)
    s['footer'] = ParagraphStyle('footer', fontSize=7.5, leading=10,
        textColor=MUTED, fontName='Helvetica', alignment=TA_CENTER)
    s['disclaimer'] = ParagraphStyle('disc', fontSize=8, leading=11,
        textColor=MUTED, fontName='Helvetica-Oblique', alignment=TA_JUSTIFY,
        leftIndent=5*mm, rightIndent=5*mm)
    return s


S = make_styles()


# ── Helpers ──
def gold_rule():
    """Línea dorada decorativa."""
    return HRFlowable(width='100%', thickness=1.5, color=GOLD,
                      spaceBefore=2*mm, spaceAfter=2*mm)


def thin_rule():
    """Línea gris suave de separación."""
    return HRFlowable(width='100%', thickness=0.5, color=BORDER_LIGHT,
                      spaceBefore=3*mm, spaceAfter=3*mm)


def section_header(number, title):
    """Encabezado de sección con número dorado y título."""
    elements = [
        Spacer(1, 4*mm),
        gold_rule(),
        Paragraph(number, S['section_num']),
        Paragraph(title, S['section_title']),
    ]
    return elements


def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', S['bullet'])


def bullet_gold(text):
    return Paragraph(f'<bullet><font color="#C9A227">\u25B8</font></bullet> {text}',
                     S['bullet_gold'])


def callout_box(text):
    """Cuadro destacado con fondo cálido y borde dorado."""
    inner = Paragraph(text, S['callout'])
    t = Table([[inner]], colWidths=[160*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WARM_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    return t


def quote_block(text):
    """Cita con barra dorada lateral."""
    inner = Paragraph(text, S['quote'])
    bar = Table([['', inner]], colWidths=[3*mm, 155*mm])
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
    w = col_widths or [160*mm / len(headers)] * len(headers)
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
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


# ── Page callbacks ──
def on_page(canvas_obj, doc):
    canvas_obj.saveState()
    # Línea dorada superior
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(20*mm, A4[1] - 15*mm, A4[0] - 20*mm, A4[1] - 15*mm)
    # Header
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(20*mm, A4[1] - 13*mm,
                          'ALCANCE LEGAL PENAL  ·  Informe de Capacidades del Sistema')
    canvas_obj.drawRightString(A4[0] - 20*mm, A4[1] - 13*mm,
                               'Documento Confidencial')
    # Footer
    canvas_obj.setStrokeColor(BORDER_LIGHT)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20*mm, 14*mm, A4[0] - 20*mm, 14*mm)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(20*mm, 9*mm,
                          f'Alcance Legal Penal — {FECHA_HOY}')
    canvas_obj.drawRightString(A4[0] - 20*mm, 9*mm,
                               f'Página {doc.page}')
    canvas_obj.restoreState()


def on_cover(canvas_obj, doc):
    canvas_obj.saveState()
    # Fondo oscuro completo
    canvas_obj.setFillColor(DARK)
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=1)
    # Franja dorada superior decorativa
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(3)
    canvas_obj.line(0, A4[1] - 8*mm, A4[0], A4[1] - 8*mm)
    # Franja dorada inferior decorativa
    canvas_obj.line(0, 8*mm, A4[0], 8*mm)
    # Líneas doradas de encuadre del bloque principal
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(35*mm, A4[1] - 55*mm, A4[0] - 35*mm, A4[1] - 55*mm)
    canvas_obj.line(35*mm, 75*mm, A4[0] - 35*mm, 75*mm)
    # Marca de agua sutil "⚖" grande
    canvas_obj.setFillColor(HexColor('#1A2744'))
    canvas_obj.setFont('Helvetica', 200)
    canvas_obj.drawCentredString(A4[0] / 2, A4[1] / 2 - 20*mm, '⚖')
    # Footer portada
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawCentredString(A4[0] / 2, 22*mm,
        '© 2026 Edgardo Lamas — Studio Lamas · Todos los derechos reservados')
    canvas_obj.setFillColor(GOLD_LIGHT)
    url_text = 'https://studio-lamas.vercel.app'
    canvas_obj.drawCentredString(A4[0] / 2, 16*mm, url_text)
    # Hacer el texto clickeable: calcular rect del texto
    url_width = canvas_obj.stringWidth(url_text, 'Helvetica', 8)
    url_x1 = A4[0] / 2 - url_width / 2
    url_rect = (url_x1, 15*mm, url_x1 + url_width, 16*mm + 8)  # (x1, y1, x2, y2)
    canvas_obj.linkURL('https://studio-lamas.vercel.app', url_rect, relative=0)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawCentredString(A4[0] / 2, 10*mm,
        'Documento confidencial — Uso exclusivo para evaluación profesional')
    canvas_obj.restoreState()


# ══════════════════════════════════════════════════════════════
# DOCUMENTO
# ══════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        topMargin=22*mm, bottomMargin=20*mm,
        leftMargin=20*mm, rightMargin=20*mm)
    story = []
    usable_width = A4[0] - 40*mm  # 170mm

    # ═══════════════════════════════════════════════
    # PORTADA
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 50*mm))
    story.append(Paragraph('⚖', ParagraphStyle('icon',
        fontSize=52, alignment=TA_CENTER, textColor=GOLD)))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph('ALCANCE LEGAL PENAL', S['cover_title']))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'Sistema de Inteligencia Jurídica<br/>para la Defensa Penal',
        S['cover_sub']))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        'Provincia de Buenos Aires — Código Procesal Penal (Ley 11.922)<br/>'
        'Código Penal de la Nación',
        S['cover_legal']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(
        'INFORME DE CAPACIDADES DEL SISTEMA',
        ParagraphStyle('pt', fontSize=13, textColor=GOLD_LIGHT,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Dirigido a Estudios Jurídicos',
        ParagraphStyle('ptd', fontSize=11, textColor=MUTED,
                       fontName='Helvetica-Oblique', alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        f'Julio 2026',
        ParagraphStyle('pv', fontSize=11, textColor=MUTED,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # ÍNDICE
    # ═══════════════════════════════════════════════
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ÍNDICE', ParagraphStyle('idx_title',
        fontSize=22, textColor=DARK, fontName='Helvetica-Bold',
        alignment=TA_LEFT, spaceAfter=8*mm)))
    story.append(gold_rule())
    story.append(Spacer(1, 4*mm))

    indice_items = [
        ('I', 'Resumen Ejecutivo'),
        ('II', 'Qué es — y qué no es'),
        ('III', 'Del expediente al informe: flujo de trabajo'),
        ('IV', 'Las cinco fases del análisis'),
        ('V', 'Las cuatro herramientas'),
        ('VI', 'Base de conocimiento jurídico'),
        ('VII', 'Garantías profesionales'),
        ('VIII', 'Beneficios concretos para el estudio'),
        ('IX', 'Arquitectura escalable: un motor, cuatro fueros'),
        ('X', 'Proyecciones'),
        ('XI', 'Cómo empezar'),
    ]
    for num, title in indice_items:
        story.append(Paragraph(
            f'<font color="#C9A227"><b>{num}.</b></font>&nbsp;&nbsp;&nbsp;{title}',
            ParagraphStyle('idx_item', fontSize=12, leading=22,
                           textColor=SLATE, fontName='Helvetica')))

    story.append(Spacer(1, 10*mm))
    story.append(gold_rule())
    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # I. RESUMEN EJECUTIVO
    # ═══════════════════════════════════════════════
    story.extend(section_header('I', 'Resumen Ejecutivo'))

    story.append(Paragraph(
        '<b>Alcance Legal Penal</b> es un sistema de inteligencia jurídica especializado en '
        'defensa penal. Toma un expediente —directamente desde la Mesa de Entradas Virtual '
        '(MEV) de la Suprema Corte de Justicia de la Provincia de Buenos Aires— y produce en '
        'minutos un <b>informe defensivo estructurado</b>: encuadre procesal, análisis crítico '
        'de la prueba de cargo, detección de nulidades y vicios procesales, líneas de '
        'contraargumentación y conclusión defensiva.',
        S['body']))

    story.append(Paragraph(
        'El sistema opera <b>exclusivamente desde la perspectiva de la defensa</b>. '
        'Sus principios rectores son la presunción de inocencia y el <i>in dubio pro reo</i>: '
        'no resume el expediente en términos neutros, lo examina como lo haría un defensor '
        'experimentado buscando dónde la acusación es vulnerable.',
        S['body']))

    story.append(Spacer(1, 3*mm))
    story.append(callout_box(
        'Alcance Legal Penal <b>asiste al abogado, no lo reemplaza</b>.<br/>'
        'Cada informe es un insumo de trabajo profesional: la estrategia, '
        'el criterio y la firma son siempre del letrado.'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # II. QUÉ ES — Y QUÉ NO ES
    # ═══════════════════════════════════════════════
    story.extend(section_header('II', 'Qué es — y qué no es'))

    story.append(Paragraph(
        'Alcance Legal Penal <b>no es un chatbot</b> al que se le pregunta cualquier cosa y '
        'responde cualquier cosa. Es un <b>pipeline de análisis estructurado</b> que replica '
        'la metodología de trabajo de un asociado senior de defensa penal: lee el expediente '
        'completo, lo confronta contra una base de criterios jurídicos curada, razona bajo un '
        'protocolo defensivo estricto y somete su propio resultado a un control de calidad antes '
        'de entregarlo.',
        S['body']))

    story.append(Spacer(1, 3*mm))
    story.append(quote_block(
        'Esa disciplina tiene una consecuencia importante para el profesional: '
        '<b>el sistema sabe decir que no</b>. Si el caso no es materia penal de la '
        'Provincia de Buenos Aires, o si la información disponible no alcanza para un análisis '
        'serio, el sistema lo dice expresamente y fundamenta el rechazo o la limitación, en '
        'lugar de improvisar una respuesta. Para un abogado, un asistente que reconoce sus '
        'límites es más valioso que uno que opina de todo.'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # III. FLUJO DE TRABAJO
    # ═══════════════════════════════════════════════
    story.extend(section_header('III', 'Del expediente al informe: flujo de trabajo'))

    story.append(Paragraph('Extensión Chrome «MEV Navigator»', S['h2']))
    story.append(Paragraph(
        'La puerta de entrada principal es una <b>extensión oficial para Google Chrome</b>, '
        'publicada en la Chrome Web Store. El abogado navega la MEV como lo hace todos los días, '
        '<b>con su propia sesión y sus propias credenciales</b> —el sistema nunca las solicita '
        'ni las almacena—. Con el expediente en pantalla, un clic en el panel lateral extrae la '
        'carátula y el listado completo de actuaciones, y lo envía a analizar.',
        S['body']))
    story.append(Paragraph(
        'El resultado aparece automáticamente en la plataforma web, en tiempo real. '
        'No hay que copiar, pegar ni transcribir nada.',
        S['body']))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('Carga manual', S['h2']))
    story.append(Paragraph(
        'Para causas que no están en la MEV, o para trabajar con documentación suelta, la '
        'plataforma ofrece un <b>formulario de carga manual</b> que acepta texto, documentos '
        'PDF e imágenes (por ejemplo, fotografías de fojas). El resultado es el mismo informe '
        'estructurado.',
        S['body']))

    # Diagrama de flujo simplificado como tabla visual
    story.append(Spacer(1, 4*mm))
    flow_data = [
        [Paragraph('<b>Expediente en MEV</b><br/><font size=8 color="#64748B">o carga manual</font>',
                   ParagraphStyle('fc', fontSize=10, alignment=TA_CENTER, textColor=DARK)),
         Paragraph('<font color="#C9A227" size=14>→</font>', ParagraphStyle('arrow', fontSize=14, alignment=TA_CENTER)),
         Paragraph('<b>Pipeline de<br/>5 fases</b><br/><font size=8 color="#64748B">análisis automático</font>',
                   ParagraphStyle('fc', fontSize=10, alignment=TA_CENTER, textColor=DARK)),
         Paragraph('<font color="#C9A227" size=14>→</font>', ParagraphStyle('arrow', fontSize=14, alignment=TA_CENTER)),
         Paragraph('<b>Informe defensivo</b><br/><font size=8 color="#64748B">numerado y verificado</font>',
                   ParagraphStyle('fc', fontSize=10, alignment=TA_CENTER, textColor=DARK))],
    ]
    flow_t = Table(flow_data, colWidths=[45*mm, 12*mm, 40*mm, 12*mm, 45*mm])
    flow_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), LIGHT_BG),
        ('BACKGROUND', (2, 0), (2, 0), GOLD_PALE),
        ('BACKGROUND', (4, 0), (4, 0), GREEN_BG),
        ('BOX', (0, 0), (0, 0), 0.8, BORDER_LIGHT),
        ('BOX', (2, 0), (2, 0), 0.8, BORDER_GOLD),
        ('BOX', (4, 0), (4, 0), 0.8, HexColor('#86EFAC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(flow_t)

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # IV. LAS CINCO FASES
    # ═══════════════════════════════════════════════
    story.extend(section_header('IV', 'Las cinco fases del análisis'))

    story.append(Paragraph(
        'Cada análisis atraviesa cinco fases sucesivas. Cualquiera de ellas puede detener '
        'el proceso con fundamento — esa es una garantía, no una falla.',
        S['body']))

    story.append(Spacer(1, 3*mm))

    fases = [
        ('Fase 1 — Admisibilidad',
         'Verifica que el caso sea materia penal de la Provincia de Buenos Aires. Si '
         'pertenece a otro fuero u otra jurisdicción, el sistema lo indica expresamente.'),
        ('Fase 2 — Recuperación de criterios jurídicos',
         'Busca en su base de conocimiento —<b>95 criterios jurídicos curados</b>, con '
         'especial profundidad en nulidades, garantías constitucionales y prueba— los '
         'criterios aplicables al caso concreto.'),
        ('Fase 3 — Razonamiento defensivo',
         'Un modelo de inteligencia artificial de última generación (Claude, de Anthropic) '
         'analiza el expediente bajo un <b>protocolo penal inmutable</b> que le impone la '
         'perspectiva defensiva, le prohíbe la especulación y le exige fundar cada afirmación.'),
        ('Fase 4 — Control de calidad',
         'Una instancia de validación automática revisa el resultado como lo haría un socio '
         'senior: detecta sesgo acusatorio, certeza excesiva o afirmaciones sin sustento. '
         'Si encuentra debilidades, degrada el informe y lo advierte de manera visible.'),
        ('Fase 5 — Informe numerado',
         'El resultado se entrega como informe formal con numeración única y correlativa '
         '(formato <font face="Courier"><b>ALC-PENAL-PBA-2026-000042</b></font>), con disclaimer '
         'institucional versionado.'),
    ]

    for titulo, descripcion in fases:
        fase_inner = [
            [Paragraph(f'<b>{titulo}</b>', ParagraphStyle('fase_t',
                fontSize=11, textColor=DARK, fontName='Helvetica-Bold'))],
            [Paragraph(descripcion, ParagraphStyle('fase_d',
                fontSize=10, leading=15, textColor=SLATE, fontName='Helvetica'))],
        ]
        fase_table = Table(fase_inner, colWidths=[usable_width - 8*mm])
        fase_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (0, 0), 6),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 0, WHITE),
        ]))
        story.append(KeepTogether([fase_table, Spacer(1, 2*mm)]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # V. LAS CUATRO HERRAMIENTAS
    # ═══════════════════════════════════════════════
    story.extend(section_header('V', 'Las cuatro herramientas'))

    # -- Analizar caso --
    story.append(Paragraph('Analizar caso', S['h2']))
    story.append(Paragraph(
        'La herramienta central. Produce el informe defensivo completo, organizado en secciones:',
        S['body']))

    secciones_rows = [
        ['Encuadre procesal', 'Etapa de la causa, tipo penal en juego, situación procesal del imputado'],
        ['Análisis de la prueba\nde cargo', 'Examen crítico de cada elemento probatorio de la acusación: '
         'debilidades, contradicciones, origen'],
        ['Nulidades y vicios', 'Vicios procesales detectados: detenciones irregulares, allanamientos '
         'defectuosos, cadena de custodia, plazos, actos sin las formalidades legales'],
        ['Contraargumentación', 'Líneas argumentales concretas para enfrentar la posición de la acusación'],
        ['Conclusión defensiva', 'Síntesis estratégica orientada a la decisión del defensor'],
        ['Limitaciones', 'Qué no pudo analizarse y por qué — el sistema lo declara siempre'],
    ]
    story.append(make_table(['Sección', 'Contenido'], secciones_rows,
                            [38*mm, usable_width - 38*mm]))

    story.append(Spacer(1, 5*mm))

    # -- Auditar estrategia --
    story.append(Paragraph('Auditar estrategia', S['h2']))
    story.append(Paragraph(
        'El abogado describe la estrategia defensiva que tiene pensada y el sistema la somete a '
        'crítica constructiva: puntos débiles, riesgos procesales, escenarios adversos y '
        'alternativas que quizá no se consideraron. Funciona como una <b>discusión de caso con '
        'un colega</b> disponible a cualquier hora.',
        S['body']))

    # -- Redactar escrito --
    story.append(Paragraph('Redactar escrito', S['h2']))
    story.append(Paragraph(
        'Genera <b>borradores de escritos judiciales</b> —planteos de nulidad, excarcelaciones, '
        'apelaciones y otros— a partir del análisis del caso. Los borradores se exportan a '
        '<b>PDF y a Word</b>, listos para que el abogado los edite, complete las citas y les dé '
        'su impronta antes de presentarlos.',
        S['body']))

    # -- Consultor del caso --
    story.append(Paragraph('Consultor del caso', S['h2']))
    story.append(Paragraph(
        'Un chat de seguimiento <b>anclado a la causa ya analizada</b> —no un asistente '
        'genérico—. El abogado puede repreguntar sobre su expediente concreto '
        '("¿y si planteo la nulidad del acta de procedimiento?", '
        '"¿qué dice el 189 para este supuesto?") y el consultor responde con el contexto '
        'completo del caso ya cargado.',
        S['body']))

    story.append(Spacer(1, 3*mm))
    story.append(callout_box(
        '<b>Las herramientas están encadenadas:</b> desde el resultado del análisis, '
        '«Redactar Escrito» y «Auditar Estrategia» se abren precargadas con los hechos, '
        'el tipo penal y la etapa procesal. El abogado no vuelve a tipear nada.'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # VI. BASE DE CONOCIMIENTO
    # ═══════════════════════════════════════════════
    story.extend(section_header('VI', 'Base de conocimiento jurídico'))

    story.append(Paragraph(
        'El corpus del sistema está <b>curado manualmente</b>, con especial fortaleza '
        'en la zona donde la defensa penal gana o pierde los casos:',
        S['body']))

    story.append(Spacer(1, 2*mm))

    corpus_rows = [
        ['Nulidades absolutas', 'Arts. 201 a 210 CPP PBA'],
        ['Prueba ilícita y regla de exclusión', 'Art. 211 CPP PBA'],
        ['Detención y aprehensión', 'Art. 151 CPP PBA'],
        ['Allanamiento y requisitos de la orden', 'Art. 219 CPP PBA'],
        ['Excarcelación', 'Arts. 169 y 189 CPP PBA'],
        ['Prisión preventiva y su impugnación', 'Arts. 157 y 439 CPP PBA'],
        ['Hábeas corpus', 'Ley 23.098 y art. 18 C.N.'],
    ]
    story.append(make_table(['Materia', 'Fundamento normativo'], corpus_rows,
                            [65*mm, usable_width - 65*mm]))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        '<i>Las citas de jurisprudencia individualizada (carátula, tribunal, fecha) quedan a '
        'cargo del profesional: el sistema fundamenta en criterios y señala el camino; el '
        'abogado completa la cita con el fallo que elija invocar.</i>',
        S['footnote']))

    story.append(Spacer(1, 8*mm))

    # ═══════════════════════════════════════════════
    # VII. GARANTÍAS PROFESIONALES
    # ═══════════════════════════════════════════════
    story.extend(section_header('VII', 'Garantías profesionales'))

    garantias = [
        ('<b>Perspectiva defensiva exclusiva.</b> El sistema no puede utilizarse para construir '
         'acusaciones. Su protocolo se lo impide.'),
        ('<b>Rechazo fundado.</b> Cuando no puede analizar con seriedad, lo dice. Nunca inventa.'),
        ('<b>Control anti-sesgo.</b> Cada informe pasa por una validación que detecta sesgo '
         'acusatorio y certeza excesiva antes de entregarse.'),
        ('<b>Confidencialidad.</b> Acceso con cuenta personal del abogado. La extensión trabaja '
         'con la sesión propia del profesional en la MEV y no almacena credenciales judiciales.'),
        ('<b>Trazabilidad.</b> Informes numerados, con historial de análisis consultable en la '
         'plataforma y disclaimer institucional versionado.'),
        ('<b>El abogado decide.</b> Cada informe es un insumo de trabajo. La valoración final, '
         'la estrategia y la responsabilidad profesional son siempre del letrado.'),
    ]

    for g in garantias:
        g_inner = Paragraph(
            f'<font color="#C9A227" size=12>✓</font>&nbsp;&nbsp;{g}',
            ParagraphStyle('g_item', fontSize=10.5, leading=16, textColor=SLATE,
                           fontName='Helvetica', leftIndent=8*mm))
        story.append(g_inner)
        story.append(Spacer(1, 2*mm))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # VIII. BENEFICIOS CONCRETOS
    # ═══════════════════════════════════════════════
    story.extend(section_header('VIII', 'Beneficios concretos para el estudio'))

    beneficios = [
        ('<b>Horas de lectura convertidas en minutos.</b>',
         'La lectura sistemática y completa de un expediente —esa que en el estudio hace el '
         'asociado senior— se obtiene en minutos, con el expediente recién extraído de la MEV.'),
        ('<b>Nulidades que no se escapan.</b>',
         'El sistema revisa cada actuación buscando vicios. El planteo de nulidad que aparece a '
         'tiempo puede definir la causa.'),
        ('<b>La prueba de cargo, atacada desde el primer día.</b>',
         'En lugar de un resumen neutro, un mapa de las debilidades de la acusación.'),
        ('<b>Escritos que arrancan por la mitad del camino.</b>',
         'Borradores en Word con la estructura y el fundamento ya armados.'),
        ('<b>Una segunda opinión permanente.</b>',
         'Auditoría de estrategia y consultor del caso: la discusión de un caso difícil ya no '
         'depende de encontrar con quién tenerla.'),
        ('<b>Integración con Claude.</b>',
         'Para los estudios que ya trabajan con inteligencia artificial, el sistema puede '
         'consultarse directamente desde una conversación con Claude: analizar un caso, buscar '
         'criterios jurisprudenciales y mantener el brief del expediente, sin salir del chat.'),
    ]

    for titulo_b, desc_b in beneficios:
        b_block = Table([
            [Paragraph(titulo_b, ParagraphStyle('bt', fontSize=11,
                textColor=DARK, fontName='Helvetica-Bold'))],
            [Paragraph(desc_b, ParagraphStyle('bd', fontSize=10, leading=15,
                textColor=SLATE, fontName='Helvetica'))],
        ], colWidths=[usable_width - 6*mm])
        b_block.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (0, 0), 5),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 5),
            ('LINEBELOW', (0, -1), (-1, -1), 0.3, BORDER_LIGHT),
        ]))
        story.append(KeepTogether([b_block, Spacer(1, 2*mm)]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # IX. UN MOTOR, CUATRO FUEROS
    # ═══════════════════════════════════════════════
    story.extend(section_header('IX', 'Arquitectura escalable: un motor, cuatro fueros'))

    story.append(Paragraph(
        '<b>Alcance Legal es el motor.</b> La arquitectura del sistema —extracción del '
        'expediente, pipeline de cinco fases, base de conocimiento curada, control de calidad '
        'e informe numerado— es un motor único sobre el que se construyen verticales gemelas '
        'por fuero:',
        S['body']))

    story.append(Spacer(1, 3*mm))

    fueros_rows = [
        ['Alcance Legal Penal', 'Defensa penal — el producto que presenta este informe'],
        ['Alcance Legal Civil', 'Fuero civil'],
        ['Alcance Legal Familia', 'Fuero de familia'],
        ['Alcance Legal Comercial', 'Fuero comercial'],
    ]
    story.append(make_table(['Vertical', 'Fuero'], fueros_rows,
                            [55*mm, usable_width - 55*mm]))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'Los cuatro fueros comparten el mismo motor y la misma estructura: cada uno con su '
        'perfil jurídico propio, su corpus especializado y sus criterios de admisibilidad, '
        'pero con idénticas garantías de método, control de calidad y confidencialidad. '
        '<b>El abogado que domina una vertical ya sabe usar las cuatro.</b>',
        S['body']))

    story.append(Spacer(1, 8*mm))

    # ═══════════════════════════════════════════════
    # X. PROYECCIONES
    # ═══════════════════════════════════════════════
    story.extend(section_header('X', 'Proyecciones'))

    proyecciones = [
        ('<b>Acceso al PJN.</b>',
         'Integración con los sistemas del Poder Judicial de la Nación, para extender el '
         'alcance del sistema a las causas del fuero federal y nacional con el mismo flujo '
         'directo que hoy ofrece la MEV bonaerense.'),
        ('<b>Segmentación por provincias.</b>',
         'Verticales provinciales con el código procesal y el corpus propio de cada '
         'jurisdicción — el mismo motor, calibrado a la ley de cada provincia.'),
        ('<b>Análisis probatorio documental completo.</b>',
         'Incorporación automática de los PDF de cada actuación del expediente —descargados '
         'con la sesión del propio abogado— para que el análisis abarque el contenido íntegro '
         'de las presentaciones, no solo la carátula y el listado de actuaciones.'),
        ('<b>Jurisprudencia citable.</b>',
         'Ampliación del corpus con fallos individualizados de la SCBA y la CSJN, para que '
         'los informes citen precedentes concretos listos para invocar.'),
        ('<b>Despliegue de los fueros Civil, Familia y Comercial</b>',
         'sobre el motor ya probado en Penal.'),
    ]

    for titulo_p, desc_p in proyecciones:
        story.append(bullet_gold(f'{titulo_p} {desc_p}'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════
    # XI. CÓMO EMPEZAR
    # ═══════════════════════════════════════════════
    story.extend(section_header('XI', 'Cómo empezar'))

    story.append(Spacer(1, 6*mm))

    pasos = [
        ('1', 'Plataforma web',
         'https://alcance-legal-penal.vercel.app — acceso con cuenta personal.'),
        ('2', 'Extensión Chrome «MEV Navigator»',
         'Se instala desde la Chrome Web Store y se inicia sesión con la misma cuenta '
         'de la plataforma.'),
        ('3', 'Manual de uso',
         'Disponible dentro de la propia plataforma, con el paso a paso del flujo MEV, '
         'la carga manual y la exportación de escritos.'),
    ]

    for num_p, titulo_p, desc_p in pasos:
        paso_inner = Table([
            [Paragraph(f'<font color="#C9A227" size=18><b>{num_p}</b></font>',
                       ParagraphStyle('pn', fontSize=18, alignment=TA_CENTER, textColor=GOLD)),
             Paragraph(f'<b>{titulo_p}</b><br/>'
                       f'<font size=10 color="#334155">{desc_p}</font>',
                       ParagraphStyle('pd', fontSize=12, leading=17,
                                      textColor=DARK, fontName='Helvetica-Bold'))],
        ], colWidths=[18*mm, usable_width - 22*mm])
        paso_inner.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether([paso_inner, Spacer(1, 3*mm)]))

    story.append(Spacer(1, 15*mm))

    # ═══════════════════════════════════════════════
    # CIERRE
    # ═══════════════════════════════════════════════
    story.append(gold_rule())
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph(
        'ALCANCE LEGAL PENAL',
        ParagraphStyle('end_title', fontSize=24, textColor=DARK,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Sistema de Inteligencia Jurídica para la Defensa Penal',
        ParagraphStyle('end_sub', fontSize=13, textColor=SLATE,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        'Edgardo Lamas — Studio Lamas',
        ParagraphStyle('contact', fontSize=14, textColor=DARK,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        '<a href="https://studio-lamas.vercel.app" color="#C9A227"'
        '>https://studio-lamas.vercel.app</a>',
        ParagraphStyle('url', fontSize=11, textColor=GOLD,
                       fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        f'Julio 2026',
        ParagraphStyle('ver', fontSize=11, textColor=MUTED,
                       fontName='Helvetica', alignment=TA_CENTER)))

    story.append(Spacer(1, 12*mm))
    story.append(gold_rule())

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        'Alcance Legal Penal — Sistema de Inteligencia Jurídica para la Defensa Penal.<br/>'
        'El informe asiste al profesional; la estrategia y la decisión son siempre del abogado.',
        S['disclaimer']))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Documento confidencial — Uso exclusivo para evaluación profesional.',
        S['disclaimer']))

    # ── Build ──
    doc.build(story, onFirstPage=on_cover, onLaterPages=on_page)
    print(f'\n✅ PDF generado: {OUT}')
    print(f'   Tamaño: {os.path.getsize(OUT) / 1024:.0f} KB')


if __name__ == '__main__':
    build()
