import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Checkout: recogida en tienda y pago en efectivo (formulario + Supabase).
 *
 * @returns Cliente de checkout montado en el segmento `[locale]`.
 */
export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?next=/checkout");
  }

  // Verificar si el correo ha sido confirmado
  if (!user.email_confirmed_at) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <h1 className="text-3xl font-bold font-heading">Verifica tu correo electrónico</h1>
        <p className="text-muted-foreground text-lg">
          Para evitar pedidos falsos y garantizar la seguridad, necesitamos que confirmes tu correo electrónico <strong>{user.email}</strong> antes de realizar tu primer pedido.
        </p>
        <p className="text-sm bg-muted p-4 rounded-lg">
          Revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace de confirmación que te hemos enviado.
        </p>
        <div className="pt-4">
          <a href="/profile" className="text-primary font-bold underline">Ir a mi perfil</a>
        </div>
      </div>
    );
  }
  
  let initialProfile = undefined;
  
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

  return <CheckoutPageClient initialProfile={initialProfile} />;
}
