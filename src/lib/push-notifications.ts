import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { LoggerService } from "./logger";
import { formatCentsToCurrency } from "./money";

// Inicializar web-push con las llaves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:soporte@deaquiydealla.com", // Subject
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn("VAPID keys are missing. Push notifications will not be fully functional.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usamos el cliente del Service Role para poder leer suscripciones sin restricciones RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface PushOrderData {
  id: string;
  customer_name: string;
  total_cents: number;
  lines: Array<{
    quantity: number;
    nameEs?: string;
    nameEn?: string;
    dishId: string;
  }>;
}

/**
 * @description Envía una notificación Web Push a todos los administradores registrados en la PWA.
 * @param {PushOrderData} order - Datos resumidos del pedido.
 * @returns {Promise<void>}
 */
export async function sendNewOrderNotification(order: PushOrderData): Promise<void> {
  try {
    // 1. Obtener la lista de usuarios con rol 'admin'
    const { data: admins, error: adminErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminErr || !admins || admins.length === 0) {
      LoggerService.error("sendNewOrderNotification:fetchAdmins", adminErr || new Error("No admins found"));
      return;
    }

    const adminIds = admins.map(a => a.id);

    // 2. Obtener todas las suscripciones Push activas asociadas a esos administradores
    const { data: subscriptions, error: subErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, subscription")
      .in("user_id", adminIds);

    if (subErr || !subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for admins. Skipping notification.");
      return;
    }

    const totalStr = formatCentsToCurrency(order.total_cents, "es");
    const itemsSummary = order.lines
      .map(l => `${l.quantity}x ${l.nameEs || l.nameEn || l.dishId}`)
      .join(", ");

    // 3. Crear el payload de la notificación (JSON con la información del pedido)
    const payload = JSON.stringify({
      title: "🥡 ¡NUEVO PEDIDO RECIBIDO! 🥡",
      body: `Cliente: ${order.customer_name}\nTotal: ${totalStr}\nPlatos: ${itemsSummary}`,
      orderId: order.id,
      tag: "nuevo-pedido", // Agrupa notificaciones
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      // Patrón de vibración prolongado
      vibrate: [300, 100, 300, 100, 300, 100, 400],
      silent: false,
      sound: "/notification.mp3",
      data: {
        url: `/admin`,
      },
    });

    console.log(`Sending push notification to ${subscriptions.length} admin device(s)...`);

    // 4. Enviar de forma asíncrona y en paralelo a todas las suscripciones
    const sendPromises = subscriptions.map(async (subRow) => {
      try {
        const sub = subRow.subscription as unknown as webpush.PushSubscription;
        await webpush.sendNotification(sub, payload, {
          headers: {
            "Urgency": "high"
          },
          TTL: 3600 // 1 hora
        });
      } catch (err: any) {
        // Si el endpoint de Google/Apple responde 410 (Gone) o 404 (Not Found), significa que la suscripción ha expirado o el usuario desinstaló la app.
        // En ese caso, la eliminamos de la base de datos automáticamente para mantener el servidor limpio.
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Push subscription ${subRow.id} expired. Deleting...`);
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("id", subRow.id);
        } else {
          LoggerService.error("sendNewOrderNotification:sendSingle", err, { subId: subRow.id });
        }
      }
    });

    await Promise.all(sendPromises);
    console.log("All push notifications sent successfully.");
  } catch (err) {
    LoggerService.error("sendNewOrderNotification:main", err, { orderId: order.id });
  }
}
