/**
 * Reglas puras del motor de disparadores — SPEC.md sección 5.2. Cada función
 * evalúa una condición sola; quien orquesta (app/actions/disparadores.ts) las
 * combina con los datos reales y arma los registros a insertar.
 */

export interface EvaluacionVariacionAum {
  disparar: boolean;
  variacionPct: number | null;
}

/** Dispara si el AUM se movió más del umbral (en cualquier dirección) respecto de hace ~30 días. */
export function evaluarVariacionAum(
  aumHoy: number,
  aumHaceUnMes: number | null,
  umbralPct: number,
): EvaluacionVariacionAum {
  if (aumHaceUnMes === null || aumHaceUnMes === 0) return { disparar: false, variacionPct: null };
  const variacionPct = ((aumHoy - aumHaceUnMes) / aumHaceUnMes) * 100;
  return { disparar: Math.abs(variacionPct) > umbralPct, variacionPct };
}

/** Días desde el último contacto por encima de la frecuencia comprometida del segmento. */
export function evaluarContactoVencido(diasDesdeUltimoContacto: number, frecuenciaDias: number): boolean {
  return diasDesdeUltimoContacto > frecuenciaDias;
}

/** Inactividad más severa que el simple "contacto vencido": el umbral global de la sección 4.11. */
export function evaluarInactividadProlongada(diasDesdeUltimoContacto: number, diasInactividadAlerta: number): boolean {
  return diasDesdeUltimoContacto > diasInactividadAlerta;
}

export interface EvaluacionAniversario {
  esAniversario: boolean;
  anios: number;
}

/** Se cumple un año exacto (mismo día y mes de fecha_alta, al menos un año después). */
export function evaluarAniversario(fechaAlta: string, hoy: Date): EvaluacionAniversario {
  const alta = new Date(`${fechaAlta}T00:00:00`);
  const anios = hoy.getFullYear() - alta.getFullYear();
  const esAniversario = anios >= 1 && alta.getDate() === hoy.getDate() && alta.getMonth() === hoy.getMonth();
  return { esAniversario, anios };
}

/**
 * El pedido de referido se dispara 48hs después del reporte enviado, nunca antes
 * (SPEC.md 5.2: "no se dispara junto con el reporte"). Como los disparadores se
 * recalculan on-demand y no cada hora exacta, se evalúa como "ya pasaron al
 * menos 48hs", no "exactamente".
 */
export function evaluarPedirReferido(fechaReporteEnviado: Date, hoy: Date): boolean {
  const horas = (hoy.getTime() - fechaReporteEnviado.getTime()) / (1000 * 60 * 60);
  return horas >= 48;
}

/** Bono/ON vence dentro de la ventana de aviso (30 días por defecto). */
export function evaluarVencimientoProximo(fechaVencimiento: string, hoy: Date, diasVentana = 30): boolean {
  const venc = new Date(`${fechaVencimiento}T00:00:00`);
  const dias = Math.floor((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return dias >= 0 && dias <= diasVentana;
}

export function periodoMes(hoy: Date): string {
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}
