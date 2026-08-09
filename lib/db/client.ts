import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.CRM_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "Falta CRM_DATABASE_URL en .env.local. Connection string del rol crm_app (schema crm) por el pooler de Supabase.",
  );
}

const client = postgres(DATABASE_URL, { ssl: "require", max: 5, idle_timeout: 20 });

export const db = drizzle(client, { schema });
export { client };
