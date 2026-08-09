"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { clienteCuentasSupabase, clientes, cuentasSupabaseIgnoradas } from "@/lib/db/schema";
import { listarCuentasSupabase } from "@/lib/supabase/queries";
import { sugerirVinculo, type ClienteLocal } from "@/lib/vinculacion";

export interface CuentaParaVincular {
  supabaseAccountId: string;
  broker: string;
  accountCode: string;
  rawName: string;
  sugerencia: {
    clienteId: string | null;
    clienteNombre: string | null;
    confianza: "fuerte" | "media" | "sin_sugerencia";
    razon: string;
  };
}

export interface CuentaIgnorada {
  id: string;
  broker: string;
  accountCode: string;
  rawName: string;
  motivo: string | null;
}

export interface EstadoVinculacion {
  vinculadas: {
    id: string;
    broker: string;
    accountCode: string;
    clienteId: string;
    clienteNombre: string;
  }[];
  sinVincular: CuentaParaVincular[];
  ignoradas: CuentaIgnorada[];
  clientesDisponibles: { id: string; nombre: string; apellido: string }[];
}

export async function obtenerEstadoVinculacion(): Promise<EstadoVinculacion> {
  const [cuentasSupabase, todosClientes, vinculosExistentes, ignoradas] = await Promise.all([
    listarCuentasSupabase(),
    db.select().from(clientes),
    db.select().from(clienteCuentasSupabase),
    db.select().from(cuentasSupabaseIgnoradas),
  ]);

  const yaVinculadas = new Set(vinculosExistentes.map((v) => `${v.broker}::${v.account_code}`));
  const yaIgnoradas = new Map(ignoradas.map((i) => [`${i.broker}::${i.account_code}`, i]));
  const clienteById = new Map(todosClientes.map((c) => [c.id, c]));

  const clientesLocal: ClienteLocal[] = todosClientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    apellido: c.apellido,
    notas: c.notas,
  }));

  const vinculadas = vinculosExistentes.map((v) => {
    const c = clienteById.get(v.cliente_id);
    return {
      id: v.id,
      broker: v.broker,
      accountCode: v.account_code,
      clienteId: v.cliente_id,
      clienteNombre: c ? `${c.apellido}, ${c.nombre}` : "(cliente eliminado)",
    };
  });

  const cuentasIgnoradasConNombre: CuentaIgnorada[] = cuentasSupabase
    .filter((cuenta) => yaIgnoradas.has(`${cuenta.broker}::${cuenta.account_code}`))
    .map((cuenta) => {
      const ignorada = yaIgnoradas.get(`${cuenta.broker}::${cuenta.account_code}`)!;
      return { id: ignorada.id, broker: cuenta.broker, accountCode: cuenta.account_code, rawName: cuenta.raw_name, motivo: ignorada.motivo };
    });

  const sinVincular: CuentaParaVincular[] = cuentasSupabase
    .filter(
      (cuenta) =>
        !yaVinculadas.has(`${cuenta.broker}::${cuenta.account_code}`) &&
        !yaIgnoradas.has(`${cuenta.broker}::${cuenta.account_code}`),
    )
    .map((cuenta) => {
      const sugerencia = sugerirVinculo(cuenta, clientesLocal);
      const clienteSugerido = sugerencia.clienteId ? clienteById.get(sugerencia.clienteId) : undefined;
      return {
        supabaseAccountId: cuenta.id,
        broker: cuenta.broker,
        accountCode: cuenta.account_code,
        rawName: cuenta.raw_name,
        sugerencia: {
          clienteId: sugerencia.clienteId,
          clienteNombre: clienteSugerido ? `${clienteSugerido.apellido}, ${clienteSugerido.nombre}` : null,
          confianza: sugerencia.confianza,
          razon: sugerencia.razon,
        },
      };
    });

  return {
    vinculadas,
    sinVincular,
    ignoradas: cuentasIgnoradasConNombre,
    clientesDisponibles: todosClientes.map((c) => ({ id: c.id, nombre: c.nombre, apellido: c.apellido })),
  };
}

export async function confirmarVinculo(input: {
  clienteId: string;
  broker: string;
  accountCode: string;
  supabaseAccountId: string;
}) {
  await db.insert(clienteCuentasSupabase).values({
    cliente_id: input.clienteId,
    broker: input.broker,
    account_code: input.accountCode,
    supabase_client_account_id: input.supabaseAccountId,
  });
}

export async function quitarVinculo(vinculoId: string) {
  await db.delete(clienteCuentasSupabase).where(eq(clienteCuentasSupabase.id, vinculoId));
  revalidatePath("/vinculacion");
}

/** Deja de mostrar esta cuenta de Supabase en "sin vincular" (ej: gente que ya no es cliente). */
export async function ignorarCuentaSupabase(input: { broker: string; accountCode: string; motivo?: string }) {
  await db
    .insert(cuentasSupabaseIgnoradas)
    .values({ broker: input.broker, account_code: input.accountCode, motivo: input.motivo ?? null })
    .onConflictDoNothing({ target: [cuentasSupabaseIgnoradas.broker, cuentasSupabaseIgnoradas.account_code] });
  revalidatePath("/vinculacion");
}

export async function reactivarCuentaIgnorada(id: string) {
  await db.delete(cuentasSupabaseIgnoradas).where(eq(cuentasSupabaseIgnoradas.id, id));
  revalidatePath("/vinculacion");
}
