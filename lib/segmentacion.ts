import type { EstadoCliente, Segmento } from "./db/schema";

export interface SnapshotAum {
  fecha: string; // YYYY-MM-DD
  aum_usd: number;
}

export interface CalcularSegmentoParams {
  estado: EstadoCliente;
  fechaAlta: string; // YYYY-MM-DD
  hoy: Date;
  segmentoManual: Segmento | null;
  segmentoManualMotivo: string | null;
  /** Segmento vigente antes de este recálculo — necesario para aplicar la histéresis. */
  segmentoActual: Segmento;
  /** Historial de AUM del cliente, en cualquier orden. */
  snapshots: SnapshotAum[];
  umbralSegmentoA: number;
  umbralSegmentoB: number;
  diasGraciaClienteNuevo: number;
}

export interface ResultadoSegmento {
  segmento: Segmento;
  motivo: string;
  aumPromedio: number | null;
}

const RANGO: Record<Segmento, number> = { C: 0, B: 1, A: 2 };
const FACTOR_HISTERESIS = 0.9;

/**
 * Algoritmo de segmentación A/B/C — ver SPEC.md sección 5.1.
 * Para bajar de segmento el promedio tiene que estar 10% por debajo del umbral
 * del segmento actual (histéresis), no apenas por debajo. Subir de segmento no
 * tiene resistencia: se aplica en cuanto se cruza el umbral.
 */
export function calcularSegmento(params: CalcularSegmentoParams): ResultadoSegmento {
  const {
    estado,
    fechaAlta,
    hoy,
    segmentoManual,
    segmentoManualMotivo,
    segmentoActual,
    snapshots,
    umbralSegmentoA,
    umbralSegmentoB,
    diasGraciaClienteNuevo,
  } = params;

  if (segmentoManual) {
    if (!segmentoManualMotivo || segmentoManualMotivo.trim() === "") {
      throw new Error("El override manual de segmento requiere un motivo escrito.");
    }
    return {
      segmento: segmentoManual,
      motivo: `Override manual: ${segmentoManualMotivo}`,
      aumPromedio: null,
    };
  }

  if (estado !== "activo") {
    return { segmento: "C", motivo: `Cliente en estado "${estado}"`, aumPromedio: null };
  }

  const diasDesdeAlta = diferenciaEnDias(hoy, new Date(`${fechaAlta}T00:00:00`));
  if (diasDesdeAlta < diasGraciaClienteNuevo) {
    return {
      segmento: "C",
      motivo: `Cliente nuevo: ${diasDesdeAlta} días desde el alta (gracia de ${diasGraciaClienteNuevo})`,
      aumPromedio: null,
    };
  }

  const mensuales = ultimosSnapshotsMensuales(snapshots, 3);
  if (mensuales.length === 0) {
    return { segmento: "C", motivo: "Sin historial de AUM todavía", aumPromedio: null };
  }

  const aumPromedio = mensuales.reduce((acc, s) => acc + s.aum_usd, 0) / mensuales.length;

  const segmentoNatural: Segmento =
    aumPromedio >= umbralSegmentoA ? "A" : aumPromedio >= umbralSegmentoB ? "B" : "C";

  const esBajada = RANGO[segmentoNatural] < RANGO[segmentoActual];
  if (!esBajada) {
    return {
      segmento: segmentoNatural,
      motivo: `AUM promedio de los últimos ${mensuales.length} mes/es: US$ ${aumPromedio.toFixed(0)}`,
      aumPromedio,
    };
  }

  const umbralSegmentoActual = segmentoActual === "A" ? umbralSegmentoA : umbralSegmentoB;
  const pisoHisteresis = umbralSegmentoActual * FACTOR_HISTERESIS;

  if (aumPromedio < pisoHisteresis) {
    return {
      segmento: segmentoNatural,
      motivo: `Baja de segmento: AUM promedio US$ ${aumPromedio.toFixed(0)} por debajo del piso de histéresis US$ ${pisoHisteresis.toFixed(0)}`,
      aumPromedio,
    };
  }

  return {
    segmento: segmentoActual,
    motivo: `Se mantiene por histéresis: AUM promedio US$ ${aumPromedio.toFixed(0)} no bajó del piso US$ ${pisoHisteresis.toFixed(0)}`,
    aumPromedio,
  };
}

function diferenciaEnDias(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Toma, de cada mes calendario distinto presente en `snapshots`, el snapshot
 * más reciente de ese mes, y devuelve los `n` meses más recientes. Evita que
 * sincronizar todos los días del mismo mes infle el promedio con ese mes repetido.
 */
function ultimosSnapshotsMensuales(snapshots: SnapshotAum[], n: number): SnapshotAum[] {
  const porMes = new Map<string, SnapshotAum>();
  for (const s of snapshots) {
    const mes = s.fecha.slice(0, 7);
    const actual = porMes.get(mes);
    if (!actual || s.fecha > actual.fecha) {
      porMes.set(mes, s);
    }
  }
  return [...porMes.values()].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, n);
}
