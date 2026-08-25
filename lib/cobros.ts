/**
 * Cobros por cliente: cruza las posiciones de cada cliente con los cronogramas
 * de bond_flows para saber quién cobra renta o amortización en una ventana de
 * fechas.
 *
 * Los cronogramas vienen expresados por cada 100 de valor nominal (misma
 * convención que usa el dashboard en lib/rentaFija.ts), así que el monto de un
 * cliente es (interés + amortización) / 100 × sus nominales.
 */

/**
 * Clases de activo que devengan cupones. Una acción o un CEDEAR sin cronograma
 * es lo normal; un bono sin cronograma es un dato faltante que hay que cargar.
 * Mismas clases que usa el dashboard en lib/rentaFija.ts.
 */
export const CLASES_RENTA_FIJA = ["Bonos soberanos", "Obligaciones Negociables", "Letras"] as const;

export function esRentaFija(assetClass: string | null | undefined): boolean {
  return !!assetClass && (CLASES_RENTA_FIJA as readonly string[]).includes(assetClass);
}

export interface PosicionCliente {
  clienteId: string;
  ticker: string;
  /** Valor nominal tenido por el cliente (sumado entre todas sus cuentas). */
  nominales: number;
  /** Clase de activo según Supabase; define si corresponde esperar un cronograma. */
  assetClass?: string | null;
}

export interface FlujoBono {
  ticker: string;
  fecha: string; // YYYY-MM-DD
  /** Renta por cada 100 de valor nominal. */
  interest: number;
  /** Amortización por cada 100 de valor nominal. */
  amort: number;
}

export interface CobroDetalle {
  ticker: string;
  fecha: string;
  nominales: number;
  rentaUsd: number;
  amortUsd: number;
  totalUsd: number;
}

export interface CobrosCalculados {
  /** clienteId -> sus cobros en la ventana, ordenados por fecha. */
  porCliente: Map<string, CobroDetalle[]>;
  /**
   * Instrumentos de renta fija que algún cliente tiene en cartera pero para los
   * que no hay cronograma cargado. Sin esto, un bono sin cronograma se vería
   * igual que "este cliente no cobra nada", que es una conclusión distinta y
   * peligrosa. Las acciones, CEDEARs y efectivo no se cuentan: no llevan cupón.
   */
  tickersSinCronograma: string[];
}

/** Rango [desde, hasta] inclusive, ambos en formato YYYY-MM-DD. */
export function calcularCobros(
  posiciones: PosicionCliente[],
  flujos: FlujoBono[],
  desde: string,
  hasta: string,
): CobrosCalculados {
  const flujosPorTicker = new Map<string, FlujoBono[]>();
  for (const f of flujos) {
    const arr = flujosPorTicker.get(f.ticker) ?? [];
    arr.push(f);
    flujosPorTicker.set(f.ticker, arr);
  }

  // Un cliente puede tener el mismo bono en más de una cuenta: se suman los nominales.
  const nominalesPorClienteTicker = new Map<string, number>();
  const tickersRentaFija = new Set<string>();
  for (const p of posiciones) {
    if (p.nominales <= 0) continue;
    if (esRentaFija(p.assetClass)) tickersRentaFija.add(p.ticker);
    const clave = `${p.clienteId}::${p.ticker}`;
    nominalesPorClienteTicker.set(clave, (nominalesPorClienteTicker.get(clave) ?? 0) + p.nominales);
  }

  const porCliente = new Map<string, CobroDetalle[]>();

  for (const [clave, nominales] of nominalesPorClienteTicker) {
    const sep = clave.indexOf("::");
    const clienteId = clave.slice(0, sep);
    const ticker = clave.slice(sep + 2);

    for (const f of flujosPorTicker.get(ticker) ?? []) {
      if (f.fecha < desde || f.fecha > hasta) continue;
      const rentaUsd = (f.interest / 100) * nominales;
      const amortUsd = (f.amort / 100) * nominales;
      const totalUsd = rentaUsd + amortUsd;
      if (totalUsd <= 0) continue;

      const arr = porCliente.get(clienteId) ?? [];
      arr.push({ ticker, fecha: f.fecha, nominales, rentaUsd, amortUsd, totalUsd });
      porCliente.set(clienteId, arr);
    }
  }

  for (const arr of porCliente.values()) {
    arr.sort((a, b) => (a.fecha === b.fecha ? b.totalUsd - a.totalUsd : a.fecha < b.fecha ? -1 : 1));
  }

  const tickersSinCronograma = [...tickersRentaFija].filter((t) => !flujosPorTicker.has(t)).sort();

  return { porCliente, tickersSinCronograma };
}

export function totalDeCobros(detalles: CobroDetalle[]): number {
  return detalles.reduce((acc, d) => acc + d.totalUsd, 0);
}

/**
 * Semana corrida de lunes a domingo que contiene a `fecha`.
 * Se trabaja con strings YYYY-MM-DD para no arrastrar problemas de huso horario.
 */
export function semanaDe(fecha: string): { desde: string; hasta: string } {
  const d = new Date(`${fecha}T12:00:00Z`);
  const diaSemana = (d.getUTCDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(d);
  lunes.setUTCDate(d.getUTCDate() - diaSemana);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  return { desde: lunes.toISOString().slice(0, 10), hasta: domingo.toISOString().slice(0, 10) };
}
