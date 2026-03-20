/**
 * Admissibility Check Module - Alcance Legal
 *
 * Valida que una consulta sea admisible ANTES de invocar RAG o LLM.
 * Actúa como "guardián" (gate) del pipeline.
 * Es agnóstico al perfil: funciona igual para Civil, Comercial y Familiar.
 */

import {
    PROFILE_CIVIL,
    ProfileDefinition,
    Fuero,
    ActoJuridico,
} from './profile';

// ============================================
// TIPOS DE INPUT/OUTPUT
// ============================================

export interface ConsultaInput {
    /** Texto de la consulta del usuario */
    texto: string;
    /** Fuero declarado por el usuario (opcional, se infiere si no se provee) */
    fueroDeclared?: Fuero;
    /** Tipo de acto jurídico solicitado */
    acto: ActoJuridico;
    /** Hechos del caso (opcional pero recomendado) */
    hechos?: string;
}

export interface AdmissibilityResult {
    /** Si la consulta es admisible */
    admitida: boolean;
    /** Código de resultado para logging/analytics */
    codigo: AdmissibilityCode;
    /** Fundamento del rechazo (solo si admitida = false) */
    fundamento?: string;
    /** Metadata adicional para debugging */
    metadata: {
        perfilUsado: string;
        fueroDetectado: Fuero | null;
        timestamp: string;
    };
}

export type AdmissibilityCode =
    | 'ADMITIDA'
    | 'RECHAZADA_FUERO_EXCLUIDO'
    | 'RECHAZADA_HECHOS_INSUFICIENTES'
    | 'RECHAZADA_CONSULTA_HIBRIDA'
    | 'RECHAZADA_ACTO_NO_ADMITIDO';

// ============================================
// KEYWORDS PARA DETECCIÓN DE FUEROS
// ============================================

const FUERO_KEYWORDS: Record<Fuero, readonly string[]> = {
    civil: [
        'contrato', 'daños', 'perjuicios', 'obligaciones', 'propiedad',
        'sucesión', 'herencia', 'locación', 'alquiler', 'responsabilidad civil',
        'usucapión', 'servidumbre', 'hipoteca', 'prenda', 'fianza',
        'incumplimiento contractual', 'resolución', 'rescisión', 'nulidad'
    ],
    comercial: [
        'sociedad', 'quiebra', 'concurso', 'cheque', 'pagaré', 'letra de cambio',
        'comerciante', 'empresa', 'accionista', 'directorio', 'SRL', 'SA',
        'fusión', 'escisión', 'transferencia de fondo de comercio',
        'concurso preventivo', 'fideicomiso comercial', 'contrato de agencia',
        'franquicia', 'factoring', 'leasing'
    ],
    penal: [
        'delito', 'crimen', 'homicidio', 'robo', 'hurto', 'estafa',
        'prisión', 'cárcel', 'imputado', 'fiscal', 'querella criminal',
        'denuncia penal', 'sobreseimiento', 'condena'
    ],
    laboral: [
        'despido', 'indemnización laboral', 'trabajo', 'empleador', 'empleado',
        'sindicato', 'convenio colectivo', 'accidente de trabajo', 'ART',
        'LCT', 'relación de dependencia', 'aguinaldo', 'vacaciones'
    ],
    familia: [
        'divorcio', 'alimentos', 'tenencia', 'régimen de visitas', 'adopción',
        'filiación', 'patria potestad', 'guarda', 'tutela', 'curatela',
        'violencia familiar', 'compensación económica', 'unión convivencial',
        'cuidado personal', 'responsabilidad parental', 'bien de familia'
    ]
} as const;

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Detecta fueros mencionados en el texto de la consulta.
 * Este detector es universal: identifica todos los fueros presentes,
 * independientemente del perfil activo.
 */
function detectarFueros(texto: string): Fuero[] {
    const textoLower = texto.toLowerCase();
    const fuerosDetectados: Fuero[] = [];

    for (const [fuero, keywords] of Object.entries(FUERO_KEYWORDS)) {
        const tieneKeyword = keywords.some(kw => textoLower.includes(kw.toLowerCase()));
        if (tieneKeyword) {
            fuerosDetectados.push(fuero as Fuero);
        }
    }

    return fuerosDetectados;
}

/**
 * Valida que existan hechos mínimos en la consulta
 */
function validarHechosMinimos(input: ConsultaInput): boolean {
    const textoCompleto = `${input.texto} ${input.hechos || ''}`.trim();
    const palabras = textoCompleto.split(/\s+/).filter(p => p.length > 2);
    return textoCompleto.length >= 20 && palabras.length >= 3;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Verifica la admisibilidad de una consulta respecto a un perfil dado.
 *
 * Orden de validación:
 * 1. Acto jurídico admitido en el perfil
 * 2. Hechos mínimos presentes
 * 3. Fuero corresponde al perfil (no hay fueros excluidos sin el fuero admitido)
 * 4. No es consulta híbrida (fuero admitido + fueros excluidos simultáneamente)
 *
 * @param input   - La consulta a validar
 * @param profile - Perfil jurídico activo (por defecto: PROFILE_CIVIL)
 * @returns Resultado estructurado de admisibilidad
 */
export function checkAdmissibility(
    input: ConsultaInput,
    profile: ProfileDefinition = PROFILE_CIVIL
): AdmissibilityResult {
    const timestamp = new Date().toISOString();
    const fuerosDetectados = detectarFueros(input.texto);
    const fueroDetectado = fuerosDetectados.length === 1 ? fuerosDetectados[0] : null;

    const baseMetadata = {
        perfilUsado: profile.nombre,
        fueroDetectado,
        timestamp
    };

    // 1. Validar acto admitido en este perfil
    if (!profile.actosAdmitidos.includes(input.acto)) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_ACTO_NO_ADMITIDO',
            fundamento: `El acto "${input.acto}" no está admitido en el perfil ${profile.nombre}.`,
            metadata: baseMetadata
        };
    }

    // 2. Validar hechos mínimos
    if (!validarHechosMinimos(input)) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_HECHOS_INSUFICIENTES',
            fundamento: profile.politicaRechazo.mensajeHechosInsuficientes,
            metadata: baseMetadata
        };
    }

    // 3. Detectar fueros excluidos para este perfil
    const fuerosExcluidosPresentes = fuerosDetectados.filter(f =>
        profile.fuerosExcluidos.includes(f)
    );
    const fueroAdmitidoPresente = fuerosDetectados.includes(profile.fueroAdmitido);

    // Solo fueros excluidos, sin el fuero admitido → fuera de competencia
    if (fuerosExcluidosPresentes.length > 0 && !fueroAdmitidoPresente) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_FUERO_EXCLUIDO',
            fundamento: profile.politicaRechazo.mensajeFueraDeCompetencia,
            metadata: baseMetadata
        };
    }

    // 4. Fuero admitido + fueros excluidos → consulta híbrida
    if (fueroAdmitidoPresente && fuerosExcluidosPresentes.length > 0) {
        return {
            admitida: false,
            codigo: 'RECHAZADA_CONSULTA_HIBRIDA',
            fundamento: profile.politicaRechazo.mensajeConsultaHibrida,
            metadata: baseMetadata
        };
    }

    // 5. Consulta admitida
    return {
        admitida: true,
        codigo: 'ADMITIDA',
        metadata: baseMetadata
    };
}

// ============================================
// EXPORTS ADICIONALES PARA TESTING
// ============================================

export const _internals = {
    detectarFueros,
    validarHechosMinimos,
    FUERO_KEYWORDS
};
