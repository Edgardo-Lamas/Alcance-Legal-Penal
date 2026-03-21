/**
 * Profile Definition - Alcance Legal Penal
 *
 * Perfil único: Defensa Penal — Provincia de Buenos Aires
 * Código procesal: CPP PBA (Ley 11.922, sistema acusatorio)
 */

export type ProfileId = 'penal_pba';

/** Fueros del sistema judicial argentino — usado para detección de scope */
export type Fuero = 'civil' | 'comercial' | 'penal' | 'laboral' | 'familia';

export type ActoJuridico =
    | 'analizar_caso'
    | 'analizar_prueba'
    | 'detectar_nulidades'
    | 'contraargumentar_acusacion'
    | 'revisar_estrategia';

export interface ProfileDefinition {
    readonly id: ProfileId;
    readonly nombre: string;
    readonly descripcion: string;
    readonly jurisdiccion: string;
    readonly codigoInforme: string;
    readonly actosAdmitidos: readonly ActoJuridico[];
    /** Fuero principal que este perfil analiza */
    readonly fueroAdmitido: Fuero;
    /** Fueros cuya presencia en la consulta activa el rechazo */
    readonly fuerosExcluidos: readonly Fuero[];
    /** Keywords textuales de los fueros excluidos (para admisibilidad) */
    readonly fuerosExcluidosKeywords: readonly string[];
    readonly politicaRechazo: {
        readonly mensajeHechosInsuficientes: string;
        readonly mensajeFueraDeCompetencia: string;
        readonly mensajeConsultaHibrida: string;
    };
}

export const PROFILE_PENAL_PBA: ProfileDefinition = {
    id: 'penal_pba',
    nombre: 'Alcance Legal Penal — PBA',
    descripcion: 'Sistema de análisis jurídico penal para defensa en Provincia de Buenos Aires',
    jurisdiccion: 'provincia_buenos_aires',
    codigoInforme: 'PENAL-PBA',

    actosAdmitidos: [
        'analizar_caso',
        'analizar_prueba',
        'detectar_nulidades',
        'contraargumentar_acusacion',
        'revisar_estrategia'
    ] as const,

    fueroAdmitido: 'penal',

    fuerosExcluidos: ['civil', 'comercial', 'laboral', 'familia'] as const,

    fuerosExcluidosKeywords: [
        'divorcio', 'alimentos', 'sociedad anónima', 'quiebra',
        'contrato de locación', 'sucesión hereditaria', 'despido laboral'
    ],

    politicaRechazo: {
        mensajeHechosInsuficientes:
            'La consulta no contiene hechos suficientes para emitir un análisis fundado. ' +
            'Proporcione: descripción de los hechos imputados, norma aplicada por la acusación, ' +
            'prueba invocada, y la pretensión defensiva específica.',
        mensajeFueraDeCompetencia:
            'Esta consulta involucra materia ajena al fuero penal. ' +
            'Este sistema opera exclusivamente en el análisis de causas penales (CPP PBA / CP).',
        mensajeConsultaHibrida:
            'La consulta mezcla materia penal con otro fuero (civil, comercial, laboral o familia). ' +
            'Este sistema analiza exclusivamente la dimensión penal. ' +
            'Reformule la consulta limitándola a los hechos y prueba de la causa penal.'
    }
} as const;
