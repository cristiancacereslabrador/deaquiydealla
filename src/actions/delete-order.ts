"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { LoggerService } from "@/lib/logger";

export interface DeleteOrderResult {
  ok: boolean;
  message: string;
}

/**
 * @description Elimina físicamente un pedido de la base de datos (pedidos de prueba/error).
 * Solo permitido para usuarios administradores.
 * 
 * @param {string} orderId - ID del pedido a eliminar.
 * @returns {Promise<DeleteOrderResult>} Resultado de la operación.
 */
export async function deleteOrderAction(orderId: string): Promise<DeleteOrderResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Verificar Autenticación y Rol del usuario autenticado
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { ok: false, message: "unauthorized" };
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profErr || !profile || profile.role !== "admin") {
      return { ok: false, message: "unauthorized" };
    }

    // 2. Usar cliente Service Role para eliminar el pedido
    // Esto garantiza que el borrado se efectúe incluso si el rol 'authenticated' no tiene privilegios de DELETE explícitos en BD
    const adminSupabase = createServiceSupabaseClient();
    const { error: deleteErr } = await adminSupabase
      .from("pedidos")
      .delete()
      .eq("id", orderId);

    if (deleteErr) {
      LoggerService.error("deleteOrderAction:delete", deleteErr, { orderId });
      return { ok: false, message: "database_error" };
    }

    return { ok: true, message: "success" };
  } catch (err: any) {
    LoggerService.error("deleteOrderAction:main", err, { orderId });
    return { ok: false, message: err.message || "unknown_error" };
  }
}
