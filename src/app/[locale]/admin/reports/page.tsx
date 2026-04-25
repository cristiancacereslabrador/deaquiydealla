import { setRequestLocale } from "next-intl/server";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto">
      <ReportsDashboard />
    </main>
  );
}

export const dynamic = "force-dynamic";
