import type { EstadoTarea, FasePlan } from "./db/schema";

export const ORDEN_FASES: FasePlan[] = ["fase_0", "fase_1", "fase_2", "fase_3"];

export interface TareaParaBloqueo {
  fase: FasePlan;
  es_condicion_salida: boolean;
  estado: EstadoTarea;
}

export interface EstadoBloqueoFase {
  bloqueada: boolean;
  motivo: string | null;
}

/**
 * SPEC.md sección 6.8: "las condiciones de salida son bloqueantes en la
 * interfaz". No es una restricción técnica real (el usuario manda, puede
 * completar tareas de cualquier fase) — es solo la señal visual: una fase
 * queda "bloqueada" (atenuada + cartel) mientras la condición de salida de
 * la fase anterior no esté en 'hecho'.
 */
export function calcularBloqueoFases(tareas: TareaParaBloqueo[]): Record<FasePlan, EstadoBloqueoFase> {
  const resultado = {} as Record<FasePlan, EstadoBloqueoFase>;

  for (let i = 0; i < ORDEN_FASES.length; i++) {
    const fase = ORDEN_FASES[i];
    if (i === 0) {
      resultado[fase] = { bloqueada: false, motivo: null };
      continue;
    }
    const faseAnterior = ORDEN_FASES[i - 1];
    const condicionAnterior = tareas.find((t) => t.fase === faseAnterior && t.es_condicion_salida);
    const yaCumplida = condicionAnterior?.estado === "hecho";
    resultado[fase] = {
      bloqueada: !yaCumplida,
      motivo: yaCumplida
        ? null
        : `Todavía no se cumplió la condición de salida de ${etiquetaFase(faseAnterior)}.`,
    };
  }

  return resultado;
}

export function etiquetaFase(fase: FasePlan): string {
  const idx = ORDEN_FASES.indexOf(fase);
  return `Fase ${idx}`;
}

export interface AvancePlan {
  hechas: number;
  total: number;
  pct: number;
}

export function calcularAvance(tareas: { estado: EstadoTarea }[]): AvancePlan {
  const aplicables = tareas.filter((t) => t.estado !== "no_aplica");
  const hechas = aplicables.filter((t) => t.estado === "hecho").length;
  return {
    hechas,
    total: aplicables.length,
    pct: aplicables.length > 0 ? hechas / aplicables.length : 0,
  };
}
