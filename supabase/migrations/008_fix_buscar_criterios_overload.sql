-- ============================================================
-- Fix: buscar_criterios quedó duplicada (dos overloads)
--
-- 001_create_criterios_table.sql creó buscar_criterios con 5 parámetros.
-- 002_add_fuero_column.sql usó CREATE OR REPLACE con una firma distinta
-- (6 parámetros, agregó filter_fuero), lo que en Postgres no reemplaza
-- la función anterior sino que crea un OVERLOAD nuevo. Con llamadas por
-- nombre de parámetro (RPC de supabase-js) esto produce:
--   "Could not choose the best candidate function"
--
-- Esta migración elimina el overload viejo (5 parámetros) y deja
-- únicamente la versión con filter_fuero.
-- ============================================================

DROP FUNCTION IF EXISTS buscar_criterios(
    VECTOR(1536), INT, TEXT, TEXT, TEXT
);
