"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCentsToCurrency } from "@/lib/money";
import { LoggerService } from "@/lib/logger";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Ingredient } from "./inventory-dashboard";

interface OrderLine {
  dishId: string;
  quantity: number;
}

interface Order {
  id: string;
  total_cents: number;
  status: string;
  created_at: string;
  lines: OrderLine[];
}

interface DishIngredient {
  dish_id: string;
  ingredient_id: string;
  quantity_required: number;
}

export function ReportsDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [ordRes, ingRes, recRes] = await Promise.all([
          // Only fetch today's completed orders
          supabase
            .from("pedidos")
            .select("id, total_cents, status, created_at, lines")
            .gte("created_at", today.toISOString())
            .eq("status", "completed"),
          supabase.from("ingredients").select("*"),
          supabase.from("dish_ingredients").select("*"),
        ]);

        if (ordRes.data) setOrders(ordRes.data as Order[]);
        if (ingRes.data) setIngredients(ingRes.data as Ingredient[]);
        if (recRes.data) setRecipes(recRes.data as DishIngredient[]);
      } catch (err) {
        LoggerService.error("ReportsDashboard:fetchData", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate Metrics
  let totalRevenueCents = 0;
  let totalCostCents = 0;

  orders.forEach(order => {
    totalRevenueCents += order.total_cents;
    
    order.lines.forEach(line => {
      const dishRecipes = recipes.filter(r => r.dish_id === line.dishId);
      dishRecipes.forEach(dr => {
        const ing = ingredients.find(i => i.id === dr.ingredient_id);
        if (ing) {
          totalCostCents += (ing.cost_per_unit_cents * dr.quantity_required) * line.quantity;
        }
      });
    });
  });

  const grossMarginCents = totalRevenueCents - totalCostCents;
  const grossMarginPercent = totalRevenueCents > 0 ? (grossMarginCents / totalRevenueCents) * 100 : 0;
  const isProfitable = grossMarginCents >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Cierre de Caja & Rentabilidad
        </h2>
        <p className="text-muted-foreground text-sm">Resumen financiero basado en los costos de ingredientes registrados (Food Cost) para el día de hoy.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase">Total Facturado</h3>
          </div>
          <p className="text-3xl font-bold text-primary">{formatCentsToCurrency(totalRevenueCents, "es")}</p>
          <p className="text-xs text-muted-foreground mt-1">En {orders.length} pedidos completados</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase">Costo Materiales</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCentsToCurrency(totalCostCents, "es")}</p>
          <p className="text-xs text-muted-foreground mt-1">Gasto en ingredientes (Food Cost)</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {isProfitable ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <h3 className="font-bold text-sm uppercase">Margen Bruto</h3>
          </div>
          <p className={cn("text-3xl font-bold", isProfitable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
            {formatCentsToCurrency(grossMarginCents, "es")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ganancia después de costo de comida</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {grossMarginPercent >= 50 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-yellow-500" />}
            <h3 className="font-bold text-sm uppercase">Rentabilidad (%)</h3>
          </div>
          <p className={cn("text-3xl font-bold", grossMarginPercent >= 50 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400")}>
            {grossMarginPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Objetivo recomendado: &gt; 65%</p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
        <h3 className="font-bold text-primary mb-1">Cierre del Día por WhatsApp</h3>
        <p className="text-sm text-muted-foreground mb-4">Envía el reporte financiero del día de hoy directamente a tu WhatsApp.</p>
        <button
          onClick={() => {
            const msg = `📊 *Cierre de Caja - De Aquí y De Allá*\n📅 ${new Date().toLocaleDateString("es")}\n\n✅ *Pedidos Completados:* ${orders.length}\n💰 *Facturado:* ${formatCentsToCurrency(totalRevenueCents, "es")}\n📉 *Costo Ingredientes:* ${formatCentsToCurrency(totalCostCents, "es")}\n💵 *Beneficio Bruto:* ${formatCentsToCurrency(grossMarginCents, "es")} (${grossMarginPercent.toFixed(1)}%)\n\n¡Buen trabajo chef! 👨‍🍳`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          Enviar Cierre por WhatsApp
        </button>
      </div>
    </div>
  );
}
