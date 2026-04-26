-- Migración 003: Sistema de Perfiles para clientes registrados
-- Ejecutar en Supabase SQL Editor

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: Cada usuario puede leer/actualizar su propio perfil
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Automáticamente crear el perfil cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Permitir a personal con rol de servicio (admin) ver todos
grant select on public.profiles to service_role;
