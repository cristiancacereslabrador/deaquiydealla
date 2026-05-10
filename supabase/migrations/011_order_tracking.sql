-- Mejora para el seguimiento de pedidos en tiempo real.
alter table public.pedidos add column if not exists estimated_minutes integer;
alter table public.pedidos add column if not exists updated_at timestamptz default now();

-- Habilitar tiempo real para la tabla pedidos (si no lo estaba)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.pedidos;
