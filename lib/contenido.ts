import type { EstadoContenido, PilarContenido } from "./db/schema";

/** SPEC.md sección 6.6: objetivo del plan por pilar. */
export const OBJETIVO_PILARES: Record<PilarContenido, number> = {
  traduccion: 0.4,
  termometro: 0.35,
  prueba: 0.25,
};

export interface ProporcionPilar {
  pilar: PilarContenido;
  cantidad: number;
  pctReal: number | null;
  pctObjetivo: number;
}

export function calcularProporcionPilares(ideas: { pilar: PilarContenido }[]): ProporcionPilar[] {
  const total = ideas.length;
  const conteos: Record<PilarContenido, number> = { traduccion: 0, termometro: 0, prueba: 0 };
  for (const i of ideas) conteos[i.pilar]++;

  return (Object.keys(OBJETIVO_PILARES) as PilarContenido[]).map((pilar) => ({
    pilar,
    cantidad: conteos[pilar],
    pctReal: total > 0 ? conteos[pilar] / total : null,
    pctObjetivo: OBJETIVO_PILARES[pilar],
  }));
}

export function calcularPublicadasSobreTotal(ideas: { estado: EstadoContenido }[]): { publicadas: number; total: number } {
  const publicadas = ideas.filter((i) => i.estado === "publicada" || i.estado === "promocionada").length;
  return { publicadas, total: ideas.length };
}
