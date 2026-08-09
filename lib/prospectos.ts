import type { EtapaProspecto, PatrimonioDeclarado } from "./db/schema";

/**
 * SPEC.md sección 5.3 — calificado = patrimonio_declarado en [20k_50k, 50k_150k, mas_150k].
 * Un prospecto con menos_20k NO se descarta ni se borra: se marca no calificado
 * (se etiqueta para newsletter en la UI, no en esta función).
 */
export function calcularCalificado(patrimonio: PatrimonioDeclarado | null): boolean {
  if (!patrimonio) return false;
  return patrimonio === "20k_50k" || patrimonio === "50k_150k" || patrimonio === "mas_150k";
}

export const ETAPAS_PIPELINE: { etapa: EtapaProspecto; etiqueta: string }[] = [
  { etapa: "lead", etiqueta: "Lead" },
  { etapa: "calificado", etiqueta: "Calificado" },
  { etapa: "diagnostico_enviado", etiqueta: "Diagnóstico enviado" },
  { etapa: "llamada_agendada", etiqueta: "Llamada agendada" },
  { etapa: "llamada_realizada", etiqueta: "Llamada realizada" },
  { etapa: "propuesta", etiqueta: "Propuesta" },
  { etapa: "ganado", etiqueta: "Ganado" },
  { etapa: "perdido", etiqueta: "Perdido" },
];
