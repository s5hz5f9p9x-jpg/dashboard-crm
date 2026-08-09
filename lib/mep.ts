export interface CotizacionMep {
  ticker: string;
  mark: number;
}

export interface ResultadoMep {
  mepArsUsd: number;
  ticker: "AL30" | "GD30";
}

const URL_MEP = "https://data912.com/live/mep";

/**
 * Tipo de cambio MEP a partir de data912.com — toma el `mark` (precio implícito
 * ARS/USD) del bono AL30, con GD30 como respaldo si AL30 no está disponible.
 * Ver ETAPA_0_MAPEO.md sección "Conversión ARS → USD del AUM".
 */
export async function obtenerMep(fetchFn: typeof fetch = fetch): Promise<ResultadoMep> {
  const res = await fetchFn(URL_MEP);
  if (!res.ok) {
    throw new Error(`No se pudo obtener el MEP de data912.com: HTTP ${res.status}`);
  }
  const data = (await res.json()) as CotizacionMep[];

  for (const ticker of ["AL30", "GD30"] as const) {
    const fila = data.find((d) => d.ticker === ticker);
    if (fila && Number.isFinite(fila.mark) && fila.mark > 0) {
      return { mepArsUsd: fila.mark, ticker };
    }
  }

  throw new Error("No se encontró cotización de AL30 ni GD30 en data912.com/live/mep");
}
