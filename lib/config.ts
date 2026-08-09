import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { configuracion } from "./db/schema";

export type ConfigKey =
  | "umbral_segmento_a_usd"
  | "umbral_segmento_b_usd"
  | "frecuencia_contacto_a_dias"
  | "frecuencia_contacto_b_dias"
  | "frecuencia_contacto_c_dias"
  | "variacion_aum_alerta_pct"
  | "dias_inactividad_alerta"
  | "fee_anual_pct"
  | "retencion_anual_pct"
  | "multiplo_ltv_cac"
  | "dias_gracia_cliente_nuevo";

export async function getConfigNumber(clave: ConfigKey): Promise<number> {
  const [row] = await db.select().from(configuracion).where(eq(configuracion.clave, clave));
  if (!row) {
    throw new Error(`Falta la clave de configuración "${clave}". Corré el seed.`);
  }
  const valor = Number(row.valor);
  if (Number.isNaN(valor)) {
    throw new Error(`La clave de configuración "${clave}" no es numérica: "${row.valor}".`);
  }
  return valor;
}

export async function getAllConfig() {
  return db.select().from(configuracion);
}
