/**
 * RAG Module - Retrieve Legal Criteria
 *
 * Búsqueda semántica en corpus jurídico penal con control de suficiencia.
 * Es agnóstico al perfil: el perfil determina qué RPC de Supabase invocar.
 * Este módulo NO razona, solo recupera y evalúa cobertura.
 *
 * Tabla del corpus (Supabase):
 *   penal_pba → RPC: buscar_criterios (tabla: criterios_juridicos)
 */

import { PROFILE_PENAL_PBA, ProfileDefinition, ProfileId } from '../profile';

// ============================================
// CONFIGURACIÓN (ajustada para fuero penal)
// ============================================

/** Cantidad máxima de resultados a recuperar. */
export const TOP_K = 5;

/**
 * Umbral mínimo de similitud coseno (0-1).
 * 0.72 = alta relevancia semántica, ligeramente más permisivo que civil
 * porque el lenguaje procesal penal es más técnico y homogéneo.
 */
export const SIMILARITY_THRESHOLD = 0.72;

/**
 * Cantidad mínima de criterios que deben superar el threshold
 * para considerar que existe "base suficiente".
 * Penal: 1 criterio verificado es suficiente para iniciar el razonamiento.
 */
export const MIN_RELEVANT_CRITERIA = 1;

// ============================================
// MAPEO DE RPC POR PERFIL
// ============================================

/**
 * Nombre del RPC de Supabase para cada perfil.
 * En el proyecto penal hay un único perfil y una única tabla.
 */
const CORPUS_RPC_BY_PROFILE: Record<ProfileId, string> = {
    penal_pba: 'buscar_criterios'
} as const;

// ============================================
// TIPOS
// ============================================

export interface CriterioRecuperado {
    /** ID único del criterio (ej: PENAL-GAR-001) */
    id: string;
    /** Nombre descriptivo del criterio */
    criterio: string;
    /** Enunciado de la regla general */
    reglaGeneral: string;
    /** Artículos del CPP PBA / Código Penal aplicables */
    articulosCpp: string[];
    /** Similitud coseno con la consulta (0-1) */
    similarity: number;
}

export interface RAGResult {
    /** Si hay base suficiente para continuar al razonamiento */
    baseSuficiente: boolean;
    /** Código de resultado para logging */
    codigo: RAGResultCode;
    /** Criterios recuperados (ordenados por relevancia) */
    criterios: CriterioRecuperado[];
    /** Cantidad de criterios que superan el threshold */
    criteriosRelevantes: number;
    /** Fundamento del rechazo (solo si baseSuficiente = false) */
    fundamento?: string;
    /** Metadata para debugging */
    metadata: {
        topK: number;
        threshold: number;
        minRequired: number;
        perfilId: string;
        rpcInvocada: string;
        timestamp: string;
    };
}

export type RAGResultCode =
    | 'BASE_SUFICIENTE'
    | 'BASE_INSUFICIENTE_SIN_RESULTADOS'
    | 'BASE_INSUFICIENTE_BAJA_RELEVANCIA';

export interface QueryEmbedding {
    /** Vector de embedding (1536 dimensiones para ada-002) */
    embedding: number[];
}

export interface RetrieveOptions {
    /** Filtro opcional por instituto jurídico (ej: 'garantias_procesales') */
    filterInstituto?: string;
    /** Filtro opcional por subtipo (ej: 'in_dubio_pro_reo') */
    filterSubtipo?: string;
}

// ============================================
// INTERFAZ DE SUPABASE (tipo esperado del RPC)
// ============================================

interface SupabaseClient {
    rpc: (
        fnName: string,
        params: Record<string, unknown>
    ) => Promise<{
        data: SupabaseRPCResult[] | null;
        error: { message: string } | null;
    }>;
}

interface SupabaseRPCResult {
    id: string;
    criterio: string;
    regla_general: string;
    articulos_cpp: string[];
    similarity: number;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Recupera criterios jurídicos penales del corpus mediante búsqueda semántica.
 *
 * Reglas de suficiencia:
 * 1. Debe haber al menos MIN_RELEVANT_CRITERIA criterios
 * 2. Cada criterio debe superar SIMILARITY_THRESHOLD
 * 3. Si no hay base suficiente, el sistema rechaza SIN razonar
 *
 * @param supabase - Cliente de Supabase inicializado
 * @param query    - Embedding de la consulta del usuario
 * @param options  - Filtros opcionales por instituto/subtipo
 * @param profile  - Perfil jurídico activo (por defecto: PROFILE_PENAL_PBA)
 * @returns Resultado estructurado con criterios o indicador de insuficiencia
 */
export async function retrieveCivilCriteria(
    supabase: SupabaseClient,
    query: QueryEmbedding,
    options: RetrieveOptions = {},
    profile: ProfileDefinition = PROFILE_PENAL_PBA
): Promise<RAGResult> {
    const timestamp = new Date().toISOString();
    const rpcName = CORPUS_RPC_BY_PROFILE[profile.id];

    const baseMetadata = {
        topK: TOP_K,
        threshold: SIMILARITY_THRESHOLD,
        minRequired: MIN_RELEVANT_CRITERIA,
        perfilId: profile.id,
        rpcInvocada: rpcName,
        timestamp
    };

    // Llamar a la función RPC del corpus
    const { data, error } = await supabase.rpc(rpcName, {
        query_embedding: query.embedding,
        match_count: TOP_K,
        filter_instituto: options.filterInstituto ?? null,
        filter_subtipo: options.filterSubtipo ?? null
    });

    if (error) {
        throw new Error(`Error en búsqueda RAG (${profile.nombre}): ${error.message}`);
    }

    // Sin resultados
    if (!data || data.length === 0) {
        return {
            baseSuficiente: false,
            codigo: 'BASE_INSUFICIENTE_SIN_RESULTADOS',
            criterios: [],
            criteriosRelevantes: 0,
            fundamento:
                `No se encontraron criterios jurídicos en el corpus ${profile.nombre} para esta consulta. ` +
                'El sistema no puede emitir opinión defensiva sin base normativa o jurisprudencial verificada.',
            metadata: baseMetadata
        };
    }

    // Transformar resultados
    const criteriosTransformados: CriterioRecuperado[] = data.map(row => ({
        id: row.id,
        criterio: row.criterio,
        reglaGeneral: row.regla_general,
        articulosCpp: row.articulos_cpp ?? [],
        similarity: row.similarity
    }));

    // Filtrar por threshold de relevancia
    const criteriosRelevantes = criteriosTransformados.filter(
        c => c.similarity >= SIMILARITY_THRESHOLD
    );

    // Evaluar suficiencia
    if (criteriosRelevantes.length < MIN_RELEVANT_CRITERIA) {
        return {
            baseSuficiente: false,
            codigo: 'BASE_INSUFICIENTE_BAJA_RELEVANCIA',
            criterios: criteriosTransformados, // Retornar todos para debugging
            criteriosRelevantes: criteriosRelevantes.length,
            fundamento:
                `Se encontraron ${data.length} criterios, pero ninguno supera ` +
                `el umbral de relevancia requerido (${SIMILARITY_THRESHOLD}). ` +
                'El sistema requiere al menos un criterio verificado para emitir una opinión fundada.',
            metadata: baseMetadata
        };
    }

    return {
        baseSuficiente: true,
        codigo: 'BASE_SUFICIENTE',
        criterios: criteriosRelevantes,
        criteriosRelevantes: criteriosRelevantes.length,
        metadata: baseMetadata
    };
}

// ============================================
// CONSTANTES EXPORTADAS
// ============================================

export const RAG_CONFIG = {
    TOP_K,
    SIMILARITY_THRESHOLD,
    MIN_RELEVANT_CRITERIA,
    CORPUS_RPC_BY_PROFILE
} as const;
