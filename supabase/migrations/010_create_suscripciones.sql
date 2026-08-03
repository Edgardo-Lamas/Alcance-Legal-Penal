-- ============================================================
-- 010_create_suscripciones.sql
--
-- Cuotas por plan. Hasta acá el sistema cobraba planes con límites
-- publicados en /precios que ningún código aplicaba: un abogado del plan
-- Básico podía correr 500 análisis sin que nada lo frenara.
--
-- Tres tablas:
--   planes           → catálogo editable por SQL (cambiar un límite NO exige redeploy)
--   suscripciones    → qué plan tiene cada cuenta + créditos comprados aparte
--   consumo_mensual  → cuánto lleva usado la cuenta en el período corriente
--
-- El tope es POR CUENTA, no por usuario: el plan Estudio admite hasta 5
-- personas y en la práctica las cuentas se comparten igual, así que la cuota
-- tiene que vivir donde vive el pago.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Catálogo de planes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planes (
    plan          TEXT PRIMARY KEY,
    nombre        TEXT NOT NULL,
    precio_usd    INT  NOT NULL,
    analisis_mes  INT  NOT NULL,
    consultas_mes INT  NOT NULL
);

-- Dimensionados para que lo incluido cueste ≈25% del precio: así el margen se
-- mantiene alto en los tres planes y la ganancia en dólares crece con el precio.
INSERT INTO public.planes (plan, nombre, precio_usd, analisis_mes, consultas_mes) VALUES
    ('basico',      'Básico',      29,  20, 100),
    ('profesional', 'Profesional', 59,  60, 250),
    ('estudio',     'Estudio',     99, 150, 500)
ON CONFLICT (plan) DO UPDATE SET
    nombre        = EXCLUDED.nombre,
    precio_usd    = EXCLUDED.precio_usd,
    analisis_mes  = EXCLUDED.analisis_mes,
    consultas_mes = EXCLUDED.consultas_mes;

-- ------------------------------------------------------------
-- 2. Suscripción por cuenta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suscripciones (
    user_id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan               TEXT        NOT NULL DEFAULT 'basico' REFERENCES public.planes(plan),
    -- Paquetes comprados aparte del abono. Se consumen recién cuando se agotó
    -- la cuota del mes. Hoy se cargan a mano con otorgar_creditos(); cuando
    -- exista pasarela de pago, el webhook llama a esa misma función.
    creditos_analisis  INT         NOT NULL DEFAULT 0 CHECK (creditos_analisis  >= 0),
    creditos_consultas INT         NOT NULL DEFAULT 0 CHECK (creditos_consultas >= 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. Consumo del período corriente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consumo_mensual (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL,                  -- 'YYYY-MM' en UTC
    recurso TEXT NOT NULL CHECK (recurso IN ('analisis', 'consultas')),
    usado   INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, periodo, recurso)
);

-- ------------------------------------------------------------
-- 4. RLS — el abogado ve lo suyo; escribir es solo del backend
-- ------------------------------------------------------------
ALTER TABLE public.planes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumo_mensual ENABLE ROW LEVEL SECURITY;

-- El catálogo es público: la página de precios lo lee sin sesión.
CREATE POLICY "planes_lectura_publica" ON public.planes
    FOR SELECT USING (true);

-- Lectura de lo propio, para poder mostrar "usaste 12 de 20" en la interfaz.
-- Sin política de escritura: nadie puede cambiarse el plan a sí mismo.
CREATE POLICY "suscripciones_lectura_propia" ON public.suscripciones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "consumo_lectura_propia" ON public.consumo_mensual
    FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. consumir_cuota() — chequeo y descuento atómicos
--
-- Devuelve JSON para que la Edge Function pueda dar un mensaje útil
-- ("usaste 20 de 20") en lugar de un error pelado.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consumir_cuota(
    p_user_id UUID,
    p_recurso TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_periodo  TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
    v_plan     TEXT;
    v_creditos INT;
    v_limite   INT;
    v_usado    INT;
BEGIN
    IF p_recurso NOT IN ('analisis', 'consultas') THEN
        RAISE EXCEPTION 'recurso invalido: %', p_recurso;
    END IF;

    -- Alta implícita: una cuenta sin fila entra como 'basico'. Evita que un
    -- alta de usuario sin suscripción quede bloqueada sin poder usar nada.
    INSERT INTO suscripciones (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- FOR UPDATE serializa por cuenta. Sin esto, dos pedidos simultáneos leen
    -- el mismo contador y ambos pasan el tope.
    SELECT plan,
           CASE WHEN p_recurso = 'analisis' THEN creditos_analisis ELSE creditos_consultas END
      INTO v_plan, v_creditos
      FROM suscripciones
     WHERE user_id = p_user_id
       FOR UPDATE;

    SELECT CASE WHEN p_recurso = 'analisis' THEN analisis_mes ELSE consultas_mes END
      INTO v_limite
      FROM planes
     WHERE plan = v_plan;

    SELECT usado INTO v_usado
      FROM consumo_mensual
     WHERE user_id = p_user_id AND periodo = v_periodo AND recurso = p_recurso;
    v_usado := COALESCE(v_usado, 0);

    -- Dentro de la cuota del abono
    IF v_usado < v_limite THEN
        INSERT INTO consumo_mensual (user_id, periodo, recurso, usado)
        VALUES (p_user_id, v_periodo, p_recurso, 1)
        ON CONFLICT (user_id, periodo, recurso)
        DO UPDATE SET usado = consumo_mensual.usado + 1;

        RETURN jsonb_build_object(
            'permitido', true, 'plan', v_plan, 'usado', v_usado + 1,
            'limite', v_limite, 'creditos', v_creditos, 'uso_credito', false);
    END IF;

    -- Cuota agotada: recién ahí se toca el crédito comprado
    IF v_creditos > 0 THEN
        IF p_recurso = 'analisis' THEN
            UPDATE suscripciones
               SET creditos_analisis = creditos_analisis - 1, updated_at = now()
             WHERE user_id = p_user_id;
        ELSE
            UPDATE suscripciones
               SET creditos_consultas = creditos_consultas - 1, updated_at = now()
             WHERE user_id = p_user_id;
        END IF;

        RETURN jsonb_build_object(
            'permitido', true, 'plan', v_plan, 'usado', v_usado,
            'limite', v_limite, 'creditos', v_creditos - 1, 'uso_credito', true);
    END IF;

    RETURN jsonb_build_object(
        'permitido', false, 'plan', v_plan, 'usado', v_usado,
        'limite', v_limite, 'creditos', 0, 'uso_credito', false);
END;
$$;

-- ------------------------------------------------------------
-- 6. otorgar_creditos() — venta de paquetes
-- Hoy se llama a mano desde el SQL Editor cuando un abogado compra un
-- paquete puntual. Cuando exista pasarela de pago, la llama el webhook.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.otorgar_creditos(
    p_user_id   UUID,
    p_analisis  INT DEFAULT 0,
    p_consultas INT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row suscripciones%ROWTYPE;
BEGIN
    INSERT INTO suscripciones (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE suscripciones
       SET creditos_analisis  = creditos_analisis  + GREATEST(p_analisis, 0),
           creditos_consultas = creditos_consultas + GREATEST(p_consultas, 0),
           updated_at         = now()
     WHERE user_id = p_user_id
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'user_id', v_row.user_id, 'plan', v_row.plan,
        'creditos_analisis', v_row.creditos_analisis,
        'creditos_consultas', v_row.creditos_consultas);
END;
$$;

-- ------------------------------------------------------------
-- 7. Permisos — solo el backend consume y otorga
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.consumir_cuota(UUID, TEXT)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.otorgar_creditos(UUID, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cuota(UUID, TEXT)      TO service_role;
GRANT EXECUTE ON FUNCTION public.otorgar_creditos(UUID, INT, INT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_consumo_periodo ON public.consumo_mensual (periodo);
