"use client";

import { DishCard } from "@/components/menu/dish-card";
import type { Dish, DishCategory } from "@/data/dishes";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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
 * Catálogo filtrable por categoría con rejilla responsive.
 *
 * @param props - Platos disponibles.
 */
export function MenuCatalog({ dishes }: MenuCatalogProps) {
  const t = useTranslations("Catalog");
  const [active, setActive] = useState<DishCategory | "all">("all");

  const filtered = useMemo(() => {
    if (active === "all") return [...dishes];
    return dishes.filter((d) => d.category === active);
  }, [dishes, active]);

  return (
    <div className="space-y-4">
      <div
        className="sticky top-14 sm:top-16 z-40 flex overflow-x-auto hide-scrollbar gap-2 bg-background/95 backdrop-blur py-3 border-b -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-none shadow-sm sm:shadow-none transition-all"
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
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dish) => (
            <li key={dish.id}>
              <DishCard dish={dish} />
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
