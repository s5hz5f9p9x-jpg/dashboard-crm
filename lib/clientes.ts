import { and, desc, eq, max } from "drizzle-orm";
import { db } from "./db/client";
import { aumSnapshots, clientes, contactos, disparadores, segmentoHistorial } from "./db/schema";
import type { Segmento } from "./db/schema";
import { calcularSegmento, type SnapshotAum } from "./segmentacion";
import { calcularSemaforo, type Semaforo } from "./semaforo";
import { getConfigNumber } from "./config";

export interface ClienteConEstado {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fecha_alta: string;
  nivel_servicio: string;
  segmento: Segmento;
  segmento_manual: Segmento | null;
  aum_actual_usd: number;
  estado: string;
  semaforo: Semaforo;
  diasDesdeUltimoContacto: number;
}

async function frecuenciaPorSegmento(segmento: Segmento): Promise<number> {
  if (segmento === "A") return getConfigNumber("frecuencia_contacto_a_dias");
  if (segmento === "B") return getConfigNumber("frecuencia_contacto_b_dias");
  return getConfigNumber("frecuencia_contacto_c_dias");
}

function diasEntre(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function listarClientes(): Promise<ClienteConEstado[]> {
  const todos = await db.select().from(clientes);

  const ultimosContactos = await db
    .select({ cliente_id: contactos.cliente_id, ultima: max(contactos.fecha) })
    .from(contactos)
    .groupBy(contactos.cliente_id);
  const mapaUltimoContacto = new Map(ultimosContactos.map((c) => [c.cliente_id, c.ultima]));

  const hoy = new Date();

  return Promise.all(
    todos.map(async (c) => {
      const segmentoEfectivo = c.segmento_manual ?? c.segmento;
      const ultimoContacto = mapaUltimoContacto.get(c.id);
      const referencia = ultimoContacto ? new Date(ultimoContacto) : new Date(`${c.fecha_alta}T00:00:00`);
      const diasDesdeUltimoContacto = Math.max(0, diasEntre(hoy, referencia));
      const frecuencia = await frecuenciaPorSegmento(segmentoEfectivo);

      return {
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        email: c.email,
        telefono: c.telefono,
        fecha_alta: c.fecha_alta,
        nivel_servicio: c.nivel_servicio,
        segmento: c.segmento,
        segmento_manual: c.segmento_manual,
        aum_actual_usd: c.aum_actual_usd,
        estado: c.estado,
        semaforo: c.estado === "activo" ? calcularSemaforo(diasDesdeUltimoContacto, frecuencia) : ("rojo" as Semaforo),
        diasDesdeUltimoContacto,
      };
    }),
  );
}

export async function obtenerFichaCliente(id: string) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
  if (!cliente) return null;

  const historialContactos = await db
    .select()
    .from(contactos)
    .where(eq(contactos.cliente_id, id))
    .orderBy(desc(contactos.fecha));

  const snapshots = await db
    .select()
    .from(aumSnapshots)
    .where(eq(aumSnapshots.cliente_id, id))
    .orderBy(desc(aumSnapshots.fecha));

  const historialSegmento = await db
    .select()
    .from(segmentoHistorial)
    .where(eq(segmentoHistorial.cliente_id, id))
    .orderBy(desc(segmentoHistorial.fecha));

  const referidos = await db.select().from(clientes).where(eq(clientes.referido_por_cliente_id, id));

  const disparadoresActivos = await db
    .select()
    .from(disparadores)
    .where(and(eq(disparadores.cliente_id, id), eq(disparadores.estado, "pendiente")))
    .orderBy(desc(disparadores.fecha_generado));

  return { cliente, contactos: historialContactos, snapshots, historialSegmento, referidos, disparadores: disparadoresActivos };
}

/**
 * Recalcula el segmento *automático* de todos los clientes y registra los cambios
 * en segmento_historial. El override manual (segmento_manual) no se toca acá —
 * sigue ganando en toda la UI (ver listarClientes), pero el valor calculado de
 * fondo se mantiene al día por si el override se saca más adelante.
 */
export async function recalcularSegmentos(hoy = new Date()): Promise<{ cambios: number; total: number }> {
  const todos = await db.select().from(clientes);
  const umbralA = await getConfigNumber("umbral_segmento_a_usd");
  const umbralB = await getConfigNumber("umbral_segmento_b_usd");
  const diasGracia = await getConfigNumber("dias_gracia_cliente_nuevo");

  let cambios = 0;

  for (const c of todos) {
    const snapshots: SnapshotAum[] = await db
      .select({ fecha: aumSnapshots.fecha, aum_usd: aumSnapshots.aum_usd })
      .from(aumSnapshots)
      .where(eq(aumSnapshots.cliente_id, c.id));

    const resultado = calcularSegmento({
      estado: c.estado,
      fechaAlta: c.fecha_alta,
      hoy,
      segmentoManual: null,
      segmentoManualMotivo: null,
      segmentoActual: c.segmento,
      snapshots,
      umbralSegmentoA: umbralA,
      umbralSegmentoB: umbralB,
      diasGraciaClienteNuevo: diasGracia,
    });

    if (resultado.segmento !== c.segmento) {
      await db.update(clientes).set({ segmento: resultado.segmento, updated_at: new Date() }).where(eq(clientes.id, c.id));
      await db.insert(segmentoHistorial).values({
        cliente_id: c.id,
        segmento_anterior: c.segmento,
        segmento_nuevo: resultado.segmento,
        motivo: resultado.motivo,
      });
      cambios++;
    }
  }

  return { cambios, total: todos.length };
}
