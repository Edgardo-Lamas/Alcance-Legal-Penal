-- ============================================================
-- Migración: Columna fuero para separación civil/penal en DB compartida
-- Aplicar DESPUÉS de 001_create_criterios_table.sql
--
-- Propósito: Permite que el mismo proyecto Supabase sirva múltiples
-- fueros (civil, penal) en la misma tabla criterios_juridicos.
-- El filtro filter_fuero es opcional: NULL = sin filtro (compatibilidad).
-- ============================================================

-- 1. Agregar columna fuero (NOT NULL con default 'civil' para registros existentes)
ALTER TABLE criterios_juridicos
ADD COLUMN IF NOT EXISTS fuero TEXT NOT NULL DEFAULT 'civil';

-- 2. Índice para búsqueda por fuero
CREATE INDEX IF NOT EXISTS criterios_fuero_idx
ON criterios_juridicos (fuero);

-- 3. Actualizar función buscar_criterios para aceptar filtro por fuero
CREATE OR REPLACE FUNCTION buscar_criterios(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    filter_alcance TEXT DEFAULT 'criterios_generales',
    filter_fuero TEXT DEFAULT NULL,
    filter_instituto TEXT DEFAULT NULL,
    filter_subtipo TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    criterio TEXT,
    regla_general TEXT,
    articulos_cpp TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.criterio,
        c.regla_general,
        c.articulos_cpp,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM criterios_juridicos c
    WHERE
        c.alcance = filter_alcance          -- SIEMPRE filtrar por alcance
        AND (filter_fuero IS NULL OR c.fuero = filter_fuero)  -- penal | civil | NULL
        AND (filter_instituto IS NULL OR c.instituto = filter_instituto)
        AND (filter_subtipo IS NULL OR c.subtipo = filter_subtipo)
        AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON COLUMN criterios_juridicos.fuero IS
    'Fuero jurídico del criterio: penal | civil. Permite multi-producto en DB compartida.';
