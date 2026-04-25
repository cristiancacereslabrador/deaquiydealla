"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

/**
 * Enlace al carrito con contador de unidades (suscrito al store de Zustand).
 *
 * @returns `Link` alineado con el estilo de navegación principal.
 */
export function CartNavLink() {
  const t = useTranslations("Shell");
  const count = useCartStore((s) =>
    s.items.reduce((acc, line) => acc + line.quantity, 0)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  return (
    <Link
      href="/cart"
      className={cn(
        "relative inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      )}
    >
      <ShoppingCart className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{t("navCart")}</span>
      {mounted && count > 0 ? (
        <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground sm:text-xs">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
