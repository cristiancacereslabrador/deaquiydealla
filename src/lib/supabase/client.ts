import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para ejecutarse **en el navegador** (Client Components, hooks).
 * Usa la clave anónima; no incluye secretos del servidor.
 *
 * @returns Cliente de Supabase para el navegador (misma API que en servidor).
 * @throws {Error} Si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el entorno.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase: defina NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
  }

  return createBrowserClient(url, anonKey);
}
