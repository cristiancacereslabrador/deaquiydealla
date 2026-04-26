"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, ArrowRight } from "lucide-react";
import type { CartLineInput } from "@/lib/schemas/cart-schemas";

export function RepeatOrderBanner() {
  const [lastOrder, setLastOrder] = useState<CartLineInput[] | null>(null);
  const addItems = useCartStore(s => s.addItem);
  const clearCart = useCartStore(s => s.clearCart);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("last_order_cart");
      if (saved && saved !== "undefined" && saved !== "null" && saved.trim() !== "") {
        setLastOrder(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error parsing last_order_cart", e);
    }
  }, []);

  if (!lastOrder || lastOrder.length === 0) return null;

  const handleRepeatOrder = () => {
    clearCart();
    lastOrder.forEach(item => {
      // Adding it directly
      addItems(item);
    });
    router.push("/cart");
  };

  return (
    <section className="bg-primary/10 border-y py-6">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/50 backdrop-blur rounded-2xl p-4 sm:p-6 shadow-sm border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full hidden sm:block">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-heading">¿Pedimos lo de siempre?</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                Tu último pedido: {lastOrder.map(i => i.nameEs).join(", ")}.
              </p>
            </div>
          </div>
          <button 
            onClick={handleRepeatOrder}
            className={cn(buttonVariants(), "w-full sm:w-auto shrink-0 shadow-lg")}
          >
            Añadir al carrito y pagar <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
}
