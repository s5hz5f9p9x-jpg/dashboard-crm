"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clientes } from "@/lib/db/schema";
import type { FilaValidada } from "@/lib/importador";

export type ModoImportacion = "crear" | "actualizar" | "ambos";

export interface ResumenImportacion {
  creados: number;
  actualizados: number;
  omitidos: { fila: number; nombre: string; motivo: string }[];
}

export async function importarClientes(
  filas: FilaValidada[],
  modo: ModoImportacion,
): Promise<ResumenImportacion> {
  const soloValidas = filas.filter((f) => f.errores.length === 0);

  const resumen: ResumenImportacion = { creados: 0, actualizados: 0, omitidos: [] };

  await db.transaction(async (tx) => {
    for (const fila of soloValidas) {
      const existente = fila.email
        ? (await tx.select().from(clientes).where(eq(clientes.email, fila.email)))[0]
        : undefined;

      if (existente) {
        if (modo === "actualizar" || modo === "ambos") {
          await tx
            .update(clientes)
            .set({
              nombre: fila.nombre,
              apellido: fila.apellido,
              telefono: fila.telefono ?? existente.telefono,
              fecha_alta: fila.fecha_alta ?? existente.fecha_alta,
              perfil_riesgo: fila.perfil_riesgo ?? existente.perfil_riesgo,
              estado: fila.estado,
              origen: fila.origen ?? existente.origen,
              notas: fila.notas || existente.notas,
              updated_at: new Date(),
            })
            .where(eq(clientes.id, existente.id));
          resumen.actualizados++;
        } else {
          resumen.omitidos.push({
            fila: fila.fila,
            nombre: `${fila.nombre} ${fila.apellido}`,
            motivo: "Ya existe un cliente con ese email (modo = crear nuevos)",
          });
        }
        continue;
      }

      if (modo === "crear" || modo === "ambos") {
        await tx.insert(clientes).values({
          nombre: fila.nombre,
          apellido: fila.apellido,
          email: fila.email,
          telefono: fila.telefono,
          fecha_alta: fila.fecha_alta!,
          perfil_riesgo: fila.perfil_riesgo,
          estado: fila.estado,
          origen: fila.origen,
          notas: fila.notas,
        });
        resumen.creados++;
      } else {
        resumen.omitidos.push({
          fila: fila.fila,
          nombre: `${fila.nombre} ${fila.apellido}`,
          motivo: "No existe cliente con ese email para actualizar (modo = actualizar existentes)",
        });
      }
    }
  });

  for (const fila of filas.filter((f) => f.errores.length > 0)) {
    resumen.omitidos.push({
      fila: fila.fila,
      nombre: `${fila.nombre} ${fila.apellido}`.trim() || "(sin nombre)",
      motivo: fila.errores.join("; "),
    });
  }

  return resumen;
}
