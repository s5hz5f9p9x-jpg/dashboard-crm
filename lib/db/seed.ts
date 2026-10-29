import { db } from "./client";
import { configuracion } from "./schema";

const DEFAULTS: { clave: string; valor: string; descripcion: string }[] = [
  {
    clave: "umbral_segmento_a_usd",
    valor: "100000",
    descripcion: "AUM promedio (USD) a partir del cual un cliente activo pasa a segmento A.",
  },
  {
    clave: "umbral_segmento_b_usd",
    valor: "40000",
    descripcion: "AUM promedio (USD) a partir del cual un cliente activo pasa a segmento B.",
  },
  {
    clave: "frecuencia_contacto_a_dias",
    valor: "30",
    descripcion: "Cada cuántos días hay que contactar a un cliente segmento A.",
  },
  {
    clave: "frecuencia_contacto_b_dias",
    valor: "60",
    descripcion: "Cada cuántos días hay que contactar a un cliente segmento B.",
  },
  {
    clave: "frecuencia_contacto_c_dias",
    valor: "90",
    descripcion: "Cada cuántos días hay que contactar a un cliente segmento C.",
  },
  {
    clave: "variacion_aum_alerta_pct",
    valor: "10",
    descripcion: "Variación de AUM en el mes (%) que dispara la alerta de variación.",
  },
  {
    clave: "dias_inactividad_alerta",
    valor: "60",
    descripcion: "Días sin contacto a partir de los cuales se dispara la alerta de inactividad prolongada.",
  },
  {
    clave: "fee_anual_pct",
    valor: "1.25",
    descripcion: "Fee anual promedio (%) usado en el modelo económico. Es un supuesto hasta tener datos reales.",
  },
  {
    clave: "retencion_anual_pct",
    valor: "85",
    descripcion: "Retención anual (%) supuesta cuando no hay 12 meses de historia propia.",
  },
  {
    clave: "multiplo_ltv_cac",
    valor: "3",
    descripcion: "Múltiplo mínimo LTV/CAC para considerar sana la adquisición.",
  },
];

async function main() {
  for (const row of DEFAULTS) {
    await db
      .insert(configuracion)
      .values({ ...row, updated_at: new Date() })
      .onConflictDoNothing({ target: configuracion.clave });
  }
  console.log(`Seed de configuracion: ${DEFAULTS.length} claves verificadas.`);

}

main();
