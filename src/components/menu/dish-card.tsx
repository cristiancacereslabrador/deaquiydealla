"use client";

import { buttonVariants } from "@/components/ui/button";
import type { Dish } from "@/data/dishes";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

type DishCardProps = {
  /** Plato a mostrar. */
  dish: Dish;
  /** Si el plato está agotado. */
  isOutOfStock?: boolean;
};

/**
 * Tarjeta de producto con imagen, textos localizados y acción de añadir al carrito.
 */
export function DishCard({ dish, isOutOfStock = false }: DishCardProps) {
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const addItem = useCartStore((s) => s.addItem);
  const [addedFlash, setAddedFlash] = useState(false);
  const [imgError, setImgError] = useState(false);

  const name = locale === "en" ? dish.nameEn : dish.nameEs;
  const description =
    locale === "en" ? dish.descriptionEn : dish.descriptionEs;

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(dish.priceCents / 100);

  /**
   * Añade una unidad al carrito con validación en el store (Zod).
   */
  const handleAdd = useCallback(() => {
    if (isOutOfStock) return;
    
    const ok = addItem({
      dishId: dish.id,
      quantity: 1,
      nameEs: dish.nameEs,
      nameEn: dish.nameEn,
      unitPriceCents: dish.priceCents,
      imageUrl: dish.imageUrl,
    });
    if (ok) {
      setAddedFlash(true);
      window.setTimeout(() => setAddedFlash(false), 1200);
    }
  }, [addItem, dish, isOutOfStock]);

  return (
    <article className={cn(
      "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all",
      isOutOfStock ? "opacity-75 grayscale-[0.5]" : "hover:shadow-md"
    )}>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {!imgError ? (
          <Image
            src={dish.imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("imageUnavailable")}
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
              AGOTADO
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {name}
          </h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          {dish.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {dish.allergens.map((a) => (
                <span 
                  key={a} 
                  className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold uppercase text-muted-foreground border border-border/50"
                  title={a}
                >
                  {a.slice(0, 3)}
                </span>
              ))}
            </div>
          )}

        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className={cn(
            "font-medium",
            isOutOfStock ? "text-muted-foreground line-through" : "text-primary"
          )}>
            {formattedPrice}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5",
              addedFlash && "ring-2 ring-[oklch(0.72_0.14_85)]",
              isOutOfStock && "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
            )}
          >
            <ShoppingBag className="size-4" aria-hidden />
            {isOutOfStock ? "Agotado" : t("addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}

