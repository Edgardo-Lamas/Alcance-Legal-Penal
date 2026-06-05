-- Brief estructurado por expediente
-- Persiste el contexto clave de cada causa entre sesiones de trabajo.
-- El MCP lo guarda al cerrar sesión y lo recupera al iniciar la próxima.

CREATE TABLE IF NOT EXISTS briefs_expediente (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_expediente TEXT      NOT NULL UNIQUE,
    datos           JSONB       NOT NULL DEFAULT '{}',
    ultima_sesion   TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsqueda rápida por número de expediente
CREATE INDEX IF NOT EXISTS idx_briefs_numero ON briefs_expediente (numero_expediente);

-- RLS: solo service role puede leer/escribir (acceso via Edge Function)
ALTER TABLE briefs_expediente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON briefs_expediente
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Función upsert para guardar/actualizar un brief
CREATE OR REPLACE FUNCTION upsert_brief_expediente(
    p_numero_expediente TEXT,
    p_datos             JSONB
)
RETURNS briefs_expediente
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    resultado briefs_expediente;
BEGIN
    INSERT INTO briefs_expediente (numero_expediente, datos, ultima_sesion)
    VALUES (p_numero_expediente, p_datos, now())
    ON CONFLICT (numero_expediente)
    DO UPDATE SET
        datos         = EXCLUDED.datos,
        ultima_sesion = now()
    RETURNING * INTO resultado;

    RETURN resultado;
END;
$$;
