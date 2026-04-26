-- Migración 005: Roles de Usuario (Administración)
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columna de rol a la tabla de perfiles
alter table public.profiles 
add column if not exists role text not null default 'customer';

-- 2. Crear una política para que los administradores puedan ver todos los perfiles (opcional pero útil)
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( 
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 3. NOTA: Debes ejecutar este SQL manualmente para asignarte el rol de admin:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'TU_USER_ID_AQUÍ';
