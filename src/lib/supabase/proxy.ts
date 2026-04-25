import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refresca la sesión de Supabase **sin** sustituir la respuesta previa (p. ej. redirecciones de `next-intl`).
 * Aplica cookies de sesión sobre la instancia de {@link NextResponse} recibida.
 *
 * @param request - Petición entrante de Next.js.
 * @param response - Respuesta ya construida (middleware de i18n, rewrites, etc.).
 * @returns La misma `response` con cookies de Supabase actualizadas cuando existen variables de entorno.
 */
export async function mergeSupabaseSession(
  request: NextRequest,
  response: NextResponse
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
