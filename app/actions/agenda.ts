"use server";

import { and, gte, sql as sqlRaw } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { contactos } from "@/lib/db/schema";
import type { Segmento, TipoContacto } from "@/lib/db/schema";
import { listarClientes } from "@/lib/clientes";
import { getConfigNumber } from "@/lib/config";
import { registrarContacto } from "@/app/actions/clientes";
import {
  agendaDelDia,
  calcularMetaMensual,
  calcularRacha,
  claveSemana,
  metaSemanal,
  type ClienteParaAgenda,
} from "@/lib/metas";

export interface ResumenAgenda {
  metaMensual: number;
  hechosEsteMes: number;
  objetivoSemanal: number;
  hechosEstaSemana: number;
  racha: number;
  /** Clientes activos atrasados respecto de su frecuencia. */
  atrasados: number;
  agenda: ClienteParaAgenda[];
}

/** Cuántas semanas hacia atrás se miran para calcular la racha. */
const SEMANAS_DE_HISTORIA = 12;

export async function obtenerAgenda(): Promise<ResumenAgenda> {
  const ahora = new Date();
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  const desdeHistoria = new Date(ahora);
  desdeHistoria.setUTCDate(desdeHistoria.getUTCDate() - SEMANAS_DE_HISTORIA * 7);

  const [clientes, frecA, frecB, frecC, delMes, historia] = await Promise.all([
    listarClientes(),
    getConfigNumber("frecuencia_contacto_a_dias"),
    getConfigNumber("frecuencia_contacto_b_dias"),
    getConfigNumber("frecuencia_contacto_c_dias"),
    db
      .select({ n: sqlRaw<number>`count(*)::int` })
      .from(contactos)
      .where(and(gte(contactos.fecha, inicioMes), sqlRaw`${contactos.direccion} = 'saliente'`)),
    db
      .select({ fecha: contactos.fecha })
      .from(contactos)
      .where(and(gte(contactos.fecha, desdeHistoria), sqlRaw`${contactos.direccion} = 'saliente'`)),
  ]);

  const frecuencias: Record<Segmento, number> = { A: frecA, B: frecB, C: frecC };

  const paraAgenda: ClienteParaAgenda[] = clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    apellido: c.apellido,
    telefono: c.telefono,
    estado: c.estado,
    segmento: c.segmento,
    segmento_manual: c.segmento_manual,
    aum_actual_usd: c.aum_actual_usd,
    diasDesdeUltimoContacto: c.diasDesdeUltimoContacto,
    tuvoContacto: c.tuvoContacto,
  }));

  const metaMensual = calcularMetaMensual(paraAgenda, frecuencias);
  const objetivoSemanal = metaSemanal(metaMensual);

  // Contactos por semana, de la más vieja a la más nueva, sin la semana en curso.
  const porSemana = new Map<string, number>();
  for (const c of historia) porSemana.set(claveSemana(c.fecha), (porSemana.get(claveSemana(c.fecha)) ?? 0) + 1);
  const semanaActual = claveSemana(ahora);
  const semanasOrdenadas = [...porSemana.entries()]
    .filter(([k]) => k < semanaActual)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, n]) => n);

  return {
    metaMensual,
    hechosEsteMes: delMes[0]?.n ?? 0,
    objetivoSemanal,
    hechosEstaSemana: porSemana.get(semanaActual) ?? 0,
    racha: calcularRacha(semanasOrdenadas, objetivoSemanal),
    atrasados: clientes.filter((c) => c.estado === "activo" && c.semaforo === "rojo").length,
    agenda: agendaDelDia(paraAgenda, frecuencias, 5),
  };
}

/**
 * Registro de un clic desde la agenda: sin resumen, para que anotar el contacto
 * cueste menos que no anotarlo. El resumen se puede sumar después desde la ficha.
 */
export async function registrarContactoRapido(clienteId: string, tipo: TipoContacto): Promise<void> {
  await registrarContacto({ cliente_id: clienteId, tipo, direccion: "saliente", resumen: "" });
  revalidatePath("/inicio");
}
