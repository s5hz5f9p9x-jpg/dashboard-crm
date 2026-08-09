"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clientes, contactos } from "@/lib/db/schema";
import type { DireccionContacto, EstadoCliente, NivelServicio, PerfilRiesgo, Segmento, TipoContacto } from "@/lib/db/schema";
import { recalcularSegmentos } from "@/lib/clientes";

export interface CrearClienteInput {
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  fecha_alta: string;
  nivel_servicio: NivelServicio;
  perfil_riesgo?: PerfilRiesgo | null;
  estado: EstadoCliente;
  origen?: string | null;
  notas?: string | null;
}

export async function crearCliente(input: CrearClienteInput) {
  if (!input.nombre.trim() || !input.apellido.trim()) {
    throw new Error("Nombre y apellido son obligatorios.");
  }
  if (!input.fecha_alta) {
    throw new Error("La fecha de alta es obligatoria.");
  }
  const [row] = await db
    .insert(clientes)
    .values({
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      email: input.email?.trim() || null,
      telefono: input.telefono?.trim() || null,
      fecha_alta: input.fecha_alta,
      nivel_servicio: input.nivel_servicio,
      perfil_riesgo: input.perfil_riesgo ?? null,
      estado: input.estado,
      origen: input.origen?.trim() || null,
      notas: input.notas ?? "",
    })
    .returning();

  revalidatePath("/clientes");
  return row;
}

export async function actualizarSegmentoManual(
  clienteId: string,
  segmento: Segmento | null,
  motivo: string | null,
) {
  if (segmento && (!motivo || motivo.trim() === "")) {
    throw new Error("El override de segmento no se puede guardar sin un motivo escrito.");
  }

  await db
    .update(clientes)
    .set({
      segmento_manual: segmento,
      segmento_manual_motivo: segmento ? motivo!.trim() : null,
      updated_at: new Date(),
    })
    .where(eq(clientes.id, clienteId));

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
}

export interface RegistrarContactoInput {
  cliente_id: string;
  tipo: TipoContacto;
  direccion: DireccionContacto;
  resumen: string;
}

export async function registrarContacto(input: RegistrarContactoInput) {
  await db.insert(contactos).values({
    cliente_id: input.cliente_id,
    tipo: input.tipo,
    direccion: input.direccion,
    resumen: input.resumen.trim(),
  });

  revalidatePath(`/clientes/${input.cliente_id}`);
  revalidatePath("/clientes");
}

export async function recalcularSegmentosAction() {
  const resultado = await recalcularSegmentos();
  revalidatePath("/clientes");
  return resultado;
}
