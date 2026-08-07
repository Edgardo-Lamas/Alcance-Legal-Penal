-- ============================================================
-- 012 · Publicar `analisis` en Realtime
-- ============================================================
--
-- El flujo MEV depende de esto: la extensión inserta el análisis en `analisis`
-- y la web (src/pages/Capacidades/Analizar/Analizar.jsx) escucha el INSERT por
-- Realtime para abrir el resultado sola, sin que el abogado copie ni pegue nada.
--
-- Hasta el 2026-08-07 la publicación `supabase_realtime` NO tenía ninguna tabla:
-- el análisis se guardaba bien, pero Postgres nunca emitía el evento y la web
-- quedaba en "Escuchando resultados desde MEV..." para siempre. No daba error
-- en ningún lado — simplemente no pasaba nada.
--
-- Realtime respeta RLS: para recibir el evento, el usuario necesita policy de
-- SELECT sobre la fila. `analisis_select_own` (migración 002) ya la da, así que
-- cada abogado recibe únicamente sus propios análisis.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'analisis'
  ) then
    alter publication supabase_realtime add table public.analisis;
  end if;
end $$;
