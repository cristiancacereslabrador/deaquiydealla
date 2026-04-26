"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getStoreStatus } from "@/lib/store-status";
import { AlertTriangle, Clock, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @description Banner global que informa sobre el estado de apertura del local.
 * Se muestra en TODAS las páginas si el restaurante está cerrado.
 * Detecta automáticamente la hora de Granada (Europe/Madrid) y el botón de pánico.
 */
export function StoreStatusBanner() {
  const [panicActive, setPanicActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Refrescar cada minuto para que el banner cambie automáticamente al abrir/cerrar
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const supabase = createBrowserSupabaseClient();

    // Carga inicial del estado de pánico
    supabase
      .from("store_settings")
      .select("value")
      .eq("id", "panic_button")
      .single()
      .then(({ data }) => {
        if (data?.value?.active) setPanicActive(true);
      });

    // Suscripción en tiempo real al botón de pánico
    const channel = supabase
      .channel("global_store_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "store_settings" },
        (payload) => {
          if (payload.new.id === "panic_button") {
            setPanicActive(payload.new.value.active);
          }
        }
      )
      .subscribe();

    // Refrescar cada minuto para detectar apertura/cierre por horario
    const interval = setInterval(() => setTick(t => t + 1), 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return null;

  const { isOpen, reason, nextOpening } = getStoreStatus(panicActive);

  if (isOpen) return null;

  // Determinar contenido según razón de cierre
  let bgColor = "bg-amber-500";
  let textColor = "text-black";
  let icon = <Clock className="w-4 h-4 shrink-0" />;
  let message = "";

  if (reason === "panic") {
    bgColor = "bg-red-600";
    textColor = "text-white";
    icon = <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />;
    message = "🚫 LOCAL CERRADO TEMPORALMENTE — Pronto volveremos. ¡Gracias por vuestra paciencia!";
  } else if (reason === "closed_day") {
    bgColor = "bg-zinc-800";
    textColor = "text-white";
    icon = <Coffee className="w-4 h-4 shrink-0" />;
    message = `☕ Hoy Jueves descansamos. Volvemos el viernes: 12:30–16:00 y 19:30–23:30. ¡Hasta pronto!`;
  } else if (reason === "schedule") {
    bgColor = "bg-amber-500";
    textColor = "text-black";
    icon = <Clock className="w-4 h-4 shrink-0" />;
    message = `🕐 Ahora cerrado. Abrimos ${nextOpening}. Horario: L–X, V–D · 12:30–16:00 / 19:30–23:30 · Jueves cerrado`;
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden",
        bgColor,
        textColor
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Ticker-style: scrolls horizontally on mobile, centered on desktop */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-none sm:justify-center sm:overflow-visible sm:whitespace-normal sm:flex-wrap">
        {icon}
        <span className="text-xs font-bold tracking-wide">{message}</span>
      </div>
    </div>
  );
}
