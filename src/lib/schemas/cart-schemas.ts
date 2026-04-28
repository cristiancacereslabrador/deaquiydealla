import { z } from "zod";

/**
 * Esquema Zod para una línea del carrito persistida (anti datos corruptos / manipulación en `localStorage`).
 */
export const cartLineSchema = z.object({
  dishId: z.string().catch("unknown"),
  quantity: z.number().int().catch(1),
  nameEs: z.string().catch("Plato"),
  nameEn: z.string().catch("Dish"),
  unitPriceCents: z.number().int().catch(0),
  imageUrl: z.string().nullable().catch(""),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;

export function safeParseCartLines(raw: unknown): CartLineInput[] {
  const arr = z.array(cartLineSchema).safeParse(raw);
  return arr.success ? arr.data : [];
}

export const addToCartPayloadSchema = z
  .object({
    dishId: z.string().catch("unknown"),
    quantity: z.number().int().optional().catch(1),
    nameEs: z.string().catch("Plato"),
    nameEn: z.string().optional().nullable().catch("Dish"),
    unitPriceCents: z.number().int().catch(0),
    imageUrl: z.string().optional().nullable().catch(""),
  })
  .transform((data) => ({
    ...data,
    quantity: data.quantity ?? 1,
    nameEn: data.nameEn || data.nameEs || "Dish",
    imageUrl: data.imageUrl || "",
  }));

export type AddToCartPayload = z.output<typeof addToCartPayloadSchema>;
