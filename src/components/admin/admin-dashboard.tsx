"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DISHES, type Allergen } from "@/data/dishes";
import { formatCentsToCurrency } from "@/lib/money";
import { BRAND_INFO } from "@/lib/brand";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  Package,
  ShoppingBag,
  AlertTriangle,
  Phone,
  MessageCircle,
  Zap,
  ChefHat,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────── */

interface OrderLine {
  dishId: string;
  nameEs: string;
  nameEn: string;
  quantity: number;
  unitPriceCents: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_cents: number;
  status: "pending" | "accepted" | "ready" | "completed";
  created_at: string;
  notes?: string | null;
  lines: OrderLine[];
}

interface DishStatus {
  dish_id: string;
  is_available: boolean;
}

type Column = "pending" | "accepted" | "ready";

const COLUMN_CONFIG: Record<Column, { label: string; color: string; bg: string; icon: React.ReactNode; next: Order["status"] | null; nextLabel: string; nextIcon: React.ReactNode }> = {
  pending: {
    label: "Pendientes",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    icon: <Clock className="w-5 h-5" />,
    next: "accepted",
    nextLabel: "▶ Aceptar pedido",
    nextIcon: <ChefHat className="w-4 h-4" />,
  },
  accepted: {
    label: "En Cocina",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    icon: <ChefHat className="w-5 h-5" />,
    next: "ready",
    nextLabel: "✅ Listo para recoger",
    nextIcon: <Package className="w-4 h-4" />,
  },
  ready: {
    label: "Listos para Recoger",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    icon: <Package className="w-5 h-5" />,
    next: "completed",
    nextLabel: "☑ Recogido",
    nextIcon: <CheckCircle2 className="w-4 h-4" />,
  },
};

/* ─── WhatsApp message builders ────────────────────────────────────────── */

function buildAcceptedMessage(order: Order): string {
  return `✅ *Hola ${order.customer_name}!*\n\nHemos recibido tu pedido *#${order.id.slice(0, 8)}* y lo estamos preparando ahora mismo 👨‍🍳\n\nTe avisaremos cuando esté listo para recoger.\n\n_De Aquí y De Allá — ${BRAND_INFO.address}_`;
}

function buildReadyMessage(order: Order): string {
  return `🎉 *¡Tu pedido está listo, ${order.customer_name}!*\n\n📦 *Pedido #${order.id.slice(0, 8)}* listo para recoger.\n\n📍 *Dónde:* ${BRAND_INFO.address}\n💵 *Pago:* Efectivo / TPV en local\n\n¡Te esperamos! 😊`;
}

function waUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  const prefix = clean.startsWith("34") || clean.startsWith("51") || clean.startsWith("1") ? clean : `34${clean}`;
  return `https://wa.me/${prefix}?text=${encodeURIComponent(message)}`;
}

/* ─── Order Card ─────────────────────────────────────────────────────── */

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: (order: Order) => Promise<void> }) {
  const col = COLUMN_CONFIG[order.status as Column];
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const isUrgent = elapsed > 20 && order.status !== "ready";

  const allergensSet = new Set<Allergen>();
  order.lines.forEach(l => {
    const dish = DISHES.find(d => d.id === l.dishId);
    dish?.allergens.forEach(a => allergensSet.add(a));
  });

  const whatsappMessage = order.status === "pending" || order.status === "accepted"
    ? buildAcceptedMessage(order)
    : buildReadyMessage(order);

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 space-y-3 shadow-sm transition-all",
      col.bg,
      isUrgent && "ring-2 ring-red-500 animate-pulse"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
          <p className="font-bold text-lg leading-tight">{order.customer_name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("font-bold text-sm", isUrgent ? "text-red-600" : "text-muted-foreground")}>
            {elapsed < 60 ? `${elapsed} min` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
          </p>
          <p className="font-bold text-primary">{formatCentsToCurrency(order.total_cents, "es")}</p>
        </div>
      </div>

      {/* Lines */}
      <ul className="space-y-1 border-t border-border/40 pt-2">
        {order.lines.map((l, i) => (
          <li key={i} className="flex justify-between text-sm">
            <span className="font-medium">{l.quantity}× {l.nameEs ?? l.nameEn ?? l.dishId}</span>
            <span className="text-muted-foreground">{formatCentsToCurrency(l.unitPriceCents * l.quantity, "es")}</span>
          </li>
        ))}
      </ul>

      {/* Allergens */}
      {allergensSet.size > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {Array.from(allergensSet).join(", ")}
        </p>
      )}

      {/* Notes */}
      {order.notes && (
        <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
          📝 {order.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
        {/* WhatsApp button */}
        <a
          href={waUrl(order.customer_phone, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "sm" }),
            "w-full justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 text-xs"
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <Phone className="w-3 h-3 opacity-60" />{order.customer_phone}
        </a>

        {/* Advance status button */}
        {col.next && (
          <button
            onClick={() => onAdvance(order)}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full justify-center gap-1.5 text-xs font-bold"
            )}
          >
            {col.nextIcon} {col.nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────────── */

/**
 * @description Panel de cocina en tiempo real con vista kanban de 3 columnas.
 * Soporta instalación PWA en Android e iOS.
 */
export function AdminDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [panicActive, setPanicActive] = useState(false);
  const [outOfStock, setOutOfStock] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  /* ── Initial data load ── */
  useEffect(() => {
    Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: true }).limit(100),
      supabase.from("store_settings").select("*").eq("id", "panic_button").single(),
      supabase.from("dish_status").select("*"),
    ]).then(([ordersRes, panicRes, stockRes]) => {
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (panicRes.data?.value?.active) setPanicActive(true);
      if (stockRes.data) {
        const map = (stockRes.data as DishStatus[]).reduce((acc, row) => {
          acc[row.dish_id] = !row.is_available;
          return acc;
        }, {} as Record<string, boolean>);
        setOutOfStock(map);
      }
      setLoading(false);
    });

    /* ── Realtime subscriptions ── */
    const channel = supabase.channel("admin_kanban")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, (payload) => {
        setOrders(prev => [...prev, payload.new as Order]);
        new Audio("/notification.mp3").play().catch(() => {});
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new.id === "panic_button") setPanicActive(payload.new.value.active);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dish_status" }, (payload) => {
        const row = payload.new as DishStatus;
        if (row) setOutOfStock(prev => ({ ...prev, [row.dish_id]: !row.is_available }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  /* ── Advance order status ── */
  const advanceOrder = useCallback(async (order: Order) => {
    const statusFlow: Record<string, Order["status"]> = {
      pending: "accepted",
      accepted: "ready",
      ready: "completed",
    };
    const next = statusFlow[order.status];
    if (!next) return;

    try {
      await supabase.from("pedidos").update({ status: next }).eq("id", order.id);
      if (next === "accepted") {
        window.open(waUrl(order.customer_phone, buildAcceptedMessage(order)), "_blank");
      } else if (next === "ready") {
        window.open(waUrl(order.customer_phone, buildReadyMessage(order)), "_blank");
      }
    } catch (err) {
      LoggerService.error("AdminDashboard:advanceOrder", err, { orderId: order.id });
    }
  }, [supabase]);

  /* ── Toggle panic ── */
  async function togglePanic() {
    try {
      const newVal = !panicActive;
      await supabase.from("store_settings").upsert({ id: "panic_button", value: { active: newVal }, updated_at: new Date().toISOString() });
      setPanicActive(newVal);
    } catch (err) {
      LoggerService.error("AdminDashboard:togglePanic", err);
    }
  }

  /* ── Toggle stock ── */
  async function toggleStock(dishId: string) {
    try {
      const isAvailable = !!outOfStock[dishId];
      await supabase.from("dish_status").upsert({ dish_id: dishId, is_available: isAvailable, updated_at: new Date().toISOString() });
      setOutOfStock(prev => ({ ...prev, [dishId]: !isAvailable }));
    } catch (err) {
      LoggerService.error("AdminDashboard:toggleStock", err, { dishId });
    }
  }

  /* ── Derived state ── */
  const activeOrders = orders.filter(o => o.status !== "completed");
  const columns: Column[] = ["pending", "accepted", "ready"];
  const todayRevenue = orders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total_cents, 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pendientes ahora</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{activeOrders.length}</p>
          <p className="text-xs text-muted-foreground">En proceso</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === "completed" && new Date(o.created_at).toDateString() === new Date().toDateString()).length}</p>
          <p className="text-xs text-muted-foreground">Completados hoy</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-primary">{formatCentsToCurrency(todayRevenue, "es")}</p>
          <p className="text-xs text-muted-foreground">Facturado hoy</p>
        </div>
      </div>

      {/* ── Panic button ── */}
      <button
        onClick={togglePanic}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full h-14 text-lg font-bold gap-2",
          panicActive
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-card border-2 border-border text-foreground hover:bg-muted"
        )}
      >
        <Zap className="w-5 h-5" />
        {panicActive ? "🔴 LOCAL CERRADO — Toca para reabrir" : "🟢 Local Abierto — Toca para cerrar temporalmente"}
      </button>

      {/* ── Kanban columns ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col);
          const config = COLUMN_CONFIG[col];
          return (
            <div key={col} className="space-y-3">
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border", config.bg)}>
                <div className={cn("flex items-center gap-2 font-bold", config.color)}>
                  {config.icon}
                  {config.label}
                </div>
                <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full bg-background", config.color)}>
                  {colOrders.length}
                </span>
              </div>

              {/* Orders */}
              <div className="space-y-3 min-h-[200px]">
                {colOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-border/50">
                    <p className="text-sm text-muted-foreground">Sin pedidos</p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <OrderCard key={order.id} order={order} onAdvance={advanceOrder} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stock panel ── */}
      <details className="bg-card border rounded-xl overflow-hidden">
        <summary className="px-5 py-4 font-bold cursor-pointer flex items-center gap-2 select-none">
          <ShoppingBag className="w-5 h-5" /> Control de Stock
        </summary>
        <div className="px-5 pb-5 grid gap-2 sm:grid-cols-2">
          {DISHES.map(dish => (
            <div key={dish.id} className="flex items-center justify-between gap-2 py-1">
              <span className="text-sm">{dish.nameEs}</span>
              <button
                onClick={() => toggleStock(dish.id)}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "text-xs shrink-0",
                  outOfStock[dish.id]
                    ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-300 dark:bg-red-950 dark:text-red-400"
                    : "bg-green-100 text-green-700 hover:bg-green-200 border-green-300 dark:bg-green-950 dark:text-green-400"
                )}
              >
                {outOfStock[dish.id] ? "❌ Agotado" : "✅ Disponible"}
              </button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
