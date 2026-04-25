import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { setRequestLocale } from "next-intl/server";
import { Zap } from "lucide-react";

/**
 * @description Página principal del panel de cocina PWA.
 * Diseñada para ser instalada como app en Android/iOS desde el navegador.
 *
 * @param params - Parámetros de ruta con el locale activo.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto">
      <AdminDashboard />
    </main>
  );
}

export const dynamic = "force-dynamic";
