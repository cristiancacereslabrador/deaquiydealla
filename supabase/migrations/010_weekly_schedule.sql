-- Insertar configuración inicial del horario si no existe
insert into public.store_settings (id, value)
values ('weekly_schedule', '{
  "schedule": [
    { "open": "12:00", "close": "21:30" },
    { "open": "12:00", "close": "16:00" },
    { "open": "12:00", "close": "16:00" },
    { "open": "12:00", "close": "16:00" },
    null,
    { "open": "12:00", "close": "21:30" },
    { "open": "12:00", "close": "21:30" }
  ]
}'::jsonb)
on conflict (id) do nothing;
