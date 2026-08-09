"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { clientes, prospectoEtapaHistorial, prospectos } from "@/lib/db/schema";
import type { EtapaProspecto, OrigenProspecto, PatrimonioDeclarado } from "@/lib/db/schema";
import { calcularCalificado } from "@/lib/prospectos";
import { separarNombre } from "@/lib/importador";

export interface CrearProspectoInput {
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  origen: OrigenProspecto;
  origen_detalle?: string | null;
  patrimonio_declarado?: PatrimonioDeclarado | null;
  objetivo?: string | null;
  notas?: string | null;
}

export async function listarProspectos() {
  return db.select().from(prospectos).orderBy(desc(prospectos.created_at));
}

export async function crearProspecto(input: CrearProspectoInput) {
  if (!input.nombre.trim()) throw new Error("El nombre es obligatorio.");
  if (!input.origen) throw new Error("El origen es obligatorio: sin esto no se puede medir de dónde vienen los prospectos.");

  const calificado = calcularCalificado(input.patrimonio_declarado ?? null);
  const hoy = new Date().toISOString().slice(0, 10);

  const [prospecto] = await db
    .insert(prospectos)
    .values({
      nombre: input.nombre.trim(),
      email: input.email?.trim() || null,
      telefono: input.telefono?.trim() || null,
      origen: input.origen,
      origen_detalle: input.origen_detalle?.trim() || null,
      patrimonio_declarado: input.patrimonio_declarado ?? null,
      calificado,
      motivo_descalificacion: calificado ? null : "Patrimonio declarado menor a US$ 20.000 — se etiqueta para newsletter, no se descarta.",
      objetivo: input.objetivo?.trim() || null,
      notas: input.notas ?? "",
      fecha_ingreso: hoy,
      etapa: "lead",
    })
    .returning();

  await db.insert(prospectoEtapaHistorial).values({ prospecto_id: prospecto.id, etapa: "lead" });

  revalidatePath("/pipeline");
  return prospecto;
}

export async function moverEtapaProspecto(prospectoId: string, nuevaEtapa: EtapaProspecto, motivoPerdida?: string) {
  const esCierre = nuevaEtapa === "ganado" || nuevaEtapa === "perdido";
  await db
    .update(prospectos)
    .set({
      etapa: nuevaEtapa,
      fecha_cierre: esCierre ? new Date().toISOString().slice(0, 10) : null,
      motivo_perdida: nuevaEtapa === "perdido" ? (motivoPerdida?.trim() ?? null) : null,
      updated_at: new Date(),
    })
    .where(eq(prospectos.id, prospectoId));

  await db.insert(prospectoEtapaHistorial).values({ prospecto_id: prospectoId, etapa: nuevaEtapa });

  revalidatePath("/pipeline");
}

/** Al ganar un prospecto, se ofrece convertirlo en cliente arrastrando los datos ya cargados (SPEC.md 6.3). */
export async function convertirEnCliente(prospectoId: string) {
  const [prospecto] = await db.select().from(prospectos).where(eq(prospectos.id, prospectoId));
  if (!prospecto) throw new Error("Prospecto no encontrado.");
  if (prospecto.cliente_id) return prospecto.cliente_id;

  const { nombre, apellido } = separarNombre(prospecto.nombre);
  const hoy = new Date().toISOString().slice(0, 10);

  const [cliente] = await db
    .insert(clientes)
    .values({
      nombre,
      apellido,
      email: prospecto.email,
      telefono: prospecto.telefono,
      fecha_alta: hoy,
      origen: prospecto.origen,
      notas: prospecto.objetivo ? `Objetivo declarado como prospecto: ${prospecto.objetivo}` : "",
    })
    .returning();

  await db
    .update(prospectos)
    .set({ cliente_id: cliente.id, etapa: "ganado", fecha_cierre: hoy, updated_at: new Date() })
    .where(eq(prospectos.id, prospectoId));

  revalidatePath("/pipeline");
  revalidatePath("/clientes");
  return cliente.id;
}

export async function actualizarProspecto(
  id: string,
  patch: Partial<{
    email: string | null;
    telefono: string | null;
    patrimonio_declarado: PatrimonioDeclarado | null;
    antiguedad_invirtiendo: string | null;
    objetivo: string | null;
    notas: string;
  }>,
) {
  const set: Record<string, unknown> = { ...patch, updated_at: new Date() };
  if ("patrimonio_declarado" in patch) {
    const calificado = calcularCalificado(patch.patrimonio_declarado ?? null);
    set.calificado = calificado;
    set.motivo_descalificacion = calificado ? null : "Patrimonio declarado menor a US$ 20.000 — se etiqueta para newsletter, no se descarta.";
  }
  await db.update(prospectos).set(set).where(eq(prospectos.id, id));
  revalidatePath("/pipeline");
}
