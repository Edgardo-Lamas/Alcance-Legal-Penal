/**
 * Render Penal Report PDF Module
 *
 * Renderiza un informe jurídico penal (PenalReport JSON) a PDF
 * utilizando un template HTML controlado. NO usa LLM ni genera
 * contenido nuevo; solo transforma el JSON en un documento visual.
 * 
 * Flujo: PenalReport (JSON) → HTML Template → PDF (Buffer)
 * 
 * Dependencia: jspdf (generación PDF sin servidor headless)
 */

import type { PenalReport } from './buildPenalReport';

// ============================================
// TIPOS
// ============================================

export interface PDFRenderResult {
    /** Indica si el render fue exitoso */
    success: boolean;
    /** Contenido HTML generado (intermedio) */
    html: string;
    /** Nombre sugerido para el archivo */
    filename: string;
    /** Error si el render falló */
    error?: string;
}

// ============================================
// TEMPLATE HTML
// ============================================

/**
 * Genera el HTML completo del informe a partir del JSON.
 * Este HTML es el template de referencia para el render PDF.
 */
function buildReportHTML(report: PenalReport): string {
    const { informe, analisis, disclaimer, meta } = report;

    const statusLabel = getStatusLabel(informe.status);
    const statusColor = getStatusColor(informe.status);
    const fechaFormateada = formatFecha(informe.fecha_emision);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${informe.titulo}</title>
    <style>
        /* ─── Reset y Base ─── */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            padding: 40px 50px;
            max-width: 210mm;
            margin: 0 auto;
        }

        /* ─── Header Institucional ─── */
        .header {
            border-bottom: 3px double #1a3a5c;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }

        .header-brand {
            font-size: 18pt;
            font-weight: bold;
            color: #1a3a5c;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .header-subtitle {
            font-size: 9pt;
            color: #666;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        /* ─── Datos del Informe ─── */
        .report-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding: 12px 16px;
            background: #f8f9fa;
            border-left: 4px solid #1a3a5c;
        }

        .report-info-left { flex: 1; }

        .report-info label {
            font-size: 8pt;
            text-transform: uppercase;
            color: #888;
            letter-spacing: 0.5px;
        }

        .report-info .value {
            font-size: 10pt;
            color: #333;
            font-weight: 600;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #fff;
            background: ${statusColor};
        }

        /* ─── Título del Informe ─── */
        .report-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1a3a5c;
            margin-bottom: 24px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
        }

        /* ─── Secciones de Análisis ─── */
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e0e0e0;
        }

        .section-content {
            font-size: 10.5pt;
            text-align: justify;
            color: #333;
            white-space: pre-wrap;
        }

        .section-empty {
            font-style: italic;
            color: #999;
            font-size: 10pt;
        }

        /* ─── Advertencias ─── */
        .advertencias {
            background: #fff8e1;
            border: 1px solid #f9a825;
            border-left: 4px solid #f9a825;
            padding: 12px 16px;
            margin-bottom: 20px;
        }

        .advertencias-title {
            font-size: 9pt;
            font-weight: bold;
            color: #e65100;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .advertencias ul {
            padding-left: 18px;
            font-size: 9.5pt;
            color: #5d4037;
        }

        .advertencias li {
            margin-bottom: 3px;
        }

        /* ─── Disclaimer ─── */
        .disclaimer {
            margin-top: 32px;
            padding: 16px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            page-break-inside: avoid;
        }

        .disclaimer-title {
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #888;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .disclaimer-text {
            font-size: 8.5pt;
            color: #666;
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .disclaimer ul {
            padding-left: 16px;
            font-size: 8pt;
            color: #777;
        }

        .disclaimer li {
            margin-bottom: 2px;
        }

        /* ─── Footer ─── */
        .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #ddd;
            font-size: 7.5pt;
            color: #aaa;
            text-align: center;
        }

        /* ─── Print ─── */
        @media print {
            body { padding: 20px 30px; }
            .section { page-break-inside: avoid; }
            .disclaimer { page-break-inside: avoid; }
        }
    </style>
</head>
<body>

    <!-- Header Institucional -->
    <div class="header">
        <div class="header-brand">Alcance Legal</div>
        <div class="header-subtitle">Defensa Penal PBA · Inteligencia Jurídica</div>
    </div>

    <!-- Datos del Informe -->
    <div class="report-info">
        <div class="report-info-left">
            <div>
                <label>Informe Nº</label><br>
                <span class="value">${informe.numero}</span>
            </div>
            <div style="margin-top: 6px;">
                <label>Fecha de emisión</label><br>
                <span class="value">${fechaFormateada}</span>
            </div>
            <div style="margin-top: 6px;">
                <label>Perfil</label><br>
                <span class="value">${informe.perfil}</span>
            </div>
        </div>
        <div>
            <span class="status-badge">${statusLabel}</span>
        </div>
    </div>

    <!-- Título -->
    <div class="report-title">${informe.titulo}</div>

    <!-- Advertencias de Validación (si existen) -->
    ${analisis.advertencias_validacion ? `
    <div class="advertencias">
        <div class="advertencias-title">⚠ Advertencias de Validación</div>
        <ul>
            ${analisis.advertencias_validacion.map(a => `<li>${escapeHtml(a)}</li>`).join('\n            ')}
        </ul>
    </div>
    ` : ''}

    <!-- Secciones de Análisis -->
    ${renderSection('I. Encuadre Jurídico', analisis.encuadre)}
    ${renderSection('II. Análisis Jurídico', analisis.analisis_juridico)}
    ${renderSection('III. Gestión del Riesgo', analisis.riesgos)}
    ${renderSection('IV. Conclusión', analisis.conclusion)}
    ${renderSection('V. Limitaciones', analisis.limitaciones)}

    <!-- Disclaimer Institucional -->
    <div class="disclaimer">
        <div class="disclaimer-title">Aviso Legal Institucional (v${disclaimer.version})</div>
        <div class="disclaimer-text">${escapeHtml(disclaimer.texto)}</div>
        <ul>
            ${disclaimer.advertencias.map(a => `<li>${escapeHtml(a)}</li>`).join('\n            ')}
        </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
        Generado por Alcance Legal – Pipeline v${meta.pipeline_version} · 
        ${meta.criterios_utilizados} criterios utilizados · 
        ${meta.checks_validacion} validaciones · 
        ${meta.generado_en}
    </div>

</body>
</html>`;
}

// ============================================
// HELPERS DE TEMPLATE
// ============================================

function renderSection(title: string, content: string | null): string {
    if (!content) {
        return `
    <div class="section">
        <div class="section-title">${title}</div>
        <div class="section-content section-empty">No disponible para este análisis.</div>
    </div>`;
    }

    return `
    <div class="section">
        <div class="section-title">${title}</div>
        <div class="section-content">${escapeHtml(content)}</div>
    </div>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'approved': return 'Aprobado';
        case 'limited': return 'Con Limitaciones';
        case 'rejected': return 'No Entregable';
        default: return status;
    }
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'approved': return '#2e7d32';
        case 'limited': return '#f57f17';
        case 'rejected': return '#c62828';
        default: return '#666';
    }
}

function formatFecha(isoDate: string): string {
    try {
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoDate;
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Renderiza un PenalReport a HTML listo para conversión a PDF.
 * 
 * El HTML generado puede ser:
 * 1. Convertido a PDF via window.print() en el navegador
 * 2. Convertido server-side con puppeteer, wkhtmltopdf u otra herramienta
 * 3. Usado directamente como vista previa
 * 
 * @param report - PenalReport JSON estructurado
 * @returns PDFRenderResult con el HTML y metadatos
 */
export function renderPenalReportPDF(report: PenalReport): PDFRenderResult {
    try {
        const html = buildReportHTML(report);
        const filename = `${report.informe.numero}.pdf`;

        return {
            success: true,
            html,
            filename
        };
    } catch (error) {
        return {
            success: false,
            html: '',
            filename: '',
            error: error instanceof Error ? error.message : 'Error desconocido en render'
        };
    }
}

/**
 * Genera una URL data: con el HTML para abrir en nueva pestaña
 * y permitir window.print() → Guardar como PDF.
 * 
 * Uso en frontend:
 *   const { dataUrl } = getReportDataUrl(report);
 *   window.open(dataUrl, '_blank');
 */
export function getReportDataUrl(report: PenalReport): { dataUrl: string; filename: string } {
    const { html, filename } = renderPenalReportPDF(report);
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    return { dataUrl, filename };
}

// ============================================
// EXPORTS PARA TESTING
// ============================================

export const _internals = {
    buildReportHTML,
    renderSection,
    escapeHtml,
    getStatusLabel,
    getStatusColor,
    formatFecha
};
