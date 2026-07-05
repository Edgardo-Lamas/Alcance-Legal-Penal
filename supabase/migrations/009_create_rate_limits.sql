-- ============================================================
-- Migración: Rate limiting persistente (sobrevive a instancias efímeras)
--
-- Las Edge Functions corren en isolates efímeros: un Map en memoria no sirve
-- como límite global (cada instancia tiene el suyo y se resetea con cada cold
-- start). Esta tabla + función atómica dan un límite real por clave (usuario o IP).
--
-- Usada por analizar-caso vía RPC check_rate_limit(). Solo service_role accede.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
    key          TEXT        PRIMARY KEY,
    count        INT         NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Solo la Edge Function (service_role) lee/escribe. Sin acceso anónimo/autenticado.
CREATE POLICY "rate_limits_service_role" ON public.rate_limits
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Chequeo atómico: incrementa el contador de la ventana y devuelve TRUE si sigue
-- dentro del límite. Reinicia la ventana si expiró. Thread-safe vía UPSERT.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key            TEXT,
    p_max            INT,
    p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count        INT;
    v_now          TIMESTAMPTZ := now();
BEGIN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE
        SET count = CASE
                WHEN public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
                THEN 1
                ELSE public.rate_limits.count + 1
            END,
            window_start = CASE
                WHEN public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
                THEN v_now
                ELSE public.rate_limits.window_start
            END
    RETURNING count INTO v_count;

    RETURN v_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO service_role;

COMMENT ON FUNCTION public.check_rate_limit IS
    'Rate limiting atómico por clave. Devuelve TRUE si la solicitud está dentro del límite. Llamar desde Edge Function con service_role.';

-- Limpieza opcional de filas viejas (correr por cron si el volumen lo justifica):
--   DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
