"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { ideasContenido } from "@/lib/db/schema";
import type { EstadoContenido, PilarContenido, RendimientoContenido } from "@/lib/db/schema";

export async function listarIdeasContenido() {
  return db.select().from(ideasContenido).orderBy(desc(ideasContenido.created_at));
}

/** Captura rápida: SPEC.md 6.6 — "un campo siempre accesible para anotar una idea en cinco segundos". */
export async function capturarIdeaRapida(idea: string, origenIdea?: string) {
  if (!idea.trim()) throw new Error("La idea no puede estar vacía.");
  await db.insert(ideasContenido).values({
    pilar: "prueba",
    idea: idea.trim(),
    origen_idea: origenIdea?.trim() || null,
    estado: "pendiente",
  });
  revalidatePath("/contenido");
}

export async function actualizarIdea(
  id: string,
  patch: Partial<{
    pilar: PilarContenido;
    idea: string;
    canal_sugerido: string | null;
    estado: EstadoContenido;
    fecha_publicacion: string | null;
    rendimiento: RendimientoContenido | null;
  }>,
) {
  await db
    .update(ideasContenido)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(ideasContenido.id, id));
  revalidatePath("/contenido");
}
