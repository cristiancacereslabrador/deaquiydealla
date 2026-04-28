"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DISHES } from "@/data/dishes";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Tag, Check, RotateCcw, Pencil, Settings2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EditDishModal } from "./edit-dish-modal";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type PriceMap = Record<string, number>;
type EditMap = Record<string, string>;

function euroStringToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function PricesDashboard() {
  const supabase = createBrowserSupabaseClient();

  const [savedPrices, setSavedPrices] = useState<PriceMap>({});
  const [editValues, setEditValues] = useState<EditMap>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSavedFlash] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [categories, setCategories] = useState<{ id: string; name_es: string }[]>([]);
  const [combinedDishes, setCombinedDishes] = useState<any[]>([]);
  const [editingDish, setEditingDish] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const [overridesRes, customRes, catRes] = await Promise.all([
        supabase.from("dish_price_overrides").select("*"),
        supabase.from("custom_dishes").select("*").is("deleted_at", null),
        supabase.from("categories").select("id, name_es").order("sort_order"),
      ]);

      if (overridesRes.error) throw overridesRes.error;
      if (customRes.error) throw customRes.error;
      if (catRes.error) throw catRes.error;

      const map: PriceMap = {};
      const deletedStaticIds = new Set<string>();

      (overridesRes.data ?? []).forEach((row) => {
        if (row.is_deleted) {
          deletedStaticIds.add(row.dish_id);
        } else {
          map[row.dish_id] = row.price_cents;
        }
      });
      setSavedPrices(map);

      const customDishes = (customRes.data || []).map(d => ({
        id: d.id,
        category: d.category,
        nameEs: d.name_es,
        nameEn: d.name_en,
        descriptionEs: d.description_es,
        descriptionEn: d.description_en,
        priceCents: d.price_cents,
        imageUrl: d.image_path,
        allergens: d.allergens,
        isCustom: true
      }));

      const staticDishes = DISHES.filter(d => !deletedStaticIds.has(d.id)).map(d => {
        const override = overridesRes.data?.find(o => o.dish_id === d.id);
        return {
          id: d.id,
          category: override?.category || d.category,
          nameEs: override?.name_es || d.nameEs,
          nameEn: override?.name_en || d.nameEn,
          descriptionEs: override?.description_es || d.descriptionEs,
          descriptionEn: override?.description_en || d.descriptionEn,
          priceCents: override?.price_cents ?? d.priceCents,
          imageUrl: override?.image_path || d.imageUrl,
          allergens: override?.allergens || d.allergens,
          isCustom: false
        };
      });

      const all = [...staticDishes, ...customDishes];
      setCombinedDishes(all);
      setCategories(catRes.data || []);

      const initial: EditMap = {};
      all.forEach((d) => {
        initial[d.id] = centsToEuroString(d.priceCents);
      });
      setEditValues(initial);
    } catch (err: any) {
      LoggerService.error("PricesDashboard:load", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("price-overrides-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "dish_price_overrides" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_dishes" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const savePrice = useCallback(async (dishId: string) => {
    const raw = editValues[dishId] ?? "";
    const cents = euroStringToCents(raw);
    if (cents === null) return;

    setSaving((prev) => new Set(prev).add(dishId));
    try {
      const dish = combinedDishes.find(d => d.id === dishId);
      if (!dish) return;

      if (dish.isCustom) {
        const { error } = await supabase
          .from("custom_dishes")
          .update({ price_cents: cents, updated_at: new Date().toISOString() })
          .eq("id", dishId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dish_price_overrides")
          .upsert({ dish_id: dishId, price_cents: cents, updated_at: new Date().toISOString() });
        if (error) throw error;
      }

      await load();

      setSavedFlash((prev) => {
        const next = new Set(prev).add(dishId);
        setTimeout(() => setSavedFlash((s) => { const c = new Set(s); c.delete(dishId); return c; }), 2000);
        return next;
      });
    } catch (err) {
      LoggerService.error("PricesDashboard:savePrice", err, { dishId });
    } finally {
      setSaving((prev) => { const next = new Set(prev); next.delete(dishId); return next; });
    }
  }, [editValues, combinedDishes, supabase, load]);

  const resetPrice = useCallback(async (dishId: string) => {
    const dish = combinedDishes.find((d) => d.id === dishId);
    if (!dish || dish.isCustom) return;

    setSaving((prev) => new Set(prev).add(dishId));
    try {
      const { error } = await supabase.from("dish_price_overrides").delete().eq("dish_id", dishId);
      if (error) throw error;
      await load();
    } catch (err) {
      LoggerService.error("PricesDashboard:resetPrice", err, { dishId });
    } finally {
      setSaving((prev) => { const next = new Set(prev); next.delete(dishId); return next; });
    }
  }, [supabase, combinedDishes, load]);

  const isDirty = (dishId: string): boolean => {
    const dish = combinedDishes.find((d) => d.id === dishId);
    if (!dish) return false;
    const inputCents = euroStringToCents(editValues[dishId] ?? "");
    return inputCents !== null && inputCents !== dish.priceCents;
  };

  const grouped = categories.reduce((acc, cat) => {
    const dishes = combinedDishes.filter(d => d.category === cat.id);
    if (dishes.length > 0) acc[cat.name_es] = dishes;
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Catálogo y Precios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los precios y detalles completos de todos los platos.
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, dishes]) => (
        <section key={category} className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
            <span className="font-bold capitalize text-sm">{category}</span>
            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
              {dishes.length} platos
            </span>
          </div>
          <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => {
              const isSaving = saving.has(dish.id);
              const isSaved = saved.has(dish.id);
              const dirty = isDirty(dish.id);
              const defaultPrice = centsToEuroString(dish.priceCents);

              return (
                <div
                  key={dish.id}
                  className={cn(
                    "rounded-xl border p-3 space-y-3 transition-all",
                    dirty ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20" : "bg-background/50 hover:bg-background"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{dish.nameEs}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Precio Actual: {defaultPrice} €
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setEditingDish(dish)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-md"
                        title="Editar todos los campos"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      {!dish.isCustom && dish.id in savedPrices && (
                        <button onClick={() => resetPrice(dish.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-muted rounded-md" title="Restaurar valores originales">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editValues[dish.id] ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, [dish.id]: e.target.value }))}
                        className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm font-mono pr-6 focus:ring-2 focus:ring-primary"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold pointer-events-none">€</span>
                    </div>
                    <button
                      onClick={() => savePrice(dish.id)}
                      disabled={isSaving || !dirty}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "h-8 px-3 shrink-0",
                        isSaved ? "bg-green-600" : dirty ? "bg-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isSaving ? (
                        <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : isSaved ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {editingDish && (
        <EditDishModal
          dish={editingDish}
          categories={categories}
          onClose={() => setEditingDish(null)}
          onSaved={() => {
            setEditingDish(null);
            load();
          }}
        />
      )}
    </div>
  );
}
