import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatUSD(valor: number): string {
  if (!Number.isFinite(valor)) return "—";
  return `US$ ${Math.round(valor).toLocaleString("es-AR")}`;
}

export function formatFecha(fechaISO: string | Date | null | undefined): string {
  if (!fechaISO) return "—";
  const d = typeof fechaISO === "string" ? parseISO(fechaISO) : fechaISO;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatPct(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—";
  return `${(valor * 100).toFixed(decimales)}%`;
}

export function dividirSeguro(numerador: number, denominador: number): number | null {
  if (!denominador) return null;
  return numerador / denominador;
}
