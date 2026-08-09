"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { clientes, pedidosReferido } from "@/lib/db/schema";
import type { CanalReferido, DioNombre, DisparadorUsadoReferido, ResultadoReferido } from "@/lib/db/schema";
import { dividirSeguro } from "@/lib/format";

export interface PedidoReferidoConCliente {
  id: string;
  fecha: string;
  disparadorUsado: DisparadorUsadoReferido;
  canal: CanalReferido;
  dioNombre: DioNombre;
  resultado: ResultadoReferido;
  cliente: { id: string; nombre: string; apellido: string };
}

export async function listarPedidosReferido(): Promise<PedidoReferidoConCliente[]> {
  const pedidos = await db.select().from(pedidosReferido).orderBy(desc(pedidosReferido.fecha));
  const todosClientes = await db.select().from(clientes);
  const clientesMap = new Map(todosClientes.map((c) => [c.id, c]));
  return pedidos.map((p) => {
    const c = clientesMap.get(p.cliente_id);
    return {
      id: p.id,
      fecha: p.fecha,
      disparadorUsado: p.disparador_usado,
      canal: p.canal,
      dioNombre: p.dio_nombre,
      resultado: p.resultado,
      cliente: c ? { id: c.id, nombre: c.nombre, apellido: c.apellido } : { id: p.cliente_id, nombre: "(eliminado)", apellido: "" },
    };
  });
}

export async function crearPedidoReferido(input: {
  clienteId: string;
  disparadorUsado: DisparadorUsadoReferido;
  canal: CanalReferido;
}) {
  await db.insert(pedidosReferido).values({
    cliente_id: input.clienteId,
    fecha: new Date().toISOString().slice(0, 10),
    disparador_usado: input.disparadorUsado,
    canal: input.canal,
    dio_nombre: "pendiente",
    resultado: "sin_contacto",
  });
  revalidatePath("/referidos");
  revalidatePath(`/clientes/${input.clienteId}`);
}

export async function actualizarPedidoReferido(id: string, patch: { dioNombre?: DioNombre; resultado?: ResultadoReferido }) {
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (patch.dioNombre) set.dio_nombre = patch.dioNombre;
  if (patch.resultado) set.resultado = patch.resultado;
  await db.update(pedidosReferido).set(set).where(eq(pedidosReferido.id, id));
  revalidatePath("/referidos");
}

export interface MetricasReferidos {
  pedidos: number;
  nombresObtenidos: number;
  tasaConversionPedido: number | null;
  clientesCerrados: number;
}

export async function obtenerMetricasReferidos(): Promise<MetricasReferidos> {
  const pedidos = await db.select().from(pedidosReferido);
  const nombresObtenidos = pedidos.filter((p) => p.dio_nombre === "si").length;
  const clientesCerrados = pedidos.filter((p) => p.resultado === "cliente").length;
  return {
    pedidos: pedidos.length,
    nombresObtenidos,
    tasaConversionPedido: dividirSeguro(nombresObtenidos, pedidos.length),
    clientesCerrados,
  };
}

export interface MejorReferidor {
  id: string;
  nombre: string;
  apellido: string;
  cantidadReferidos: number;
}

export async function obtenerMejoresReferidores(): Promise<MejorReferidor[]> {
  const todos = await db.select().from(clientes);
  const conteo = new Map<string, number>();
  for (const c of todos) {
    if (!c.referido_por_cliente_id) continue;
    conteo.set(c.referido_por_cliente_id, (conteo.get(c.referido_por_cliente_id) ?? 0) + 1);
  }
  const clienteById = new Map(todos.map((c) => [c.id, c]));
  return [...conteo.entries()]
    .map(([id, cantidadReferidos]) => {
      const c = clienteById.get(id);
      return c ? { id: c.id, nombre: c.nombre, apellido: c.apellido, cantidadReferidos } : null;
    })
    .filter((x): x is MejorReferidor => x !== null)
    .sort((a, b) => b.cantidadReferidos - a.cantidadReferidos)
    .slice(0, 10);
}
