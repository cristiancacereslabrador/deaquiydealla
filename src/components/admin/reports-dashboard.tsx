"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCentsToCurrency } from "@/lib/money";
import { LoggerService } from "@/lib/logger";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
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
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "week" | "all">("today");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        if (timeRange === "yesterday") {
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        } else if (timeRange === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === "all") {
          startDate = new Date(0);
        }

        const [ordRes, ingRes, recRes] = await Promise.all([
          supabase
            .from("pedidos")
            .select("id, total_cents, status, created_at, lines")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
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
  }, [supabase, timeRange]);

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

  const lowStock = ingredients.filter(i => i.stock_quantity <= 100 && i.unit !== "uds")
                     .concat(ingredients.filter(i => i.stock_quantity <= 5 && i.unit === "uds"));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Reporte de Rentabilidad
          </h2>
          <p className="text-muted-foreground text-sm">Resumen financiero basado en el costo real de los ingredientes.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button onClick={() => setTimeRange("today")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", timeRange === "today" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Hoy</button>
          <button onClick={() => setTimeRange("yesterday")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", timeRange === "yesterday" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ayer</button>
          <button onClick={() => setTimeRange("week")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", timeRange === "week" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>7D</button>
          <button onClick={() => setTimeRange("all")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", timeRange === "all" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Todo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase">Total Facturado</h3>
          </div>
          <p className="text-3xl font-bold text-primary">{formatCentsToCurrency(totalRevenueCents, "es")}</p>
          <p className="text-xs text-muted-foreground mt-1">En {orders.length} pedidos</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase">Costo Materiales</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCentsToCurrency(totalCostCents, "es")}</p>
          <p className="text-xs text-muted-foreground mt-1">Food Cost estimado</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {isProfitable ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <h3 className="font-bold text-sm uppercase">Margen Bruto</h3>
          </div>
          <p className={cn("text-3xl font-bold", isProfitable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
            {formatCentsToCurrency(grossMarginCents, "es")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Beneficio material</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {grossMarginPercent >= 50 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-yellow-500" />}
            <h3 className="font-bold text-sm uppercase">Rentabilidad (%)</h3>
          </div>
          <p className={cn("text-3xl font-bold", grossMarginPercent >= 50 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400")}>
            {grossMarginPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Meta: &gt; 65%</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 rounded-xl">
          <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Alertas de Stock Crítico
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lowStock.map(ing => (
              <div key={ing.id} className="bg-background/80 p-2.5 rounded-lg border border-amber-200 text-xs font-bold shadow-sm">
                <p className="truncate mb-1">{ing.name}</p>
                <p className="text-amber-600 font-mono">{ing.stock_quantity} {ing.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-primary mb-1">Cierre por WhatsApp</h3>
          <p className="text-sm text-muted-foreground">Envía el reporte del período seleccionado al dueño.</p>
        </div>
        <button
          onClick={() => {
            const rangeText = timeRange === "today" ? "Hoy" : timeRange === "yesterday" ? "Ayer" : timeRange === "week" ? "Semana" : "Total";
            const msg = `📊 *Reporte ${rangeText} - De Aquí y De Allá*\n📅 ${new Date().toLocaleDateString("es")}\n\n✅ *Pedidos:* ${orders.length}\n💰 *Facturado:* ${formatCentsToCurrency(totalRevenueCents, "es")}\n📉 *Costo:* ${formatCentsToCurrency(totalCostCents, "es")}\n💵 *Margen:* ${formatCentsToCurrency(grossMarginCents, "es")} (${grossMarginPercent.toFixed(1)}%)\n\n${lowStock.length > 0 ? `⚠️ *Stock bajo:* ${lowStock.length} ingredientes` : "✅ *Stock OK*"}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          className={cn(buttonVariants(), "w-full sm:w-auto shrink-0 font-bold")}
        >
          Compartir Reporte
        </button>
      </div>
    </div>
  );
}
