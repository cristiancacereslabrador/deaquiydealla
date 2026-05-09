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
  Printer,
  CalendarRange,
  Volume2,
  Zap,
  ChefHat,
  DoorClosed,
  DoorOpen,
} from "lucide-react";
import { getStoreStatus, DEFAULT_DAILY_SCHEDULE, type DaySchedule } from "@/lib/store-status";

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

function buildAcceptedMessage(order: Order, minutes?: number): string {
  const timeMsg = minutes ? `\n\nEstará listo en unos *${minutes} minutos* aproximadamente 🕒` : "";
  return `*Hola ${order.customer_name}!*\n\nHemos recibido tu pedido *#${order.id.slice(0, 8)}* y ya estamos en la cocina preparando tus platos 🥡${timeMsg}\n\nTe avisaremos por aquí mismo en cuanto esté listo para recoger.\n\n_De Aquí y De Allá_`;
}

function buildReadyMessage(order: Order): string {
  return `✅ *¡Tu pedido está listo, ${order.customer_name}!*\n\n📦 *Pedido #${order.id.slice(0, 8)}* listo para recoger.\n\n📍 *Ubicación:* ${BRAND_INFO.address}\n🗺️ *Ver en Google Maps:* https://maps.app.goo.gl/EJBP3AiC65QQcpUV7\n\n💵 *Pago:* Efectivo o Tarjeta en local\n\n¡Te esperamos! ✨`;
}

function waUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  // Default to Spain (34) if no country code provided
  const prefix = clean.length <= 9 ? `34${clean}` : clean;
  return `https://api.whatsapp.com/send?phone=${prefix}&text=${encodeURIComponent(message)}`;
}

/**
 * @description Envía un pedido directamente a una impresora Epson TM mediante ePOS-Print XML.
 * @param order - El pedido a imprimir.
 * @param ip - La dirección IP de la impresora.
 */
async function sendToEpsonDirect(order: Order, ip: string) {
  const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
  
  // Construcción manual del XML de ePOS-Print
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text font="font_a" width="2" height="2" align="center">${BRAND_INFO.name.toUpperCase()}\\n</text>
      <text align="center">Pedido: #${order.id.slice(0, 8)}\\n</text>
      <feed unit="10"/>
      <text align="left">Cliente: ${order.customer_name}\\n</text>
      <text align="left">Tlf: ${order.customer_phone}\\n</text>
      <text align="left">Fecha: ${new Date(order.created_at).toLocaleString("es-ES")}\\n</text>
      <text>------------------------------------------\\n</text>
  `;

  order.lines.forEach(l => {
    const name = l.nameEs || l.nameEn || l.dishId;
    xml += `<text font="font_a" width="1" height="1">${l.quantity}x ${name}\\n</text>`;
  });

  xml += `
      <text>------------------------------------------\\n</text>
      <text font="font_a" width="2" height="2" align="right">TOTAL: ${formatCentsToCurrency(order.total_cents, "es")}\\n</text>
      <feed unit="30"/>
      <text align="center">¡DE AQUI Y DE ALLA!\\n</text>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"
    },
    body: xml
  });

  if (!response.ok) throw new Error("Printer connection failed");
  return response.text();
}

/* ─── Order Card ─────────────────────────────────────────────────────── */

function OrderCard({ 
  order, 
  onAdvance,
  printerIp,
  isDirectPrintEnabled,
  onPrintManual
}: { 
  order: Order; 
  onAdvance: (order: Order, minutes?: number) => Promise<void>;
  printerIp: string;
  isDirectPrintEnabled: boolean;
  onPrintManual: (order: Order) => void;
}) {
  const col = COLUMN_CONFIG[order.status as Column];
  // eslint-disable-next-line react-hooks/purity
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
        <div className="flex gap-2">
          {/* WhatsApp button */}
          <a
            href={waUrl(order.customer_phone, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1 justify-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 text-xs"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>

          {/* Imprimir Ticket */}
          <button
            onClick={async () => {
              if (isDirectPrintEnabled && printerIp) {
                try {
                  await sendToEpsonDirect(order, printerIp);
                } catch (err) {
                  alert("Error en impresión directa. Revisa la IP o usa el modo normal.");
                  onPrintManual(order);
                }
              } else {
                onPrintManual(order);
              }
            }}
            className={cn(
              buttonVariants({ size: "sm", variant: isDirectPrintEnabled ? "default" : "outline" }),
              "px-3 shrink-0",
              isDirectPrintEnabled && "bg-blue-600 hover:bg-blue-700"
            )}
            title={isDirectPrintEnabled ? "Impresión Directa Activa" : "Imprimir ticket"}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Advance status button */}
        {col.next && (
          order.status === "pending" ? (
            <div className="space-y-2">
              <p className="text-[10px] text-center font-bold text-orange-600 uppercase">¿En cuánto tiempo estará?</p>
              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => onAdvance(order, mins)}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "h-8 text-[10px] px-0 font-bold border-orange-200 hover:bg-orange-100 hover:text-orange-700"
                    )}
                  >
                    {mins}'
                  </button>
                ))}
              </div>
              <button
                onClick={() => onAdvance(order)}
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "w-full h-7 text-[9px] text-muted-foreground underline"
                )}
              >
                Aceptar sin tiempo
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdvance(order)}
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full justify-center gap-1.5 text-xs font-bold"
              )}
            >
              {col.nextIcon} {col.nextLabel}
            </button>
          )
        )}
      </div>

      {/* Remove individual hidden tickets as we use a global one now */}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [combinedDishes, setCombinedDishes] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_DAILY_SCHEDULE);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [printerIp, setPrinterIp] = useState("");
  const [isDirectPrintEnabled, setIsDirectPrintEnabled] = useState(false);

  // Cargar configuración de impresora desde localStorage
  useEffect(() => {
    const savedIp = localStorage.getItem("admin_printer_ip");
    const savedEnabled = localStorage.getItem("admin_direct_print_enabled") === "true";
    if (savedIp) setPrinterIp(savedIp);
    setIsDirectPrintEnabled(savedEnabled);
  }, []);

  const savePrinterConfig = (ip: string, enabled: boolean) => {
    setPrinterIp(ip);
    setIsDirectPrintEnabled(enabled);
    localStorage.setItem("admin_printer_ip", ip);
    localStorage.setItem("admin_direct_print_enabled", String(enabled));
  };

  // Request notification permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Initial data load ── */
  useEffect(() => {
    Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: true }).limit(100),
      supabase.from("store_settings").select("id, value").in("id", ["panic_button", "weekly_schedule"]),
      supabase.from("dish_status").select("*"),
      supabase.from("custom_dishes").select("*").is("deleted_at", null),
      supabase.from("dish_price_overrides").select("*"),
    ]).then(([ordersRes, settingsRes, stockRes, customRes, overridesRes]) => {
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      
      if (settingsRes.data) {
        const panic = settingsRes.data.find(s => s.id === "panic_button");
        if (panic?.value?.active) setPanicActive(true);

        const schedule = settingsRes.data.find(s => s.id === "weekly_schedule");
        if (schedule?.value?.schedule) setWeeklySchedule(schedule.value.schedule);
      }
      
      const overrides = overridesRes.data || [];
      const deletedStaticIds = new Set(overrides.filter(o => o.is_deleted).map(o => o.dish_id));

      const customDishes = (customRes.data || []).map(d => ({
        id: d.id,
        nameEs: d.name_es,
        category: d.category,
        isCustom: true
      }));

      const staticDishes = DISHES.filter(d => !deletedStaticIds.has(d.id)).map(d => {
        const o = overrides.find(ov => ov.dish_id === d.id);
        return {
          ...d,
          nameEs: o?.name_es || d.nameEs,
          category: o?.category || d.category,
          isCustom: false
        };
      });

      setCombinedDishes([...staticDishes, ...customDishes]);

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
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
        
        if ("Notification" in window && Notification.permission === "granted") {
          const newOrder = payload.new as Order;
          new Notification("¡Nuevo Pedido Web!", {
            body: `Pedido de ${newOrder.customer_name} por ${formatCentsToCurrency(newOrder.total_cents, "es")}`,
            icon: "/hugo.png"
          });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new.id === "panic_button") setPanicActive(payload.new.value.active);
        if (payload.new.id === "weekly_schedule") setWeeklySchedule(payload.new.value.schedule);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dish_status" }, (payload) => {
        const row = payload.new as DishStatus;
        if (row) setOutOfStock(prev => ({ ...prev, [row.dish_id]: !row.is_available }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  /* ── Advance order status ── */
  const advanceOrder = useCallback(async (order: Order, minutes?: number) => {
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
        window.open(waUrl(order.customer_phone, buildAcceptedMessage(order, minutes)), "_blank");
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

  /* ── Save Schedule ── */
  async function saveSchedule(newSchedule: DaySchedule[]) {
    try {
      await supabase.from("store_settings").upsert({
        id: "weekly_schedule",
        value: { schedule: newSchedule },
        updated_at: new Date().toISOString()
      });
      setWeeklySchedule(newSchedule);
      setIsEditingSchedule(false);
    } catch (err) {
      LoggerService.error("AdminDashboard:saveSchedule", err);
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
      {/* ── Hidden Printable Ticket (CSS handles visibility) ── */}
      {orderToPrint && (
        <div id="printable-ticket" className="hidden print:block fixed inset-0 z-[999] bg-white text-black p-0 font-mono text-[13px] w-[80mm]">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden !important; }
              #printable-ticket, #printable-ticket * { visibility: visible !important; }
              #printable-ticket { position: fixed; left: 0; top: 0; width: 80mm; height: auto; margin: 0; padding: 10px; background: white; }
              @page { margin: 0; size: 80mm auto; }
            }
          `}} />
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold uppercase">{BRAND_INFO.name}</h1>
            <p className="text-[11px] font-bold">Pedido: #{orderToPrint.id.slice(0, 8)}</p>
            <div className="border-b border-dashed border-black my-2" />
          </div>

          <div className="space-y-1 mb-2">
            <div className="flex justify-between"><span>Cliente:</span><span className="font-bold">{orderToPrint.customer_name}</span></div>
            <div className="flex justify-between"><span>Teléfono:</span><span>{orderToPrint.customer_phone}</span></div>
            <div className="flex justify-between"><span>Fecha/Hora:</span><span>{new Date(orderToPrint.created_at).toLocaleString("es-ES")}</span></div>
          </div>

          <div className="border-b border-dashed border-black my-2" />
          
          <ul className="space-y-1.5">
            {orderToPrint.lines.map((l, i) => (
              <li key={i} className="flex flex-col">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-sm leading-tight">
                    {l.quantity}x {l.nameEs ?? l.nameEn ?? l.dishId}
                  </span>
                  <span className="shrink-0">{formatCentsToCurrency(l.unitPriceCents * l.quantity, "es")}</span>
                </div>
                {/* Desglose de alérgenos por plato si es necesario, o global abajo */}
              </li>
            ))}
          </ul>

          <div className="border-b border-dashed border-black my-2" />

          {orderToPrint.notes && (
            <div className="mb-2">
              <span className="font-bold">Notas:</span> {orderToPrint.notes}
            </div>
          )}

          <div className="flex justify-between text-base font-bold">
            <span>TOTAL:</span>
            <span>{formatCentsToCurrency(orderToPrint.total_cents, "es")}</span>
          </div>

          <div className="border-b border-dashed border-black my-2" />
          <p className="text-center text-[10px] italic mt-2 uppercase tracking-widest">
            ¡De Aquí y De Allá!
          </p>
        </div>
      )}

      {/* ── Configuración de Impresora ── */}
      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Impresora Epson (WiFi)</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Impresión Directa:</span>
            <button
              onClick={() => savePrinterConfig(printerIp, !isDirectPrintEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-background",
                isDirectPrintEnabled ? "bg-blue-600" : "bg-muted"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                isDirectPrintEnabled ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>
        
        {isDirectPrintEnabled && (
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Dirección IP de la Impresora</label>
              <input 
                type="text" 
                placeholder="Ej: 192.168.1.45"
                value={printerIp}
                onChange={(e) => savePrinterConfig(e.target.value, isDirectPrintEnabled)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button 
              onClick={() => {
                const testOrder = { id: "TEST", customer_name: "PRUEBA", customer_phone: "000", created_at: new Date().toISOString(), total_cents: 0, lines: [] } as any;
                sendToEpsonDirect(testOrder, printerIp).catch(() => alert("Error de conexión con la impresora."));
              }}
              className={cn(buttonVariants({ variant: "outline" }), "font-bold")}
            >
              Probar Conexión
            </button>
          </div>
        )}
        {!isDirectPrintEnabled && (
          <p className="text-xs text-muted-foreground italic">
            Usa el botón de la impresora en cada pedido para imprimir usando el diálogo del sistema. Activa la impresión directa para saltarte ese paso (requiere configurar la IP).
          </p>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        <button 
          onClick={() => {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => alert("Por favor, interactúa con la página primero para permitir sonidos."));
          }}
          className="bg-card border rounded-xl p-4 text-center hover:bg-muted transition-colors group"
        >
          <div className="flex flex-col items-center gap-1">
            <Volume2 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold">Probar Sonido</p>
          </div>
        </button>
      </div>

      {/* ── Panic / Cierre temporal ── */}
      <div className={cn(
        "w-full rounded-2xl border-2 overflow-hidden transition-all duration-300",
        panicActive
          ? "border-red-600 bg-red-950/20"
          : "border-border bg-card"
      )}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            {panicActive ? (
              <DoorClosed className="w-8 h-8 text-red-500 shrink-0" />
            ) : (
              <DoorOpen className="w-8 h-8 text-green-500 shrink-0" />
            )}
            <div>
              <p className={cn("text-lg font-bold", panicActive ? "text-red-400" : "text-foreground")}>
                {panicActive ? "🔴 Local cerrado temporalmente" : "🟢 Local abierto"}
              </p>
              <p className="text-sm text-muted-foreground">
                {panicActive
                  ? (() => {
                      const { nextOpening } = getStoreStatus(false);
                      return `Próxima apertura: ${nextOpening ?? "según horario"}`;
                    })()
                  : "Recibiendo pedidos online con normalidad"
                }
              </p>
            </div>
          </div>
          <button
            onClick={togglePanic}
            className={cn(
              buttonVariants({ size: "lg" }),
              "shrink-0 font-bold gap-2 px-8",
              panicActive
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {panicActive ? (
              <><DoorOpen className="w-5 h-5" /> Reabrir local</>
            ) : (
              <><DoorClosed className="w-5 h-5" /> Cerrar temporalmente</>
            )}
          </button>
        </div>
        {panicActive && (
          <div className="px-5 pb-4 text-xs text-red-400/80 border-t border-red-800/30 pt-3">
            ⚠️ Los clientes ven el aviso de cierre en toda la web y no pueden hacer pedidos.
          </div>
        )}
      </div>

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
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAdvance={advanceOrder} 
                      printerIp={printerIp}
                      isDirectPrintEnabled={isDirectPrintEnabled}
                      onPrintManual={(o) => {
                        setOrderToPrint(o);
                        setTimeout(() => window.print(), 100);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stock panel ── */}
      <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <ShoppingBag className="w-5 h-5 text-primary" /> 
            Control de Disponibilidad (Stock)
          </div>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border">
            {combinedDishes.length} platos
          </span>
        </div>
        <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {combinedDishes.map(dish => (
            <div key={dish.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-background/50 hover:bg-background transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{dish.nameEs}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{dish.category}</p>
              </div>
              <button
                onClick={() => toggleStock(dish.id)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  outOfStock[dish.id] ? "bg-muted" : "bg-green-600"
                )}
                role="switch"
                aria-checked={!outOfStock[dish.id]}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    outOfStock[dish.id] ? "translate-x-0" : "translate-x-5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Schedule panel ── */}
      <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <CalendarRange className="w-5 h-5 text-primary" /> 
            Horario Semanal
          </div>
          <button
            onClick={() => setIsEditingSchedule(!isEditingSchedule)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
          >
            {isEditingSchedule ? "Cancelar" : "Editar Horario"}
          </button>
        </div>
        <div className="p-5">
          {isEditingSchedule ? (
            <ScheduleEditor schedule={weeklySchedule} onSave={saveSchedule} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, idx) => {
                const s = weeklySchedule[idx];
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-muted/20">
                    <span className="font-bold text-sm">{day}</span>
                    <span className={cn("text-sm", !s ? "text-red-500 font-bold" : "text-muted-foreground")}>
                      {s ? `${s.open} - ${s.close}` : "Cerrado"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ScheduleEditor({ schedule, onSave }: { schedule: DaySchedule[], onSave: (s: DaySchedule[]) => Promise<void> }) {
  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);
  const [saving, setSaving] = useState(false);
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const handleSave = async () => {
    setSaving(true);
    await onSave(localSchedule);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((day, idx) => {
          const s = localSchedule[idx];
          return (
            <div key={idx} className="p-3 rounded-lg border bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{day}</span>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={s !== null}
                    onChange={(e) => {
                      const newSched = [...localSchedule];
                      newSched[idx] = e.target.checked ? { open: "12:00", close: "21:30" } : null;
                      setLocalSchedule(newSched);
                    }}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  Abierto
                </label>
              </div>
              {s && (
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={s.open}
                    onChange={(e) => {
                      const newSched = [...localSchedule];
                      newSched[idx] = { ...s, open: e.target.value };
                      setLocalSchedule(newSched);
                    }}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                  />
                  <input
                    type="time"
                    value={s.close}
                    onChange={(e) => {
                      const newSched = [...localSchedule];
                      newSched[idx] = { ...s, close: e.target.value };
                      setLocalSchedule(newSched);
                    }}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
