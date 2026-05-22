import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectProfilesDates() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, loyalty_count, updated_at")
    .order("updated_at", { ascending: false });
    
  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Profiles ordered by updated_at:");
  profiles?.forEach(p => {
    console.log(`Name: ${p.full_name} | Phone: ${p.phone} | Loyalty: ${p.loyalty_count} | Updated: ${p.updated_at}`);
  });
}

inspectProfilesDates();
