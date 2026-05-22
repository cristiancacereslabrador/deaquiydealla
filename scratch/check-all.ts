import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAll() {
  console.log("--- PROFILES ---");
  const { data: profiles, error: pError } = await supabase.from("profiles").select("*");
  if (pError) {
    console.error("Profiles error:", pError.message);
  } else {
    console.log(`Encontrados ${profiles?.length || 0} perfiles:`);
    profiles?.forEach(p => {
      console.log(`ID: ${p.id} | Email: ${p.email} | Phone: ${p.phone} | Loyalty Count: ${p.loyalty_count}`);
    });
  }

  console.log("\n--- PEDIDOS ---");
  const { data: pedidos, error: oError } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
  if (oError) {
    console.error("Pedidos error:", oError.message);
  } else {
    console.log(`Encontrados ${pedidos?.length || 0} pedidos:`);
    pedidos?.forEach(o => {
      console.log(`ID: ${o.id} | Cliente: ${o.customer_name} | Phone: ${o.customer_phone} | Status: ${o.status} | Created: ${o.created_at}`);
    });
  }
}

checkAll();
