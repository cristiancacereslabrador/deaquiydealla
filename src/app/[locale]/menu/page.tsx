import { MenuCatalog } from "@/components/menu/menu-catalog";
import { DISHES, Dish } from "@/data/dishes";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const t = await getTranslations("MenuPage");
  const supabase = await createServerSupabaseClient();

  const [customRes, overridesRes] = await Promise.all([
    supabase.from("custom_dishes").select("*").is("deleted_at", null).eq("is_active", true),
    supabase.from("dish_price_overrides").select("*")
  ]);

  const customDishes: Dish[] = (customRes.data || []).map(d => ({
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

  const deletedStaticIds = new Set<string>();
  const staticDishes = DISHES.filter(d => {
    const override = overridesRes.data?.find(o => o.dish_id === d.id);
    if (override?.is_deleted) {
      deletedStaticIds.add(d.id);
      return false;
    }
    return true;
  }).map(d => {
    const override = overridesRes.data?.find(o => o.dish_id === d.id);
    return {
      ...d,
      category: override?.category || d.category,
      nameEs: override?.name_es || d.nameEs,
      nameEn: override?.name_en || d.nameEn,
      descriptionEs: override?.description_es || d.descriptionEs,
      descriptionEn: override?.description_en || d.descriptionEn,
      priceCents: override?.price_cents ?? d.priceCents,
      imageUrl: override?.image_path || d.imageUrl,
      allergens: override?.allergens || d.allergens,
    };
  });

  const allDishes = [...staticDishes, ...customDishes];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-10 max-w-2xl space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <MenuCatalog dishes={allDishes} initialCategory={cat} />
    </div>
  );
}
