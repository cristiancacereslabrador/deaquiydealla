import { DISHES, type Dish } from "@/data/dishes";
import type { CartLineInput } from "@/lib/schemas/cart-schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RecomputeResult =
  | {
      ok: true;
      /** Líneas con `unitPriceCents` tomados del catálogo servidor. */
      normalizedLines: CartLineInput[];
      totalCents: number;
    }
  | { ok: false; code: "UNKNOWN_DISH" | "EMPTY"; dishId?: string };

/**
 * Recalcula el total usando el catálogo servidor y la base de datos de platos personalizados.
 *
 * @param lines - Líneas procedentes del carrito ya validadas con Zod.
 * @returns Líneas normalizadas y total, o error si falta un `dishId` en catálogo.
 */
export async function recomputeOrderFromCatalog(
  lines: readonly CartLineInput[]
): Promise<RecomputeResult> {
  if (lines.length === 0) {
    return { ok: false, code: "EMPTY" };
  }

  const supabase = await createServerSupabaseClient();

  // Fetch all custom dishes and price overrides
  const [customRes, overridesRes] = await Promise.all([
    supabase.from("custom_dishes").select("*").is("deleted_at", null),
    supabase.from("dish_price_overrides").select("*")
  ]);

  const customRaw = customRes.data || [];
  const overrides = overridesRes.data || [];

  const customDishes: Dish[] = customRaw.map(d => ({
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

  const allDishesMap = new Map<string, Dish>();
  
  // Combine static and custom, applying overrides
  DISHES.forEach(d => {
    const o = overrides.find(ov => ov.dish_id === d.id);
    if (!o?.is_deleted) {
      allDishesMap.set(d.id, {
        ...d,
        nameEs: o?.name_es || d.nameEs,
        nameEn: o?.name_en || d.nameEn,
        priceCents: o?.price_cents ?? d.priceCents,
        imageUrl: o?.image_path || d.imageUrl,
        allergens: o?.allergens || d.allergens,
      });
    }
  });
  customDishes.forEach(d => allDishesMap.set(d.id, d));

  let totalCents = 0;
  const normalizedLines: CartLineInput[] = [];

  for (const line of lines) {
    const dish = allDishesMap.get(line.dishId);
    if (!dish) {
      return { ok: false, code: "UNKNOWN_DISH", dishId: line.dishId };
    }
    const unitPriceCents = dish.priceCents;
    totalCents += unitPriceCents * line.quantity;
    normalizedLines.push({
      dishId: line.dishId,
      quantity: line.quantity,
      nameEs: dish.nameEs,
      nameEn: dish.nameEn,
      unitPriceCents,
      imageUrl: dish.imageUrl,
    });
  }

  return { ok: true, normalizedLines, totalCents };
}
