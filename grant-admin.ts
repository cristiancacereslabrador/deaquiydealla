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

async function grantAdmin(email: string) {
  console.log(`Buscando usuario: ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listando usuarios:", listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`No se encontró ningún usuario registrado con el email: ${email}`);
    return;
  }

  console.log(`Usuario encontrado! ID: ${user.id}`);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError.message);
    return;
  }

  console.log(`✅ ¡Éxito! El usuario ${email} ahora tiene el rol 'admin'.`);
}

const targetEmail = "deaquiydealla25@gmail.com";
grantAdmin(targetEmail);
