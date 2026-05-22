import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLoyalty() {
  const email = "cristiancacereslabrador@gmail.com";
  console.log(`Buscando usuario: ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listando usuarios:", listError.message);
    return;
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`No se encontró ningún usuario registrado con el email: ${email}`);
    return;
  }

  console.log(`Usuario encontrado! ID: ${user.id}`);

  // Fetch current loyalty count
  const { data: profile } = await supabase.from("profiles").select("loyalty_count").eq("id", user.id).single();
  const currentCount = profile?.loyalty_count ?? 0;
  const newCount = currentCount + 1; // Increment by 1 or set to 2

  console.log(`Loyalty count actual: ${currentCount}. Incrementando a: ${newCount}...`);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      loyalty_count: newCount,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError.message);
    return;
  }

  console.log(`✅ ¡Éxito! El perfil de ${email} ahora tiene loyalty_count = ${newCount}.`);
}

fixLoyalty();
