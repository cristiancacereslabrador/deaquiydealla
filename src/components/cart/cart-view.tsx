"use client";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatCentsToCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DISHES } from "@/data/dishes";
import { Minus, Plus, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useMemo, useState } from "react";

/**
 * Vista interactiva del carrito: líneas, cantidades, total y vaciar.
 *
 * @returns Bloque de UI del carrito o estado vacío.
 */
export function CartView() {
  const t = useTranslations("CartPage");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [panicActive, setPanicActive] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
    
    // Panic Button validation
    const supabase = createBrowserSupabaseClient();
    supabase.from("store_settings").select("value").eq("id", "panic_button").single().then(({ data }) => {
      if (data?.value?.active) setPanicActive(true);
    });
    
    const channel = supabase.channel("cart_store_settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new.id === "panic_button") setPanicActive(payload.new.value.active);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [imgBroken, setImgBroken] = useState<Record<string, boolean>>({});

  const totalCents = useMemo(
    () => items.reduce((a, i) => a + i.unitPriceCents * i.quantity, 0),
    [items]
  );

  // Cross-selling logic
  const suggestedDishes = useMemo(() => {
    return DISHES.filter(d => !items.find(i => i.dishId === d.id))
                 .filter(d => d.category === "entrantes" || d.category === "bebidas")
                 .slice(0, 2);
  }, [items]);

  if (!mounted) {
    return (
      <div
        className="space-y-4"
        aria-busy="true"
        aria-label={t("loading")}
      >
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
        <p className="text-lg text-muted-foreground">{t("empty")}</p>
        <Link
          href="/menu"
          className={cn(buttonVariants({ className: "mt-6" }), "font-medium")}
        >
          {t("goToMenu")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-4">
        {items.map((line) => {
          const name = locale === "en" ? line.nameEn : line.nameEs;
          const lineTotal = line.unitPriceCents * line.quantity;
          const broken = imgBroken[line.dishId];

          return (
            <li
              key={line.dishId}
              className="flex gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:items-center sm:gap-6 sm:p-5"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                {!broken ? (
                  <Image
                    src={line.imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="112px"
                    onError={() =>
                      setImgBroken((m) => ({ ...m, [line.dishId]: true }))
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                    {t("imageUnavailable")}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-heading text-lg font-semibold leading-snug">
                    {name}
                  </h2>
                  <p className="shrink-0 font-medium text-primary">
                    {formatCentsToCurrency(lineTotal, locale)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCentsToCurrency(line.unitPriceCents, locale)} ×{" "}
                  {line.quantity}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "size-8"
                      )}
                      onClick={() =>
                        setQuantity(line.dishId, line.quantity - 1)
                      }
                      aria-label={t("decrease")}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "size-8"
                      )}
                      onClick={() =>
                        setQuantity(line.dishId, line.quantity + 1)
                      }
                      aria-label={t("increase")}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "text-destructive hover:text-destructive"
                    )}
                    onClick={() => removeItem(line.dishId)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    {t("remove")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Venta Cruzada (Cross-selling) */}
      {suggestedDishes.length > 0 && (
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-heading text-lg font-bold">Completa tu pedido</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestedDishes.map(dish => (
              <div key={dish.id} className="flex items-center gap-4 bg-background p-3 rounded-xl border shadow-sm">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image src={dish.imageUrl} alt={dish.nameEs} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{locale === "en" ? dish.nameEn : dish.nameEs}</h4>
                  <p className="text-xs text-muted-foreground">{formatCentsToCurrency(dish.priceCents, locale)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem({ dishId: dish.id, quantity: 1, unitPriceCents: dish.priceCents, nameEs: dish.nameEs, nameEn: dish.nameEn, imageUrl: dish.imageUrl })}
                  className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "shrink-0")}
                >
                  <Plus className="w-4 h-4 mr-1" /> Añadir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen Final */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between mt-8">
        <div>
          <p className="text-sm text-muted-foreground">{t("totalLabel")}</p>
          <p className="font-heading text-2xl font-semibold text-foreground">
            {formatCentsToCurrency(totalCents, locale)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {panicActive ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold px-4 py-2 border-2 border-red-600 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm">
              <AlertTriangle className="w-5 h-5" />
              Local temporalmente saturado. Intenta en unos minutos.
            </div>
          ) : (
            <Link
              href="/checkout"
              className={cn(
                buttonVariants({ size: "default" }),
                "font-medium h-11 px-6"
              )}
            >
              {t("checkout")}
            </Link>
          )}
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "font-medium h-11 px-6"
            )}
            onClick={() => clearCart()}
          >
            {t("clear")}
          </button>
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "secondary", size: "default" }),
              "justify-center text-center font-medium h-11 px-6"
            )}
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">{t("hint")}</p>
    </div>
  );
}
