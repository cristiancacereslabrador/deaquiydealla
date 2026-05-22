import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.error("Auth users error:", uError.message);
    return;
  }

  console.log(`Encontrados ${users.length} usuarios en Auth:`);
  for (const u of users) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", u.id).single();
    console.log(`ID: ${u.id} | Email: ${u.email} | Phone (Auth): ${u.phone} | Meta Phone: ${u.raw_user_meta_data?.phone} | Profile Phone: ${profile?.phone} | Loyalty Count: ${profile?.loyalty_count} | Name: ${profile?.full_name}`);
  }
}

checkAuthUsers();
