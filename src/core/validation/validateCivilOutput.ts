/**
 * Output Validation Module - Control Senior
 *
 * Validación final del razonamiento jurídico antes de entregar al usuario.
 * Este módulo actúa como "control senior": puede bloquear respuestas riesgosas.
 * NO mejora el razonamiento, solo lo evalúa y controla.
 *
 * Es agnóstico al perfil: las keywords de scope excluido se derivan
 * dinámicamente de los fuerosExcluidos del perfil activo.
 */

import type { ReasoningOutput, ContenidoReasoning } from '../reasoning/guidedCivilReasoning';
import { PROFILE_CIVIL, ProfileDefinition, Fuero } from '../profile';

// ============================================
// CONFIGURACIÓN DE VALIDACIÓN
// ============================================

/** Patrones que indican certeza excesiva (riesgoso en contexto jurídico) */
const CERTEZA_EXCESIVA_PATTERNS = [
    /sin duda alguna/i,
    /es absolutamente cierto/i,
    /indiscutiblemente/i,
    /no hay ninguna duda/i,
    /con total certeza/i,
    /garantizo que/i,
    /seguramente ganará/i,
    /100% seguro/i,
    /es imposible que/i,
    /nunca podrá/i,
    /siempre será/i
] as const;

/** Patrones que indican extrapolación no fundada */
const EXTRAPOLACION_PATTERNS = [
    /en mi experiencia/i,
    /generalmente se considera/i,
    /la doctrina mayoritaria/i,
    /según la jurisprudencia/i,
    /es de público conocimiento/i,
    /como todos saben/i,
    /en la práctica profesional/i,
    /normalmente los tribunales/i
] as const;

/**
 * Keywords de violación de scope por fuero.
 * Para cada perfil activo, se construye dinámicamente el conjunto de keywords
 * a detectar en función de sus fuerosExcluidos.
 */
const SCOPE_KEYWORDS_BY_FUERO: Record<Fuero, readonly string[]> = {
    civil:      ['contrato civil', 'daños civiles', 'obligaciones civiles', 'sucesión', 'usucapión'],
    comercial:  ['sociedad', 'quiebra', 'concurso preventivo', 'cheque', 'pagaré', 'accionista', 'directorio'],
    penal:      ['penal', 'delito', 'crimen', 'prisión', 'imputado', 'fiscal', 'querella criminal', 'condena'],
    laboral:    ['laboral', 'despido', 'LCT', 'indemnización laboral', 'sindicato', 'convenio colectivo', 'ART'],
    familia:    ['divorcio', 'alimentos', 'tenencia', 'régimen de visitas', 'adopción', 'filiación', 'patria potestad']
} as const;

// ============================================
// TIPOS
// ============================================

export type ValidationStatus = 'approved' | 'limited' | 'rejected';

export interface ValidationResult {
    /** Estado final de la validación */
    status: ValidationStatus;
    /** Si la respuesta puede entregarse (approved o limited) */
    entregable: boolean;
    /** Razones del rechazo o limitación (si aplica) */
    razones: ValidationIssue[];
    /** Output original */
    output: ReasoningOutput;
    /** Advertencias a incluir en la respuesta (para limited) */
    advertencias?: string[];
    /** Metadata de validación */
    metadata: ValidationMetadata;
}

export interface ValidationIssue {
    tipo: ValidationIssueType;
    severidad: 'warning' | 'error' | 'critical';
    descripcion: string;
    fragmento?: string;
}

export type ValidationIssueType =
    | 'CERTEZA_EXCESIVA'
    | 'EXTRAPOLACION_NO_FUNDADA'
    | 'VIOLACION_SCOPE'
    | 'CONTRADICCION_INTERNA'
    | 'CONCLUSION_SIN_FUNDAMENTO'
    | 'RIESGO_PROFESIONAL';

export interface ValidationMetadata {
    checksRealizados: number;
    issuesDetectados: number;
    timestamp: string;
}

// ============================================
// FUNCIONES DE DETECCIÓN
// ============================================

function detectarCertezaExcesiva(texto: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    for (const pattern of CERTEZA_EXCESIVA_PATTERNS) {
        const match = texto.match(pattern);
        if (match) {
            issues.push({
                tipo: 'CERTEZA_EXCESIVA',
                severidad: 'error',
                descripcion: 'Se detectó lenguaje que simula certeza absoluta, inapropiado para análisis jurídico.',
                fragmento: match[0]
            });
        }
    }
    return issues;
}

function detectarExtrapolaciones(texto: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    for (const pattern of EXTRAPOLACION_PATTERNS) {
        const match = texto.match(pattern);
        if (match) {
            issues.push({
                tipo: 'EXTRAPOLACION_NO_FUNDADA',
                severidad: 'warning',
                descripcion: 'Se detectó referencia a fuentes no proporcionadas en el contexto.',
                fragmento: match[0]
            });
        }
    }
    return issues;
}

/**
 * Detecta violaciones de scope detectando keywords de los fueros excluidos
 * del perfil activo. Para cada perfil, solo se evalúan sus propios fueros excluidos.
 */
function detectarViolacionScope(texto: string, profile: ProfileDefinition): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const textoLower = texto.toLowerCase();

    for (const fueroExcluido of profile.fuerosExcluidos) {
        const keywords = SCOPE_KEYWORDS_BY_FUERO[fueroExcluido];
        for (const keyword of keywords) {
            if (textoLower.includes(keyword.toLowerCase())) {
                issues.push({
                    tipo: 'VIOLACION_SCOPE',
                    severidad: 'critical',
                    descripcion: `Se detectó mención a materia fuera del scope ${profile.nombre}: "${keyword}"`,
                    fragmento: keyword
                });
                break; // Un critical por fuero excluido es suficiente
            }
        }
    }

    return issues;
}

function detectarContradicciones(contenido: ContenidoReasoning): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const conclusionPositiva = /viable|favorable|procede|corresponde/i.test(contenido.conclusion);
    const riesgosGraves = /alto riesgo|muy riesgoso|desaconseja|improcedente/i.test(contenido.riesgos);

    if (conclusionPositiva && riesgosGraves) {
        issues.push({
            tipo: 'CONTRADICCION_INTERNA',
            severidad: 'error',
            descripcion: 'La conclusión favorable contradice los riesgos graves identificados.'
        });
    }

    const tieneEncuadre = contenido.encuadre.length > 50 && /art\.|artículo|código/i.test(contenido.encuadre);
    const tieneConclusionFuerte = /debe|corresponde|procede/i.test(contenido.conclusion);

    if (tieneConclusionFuerte && !tieneEncuadre) {
        issues.push({
            tipo: 'CONCLUSION_SIN_FUNDAMENTO',
            severidad: 'error',
            descripcion: 'La conclusión emite un juicio fuerte sin encuadre normativo previo.'
        });
    }

    return issues;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Valida el output del razonamiento jurídico antes de entregar.
 *
 * Criterios de validación:
 * 1. Sin certeza excesiva → evita comprometer al profesional
 * 2. Sin extrapolaciones → solo fuentes proporcionadas
 * 3. Scope del perfil → no mezclar fueros
 * 4. Coherencia interna → conclusión consistente con análisis
 *
 * @param reasoningOutput - Output del módulo de razonamiento LIS
 * @param profile         - Perfil jurídico activo (por defecto: PROFILE_CIVIL)
 * @returns Resultado de validación con status y advertencias si aplica
 */
export function validateCivilOutput(
    reasoningOutput: ReasoningOutput,
    profile: ProfileDefinition = PROFILE_CIVIL
): ValidationResult {
    const timestamp = new Date().toISOString();
    const allIssues: ValidationIssue[] = [];

    const textoCompleto = Object.values(reasoningOutput.contenido).join(' ');

    allIssues.push(...detectarCertezaExcesiva(textoCompleto));
    allIssues.push(...detectarExtrapolaciones(textoCompleto));
    allIssues.push(...detectarViolacionScope(textoCompleto, profile));
    allIssues.push(...detectarContradicciones(reasoningOutput.contenido));

    const status = determinarStatus(allIssues);
    const advertencias = generarAdvertencias(allIssues, status);

    return {
        status,
        entregable: status !== 'rejected',
        razones: allIssues,
        output: reasoningOutput,
        advertencias: status === 'limited' ? advertencias : undefined,
        metadata: {
            checksRealizados: 4,
            issuesDetectados: allIssues.length,
            timestamp
        }
    };
}

function determinarStatus(issues: ValidationIssue[]): ValidationStatus {
    const hasCritical = issues.some(i => i.severidad === 'critical');
    const errorCount = issues.filter(i => i.severidad === 'error').length;
    const warningCount = issues.filter(i => i.severidad === 'warning').length;

    if (hasCritical) return 'rejected';
    if (errorCount >= 2) return 'rejected';
    if (errorCount === 1 || warningCount >= 2) return 'limited';
    return 'approved';
}

function generarAdvertencias(issues: ValidationIssue[], status: ValidationStatus): string[] {
    if (status === 'approved') return [];

    const advertencias: string[] = [];

    if (issues.some(i => i.tipo === 'CERTEZA_EXCESIVA')) {
        advertencias.push('El análisis expresa niveles de certeza que deben interpretarse con cautela profesional.');
    }
    if (issues.some(i => i.tipo === 'EXTRAPOLACION_NO_FUNDADA')) {
        advertencias.push('Algunas afirmaciones hacen referencia a fuentes no explícitamente proporcionadas.');
    }
    if (issues.some(i => i.tipo === 'CONTRADICCION_INTERNA')) {
        advertencias.push('Se detectaron posibles tensiones entre el análisis y la conclusión que requieren revisión profesional.');
    }

    return advertencias;
}

// ============================================
// FUNCIÓN DE RECHAZO ESTRUCTURADO
// ============================================

export function generarRechazoFundado(
    result: ValidationResult,
    profile: ProfileDefinition = PROFILE_CIVIL
): {
    mensaje: string;
    detalles: string[];
    recomendacion: string;
} {
    const criticos = result.razones.filter(r => r.severidad === 'critical');
    const errores = result.razones.filter(r => r.severidad === 'error');

    const detalles = [
        ...criticos.map(c => `[CRÍTICO] ${c.descripcion}`),
        ...errores.map(e => `[ERROR] ${e.descripcion}`)
    ];

    return {
        mensaje: 'El análisis no puede ser entregado por no superar los controles de calidad profesional.',
        detalles,
        recomendacion:
            `Se recomienda reformular la consulta con mayor precisión o ` +
            `limitar el alcance a aspectos estrictamente propios del ${profile.nombre}.`
    };
}

// ============================================
// EXPORTS PARA TESTING
// ============================================

export const _internals = {
    detectarCertezaExcesiva,
    detectarExtrapolaciones,
    detectarViolacionScope,
    detectarContradicciones,
    determinarStatus,
    generarAdvertencias,
    CERTEZA_EXCESIVA_PATTERNS,
    EXTRAPOLACION_PATTERNS,
    SCOPE_KEYWORDS_BY_FUERO
};
