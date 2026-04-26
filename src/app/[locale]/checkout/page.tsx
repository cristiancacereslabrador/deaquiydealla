import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Checkout: recogida en tienda y pago en efectivo (formulario + Supabase).
 *
 * @returns Cliente de checkout montado en el segmento `[locale]`.
 */
export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let initialProfile = undefined;
  
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, address")
      .eq("id", user.id)
      .single();
      
    if (data) {
      initialProfile = {
        fullName: data.full_name || "",
        phone: data.phone || "",
        email: user.email || "",
      };
    }
  }

  return <CheckoutPageClient initialProfile={initialProfile} />;
}
