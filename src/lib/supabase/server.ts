import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente de Supabase para **Server Components**, **Route Handlers** y **Server Actions**.
 * Sincroniza la sesión con las cookies de Next.js para que RLS y auth funcionen igual que en el cliente.
 *
 * @returns Promesa que resuelve en el cliente de Supabase del servidor.
 * @throws {Error} Si faltan variables públicas de Supabase en el entorno.
 */
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase: defina NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignorado: `set` puede fallar en Server Components de solo lectura; el middleware actualizará cookies cuando aplique.
        }
      },
    },
  });
}
