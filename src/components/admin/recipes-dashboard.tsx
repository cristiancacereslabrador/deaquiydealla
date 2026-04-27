"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DISHES } from "@/data/dishes";
import { formatCentsToCurrency } from "@/lib/money";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChefHat, Plus, Trash2, ChevronDown, ChevronRight, Calculator } from "lucide-react";
import type { Ingredient } from "./inventory-dashboard";

interface DishIngredient {
  dish_id: string;
  ingredient_id: string;
  quantity_required: number;
}

interface CombinedDish {
  id: string;
  nameEs: string;
  priceCents: number;
  isCustom?: boolean;
}

export function RecipesDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<DishIngredient[]>([]);
  const [customDishes, setCustomDishes] = useState<CombinedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDish, setExpandedDish] = useState<string | null>(null);

  // States for adding a new ingredient to a dish
  const [addingToDish, setAddingToDish] = useState<string | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [requiredQty, setRequiredQty] = useState("");
  const [qtyUnit, setQtyUnit] = useState<"kg" | "g" | "l" | "ml" | "base">("g");

  const fetchData = async () => {
    try {
      const [ingRes, recRes, customRes] = await Promise.all([
        supabase.from("ingredients").select("*"),
        supabase.from("dish_ingredients").select("*"),
        supabase.from("custom_dishes").select("id, name_es, price_cents").is("deleted_at", null),
      ]);
      
      if (ingRes.data) setIngredients(ingRes.data as Ingredient[]);
      if (recRes.data) setRecipes(recRes.data as DishIngredient[]);
      if (customRes.data) {
        const mapped = customRes.data.map(d => ({
          id: d.id,
          nameEs: d.name_es,
          priceCents: d.price_cents,
          isCustom: true
        }));
        setCustomDishes(mapped);
      }
    } catch (err) {
      LoggerService.error("RecipesDashboard:fetchData", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleAddIngredientToDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToDish || !selectedIngredientId || !requiredQty) return;

    try {
      let qty = parseFloat(requiredQty);
      
      // Convert to base units (g or ml) if commercial units were selected
      if (qtyUnit === "kg" || qtyUnit === "l") {
        qty = qty * 1000;
      }

      const { data, error } = await supabase.from("dish_ingredients").upsert({
        dish_id: addingToDish,
        ingredient_id: selectedIngredientId,
        quantity_required: qty,
      }).select().single();

      if (error) throw error;
      
      setRecipes(prev => {
        const filtered = prev.filter(r => !(r.dish_id === addingToDish && r.ingredient_id === selectedIngredientId));
        return [...filtered, data as DishIngredient];
      });

      setAddingToDish(null);
      setSelectedIngredientId("");
      setRequiredQty("");
    } catch (err) {
      LoggerService.error("RecipesDashboard:handleAddIngredientToDish", err);
      alert("Error al añadir a la receta.");
    }
  };

  const removeIngredientFromDish = async (dishId: string, ingredientId: string) => {
    try {
      const { error } = await supabase.from("dish_ingredients")
        .delete()
        .eq("dish_id", dishId)
        .eq("ingredient_id", ingredientId);
      
      if (error) throw error;
      setRecipes(prev => prev.filter(r => !(r.dish_id === dishId && r.ingredient_id === ingredientId)));
    } catch (err) {
      LoggerService.error("RecipesDashboard:removeIngredientFromDish", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" /> Recetas
        </h2>
        <p className="text-muted-foreground text-sm">Define qué ingredientes componen cada plato para deducir el stock automáticamente.</p>
      </div>

      <div className="space-y-4">
        {([...DISHES, ...customDishes] as CombinedDish[]).map(dish => {
          const dishRecipes = recipes.filter(r => r.dish_id === dish.id);
          const isExpanded = expandedDish === dish.id;
          
          // Calculate Food Cost
          let totalCostCents = 0;
          dishRecipes.forEach(dr => {
            const ing = ingredients.find(i => i.id === dr.ingredient_id);
            if (ing) {
              totalCostCents += ing.cost_per_unit_cents * dr.quantity_required;
            }
          });
          
          const marginCents = dish.priceCents - totalCostCents;
          const marginPercent = dish.priceCents > 0 ? (marginCents / dish.priceCents) * 100 : 0;

          return (
            <div key={dish.id} className="bg-card border rounded-xl overflow-hidden shadow-sm transition-all">
              {/* Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 select-none"
                onClick={() => setExpandedDish(isExpanded ? null : dish.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {dish.nameEs}
                      {dish.isCustom && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Custom</span>}
                    </h3>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="font-semibold text-primary">{formatCentsToCurrency(dish.priceCents, "es")}</span>
                      <span className="text-muted-foreground">
                        {dishRecipes.length} {dishRecipes.length === 1 ? "ingrediente" : "ingredientes"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Cost Summary Pill */}
                {dishRecipes.length > 0 && (
                  <div className="hidden sm:flex items-center gap-4 bg-muted/50 px-3 py-1.5 rounded-lg border">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Costo (Food Cost)</p>
                      <p className="font-mono text-sm text-red-600 dark:text-red-400">{formatCentsToCurrency(totalCostCents, "es")}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Margen Bruto</p>
                      <p className="font-mono text-sm text-green-600 dark:text-green-400">
                        {formatCentsToCurrency(marginCents, "es")} ({marginPercent.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t bg-muted/10">
                  <div className="mt-4 space-y-4">
                    {/* Ingredients List */}
                    {dishRecipes.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Ingrediente</th>
                            <th className="px-3 py-2 font-semibold">Costo Unit/Comercial</th>
                            <th className="px-3 py-2 font-semibold">Cantidad requerida</th>
                            <th className="px-3 py-2 font-semibold">Costo calc.</th>
                            <th className="px-3 py-2 text-right">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {dishRecipes.map(dr => {
                            const ing = ingredients.find(i => i.id === dr.ingredient_id);
                            if (!ing) return null;
                            const cost = ing.cost_per_unit_cents * dr.quantity_required;
                            
                            return (
                              <tr key={dr.ingredient_id} className="hover:bg-muted/30">
                                <td className="px-3 py-2">
                                  <div className="font-medium">{ing.name}</div>
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {formatCentsToCurrency(ing.cost_per_unit_cents, "es")} / {ing.unit}
                                  {(ing.unit === "g" || ing.unit === "ml") && (
                                    <div className="text-[10px] text-primary/70">
                                      ({formatCentsToCurrency(ing.cost_per_unit_cents * 1000, "es")} / {ing.unit === "g" ? "Kg" : "L"})
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2">{dr.quantity_required} {ing.unit}</td>
                                <td className="px-3 py-2 font-mono">{formatCentsToCurrency(cost, "es")}</td>
                                <td className="px-3 py-2 text-right">
                                  <button 
                                    onClick={() => removeIngredientFromDish(dish.id, ing.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-muted-foreground italic px-2">No hay ingredientes asignados a esta receta. ¡Añade uno para empezar!</p>
                    )}

                    {/* Add Form */}
                    {addingToDish === dish.id ? (
                      <form onSubmit={handleAddIngredientToDish} className="flex flex-wrap gap-2 items-end bg-card p-3 rounded-lg border shadow-sm">
                        <div className="flex-1 min-w-[200px] space-y-1">
                          <label className="text-xs font-semibold">Seleccionar ingrediente</label>
                          <select 
                            required 
                            value={selectedIngredientId} 
                            onChange={e => setSelectedIngredientId(e.target.value)}
                            className="w-full h-9 px-2 rounded border bg-background text-sm"
                          >
                            <option value="" disabled>-- Elige --</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} (en {ing.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1 min-w-[120px]">
                          <label className="text-xs font-semibold">Cantidad</label>
                          <div className="flex gap-1">
                            <input 
                              type="number" step="0.01" required 
                              value={requiredQty} onChange={e => setRequiredQty(e.target.value)}
                              className="flex-1 h-9 px-2 rounded border bg-background text-sm text-right"
                              placeholder="Ej: 0.5"
                            />
                            <select
                              value={qtyUnit}
                              onChange={e => setQtyUnit(e.target.value as any)}
                              className="w-20 h-9 px-1 rounded border bg-muted text-xs font-bold"
                            >
                              {(() => {
                                const ing = ingredients.find(i => i.id === selectedIngredientId);
                                if (ing?.unit === "g") return <><option value="g">Gramos (g)</option><option value="kg">Kilos (Kg)</option></>;
                                if (ing?.unit === "ml") return <><option value="ml">ml</option><option value="l">Litros (L)</option></>;
                                return <option value="base">{ing?.unit || "uds"}</option>;
                              })()}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-9")}>Guardar</button>
                        <button type="button" onClick={() => setAddingToDish(null)} className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-9")}>Cancelar</button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setAddingToDish(dish.id)}
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1")}
                      >
                        <Plus className="w-4 h-4" /> Añadir ingrediente a la receta
                      </button>
                    )}
                  </div>
                  
                  {/* Mobile Mobile Cost Summary */}
                  {dishRecipes.length > 0 && (
                    <div className="mt-4 sm:hidden bg-muted/50 p-3 rounded-lg border grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Costo Total</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCentsToCurrency(totalCostCents, "es")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Margen Bruto</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{marginPercent.toFixed(0)}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
