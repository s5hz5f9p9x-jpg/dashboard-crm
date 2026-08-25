import { createClient } from "@supabase/supabase-js";

/**
 * Tipos mínimos de las tablas del dashboard que tocamos con la service key.
 * Sin esto, supabase-js infiere `never` para los nombres de tabla y cualquier
 * `.from(...)` no compila.
 */
export interface BondFlowRow {
  ticker: string;
  flow_date: string;
  interest: number;
  amort: number;
}

interface Database {
  public: {
    Tables: {
      bond_flows: {
        Row: BondFlowRow;
        Insert: BondFlowRow;
        Update: Partial<BondFlowRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

let _client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Cliente de Supabase con la service_role key. Se usa para el job de backup
 * (Storage) y para mantener los cronogramas de bond_flows, que son la fuente
 * compartida entre el dashboard y el CRM. Los datos propios del CRM nunca
 * pasan por acá: van por Postgres directo (lib/db/client.ts).
 */
export function getSupabaseAdmin() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
  }
  _client = createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } });
  return _client;
}
