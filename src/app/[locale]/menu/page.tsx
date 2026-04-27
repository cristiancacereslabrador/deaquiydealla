import { MenuCatalog } from "@/components/menu/menu-catalog";
import { DISHES, Dish } from "@/data/dishes";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Página de menú: catálogo de platos con imágenes y carrito (Zustand).
 * Ahora incluye platos personalizados desde la base de datos.
 */
export default async function MenuPage() {
  const t = await getTranslations("MenuPage");
  const supabase = await createServerSupabaseClient();

  // Fetch custom dishes from DB
  const { data: customRaw } = await supabase
    .from("custom_dishes")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true);

  const customDishes: Dish[] = (customRaw || []).map(d => ({
    id: d.id,
    category: d.category,
    nameEs: d.name_es,
    nameEn: d.name_en || d.name_es,
    descriptionEs: d.description_es,
    descriptionEn: d.description_en,
    priceCents: d.price_cents,
    imageUrl: d.image_path,
    allergens: d.allergens as any
  }));

  // Combine static and dynamic dishes
  const allDishes = [...DISHES, ...customDishes];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-10 max-w-2xl space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <MenuCatalog dishes={allDishes} />
    </div>
  );
}
