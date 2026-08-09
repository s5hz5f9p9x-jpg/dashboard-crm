import { defineConfig } from "drizzle-kit";

if (!process.env.CRM_DATABASE_URL) {
  throw new Error("Falta CRM_DATABASE_URL en .env.local (connection string del rol crm_app).");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["crm"],
  dbCredentials: {
    url: process.env.CRM_DATABASE_URL,
  },
});
