import { getSupabaseSql } from "./client";

export interface ClientAccountSupabase {
  id: string;
  broker: string;
  account_code: string;
  raw_name: string;
}

export interface PositionSupabase {
  account_id: string;
  ticker: string;
  quantity: number;
  snapshot_value: number | null;
  snapshot_ccy: string | null;
  asof: string | null;
  asset_class: string | null;
  currency: string | null;
}

export async function probarConexionSupabase(): Promise<{ ok: boolean; error?: string; latenciaMs?: number }> {
  const sql = getSupabaseSql();
  const inicio = Date.now();
  try {
    await sql`select 1`;
    return { ok: true, latenciaMs: Date.now() - inicio };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function listarCuentasSupabase(): Promise<ClientAccountSupabase[]> {
  const sql = getSupabaseSql();
  const rows = await sql<ClientAccountSupabase[]>`
    select id, broker, account_code, raw_name
    from client_accounts
    order by broker, account_code
  `;
  return rows;
}

/** Últimas posiciones (por cuenta) de la lista de account_ids dada, con clase de activo y moneda. */
export async function obtenerUltimasPosiciones(accountIds: string[]): Promise<PositionSupabase[]> {
  if (accountIds.length === 0) return [];
  const sql = getSupabaseSql();
  const rows = await sql<PositionSupabase[]>`
    select p.account_id, p.ticker, p.quantity, p.snapshot_value, p.snapshot_ccy, p.asof,
           a.asset_class, a.currency
    from positions p
    left join assets a on a.ticker = p.ticker
    where p.account_id = any(${accountIds}::uuid[])
      and p.asof = (select max(p2.asof) from positions p2 where p2.account_id = p.account_id)
  `;
  return rows;
}
