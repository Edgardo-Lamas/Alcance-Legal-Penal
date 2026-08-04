-- ============================================================
-- 011_feedback_y_admin.sql
--
-- El panel de Admin estaba roto de raíz y arrastraba una pérdida de datos.
-- Descubierto el 2026-08-04 al correr el sistema de punta a punta:
--
--   · `profiles` NO EXISTE en este proyecto Supabase. Admin.jsx la consultaba
--     y la página no cargaba nunca. Quedó del proyecto anterior, dado de baja.
--   · `feedback` TAMPOCO EXISTE, y BetaFeedback.jsx viene insertando ahí desde
--     que se lanzó la beta: todo lo que escribieron los abogados se perdió en
--     silencio, porque el componente nunca miró el error del insert.
--   · `isAdmin` sale de profile.is_admin, y como el perfil nunca cargaba, era
--     false SIEMPRE: nadie podía entrar al panel, ni siquiera Edgardo.
--
-- Esta migración crea lo que falta y deja las métricas saliendo de las tablas
-- que sí existen (analisis + suscripciones), no de una tabla fantasma.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Feedback de la beta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tipo_analisis  TEXT,
    -- true = "Sí, fue útil" · false = "Puede mejorar"
    rating         BOOLEAN,
    comentario     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback (created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- El abogado deja feedback pero no lee el de los demás: sin política de SELECT
-- para authenticated, sólo la RPC de métricas (SECURITY DEFINER) lo agrega.
DROP POLICY IF EXISTS feedback_insert_propio ON public.feedback;
CREATE POLICY feedback_insert_propio ON public.feedback
    FOR INSERT TO authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ------------------------------------------------------------
-- 2. Marca de administrador
-- ------------------------------------------------------------
-- Vive en suscripciones porque es la tabla que ya identifica a la cuenta.
-- Sólo se cambia por SQL: no hay ningún camino desde la app para auto-ascenderse.
ALTER TABLE public.suscripciones
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- 3. Métricas del panel
-- ------------------------------------------------------------
-- Una sola RPC en vez de que el frontend arme las cuentas: los datos que
-- necesita (emails, altas, uso agregado) viven en auth.users y en filas de
-- otros usuarios, y nada de eso puede quedar expuesto por RLS a cualquiera.
-- SECURITY DEFINER + chequeo explícito de admin adentro.
CREATE OR REPLACE FUNCTION public.admin_metricas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_es_admin BOOLEAN;
    v_resultado JSONB;
BEGIN
    SELECT COALESCE(s.is_admin, false) INTO v_es_admin
    FROM public.suscripciones s
    WHERE s.user_id = auth.uid();

    IF NOT COALESCE(v_es_admin, false) THEN
        RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'usuarios', (
            SELECT COALESCE(jsonb_agg(u ORDER BY u->>'created_at' DESC), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object(
                    'id',            au.id,
                    'email',         au.email,
                    'nombre',        au.raw_user_meta_data->>'nombre',
                    'created_at',    au.created_at,
                    'plan',          COALESCE(s.plan, 'sin plan'),
                    'is_admin',      COALESCE(s.is_admin, false),
                    -- El conteo sale de los análisis reales, no de un contador
                    -- desnormalizado que hay que acordarse de incrementar.
                    'analisis_count', (
                        SELECT COUNT(*) FROM public.analisis a WHERE a.user_id = au.id
                    )
                ) AS u
                FROM auth.users au
                LEFT JOIN public.suscripciones s ON s.user_id = au.id
            ) t
        ),
        'feedback', (
            SELECT COALESCE(jsonb_agg(f ORDER BY f->>'created_at' DESC), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object(
                    'id',            fb.id,
                    'tipo_analisis', fb.tipo_analisis,
                    'rating',        fb.rating,
                    'comentario',    fb.comentario,
                    'created_at',    fb.created_at
                ) AS f
                FROM public.feedback fb
                ORDER BY fb.created_at DESC
                LIMIT 50
            ) t
        ),
        'analisis_total', (SELECT COUNT(*) FROM public.analisis)
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_metricas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_metricas() TO authenticated;

-- ------------------------------------------------------------
-- 4. Que el perfil pueda informar si la cuenta es admin
-- ------------------------------------------------------------
-- AuthContext lee `suscripciones` para saber el plan; con is_admin en la misma
-- fila, el guard del panel funciona sin una consulta extra.
COMMENT ON COLUMN public.suscripciones.is_admin IS
    'Acceso al panel /admin. Se otorga sólo por SQL, nunca desde la aplicación.';
