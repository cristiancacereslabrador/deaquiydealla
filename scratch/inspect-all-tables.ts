import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAll() {
  const tables = [
    "profiles",
    "pedidos",
    "store_settings",
    "ingredients",
    "dish_ingredients",
    "dish_status",
    "custom_dishes",
    "dish_price_overrides"
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(5);
    if (error) {
      console.log(`Table '${table}': error: ${error.message}`);
    } else {
      console.log(`Table '${table}': ${data.length} rows found (first up to 5):`);
      if (data.length > 0) {
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
  }
}

inspectAll();
