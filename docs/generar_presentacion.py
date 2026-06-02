#!/usr/bin/env python3
"""
Genera PDF de presentación para inversores — Alcance Legal Penal
Ejecutar: python3 docs/generar_presentacion.py
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, KeepTogether)
from reportlab.lib.styles import ParagraphStyle
import os

# ── Colores ──
DARK = HexColor('#0F172A')
GOLD = HexColor('#C9A227')
GOLD_LIGHT = HexColor('#D4AF37')
BLUE = HexColor('#1E40AF')
SLATE = HexColor('#334155')
MUTED = HexColor('#64748B')
LIGHT_BG = HexColor('#F8FAFC')
WHITE = HexColor('#FFFFFF')
GREEN = HexColor('#16A34A')
RED = HexColor('#DC2626')
AMBER = HexColor('#D97706')

OUT = os.path.join(os.path.dirname(__file__),
                   'Alcance_Legal_Penal_Presentacion_Inversores.pdf')

# ── Estilos ──
def make_styles():
    s = {}
    s['cover_title'] = ParagraphStyle('ct', fontSize=32, leading=38,
        textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER)
    s['cover_sub'] = ParagraphStyle('cs', fontSize=14, leading=20,
        textColor=WHITE, fontName='Helvetica', alignment=TA_CENTER)
    s['slide_title'] = ParagraphStyle('st', fontSize=22, leading=28,
        textColor=DARK, fontName='Helvetica-Bold', spaceBefore=0, spaceAfter=8*mm)
    s['slide_title_gold'] = ParagraphStyle('stg', fontSize=22, leading=28,
        textColor=GOLD, fontName='Helvetica-Bold', spaceBefore=0, spaceAfter=8*mm)
    s['h2'] = ParagraphStyle('h2', fontSize=15, leading=20,
        textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=6*mm, spaceAfter=3*mm)
    s['body'] = ParagraphStyle('body', fontSize=11, leading=16,
        textColor=SLATE, fontName='Helvetica', alignment=TA_JUSTIFY, spaceAfter=3*mm)
    s['bullet'] = ParagraphStyle('bullet', fontSize=11, leading=16,
        textColor=SLATE, fontName='Helvetica', leftIndent=12*mm, bulletIndent=5*mm,
        spaceBefore=1*mm, spaceAfter=1*mm)
    s['small'] = ParagraphStyle('small', fontSize=9, leading=12,
        textColor=MUTED, fontName='Helvetica')
    s['footer'] = ParagraphStyle('footer', fontSize=8, leading=10,
        textColor=MUTED, fontName='Helvetica', alignment=TA_CENTER)
    s['kpi_num'] = ParagraphStyle('kn', fontSize=28, leading=34,
        textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER)
    s['kpi_label'] = ParagraphStyle('kl', fontSize=9, leading=12,
        textColor=SLATE, fontName='Helvetica', alignment=TA_CENTER)
    s['table_header'] = ParagraphStyle('th', fontSize=10, leading=13,
        textColor=WHITE, fontName='Helvetica-Bold')
    s['table_cell'] = ParagraphStyle('tc', fontSize=10, leading=13,
        textColor=SLATE, fontName='Helvetica')
    s['table_cell_bold'] = ParagraphStyle('tcb', fontSize=10, leading=13,
        textColor=DARK, fontName='Helvetica-Bold')
    return s

S = make_styles()

# ── Helpers ──
def gold_line():
    return Table([['']],colWidths=[170*mm],rowHeights=[1.5*mm],
        style=TableStyle([('BACKGROUND',(0,0),(-1,-1),GOLD),
                          ('LINEBELOW',(0,0),(-1,-1),0,GOLD)]))

def section_header(text):
    return [Spacer(1,2*mm), gold_line(), Spacer(1,4*mm),
            Paragraph(text, S['slide_title'])]

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', S['bullet'])

def make_table(headers, rows, col_widths=None):
    w = col_widths or [170*mm/len(headers)]*len(headers)
    data = [[Paragraph(h, S['table_header']) for h in headers]]
    for row in rows:
        data.append([Paragraph(c, S['table_cell']) if i>0
                     else Paragraph(c, S['table_cell_bold'])
                     for i,c in enumerate(row)])
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), DARK),
        ('TEXTCOLOR',(0,0),(-1,0), WHITE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE, LIGHT_BG]),
        ('GRID',(0,0),(-1,-1),0.5,HexColor('#CBD5E1')),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),4),
        ('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),6),
    ]))
    return t

# ── Page template ──
def on_page(canvas_obj, doc):
    canvas_obj.saveState()
    # Footer
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.drawString(25*mm, 10*mm, 'Alcance Legal Penal — Presentación para Inversores — Mayo 2026')
    canvas_obj.drawRightString(A4[0]-25*mm, 10*mm, f'Pág. {doc.page}')
    # Top gold line
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(25*mm, A4[1]-18*mm, A4[0]-25*mm, A4[1]-18*mm)
    canvas_obj.restoreState()

def on_first_page(canvas_obj, doc):
    # Cover page — dark background
    canvas_obj.saveState()
    canvas_obj.setFillColor(DARK)
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=1)
    # Gold accent lines
    canvas_obj.setStrokeColor(GOLD)
    canvas_obj.setLineWidth(3)
    canvas_obj.line(30*mm, A4[1]-60*mm, A4[0]-30*mm, A4[1]-60*mm)
    canvas_obj.line(30*mm, 80*mm, A4[0]-30*mm, 80*mm)
    # Footer text
    canvas_obj.setFillColor(MUTED)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawCentredString(A4[0]/2, 20*mm, '© 2026 Edgardo Lamas — Studio Lamas · Todos los derechos reservados')
    canvas_obj.drawCentredString(A4[0]/2, 14*mm, 'Documento confidencial — Uso exclusivo para evaluación de inversión')
    canvas_obj.restoreState()

# ── Build ──
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        topMargin=25*mm, bottomMargin=20*mm,
        leftMargin=25*mm, rightMargin=25*mm)
    story = []

    # ═══════════ COVER ═══════════
    story.append(Spacer(1, 55*mm))
    story.append(Paragraph('⚖', ParagraphStyle('icon', fontSize=48, alignment=TA_CENTER, textColor=GOLD)))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ALCANCE LEGAL PENAL', S['cover_title']))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('Sistema de Inteligencia Jurídica para Defensa Penal', S['cover_sub']))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Provincia de Buenos Aires · CPP PBA (Ley 11.922)', S['cover_sub']))
    story.append(Spacer(1, 15*mm))
    story.append(Paragraph('PRESENTACIÓN PARA INVERSORES', ParagraphStyle('pt',
        fontSize=13, textColor=GOLD_LIGHT, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('v2.0 · Mayo 2026', ParagraphStyle('pv',
        fontSize=11, textColor=MUTED, fontName='Helvetica', alignment=TA_CENTER)))
    story.append(PageBreak())

    # ═══════════ SLIDE 2: Qué es ═══════════
    story.extend(section_header('1. ¿Qué es Alcance Legal Penal?'))
    story.append(Paragraph(
        'Es un <b>Sistema de Inteligencia Jurídica (LIS)</b> especializado exclusivamente en '
        '<b>Defensa Penal</b> de la Provincia de Buenos Aires. No es un chatbot ni un buscador: '
        'es un pipeline de análisis estructurado que replica la metodología de un asociado senior '
        'de defensa penal.', S['body']))
    story.append(Spacer(1,4*mm))
    story.append(Paragraph('Principio rector', S['h2']))
    story.append(Paragraph(
        'Opera <b>exclusivamente desde la perspectiva de la defensa</b> (in dubio pro reo, '
        'presunción de inocencia). Nunca adopta la perspectiva acusatoria.', S['body']))
    story.append(Spacer(1,4*mm))
    # KPIs
    kpi_data = [
        [Paragraph('5', S['kpi_num']), Paragraph('8', S['kpi_num']),
         Paragraph('162', S['kpi_num']), Paragraph('Claude', S['kpi_num'])],
        [Paragraph('Fases del<br/>pipeline', S['kpi_label']),
         Paragraph('Patrones<br/>procesales', S['kpi_label']),
         Paragraph('Líneas de<br/>system prompt', S['kpi_label']),
         Paragraph('Motor de IA<br/>(Anthropic)', S['kpi_label'])]
    ]
    kpi = Table(kpi_data, colWidths=[40*mm]*4)
    kpi.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), LIGHT_BG),
        ('ROUNDEDCORNERS',[4,4,4,4]),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('TOPPADDING',(0,0),(-1,0),8),
        ('BOTTOMPADDING',(0,0),(-1,0),4),
    ]))
    story.append(kpi)
    story.append(PageBreak())

    # ═══════════ SLIDE 3: Pipeline ═══════════
    story.extend(section_header('2. Pipeline de Análisis — 5 Fases'))
    story.append(Paragraph(
        'Cada consulta atraviesa 5 fases secuenciales. Si falla en cualquier fase, el sistema '
        'rechaza con fundamento estructurado. <b>Nunca improvisa.</b>', S['body']))
    pipeline_rows = [
        ['Fase 1', 'Admisibilidad', 'Verifica fuero penal PBA, hechos mínimos, no híbrida'],
        ['Fase 2', 'RAG Penal', 'Recupera criterios de pgvector (umbral ≥72% similitud)'],
        ['Fase 3', 'Razonamiento LIS', 'Claude Sonnet 4.6 con system prompt inmutable de 162 líneas'],
        ['Fase 4', 'Validación Senior', 'Detecta sesgo acusatorio, certeza excesiva, extrapolación'],
        ['Fase 5', 'Informe', 'PDF/Word numerado ALC-PENAL-PBA-YYYY-NNNNNN + disclaimer'],
    ]
    story.append(make_table(['Fase','Nombre','Función'], pipeline_rows, [20*mm,35*mm,115*mm]))
    story.append(Spacer(1,6*mm))
    story.append(Paragraph('Metodología obligatoria del análisis (5 secciones fijas):', S['h2']))
    for t in ['Encuadre procesal — figura penal, etapa, normativa',
              'Análisis de prueba de cargo — debilidades probatorias de la acusación',
              'Nulidades y vicios — irregularidades, prueba ilícita, vicios formales',
              'Contraargumentación — estrategia defensiva fundada en criterios RAG',
              'Conclusión defensiva — fundada, limitada o abstención metodológica']:
        story.append(bullet(t))
    story.append(PageBreak())

    # ═══════════ SLIDE 4: Motor de IA ═══════════
    story.extend(section_header('3. Motor de Análisis: Claude (Anthropic)'))
    story.append(Paragraph(
        'El análisis lo realiza <b>Claude</b> (Anthropic), operando bajo un system prompt penal '
        'fijo e inmutable. Claude no improvisa: recibe contexto cerrado y produce análisis '
        'estructurado en JSON.', S['body']))
    motor_rows = [
        ['Razonamiento', 'Claude Sonnet 4.6', '5.500 tokens max'],
        ['Patrones procesales', 'Claude Sonnet 4.6', '2.048 tokens max'],
        ['Moderación de imágenes', 'Claude Haiku 4.5', '10 tokens max'],
        ['Fallback', '❌ No hay', 'Decisión de diseño: defensa penal requiere Claude'],
    ]
    story.append(make_table(['Función','Modelo','Detalle'], motor_rows, [40*mm,40*mm,90*mm]))
    story.append(Spacer(1,4*mm))
    story.append(Paragraph('Capacidades multimodales', S['h2']))
    for t in ['<b>PDFs completos</b> — Lee pericias, actas, declaraciones íntegras',
              '<b>Imágenes (Vision)</b> — Analiza capturas de WhatsApp, pericias escaneadas, fotos de evidencia',
              '<b>Metadatos EXIF</b> — Detecta fecha real, GPS, software de edición, ausencia de EXIF',
              '<b>Moderación</b> — Haiku verifica que las imágenes sean documentación judicial válida']:
        story.append(bullet(t))
    story.append(PageBreak())

    # ═══════════ SLIDE 5: MEV ═══════════
    story.extend(section_header('4. Conexión con el MEV — Extensión Chrome'))
    story.append(Paragraph(
        'Extensión de Chrome (<b>MEV Navigator</b>) que conecta directamente con la '
        '<b>Mesa de Entradas Virtual</b> (mev.scba.gov.ar) de la SCBA para extraer y analizar '
        'expedientes judiciales sin copiar/pegar.', S['body']))
    mev_rows = [
        ['Extracción automática', 'Inyecta código en el DOM del MEV y extrae carátula + actuaciones'],
        ['Panel lateral', 'UI completa en Chrome Side Panel: análisis, documentos, historial'],
        ['Análisis en 5 fases', 'Pipeline completo sobre datos extraídos del expediente'],
        ['Gestión de PDFs', 'Lista, prioriza y descarga documentos del expediente'],
        ['Historial local', 'Últimos 20 análisis en chrome.storage.local'],
    ]
    story.append(make_table(['Función','Descripción'], mev_rows, [42*mm,128*mm]))
    story.append(Spacer(1,4*mm))
    story.append(Paragraph('Estado: funcional, pendiente prueba real + Chrome Web Store (unlisted).', S['small']))
    story.append(PageBreak())

    # ═══════════ SLIDE 6: MCP + PJN ═══════════
    story.extend(section_header('5. MCP Server + Proyección PJN'))
    story.append(Paragraph('Servidor MCP (Model Context Protocol)', S['h2']))
    story.append(Paragraph(
        'Edge Function que expone el pipeline como herramientas MCP. Un abogado con Claude Desktop '
        'puede analizar causas penales directamente desde su conversación con Claude.', S['body']))
    mcp_rows = [
        ['analizar_caso', 'Pipeline completo de 5 fases sobre hechos de una causa'],
        ['buscar_jurisprudencia', 'Búsqueda semántica en corpus pgvector verificado'],
    ]
    story.append(make_table(['Herramienta MCP','Descripción'], mcp_rows, [45*mm,125*mm]))
    story.append(Spacer(1,4*mm))
    story.append(Paragraph('Proyección: PJN (Poder Judicial de la Nación)', S['h2']))
    pjn_rows = [
        ['Jurisdicción', 'Provincial (PBA)', 'Federal'],
        ['URL', 'mev.scba.gov.ar', 'pjn.gov.ar / lex100.csjn.gov.ar'],
        ['Corpus RAG', 'CPP PBA (Ley 11.922)', 'CPPN (Ley 23.984) / CPPF (Ley 27.063)'],
    ]
    story.append(make_table(['Aspecto','MEV (actual)','PJN (proyección)'], pjn_rows, [35*mm,65*mm,70*mm]))
    story.append(PageBreak())

    # ═══════════ SLIDE 7: Stack ═══════════
    story.extend(section_header('6. Stack Tecnológico'))
    stack_rows = [
        ['Frontend', 'React 19 + Vite 7 + React Router 7'],
        ['Backend', 'Supabase Edge Functions (Deno runtime)'],
        ['Base de datos', 'Supabase PostgreSQL + pgvector'],
        ['Embeddings', 'OpenAI text-embedding-ada-002 (1536 dim)'],
        ['LLM principal', 'Claude Sonnet 4.6 (Anthropic) — exclusivo'],
        ['LLM moderación', 'Claude Haiku 4.5 (Anthropic)'],
        ['Análisis visual', 'Claude Vision (multimodal)'],
        ['Exportación', 'PDF (jsPDF) + Word editable (docx v9)'],
        ['PWA', 'vite-plugin-pwa — instalable móvil/escritorio'],
        ['Extensión Chrome', 'MEV Navigator (Manifest V3)'],
        ['MCP Server', 'JSON-RPC 2.0 sobre Edge Function'],
        ['Testing', 'Playwright v1.59 — E2E automatizado'],
        ['Deploy', 'GitHub Actions → GitHub Pages'],
        ['Auth', 'Supabase Auth (JWT + RLS por usuario)'],
    ]
    story.append(make_table(['Componente','Tecnología'], stack_rows, [42*mm,128*mm]))
    story.append(PageBreak())

    # ═══════════ SLIDE 8: Diferenciadores ═══════════
    story.extend(section_header('7. Diferenciadores Competitivos'))
    diff_rows = [
        ['Perspectiva', 'Neutral', 'Sin perspectiva', 'Exclusivamente defensiva'],
        ['Motor de IA', 'Genérico', 'No usan IA', 'Claude con prompt inmutable'],
        ['Base jurídica', 'Conocimiento general', 'Fallos sin análisis', 'RAG verificado al caso'],
        ['Control calidad', 'Ninguno', 'No aplica', 'Anti-sesgo post-razonam.'],
        ['Documentos', 'Limitado', 'No', 'PDF + imagen + Vision + EXIF'],
        ['MEV', 'No', 'No', 'Extensión Chrome directa'],
        ['MCP', 'No aplica', 'No aplica', 'Claude Desktop integrado'],
        ['Exportación', 'Chat', 'No genera', 'PDF + Word editable'],
        ['PWA', 'No', 'No', 'Instalable móvil/desktop'],
    ]
    story.append(make_table(
        ['Característica','Chatbots','Buscadores jurisp.','Alcance Legal Penal'],
        diff_rows, [28*mm,32*mm,35*mm,75*mm]))
    story.append(PageBreak())

    # ═══════════ SLIDE 9: Proyecciones ═══════════
    story.extend(section_header('8. Proyecciones Tecnológicas'))
    proy_rows = [
        ['MEV', 'Extensión funcional SCBA', 'Chrome Web Store (unlisted)'],
        ['PJN', 'No implementado', 'content-pjn.js + corpus federal'],
        ['MCP', '2 herramientas', 'redactar_escrito + historial'],
        ['Auth extensión', 'API Key directa', 'Login Supabase del abogado'],
        ['Imágenes', 'Base64 en JSON', 'multipart/form-data'],
        ['Corpus RAG', 'Criterios iniciales', 'Ampliar SCBA + CSJN + doctrina'],
        ['Word', '3 tipos documento', 'Templates por escrito judicial'],
        ['Monetización', 'En desarrollo', 'Suscripción + créditos de análisis'],
    ]
    story.append(make_table(['Área','Estado actual','Proyección'], proy_rows, [30*mm,55*mm,85*mm]))
    story.append(Spacer(1,6*mm))
    story.append(Paragraph('Modelo de monetización proyectado', S['h2']))
    for t in ['Suscripción mensual por abogado con créditos de análisis',
              'Extensión Chrome premium para acceso directo al MEV',
              'API para estudios jurídicos con volumen de consultas',
              'Escalable a otros fueros y jurisdicciones (Civil, Comercial, Familiar ya existen como gemelas)']:
        story.append(bullet(t))
    story.append(PageBreak())

    # ═══════════ SLIDE 10: Contacto ═══════════
    story.append(Spacer(1, 40*mm))
    story.append(gold_line())
    story.append(Spacer(1, 15*mm))
    story.append(Paragraph('ALCANCE LEGAL PENAL', ParagraphStyle('end_title',
        fontSize=28, textColor=DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('Sistema de Inteligencia Jurídica para Defensa Penal',
        ParagraphStyle('end_sub', fontSize=14, textColor=SLATE, fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 15*mm))
    story.append(Paragraph('Edgardo Lamas — Studio Lamas', ParagraphStyle('contact',
        fontSize=16, textColor=DARK, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('v2.0-lis-penal_pba · Mayo 2026', ParagraphStyle('ver',
        fontSize=11, textColor=MUTED, fontName='Helvetica', alignment=TA_CENTER)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('Motor de análisis: Claude Sonnet 4.6 (Anthropic)', ParagraphStyle('mot',
        fontSize=11, textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER)))
    story.append(Spacer(1, 20*mm))
    story.append(gold_line())
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('Documento confidencial — Uso exclusivo para evaluación de inversión',
        S['footer']))

    # ── Build ──
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f'\n✅ PDF generado: {OUT}')
    print(f'   Tamaño: {os.path.getsize(OUT)/1024:.0f} KB')

if __name__ == '__main__':
    build()
