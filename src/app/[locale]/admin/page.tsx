import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { setRequestLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

/**
 * @description Página del panel de administración.
 * Protegida: solo usuarios con role='admin' pueden acceder.
 * Usa el cliente de servicio para leer el rol sin restricciones RLS.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1. Verificar que el usuario esté autenticado
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 2. Leer el perfil usando el cliente de servicio (ignora RLS)
  let isAdmin = false;
  try {
    const serviceClient = createServiceSupabaseClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  } catch {
    // Si falla el cliente de servicio (sin key), denegamos acceso
    isAdmin = false;
  }

  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto">
      <AdminDashboard />
    </main>
  );
}

export const dynamic = "force-dynamic";

