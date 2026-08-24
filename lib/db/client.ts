import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const DATABASE_URL = process.env.CRM_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "Falta CRM_DATABASE_URL en .env.local. Connection string del rol crm_app (schema crm) por el pooler de Supabase.",
  );
}

// Pooler de Supabase en modo SESIÓN (puerto 5432): cada conexión del pool queda dedicada a
// este cliente durante toda su vida, así que los prepared statements son seguros acá (a
// diferencia del pooler en modo transacción, puerto 6543, donde cada statement puede caer en
// una conexión física distinta y rompía/colgaba las queries). max_lifetime fuerza a reciclar
// cada conexión cada 10 minutos como red de seguridad, para no arrastrar una conexión zombie
// si una función serverless queda congelada a mitad de una query.
const client = postgres(DATABASE_URL, { ssl: "require", max: 3, idle_timeout: 20, max_lifetime: 60 * 10 });

export const db = drizzle(client, { schema });
export { client };
