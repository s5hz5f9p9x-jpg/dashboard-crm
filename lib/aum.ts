export interface PosicionParaAum {
  snapshot_value: number | null;
  snapshot_ccy: string | null;
  asset_class: string | null;
  ticker: string;
}

export interface ComposicionItem {
  clase: string;
  instrumento: string;
  monto_usd: number;
  moneda: string;
}

export interface ResultadoAum {
  aumUsd: number;
  composicion: ComposicionItem[];
}

/**
 * Suma las posiciones de una cuenta (o de varias, para un cliente con más de
 * una cuenta vinculada) a un total de AUM en USD. Las posiciones en ARS se
 * convierten con el MEP del momento; ver ETAPA_0_MAPEO.md.
 */
export function calcularAumUsd(posiciones: PosicionParaAum[], mepArsUsd: number): ResultadoAum {
  if (mepArsUsd <= 0) {
    throw new Error("El tipo de cambio MEP tiene que ser mayor a cero.");
  }

  const composicion: ComposicionItem[] = [];
  let aumUsd = 0;

  for (const p of posiciones) {
    const valor = p.snapshot_value ?? 0;
    if (valor === 0) continue;
    const moneda = (p.snapshot_ccy ?? "USD").toUpperCase();
    const montoUsd = moneda === "ARS" ? valor / mepArsUsd : valor;
    aumUsd += montoUsd;
    composicion.push({
      clase: p.asset_class ?? "Sin clasificar",
      instrumento: p.ticker,
      monto_usd: redondear(montoUsd),
      moneda,
    });
  }

  return { aumUsd: redondear(aumUsd), composicion };
}

function redondear(v: number): number {
  return Math.round(v * 100) / 100;
}

export interface SnapshotFecha {
  fecha: string;
  aum_usd: number;
}

/**
 * Snapshot de referencia ~30 días antes del más reciente (el más reciente que
 * caiga en o antes de esa fecha de corte; si no hay ninguno tan viejo, usa el
 * snapshot más antiguo disponible). Null si no hay al menos dos fechas distintas.
 */
export function encontrarReferenciaHaceUnMes(
  snapshots: SnapshotFecha[],
  diasVentana = 30,
): SnapshotFecha | null {
  if (snapshots.length < 2) return null;

  const ordenados = [...snapshots].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const actual = ordenados[0];

  const fechaCorte = new Date(`${actual.fecha}T00:00:00`);
  fechaCorte.setDate(fechaCorte.getDate() - diasVentana);
  const corteISO = fechaCorte.toISOString().slice(0, 10);

  const referencia = ordenados.find((s) => s.fecha <= corteISO) ?? ordenados[ordenados.length - 1];

  if (!referencia || referencia.fecha === actual.fecha) return null;
  return referencia;
}

/** Variación porcentual entre el snapshot más reciente y el de ~30 días antes. */
export function calcularVariacionMensual(
  snapshots: SnapshotFecha[],
  diasVentana = 30,
): number | null {
  if (snapshots.length < 2) return null;
  const actual = [...snapshots].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const referencia = encontrarReferenciaHaceUnMes(snapshots, diasVentana);
  if (!referencia || referencia.aum_usd === 0) return null;
  return (actual.aum_usd - referencia.aum_usd) / referencia.aum_usd;
}
