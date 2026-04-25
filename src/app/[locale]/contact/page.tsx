import { getTranslations } from "next-intl/server";

/**
 * Marcador de contacto / reservas hasta implementar formulario y enlaces reales.
 *
 * @returns Bloque de texto traducido.
 */
export default async function ContactPage() {
  const t = await getTranslations("ContactPage");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-muted-foreground">{t("body")}</p>
    </div>
  );
}
