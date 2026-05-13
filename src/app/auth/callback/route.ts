import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * @description Ruta de callback para OAuth (Google, etc.)
 * Intercambia el código de la URL por una sesión de usuario en Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" es a donde queremos enviar al usuario después del login
  const next = searchParams.get("next") ?? "/checkout";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hay error, volver al login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
