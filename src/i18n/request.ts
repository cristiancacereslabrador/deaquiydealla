import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { AppLocale } from "./routing";

const localeSet = new Set<string>(routing.locales);

/**
 * Carga el catálogo de mensajes JSON para un locale válido.
 *
 * @param locale - `es` o `en`.
 * @returns Mensajes listos para `NextIntlClientProvider` / servidor.
 */
async function loadMessages(locale: AppLocale) {
  if (locale === "en") {
    return (await import("../messages/en.json")).default;
  }
  return (await import("../messages/es.json")).default;
}

/**
 * Configuración por petición requerida por el plugin `next-intl` en `next.config.ts`.
 *
 * @see https://next-intl.dev/docs/usage/configuration#server-client
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale =
    requested && localeSet.has(requested)
      ? (requested as AppLocale)
      : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
