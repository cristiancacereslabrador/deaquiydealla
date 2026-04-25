-- Habilitar realtime para pedidos
alter publication supabase_realtime add table public.pedidos;

-- Tabla para configuración del restaurante (Botón de pánico, etc)
create table if not exists public.store_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Insertar configuración inicial
insert into public.store_settings (id, value)
values ('panic_button', '{"active": false}'::jsonb)
on conflict (id) do nothing;

alter table public.store_settings disable row level security;
grant usage on schema public to anon, authenticated;
grant select, update, insert on table public.store_settings to anon, authenticated;
grant all on table public.store_settings to service_role;

alter publication supabase_realtime add table public.store_settings;

-- Tabla para gestionar stock de platos (Toggle de agotados)
create table if not exists public.dish_status (
  dish_id text primary key,
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.dish_status disable row level security;
grant select, update, insert on table public.dish_status to anon, authenticated;
grant all on table public.dish_status to service_role;

alter publication supabase_realtime add table public.dish_status;
