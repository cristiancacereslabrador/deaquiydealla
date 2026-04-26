import { getTranslations } from "next-intl/server";

export default async function CartaDigitalPage() {
  const t = await getTranslations("CartaDigital");

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-background flex flex-col items-center py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-cursive text-[#c8102e] text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>
      <div className="w-full max-w-5xl relative">
        <img 
          src="/images/MenuDeAquiYDeAllaHD.png" 
          alt={t("title")} 
          className="w-full h-auto rounded-xl shadow-lg border border-border/50"
        />
      </div>
    </div>
  );
}
