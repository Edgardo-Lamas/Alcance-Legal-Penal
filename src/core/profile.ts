/**
 * Profile Definition - Alcance Legal Penal
 *
 * Perfil único: Defensa Penal — Provincia de Buenos Aires
 * Código procesal: CPP PBA (Ley 11.922, sistema acusatorio)
 */

export type ProfileId = 'penal_pba';

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
    readonly fuerosExcluidosKeywords: readonly string[];
    readonly politicaRechazo: {
        readonly mensajeHechosInsuficientes: string;
        readonly mensajeFueraDeCompetencia: string;
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
            'Este sistema opera exclusivamente en el análisis de causas penales (CPP PBA / CP).'
    }
} as const;
