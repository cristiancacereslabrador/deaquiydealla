"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCentsToCurrency } from "@/lib/money";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PackageSearch, Plus, Save, Trash2, AlertCircle } from "lucide-react";

export interface Ingredient {
  id: string;
  name: string;
  unit: "g" | "ml" | "uds";
  cost_per_unit_cents: number;
  stock_quantity: number;
}

/**
 * @description Formatea una cantidad de inventario de forma inteligente (ej: 2000g -> 2 Kg).
 */
function formatStock(qty: number, unit: "g" | "ml" | "uds"): string {
  if (unit === "g" && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.00$/, "")} Kg`;
  if (unit === "ml" && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.00$/, "")} L`;
  return `${qty} ${unit}`;
}

export function InventoryDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new ingredient
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [displayUnit, setDisplayUnit] = useState<"kg" | "g" | "l" | "ml" | "uds">("kg");
  const [newCost, setNewCost] = useState("");
  const [newStock, setNewStock] = useState("");

  // Loading existing ingredients
  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase.from("ingredients").select("*").order("name");
      if (error) throw error;
      setIngredients((data as Ingredient[]) || []);
    } catch (err) {
      LoggerService.error("InventoryDashboard:fetchIngredients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [supabase]);

  // Handle Create
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let costCents = parseFloat(newCost) * 100;
      let stockBase = parseFloat(newStock);
      let baseUnit: "g" | "ml" | "uds" = "g";
      
      // Automatic conversion based on selected display unit
      if (displayUnit === "kg") {
        costCents = costCents / 1000;
        stockBase = stockBase * 1000;
        baseUnit = "g";
      } else if (displayUnit === "g") {
        baseUnit = "g";
      } else if (displayUnit === "l") {
        costCents = costCents / 1000;
        stockBase = stockBase * 1000;
        baseUnit = "ml";
      } else if (displayUnit === "ml") {
        baseUnit = "ml";
      } else {
        baseUnit = "uds";
      }

      const { data, error } = await supabase.from("ingredients").insert({
        name: newName,
        unit: baseUnit,
        cost_per_unit_cents: isNaN(costCents) ? 0 : costCents,
        stock_quantity: isNaN(stockBase) ? 0 : stockBase,
      }).select().single();

      if (error) throw error;
      
      setIngredients((prev) => [...prev, data as Ingredient].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAdding(false);
      setNewName("");
      setNewCost("");
      setNewStock("");
    } catch (err) {
      LoggerService.error("InventoryDashboard:handleAdd", err);
      alert("Error al añadir ingrediente.");
    }
  };

  // Handle Stock Update
  const updateStock = async (id: string, newQty: number) => {
    try {
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, stock_quantity: newQty } : i));
      const { error } = await supabase.from("ingredients").update({ stock_quantity: newQty }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      LoggerService.error("InventoryDashboard:updateStock", err);
      fetchIngredients();
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este ingrediente? Afectará a las recetas asociadas.")) return;
    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      LoggerService.error("InventoryDashboard:deleteIngredient", err);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-primary" /> Inventario Base
          </h2>
          <p className="text-muted-foreground text-sm">Gestiona tus ingredientes y costos.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={cn(buttonVariants(), "gap-2")}
        >
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4" /> Nuevo Ingrediente</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-card border p-4 rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg">Añadir Ingrediente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nombre</label>
              <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background" placeholder="Ej: Arroz jazmín" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Precio de Compra (€)</label>
              <div className="flex gap-1">
                <input type="number" step="0.0001" required value={newCost} onChange={e => setNewCost(e.target.value)} className="flex-1 h-10 px-3 rounded-md border bg-background" placeholder="Precio pagado" />
                <select value={displayUnit} onChange={e => setDisplayUnit(e.target.value as any)} className="w-24 h-10 px-2 rounded-md border bg-muted text-sm font-medium">
                  <option value="kg">por KG</option>
                  <option value="g">por gramo</option>
                  <option value="l">por Litro</option>
                  <option value="ml">por ml</option>
                  <option value="uds">por Unidad</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Stock Actual</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.01" required value={newStock} onChange={e => setNewStock(e.target.value)} className="flex-1 h-10 px-3 rounded-md border bg-background" placeholder="Cantidad" />
                <span className="text-xs font-bold text-muted-foreground min-w-[30px] uppercase">{displayUnit}</span>
              </div>
            </div>
          </div>
          <button type="submit" className={cn(buttonVariants(), "w-full sm:w-auto")}>Guardar Ingrediente</button>
        </form>
      )}

      {ingredients.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
          <PackageSearch className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-lg">Sin ingredientes</p>
          <p className="text-muted-foreground text-sm">Añade tu primer ingrediente para empezar a costear platos.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ingrediente</th>
                  <th className="px-4 py-3 font-semibold">Unidad Base</th>
                  <th className="px-4 py-3 font-semibold">Costo Unitario / Comercial</th>
                  <th className="px-4 py-3 font-semibold">Stock Actual</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {ing.stock_quantity <= 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {ing.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{ing.unit}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">
                        {ing.cost_per_unit_cents.toFixed(4)} € / {ing.unit}
                      </div>
                      {(ing.unit === "g" || ing.unit === "ml") && (
                        <div className="text-[10px] text-muted-foreground font-bold">
                          ({formatCentsToCurrency(ing.cost_per_unit_cents * 1000, "es")} / {ing.unit === "g" ? "Kg" : "L"})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <input
                            type="number"
                            step="0.01"
                            className="w-20 h-8 px-2 border rounded text-right bg-background font-mono"
                            value={ing.stock_quantity}
                            onChange={(e) => updateStock(ing.id, parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-xs text-muted-foreground font-bold uppercase">{ing.unit}</span>
                        </div>
                        <div className="text-[10px] font-bold text-primary">
                          = {formatStock(ing.stock_quantity, ing.unit)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteIngredient(ing.id)} className="text-red-500 hover:text-red-700 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
