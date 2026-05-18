"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Layers, Plus, Trash2, Save, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export interface Category {
  id: string;
  name_es: string;
  name_en: string;
  sort_order: number;
}

export function CategoriesDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // New Category Form
  const [newId, setNewId] = useState("");
  const [newNameEs, setNewNameEs] = useState("");
  const [newNameEn, setNewNameEn] = useState("");

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      LoggerService.error("CategoriesDashboard:fetchCategories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [supabase]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newNameEs) return;

    try {
      const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1;
      
      const { data, error } = await supabase.from("categories").insert({
        id: newId.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name_es: newNameEs,
        name_en: newNameEn || newNameEs,
        sort_order: nextOrder
      }).select().single();

      if (error) throw error;

      setCategories(prev => [...prev, data as Category]);
      setIsAdding(false);
      setNewId("");
      setNewNameEs("");
      setNewNameEn("");
    } catch (err: any) {
      LoggerService.error("CategoriesDashboard:handleAdd", err);
      alert(err.message || "Error al añadir categoría.");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría? Los platos asociados podrían dejar de aparecer correctamente.")) return;
    
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      LoggerService.error("CategoriesDashboard:deleteCategory", err);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newCategories[index].sort_order;
    newCategories[index].sort_order = newCategories[targetIndex].sort_order;
    newCategories[targetIndex].sort_order = tempOrder;

    const tempCat = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = tempCat;

    setCategories([...newCategories]);

    try {
      await Promise.all([
        supabase.from("categories").update({ sort_order: newCategories[index].sort_order }).eq("id", newCategories[index].id),
        supabase.from("categories").update({ sort_order: newCategories[targetIndex].sort_order }).eq("id", newCategories[targetIndex].id)
      ]);
    } catch (err) {
      LoggerService.error("CategoriesDashboard:moveCategory", err);
      fetchCategories();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Gestión de Categorías
          </h2>
          <p className="text-sm text-muted-foreground">Define las secciones de tu carta (Entrantes, Arroces, etc.)</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4" /> Nueva Categoría</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-muted/30 border rounded-xl p-4 grid gap-4 sm:grid-cols-4 items-end animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">ID (Slug)</label>
            <input 
              required value={newId} onChange={e => setNewId(e.target.value)}
              placeholder="ej: tapas"
              className="w-full h-9 px-3 rounded-md border bg-background text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Nombre (ES)</label>
            <input 
              required value={newNameEs} onChange={e => setNewNameEs(e.target.value)}
              placeholder="ej: Tapas Variadas"
              className="w-full h-9 px-3 rounded-md border bg-background text-sm"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nombre (EN)</label>
              <input 
                value={newNameEn} onChange={e => setNewNameEn(e.target.value)}
                placeholder="ej: Mixed Tapas"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
              />
            </div>
            <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-9")}>
              <Save className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold w-10">#</th>
              <th className="px-4 py-3 font-semibold">Categoría (ID)</th>
              <th className="px-4 py-3 font-semibold">Nombre Español</th>
              <th className="px-4 py-3 font-semibold">Nombre Inglés</th>
              <th className="px-4 py-3 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat, idx) => (
              <tr key={cat.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-4 py-3 text-muted-foreground font-mono">{cat.sort_order}</td>
                <td className="px-4 py-3 font-bold">{cat.id}</td>
                <td className="px-4 py-3">{cat.name_es}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.name_en}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 transition-opacity">
                    <button 
                      onClick={() => moveCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
                      title="Subir"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveCategory(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
                      title="Bajar"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground italic">No hay categorías definidas.</div>
        )}
      </div>
    </div>
  );
}
