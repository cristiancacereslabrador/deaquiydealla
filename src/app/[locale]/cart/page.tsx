import { CartView } from "@/components/cart/cart-view";
import { getTranslations } from "next-intl/server";

/**
 * Página de carrito: líneas persistidas, total y acciones.
 *
 * @returns Título y {@link CartView}.
 */
export default async function CartPage() {
  const t = await getTranslations("CartPage");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <CartView />
    </div>
  );
}
