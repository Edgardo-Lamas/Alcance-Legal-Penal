/**
 * Profile Definition - Alcance Legal
 *
 * Define los perfiles jurídicos del sistema (Civil, Comercial, Familiar).
 * Cada perfil actúa como "contrato de configuración" para su fuero.
 * Los tres comparten la misma interfaz → misma base de código, perfiles distintos.
 */

// ============================================
// TIPOS
// ============================================

export type Fuero = 'civil' | 'comercial' | 'penal' | 'laboral' | 'familia';

export type ActoJuridico =
    | 'analizar_caso'
    | 'auditar_estrategia'
    | 'redactar_escrito'
    | 'revisar_documento';

export type ProfileId = 'civil' | 'comercial' | 'familiar';

export interface ProfileDefinition {
    /** Identificador único del perfil */
    readonly id: ProfileId;
    /** Nombre completo del producto */
    readonly nombre: string;
    /** Descripción del rol del sistema */
    readonly descripcion: string;
    /** Fuero jurídico que este perfil atiende */
    readonly fueroAdmitido: Fuero;
    /** Fueros que este perfil rechaza explícitamente */
    readonly fuerosExcluidos: readonly Fuero[];
    /** Actos jurídicos que este perfil puede realizar */
    readonly actosAdmitidos: readonly ActoJuridico[];
    /** Prefijo para numeración de informes (ej: "CIVIL", "COMERCIAL", "FAMILIAR") */
    readonly codigoInforme: string;
    /** Mensajes de rechazo específicos para el fuero */
    readonly politicaRechazo: {
        readonly habilitado: boolean;
        readonly mensajeFueraDeCompetencia: string;
        readonly mensajeHechosInsuficientes: string;
        readonly mensajeConsultaHibrida: string;
    };
}

// ============================================
// PERFIL: CIVIL
// ============================================

export const PROFILE_CIVIL: ProfileDefinition = {
    id: 'civil',
    nombre: 'Alcance Legal – Civil',
    descripcion: 'Asociado Senior Digital especializado exclusivamente en Derecho Civil Argentino',

    fueroAdmitido: 'civil',
    fuerosExcluidos: ['comercial', 'penal', 'laboral', 'familia'] as const,

    actosAdmitidos: [
        'analizar_caso',
        'auditar_estrategia',
        'redactar_escrito',
        'revisar_documento'
    ] as const,

    codigoInforme: 'CIVIL',

    politicaRechazo: {
        habilitado: true,
        mensajeFueraDeCompetencia:
            'Esta consulta corresponde a un fuero distinto al Civil. ' +
            'Alcance Legal – Civil opera exclusivamente dentro del Derecho Civil. ' +
            'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
        mensajeHechosInsuficientes:
            'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
            'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
        mensajeConsultaHibrida:
            'La consulta involucra aspectos de múltiples fueros. ' +
            'Este sistema solo puede operar sobre cuestiones estrictamente civiles. ' +
            'Reformule la consulta excluyendo los aspectos no civiles.'
    }
} as const;

// ============================================
// PERFIL: COMERCIAL
// ============================================

export const PROFILE_COMERCIAL: ProfileDefinition = {
    id: 'comercial',
    nombre: 'Alcance Legal – Comercial',
    descripcion: 'Asociado Senior Digital especializado exclusivamente en Derecho Comercial y Societario Argentino',

    fueroAdmitido: 'comercial',
    fuerosExcluidos: ['civil', 'penal', 'laboral', 'familia'] as const,

    actosAdmitidos: [
        'analizar_caso',
        'auditar_estrategia',
        'redactar_escrito',
        'revisar_documento'
    ] as const,

    codigoInforme: 'COMERCIAL',

    politicaRechazo: {
        habilitado: true,
        mensajeFueraDeCompetencia:
            'Esta consulta corresponde a un fuero distinto al Comercial. ' +
            'Alcance Legal – Comercial opera exclusivamente dentro del Derecho Comercial y Societario. ' +
            'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
        mensajeHechosInsuficientes:
            'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
            'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
        mensajeConsultaHibrida:
            'La consulta involucra aspectos de múltiples fueros. ' +
            'Este sistema solo puede operar sobre cuestiones estrictamente comerciales. ' +
            'Reformule la consulta excluyendo los aspectos no comerciales.'
    }
} as const;

// ============================================
// PERFIL: FAMILIAR
// ============================================

export const PROFILE_FAMILIAR: ProfileDefinition = {
    id: 'familiar',
    nombre: 'Alcance Legal – Familiar',
    descripcion: 'Asociado Senior Digital especializado exclusivamente en Derecho de Familia Argentino',

    fueroAdmitido: 'familia',
    fuerosExcluidos: ['civil', 'comercial', 'penal', 'laboral'] as const,

    actosAdmitidos: [
        'analizar_caso',
        'auditar_estrategia',
        'redactar_escrito',
        'revisar_documento'
    ] as const,

    codigoInforme: 'FAMILIAR',

    politicaRechazo: {
        habilitado: true,
        mensajeFueraDeCompetencia:
            'Esta consulta corresponde a un fuero distinto al de Familia. ' +
            'Alcance Legal – Familiar opera exclusivamente dentro del Derecho de Familia. ' +
            'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
        mensajeHechosInsuficientes:
            'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
            'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
        mensajeConsultaHibrida:
            'La consulta involucra aspectos de múltiples fueros. ' +
            'Este sistema solo puede operar sobre cuestiones estrictamente familiares. ' +
            'Reformule la consulta excluyendo los aspectos ajenos al Derecho de Familia.'
    }
} as const;

// ============================================
// REGISTRO DE PERFILES
// ============================================

export const PROFILES: Record<ProfileId, ProfileDefinition> = {
    civil: PROFILE_CIVIL,
    comercial: PROFILE_COMERCIAL,
    familiar: PROFILE_FAMILIAR
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Verifica si un fuero está excluido en el perfil dado.
 * Si no se pasa perfil, usa PROFILE_CIVIL (retrocompatibilidad).
 */
export function isFueroExcluido(fuero: Fuero, profile: ProfileDefinition = PROFILE_CIVIL): boolean {
    return profile.fuerosExcluidos.includes(fuero);
}

/**
 * Verifica si un acto jurídico está admitido en el perfil dado.
 * Si no se pasa perfil, usa PROFILE_CIVIL (retrocompatibilidad).
 */
export function isActoAdmitido(acto: ActoJuridico, profile: ProfileDefinition = PROFILE_CIVIL): boolean {
    return profile.actosAdmitidos.includes(acto);
}

/**
 * Obtiene un perfil por su ID.
 * Si no se pasa ID, retorna PROFILE_CIVIL (retrocompatibilidad).
 */
export function getActiveProfile(id?: ProfileId): ProfileDefinition {
    if (!id) return PROFILE_CIVIL;
    return PROFILES[id];
}
