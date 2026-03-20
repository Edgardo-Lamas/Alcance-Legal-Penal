-- ============================================================
-- Migración: Secuencia de numeración de informes — Penal PBA
-- Aplicar en el proyecto Supabase: alcance-legal-penal (nuevo)
--
-- Propósito: Contador atómico para numeración de informes.
-- Evita duplicados con múltiples instancias de Edge Function.
-- ============================================================

-- Secuencia de numeración de informes penales
CREATE SEQUENCE IF NOT EXISTS numero_informe_penal_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE;

-- RPC accesible desde la Edge Function con service_role
CREATE OR REPLACE FUNCTION siguiente_numero_informe_penal()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT nextval('numero_informe_penal_seq');
$$;

-- Solo service_role puede ejecutar esta función
REVOKE ALL ON FUNCTION siguiente_numero_informe_penal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION siguiente_numero_informe_penal() TO service_role;

-- Documentación
COMMENT ON SEQUENCE numero_informe_penal_seq IS
    'Contador atómico para numeración de informes ALC-PENAL-PBA-YYYY-NNNNNN';

COMMENT ON FUNCTION siguiente_numero_informe_penal IS
    'Retorna el próximo número de informe penal. '
    'Thread-safe: usa nextval() de PostgreSQL. '
    'Llamar desde Edge Function con service_role key.';
