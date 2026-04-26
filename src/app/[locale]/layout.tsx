import { HtmlLangSync } from "@/components/i18n/html-lang-sync";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StoreStatusBanner } from "@/components/layout/store-status-banner";
import { routing } from "@/i18n/routing";
import { RESTAURANT_BRAND_NAME } from "@/lib/brand";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const localeList = routing.locales as readonly string[];

/**
 * Segmentos estáticos por idioma para prerender de rutas `[locale]`.
 *
 * @returns Lista de params `{ locale }` válidos.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Metadatos por defecto de las páginas bajo `[locale]` (pueden sobrescribirse en hijos).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: {
      default: RESTAURANT_BRAND_NAME,
      template: `%s · ${RESTAURANT_BRAND_NAME}`,
    },
    description:
      locale === "en"
        ? `${RESTAURANT_BRAND_NAME} — Chinese restaurant: dine in and pickup orders.`
        : `${RESTAURANT_BRAND_NAME} — cocina china: comer en local y pedidos para recoger.`,
  };
}

/**
 * Layout localizado: provee mensajes a componentes cliente y ancla cabecera / pie.
 *
 * @param props - `children` y `params` con `locale`.
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!localeList.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangSync />
      <div className="flex min-h-screen flex-col">
        <StoreStatusBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
