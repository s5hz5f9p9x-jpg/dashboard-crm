import { dividirSeguro } from "./format";

export interface InputModeloEconomico {
  aumPromedio: number;
  feeAnualPct: number;
  retencionAnualSupuestoPct: number;
  /** null si hay menos de 12 meses de historia propia — ahí se usa el supuesto. */
  retencionRealPct: number | null;
  multiploLtvCac: number;
  inversionPublicitariaTotalUsd: number;
  clientesNuevosPeriodo: number;
}

export interface ResultadoModeloEconomico {
  ingresoAnual: number;
  retencionUsada: number;
  retencionEsSupuesto: boolean;
  vidaMediaAnios: number;
  ltv: number;
  cacMaximo: number;
  cacReal: number | null;
  /** cacReal <= cacMaximo → se puede escalar la inversión. null si no hay cacReal todavía. */
  puedeEscalar: boolean | null;
}

/**
 * SPEC.md sección 5.5. Cuando no hay 12 meses de historia propia para calcular
 * la retención real, se usa el supuesto de configuración — y se marca
 * `retencionEsSupuesto` para que la UI lo avise bien visible (SPEC.md 14:
 * "el sistema tiene que dejar eso visible en la interfaz").
 */
export function calcularModeloEconomico(input: InputModeloEconomico): ResultadoModeloEconomico {
  const ingresoAnual = input.aumPromedio * (input.feeAnualPct / 100);

  const retencionEsSupuesto = input.retencionRealPct === null;
  const retencionPct = retencionEsSupuesto ? input.retencionAnualSupuestoPct : input.retencionRealPct!;
  const retencionUsada = retencionPct / 100;

  // Si la retención llegara al 100% la vida media sería infinita — la topeamos
  // en 99.9% para que el modelo siga dando un número usable en vez de romperse.
  const retencionParaCalculo = Math.min(Math.max(retencionUsada, 0), 0.999);
  const vidaMediaAnios = 1 / (1 - retencionParaCalculo);

  const ltv = ingresoAnual * vidaMediaAnios;
  const cacMaximo = input.multiploLtvCac > 0 ? ltv / input.multiploLtvCac : 0;
  const cacReal = dividirSeguro(input.inversionPublicitariaTotalUsd, input.clientesNuevosPeriodo);

  return {
    ingresoAnual,
    retencionUsada,
    retencionEsSupuesto,
    vidaMediaAnios,
    ltv,
    cacMaximo,
    cacReal,
    puedeEscalar: cacReal === null ? null : cacReal <= cacMaximo,
  };
}
