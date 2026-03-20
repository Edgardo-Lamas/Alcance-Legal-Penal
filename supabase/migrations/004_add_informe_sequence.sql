-- ============================================================
-- Migración: Secuencia de numeración de informes — Civil
-- Aplicar en el proyecto Supabase: alcance-legal-civil (existente)
--
-- Comando de deploy:
--   supabase db push --project-ref [ID-CIVIL]
--
-- Propósito: Reemplazar Math.random() con un contador atómico y
-- secuencial garantizado por PostgreSQL. Evita duplicados incluso
-- con múltiples instancias de la Edge Function corriendo en paralelo.
-- ============================================================

-- Secuencia de numeración de informes civiles
CREATE SEQUENCE IF NOT EXISTS numero_informe_civil_seq
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE;

-- RPC accesible desde la Edge Function con service_role
CREATE OR REPLACE FUNCTION siguiente_numero_informe_civil()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT nextval('numero_informe_civil_seq');
$$;

-- Solo service_role puede ejecutar esta función
REVOKE ALL ON FUNCTION siguiente_numero_informe_civil() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION siguiente_numero_informe_civil() TO service_role;

-- Documentación
COMMENT ON SEQUENCE numero_informe_civil_seq IS
    'Contador atómico para numeración de informes ALC-CIVIL-YYYY-NNNNNN';

COMMENT ON FUNCTION siguiente_numero_informe_civil IS
    'Retorna el próximo número de informe civil. '
    'Thread-safe: usa nextval() de PostgreSQL. '
    'Llamar desde Edge Function con service_role key.';
