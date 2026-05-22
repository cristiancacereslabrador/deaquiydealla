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
  Trash2,
  BellRing,
  Bell,
} from "lucide-react";
import { getStoreStatus, DEFAULT_DAILY_SCHEDULE, type DaySchedule } from "@/lib/store-status";
import { deleteOrderAction } from "@/actions/delete-order";

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
  estimated_minutes?: number | null;
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
  const reviewLink = "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review"; // TODO: Reemplazar con el link real de Google
  return `✅ *¡Tu pedido está listo, ${order.customer_name}!*\n\n📦 *Pedido #${order.id.slice(0, 8)}* listo para recoger.\n\n📍 *Ubicación:* ${BRAND_INFO.address}\n🗺️ *Ver en Google Maps:* https://maps.app.goo.gl/EJBP3AiC65QQcpUV7\n\n💵 *Pago:* Efectivo o Tarjeta en local\n\n¡Te esperamos! ✨\n\n---\n💬 *¿Te gustó la comida?* Nos ayudarías mucho dejando una reseña aquí: ${reviewLink}`;
}

function waUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  // Default to Spain (34) if no country code provided
  const prefix = clean.length <= 9 ? `34${clean}` : clean;
  return `https://api.whatsapp.com/send?phone=${prefix}&text=${encodeURIComponent(message)}`;
}

/**
 * @description Envía un pedido directamente a una impresora Epson TM mediante ePOS-Print XML.
 * REVERSIÓN TOTAL A VERSIÓN ORIGINAL (0637ed07).
 * Ajustado para evitar bloqueos de seguridad de Chrome (Mixed Content/CORS).
 */
async function sendToEpsonDirect(order: Order, ip: string) {
  if (!ip) throw new Error("No IP provided");
  const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
  
  // Normalizar a ASCII para evitar fallos de codificación en la prueba
  const nameToPrint = BRAND_INFO.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text font="font_a" dw="true" dh="true" b="true" align="center">DE AQUI Y DE ALLA&#10;</text>
      <feed unit="12"/>
      <text font="font_a" align="center">Pedido: #${order.id.slice(0, 8)}&#10;</text>
      <feed unit="12"/>
      <text font="font_a" align="left">Cliente: ${order.customer_name}&#10;</text>
      <text font="font_a" align="left">Tlf: ${order.customer_phone}&#10;</text>
      <text font="font_a" align="left">Fecha: ${new Date(order.created_at).toLocaleString("es-ES")}&#10;</text>
      <text font="font_a">------------------------------&#10;</text>`;

  order.lines.forEach(l => {
    const name = l.nameEs || l.nameEn || l.dishId;
    xml += `\n      <text font="font_a">${l.quantity}x ${name}&#10;</text>`;
  });

  xml += `
      <text font="font_a">------------------------------&#10;</text>
      <text font="font_a" align="right">TOTAL: ${formatCentsToCurrency(order.total_cents, "es")}&#10;</text>
      <feed unit="60"/>
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

  if (!response.ok) throw new Error("Status " + response.status);
  return response.text();
}

/**
 * @description Envía una impresión de prueba.
 */
async function sendTestPrint(ip: string) {
  if (!ip) throw new Error("No IP provided");
  const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text font="font_a" dw="true" dh="true" b="true" align="center">DE AQUI Y DE ALLA&#10;</text>
      <feed unit="12"/>
      <text font="font_a" align="center">Impresión de Prueba&#10;</text>
      <feed unit="12"/>
      <text font="font_a" align="center">Conexión Exitosa&#10;</text>
      <feed unit="60"/>
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

  if (!response.ok) throw new Error("Status " + response.status);
  return response.text();
}

/* ─── Order Card ─────────────────────────────────────────────────────── */

function OrderCard({ 
  order, 
  onAdvance,
  printerIp,
  isDirectPrintEnabled,
  onPrintManual,
  onDelete
}: { 
  order: Order; 
  onAdvance: (order: Order, minutes?: number) => Promise<void>;
  printerIp: string;
  isDirectPrintEnabled: boolean;
  onPrintManual: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(15);
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
    ? buildAcceptedMessage(order, order.estimated_minutes || customMinutes)
    : buildReadyMessage(order);

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 space-y-3 shadow-sm transition-all",
      col.bg,
      isUrgent && "ring-2 ring-red-500 shadow-red-500/20 shadow-lg"
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
            disabled={isPrinting}
            onClick={async () => {
              if (isDirectPrintEnabled && printerIp) {
                setIsPrinting(true);
                try {
                  await sendToEpsonDirect(order, printerIp);
                } catch (err) {
                  alert("Error en impresión directa. Revisa la IP o usa el modo manual.");
                  onPrintManual(order);
                } finally {
                  setIsPrinting(false);
                }
              } else {
                onPrintManual(order);
              }
            }}
            className={cn(
              buttonVariants({ size: "sm", variant: isDirectPrintEnabled ? "default" : "outline" }),
              "px-3 shrink-0",
              isDirectPrintEnabled && "bg-blue-600 hover:bg-blue-700",
              isPrinting && "opacity-70 animate-pulse"
            )}
            title={isDirectPrintEnabled ? "Impresión Directa Activa" : "Imprimir ticket"}
          >
            <Printer className={cn("w-4 h-4", isPrinting && "animate-spin")} />
          </button>

          {/* Botón de eliminar (basurero rojo) */}
          <button
            onClick={() => onDelete(order)}
            className={cn(
              buttonVariants({ size: "sm", variant: "destructive" }),
              "px-3 shrink-0 bg-red-600 hover:bg-red-700 text-white"
            )}
            title="Eliminar pedido permanentemente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Advance status button */}
        {col.next && (
          order.status === "pending" ? (
            <div className="space-y-2 mt-2 border-t pt-2 border-border/40">
              <p className="text-[10px] text-center font-bold text-orange-600 uppercase">¿En cuánto tiempo estará?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomMinutes(m => Math.max(5, m - 5))}
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "px-2 h-8 font-bold border-orange-200 text-orange-700")}
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-sm bg-orange-50 dark:bg-orange-950/20 py-1 rounded-md border border-orange-200">
                  {customMinutes} min
                </div>
                <button
                  onClick={() => setCustomMinutes(m => m + 5)}
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "px-2 h-8 font-bold border-orange-200 text-orange-700")}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => onAdvance(order, customMinutes)}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "w-full h-8 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white"
                )}
              >
                ACEPTAR
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

/**
 * @description Convierte una clave VAPID pública en formato Base64 a un array de bytes Uint8Array.
 * @param {string} base64String - Clave VAPID pública.
 * @returns {Uint8Array} - Array de bytes procesado.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* ─── Main Dashboard ──────────────────────────────────────────────────── */

/**
 * @description Panel de cocina en tiempo real con vista kanban de 3 columnas.
 * Soporta instalación PWA en Android e iOS.
 */
export function AdminDashboard() {
  const supabase = createBrowserSupabaseClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [manualStatus, setManualStatus] = useState<"open" | "closed" | null>(null);
  const [outOfStock, setOutOfStock] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [combinedDishes, setCombinedDishes] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_DAILY_SCHEDULE);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [printerIp, setPrinterIp] = useState("192.168.1.136");
  const [isDirectPrintEnabled, setIsDirectPrintEnabled] = useState(true);
  const [isPrinterEditing, setIsPrinterEditing] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);
  
  // Web Push States
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">("default");
  
  // ─── Debug Console ───
  const [debugLogs, setDebugLogs] = useState<{ time: string, msg: string, type: "error" | "info" }[]>([]);
  const addLog = useCallback((msg: string, type: "error" | "info" = "info") => {
    setDebugLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 20));
  }, []);

  const handleForceUpdate = useCallback(async () => {
    addLog("Iniciando purga completa de caché y Service Workers...", "info");
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          addLog("No se encontraron Service Workers registrados.", "info");
        }
        for (const reg of registrations) {
          await reg.unregister();
          addLog(`Service Worker desregistrado: ${reg.scope}`, "info");
        }
      }
      
      if (typeof window !== "undefined" && "caches" in window) {
        const cacheKeys = await caches.keys();
        if (cacheKeys.length === 0) {
          addLog("No se encontraron bases de datos en caché.", "info");
        }
        for (const key of cacheKeys) {
          await caches.delete(key);
          addLog(`Cache Storage eliminada: ${key}`, "info");
        }
      }

      addLog("¡Purga completada con éxito! Recargando aplicación...", "info");
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Error al purgar caché local:", err);
      addLog(`Error al purgar caché: ${err.message || err}`, "error");
    }
  }, [addLog]);


  // Sintetizador acústico agradable (ding-dong digital) para notificaciones infalibles sin red
  const playSynthesizedChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.95);
    } catch (err) {
      console.warn("Synthesized chime failed:", err);
    }
  }, []);

  // Función para reproducir sonido con reintento si está bloqueado y sintetizador de respaldo
  const playNotificationSound = useCallback(async () => {
    try {
      const audio = new Audio("/notification.mp3");
      await audio.play();
      setIsAudioBlocked(false);
    } catch (err) {
      console.warn("Audio MP3 blocked or failed. Fallback to synthesized chime.");
      playSynthesizedChime();
      setIsAudioBlocked(true);
    }
  }, [playSynthesizedChime]);


  // Cargar configuración de impresora y gestionar auto-conexión
  useEffect(() => {
    const savedIp = localStorage.getItem("admin_printer_ip");
    // Si hay una IP guardada la usamos, si no, se queda la fija por defecto (192.168.1.136)
    if (savedIp) setPrinterIp(savedIp);
    
    // Según requerimiento: "El interruptor de encendido de impresion se debe activar solo cuando se abra la app"
    setIsDirectPrintEnabled(true);
  }, []);

  // Helper to wrap a promise with a timeout to prevent infinite freezes
  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMsg));
      }, ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // Helper to get SW registration safely with a 5-second timeout to prevent infinite hangs
  const getSWRegistration = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      throw new Error("Service Worker no es compatible con tu navegador.");
    }

    // 1. Intentar obtener registro existente
    let reg = await navigator.serviceWorker.getRegistration();
    
    // 2. Si no hay registro, intentar registrar activamente
    if (!reg) {
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
      } catch (err: any) {
        console.warn("Fallo al registrar SW de forma activa:", err);
      }
    }

    // 3. Esperar que esté listo con timeout de 5 segundos
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (reg) {
          resolve(reg);
        } else {
          reject(new Error("Tiempo de espera agotado conectando con el Service Worker (5s)."));
        }
      }, 5000);

      navigator.serviceWorker.ready
        .then((readyReg) => {
          clearTimeout(timeout);
          resolve(readyReg);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }, []);

  // Helper to ensure the Service Worker is fully active before any Push operation
  const ensureActiveSW = useCallback(async (reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> => {
    if (reg.active) {
      return reg;
    }

    const sw = reg.installing || reg.waiting;
    if (sw) {
      addLog(`Service Worker detectado en estado: ${sw.state}. Esperando activación activa...`, "info");
      await new Promise<void>((resolve) => {
        if (sw.state === "activated") {
          resolve();
          return;
        }
        const stateHandler = () => {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", stateHandler);
            resolve();
          }
        };
        sw.addEventListener("statechange", stateHandler);
        
        // Timeout de seguridad de 10 segundos para dispositivos lentos
        setTimeout(resolve, 10000);
      });
    }

    // Esperar pacientemente a que Chrome propague reg.active (hasta 15 segundos)
    addLog("Verificando propagación del Service Worker activo...", "info");
    let checks = 0;
    while (!reg.active && checks < 50) {
      await new Promise(r => setTimeout(r, 300));
      checks++;
    }

    if (!reg.active) {
      throw new Error("El Service Worker está registrado pero no está activo en el navegador. Por favor, pulsa el botón rojo 'Forzar Actualización' arriba de los logs.");
    }

    addLog("Service Worker confirmado como ACTIVO en el navegador.", "info");
    return reg;
  }, [addLog]);

  // Verificar si Web Push es compatible y si el usuario ya está suscrito
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSW = "serviceWorker" in navigator;
      const hasPM = "PushManager" in window;
      const isSecure = window.isSecureContext;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      addLog(`Diagnóstico Push: ServiceWorker=${hasSW ? "SÍ" : "NO"}, PushManager=${hasPM ? "SÍ" : "NO"}, SSL Seguro=${isSecure ? "SÍ" : "NO"}, VAPID Key=${vapidPublicKey ? "CONFIGURADA" : "FALTA"}`, "info");

      if (hasSW && hasPM) {
        setIsPushSupported(true);
        if ("Notification" in window) {
          setNotificationPermission(Notification.permission as any);
        }
        
        getSWRegistration()
          .then(async (registration) => {
            try {
              // Asegurar que esté activo antes de verificar suscripción
              const activeReg = await ensureActiveSW(registration);
              
              const subscription = await withTimeout(
                activeReg.pushManager.getSubscription(),
                5000,
                "Límite de tiempo agotado al verificar suscripción push local."
              );
              setIsPushSubscribed(!!subscription);

              // AUTO-ACTIVACIÓN INTELIGENTE: Si el usuario ya dio permisos de notificación previamente en este dispositivo
              // pero por alguna razón no está suscrito localmente, realizamos la suscripción de forma automática y silenciosa
              if (!subscription && Notification.permission === "granted") {
                if (vapidPublicKey) {
                  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
                  const newSub = await withTimeout(
                    activeReg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: convertedKey as any,
                    }),
                    8000,
                    "Tiempo de espera agotado al conectar con los servidores Push de Google."
                  );
                  
                  await fetch("/api/admin/push/subscribe", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      subscription: newSub,
                      action: "subscribe",
                    }),
                  });
                  
                  setIsPushSubscribed(true);
                  setNotificationPermission("granted");
                  addLog("Auto-activación exitosa: Avisos en segundo plano activados automáticamente (permiso previo detectado).", "info");
                }
              }
            } catch (err: any) {
              console.error("Error al verificar o auto-suscribir la suscripción push:", err);
              addLog(`Error al verificar suscripción push: ${err.message || err}`, "error");
            }
          })
          .catch((err) => {
            console.error("Service worker ready failed:", err);
            addLog(`Fallo al esperar Service Worker: ${err.message || err}`, "error");
          });
      } else {
        setIsPushSupported(false);
        addLog("Notificaciones Web Push desactivadas por el navegador debido a falta de HTTPS/SSL, Modo Incógnito o navegador obsoleto.", "error");
      }
    }
  }, [addLog, getSWRegistration, ensureActiveSW]);

  // Manejar activación / desactivación de notificaciones push en segundo plano
  const handleTogglePush = async () => {
    if (!isPushSupported || isPushLoading) return;
    setIsPushLoading(true);
    addLog("Configurando avisos en segundo plano...", "info");

    try {
      addLog("Esperando conexión con el Service Worker...", "info");
      const registration = await getSWRegistration();
      
      addLog("Asegurando activación completa del Service Worker...", "info");
      const activeReg = await ensureActiveSW(registration);
      addLog("Service Worker confirmado como ACTIVO. Verificando estado...", "info");

      if (isPushSubscribed) {
        addLog("Cancelando suscripción de avisos...", "info");
        // Desuscribirse con timeout de 6 segundos
        const subscription = await withTimeout(
          activeReg.pushManager.getSubscription(),
          6000,
          "Límite de tiempo agotado al verificar suscripción push."
        );
        if (subscription) {
          await subscription.unsubscribe();
          
          // Eliminar del backend
          const response = await fetch("/api/admin/push/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscription,
              action: "unsubscribe",
            }),
          });

          if (!response.ok) {
            console.warn("No se pudo remover la suscripción en el servidor, pero se desactivó localmente.");
          }

          setIsPushSubscribed(false);
          if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationPermission(Notification.permission as any);
          }
          addLog("Avisos en segundo plano DESACTIVADOS.", "info");
        }
      } else {
        addLog("Solicitando permisos de notificación al navegador...", "info");
        // Solicitar permisos de notificación nativa
        const permission = await Notification.requestPermission();
        addLog(`Permiso de notificación respondido: ${permission}`, "info");
        if (typeof window !== "undefined" && "Notification" in window) {
          setNotificationPermission(Notification.permission as any);
        }
        if (permission !== "granted") {
          addLog("Permiso de notificación DENEGADO por el usuario.", "error");
          setIsPushLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          addLog("Error: NEXT_PUBLIC_VAPID_PUBLIC_KEY no está configurada en Vercel.", "error");
          setIsPushLoading(false);
          return;
        }

        addLog("Generando canal seguro Web Push...", "info");
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        // Suscribirse con timeout de 10 segundos
        const subscription = await withTimeout(
          activeReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey as any,
          }),
          10000,
          "Tiempo de espera agotado al conectar con los servidores Push de Google (10s). Revisa tu conexión a internet o los Google Play Services."
        );

        addLog("Guardando suscripción en la base de datos (Supabase)...", "info");
        // Registrar en el backend
        const response = await fetch("/api/admin/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription,
            action: "subscribe",
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Error al registrar la suscripción en la base de datos.");
        }

        setIsPushSubscribed(true);
        if (typeof window !== "undefined" && "Notification" in window) {
          setNotificationPermission(Notification.permission as any);
        }
        addLog("¡Avisos en segundo plano (tipo WhatsApp) ACTIVADOS!", "info");
      }
    } catch (err: any) {
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationPermission(Notification.permission as any);
      }
      LoggerService.error("handleTogglePush", err);
      addLog(`Error al configurar push: ${err.message || err}`, "error");
    } finally {
      setIsPushLoading(false);
    }
  };

  // Prevenir que la pantalla de la tablet de cocina entre en suspensión por inactividad (Wake Lock API)
  useEffect(() => {
    let wakeLock: any = null;
    
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          addLog("Bloqueo de suspensión de pantalla (Wake Lock) ACTIVO.", "info");
        }
      } catch (err: any) {
        console.warn(`Wake Lock no soportado o bloqueado por el navegador: ${err.message}`);
      }
    }

    requestWakeLock();

    // Volver a solicitar el bloqueo de pantalla activa si el usuario minimiza y regresa
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        }).catch(() => {});
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [addLog]);

  // Se ha cambiado la URL de verificación a la raíz de la impresora (interfaz web).
  // Esto evita enviar peticiones incompletas al servicio ePOS que causaban que la impresora expulsara papel.
  const checkPrinterConnection = useCallback(async (ip: string) => {
    if (!ip || !isDirectPrintEnabled) return;
    setPrinterStatus("checking");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Hacemos un ping a la página web de administración de la impresora (EpsonNet).
      // Esto confirma que está viva en la red, sin tocar el sistema de impresión.
      await fetch(`http://${ip}/`, { method: "GET", mode: "no-cors", signal: controller.signal });
      clearTimeout(timeoutId);
      
      setPrinterStatus("online");
    } catch (err: any) {
      setPrinterStatus("offline");
      if (err?.message?.includes("failed") || err?.message?.includes("fetch")) {
        if (window.location.protocol === "https:" && ip.startsWith("192.")) {
          addLog("Posible bloqueo HTTPS -> IP local. Prueba entrar por HTTP.", "error");
        }
      }
    }
  }, [isDirectPrintEnabled, addLog]);

  // Verificar estado al cargar o al cambiar la IP, para que el indicador muestre CONECTADO
  useEffect(() => {
    if (isDirectPrintEnabled && printerIp) {
      checkPrinterConnection(printerIp);
      
      // Opcional: Verificar periódicamente cada 60 segundos
      const interval = setInterval(() => {
        checkPrinterConnection(printerIp);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isDirectPrintEnabled, printerIp, checkPrinterConnection]);

  const handleTestPrint = async () => {
    if (!printerIp || !isDirectPrintEnabled) return;
    setPrinterStatus("checking");
    addLog(`Enviando impresión de prueba a ${printerIp}...`);
    try {
      await sendTestPrint(printerIp);
      setPrinterStatus("online");
      addLog("Impresión de prueba enviada exitosamente. Impresora conectada.", "info");
    } catch (err: any) {
      setPrinterStatus("offline");
      const name = err?.name || "Error";
      const msg = err?.message || String(err);
      addLog(`[${name}] ${msg}`, "error");
      
      if (msg.includes("failed") || msg.includes("fetch")) {
        if (window.location.protocol === "https:" && printerIp.startsWith("192.")) {
          addLog("Posible bloqueo HTTPS -> IP local. Prueba entrar por HTTP.", "error");
        }
      }
    }
  };



  const savePrinterConfig = (ip: string, enabled: boolean) => {
    setPrinterIp(ip);
    setIsDirectPrintEnabled(enabled);
    localStorage.setItem("admin_printer_ip", ip);
    setIsPrinterEditing(false);
  };

  // Request notification permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Sincronizador de datos robusto ── */
  const loadDashboardData = useCallback(() => {
    Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: true }).limit(100),
      supabase.from("store_settings").select("id, value").in("id", ["store_status", "weekly_schedule"]),
      supabase.from("dish_status").select("*"),
      supabase.from("custom_dishes").select("*").is("deleted_at", null),
      supabase.from("dish_price_overrides").select("*"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([ordersRes, settingsRes, stockRes, customRes, overridesRes, profilesRes]) => {
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (profilesRes && profilesRes.count !== null) setRegisteredUsersCount(profilesRes.count);
      
      if (settingsRes.data) {
        const status = settingsRes.data.find(s => s.id === "store_status");
        if (status?.value?.manual_override) setManualStatus(status.value.manual_override);

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
    }).catch(err => {
      addLog(`Error al cargar datos: ${err.message}`, "error");
      LoggerService.error("AdminDashboard:loadDashboardData", err);
    });
  }, [supabase, addLog]);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ── Suscripción Realtime blindada ante reinicios cosméticos ── */
  useEffect(() => {
    const channel = supabase.channel("admin_kanban")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newOrder = payload.new as Order;
          console.log("REALTIME INSERT:", newOrder);
          setOrders(prev => {
            // Evitar duplicados por si acaso
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });
          addLog(`Nuevo pedido #${newOrder.id.slice(0,8)} detectado en tiempo real.`);
          
          playNotificationSound();
        } else if (payload.eventType === "UPDATE") {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        } else if (payload.eventType === "DELETE") {
          const oldId = payload.old.id;
          console.log("REALTIME DELETE:", oldId);
          setOrders(prev => prev.filter(o => o.id !== oldId));
          addLog(`Pedido #${oldId.slice(0, 8)} eliminado en tiempo real.`);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (payload) => {
        if (payload.new.id === "store_status") setManualStatus(payload.new.value.manual_override);
        if (payload.new.id === "weekly_schedule") setWeeklySchedule(payload.new.value.schedule);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dish_status" }, (payload) => {
        const row = payload.new as DishStatus;
        if (row) setOutOfStock(prev => ({ ...prev, [row.dish_id]: !row.is_available }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        setRegisteredUsersCount(prev => prev + 1);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "profiles" }, () => {
        setRegisteredUsersCount(prev => prev - 1);
      })
      .subscribe((status) => {
        addLog(`Canal Pedidos: ${status.toUpperCase()}`, status === "SUBSCRIBED" ? "info" : "error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, playNotificationSound, addLog, reconnectTrigger]);

  // Escuchar eventos de visibilidad y conexión a internet para tablets/móviles (evita suspensiones de socket)
  useEffect(() => {
    const handleVisibilityOrNetworkChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        addLog("Tablet desbloqueada/reconectada. Sincronizando pedidos...");
        loadDashboardData();
        // Disparar reconexión del canal de Supabase
        setReconnectTrigger(prev => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrNetworkChange);
    window.addEventListener("online", handleVisibilityOrNetworkChange);
    window.addEventListener("focus", handleVisibilityOrNetworkChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrNetworkChange);
      window.removeEventListener("online", handleVisibilityOrNetworkChange);
      window.removeEventListener("focus", handleVisibilityOrNetworkChange);
    };
  }, [loadDashboardData, addLog]);

  /* ── Advance order status ── */
  const advanceOrder = useCallback(async (order: Order, minutes?: number) => {
    const statusFlow: Record<string, Order["status"]> = {
      pending: "accepted",
      accepted: "ready",
      ready: "completed",
    };
    const next = statusFlow[order.status];
    if (!next) return;

    // 1. Abrir WhatsApp ANTES del await para evitar que el navegador bloquee el popup
    if (next === "accepted") {
      window.open(waUrl(order.customer_phone, buildAcceptedMessage(order, minutes)), "_blank");
    } else if (next === "ready") {
      window.open(waUrl(order.customer_phone, buildReadyMessage(order)), "_blank");
    }

    try {
      const updateData: any = { status: next };
      if (minutes) updateData.estimated_minutes = minutes;
      
      const { data, error } = await supabase.from("pedidos").update(updateData).select().eq("id", order.id);
      
      if (error) {
        addLog(`Error al actualizar estado del pedido: ${error.message}`, "error");
        LoggerService.error("AdminDashboard:advanceOrder:Supabase", error, { orderId: order.id });
        alert(`Error al actualizar estado: ${error.message}`);
        return; // Detener flujo si la BD falla
      }
      
      if (Array.isArray(data) && data[0]) {
        setOrders(prev => prev.map(o => o.id === order.id ? data[0] as Order : o));
      }
      if (next === "accepted") {
        // Imprimir ticket al aceptar
        if (isDirectPrintEnabled && printerIp) {
          try {
            await sendToEpsonDirect(order, printerIp);
            setPrinterStatus("online");
            addLog(`Impresión de pedido #${order.id.slice(0,8)} enviada al aceptar.`, "info");
          } catch (err: any) {
            setPrinterStatus("offline");
            addLog(`Error al imprimir pedido #${order.id.slice(0,8)}: ${err.message}`, "error");
          }
        }
      }
    } catch (err) {
      LoggerService.error("AdminDashboard:advanceOrder", err, { orderId: order.id });
      addLog(`Excepción al avanzar pedido: ${String(err)}`, "error");
    }
  }, [supabase, isDirectPrintEnabled, printerIp, addLog]);

  /* ── Delete Order ── */
  const handleDeleteOrder = async (orderId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteOrderAction(orderId);
      if (result.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setOrderToDelete(null);
        addLog(`Pedido #${orderId.slice(0, 8)} eliminado exitosamente.`);
      } else {
        alert(`Error al eliminar el pedido: ${result.message}`);
      }
    } catch (err: any) {
      console.error("Error al eliminar pedido:", err);
      alert(`Error inesperado al eliminar el pedido: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Toggle manual status ── */
  async function updateManualStatus(status: "open" | "closed" | null) {
    try {
      await supabase.from("store_settings").upsert({ 
        id: "store_status", 
        value: { manual_override: status }, 
        updated_at: new Date().toISOString() 
      });
      setManualStatus(status);
    } catch (err) {
      LoggerService.error("AdminDashboard:updateManualStatus", err);
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
      {/* ── Alerta de Sonido Bloqueado ── */}
      {isAudioBlocked && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-bounce mt-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            <p className="text-sm font-bold">El navegador ha bloqueado el sonido. Haz clic en "Probar Sonido" para activarlo.</p>
          </div>
          <button 
            onClick={() => {
              playNotificationSound();
              setIsAudioBlocked(false);
            }}
            className="bg-white text-amber-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
          >
            Activar ahora
          </button>
        </div>
      )}

      {/* ── Banner de Activación Proactiva de Alertas en Segundo Plano ── */}
      {typeof window !== "undefined" && notificationPermission === "default" && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse mt-2 border border-orange-400">
          <div className="flex gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
              <BellRing className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">🚨 ¡ALERTA DE NUEVOS PEDIDOS DESACTIVADA! (ACCIÓN NECESARIA)</h3>
              <p className="text-xs text-white/90 mt-1 max-w-xl">
                Para que esta tablet pite e informe de nuevos pedidos de inmediato, <strong>incluso con la pantalla apagada o bloqueada</strong>, debes activar las notificaciones nativas en segundo plano.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await handleTogglePush();
              if (typeof window !== "undefined" && "Notification" in window) {
                setNotificationPermission(Notification.permission as any);
              }
            }}
            className="bg-white hover:bg-white/90 text-red-600 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-transform hover:scale-105 shrink-0 w-full md:w-auto text-center animate-none"
          >
            🔔 Activar Avisos de Cocina
          </button>
        </div>
      )}

      {/* ── Alerta de Permisos Denegados ── */}
      {typeof window !== "undefined" && notificationPermission === "denied" && (
        <div className="bg-amber-600 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2 border border-amber-500">
          <div className="flex gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">⚠️ LAS ALERTAS ESTÁN BLOQUEADAS EN TU DISPOSITIVO</h3>
              <p className="text-xs text-white/90 mt-1 max-w-xl">
                Has desactivado o bloqueado los permisos de notificación. Para habilitar los sonidos en segundo plano, ve a los <strong>Ajustes de tu tablet Android &gt; Aplicaciones &gt; De Aquí y De Allá &gt; Notificaciones</strong>, actívalas y permite el <strong>Sonido</strong>.
              </p>
            </div>
          </div>
          <a
            href="#pwa-guide-section"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("pwa-guide-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0 w-full md:w-auto text-center border border-white/30"
          >
            Ver Guía de Ajustes Android ⚙️
          </a>
        </div>
      )}

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
            <div className="flex justify-center mb-2">
              <h1 className="text-2xl font-black uppercase whitespace-nowrap">DE AQUÍ Y DE ALLÁ</h1>
            </div>
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
        </div>
      )}

      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
              printerStatus === "online" ? "bg-green-100 text-green-600 dark:bg-green-950/40" : 
              printerStatus === "offline" ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-muted text-muted-foreground"
            )}>
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Impresora Térmica</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full border border-black/5 shadow-sm",
                  printerStatus === "online" ? "bg-green-500 animate-pulse" : 
                  printerStatus === "offline" ? "bg-red-500" : "bg-muted"
                )} />
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  printerStatus === "online" ? "text-green-600 dark:text-green-400" : 
                  printerStatus === "offline" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                )}>
                  {printerStatus === "online" ? "CONECTADO" : 
                   printerStatus === "offline" ? "Desconectada" : 
                   printerStatus === "checking" ? "Verificando..." : "Inactiva"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Impresión:</span>
              <button
                onClick={() => setIsDirectPrintEnabled(!isDirectPrintEnabled)}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isDirectPrintEnabled ? "bg-blue-600" : "bg-muted"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  isDirectPrintEnabled ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>
        
        {isDirectPrintEnabled && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="w-full space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Dirección IP de la Impresora</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Ej: 192.168.1.54"
                    value={printerIp}
                    disabled={!isPrinterEditing}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70 disabled:bg-muted/30 font-mono"
                  />
                  {isPrinterEditing && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button 
                        onClick={() => {
                          const saved = localStorage.getItem("admin_printer_ip");
                          if (saved) setPrinterIp(saved);
                          setIsPrinterEditing(false);
                        }}
                        className="text-[10px] font-bold bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0">
                {!isPrinterEditing ? (
                  <button 
                    onClick={() => setIsPrinterEditing(true)}
                    className={cn(buttonVariants({ variant: "outline" }), "font-bold h-12 rounded-xl border-2")}
                  >
                    Editar IP
                  </button>
                ) : (
                  <button 
                    onClick={() => savePrinterConfig(printerIp, isDirectPrintEnabled)}
                    className={cn(buttonVariants({ variant: "default" }), "font-bold h-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20")}
                  >
                    Guardar IP
                  </button>
                )}
                
                <button 
                  onClick={handleTestPrint}
                  disabled={printerStatus === "checking"}
                  className={cn(buttonVariants({ variant: "outline" }), "font-bold h-12 rounded-xl border-2")}
                >
                  {printerStatus === "checking" ? "..." : "Probar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Consola de Depuración (Debug Console) ── */}
        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Consola de Depuración (Logs)
            </h4>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleForceUpdate} 
                className="text-[9px] text-red-500 hover:text-red-600 font-bold hover:underline flex items-center gap-0.5"
                title="Elimina el Service Worker y toda la caché guardada en el dispositivo para cargar la versión más reciente en caliente."
              >
                🔄 Forzar Actualización
              </button>
              <span className="text-[9px] text-muted-foreground/30">|</span>
              <button onClick={() => setDebugLogs([])} className="text-[9px] text-primary hover:underline">Limpiar Logs</button>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-3 font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto shadow-inner border border-white/5">
            {debugLogs.length === 0 ? (
              <p className="text-slate-600 italic">No hay actividad reciente...</p>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className={cn("break-all flex gap-2", log.type === "error" ? "text-red-400" : "text-green-400")}>
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span>{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

        
        {!isDirectPrintEnabled && (
          <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">
            El interruptor de impresión está <strong>APAGADO</strong>. No se realizarán intentos de conexión ni impresiones automáticas hasta que se active manualmente o se reinicie la app.
          </p>
        )}
      </div>

      {/* ── Web Push Background Notifications (WhatsApp-Style) ── */}
      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0",
              isPushSubscribed ? "bg-green-100 text-green-600 dark:bg-green-950/40" : "bg-muted text-muted-foreground"
            )}>
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Avisos en Segundo Plano (Tipo WhatsApp)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Recibe alertas sonoras instantáneas y notificaciones al recibir pedidos nuevos, incluso con la pantalla de la tablet apagada o bloqueada.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 shrink-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estado:</span>
              <button
                disabled={!isPushSupported || isPushLoading}
                onClick={handleTogglePush}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                  isPushSubscribed ? "bg-blue-600" : "bg-muted"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  isPushSubscribed ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>

        {!isPushSupported && (
          <p className="text-xs text-red-500 font-medium border-t border-border/50 pt-3">
            ⚠️ Tu navegador o dispositivo no soporta Notificaciones Web Push. Debes usar un navegador moderno como Google Chrome en Android o Microsoft Edge en Windows, y asegurarte de tener instalada la PWA.
          </p>
        )}
        
        {isPushSupported && !isPushSubscribed && (
          <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-3">
            El sistema de avisos nativos está <strong>DESACTIVADO</strong>. Actívalo para que el dispositivo suene de inmediato ante nuevos pedidos sin necesidad de mantener la pantalla encendida.
          </p>
        )}

        {isPushSupported && isPushSubscribed && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium border-t border-border/50 pt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            ¡Avisos en segundo plano ACTIVOS! La tablet pitará de inmediato al recibir cualquier pedido nuevo.
          </p>
        )}

        {/* ── Guía de Configuración Android ── */}
        <div id="pwa-guide-section" className="mt-4 border-t border-border/50 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="text-base">⚙️</span> Guía de Configuración en Android (Recomendado para Cocina)
          </h4>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Para garantizar que los avisos suenen fuerte y el dispositivo no silencie la aplicación cuando la pantalla esté apagada, sigue estos sencillos pasos:
          </p>
          <div className="bg-slate-950/60 dark:bg-slate-950/90 rounded-xl p-4 border border-white/5 space-y-2.5 text-[11px] leading-relaxed text-slate-300 font-medium">
            <div className="flex gap-2.5">
              <span className="font-bold text-primary shrink-0 bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              <p>
                <strong>Mantén presionada la App:</strong> En el menú de inicio de tu tablet/móvil, mantén pulsado el icono de la app instalada <strong>De Aquí y De Allá</strong> y toca en el icono de información <strong>(i)</strong> o <em>"Detalles de la app"</em>.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="font-bold text-primary shrink-0 bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
              <p>
                <strong>Ajustes de Notificación:</strong> Entra en <strong>Notificaciones</strong>. Asegúrate de que estén <em>"Permitidas"</em> y de activar la opción <em>"Permitir sonido y vibración"</em>.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="font-bold text-primary shrink-0 bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
              <p>
                <strong>Categorías de Notificaciones (Importante):</strong> Busca la opción <strong>Categorías de notificación</strong> al final. Toca sobre la categoría principal y asegúrate de establecer la importancia en <strong>Urgente</strong> o <strong>Alta</strong>, y en <strong>Sonido</strong> selecciona un tono largo o fuerte de tu preferencia.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="font-bold text-primary shrink-0 bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">4</span>
              <p>
                <strong>Uso de Batería sin Restricciones:</strong> En los mismos ajustes de la app, ve a <strong>Batería</strong> y selecciona la opción <strong>Sin Restricciones</strong> (o *No optimizar*). Esto evita que Android cierre la conexión de avisos en segundo plano para ahorrar batería.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
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
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{registeredUsersCount}</p>
          <p className="text-xs text-muted-foreground">Usuarios registrados</p>
        </div>
        <button 
          onClick={() => {
            playNotificationSound();
          }}
          className={cn(
            "bg-card border rounded-xl p-4 text-center hover:bg-muted transition-colors group",
            isAudioBlocked && "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/20"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <Volume2 className={cn("w-6 h-6 transition-transform group-hover:scale-110", isAudioBlocked ? "text-amber-500" : "text-primary")} />
            <p className={cn("text-xs font-bold", isAudioBlocked ? "text-amber-600" : "text-foreground")}>Probar Sonido</p>
          </div>
        </button>
      </div>

      {/* ── Control de Apertura Manual ── */}
      {(() => {
        const { isOpen, nextOpening, reason } = getStoreStatus(manualStatus, weeklySchedule);
        const isCurrentlyAuto = manualStatus === null;

        return (
          <div className={cn(
            "w-full rounded-2xl border-2 overflow-hidden transition-all duration-300",
            !isOpen
              ? (reason === "panic" ? "border-red-600 bg-red-950/20" : "border-amber-600 bg-amber-950/10")
              : (manualStatus === "open" ? "border-green-600 bg-green-950/20" : "border-border bg-card")
          )}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                {!isOpen ? (
                  <DoorClosed className={cn("w-8 h-8 shrink-0", reason === "panic" ? "text-red-500" : "text-amber-500")} />
                ) : (
                  <DoorOpen className="w-8 h-8 text-green-500 shrink-0" />
                )}
                <div>
                  <p className={cn("text-lg font-bold", !isOpen ? (reason === "panic" ? "text-red-400" : "text-amber-500") : "text-foreground")}>
                    {!isOpen 
                      ? (reason === "panic" ? "🔴 Local cerrado manualmente" : "🟠 Local cerrado (Horario)")
                      : (manualStatus === "open" ? "🟢 Local abierto manualmente" : "🟢 Local abierto")
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {!isOpen
                      ? `Próxima apertura: ${nextOpening ?? "según horario"}`
                      : "Recibiendo pedidos online con normalidad"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {!isCurrentlyAuto && (
                  <button
                    onClick={() => updateManualStatus(null)}
                    className={cn(buttonVariants({ variant: "outline" }), "font-bold")}
                  >
                    🔄 Volver a Horario Auto
                  </button>
                )}
                
                {isOpen ? (
                  <button
                    onClick={() => updateManualStatus("closed")}
                    className={cn(buttonVariants({ variant: "destructive" }), "font-bold gap-2 px-6")}
                  >
                    <DoorClosed className="w-5 h-5" /> Cerrar ahora
                  </button>
                ) : (
                  <button
                    onClick={() => updateManualStatus("open")}
                    className={cn(buttonVariants({ variant: "default" }), "bg-green-600 hover:bg-green-700 text-white font-bold gap-2 px-6")}
                  >
                    <DoorOpen className="w-5 h-5" /> Abrir ahora
                  </button>
                )}
              </div>
            </div>
            {!isCurrentlyAuto && (
              <div className={cn(
                "px-5 pb-4 text-xs border-t pt-3",
                manualStatus === "closed" ? "text-red-400/80 border-red-800/30" : "text-green-400/80 border-green-800/30"
              )}>
                ⚠️ Has forzado el estado a <strong>{manualStatus === "closed" ? "CERRADO" : "ABIERTO"}</strong>. El horario automático está ignorado hasta que restablezcas.
              </div>
            )}
            {isCurrentlyAuto && !isOpen && (
              <div className="px-5 pb-4 text-xs text-amber-400/80 border-t border-amber-800/20 pt-3">
                ℹ️ El local está cerrado por horario. Pulsa "Abrir ahora" si quieres atender pedidos fuera de hora.
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Estadísticas de Venta ── */}
      <section className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Zap className="w-5 h-5 text-amber-500" /> 
            Estadísticas y Análisis de Venta
          </div>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2">
          {/* Top Dishes */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Platos más Vendidos</h4>
            <div className="space-y-2">
              {(() => {
                const counts: Record<string, { name: string, qty: number }> = {};
                orders.forEach(o => o.lines.forEach(l => {
                  if (!counts[l.dishId]) counts[l.dishId] = { name: l.nameEs || l.nameEn, qty: 0 };
                  counts[l.dishId].qty += l.quantity;
                }));
                return Object.values(counts)
                  .sort((a, b) => b.qty - a.qty)
                  .slice(0, 5)
                  .map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.qty} uds</span>
                    </div>
                  ));
              })()}
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribución por Hora</h4>
            <div className="flex items-end gap-1 h-32 pt-4">
              {(() => {
                const hours = new Array(24).fill(0);
                orders.forEach(o => {
                  const hour = new Date(o.created_at).getHours();
                  hours[hour]++;
                });
                const max = Math.max(...hours) || 1;
                return hours.map((count, h) => (
                  <div 
                    key={h} 
                    className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors relative group"
                    style={{ height: `${(count / max) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover border text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10">
                      {h}h: {count}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>
      </section>

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
                      onDelete={(o) => setOrderToDelete(o)}
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

      {/* ── Reset Orders Panel ── */}
      <section className="bg-card border-2 border-red-500/20 rounded-xl overflow-hidden shadow-sm mt-8">
        <div className="px-5 py-4 border-b border-red-500/10 bg-red-500/5 flex items-center gap-2 font-bold text-red-600">
          <Trash2 className="w-5 h-5" /> 
          Zona de Peligro: Limpiar Base de Datos
        </div>
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Eliminar pedidos de prueba</h4>
            <p className="text-sm text-muted-foreground">Esta acción borrará de forma permanente TODOS los pedidos registrados hasta ahora. Úsala solo para limpiar pruebas antes de abrir al público.</p>
          </div>
          <button
            onClick={async () => {
              if (window.confirm("⚠️ ADVERTENCIA ⚠️\n\n¿Estás completamente seguro?\nEsta acción es irreversible y borrará TODOS los pedidos del sistema y de la pantalla.")) {
                try {
                  const { error } = await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  if (error) {
                    alert("Error al borrar pedidos (quizá faltan permisos en Supabase): " + error.message);
                  } else {
                    alert("✅ ¡Todos los pedidos han sido eliminados con éxito!");
                    // Force a reload to clear any local state
                    window.location.reload();
                  }
                } catch (e) {
                  alert("Error inesperado al borrar.");
                }
              }
            }}
            className={cn(buttonVariants({ variant: "destructive" }), "shrink-0 font-bold shadow-md")}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Borrar Todos los Pedidos
          </button>
        </div>
      </section>

      {/* ── Modal de Confirmación de Eliminación (Trash Bin Dialog) ── */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border-2 border-destructive/20 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-scale-in text-card-foreground">
            <div className="flex items-center gap-4 text-destructive">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">¿Eliminar este pedido?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Esta acción no se puede deshacer de ninguna forma.</p>
              </div>
            </div>

            <div className="bg-muted/40 border rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Pedido ID:</span>
                <span className="font-mono font-bold">#{orderToDelete.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Cliente:</span>
                <span className="font-bold">{orderToDelete.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">{formatCentsToCurrency(orderToDelete.total_cents, "es")}</span>
              </div>
              <div className="border-t border-border/40 pt-2 mt-2">
                <span className="font-medium block mb-1">Detalle del pedido:</span>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {orderToDelete.lines.map((l, i) => (
                    <li key={i}>
                      {l.quantity}x {l.nameEs ?? l.nameEn ?? l.dishId}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex-1 text-xs font-bold py-2.5"
                )}
              >
                Cancelar
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteOrder(orderToDelete.id)}
                className={cn(
                  buttonVariants({ variant: "destructive" }),
                  "flex-1 text-xs font-bold py-2.5 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2",
                  isDeleting && "opacity-70 animate-pulse"
                )}
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
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
