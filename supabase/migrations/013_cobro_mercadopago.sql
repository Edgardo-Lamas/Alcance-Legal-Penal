-- ============================================================
-- 013_cobro_mercadopago.sql
--
-- El cobro se conecta a la cuenta. Hasta acá cualquiera creaba su cuenta y
-- `consumir_cuota()` lo daba de alta en Básico (20 análisis por mes) sin pagar
-- nada, y "suscribirse" era un mailto: el plan se cambiaba a mano.
--
-- Decisiones de Edgardo (2026-10-04):
--   · Se cobra en PESOS, por suscripción mensual de Mercado Pago:
--     Básico $50.000 · Profesional $95.000 · Estudio $160.000.
--   · La cuenta nueva arranca en PRUEBA con 3 análisis gratis, y después se
--     suscribe. No hay ningún abogado activo real: las cuentas que existen
--     pasan a prueba igual que una nueva.
--
-- Cómo queda armado:
--   planes                 → suma `precio_ars` y dos planes sin precio:
--                            'prueba' (sin cupo mensual: vive de créditos) y
--                            'cortesia' (cuentas propias, nunca las toca el cobro).
--   suscripciones_mp       → una fila por suscripción de MP (preapproval). La
--                            escribe el webhook. Es el registro para un reclamo.
--   suscripciones.plan     → deja de salir del último aviso de MP: se recalcula
--                            desde suscripciones_mp con recalcular_plan().
-- ============================================================

-- ------------------------------------------------------------
-- 1. Planes: precio en pesos + prueba + cortesía
-- ------------------------------------------------------------
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS precio_ars INT NOT NULL DEFAULT 0;

-- `precio_ars` es el que se cobra. Lo lee la Edge Function crear-suscripcion:
-- el monto NUNCA viaja desde el navegador. Cambiar un precio es un UPDATE acá,
-- sin redeploy (las suscripciones ya creadas mantienen el monto con que nacieron).
INSERT INTO public.planes (plan, nombre, precio_usd, analisis_mes, consultas_mes, precio_ars) VALUES
    ('basico',      'Básico',      29,  20, 100,  50000),
    ('profesional', 'Profesional', 59,  60, 250,  95000),
    ('estudio',     'Estudio',     99, 150, 500, 160000),
    -- Prueba: cupo mensual CERO. Usa sólo los créditos que trae la cuenta al
    -- nacer (3 análisis). Si el cupo fuera mensual, la prueba se renovaría
    -- sola el día 1 y sería un plan gratis para siempre.
    ('prueba',      'Prueba',       0,   0,   0,      0),
    ('cortesia',    'Cortesía',     0, 150, 500,      0)
ON CONFLICT (plan) DO UPDATE SET
    nombre        = EXCLUDED.nombre,
    precio_usd    = EXCLUDED.precio_usd,
    analisis_mes  = EXCLUDED.analisis_mes,
    consultas_mes = EXCLUDED.consultas_mes,
    precio_ars    = EXCLUDED.precio_ars;

-- ------------------------------------------------------------
-- 2. La cuenta nueva nace en prueba con 3 análisis y 10 consultas
--
-- Los defaults alcanzan también al "alta implícita" de consumir_cuota() y de
-- otorgar_creditos(), que insertan sólo el user_id.
-- ------------------------------------------------------------
ALTER TABLE public.suscripciones ALTER COLUMN plan               SET DEFAULT 'prueba';
ALTER TABLE public.suscripciones ALTER COLUMN creditos_analisis  SET DEFAULT 3;
ALTER TABLE public.suscripciones ALTER COLUMN creditos_consultas SET DEFAULT 10;

-- Las cuentas que ya existen: ningún abogado real paga hoy (dicho por Edgardo
-- el 4/10), así que pasan a prueba como una cuenta nueva. Las de cortesía se
-- asignan aparte, a mano, con:
--   UPDATE suscripciones SET plan = 'cortesia'
--    WHERE user_id = (SELECT id FROM auth.users WHERE email = '<correo>');
UPDATE public.suscripciones
   SET plan               = 'prueba',
       creditos_analisis  = GREATEST(creditos_analisis, 3),
       creditos_consultas = GREATEST(creditos_consultas, 10),
       updated_at         = now()
 WHERE plan IN ('basico', 'profesional', 'estudio');

-- La cuenta de Edgardo queda en cortesía (dicho por él el 4/10). Si el correo
-- no existe en auth.users, no hace nada.
INSERT INTO public.suscripciones (user_id, plan)
SELECT id, 'cortesia' FROM auth.users WHERE lower(email) = 'edgardolamas2000@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET plan = 'cortesia', updated_at = now();

-- ------------------------------------------------------------
-- 3. Suscripciones de Mercado Pago — una fila por preapproval
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suscripciones_mp (
    preapproval_id     TEXT        PRIMARY KEY,
    user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan               TEXT        NOT NULL REFERENCES public.planes(plan),

    -- El status crudo de MP, sin traducir: pending, authorized, paused,
    -- cancelled. Tal cual, para contrastar un reclamo contra el panel de MP.
    estado             TEXT        NOT NULL,

    monto              NUMERIC(12,2),
    moneda             TEXT,

    -- Del último cobro mensual. Es el estado del PAGO, no de la suscripción:
    -- un cobro rechazado no la cancela, MP reintenta.
    ultimo_pago_at     TIMESTAMPTZ,
    ultimo_pago_estado TEXT,
    proximo_cobro_at   TIMESTAMPTZ,

    creada_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizada_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_mp_user ON public.suscripciones_mp (user_id);

ALTER TABLE public.suscripciones_mp ENABLE ROW LEVEL SECURITY;

-- El abogado ve lo suyo, para mostrarle "tu suscripción está activa". Sin
-- políticas de escritura: sólo el webhook (service role) escribe.
CREATE POLICY "suscripciones_mp_lectura_propia" ON public.suscripciones_mp
    FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. recalcular_plan() — el plan sale de la tabla, no del último aviso
--
-- Una cuenta puede tener más de una suscripción: la vieja que canceló y la
-- nueva que acaba de pagar. Si el plan se escribiera con el último aviso, el de
-- la cancelada bajaría a prueba a alguien que está al día — y MP además manda
-- avisos duplicados y fuera de orden. Vale el plan más alto entre las
-- autorizadas; si no queda ninguna, prueba.
--
-- 'cortesia' no se toca nunca: es una decisión de Edgardo, no de un pago.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalcular_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actual TEXT;
    v_nuevo  TEXT;
BEGIN
    INSERT INTO suscripciones (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT plan INTO v_actual FROM suscripciones WHERE user_id = p_user_id FOR UPDATE;
    IF v_actual = 'cortesia' THEN
        RETURN v_actual;
    END IF;

    SELECT CASE
               WHEN bool_or(plan = 'estudio')     THEN 'estudio'
               WHEN bool_or(plan = 'profesional') THEN 'profesional'
               WHEN bool_or(plan = 'basico')      THEN 'basico'
           END
      INTO v_nuevo
      FROM suscripciones_mp
     WHERE user_id = p_user_id AND estado = 'authorized';

    v_nuevo := COALESCE(v_nuevo, 'prueba');

    UPDATE suscripciones
       SET plan = v_nuevo, updated_at = now()
     WHERE user_id = p_user_id AND plan IS DISTINCT FROM v_nuevo;

    RETURN v_nuevo;
END;
$$;

-- ------------------------------------------------------------
-- 5. plan_de_cuenta() — para las funciones que no cobran cupo
--
-- redactar-escrito y auditar-estrategia todavía no consumen cuota (decisión
-- pendiente). Mientras tanto, con la cuenta en prueba quedan cerradas: con el
-- alta abierta y gratuita, sin este freno cualquiera generaría escritos sin
-- tope, y cada uno es una llamada a Sonnet.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_de_cuenta(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT plan FROM suscripciones WHERE user_id = p_user_id), 'prueba');
$$;

-- ------------------------------------------------------------
-- 6. Permisos — sólo el backend
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.recalcular_plan(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.plan_de_cuenta(UUID)  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalcular_plan(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.plan_de_cuenta(UUID)  TO service_role;
