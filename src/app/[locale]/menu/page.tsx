import { MenuCatalog } from "@/components/menu/menu-catalog";
import { DISHES } from "@/data/dishes";
import { getTranslations } from "next-intl/server";

/**
 * Página de menú: catálogo de platos con imágenes y carrito (Zustand).
 *
 * @returns Sección principal con intro y {@link MenuCatalog}.
 */
export default async function MenuPage() {
  const t = await getTranslations("MenuPage");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-10 max-w-2xl space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <MenuCatalog dishes={DISHES} />
    </div>
  );
}
