"use server";

import { db } from "@/lib/db/client";
import { clienteCuentasSupabase, clientes } from "@/lib/db/schema";
import { listarFlujosBonos, obtenerUltimasPosiciones } from "@/lib/supabase/queries";
import {
  calcularCobros,
  semanaDe,
  totalDeCobros,
  type CobroDetalle,
  type FlujoBono,
  type PosicionCliente,
} from "@/lib/cobros";
import { normalizarTelefono } from "@/lib/telefono";

export interface ClienteConCobros {
  clienteId: string;
  nombre: string;
  apellido: string;
  estado: string;
  telefonoOriginal: string | null;
  /** E.164 listo para WhatsApp, o null si no se pudo normalizar. */
  telefonoE164: string | null;
  motivoTelefono: string | null;
  detalles: CobroDetalle[];
  totalUsd: number;
}

export interface ResultadoCobros {
  desde: string;
  hasta: string;
  clientes: ClienteConCobros[];
  totalUsd: number;
  /** Bonos en cartera de algún cliente para los que no hay cronograma cargado. */
  tickersSinCronograma: string[];
  /** Clientes con cobros pero sin un teléfono utilizable. */
  sinTelefono: number;
}

/**
 * Quién cobra renta o amortización en la semana que contiene a `fecha`.
 * Sólo se consideran clientes con cuenta vinculada: sin vínculo no hay
 * posiciones, y por lo tanto no se puede afirmar nada sobre sus cobros.
 */
export async function obtenerCobrosSemana(fecha?: string): Promise<ResultadoCobros> {
  const hoy = fecha ?? new Date().toISOString().slice(0, 10);
  const { desde, hasta } = semanaDe(hoy);

  const [todosClientes, vinculos, flujosRaw] = await Promise.all([
    db.select().from(clientes),
    db.select().from(clienteCuentasSupabase),
    listarFlujosBonos(),
  ]);

  const accountIds = vinculos.map((v) => v.supabase_client_account_id).filter((x): x is string => !!x);
  const posicionesSupabase = await obtenerUltimasPosiciones(accountIds);

  const clientePorAccountId = new Map<string, string>();
  for (const v of vinculos) {
    if (v.supabase_client_account_id) clientePorAccountId.set(v.supabase_client_account_id, v.cliente_id);
  }

  const posiciones: PosicionCliente[] = [];
  for (const p of posicionesSupabase) {
    const clienteId = clientePorAccountId.get(p.account_id);
    if (!clienteId) continue;
    posiciones.push({ clienteId, ticker: p.ticker, nominales: Number(p.quantity), assetClass: p.asset_class });
  }

  const flujos: FlujoBono[] = flujosRaw.map((f) => ({
    ticker: f.ticker,
    fecha: f.flow_date,
    interest: Number(f.interest),
    amort: Number(f.amort),
  }));

  const { porCliente, tickersSinCronograma } = calcularCobros(posiciones, flujos, desde, hasta);

  const clientePorId = new Map(todosClientes.map((c) => [c.id, c]));
  const resultado: ClienteConCobros[] = [];

  for (const [clienteId, detalles] of porCliente) {
    const c = clientePorId.get(clienteId);
    if (!c) continue;
    const tel = normalizarTelefono(c.telefono);
    resultado.push({
      clienteId,
      nombre: c.nombre,
      apellido: c.apellido,
      estado: c.estado,
      telefonoOriginal: c.telefono,
      telefonoE164: tel.ok ? tel.e164 : null,
      motivoTelefono: tel.ok ? null : tel.motivo,
      detalles,
      totalUsd: totalDeCobros(detalles),
    });
  }

  resultado.sort((a, b) => b.totalUsd - a.totalUsd);

  return {
    desde,
    hasta,
    clientes: resultado,
    totalUsd: resultado.reduce((acc, c) => acc + c.totalUsd, 0),
    tickersSinCronograma,
    sinTelefono: resultado.filter((c) => !c.telefonoE164).length,
  };
}
