import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LoggerService } from "@/lib/logger";

/**
 * @description Maneja las solicitudes POST para guardar o actualizar suscripciones push en Supabase.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Crear el cliente de Supabase en el servidor para validar la sesión actual
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // 1. Validar autenticación
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validar que el usuario sea administrador
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profErr || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 3. Leer la suscripción enviada en el body
    const body = await request.json();
    const { subscription, action } = body;

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription object" }, { status: 400 });
    }

    if (action === "unsubscribe") {
      // Eliminar suscripción anterior
      const { error: delErr } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("subscription->>endpoint", subscription.endpoint);

      if (delErr) {
        LoggerService.error("pushSubscribeRoute:delete", delErr, { userId: user.id });
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      console.log(`Push subscription removed for admin ${user.id}`);
      return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
    }

    // Guardar la suscripción en Supabase.
    // Hacemos una consulta rápida para ver si ya está guardado este endpoint para este usuario.
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("subscription->>endpoint", subscription.endpoint)
      .limit(1);

    if (existing && existing.length > 0) {
      // Ya existe, no hace falta volver a insertarlo
      return NextResponse.json({ success: true, message: "Subscription already registered" });
    }

    // Si no existe, lo insertamos
    const { error: insErr } = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        subscription: subscription,
      });

    if (insErr) {
      LoggerService.error("pushSubscribeRoute:insert", insErr, { userId: user.id });
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    console.log(`New push subscription registered for admin ${user.id}`);
    return NextResponse.json({ success: true, message: "Subscribed successfully" });

  } catch (err: any) {
    LoggerService.error("pushSubscribeRoute:main", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
