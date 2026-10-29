/**
 * Meta mensual de contactos y priorización de a quién llamar hoy.
 *
 * La meta no es un número inventado: sale de las frecuencias de contacto que
 * ya están configuradas por segmento. Si cambia una frecuencia o entran
 * clientes nuevos, la meta se recalcula sola.
 */

import type { Segmento } from "./db/schema";

/** Días promedio de un mes. Evita que la meta oscile entre meses de 28 y 31. */
const DIAS_POR_MES = 30.44;
const SEMANAS_POR_MES = 4.348;

/** Cuánto pesa cada segmento al ordenar la lista del día. */
const PESO_SEGMENTO: Record<Segmento, number> = { A: 3, B: 2, C: 1 };

export interface ClienteParaAgenda {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  estado: string;
  segmento: Segmento;
  segmento_manual: Segmento | null;
  aum_actual_usd: number;
  diasDesdeUltimoContacto: number;
  tuvoContacto: boolean;
  /** Fecha (YYYY-MM-DD) hasta la que el cliente queda fuera de la agenda. */
  agendaPosponerHasta: string | null;
}

export function segmentoEfectivo(c: { segmento: Segmento; segmento_manual: Segmento | null }): Segmento {
  return c.segmento_manual ?? c.segmento;
}

/**
 * Contactos por mes necesarios para sostener la cadencia comprometida con
 * cada cliente activo: un cliente con frecuencia de 30 días necesita ~1 por
 * mes; uno de 90, un tercio de eso.
 */
export function calcularMetaMensual(
  clientes: ClienteParaAgenda[],
  frecuencias: Record<Segmento, number>,
): number {
  const total = clientes
    .filter((c) => c.estado === "activo")
    .reduce((acc, c) => {
      const dias = frecuencias[segmentoEfectivo(c)];
      return acc + (dias > 0 ? DIAS_POR_MES / dias : 0);
    }, 0);
  return Math.round(total);
}

/** Ritmo semanal que hay que sostener para llegar a la meta del mes. */
export function metaSemanal(metaMensual: number): number {
  return Math.max(1, Math.round(metaMensual / SEMANAS_POR_MES));
}

/**
 * Qué tan atrasado está un cliente, ponderado por su segmento. Un cliente C
 * muy vencido puede quedar por encima de un A recién vencido: lo que importa
 * es el riesgo real de que la relación se enfríe, no sólo el tamaño.
 */
export function puntajePrioridad(c: ClienteParaAgenda, frecuencias: Record<Segmento, number>): number {
  const seg = segmentoEfectivo(c);
  const frecuencia = frecuencias[seg] || 90;
  const vencimiento = c.diasDesdeUltimoContacto / frecuencia;
  return vencimiento * PESO_SEGMENTO[seg];
}

/**
 * La lista del día: los más urgentes primero, sin los que ya contactaste hoy.
 * Se devuelve una cantidad chica a propósito — una lista de 160 pendientes
 * paraliza, una de 5 se hace.
 */
export function estaPospuesto(c: ClienteParaAgenda, hoy: string): boolean {
  return !!c.agendaPosponerHasta && c.agendaPosponerHasta > hoy;
}

export function agendaDelDia(
  clientes: ClienteParaAgenda[],
  frecuencias: Record<Segmento, number>,
  cuantos = 5,
  hoy = new Date().toISOString().slice(0, 10),
): ClienteParaAgenda[] {
  return clientes
    .filter((c) => c.estado === "activo")
    .filter((c) => !(c.tuvoContacto && c.diasDesdeUltimoContacto === 0))
    .filter((c) => !estaPospuesto(c, hoy))
    .sort((a, b) => {
      const d = puntajePrioridad(b, frecuencias) - puntajePrioridad(a, frecuencias);
      return d !== 0 ? d : b.aum_actual_usd - a.aum_actual_usd;
    })
    .slice(0, cuantos);
}

/**
 * Semanas consecutivas en las que se sostuvo el ritmo, contando hacia atrás
 * desde la semana pasada. La semana en curso no cuenta: todavía se puede
 * cumplir, y cortar la racha por una semana a medio andar desmotiva.
 */
export function calcularRacha(contactosPorSemana: number[], objetivoSemanal: number): number {
  let racha = 0;
  for (let i = contactosPorSemana.length - 1; i >= 0; i--) {
    if (contactosPorSemana[i] >= objetivoSemanal) racha++;
    else break;
  }
  return racha;
}

/** Clave ISO de la semana (lunes) de una fecha, para agrupar contactos. */
export function claveSemana(fecha: Date): string {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const diaSemana = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diaSemana);
  return d.toISOString().slice(0, 10);
}
