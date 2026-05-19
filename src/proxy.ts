import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { mergeSupabaseSession } from "@/lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Orquesta internacionalización (next-intl) y refresco de sesión Supabase.
 * Se utiliza la convención 'proxy' requerida por Next.js 16.
 *
 * @param request - Petición HTTP entrante.
 */
export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // Si es una redirección de i18n, la devolvemos inmediatamente para evitar bucles
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  return mergeSupabaseSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
