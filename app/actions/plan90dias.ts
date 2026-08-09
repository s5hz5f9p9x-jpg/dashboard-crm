"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { tareasPlan } from "@/lib/db/schema";
import type { EstadoTarea } from "@/lib/db/schema";

export async function listarTareasPlan() {
  return db.select().from(tareasPlan).orderBy(tareasPlan.semana);
}

export async function actualizarEstadoTarea(id: string, estado: EstadoTarea) {
  await db
    .update(tareasPlan)
    .set({
      estado,
      fecha_completada: estado === "hecho" ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date(),
    })
    .where(eq(tareasPlan.id, id));
  revalidatePath("/plan-90-dias");
}
