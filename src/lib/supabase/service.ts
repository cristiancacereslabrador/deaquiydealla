import { createClient } from "@supabase/supabase-js";

/**
 * @description Crea un cliente de Supabase con permisos de servicio (service_role).
 * Este cliente IGNORA todas las políticas RLS y tiene acceso completo a la base de datos.
 * NUNCA lo uses en el lado del cliente (browser). Solo usar en Server Components o Server Actions.
 *
 * @returns Cliente de Supabase con permisos de servicio.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase: define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
