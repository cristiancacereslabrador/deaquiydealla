"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Gift, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @description Tarjeta de fidelización para el usuario.
 * Muestra el progreso hacia el 10º pedido gratis.
 */
export function LoyaltyCard() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadLoyalty() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("loyalty_count")
        .eq("id", user.id)
        .single();

      if (data) {
        setCount(data.loyalty_count);
      }
      setLoading(false);
    }

    loadLoyalty();
  }, [supabase]);

  if (loading) return null;
  if (count === null) return null;

  const progress = count % 10;
  const isReady = progress === 0 && count > 0;

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative group">
      {/* Decorative background icons */}
      <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading">Tu Fidelidad tiene premio</h3>
            <p className="text-xs text-white/80 font-medium">¡Cada 10 pedidos, el siguiente es GRATIS!*</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progreso del próximo regalo</span>
            <span>{progress}/10</span>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-between gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-3 flex-1 rounded-full border border-white/30 transition-all duration-500",
                  i < progress ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {isReady ? (
          <div className="bg-green-500/30 border border-green-400/50 rounded-xl p-3 flex items-center gap-3 animate-pulse">
            <Gift className="w-6 h-6" />
            <p className="text-sm font-bold">¡ENHORABUENA! Tu próximo pedido es gratis. Avisa al local al recogerlo.</p>
          </div>
        ) : (
          <p className="text-[10px] italic text-white/60">
            En el pedido #11 → 1 bebida + papas para compartir GRATIS en pedidos desde 12,99 €
          </p>
        )}
      </div>
    </div>
  );
}
