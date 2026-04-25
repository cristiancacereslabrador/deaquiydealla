import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { CheckCircle2, MessageCircle, ShoppingBag, Home } from "lucide-react";

type ExitoPageProps = {
  searchParams: Promise<{ order?: string; wa?: string }>;
};

/**
 * @description Página de confirmación tras un pedido correcto.
 * Muestra el ID del pedido, ofrece un botón de reenvío de WhatsApp
 * por si el navegador bloqueó el popup original.
 *
 * @param props - `searchParams` con `order` (UUID) y `wa` (URL codificada de WhatsApp).
 */
export default async function CheckoutExitoPage({ searchParams }: ExitoPageProps) {
  const { order, wa } = await searchParams;
  const t = await getTranslations("CheckoutSuccess");
  const uuid = z.string().uuid().safeParse(order);

  if (!uuid.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">{t("invalidTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("invalidBody")}</p>
        <Link
          href="/menu"
          className={cn(buttonVariants({ className: "mt-8" }), "font-medium")}
        >
          {t("backMenu")}
        </Link>
      </div>
    );
  }

  const whatsappUrl = wa ? decodeURIComponent(wa) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      {/* Icono de éxito */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Textos principales */}
      <div className="mt-6 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          {t("kicker")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("body")}</p>
      </div>

      {/* ID del pedido */}
      <div className="mt-6 rounded-xl border border-border/80 bg-muted/30 px-4 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Número de pedido
        </p>
        <p className="font-mono text-sm break-all text-foreground font-semibold">
          {uuid.data}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Muestra este número al recoger tu pedido en caja.
        </p>
      </div>

      {/* Botones de acción */}
      <div className="mt-8 flex flex-col gap-3">
        {/* Botón de WhatsApp (si el popup fue bloqueado) */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            Reenviar pedido por WhatsApp
          </a>
        )}

        <Link
          href="/menu"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center gap-2")}
        >
          <ShoppingBag className="h-4 w-4" />
          {t("backMenu")}
        </Link>

        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full justify-center gap-2")}
        >
          <Home className="h-4 w-4" />
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
