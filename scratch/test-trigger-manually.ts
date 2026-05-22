import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTrigger() {
  const profileId = "fd501920-926e-47db-9ebd-1892737cb96b";
  
  // Get initial loyalty count
  const { data: profileBefore } = await supabase
    .from("profiles")
    .select("loyalty_count")
    .eq("id", profileId)
    .single();
  console.log("Loyalty count ANTES de completar pedido:", profileBefore?.loyalty_count);

  // We take the oldest pending order for Cristian
  const { data: oldestOrder } = await supabase
    .from("pedidos")
    .select("id, status")
    .eq("customer_email", "cristiancacereslabrador@gmail.com")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!oldestOrder) {
    console.log("No se encontraron pedidos pendientes para Cristian.");
    return;
  }

  console.log(`Actualizando pedido ${oldestOrder.id} de 'pending' a 'completed'...`);
  
  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ status: "completed" })
    .eq("id", oldestOrder.id);

  if (updateError) {
    console.error("Error al actualizar estado del pedido:", updateError.message);
    return;
  }

  // Get final loyalty count
  const { data: profileAfter } = await supabase
    .from("profiles")
    .select("loyalty_count")
    .eq("id", profileId)
    .single();
  console.log("Loyalty count DESPUÉS de completar pedido:", profileAfter?.loyalty_count);
}

testTrigger();
