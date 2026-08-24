import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.CRM_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "Falta CRM_DATABASE_URL en .env.local. Connection string del rol crm_app (schema crm) por el pooler de Supabase.",
  );
}

// prepare: false es obligatorio contra el pooler de Supabase en modo transacción (puerto 6543):
// cada statement puede ir a una conexión física distinta, así que los prepared statements de
// postgres.js (que asumen una sola conexión persistente) rompen o cuelgan las queries.
const client = postgres(DATABASE_URL, { ssl: "require", max: 5, idle_timeout: 20, prepare: false });

export const db = drizzle(client, { schema });
export { client };
