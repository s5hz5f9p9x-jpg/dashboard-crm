"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { aumSnapshots, clienteCuentasSupabase, clientes, configuracion, tipoCambioHistorial } from "@/lib/db/schema";
import { obtenerMep } from "@/lib/mep";
import { calcularAumUsd } from "@/lib/aum";
import { obtenerUltimasPosiciones, probarConexionSupabase, type PositionSupabase } from "@/lib/supabase/queries";
import { recalcularSegmentos } from "@/lib/clientes";

export interface ResultadoSincronizacion {
  fecha: string;
  mepArsUsd: number;
  mepTicker: string;
  clientesActualizados: number;
  clientesSinVincular: number;
  segmentosCambiados: number;
}

const CLAVE_ULTIMA_SYNC = "ultima_sincronizacion_aum";

export async function probarConexion() {
  return probarConexionSupabase();
}

export async function obtenerUltimaSincronizacion(): Promise<string | null> {
  const [row] = await db.select().from(configuracion).where(eq(configuracion.clave, CLAVE_ULTIMA_SYNC));
  return row?.valor ?? null;
}

export async function sincronizarAum(): Promise<ResultadoSincronizacion> {
  const mep = await obtenerMep();
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const fuenteMep = `data912.com/live/mep (${mep.ticker})`;

  await db
    .insert(tipoCambioHistorial)
    .values({ fecha: fechaHoy, mep_ars_usd: mep.mepArsUsd, fuente: fuenteMep })
    .onConflictDoUpdate({
      target: tipoCambioHistorial.fecha,
      set: { mep_ars_usd: mep.mepArsUsd, fuente: fuenteMep },
    });

  const vinculos = await db.select().from(clienteCuentasSupabase);
  const clienteIdsConVinculo = [...new Set(vinculos.map((v) => v.cliente_id))];
  const todosLosClientes = await db.select({ id: clientes.id }).from(clientes);
  const totalClientes = todosLosClientes.length;

  if (clienteIdsConVinculo.length === 0) {
    return {
      fecha: fechaHoy,
      mepArsUsd: mep.mepArsUsd,
      mepTicker: mep.ticker,
      clientesActualizados: 0,
      clientesSinVincular: totalClientes,
      segmentosCambiados: 0,
    };
  }

  const accountIds = vinculos
    .map((v) => v.supabase_client_account_id)
    .filter((x): x is string => !!x);
  const posiciones = await obtenerUltimasPosiciones(accountIds);

  const posicionesPorAccountId = new Map<string, PositionSupabase[]>();
  for (const p of posiciones) {
    const arr = posicionesPorAccountId.get(p.account_id) ?? [];
    arr.push(p);
    posicionesPorAccountId.set(p.account_id, arr);
  }

  const vinculosPorCliente = new Map<string, typeof vinculos>();
  for (const v of vinculos) {
    const arr = vinculosPorCliente.get(v.cliente_id) ?? [];
    arr.push(v);
    vinculosPorCliente.set(v.cliente_id, arr);
  }

  let clientesActualizados = 0;

  await db.transaction(async (tx) => {
    for (const clienteId of clienteIdsConVinculo) {
      const vinculosCliente = vinculosPorCliente.get(clienteId) ?? [];
      const posicionesCliente = vinculosCliente.flatMap((v) =>
        v.supabase_client_account_id ? (posicionesPorAccountId.get(v.supabase_client_account_id) ?? []) : [],
      );

      const { aumUsd, composicion } = calcularAumUsd(
        posicionesCliente.map((p) => ({
          snapshot_value: p.snapshot_value === null ? null : Number(p.snapshot_value),
          snapshot_ccy: p.snapshot_ccy,
          asset_class: p.asset_class,
          ticker: p.ticker,
        })),
        mep.mepArsUsd,
      );

      await tx
        .insert(aumSnapshots)
        .values({ cliente_id: clienteId, fecha: fechaHoy, aum_usd: aumUsd, composicion, fuente: "supabase" })
        .onConflictDoUpdate({
          target: [aumSnapshots.cliente_id, aumSnapshots.fecha],
          set: { aum_usd: aumUsd, composicion, fuente: "supabase", updated_at: new Date() },
        });

      await tx
        .update(clientes)
        .set({ aum_actual_usd: aumUsd, aum_actualizado_at: new Date(), updated_at: new Date() })
        .where(eq(clientes.id, clienteId));

      clientesActualizados++;
    }

    const ahoraISO = new Date().toISOString();
    await tx
      .insert(configuracion)
      .values({ clave: CLAVE_ULTIMA_SYNC, valor: ahoraISO, descripcion: "Fecha y hora de la última sincronización exitosa de AUM." })
      .onConflictDoUpdate({ target: configuracion.clave, set: { valor: ahoraISO, updated_at: new Date() } });
  });

  const { cambios: segmentosCambiados } = await recalcularSegmentos();

  revalidatePath("/clientes");
  revalidatePath("/inicio");
  revalidatePath("/sincronizacion");

  return {
    fecha: fechaHoy,
    mepArsUsd: mep.mepArsUsd,
    mepTicker: mep.ticker,
    clientesActualizados,
    clientesSinVincular: totalClientes - clienteIdsConVinculo.length,
    segmentosCambiados,
  };
}
