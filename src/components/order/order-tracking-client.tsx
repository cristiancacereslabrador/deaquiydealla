"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCentsToCurrency } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChefHat, Clock, PackageCheck, ShoppingBag, ExternalLink, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface OrderTrackingClientProps {
  orderId: string;
}

export function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const locale = useLocale();
  const supabase = createBrowserSupabaseClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.from("pedidos").select("*").eq("id", orderId).single();
        if (data) setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to changes
    const channel = supabase.channel(`order_${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Buscando tu pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h1 className="text-2xl font-bold font-heading">Pedido no encontrado</h1>
        <p className="text-muted-foreground">No hemos podido localizar el pedido solicitado.</p>
        <Link href="/menu" className={cn(buttonVariants(), "mt-4")}>Volver al menú</Link>
      </div>
    );
  }

  const { status, total_cents, customer_name, id } = order;

  // Determine progress step
  let step = 0;
  if (status === "pending") step = 1;
  if (status === "accepted") step = 2;
  if (status === "ready" || status === "completed") step = 3;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold text-foreground">Estado de tu pedido</h1>
        <p className="text-muted-foreground">Pedido <span className="font-mono text-xs uppercase bg-muted px-2 py-1 rounded">#{id.split("-")[0]}</span></p>
      </div>

      <div className="bg-card border shadow-xl rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
        {/* Confetti or success background if ready */}
        {step === 3 && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
        )}

        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 md:top-8 left-8 right-8 h-1 bg-muted rounded-full" />
          
          {/* Progress Bar Fill */}
          <div 
            className="absolute top-6 md:top-8 left-8 h-1 bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {/* Step 1: Recibido */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500", step >= 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground")}>
                <Clock className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <p className={cn("text-xs md:text-sm font-bold text-center", step >= 1 ? "text-primary" : "text-muted-foreground")}>Recibido</p>
            </div>

            {/* Step 2: En Cocina */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500", step >= 2 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-muted text-muted-foreground")}>
                <ChefHat className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <p className={cn("text-xs md:text-sm font-bold text-center", step >= 2 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground")}>En Cocina</p>
            </div>

            {/* Step 3: Listo */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500", step >= 3 ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-muted text-muted-foreground")}>
                <PackageCheck className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <p className={cn("text-xs md:text-sm font-bold text-center", step >= 3 ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>¡Listo!</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-12 text-center space-y-3 bg-background/50 p-6 rounded-2xl border">
          {step === 1 && (
            <>
              <h3 className="text-xl font-bold">Hemos recibido tu pedido, {customer_name.split(' ')[0]}</h3>
              <p className="text-muted-foreground">Estamos esperando que el Chef Hugo lo revise para empezar a cocinar.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">¡Tu comida está en los fogones!</h3>
              <p className="text-muted-foreground">Los woks están a tope. Estará listo en unos 15-20 minutos.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400">¡Tu pedido está listo para recoger! 🎉</h3>
              <p className="text-muted-foreground">Puedes pasar a recogerlo por nuestro local. ¡Que lo disfrutes!</p>
              <div className="pt-4 flex flex-col items-center gap-3">
                <a 
                  href="https://maps.app.goo.gl/EJBP3AiC65QQcpUV7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "default" }), "rounded-full gap-2")}
                >
                  <MapPin className="w-4 h-4" /> Ver dirección en Google Maps
                </a>
                <Link href="/contact" className="text-xs text-muted-foreground underline">
                  Ver más información del local
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/menu" className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}>
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
