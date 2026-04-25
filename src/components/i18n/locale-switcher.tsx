"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

/**
 * @description Botón de alternancia simple entre español e inglés.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Cambia al otro idioma disponible.
   */
  const toggleLocale = () => {
    const nextLocale = locale === "es" ? "en" : "es";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "flex items-center gap-2 border-primary/25 bg-card/60 backdrop-blur-sm px-3 rounded-full font-bold uppercase transition-all hover:scale-105 active:scale-95"
      )}
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <Languages className="size-4" />
      <span className="text-xs">{locale === "es" ? "ES" : "EN"}</span>
    </button>
  );
}
