"use client";

import { submitPickupOrderAction } from "@/actions/submit-pickup-order";
import { buttonVariants } from "@/components/ui/button";
import { formatCentsToCurrency } from "@/lib/money";
import type { CheckoutFormValues } from "@/lib/schemas/checkout-schema";
import { checkoutCustomerSchema } from "@/lib/schemas/checkout-schema";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

/**
 * Checkout completo: redirige si el carrito está vacío, muestra resumen y formulario validado.
 *
 * @returns Vista de checkout o skeleton / redirección.
 */
export function CheckoutPageClient({
  initialProfile,
}: {
  initialProfile?: { fullName: string; phone: string; email: string };
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [mounted, setMounted] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const totalCents = useMemo(
    () => items.reduce((a, i) => a + i.unitPriceCents * i.quantity, 0),
    [items]
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutCustomerSchema),
    defaultValues: {
      fullName: initialProfile?.fullName || "",
      phone: initialProfile?.phone || "",
      email: initialProfile?.email || "",
      notes: "",
      company: "",
    },
  });

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  if (!mounted) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  /**
   * Envía el pedido al server action y navega a la página de éxito.
   */
  async function onSubmit(values: CheckoutFormValues) {
    setBanner(null);
    const result = await submitPickupOrderAction({
      ...values,
      locale: locale === "en" ? "en" : "es",
      lines: items,
    });

    if (!result.ok) {
      const msg =
        result.code === "VALIDATION"
          ? translateZodMessage(
              t as unknown as (key: string) => string,
              result.message
            )
          : result.code === "UNKNOWN_DISH"
            ? t("server.UNKNOWN_DISH")
            : result.code === "CONFIG"
              ? t("server.CONFIG")
              : result.code === "STORE_PAUSED"
                ? t("server.STORE_PAUSED")
                : result.code === "UNAUTHORIZED"
                  ? t("server.UNAUTHORIZED")
                  : t("server.DATABASE", { detail: result.message });
      setBanner(msg);
      return;
    }

    try {
      localStorage.setItem("last_order_cart", JSON.stringify(items));
      localStorage.setItem("last_order_id", result.orderId);
      localStorage.setItem("last_order_at", new Date().toISOString());
    } catch (e) {
      // Ignore localStorage errors
    }
    clearCart();
    window.open(result.whatsappUrl, "_blank");
    router.push(`/order/${result.orderId}`);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-14">
      <div>
        <header className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("intro")}</p>
        </header>

        {banner ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {banner}
          </div>
        ) : null}

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
            {...form.register("company")}
          />

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              {t("fields.fullName")}
            </label>
            <input
              id="fullName"
              autoComplete="name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName ? (
              <p className="text-sm text-destructive" role="alert">
                {translateZodMessage(
                  t as unknown as (key: string) => string,
                  form.formState.errors.fullName.message
                )}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              {t("fields.phone")}
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-sm text-destructive" role="alert">
                {translateZodMessage(
                  t as unknown as (key: string) => string,
                  form.formState.errors.phone.message
                )}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("fields.email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {translateZodMessage(
                  t as unknown as (key: string) => string,
                  form.formState.errors.email.message
                )}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              {t("fields.notes")}
            </label>
            <textarea
              id="notes"
              rows={4}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? (
              <p className="text-sm text-destructive" role="alert">
                {translateZodMessage(
                  t as unknown as (key: string) => string,
                  form.formState.errors.notes.message
                )}
              </p>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">{t("paymentNote")}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 px-8 font-medium sm:h-12"
              )}
            >
              {form.formState.isSubmitting ? t("submitting") : t("submit")}
            </button>
            <Link
              href="/cart"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 justify-center sm:h-12"
              )}
            >
              {t("backToCart")}
            </Link>
          </div>
        </form>
      </div>

      <aside className="rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">{t("summaryTitle")}</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((line) => {
            const name = locale === "en" ? line.nameEn : line.nameEs;
            return (
              <li
                key={line.dishId}
                className="flex justify-between gap-2 border-b border-border/40 pb-2 last:border-0"
              >
                <span className="text-muted-foreground">
                  {name}{" "}
                  <span className="tabular-nums">×{line.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatCentsToCurrency(
                    line.unitPriceCents * line.quantity,
                    locale
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">{t("totalLabel")}</p>
          <p className="font-heading text-2xl font-semibold text-primary">
            {formatCentsToCurrency(totalCents, locale)}
          </p>
        </div>
      </aside>
    </div>
  );
}

/**
 * Mapea códigos de error de Zod (`message` tipo `err_*`) a claves `Checkout.errors.*`.
 *
 * @param t - Traductor del namespace `Checkout`.
 * @param message - Código devuelto por Zod o texto libre.
 */
function translateZodMessage(
  t: (key: string) => string,
  message?: string
) {
  if (!message) return t("errors.fallback");
  if (message.startsWith("err_")) {
    return t(`errors.${message}`);
  }
  return message;
}
