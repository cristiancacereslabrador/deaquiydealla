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
      code: "VALIDATION" | "UNKNOWN_DISH" | "DATABASE" | "CONFIG" | "STORE_PAUSED";
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

  const computed = recomputeOrderFromCatalog(payload.lines);
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

  try {
    // Verificar botón de pánico
    const { data: panicData } = await supabase
      .from("store_settings")
      .select("value")
      .eq("id", "panic_button")
      .single();

    if (panicData && panicData.value.active) {
      return {
        ok: false,
        code: "STORE_PAUSED",
        message: "paused",
      };
    }

    // Verificar stock de platos
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

    const totalStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format(computed.totalCents / 100);
    const ivaStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format((computed.totalCents * 0.10) / 100);
    const netStr = new Intl.NumberFormat("es", { style: "currency", currency: "EUR" }).format((computed.totalCents * 0.90) / 100);

    const { DISHES } = await import("@/data/dishes");
    const detectedAllergensSet = new Set<string>();
    computed.normalizedLines.forEach((line: any) => {
      const dish = DISHES.find(d => d.id === line.dishId);
      dish?.allergens.forEach(a => detectedAllergensSet.add(a));
    });
    const allergensStr = detectedAllergensSet.size > 0 
      ? Array.from(detectedAllergensSet).join(", ") 
      : "Ninguno detectado";

    const msg = [
      `*NUEVO PEDIDO WEB* 🥡`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🆔 *Pedido:* ${data.id.slice(0, 8)}`,
      `👤 *Cliente:* ${row.customer_name}`,
      `📞 *Teléfono:* ${row.customer_phone}`,
      row.notes ? `📝 *Notas:* ${row.notes}` : "",
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Detalle:*`,
      row.lines.map((l: any) => `- ${l.quantity}x ${l.nameEs ?? l.nameEn ?? l.dishId}`).join("\n"),
      `━━━━━━━━━━━━━━━━━━━━`,
      `⚠️ *Alérgenos:* ${allergensStr}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Desglose:*`,
      `- Base: ${netStr}`,
      `- IVA (10%): ${ivaStr}`,
      `- *TOTAL:* ${totalStr}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 Recogida en local. Pago en Efectivo/TPV.`,
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/51980675172?text=${encodeURIComponent(msg)}`;

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

