import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { BRAND_INFO } from "@/lib/brand";

/**
 * Segmentos estáticos para el prerenderizado de esta página.
 */
export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

/**
 * @description Página "Sobre Nosotros" que presenta al Chef Hugo Salgar Camacho.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return (
    <main className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-[3/4] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
          <Image
            src="/images/hugo.png"
            alt={`${t("chefName")} - Chef y Dueño`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary">
            {t("chefName")}
          </h1>
          <p className="text-xl font-medium text-muted-foreground italic">
            {t("chefQuote")}
          </p>

          <div className="prose prose-lg dark:prose-invert">
            <p>
              {t("bioPara1")}
            </p>
            <p>
              {t("bioPara2")}
            </p>
            <p>
              {t("bioPara3")}
            </p>

          </div>

          <div className="pt-6 flex gap-4">
            <a
              href={BRAND_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {t("followInsta")}
            </a>
            <a
              href={BRAND_INFO.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {t("followTiktok")}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">{t("philosophyTitle")}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-4xl">🔥</div>
            <h3 className="font-bold text-xl">{t("wokTitle")}</h3>
            <p className="text-muted-foreground">{t("wokDesc")}</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">🌿</div>
            <h3 className="font-bold text-xl">{t("ingredientsTitle")}</h3>
            <p className="text-muted-foreground">{t("ingredientsDesc")}</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">❤️</div>
            <h3 className="font-bold text-xl">{t("passionTitle")}</h3>
            <p className="text-muted-foreground">{t("passionDesc")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
