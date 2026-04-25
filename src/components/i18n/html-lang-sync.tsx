"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * Sincroniza `document.documentElement.lang` con el locale activo de `next-intl`
 * (el `<html>` vive en el layout raíz y no recibe `[locale]` como prop).
 *
 * @returns `null` (solo efectos secundarios).
 */
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
