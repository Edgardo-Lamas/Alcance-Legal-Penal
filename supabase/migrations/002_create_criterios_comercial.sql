-- ============================================================
-- Migración: Alcance Legal – Comercial
-- Tabla criterios_juridicos + función buscar_criterios
-- Aplicar en el proyecto Supabase: alcance-legal-comercial
--
-- Comando de deploy:
--   supabase db push --project-ref [ID-COMERCIAL]
-- ============================================================

-- Habilitar extensión pgvector (ya instalada en Supabase por defecto)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLA PRINCIPAL
-- ============================================================

CREATE TABLE IF NOT EXISTS criterios_juridicos (
    id TEXT PRIMARY KEY,

    -- Contenido para embedding
    contenido TEXT NOT NULL,        -- Texto completo vectorizado

    -- Metadata obligatoria
    instituto TEXT NOT NULL,        -- ej: 'sociedades_comerciales', 'concursos_quiebras'
    subtipo TEXT NOT NULL,          -- ej: 'srl', 'sociedad_anonima', 'concurso_preventivo'
    jurisdiccion TEXT NOT NULL,     -- 'argentina_nacional'
    alcance TEXT NOT NULL,          -- Siempre: 'criterios_generales'

    -- Metadata adicional
    criterio TEXT NOT NULL,         -- Nombre descriptivo del criterio
    regla_general TEXT NOT NULL,    -- Enunciado de la regla jurídica
    articulos_ccyc TEXT[],          -- Array de normas: ['Art. 146 LGS', 'Art. 54 LGS', ...]
    nivel_autoridad TEXT,           -- 'vinculante', 'orientativo'

    -- Datos estructurados completos (JSON original)
    data JSONB NOT NULL,

    -- Vector embedding (1536 dimensiones para OpenAI text-embedding-ada-002)
    embedding VECTOR(1536),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Búsqueda vectorial HNSW (más rápido que IVFFlat para queries en tiempo real)
CREATE INDEX IF NOT EXISTS criterios_embedding_idx
ON criterios_juridicos
USING hnsw (embedding vector_cosine_ops);

-- Filtrado por alcance
CREATE INDEX IF NOT EXISTS criterios_alcance_idx
ON criterios_juridicos (alcance);

-- Filtros compuestos frecuentes
CREATE INDEX IF NOT EXISTS criterios_meta_idx
ON criterios_juridicos (instituto, subtipo, jurisdiccion);

-- ============================================================
-- FUNCIÓN DE BÚSQUEDA SEMÁNTICA
-- ============================================================

CREATE OR REPLACE FUNCTION buscar_criterios(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    filter_alcance TEXT DEFAULT 'criterios_generales',
    filter_instituto TEXT DEFAULT NULL,
    filter_subtipo TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    criterio TEXT,
    regla_general TEXT,
    articulos_ccyc TEXT[],
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
        c.articulos_ccyc,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM criterios_juridicos c
    WHERE
        c.alcance = filter_alcance
        AND (filter_instituto IS NULL OR c.instituto = filter_instituto)
        AND (filter_subtipo IS NULL OR c.subtipo = filter_subtipo)
        AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE criterios_juridicos ENABLE ROW LEVEL SECURITY;

-- Lectura pública de criterios generales (permite llamadas desde Edge Functions con anon key)
CREATE POLICY "Criterios públicos son visibles"
ON criterios_juridicos
FOR SELECT
USING (alcance = 'criterios_generales');

-- Solo el service role puede insertar/actualizar (scripts de ingesta)
CREATE POLICY "Solo service role puede modificar criterios"
ON criterios_juridicos
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE criterios_juridicos IS
    'Corpus jurídico comercial vectorizado — Alcance Legal Comercial. '
    'Normas base: LGS 19.550, LCQ 24.522, CCyC (parte comercial).';

COMMENT ON COLUMN criterios_juridicos.embedding IS
    'Vector de 1536 dimensiones generado con OpenAI text-embedding-ada-002';

COMMENT ON COLUMN criterios_juridicos.articulos_ccyc IS
    'Array de normas comerciales aplicables, ej: [''Art. 146 LGS'', ''Art. 54 LGS'']';

COMMENT ON FUNCTION buscar_criterios IS
    'Búsqueda semántica por similitud coseno. '
    'filter_alcance SIEMPRE debe ser ''criterios_generales'' en producción.';
