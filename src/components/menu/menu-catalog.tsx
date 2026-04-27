"use client";

import { DishCard } from "@/components/menu/dish-card";
import type { Dish, DishCategory } from "@/data/dishes";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMemo, useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/** Price override row from Supabase */
interface PriceOverride {
  dish_id: string;
  price_cents: number;
}

type MenuCatalogProps = {
  /** Lista de platos a renderizar (normalmente {@link import("@/data/dishes").DISHES}). */
  dishes: readonly Dish[];
};

const CATEGORY_KEYS: DishCategory[] = [
  "entrantes",
  "combos",
  "arroces",
  "vegetales",
  "tallarines",
  "otros"
];

/**
 * Catálogo filtrable por categoría con rejilla responsive,
 * estado de stock en tiempo real y precios dinámicos desde Supabase.
 */
export function MenuCatalog({ dishes }: MenuCatalogProps) {
  const t = useTranslations("Catalog");
  const [active, setActive] = useState<DishCategory | "all">("all");
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());

  /** price overrides from Supabase: dish_id → price_cents */
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // ── 1. Carga inicial: platos agotados + precios override ──
    const fetchInitialData = async () => {
      const [stockRes, priceRes] = await Promise.all([
        supabase.from("dish_status").select("dish_id").eq("is_available", false),
        supabase.from("dish_price_overrides").select("dish_id, price_cents"),
      ]);

      if (stockRes.data) {
        setOutOfStockIds(new Set(stockRes.data.map((d: { dish_id: string }) => d.dish_id)));
      }
      if (priceRes.data) {
        const map: Record<string, number> = {};
        (priceRes.data as PriceOverride[]).forEach((row) => {
          map[row.dish_id] = row.price_cents;
        });
        setPriceOverrides(map);
      }
    };

    fetchInitialData();

    // ── 2. Suscripción en tiempo real: stock + precios ──
    const channel = supabase
      .channel("menu-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dish_status" },
        (payload) => {
          const { dish_id, is_available } = payload.new as { dish_id: string; is_available: boolean };
          setOutOfStockIds((prev) => {
            const next = new Set(prev);
            if (is_available) next.delete(dish_id); else next.add(dish_id);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dish_price_overrides" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { dish_id: string };
            setPriceOverrides((prev) => {
              const next = { ...prev };
              delete next[old.dish_id];
              return next;
            });
          } else {
            const row = payload.new as PriceOverride;
            if (row?.dish_id) {
              setPriceOverrides((prev) => ({ ...prev, [row.dish_id]: row.price_cents }));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  /**
   * Merge overrides into dishes so DishCard always shows the current price.
   * Only static dishes from DISHES are overridden here; custom_dishes have their own price.
   */
  const dishesWithPrices = useMemo((): Dish[] => {
    return dishes.map((d) =>
      priceOverrides[d.id] !== undefined
        ? { ...d, priceCents: priceOverrides[d.id] }
        : { ...d }
    );
  }, [dishes, priceOverrides]);

  const filtered = useMemo(() => {
    if (active === "all") return dishesWithPrices;
    return dishesWithPrices.filter((d) => d.category === active);
  }, [dishesWithPrices, active]);

  return (
    <div className="space-y-4">
      {/* Scrollable filter bar – clipped to viewport width, no horizontal overflow */}
      <div
        className="sticky top-14 sm:top-16 z-40 bg-background/95 backdrop-blur border-b shadow-sm sm:border-none sm:shadow-none -mx-4 sm:mx-0"
      >
        <div
          className="flex gap-2 overflow-x-auto py-3 px-4 sm:px-0 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          role="tablist"
          aria-label={t("filterAria")}
        >
        <FilterChip
          selected={active === "all"}
          onClick={() => setActive("all")}
          label={t("categoryAll")}
        />
        {CATEGORY_KEYS.map((key) => (
          <FilterChip
            key={key}
            selected={active === key}
            onClick={() => setActive(key)}
            label={t(`category.${key}`)}
          />
        ))}
        </div>{/* end scrollable inner */}
      </div>{/* end sticky outer */}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dish) => (
            <li key={dish.id}>
              <DishCard
                dish={dish}
                isOutOfStock={outOfStockIds.has(dish.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


type FilterChipProps = {
  selected: boolean;
  onClick: () => void;
  label: string;
};

/**
 * Chip de filtro accesible para categorías del menú.
 */
function FilterChip({ selected, onClick, label }: FilterChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

