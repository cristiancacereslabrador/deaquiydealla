import { setRequestLocale } from "next-intl/server";
import { RecipesDashboard } from "@/components/admin/recipes-dashboard";

export default async function AdminRecipesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="px-3 py-4 max-w-6xl mx-auto">
      <RecipesDashboard />
    </main>
  );
}

export const dynamic = "force-dynamic";
