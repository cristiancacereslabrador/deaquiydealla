"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  submitOrderPayloadSchema,
  type SubmitOrderPayload,
} from "@/lib/schemas/checkout-schema";
import { recomputeOrderFromCatalog } from "@/server/orders/recompute-order-total";
import { LoggerService } from "@/lib/logger";

/**
 * @description Resultado de la operación de envío de pedido.
 */
export type SubmitOrderResult =
  | { ok: true; orderId: string; whatsappUrl: string }
  | {
      ok: false;
      code: "VALIDATION" | "UNKNOWN_DISH" | "DATABASE" | "CONFIG" | "STORE_PAUSED" | "UNAUTHORIZED";
      message: string;
    };

/**
 * @description Inserta un pedido de recogida en Supabase tras validar y recalcular totales en servidor.
 * 
 * @param {unknown} raw - Payload crudo desde el formulario + líneas del carrito.
 * @returns {Promise<SubmitOrderResult>} Identificador del pedido o código de error.
 */
export async function submitPickupOrderAction(
  raw: unknown
): Promise<SubmitOrderResult> {
  const parsed = submitOrderPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: "VALIDATION",
      message: first?.message ?? "validation",
    };
  }

  const payload: SubmitOrderPayload = parsed.data;
  const computed = await recomputeOrderFromCatalog(payload.lines);
  if (!computed.ok) {
    return {
      ok: false,
      code: "UNKNOWN_DISH",
      message:
        computed.code === "UNKNOWN_DISH"
          ? `unknown_dish:${computed.dishId ?? ""}`
          : "empty_cart",
    };
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (err) {
    LoggerService.error("submitPickupOrderAction:createServerSupabaseClient", err);
    return {
      ok: false,
      code: "CONFIG",
      message: "supabase_env",
    };
  }

  // ─── 0. Verificar Autenticación ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "session_required",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "email_not_confirmed",
    };
  }

  try {
    // ─── 1. Verificar estado manual y horario ───────────────────────────────────────────
    const { data: settingsData } = await supabase
      .from("store_settings")
      .select("id, value")
      .in("id", ["store_status", "weekly_schedule"]);

    const statusData = settingsData?.find((s: any) => s.id === "store_status");
    const scheduleData = settingsData?.find((s: any) => s.id === "weekly_schedule");

    const { getStoreStatus, DEFAULT_DAILY_SCHEDULE } = await import("@/lib/store-status");
    const { isOpen, reason, nextOpening } = getStoreStatus(
      statusData?.value?.manual_override ?? null,
      scheduleData?.value?.schedule ?? DEFAULT_DAILY_SCHEDULE
    );

    if (!isOpen) {
      let errorMsg = "paused";
      if (reason === "schedule") errorMsg = `Abrimos a las ${nextOpening}`;
      if (reason === "closed_day") errorMsg = "Hoy estamos cerrados por descanso.";

      return {
        ok: false,
        code: "STORE_PAUSED",
        message: errorMsg,
      };
    }

    // ─── 2. Verificar stock de platos ──────────────────────────────────────────
    const dishIds = computed.normalizedLines.map((l: { dishId: string }) => l.dishId);
    if (dishIds.length > 0) {
      const { data: stockData } = await supabase
        .from("dish_status")
        .select("*")
        .in("dish_id", dishIds);
        
      if (stockData) {
        const outOfStockIds = stockData
          .filter((d: { is_available: boolean }) => !d.is_available)
          .map((d: { dish_id: string }) => d.dish_id);
          
        if (outOfStockIds.length > 0) {
          return {
            ok: false,
            code: "UNKNOWN_DISH",
            message: `out_of_stock:${outOfStockIds.join(",")}`,
          };
        }
      }
    }

    const row = {
      locale: payload.locale,
      customer_name: payload.fullName,
      customer_phone: payload.phone,
      customer_email: payload.email ?? null,
      notes: payload.notes.length > 0 ? payload.notes : null,
      total_cents: computed.totalCents,
      payment_method: "cash",
      fulfillment: "pickup",
      status: "pending",
      lines: computed.normalizedLines,
    };

    const { data, error } = await supabase
      .from("pedidos")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      LoggerService.error("submitPickupOrderAction:insertOrder", error, { row });
      return {
        ok: false,
        code: "DATABASE",
        message: error.message,
      };
    }

    if (!data?.id) {
      return {
        ok: false,
        code: "DATABASE",
        message: "no_order_id",
      };
    }

    // ─── 2.5 Enviar notificación Push en segundo plano a los administradores ───
    try {
      const { sendNewOrderNotification } = await import("@/lib/push-notifications");
      await sendNewOrderNotification({
        id: data.id,
        customer_name: row.customer_name,
        total_cents: row.total_cents,
        lines: row.lines.map((l: any) => ({
          quantity: l.quantity,
          nameEs: l.nameEs,
          nameEn: l.nameEn,
          dishId: l.dishId,
        })),
      });
    } catch (pushErr) {
      LoggerService.error("submitPickupOrderAction:pushNotification", pushErr, { orderId: data.id });
    }

    // Sincronizar el número de teléfono con la tabla profiles para que el trigger de fidelización
    // funcione de forma automática y transparente (incluso si se registró por primera vez con Google)
    try {
      await supabase
        .from("profiles")
        .update({ 
          phone: payload.phone, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", user.id);
    } catch (profileErr) {
      LoggerService.error("submitPickupOrderAction:syncProfilePhone", profileErr, { userId: user.id });
    }

    const totalStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format(computed.totalCents / 100);
    const ivaStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format((computed.totalCents * 0.10) / 100);
    const netStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format((computed.totalCents * 0.90) / 100);

    // ─── 3. Detección de Alérgenos ─────────────────────────────────────────────
    // Fetch custom dishes and overrides again for allergen info
    const [customRes, overridesRes] = await Promise.all([
      supabase.from("custom_dishes").select("id, allergens"),
      supabase.from("dish_price_overrides").select("dish_id, allergens")
    ]);
    const { DISHES } = await import("@/data/dishes");
    
    const detectedAllergensSet = new Set<string>();
    computed.normalizedLines.forEach((line: any) => {
      // Check custom
      const customDish = (customRes.data || []).find(d => d.id === line.dishId);
      if (customDish) {
        customDish.allergens?.forEach((a: string) => detectedAllergensSet.add(a));
      } else {
        // Check static with override
        const override = (overridesRes.data || []).find(o => o.dish_id === line.dishId);
        const staticDish = DISHES.find(d => d.id === line.dishId);
        
        const activeAllergens = override?.allergens || staticDish?.allergens || [];
        activeAllergens.forEach((a: string) => detectedAllergensSet.add(a));
      }
    });

    const allergensStr = detectedAllergensSet.size > 0 
      ? Array.from(detectedAllergensSet).join(", ") 
      : "Ninguno detectado";

    const msg = [
      `*NUEVO PEDIDO WEB*`,
      `Pedido: ${data.id.slice(0, 8)}`,
      `Cliente: ${row.customer_name}`,
      `Teléfono: ${row.customer_phone}`,
      row.notes ? `Notas: ${row.notes}` : "",
      `*Detalle:*`,
      row.lines.map((l: any) => `- ${l.quantity}x ${l.nameEs ?? l.nameEn ?? l.dishId}`).join("\n"),
      `Alérgenos: ${allergensStr}`,
      `*TOTAL:* ${totalStr} (Base: ${netStr} | IVA: ${ivaStr})`,
      `Recogida en local. Pago en Efectivo.`
    ].filter(Boolean).join("\n");

    const { BRAND_INFO } = await import("@/lib/brand");
    const phone = BRAND_INFO.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;

    return { ok: true, orderId: data.id as string, whatsappUrl };
  } catch (err) {
    LoggerService.error("submitPickupOrderAction:main", err);
    return {
      ok: false,
      code: "DATABASE",
      message: "unexpected_error",
    };
  }
}

