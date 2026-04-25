import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

/**
 * Checkout: recogida en tienda y pago en efectivo (formulario + Supabase).
 *
 * @returns Cliente de checkout montado en el segmento `[locale]`.
 */
export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
