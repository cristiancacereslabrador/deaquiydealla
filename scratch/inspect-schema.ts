import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  const { data: tables, error: tErr } = await supabase.rpc("inspect_tables");
  if (tErr) {
    // If inspect_tables function doesn't exist, we can query postgrest info or information_schema via a sql function
    // Or we can just query pg_catalog using an rpc or a direct query if we have postgres endpoint.
    // Wait, let's query the supabase API to see what tables are available.
    console.error("RPC error:", tErr.message);
    
    // Let's try to query information_schema.columns directly via postgrest if allowed, or write a custom query.
    // Actually, let's run a simple select from pg_catalog or information_schema using supabase.from("pg_class")? No, postgrest only exposes tables in the API.
    // Let's see if we can do:
    const { data: columns, error: colErr } = await supabase
      .from("pedidos")
      .select()
      .limit(1);
    
    if (colErr) {
      console.error("Error reading pedidos:", colErr.message);
    } else {
      console.log("Columns of 'pedidos' table:", columns.length > 0 ? Object.keys(columns[0]) : "No rows to inspect columns");
    }
  } else {
    console.log("Tables info:", tables);
  }
}

inspectSchema();
