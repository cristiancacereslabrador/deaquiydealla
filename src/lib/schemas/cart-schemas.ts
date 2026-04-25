import { z } from "zod";

/**
 * Esquema Zod para una línea del carrito persistida (anti datos corruptos / manipulación en `localStorage`).
 */
export const cartLineSchema = z.object({
  dishId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
  nameEs: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  unitPriceCents: z.number().int().min(50).max(500_00),
  imageUrl: z.string().max(512),
});

/**
 * Tipo inferido de {@link cartLineSchema}.
 */
export type CartLineInput = z.infer<typeof cartLineSchema>;

/**
 * Valida un array de líneas; si falla, devuelve lista vacía para recuperar el carrito sin romper la UI.
 *
 * @param raw - Valor desconocido (p. ej. desde `localStorage`).
 * @returns Líneas válidas o `[]`.
 */
export function safeParseCartLines(raw: unknown): CartLineInput[] {
  const arr = z.array(cartLineSchema).safeParse(raw);
  return arr.success ? arr.data : [];
}

/**
 * Payload mínimo al añadir un plato (se valida antes de fusionar en el store).
 */
export const addToCartPayloadSchema = z
  .object({
    dishId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(20).optional(),
    nameEs: z.string().min(1).max(120),
    nameEn: z.string().min(1).max(120),
    unitPriceCents: z.number().int().min(50).max(500_00),
    imageUrl: z.string().max(512),
  })
  .transform((data) => ({
    ...data,
    quantity: data.quantity ?? 1,
  }));

export type AddToCartPayload = z.output<typeof addToCartPayloadSchema>;
