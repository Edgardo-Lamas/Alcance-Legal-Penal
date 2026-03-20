/**
 * RAG Module - Retrieve Legal Criteria
 *
 * Búsqueda semántica en corpus jurídico con control de suficiencia.
 * Es agnóstico al perfil: el perfil determina qué RPC de Supabase invocar.
 * Este módulo NO razona, solo recupera y evalúa cobertura.
 *
 * Tabla de corpus por perfil (Supabase):
 *   civil      → RPC: buscar_criterios         (tabla: criterios_civil)
 *   comercial  → RPC: buscar_criterios_comercial (tabla: criterios_comercial)
 *   familiar   → RPC: buscar_criterios_familiar  (tabla: criterios_familiar)
 */

import { PROFILE_CIVIL, ProfileDefinition, ProfileId } from '../profile';

// ============================================
// CONFIGURACIÓN
// ============================================

/** Cantidad máxima de resultados a recuperar. */
export const TOP_K = 5;

/**
 * Umbral mínimo de similitud coseno (0-1).
 * 0.75 = alta relevancia semántica requerida.
 */
export const SIMILARITY_THRESHOLD = 0.75;

/**
 * Cantidad mínima de criterios que deben superar el threshold
 * para considerar que existe "base suficiente".
 */
export const MIN_RELEVANT_CRITERIA = 2;

// ============================================
// MAPEO DE RPC POR PERFIL
// ============================================

/**
 * Nombre del RPC de Supabase para cada perfil.
 * Arquitectura "Un repo, tres Supabase": cada producto tiene su propio
 * proyecto Supabase con la misma función 'buscar_criterios'.
 * El aislamiento de datos lo provee el proyecto Supabase, no el nombre del RPC.
 */
const CORPUS_RPC_BY_PROFILE: Record<ProfileId, string> = {
    civil:      'buscar_criterios',
    comercial:  'buscar_criterios',
    familiar:   'buscar_criterios'
} as const;

// ============================================
// TIPOS
// ============================================

export interface CriterioRecuperado {
    /** ID único del criterio (ej: RC-EXT-001) */
    id: string;
    /** Nombre descriptivo del criterio */
    criterio: string;
    /** Enunciado de la regla general */
    reglaGeneral: string;
    /** Artículos del código aplicable (CCyC u otro según fuero) */
    articulosCcyc: string[];
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
    /** Filtro opcional por instituto jurídico */
    filterInstituto?: string;
    /** Filtro opcional por subtipo */
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
    articulos_ccyc: string[];
    similarity: number;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Recupera criterios jurídicos del corpus del perfil activo mediante búsqueda semántica.
 *
 * Reglas de suficiencia:
 * 1. Debe haber al menos MIN_RELEVANT_CRITERIA criterios
 * 2. Cada criterio debe superar SIMILARITY_THRESHOLD
 * 3. Si no hay base suficiente, el sistema puede rechazar SIN razonar
 *
 * @param supabase - Cliente de Supabase inicializado
 * @param query    - Embedding de la consulta del usuario
 * @param options  - Filtros opcionales por instituto/subtipo
 * @param profile  - Perfil jurídico activo (por defecto: PROFILE_CIVIL)
 * @returns Resultado estructurado con criterios o indicador de insuficiencia
 */
export async function retrieveCivilCriteria(
    supabase: SupabaseClient,
    query: QueryEmbedding,
    options: RetrieveOptions = {},
    profile: ProfileDefinition = PROFILE_CIVIL
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

    // Llamar a la función RPC del corpus correspondiente al perfil
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
                'El sistema no puede emitir opinión sin base normativa o jurisprudencial verificada.',
            metadata: baseMetadata
        };
    }

    // Transformar resultados
    const criteriosTransformados: CriterioRecuperado[] = data.map(row => ({
        id: row.id,
        criterio: row.criterio,
        reglaGeneral: row.regla_general,
        articulosCcyc: row.articulos_ccyc ?? [],
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
                `Se encontraron ${data.length} criterios, pero solo ${criteriosRelevantes.length} ` +
                `superan el umbral de relevancia requerido (${SIMILARITY_THRESHOLD}). ` +
                'El sistema requiere al menos 2 criterios verificados para emitir una opinión fundada.',
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
