"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { clientes, metricasSemanales, prospectoEtapaHistorial, prospectos } from "@/lib/db/schema";
import { getConfigNumber } from "@/lib/config";
import { calcularTasasDerivadas, type MetricasSemanaCalculadas, type TasasDerivadas } from "@/lib/metricas";
import { calcularModeloEconomico, type ResultadoModeloEconomico } from "@/lib/modelo-economico";

const TOTAL_SEMANAS = 13;

async function sembrarSemanas() {
  const existentes = await db.select({ semana: metricasSemanales.semana }).from(metricasSemanales);
  if (existentes.length >= TOTAL_SEMANAS) return;

  const yaExiste = new Set(existentes.map((e) => e.semana));
  const inicio = new Date();
  for (let semana = 1; semana <= TOTAL_SEMANAS; semana++) {
    if (yaExiste.has(semana)) continue;
    const desde = new Date(inicio);
    desde.setDate(desde.getDate() + (semana - 1) * 7);
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 6);
    await db
      .insert(metricasSemanales)
      .values({
        semana,
        fecha_desde: desde.toISOString().slice(0, 10),
        fecha_hasta: hasta.toISOString().slice(0, 10),
        inversion_publicitaria_usd: 0,
      })
      .onConflictDoNothing({ target: metricasSemanales.semana });
  }
}

export interface MetricaSemanaCompleta extends MetricasSemanaCalculadas {
  semana: number;
  fechaDesde: string;
  fechaHasta: string;
  alcancePerfilObjetivo: number | null;
  visitasPerfil: number | null;
  tasas: TasasDerivadas;
}

export async function obtenerMetricasSemanales(): Promise<MetricaSemanaCompleta[]> {
  await sembrarSemanas();
  const semanas = await db.select().from(metricasSemanales).orderBy(metricasSemanales.semana);

  return Promise.all(
    semanas.map(async (s) => {
      const desdeDate = new Date(`${s.fecha_desde}T00:00:00`);
      const hastaDate = new Date(`${s.fecha_hasta}T23:59:59`);

      const prospectosDelRango = await db
        .select()
        .from(prospectos)
        .where(and(gte(prospectos.fecha_ingreso, s.fecha_desde), lte(prospectos.fecha_ingreso, s.fecha_hasta)));
      const leadsCaptados = prospectosDelRango.length;
      const leadsCalificados = prospectosDelRango.filter((p) => p.calificado).length;

      const historialDelRango = await db
        .select()
        .from(prospectoEtapaHistorial)
        .where(and(gte(prospectoEtapaHistorial.fecha, desdeDate), lte(prospectoEtapaHistorial.fecha, hastaDate)));
      const llamadasAgendadas = new Set(
        historialDelRango.filter((h) => h.etapa === "llamada_agendada").map((h) => h.prospecto_id),
      ).size;
      const llamadasRealizadas = new Set(
        historialDelRango.filter((h) => h.etapa === "llamada_realizada").map((h) => h.prospecto_id),
      ).size;

      const clientesNuevos = (
        await db
          .select()
          .from(clientes)
          .where(and(gte(clientes.fecha_alta, s.fecha_desde), lte(clientes.fecha_alta, s.fecha_hasta)))
      ).length;

      const calculadas: MetricasSemanaCalculadas = {
        leadsCaptados,
        leadsCalificados,
        llamadasAgendadas,
        llamadasRealizadas,
        clientesNuevos,
        inversionPublicitariaUsd: s.inversion_publicitaria_usd,
      };

      return {
        semana: s.semana,
        fechaDesde: s.fecha_desde,
        fechaHasta: s.fecha_hasta,
        alcancePerfilObjetivo: s.alcance_perfil_objetivo,
        visitasPerfil: s.visitas_perfil,
        ...calculadas,
        tasas: calcularTasasDerivadas(calculadas),
      };
    }),
  );
}

export async function actualizarMetricaSemanal(
  semana: number,
  patch: Partial<{
    fecha_desde: string;
    fecha_hasta: string;
    alcance_perfil_objetivo: number | null;
    visitas_perfil: number | null;
    inversion_publicitaria_usd: number;
  }>,
) {
  await db
    .update(metricasSemanales)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(metricasSemanales.semana, semana));
  revalidatePath("/metricas");
}

export async function obtenerModeloEconomicoAction(): Promise<ResultadoModeloEconomico> {
  const activos = await db.select().from(clientes).where(eq(clientes.estado, "activo"));
  const aumPromedio = activos.length > 0 ? activos.reduce((acc, c) => acc + c.aum_actual_usd, 0) / activos.length : 0;

  const hoy = new Date();
  const corte12m = new Date(hoy);
  corte12m.setFullYear(corte12m.getFullYear() - 1);
  const corte12mISO = corte12m.toISOString().slice(0, 10);

  const todos = await db.select().from(clientes);
  const candidatosHaceUnAnio = todos.filter(
    (c) => c.fecha_alta <= corte12mISO && (!c.fecha_baja || c.fecha_baja > corte12mISO),
  );
  const siguenActivos = candidatosHaceUnAnio.filter((c) => c.estado === "activo");
  const retencionRealPct = candidatosHaceUnAnio.length > 0 ? (siguenActivos.length / candidatosHaceUnAnio.length) * 100 : null;

  const semanas = await db.select().from(metricasSemanales);
  const inversionPublicitariaTotalUsd = semanas.reduce((acc, s) => acc + s.inversion_publicitaria_usd, 0);

  let clientesNuevosPeriodo = 0;
  if (semanas.length > 0) {
    const desdeMin = semanas.map((s) => s.fecha_desde).sort()[0];
    const hastaMax = semanas.map((s) => s.fecha_hasta).sort().at(-1)!;
    clientesNuevosPeriodo = todos.filter((c) => c.fecha_alta >= desdeMin && c.fecha_alta <= hastaMax).length;
  }

  return calcularModeloEconomico({
    aumPromedio,
    feeAnualPct: await getConfigNumber("fee_anual_pct"),
    retencionAnualSupuestoPct: await getConfigNumber("retencion_anual_pct"),
    retencionRealPct,
    multiploLtvCac: await getConfigNumber("multiplo_ltv_cac"),
    inversionPublicitariaTotalUsd,
    clientesNuevosPeriodo,
  });
}
