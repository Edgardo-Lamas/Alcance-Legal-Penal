-- Migration 005: Historial de análisis por usuario
-- Guarda el resultado de cada análisis (sin binarios) para historial y monetización.

create table if not exists public.analisis (
    id               uuid        primary key default gen_random_uuid(),
    user_id          uuid        not null references auth.users(id) on delete cascade,
    numero_informe   text        not null,
    fecha_emision    timestamptz not null default now(),
    status           text        not null default 'approved',   -- approved | limited | rejected
    tipo_analisis    text        not null default 'analizar',   -- analizar | auditar | redactar
    hechos           text,
    tipo_penal       text,
    etapa_procesal   text,
    resultado_json   jsonb       not null,                      -- salida completa del pipeline (sin imágenes)
    criterios_utilizados integer,
    pipeline_version text,
    created_at       timestamptz not null default now()
);

-- RLS: cada abogado accede solo a sus propios análisis
alter table public.analisis enable row level security;

create policy "analisis_select_own" on public.analisis
    for select using (auth.uid() = user_id);

create policy "analisis_insert_own" on public.analisis
    for insert with check (auth.uid() = user_id);

-- Índices para consultas frecuentes
create index if not exists analisis_user_id_idx   on public.analisis (user_id);
create index if not exists analisis_created_at_idx on public.analisis (created_at desc);
