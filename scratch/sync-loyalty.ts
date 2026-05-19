import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function syncLoyalty() {
  console.log("Iniciando sincronización retroactiva de fidelización...");

  // 1. Obtener todos los pedidos completados
  const { data: orders, error: ordersError } = await supabase
    .from("pedidos")
    .select("id, customer_email, customer_phone, status")
    .eq("status", "completed");

  if (ordersError) {
    console.error("Error al obtener pedidos:", ordersError.message);
    return;
  }

  console.log(`Se encontraron ${orders?.length || 0} pedidos completados.`);

  if (!orders || orders.length === 0) {
    return;
  }

  // 2. Obtener la lista de usuarios de Auth para mapear emails a IDs de perfil
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error al obtener usuarios de Auth:", usersError.message);
    return;
  }

  console.log(`Se encontraron ${users.length} usuarios registrados.`);

  // Mapa para contar pedidos por ID de usuario
  const userStats = new Map<string, { email: string; phone: string; count: number }>();

  for (const order of orders) {
    if (!order.customer_email) continue;

    // Buscar el usuario por email
    const user = users.find(u => u.email?.toLowerCase() === order.customer_email?.toLowerCase());
    if (!user) {
      console.log(`No se encontró usuario en Auth para el email del pedido: ${order.customer_email}`);
      continue;
    }

    const current = userStats.get(user.id) || {
      email: user.email!,
      phone: order.customer_phone,
      count: 0
    };

    current.count += 1;
    // Si el pedido tiene un teléfono más reciente, lo guardamos
    if (order.customer_phone) {
      current.phone = order.customer_phone;
    }
    userStats.set(user.id, current);
  }

  // 3. Actualizar perfiles
  console.log("Actualizando perfiles en la base de datos...");
  for (const [userId, stats] of userStats.entries()) {
    console.log(`Usuario: ${stats.email} (ID: ${userId}) -> Teléfono: ${stats.phone}, Pedidos Completados: ${stats.count}`);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone: stats.phone,
        loyalty_count: stats.count,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      console.error(`Error al actualizar el perfil de ${stats.email}:`, updateError.message);
    } else {
      console.log(`✅ Perfil de ${stats.email} actualizado con éxito.`);
    }
  }

  console.log("¡Sincronización retroactiva finalizada!");
}

syncLoyalty();
