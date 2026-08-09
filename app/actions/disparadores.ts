"use server";

import { desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { aumSnapshots, clientes, contactos, disparadores, segmentoHistorial } from "@/lib/db/schema";
import type { SeveridadDisparador, TipoDisparador } from "@/lib/db/schema";
import { getConfigNumber } from "@/lib/config";
import { encontrarReferenciaHaceUnMes } from "@/lib/aum";
import { recalcularSegmentos } from "@/lib/clientes";
import {
  evaluarAniversario,
  evaluarContactoVencido,
  evaluarInactividadProlongada,
  evaluarPedirReferido,
  evaluarVariacionAum,
  periodoMes,
} from "@/lib/disparadores";

interface DisparadorPropuesto {
  cliente_id: string | null;
  tipo: TipoDisparador;
  periodo: string;
  severidad: SeveridadDisparador;
  titulo: string;
  detalle: string;
  accion_sugerida: string;
}

export async function regenerarDisparadores(): Promise<{ generados: number; colapsados: number }> {
  const hoy = new Date();
  const periodo = periodoMes(hoy);
  const antesDeCorrer = new Date();

  const umbralVariacion = await getConfigNumber("variacion_aum_alerta_pct");
  const diasInactividad = await getConfigNumber("dias_inactividad_alerta");
  const frecuencias = {
    A: await getConfigNumber("frecuencia_contacto_a_dias"),
    B: await getConfigNumber("frecuencia_contacto_b_dias"),
    C: await getConfigNumber("frecuencia_contacto_c_dias"),
  } as const;

  // Al día antes de generar disparadores — así "cambio_segmento" ve datos frescos.
  await recalcularSegmentos(hoy);

  const todosClientes = await db.select().from(clientes);
  const activos = todosClientes.filter((c) => c.estado === "activo");
  const propuestos: DisparadorPropuesto[] = [];

  for (const c of activos) {
    const segmentoEfectivo = c.segmento_manual ?? c.segmento;
    const frecuencia = frecuencias[segmentoEfectivo];
    const nombreCompleto = `${c.nombre} ${c.apellido}`;

    const contactosCliente = await db
      .select()
      .from(contactos)
      .where(eq(contactos.cliente_id, c.id))
      .orderBy(desc(contactos.fecha));

    const ultimoContacto = contactosCliente[0]?.fecha ?? null;
    const referenciaContacto = ultimoContacto ?? new Date(`${c.fecha_alta}T00:00:00`);
    const diasDesdeUltimoContacto = Math.max(
      0,
      Math.floor((hoy.getTime() - referenciaContacto.getTime()) / 86_400_000),
    );

    if (evaluarInactividadProlongada(diasDesdeUltimoContacto, diasInactividad)) {
      propuestos.push({
        cliente_id: c.id,
        tipo: "inactividad_prolongada",
        periodo,
        severidad: "alta",
        titulo: `${nombreCompleto}: sin contacto hace ${diasDesdeUltimoContacto} días`,
        detalle: `Último contacto hace ${diasDesdeUltimoContacto} días (umbral ${diasInactividad}).`,
        accion_sugerida: "Riesgo de baja. Contactar hoy",
      });
    } else if (evaluarContactoVencido(diasDesdeUltimoContacto, frecuencia)) {
      propuestos.push({
        cliente_id: c.id,
        tipo: "contacto_vencido",
        periodo,
        severidad: "media",
        titulo: `${nombreCompleto}: contacto vencido`,
        detalle: `Frecuencia del segmento ${segmentoEfectivo}: ${frecuencia} días. Van ${diasDesdeUltimoContacto}.`,
        accion_sugerida: "Contactar según la frecuencia comprometida",
      });
    }

    const aniversario = evaluarAniversario(c.fecha_alta, hoy);
    if (aniversario.esAniversario) {
      propuestos.push({
        cliente_id: c.id,
        tipo: "aniversario",
        periodo,
        severidad: "media",
        titulo: `${nombreCompleto} cumple ${aniversario.anios} año/s hoy`,
        detalle: `Cliente desde ${c.fecha_alta}.`,
        accion_sugerida: "Felicitar y pedir referido",
      });
    }

    const reportesEnviados = contactosCliente.filter((ct) => ct.tipo === "reporte_enviado" && ct.direccion === "saliente");
    for (const reporte of reportesEnviados) {
      if (evaluarPedirReferido(reporte.fecha, hoy)) {
        propuestos.push({
          cliente_id: c.id,
          tipo: "pedir_referido",
          periodo: reporte.id,
          severidad: "media",
          titulo: `Pedirle referido a ${nombreCompleto}`,
          detalle: `Reporte enviado el ${reporte.fecha.toISOString().slice(0, 10)}. Ya pasaron 48hs.`,
          accion_sugerida: "Momento óptimo para pedir referido",
        });
      }
    }

    const snapshotsCliente = await db
      .select({ fecha: aumSnapshots.fecha, aum_usd: aumSnapshots.aum_usd })
      .from(aumSnapshots)
      .where(eq(aumSnapshots.cliente_id, c.id));
    const referenciaAum = encontrarReferenciaHaceUnMes(snapshotsCliente);
    if (referenciaAum) {
      const actual = [...snapshotsCliente].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
      const evalVar = evaluarVariacionAum(actual.aum_usd, referenciaAum.aum_usd, umbralVariacion);
      if (evalVar.disparar && evalVar.variacionPct !== null) {
        const signo = evalVar.variacionPct >= 0 ? "subió" : "bajó";
        propuestos.push({
          cliente_id: c.id,
          tipo: "variacion_aum",
          periodo,
          severidad: "alta",
          titulo: `${nombreCompleto}: AUM ${signo} ${Math.abs(evalVar.variacionPct).toFixed(1)}% este mes`,
          detalle: `De US$ ${referenciaAum.aum_usd.toFixed(0)} a US$ ${actual.aum_usd.toFixed(0)}.`,
          accion_sugerida: "Contactar y explicar el movimiento antes de que pregunte",
        });
      }
    }
  }

  const cambiosSegmento = await db
    .select()
    .from(segmentoHistorial)
    .where(gte(segmentoHistorial.fecha, antesDeCorrer));
  const clientePorId = new Map(todosClientes.map((c) => [c.id, c]));
  for (const cambio of cambiosSegmento) {
    const cliente = clientePorId.get(cambio.cliente_id);
    propuestos.push({
      cliente_id: cambio.cliente_id,
      tipo: "cambio_segmento",
      periodo,
      severidad: "baja",
      titulo: `${cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente"}: segmento cambió de ${cambio.segmento_anterior ?? "—"} a ${cambio.segmento_nuevo}`,
      detalle: cambio.motivo ?? "",
      accion_sugerida: "Revisar si corresponde ajustar el nivel de servicio",
    });
  }

  let generados = 0;
  for (const p of propuestos) {
    const insertados = await db
      .insert(disparadores)
      .values({
        cliente_id: p.cliente_id,
        tipo: p.tipo,
        periodo: p.periodo,
        severidad: p.severidad,
        titulo: p.titulo,
        detalle: p.detalle,
        accion_sugerida: p.accion_sugerida,
      })
      .onConflictDoNothing({ target: [disparadores.cliente_id, disparadores.tipo, disparadores.periodo] })
      .returning({ id: disparadores.id });
    if (insertados.length > 0) generados++;
  }

  const colapsados = await aplicarTechoPendientes(periodo);

  revalidatePath("/inicio");
  return { generados, colapsados };
}

/** SPEC.md 5.2 — "techo de disparadores": más de 3 pendientes por cliente se colapsan en uno solo. */
async function aplicarTechoPendientes(periodo: string): Promise<number> {
  const pendientes = await db.select().from(disparadores).where(eq(disparadores.estado, "pendiente"));
  const porCliente = new Map<string, typeof pendientes>();
  for (const d of pendientes) {
    if (!d.cliente_id || d.tipo === "revision_cuenta") continue;
    const arr = porCliente.get(d.cliente_id) ?? [];
    arr.push(d);
    porCliente.set(d.cliente_id, arr);
  }

  let colapsados = 0;
  for (const [clienteId, lista] of porCliente) {
    if (lista.length <= 3) continue;
    for (const d of lista) {
      await db.update(disparadores).set({ estado: "descartado", updated_at: new Date() }).where(eq(disparadores.id, d.id));
    }
    const tipos = [...new Set(lista.map((d) => d.tipo))].join(", ");
    await db
      .insert(disparadores)
      .values({
        cliente_id: clienteId,
        tipo: "revision_cuenta",
        periodo,
        severidad: "alta",
        titulo: "Revisar cuenta",
        detalle: `Se acumularon ${lista.length} disparadores (${tipos}). Se colapsan para no saturar.`,
        accion_sugerida: "Revisar la cuenta completa",
      })
      .onConflictDoNothing({ target: [disparadores.cliente_id, disparadores.tipo, disparadores.periodo] });
    colapsados++;
  }
  return colapsados;
}

export async function marcarAtendido(id: string) {
  await db
    .update(disparadores)
    .set({ estado: "atendido", fecha_atendido: new Date(), updated_at: new Date() })
    .where(eq(disparadores.id, id));
  revalidatePath("/inicio");
}

export async function descartarDisparador(id: string) {
  await db.update(disparadores).set({ estado: "descartado", updated_at: new Date() }).where(eq(disparadores.id, id));
  revalidatePath("/inicio");
}

export async function crearEventoMacro(input: {
  titulo: string;
  detalle: string;
  accionSugerida: string;
  severidad: SeveridadDisparador;
}) {
  if (!input.titulo.trim()) throw new Error("El título es obligatorio.");
  await db.insert(disparadores).values({
    cliente_id: null,
    tipo: "evento_macro",
    periodo: new Date().toISOString(),
    severidad: input.severidad,
    titulo: input.titulo.trim(),
    detalle: input.detalle.trim(),
    accion_sugerida: input.accionSugerida.trim() || "Enviar comunicación a la base",
  });
  revalidatePath("/inicio");
}

export interface DisparadorConCliente {
  id: string;
  tipo: TipoDisparador;
  severidad: SeveridadDisparador;
  titulo: string;
  detalle: string;
  accionSugerida: string;
  fechaGenerado: string;
  cliente: { id: string; nombre: string; apellido: string; telefono: string | null; fechaAlta: string } | null;
}

const ORDEN_SEVERIDAD: Record<SeveridadDisparador, number> = { alta: 0, media: 1, baja: 2 };

export async function obtenerDisparadoresPendientes(): Promise<DisparadorConCliente[]> {
  const pendientes = await db.select().from(disparadores).where(eq(disparadores.estado, "pendiente"));
  const todosClientes = await db.select().from(clientes);
  const clientesMap = new Map(todosClientes.map((c) => [c.id, c]));

  return pendientes
    .map((d) => {
      const cliente = d.cliente_id ? clientesMap.get(d.cliente_id) : undefined;
      return {
        id: d.id,
        tipo: d.tipo,
        severidad: d.severidad,
        titulo: d.titulo,
        detalle: d.detalle,
        accionSugerida: d.accion_sugerida,
        fechaGenerado: d.fecha_generado.toISOString(),
        cliente: cliente
          ? { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, telefono: cliente.telefono, fechaAlta: cliente.fecha_alta }
          : null,
      };
    })
    .sort(
      (a, b) =>
        ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad] ||
        new Date(b.fechaGenerado).getTime() - new Date(a.fechaGenerado).getTime(),
    );
}
