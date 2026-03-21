/**
 * Build Report Module - Alcance Legal
 *
 * Construye un informe jurídico estructurado a partir del output
 * validado del razonamiento LIS. Este módulo NO genera contenido nuevo,
 * solo organiza y formaliza el output existente.
 *
 * Específico para el perfil penal PBA (CPP PBA / CP / garantías constitucionales).
 * El perfil controla el código de informe (ALC-CIVIL / ALC-COMERCIAL / ALC-FAMILIAR)
 * y las etiquetas de sección.
 *
 * Flujo: ValidationResult → buildPenalReport() → PenalReport (JSON)
 */

import { PROFILE_PENAL_PBA, ProfileDefinition } from '../profile';
import type { ValidationResult } from '../validation/validatePenalOutput';

// ============================================
// DISCLAIMER INSTITUCIONAL (fijo e inmutable)
// ============================================

const DISCLAIMER_INSTITUCIONAL = {
    version: '1.2-penal',
    texto: 'Este análisis es un insumo técnico de defensa penal basado en criterios jurídicos verificados del CPP PBA. Razona exclusivamente desde la perspectiva defensiva (in dubio pro reo, presunción de inocencia). No constituye consejo legal definitivo. La estrategia de defensa y la decisión final corresponden exclusivamente al abogado defensor actuante.',
    advertencias: [
        'Este análisis NO constituye opinión legal ni consejo profesional.',
        'El sistema opera EXCLUSIVAMENTE desde la perspectiva de la defensa penal.',
        'Los criterios corresponden al corpus penal verificado (CPP PBA / CP / garantías constitucionales).',
        'La precisión depende de la completitud de los hechos y prueba proporcionados.',
        'Factores procesales no declarados pueden alterar sustancialmente las conclusiones.',
        'La estrategia de defensa y la decisión final corresponden exclusivamente al abogado actuante.'
    ]
} as const;

// ============================================
// TIPOS DEL INFORME
// ============================================

export interface PenalReport {
    /** Metadatos del informe */
    informe: InformeHeader;
    /** Cuerpo del análisis jurídico */
    analisis: AnalisisCuerpo;
    /** Disclaimer institucional obligatorio */
    disclaimer: typeof DISCLAIMER_INSTITUCIONAL;
    /** Metadata técnica del pipeline */
    meta: ReportMeta;
}

export interface InformeHeader {
    /** Número único de informe (ej: ALC-CIVIL-2026-000123) */
    numero: string;
    /** Fecha de emisión ISO 8601 */
    fecha_emision: string;
    /** Nombre del perfil jurídico activo */
    perfil: string;
    /** Status de validación */
    status: 'approved' | 'limited' | 'rejected';
    /** Título descriptivo del informe */
    titulo: string;
}

export interface AnalisisCuerpo {
    /** Encuadre jurídico: instituto y artículos aplicables */
    encuadre: string | null;
    /** Análisis jurídico: aplicación de criterios al caso */
    analisis_juridico: string | null;
    /** Riesgos: advertencias, contingencias, puntos débiles */
    riesgos: string | null;
    /** Conclusión: opinión fundada con alcance explícito */
    conclusion: string | null;
    /** Limitaciones: aspectos no cubiertos y razones */
    limitaciones: string | null;
    /** Advertencias de validación (si status es 'limited') */
    advertencias_validacion: string[] | null;
}

export interface ReportMeta {
    /** Versión del pipeline */
    pipeline_version: string;
    /** ID del perfil usado */
    perfil_id: string;
    /** Cantidad de criterios RAG utilizados */
    criterios_utilizados: number;
    /** Cantidad de checks de validación realizados */
    checks_validacion: number;
    /** Issues detectados en validación */
    issues_detectados: number;
    /** Timestamp de generación */
    generado_en: string;
}

// ============================================
// GENERADOR DE NÚMERO DE INFORME
// ============================================

function generarNumeroInforme(profileCode: string): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    return `ALC-${profileCode}-${year}-${seq}`;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Construye un informe jurídico estructurado.
 *
 * @param validationResult   - Resultado de la validación senior
 * @param criteriosUtilizados - Cantidad de criterios RAG que alimentaron el razonamiento
 * @param profile            - Perfil jurídico activo (por defecto: PROFILE_CIVIL)
 * @returns PenalReport - Informe JSON estructurado listo para render
 */
export function buildPenalReport(
    validationResult: ValidationResult,
    criteriosUtilizados: number = 0,
    profile: ProfileDefinition = PROFILE_PENAL_PBA
): PenalReport {
    const now = new Date().toISOString();
    const { output, status, advertencias, metadata } = validationResult;
    const contenido = output.contenido;

    const titulo = buildTitulo(status, profile.nombre);

    const report: PenalReport = {
        informe: {
            numero: generarNumeroInforme(profile.codigoInforme),
            fecha_emision: now,
            perfil: profile.nombre,
            status,
            titulo
        },
        analisis: {
            encuadre: contenido.encuadre || null,
            analisis_juridico: contenido.analisis || null,
            riesgos: contenido.riesgos || null,
            conclusion: status === 'rejected' ? null : (contenido.conclusion || null),
            limitaciones: contenido.limitaciones || null,
            advertencias_validacion: advertencias && advertencias.length > 0 ? advertencias : null
        },
        disclaimer: DISCLAIMER_INSTITUCIONAL,
        meta: {
            pipeline_version: `2.0-lis-${profile.id}`,
            perfil_id: profile.id,
            criterios_utilizados: criteriosUtilizados,
            checks_validacion: metadata.checksRealizados,
            issues_detectados: metadata.issuesDetectados,
            generado_en: now
        }
    };

    return report;
}

// ============================================
// HELPERS
// ============================================

/**
 * Genera un título descriptivo según el status y el nombre del perfil.
 */
function buildTitulo(
    status: 'approved' | 'limited' | 'rejected',
    perfilNombre: string
): string {
    switch (status) {
        case 'approved':
            return `Informe de Análisis Jurídico – ${perfilNombre} – Aprobado`;
        case 'limited':
            return `Informe de Análisis Jurídico – ${perfilNombre} – Con Limitaciones`;
        case 'rejected':
            return `Informe de Análisis Jurídico – ${perfilNombre} – No Entregable`;
        default:
            return `Informe de Análisis Jurídico – ${perfilNombre}`;
    }
}

// ============================================
// EXPORTS PARA TESTING
// ============================================

export const _internals = {
    generarNumeroInforme,
    buildTitulo,
    DISCLAIMER_INSTITUCIONAL
};
