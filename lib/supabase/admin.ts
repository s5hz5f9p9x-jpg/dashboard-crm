import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

/**
 * Cliente de Supabase con la service_role key — SOLO para el job de backup
 * (sube/lista/borra archivos en Storage). No usar para nada de datos del CRM:
 * esa lectura/escritura siempre va por Postgres directo (lib/db/client.ts).
 */
export function getSupabaseAdmin() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
  }
  _client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return _client;
}
