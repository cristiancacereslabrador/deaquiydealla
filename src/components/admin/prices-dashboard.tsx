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
 * @param {string} value - Raw input string.
 * @returns {number | null} Integer cents or null if invalid.
 */
function euroStringToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

/**
 * @description Converts cents to a displayable Euro string.
 * @param {number} cents - Price in cents.
 * @returns {string} E.g. "10,50"
 */
function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/* ─── Component ──────────────────────────────────────────────────────────── */

/**
 * @description Panel de gestión de precios del catálogo.
 * Los cambios se guardan en `dish_price_overrides` en Supabase
 * y se reflejan inmediatamente en toda la app vía Realtime.
 */
export function PricesDashboard() {
  const supabase = createBrowserSupabaseClient();

  /** Prices currently saved in Supabase (cents). */
  const [savedPrices, setSavedPrices] = useState<PriceMap>({});

  /** Current values the user is editing (raw Euro strings). */
  const [editValues, setEditValues] = useState<EditMap>({});

  /** Set of dish_ids currently being saved. */
  const [saving, setSaving] = useState<Set<string>>(new Set());

  /** Set of dish_ids that were just saved successfully (for flash feedback). */
  const [saved, setSavedFlash] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);

  /* ── Load price overrides ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("dish_price_overrides")
          .select("dish_id, price_cents");

        if (error) throw error;

        const map: PriceMap = {};
        (data ?? []).forEach((row: { dish_id: string; price_cents: number }) => {
          map[row.dish_id] = row.price_cents;
        });
        setSavedPrices(map);

        // Seed edit values with current prices
        const initial: EditMap = {};
        DISHES.forEach((d) => {
          initial[d.id] = centsToEuroString(map[d.id] ?? d.priceCents);
        });
        setEditValues(initial);
      } catch (err) {
        LoggerService.error("PricesDashboard:load", err);
      } finally {
        setLoading(false);
      }
    };

    load();

    /* ── Realtime: sync changes from other sessions ── */
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

  /* ── Save a single dish price ── */
  const savePrice = useCallback(async (dishId: string) => {
    const raw = editValues[dishId] ?? "";
    const cents = euroStringToCents(raw);
    if (cents === null) return; // invalid input

    setSaving((prev) => new Set(prev).add(dishId));
    try {
      const { error } = await supabase
        .from("dish_price_overrides")
        .upsert({ dish_id: dishId, price_cents: cents, updated_at: new Date().toISOString() });

      if (error) throw error;

      setSavedPrices((prev) => ({ ...prev, [dishId]: cents }));
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
  }, [editValues, supabase]);

  /* ── Reset a dish price to its hardcoded default ── */
  const resetPrice = useCallback(async (dishId: string) => {
    const dish = DISHES.find((d) => d.id === dishId);
    if (!dish) return;

    setSaving((prev) => new Set(prev).add(dishId));
    try {
      const { error } = await supabase
        .from("dish_price_overrides")
        .delete()
        .eq("dish_id", dishId);

      if (error) throw error;

      setSavedPrices((prev) => { const next = { ...prev }; delete next[dishId]; return next; });
      setEditValues((prev) => ({ ...prev, [dishId]: centsToEuroString(dish.priceCents) }));
    } catch (err) {
      LoggerService.error("PricesDashboard:resetPrice", err, { dishId });
    } finally {
      setSaving((prev) => { const next = new Set(prev); next.delete(dishId); return next; });
    }
  }, [supabase]);

  /* ── Detect if a price has been modified from saved/default ── */
  const isDirty = (dishId: string): boolean => {
    const dish = DISHES.find((d) => d.id === dishId);
    const currentCents = savedPrices[dishId] ?? dish?.priceCents ?? 0;
    const inputCents = euroStringToCents(editValues[dishId] ?? "");
    return inputCents !== null && inputCents !== currentCents;
  };

  const hasOverride = (dishId: string): boolean => dishId in savedPrices;

  /* ── Group by category for display ── */
  const grouped = DISHES.reduce((acc, dish) => {
    if (!acc[dish.category]) acc[dish.category] = [];
    acc[dish.category].push(dish);
    return acc;
  }, {} as Record<string, typeof DISHES[number][]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando precios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Gestión de Precios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Los cambios se guardan en Supabase y se reflejan <strong>inmediatamente</strong> en toda la app.
            Los precios con{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 align-middle mx-1" />
            están modificados respecto al valor original.
          </p>
        </div>
      </div>

      {/* Price grid grouped by category */}
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
                    dirty
                      ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                      : "bg-background/50 hover:bg-background"
                  )}
                >
                  {/* Dish name + override badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{dish.nameEs}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Original: {defaultPrice} €
                        {override && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                            modificado
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Reset button — only visible when an override exists */}
                    {override && (
                      <button
                        onClick={() => resetPrice(dish.id)}
                        disabled={isSaving}
                        title="Restablecer precio original"
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "h-7 px-2 text-xs bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border shrink-0"
                        )}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Price input + save button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        id={`price-input-${dish.id}`}
                        value={editValues[dish.id] ?? ""}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, [dish.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice(dish.id);
                        }}
                        placeholder={defaultPrice}
                        aria-label={`Precio de ${dish.nameEs}`}
                        className={cn(
                          "w-full rounded-lg border bg-background px-3 py-1.5 text-sm font-mono pr-6 focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
                          dirty ? "border-amber-400" : "border-border"
                        )}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                        €
                      </span>
                    </div>
                    <button
                      onClick={() => savePrice(dish.id)}
                      disabled={isSaving || !dirty}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "h-8 px-3 shrink-0 transition-all",
                        isSaved
                          ? "bg-green-600 hover:bg-green-600 text-white"
                          : dirty
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
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
