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
import { getStoreStatus } from "@/lib/store-status";

/**
 * Vista interactiva del carrito: líneas, cantidades, total y vaciar.
 *
 * @returns Bloque de UI del carrito o estado vacío.
 */
export function CartView({ allDishes }: { allDishes: any[] }) {
  const t = useTranslations("CartPage");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [panicActive, setPanicActive] = useState(false);
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    startTransition(() => setMounted(true));
    
    const supabase = createBrowserSupabaseClient();

    // 1. Panic Button validation
    supabase.from("store_settings").select("value").eq("id", "panic_button").single().then(({ data }) => {
      if (data?.value?.active) setPanicActive(true);
    });
    
    const settingsChannel = supabase.channel("cart_store_settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new.id === "panic_button") setPanicActive(payload.new.value.active);
      }).subscribe();

    // 2. Dish status validation
    const fetchStock = async () => {
      const { data } = await supabase
        .from("dish_status")
        .select("dish_id")
        .eq("is_available", false);
      
      if (data) setOutOfStockIds(new Set(data.map(d => d.dish_id)));
    };
    fetchStock();

    const stockChannel = supabase.channel("cart_stock_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "dish_status" }, (payload) => {
        const { dish_id, is_available } = payload.new as { dish_id: string; is_available: boolean };
        setOutOfStockIds(prev => {
          const next = new Set(prev);
          if (is_available) next.delete(dish_id);
          else next.add(dish_id);
          return next;
        });
      }).subscribe();

    return () => { 
      supabase.removeChannel(settingsChannel); 
      supabase.removeChannel(stockChannel);
    };
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

  // Smart Cross-selling
  const suggestedDishes = useMemo(() => {
    const hasBeverage = items.some(i => allDishes.find(d => d.id === i.dishId)?.category === "bebidas");
    const hasDessert = items.some(i => allDishes.find(d => d.id === i.dishId)?.category === "postres");
    
    return allDishes.filter(d => !items.find(i => i.dishId === d.id))
                 .filter(d => {
                   if (!hasBeverage && d.category === "bebidas") return true;
                   if (!hasDessert && d.category === "postres") return true;
                   if (d.category === "entrantes") return true;
                   return false;
                 })
                 .sort(() => Math.random() - 0.5) // Shuffle for variety
                 .slice(0, 3);
  }, [items, allDishes]);

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

  const { isOpen, nextOpening, reason } = getStoreStatus(panicActive);

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
      {!isOpen && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-6 flex items-start gap-4 animate-in fade-in zoom-in-95">
          <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
              {reason === "panic" ? "Local cerrado temporalmente" : reason === "closed_day" ? "Hoy estamos cerrados" : "Fuera de horario"}
            </h3>
            <p className="text-red-600/80 dark:text-red-400/80 font-medium">
              {reason === "panic"
                ? "Continuamos atendiendo en breve. ¡Gracias por tu paciencia!"
                : reason === "closed_day"
                  ? `Atendemos nuevamente ${nextOpening}.`
                  : `Abrimos ${nextOpening}.`}
            </p>
            <p className="text-sm font-bold text-red-700 dark:text-red-400 pt-2">
              No se pueden realizar pedidos en este momento.
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {items.map((line) => {
          const name = locale === "en" ? line.nameEn : line.nameEs;
          const lineTotal = line.unitPriceCents * line.quantity;
          const broken = imgBroken[line.dishId];
          const isOutOfStock = outOfStockIds.has(line.dishId);

          return (
            <li
              key={line.dishId}
              className={cn(
                "flex gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:items-center sm:gap-6 sm:p-5 transition-all",
                isOutOfStock ? "border-red-200 bg-red-50/50 opacity-90" : "border-border/70"
              )}
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                {(!broken && line.imageUrl) ? (
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
                  <h2 className={cn("font-heading text-lg font-semibold leading-snug", isOutOfStock && "text-red-700")}>
                    {name}
                  </h2>
                  <p className={cn("shrink-0 font-medium", isOutOfStock ? "text-muted-foreground line-through" : "text-primary")}>
                    {formatCentsToCurrency(lineTotal, locale)}
                  </p>
                </div>
                {isOutOfStock && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Este plato se ha agotado. Por favor, quítalo para continuar.
                  </p>
                )}
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
                      disabled={isOutOfStock}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "size-8",
                        isOutOfStock && "opacity-50"
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
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestedDishes.map(dish => (
              <div key={dish.id} className="flex items-center gap-3 bg-background p-2.5 rounded-xl border shadow-sm overflow-hidden">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {dish.imageUrl ? (
                    <Image src={dish.imageUrl} alt={dish.nameEs} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center px-1 leading-tight">{t("imageUnavailable")}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate leading-tight">{locale === "en" ? dish.nameEn : dish.nameEs}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">{formatCentsToCurrency(dish.priceCents, locale)}</p>
                </div>
                <button
                  type="button"
                  disabled={!isOpen}
                  onClick={() => addItem({ dishId: dish.id, quantity: 1, unitPriceCents: dish.priceCents, nameEs: dish.nameEs, nameEn: dish.nameEn, imageUrl: dish.imageUrl })}
                  className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "shrink-0 h-8 px-3 text-xs")}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t("add") || "Añadir"}
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
          {isOpen ? (
            <Link
              href={items.some(i => outOfStockIds.has(i.dishId)) ? "#" : "/checkout"}
              onClick={(e) => {
                if (items.some(i => outOfStockIds.has(i.dishId))) {
                  e.preventDefault();
                }
              }}
              className={cn(
                buttonVariants({ size: "default" }),
                "font-medium h-11 px-6",
                items.some(i => outOfStockIds.has(i.dishId)) && "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
              )}
            >
              {t("checkout")}
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-red-600 font-bold px-4 py-2 border-2 border-red-600 rounded-lg bg-red-50 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Tienda cerrada
            </div>
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
