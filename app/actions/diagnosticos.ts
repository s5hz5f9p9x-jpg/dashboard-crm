"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { diagnosticos, prospectos } from "@/lib/db/schema";

export interface DiagnosticoConProspecto {
  id: string;
  prospectoId: string;
  prospectoNombre: string;
  fechaSolicitud: string;
  fechaEntrega: string | null;
  minutosProduccion: number | null;
  enviado: boolean;
}

export async function listarDiagnosticos(): Promise<DiagnosticoConProspecto[]> {
  const rows = await db.select().from(diagnosticos).orderBy(desc(diagnosticos.fecha_solicitud));
  const todosProspectos = await db.select().from(prospectos);
  const prospectosMap = new Map(todosProspectos.map((p) => [p.id, p]));
  return rows.map((d) => ({
    id: d.id,
    prospectoId: d.prospecto_id,
    prospectoNombre: prospectosMap.get(d.prospecto_id)?.nombre ?? "(prospecto eliminado)",
    fechaSolicitud: d.fecha_solicitud,
    fechaEntrega: d.fecha_entrega,
    minutosProduccion: d.minutos_produccion,
    enviado: d.enviado,
  }));
}

export async function obtenerDiagnostico(id: string) {
  const [d] = await db.select().from(diagnosticos).where(eq(diagnosticos.id, id));
  if (!d) return null;
  const [prospecto] = await db.select().from(prospectos).where(eq(prospectos.id, d.prospecto_id));
  return { diagnostico: d, prospecto };
}

export async function crearDiagnostico(input: { prospectoId: string }) {
  const [diagnostico] = await db
    .insert(diagnosticos)
    .values({
      prospecto_id: input.prospectoId,
      fecha_solicitud: new Date().toISOString().slice(0, 10),
    })
    .returning();
  revalidatePath("/diagnosticos");
  return diagnostico.id;
}

export async function actualizarDiagnostico(
  id: string,
  patch: Partial<{
    bloque_foto_actual: string;
    bloque_riesgo_real: string;
    bloque_rendimiento: string;
    bloque_huecos: string;
    bloque_proximo_paso: string;
    minutos_produccion: number | null;
  }>,
) {
  await db
    .update(diagnosticos)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(diagnosticos.id, id));
  revalidatePath("/diagnosticos");
}

export async function marcarDiagnosticoEnviado(id: string) {
  await db
    .update(diagnosticos)
    .set({ enviado: true, fecha_entrega: new Date().toISOString().slice(0, 10), updated_at: new Date() })
    .where(eq(diagnosticos.id, id));
  revalidatePath("/diagnosticos");
}
