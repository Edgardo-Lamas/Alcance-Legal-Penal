-- ============================================================
-- Migración: Alcance Legal – Familiar
-- Tabla criterios_juridicos + función buscar_criterios
-- Aplicar en el proyecto Supabase: alcance-legal-familiar
--
-- Comando de deploy:
--   supabase db push --project-ref [ID-FAMILIAR]
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
    instituto TEXT NOT NULL,        -- ej: 'alimentos', 'cuidado_personal', 'divorcio'
    subtipo TEXT NOT NULL,          -- ej: 'cuota_alimentaria', 'divorcio_vincular', 'adopcion_plena'
    jurisdiccion TEXT NOT NULL,     -- 'argentina_nacional'
    alcance TEXT NOT NULL,          -- Siempre: 'criterios_generales'

    -- Metadata adicional
    criterio TEXT NOT NULL,         -- Nombre descriptivo del criterio
    regla_general TEXT NOT NULL,    -- Enunciado de la regla jurídica
    articulos_ccyc TEXT[],          -- Array de normas: ['Art. 659 CCyC', 'Ley 26.061 Art. 3', ...]
    nivel_autoridad TEXT,           -- 'vinculante', 'orientativo'
    interes_superior BOOLEAN DEFAULT FALSE,  -- TRUE si el criterio involucra interés superior del niño

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

-- Búsqueda vectorial HNSW
CREATE INDEX IF NOT EXISTS criterios_embedding_idx
ON criterios_juridicos
USING hnsw (embedding vector_cosine_ops);

-- Filtrado por alcance
CREATE INDEX IF NOT EXISTS criterios_alcance_idx
ON criterios_juridicos (alcance);

-- Filtros compuestos frecuentes
CREATE INDEX IF NOT EXISTS criterios_meta_idx
ON criterios_juridicos (instituto, subtipo, jurisdiccion);

-- Índice para filtro de interés superior del niño
CREATE INDEX IF NOT EXISTS criterios_interes_superior_idx
ON criterios_juridicos (interes_superior)
WHERE interes_superior = TRUE;

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
    interes_superior BOOLEAN,
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
        c.interes_superior,
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

-- Lectura pública de criterios generales
CREATE POLICY "Criterios públicos son visibles"
ON criterios_juridicos
FOR SELECT
USING (alcance = 'criterios_generales');

-- Solo el service role puede insertar/actualizar
CREATE POLICY "Solo service role puede modificar criterios"
ON criterios_juridicos
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE criterios_juridicos IS
    'Corpus jurídico familiar vectorizado — Alcance Legal Familiar. '
    'Normas base: CCyC Libro II (arts. 401-723), Ley 26.061, Ley 26.485.';

COMMENT ON COLUMN criterios_juridicos.embedding IS
    'Vector de 1536 dimensiones generado con OpenAI text-embedding-ada-002';

COMMENT ON COLUMN criterios_juridicos.articulos_ccyc IS
    'Array de normas familiares aplicables, ej: [''Art. 659 CCyC'', ''Ley 26.061 Art. 3'']';

COMMENT ON COLUMN criterios_juridicos.interes_superior IS
    'TRUE si el criterio involucra el principio de interés superior del niño/adolescente (Ley 26.061 Art. 3)';

COMMENT ON FUNCTION buscar_criterios IS
    'Búsqueda semántica por similitud coseno. '
    'La columna interes_superior se devuelve para que el LLM pueda destacarla en el análisis.';
