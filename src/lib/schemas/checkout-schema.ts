import { z } from "zod";
import { cartLineSchema } from "@/lib/schemas/cart-schemas";

/**
 * Normaliza espacios y elimina etiquetas HTML básicas (mitigación XSS en notas).
 *
 * @param value - Texto de entrada.
 * @returns Cadena segura para almacenar.
 */
function stripHtmlLite(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/**
 * Campos del formulario de checkout (incluye honeypot `company`).
 */
export const checkoutCustomerSchema = z.object({
  fullName: z
    .string()
    .min(2, "err_name_min")
    .max(80)
    .transform((s) => s.trim()),
  phone: z
    .string()
    .regex(/^(?:(?:\+|00)34)?[\s-]*(?:[6789](?:[\s-]*\d){8})$/, "err_phone_format")
    .transform((s) => s.replace(/\s+/g, " ").trim()),
  email: z
    .union([z.string().email("err_email_invalid").max(120), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  notes: z
    .string()
    .max(500)
    .optional()
    .default("")
    .transform(stripHtmlLite),
  /** Honeypot anti-bots: debe ir vacío. */
  company: z
    .string()
    .max(200)
    .optional()
    .default("")
    .transform((s) => s.trim()),
});

/**
 * Payload completo validado en el server action.
 */
export const submitOrderPayloadSchema = checkoutCustomerSchema
  .extend({
    locale: z.enum(["es", "en"]),
    lines: z.array(cartLineSchema).min(1, "err_lines_min").max(50, "err_lines_max"),
  })
  .superRefine((data, ctx) => {
    if (data.company.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "err_honeypot",
        path: ["company"],
      });
    }
  });

/** Valores del formulario RHF (entrada antes de transforms de Zod). */
export type CheckoutFormValues = z.input<typeof checkoutCustomerSchema>;

export type SubmitOrderPayload = z.infer<typeof submitOrderPayloadSchema>;
