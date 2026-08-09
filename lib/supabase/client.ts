import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

/**
 * Conexión de SOLO LECTURA a Supabase (rol crm_readonly). Nunca hacer un
 * INSERT/UPDATE/DELETE acá — si el código intenta escribir, es un bug
 * (ver SPEC.md sección 7 y 13). El rol de Postgres ni siquiera tiene esos
 * permisos, así que cualquier intento de escritura va a fallar en el server,
 * pero igual: no lo intentes.
 */
export function getSupabaseSql() {
  if (_sql) return _sql;
  const url = process.env.CRM_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Falta CRM_SUPABASE_URL en .env.local. Ver ETAPA_0_MAPEO.md para la connection string del pooler.",
    );
  }
  _sql = postgres(url, { ssl: "require", max: 3, idle_timeout: 20 });
  return _sql;
}
