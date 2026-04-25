import { defineRouting } from "next-intl/routing";

/**
 * Configuración central de rutas e idiomas para `next-intl`.
 * `localePrefix: 'as-needed'` evita prefijo `/es` en la locale por defecto (mejor UX local).
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
});


/**
 * Locales admitidos por la aplicación (derivado de {@link routing}).
 */
export type AppLocale = (typeof routing.locales)[number];
