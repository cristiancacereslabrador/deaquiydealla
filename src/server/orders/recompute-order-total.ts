import { DISHES } from "@/data/dishes";
import type { CartLineInput } from "@/lib/schemas/cart-schemas";

export type RecomputeResult =
  | {
      ok: true;
      /** Líneas con `unitPriceCents` tomados del catálogo servidor. */
      normalizedLines: CartLineInput[];
      totalCents: number;
    }
  | { ok: false; code: "UNKNOWN_DISH" | "EMPTY"; dishId?: string };

const dishById = new Map(DISHES.map((d) => [d.id, d]));

/**
 * Recalcula el total usando solo el catálogo servidor (no confía en precios del cliente).
 *
 * @param lines - Líneas procedentes del carrito ya validadas con Zod.
 * @returns Líneas normalizadas y total, o error si falta un `dishId` en catálogo.
 */
export function recomputeOrderFromCatalog(
  lines: readonly CartLineInput[]
): RecomputeResult {
  if (lines.length === 0) {
    return { ok: false, code: "EMPTY" };
  }

  let totalCents = 0;
  const normalizedLines: CartLineInput[] = [];

  for (const line of lines) {
    const dish = dishById.get(line.dishId);
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
