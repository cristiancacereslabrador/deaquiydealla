import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrder() {
  console.log("Buscando pedido...");
  // Buscamos pedidos que comiencen con 'e27b7471' o similar
  const { data, error } = await supabase
    .from("pedidos")
    .select("*");
    
  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Total pedidos en BD:", data?.length || 0);
  data?.forEach(o => {
    console.log(`ID: ${o.id} | Cliente: ${o.customer_name} | Email: ${o.customer_email} | Teléfono: ${o.customer_phone} | Estado: ${o.status}`);
  });
}

checkOrder();
