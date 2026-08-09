import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  aumSnapshots,
  clienteCuentasSupabase,
  clientes,
  configuracion,
  contactos,
  cuentasSupabaseIgnoradas,
  diagnosticos,
  disparadores,
  ideasContenido,
  metricasSemanales,
  pedidosReferido,
  prospectoEtapaHistorial,
  prospectos,
  segmentoHistorial,
  tareasPlan,
  tipoCambioHistorial,
} from "@/lib/db/schema";

const BUCKET = "crm-backups";
const MAX_BACKUPS = 30;

const TABLAS = {
  clientes,
  cliente_cuentas_supabase: clienteCuentasSupabase,
  aum_snapshots: aumSnapshots,
  contactos,
  segmento_historial: segmentoHistorial,
  configuracion,
  tipo_cambio_historial: tipoCambioHistorial,
  disparadores,
  cuentas_supabase_ignoradas: cuentasSupabaseIgnoradas,
  prospectos,
  prospecto_etapa_historial: prospectoEtapaHistorial,
  pedidos_referido: pedidosReferido,
  metricas_semanales: metricasSemanales,
  ideas_contenido: ideasContenido,
  diagnosticos,
  tareas_plan: tareasPlan,
} as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Backup diario del CRM — dispara vía Vercel Cron (ver vercel.json). Supabase
 * Free no incluye backups automáticos, así que esto vuelca las 16 tablas del
 * schema `crm` a un JSON y lo sube a Storage. Conserva los últimos 30.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const dump: Record<string, unknown[]> = {};
  for (const [nombre, tabla] of Object.entries(TABLAS)) {
    dump[nombre] = await db.select().from(tabla);
  }

  const supabase = getSupabaseAdmin();
  const ahora = new Date();
  const nombreArchivo = `crm-${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}.json`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, JSON.stringify(dump), { contentType: "application/json" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: archivos, error: listError } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

  let borrados = 0;
  if (!listError && archivos) {
    const sobrantes = archivos.length - MAX_BACKUPS;
    if (sobrantes > 0) {
      const aBorrar = archivos.slice(0, sobrantes).map((f) => f.name);
      await supabase.storage.from(BUCKET).remove(aBorrar);
      borrados = aBorrar.length;
    }
  }

  return NextResponse.json({
    ok: true,
    archivo: nombreArchivo,
    tablas: Object.keys(dump).length,
    filas: Object.values(dump).reduce((acc, rows) => acc + rows.length, 0),
    borrados,
  });
}
