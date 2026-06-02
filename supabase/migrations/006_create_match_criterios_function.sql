-- Función de búsqueda semántica por similitud coseno
-- Usada por el RAG penal para recuperar criterios relevantes

CREATE OR REPLACE FUNCTION match_criterios_juridicos(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id text,
    criterio text,
    regla_general text,
    instituto text,
    subtipo text,
    nivel_autoridad text,
    jurisdiccion text,
    articulos_cpp text[],
    data jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $func$
    SELECT
        id,
        criterio,
        regla_general,
        instituto,
        subtipo,
        nivel_autoridad,
        jurisdiccion,
        articulos_cpp,
        data,
        1 - (embedding <=> query_embedding) AS similarity
    FROM criterios_juridicos
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$func$;
