-- Pedidos para recogida en tienda (checkout Fase 4).
-- Ejecutar en Supabase → SQL Editor (todo el bloque de una vez).

create extension if not exists "pgcrypto";

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid (),
  created_at timestamptz not null default now(),
  locale text not null check (locale in ('es', 'en')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  notes text,
  total_cents integer not null check (total_cents > 0),
  payment_method text not null default 'cash',
  fulfillment text not null default 'pickup',
  status text not null default 'pending',
  lines jsonb not null
);

create index if not exists pedidos_created_at_idx on public.pedidos (created_at desc);

comment on table public.pedidos is 'Pedidos cliente (recogida / efectivo MVP).';

-- Desarrollo: sin RLS para simplificar anon insert + select con la clave pública.
-- En producción: enable RLS + policies (solo personal autenticado lee; insert controlado).
alter table public.pedidos disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.pedidos to anon, authenticated;
grant all on table public.pedidos to service_role;

-- Fase 5 (tiempo real): descomentar si tu proyecto permite añadir tablas a la publicación.
-- alter publication supabase_realtime add table public.pedidos;
