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

export function InventoryDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new ingredient
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState<"g" | "ml" | "uds">("g");
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
      const costCents = Math.round(parseFloat(newCost) * 100);
      const stock = parseFloat(newStock);

      const { data, error } = await supabase.from("ingredients").insert({
        name: newName,
        unit: newUnit,
        cost_per_unit_cents: isNaN(costCents) ? 0 : costCents,
        stock_quantity: isNaN(stock) ? 0 : stock,
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
      // Revert on error
      fetchIngredients();
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este ingrediente? Afectará a los escandallos asociados.")) return;
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nombre</label>
              <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background" placeholder="Ej: Arroz jazmín" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Unidad</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value as any)} className="w-full h-10 px-3 rounded-md border bg-background">
                <option value="g">Gramos (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="uds">Unidades (uds)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Costo por unidad (€)</label>
              <input type="number" step="0.01" required value={newCost} onChange={e => setNewCost(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background" placeholder="Ej: 0.05" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Stock Inicial</label>
              <input type="number" step="0.1" required value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background" placeholder="Ej: 5000" />
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
                  <th className="px-4 py-3 font-semibold">Unidad</th>
                  <th className="px-4 py-3 font-semibold">Costo / Ud.</th>
                  <th className="px-4 py-3 font-semibold">Stock Actual</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {ing.stock_quantity <= 0 && <AlertCircle className="w-4 h-4 text-red-500" title="Sin stock" />}
                      {ing.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ing.unit}</td>
                    <td className="px-4 py-3">{formatCentsToCurrency(ing.cost_per_unit_cents, "es")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <input
                          type="number"
                          className="w-20 h-8 px-2 border rounded text-right bg-background"
                          value={ing.stock_quantity}
                          onChange={(e) => updateStock(ing.id, parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-muted-foreground">{ing.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteIngredient(ing.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950">
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
