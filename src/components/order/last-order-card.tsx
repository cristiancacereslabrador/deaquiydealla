"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Clock, ShoppingBag, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";

/**
 * Componente que muestra el último pedido guardado en localStorage.
 * Permite repetir el pedido o ir al seguimiento en tiempo real.
 */
export function LastOrderCard() {
  const t = useTranslations("Common");
  const [lastOrder, setLastOrder] = useState<{ id: string; items: any[]; date: string } | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const id = localStorage.getItem("last_order_id");
    const cartStr = localStorage.getItem("last_order_cart");
    const date = localStorage.getItem("last_order_at");

    if (id && cartStr) {
      try {
        setLastOrder({
          id,
          items: JSON.parse(cartStr),
          date: date || new Date().toISOString(),
        });
      } catch (e) {
        // Data corrupta
      }
    }
  }, []);

  if (!lastOrder) return null;

  const handleRepeat = () => {
    lastOrder.items.forEach(item => {
      addItem(item);
    });
  };

  const timeAgo = new Date(lastOrder.date).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2 rounded-full">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Tu último pedido</h3>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contenido:</p>
        <p className="text-sm font-semibold truncate">
          {lastOrder.items.map(i => i.nameEs || i.nameEn).join(", ")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link 
          href={`/order/${lastOrder.id}`}
          className={cn(buttonVariants({ size: "sm", variant: "default" }), "flex-1 gap-2")}
        >
          <ShoppingBag className="w-4 h-4" />
          Seguir Pedido
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={handleRepeat}
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1 gap-2")}
        >
          <RotateCcw className="w-4 h-4" />
          Repetir Todo
        </button>
      </div>
    </div>
  );
}
