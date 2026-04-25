import { setRequestLocale, getTranslations } from "next-intl/server";
import { InventoryDashboard } from "@/components/admin/inventory-dashboard";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto">
      <InventoryDashboard />
    </main>
  );
}

export const dynamic = "force-dynamic";
