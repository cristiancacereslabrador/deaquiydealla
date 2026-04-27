"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DISHES } from "@/data/dishes";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Tag, Check, RotateCcw, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/* ─── Types ──────────────────────────────────────────────────────────────── */

/** Map: dish_id → price in cents (from Supabase overrides) */
type PriceMap = Record<string, number>;

/** Local edit state: dish_id → raw string the user is typing */
type EditMap = Record<string, string>;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * @description Converts a Euro string like "10,50" or "10.50" to cents.
 */
function euroStringToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

/**
 * @description Converts cents to a displayable Euro string.
 */
function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/* ─── Component ──────────────────────────────────────────────────────────── */

/**
 * @description Panel de gestión de precios del catálogo.
 * Soporta platos estáticos y platos personalizados desde la base de datos.
 */
export function PricesDashboard() {
  const supabase = createBrowserSupabaseClient();

  const [savedPrices, setSavedPrices] = useState<PriceMap>({});
  const [editValues, setEditValues] = useState<EditMap>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSavedFlash] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [categories, setCategories] = useState<{ id: string; name_es: string }[]>([]);
  const [combinedDishes, setCombinedDishes] = useState<any[]>([]);

  /* ── Load data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [overridesRes, customRes, catRes] = await Promise.all([
          supabase.from("dish_price_overrides").select("dish_id, price_cents"),
          supabase.from("custom_dishes").select("*").is("deleted_at", null),
          supabase.from("categories").select("id, name_es").order("sort_order"),
        ]);

        if (overridesRes.error) throw overridesRes.error;
        if (customRes.error) throw customRes.error;
        if (catRes.error) throw catRes.error;

        // 1. Map overrides for static dishes
        const map: PriceMap = {};
        (overridesRes.data ?? []).forEach((row) => {
          map[row.dish_id] = row.price_cents;
        });
        setSavedPrices(map);

        // 2. Map custom dishes to app format
        const customDishes = (customRes.data || []).map(d => ({
          id: d.id,
          category: d.category,
          nameEs: d.name_es,
          priceCents: d.price_cents,
          isCustom: true
        }));

        const all = [...DISHES.map(d => ({ ...d, isCustom: false })), ...customDishes];
        setCombinedDishes(all);
        setCategories(catRes.data || []);

        // 3. Seed edit values
        const initial: EditMap = {};
        all.forEach((d) => {
          initial[d.id] = centsToEuroString(map[d.id] ?? d.priceCents);
        });
        setEditValues(initial);
      } catch (err: any) {
        LoggerService.error("PricesDashboard:load", err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("price-overrides-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dish_price_overrides" },
        (payload) => {
          const row = payload.new as { dish_id: string; price_cents: number };
          if (row?.dish_id) {
            setSavedPrices((prev) => ({ ...prev, [row.dish_id]: row.price_cents }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  /* ── Save price ── */
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
        setCombinedDishes(prev => prev.map(d => d.id === dishId ? { ...d, priceCents: cents } : d));
      } else {
        const { error } = await supabase
          .from("dish_price_overrides")
          .upsert({ dish_id: dishId, price_cents: cents, updated_at: new Date().toISOString() });
        if (error) throw error;
        setSavedPrices((prev) => ({ ...prev, [dishId]: cents }));
      }

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
  }, [editValues, combinedDishes, supabase]);

  const resetPrice = useCallback(async (dishId: string) => {
    const dish = combinedDishes.find((d) => d.id === dishId);
    if (!dish || dish.isCustom) return;

    setSaving((prev) => new Set(prev).add(dishId));
    try {
      const { error } = await supabase.from("dish_price_overrides").delete().eq("dish_id", dishId);
      if (error) throw error;
      setSavedPrices((prev) => { const next = { ...prev }; delete next[dishId]; return next; });
      setEditValues((prev) => ({ ...prev, [dishId]: centsToEuroString(dish.priceCents) }));
    } catch (err) {
      LoggerService.error("PricesDashboard:resetPrice", err, { dishId });
    } finally {
      setSaving((prev) => { const next = new Set(prev); next.delete(dishId); return next; });
    }
  }, [supabase, combinedDishes]);

  const isDirty = (dishId: string): boolean => {
    const dish = combinedDishes.find((d) => d.id === dishId);
    const currentCents = savedPrices[dishId] ?? dish?.priceCents ?? 0;
    const inputCents = euroStringToCents(editValues[dishId] ?? "");
    return inputCents !== null && inputCents !== currentCents;
  };

  const hasOverride = (dishId: string): boolean => dishId in savedPrices;

  /* ── Group by category ── */
  const grouped = categories.reduce((acc, cat) => {
    const dishes = combinedDishes.filter(d => d.category === cat.id);
    if (dishes.length > 0) {
      acc[cat.name_es] = dishes;
    }
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
            Gestión de Precios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los precios de platos originales y nuevos. Los cambios se reflejan al instante.
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
              const override = hasOverride(dish.id);
              const defaultPrice = centsToEuroString(dish.priceCents);

              return (
                <div
                  key={dish.id}
                  className={cn(
                    "rounded-xl border p-3 space-y-2 transition-all",
                    dirty ? "border-amber-400 bg-amber-50/40" : "bg-background/50 hover:bg-background"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{dish.nameEs}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Base: {defaultPrice} €
                        {override && <span className="ml-1 text-amber-600 font-bold">• modificado</span>}
                      </p>
                    </div>
                    {!dish.isCustom && override && (
                      <button onClick={() => resetPrice(dish.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
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
    </div>
  );
}
