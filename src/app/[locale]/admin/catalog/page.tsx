import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { PricesDashboard } from "@/components/admin/prices-dashboard";
import { AddDishDashboard } from "@/components/admin/add-dish-dashboard";
import { Tag, PlusCircle } from "lucide-react";

/**
 * @description Página de gestión del catálogo:
 *  - Panel de precios: editar precios de platos existentes en tiempo real.
 *  - Panel de nuevo plato: añadir platos con imagen al catálogo.
 * Solo accesible para administradores autenticados.
 */
export default async function AdminCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  /* ── Auth guard ── */
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

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
    isAdmin = false;
  }
  if (!isAdmin) redirect(`/${locale}`);

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto space-y-10">
      {/* ── Section 1: Prices ── */}
      <section id="precios">
        <PricesDashboard />
      </section>

      {/* ── Divider ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Nuevo Plato
          </span>
        </div>
      </div>

      {/* ── Section 2: Add Dish ── */}
      <section
        id="nuevo-plato"
        className="bg-card border rounded-xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          <span className="font-bold">Añadir Nuevo Plato al Catálogo</span>
        </div>
        <div className="p-5">
          <AddDishDashboard />
        </div>
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
