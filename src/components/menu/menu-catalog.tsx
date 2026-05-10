"use client";

import { DishCard } from "@/components/menu/dish-card";
import type { Dish } from "@/data/dishes";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useMemo, useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface DBCategory {
  id: string;
  name_es: string;
  name_en: string;
}

export function MenuCatalog({ dishes, initialCategory }: { dishes: readonly Dish[], initialCategory?: string }) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const [active, setActive] = useState<string>(initialCategory || "all");

  useEffect(() => {
    if (initialCategory) {
      setActive(initialCategory);
    }
  }, [initialCategory]);
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<DBCategory[]>([]);

  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [customDishesUpdates, setCustomDishesUpdates] = useState<Record<string, any>>({});

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchInitialData = async () => {
      const [stockRes, priceRes, catRes] = await Promise.all([
        supabase.from("dish_status").select("dish_id").eq("is_available", false),
        supabase.from("dish_price_overrides").select("*"),
        supabase.from("categories").select("id, name_es, name_en").order("sort_order"),
      ]);

      if (catRes.data) setCategories(catRes.data as DBCategory[]);

      if (stockRes.data) {
        setOutOfStockIds(new Set(stockRes.data.map((d: { dish_id: string }) => d.dish_id)));
      }
      if (priceRes.data) {
        const map: Record<string, any> = {};
        priceRes.data.forEach((row) => {
          map[row.dish_id] = row;
        });
        setOverrides(map);
      }
    };

    fetchInitialData();

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
            setOverrides((prev) => {
              const next = { ...prev };
              delete next[old.dish_id];
              return next;
            });
          } else {
            const row = payload.new;
            if (row?.dish_id) {
              setOverrides((prev) => ({ ...prev, [row.dish_id]: row }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_dishes" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setCustomDishesUpdates((prev) => {
              const next = { ...prev, [old.id]: { deleted_at: new Date().toISOString() } };
              return next;
            });
          } else {
            const row = payload.new;
            if (row?.id) {
              setCustomDishesUpdates((prev) => ({ ...prev, [row.id]: row }));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const liveDishes = useMemo((): Dish[] => {
    return dishes.map((d) => {
      // Is it a custom dish? (UUID length is > 30)
      if (d.id.length > 20 && customDishesUpdates[d.id]) {
        const c = customDishesUpdates[d.id];
        if (c.deleted_at) return { ...d, _isDeleted: true } as any;
        return {
          ...d,
          category: c.category,
          nameEs: c.name_es,
          nameEn: c.name_en || c.name_es,
          descriptionEs: c.description_es,
          descriptionEn: c.description_en,
          priceCents: c.price_cents,
          imageUrl: c.image_path,
          allergens: c.allergens
        };
      }

      // Static dish override
      const o = overrides[d.id];
      if (!o) return d;
      if (o.is_deleted) return { ...d, _isDeleted: true } as any;
      
      return {
        ...d,
        category: o.category || d.category,
        nameEs: o.name_es || d.nameEs,
        nameEn: o.name_en || d.nameEn,
        descriptionEs: o.description_es || d.descriptionEs,
        descriptionEn: o.description_en || d.descriptionEn,
        priceCents: o.price_cents ?? d.priceCents,
        imageUrl: o.image_path || d.imageUrl,
        allergens: o.allergens || d.allergens,
      };
    }).filter(d => !d._isDeleted);
  }, [dishes, overrides, customDishesUpdates]);

  const filtered = useMemo(() => {
    if (active === "all") return liveDishes;
    return liveDishes.filter((d) => d.category === active);
  }, [liveDishes, active]);

  return (
    <div className="space-y-4">
      <div className="sticky top-14 sm:top-16 z-40 bg-background/95 backdrop-blur border-b shadow-sm sm:border-none sm:shadow-none -mx-4 sm:mx-0">
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
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              selected={active === cat.id}
              onClick={() => setActive(cat.id)}
              label={locale === "en" && cat.name_en ? cat.name_en : cat.name_es}
            />
          ))}
        </div>
      </div>

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
