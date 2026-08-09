import Database from "better-sqlite3";
import { db, client } from "../lib/db/client";
import * as schema from "../lib/db/schema";

const SQLITE_PATH = "data/crm.db";

const sqlite = new Database(SQLITE_PATH, { readonly: true });

function ts(v: number | null): Date | null {
  return v === null || v === undefined ? null : new Date(v * 1000);
}
function bool(v: number | null): boolean {
  return !!v;
}
function json(v: string | null): unknown {
  return v === null || v === undefined ? null : JSON.parse(v);
}

async function main() {
  console.log("Limpiando el schema crm en Postgres...");
  await client`
    truncate table
      crm.pedidos_referido, crm.diagnosticos, crm.prospecto_etapa_historial,
      crm.ideas_contenido, crm.disparadores, crm.prospectos,
      crm.segmento_historial, crm.contactos, crm.aum_snapshots,
      crm.cliente_cuentas_supabase, crm.tareas_plan, crm.metricas_semanales,
      crm.cuentas_supabase_ignoradas, crm.tipo_cambio_historial,
      crm.configuracion, crm.clientes
    restart identity cascade
  `;

  const clientes = sqlite.prepare("select * from clientes").all() as Record<string, unknown>[];
  await db.insert(schema.clientes).values(
    clientes.map((c) => ({
      id: c.id as string,
      nombre: c.nombre as string,
      apellido: c.apellido as string,
      email: c.email as string | null,
      telefono: c.telefono as string | null,
      fecha_alta: c.fecha_alta as string,
      nivel_servicio: c.nivel_servicio as schema.NivelServicio,
      segmento: c.segmento as schema.Segmento,
      segmento_manual: c.segmento_manual as schema.Segmento | null,
      segmento_manual_motivo: c.segmento_manual_motivo as string | null,
      aum_actual_usd: c.aum_actual_usd as number,
      aum_actualizado_at: ts(c.aum_actualizado_at as number | null),
      perfil_riesgo: c.perfil_riesgo as schema.PerfilRiesgo | null,
      estado: c.estado as schema.EstadoCliente,
      fecha_baja: c.fecha_baja as string | null,
      motivo_baja: c.motivo_baja as string | null,
      origen: c.origen as string | null,
      referido_por_cliente_id: c.referido_por_cliente_id as string | null,
      notas: c.notas as string,
      created_at: ts(c.created_at as number)!,
      updated_at: ts(c.updated_at as number)!,
    })),
  );
  console.log(`clientes: ${clientes.length}`);

  const configuracion = sqlite.prepare("select * from configuracion").all() as Record<string, unknown>[];
  await db.insert(schema.configuracion).values(
    configuracion.map((c) => ({
      clave: c.clave as string,
      valor: c.valor as string,
      descripcion: c.descripcion as string | null,
      updated_at: ts(c.updated_at as number)!,
    })),
  );
  console.log(`configuracion: ${configuracion.length}`);

  const tipoCambio = sqlite.prepare("select * from tipo_cambio_historial").all() as Record<string, unknown>[];
  if (tipoCambio.length > 0) {
    await db.insert(schema.tipoCambioHistorial).values(
      tipoCambio.map((t) => ({
        id: t.id as string,
        fecha: t.fecha as string,
        mep_ars_usd: t.mep_ars_usd as number,
        fuente: t.fuente as string,
        created_at: ts(t.created_at as number)!,
      })),
    );
  }
  console.log(`tipo_cambio_historial: ${tipoCambio.length}`);

  const ignoradas = sqlite.prepare("select * from cuentas_supabase_ignoradas").all() as Record<string, unknown>[];
  if (ignoradas.length > 0) {
    await db.insert(schema.cuentasSupabaseIgnoradas).values(
      ignoradas.map((i) => ({
        id: i.id as string,
        broker: i.broker as string,
        account_code: i.account_code as string,
        motivo: i.motivo as string | null,
        created_at: ts(i.created_at as number)!,
      })),
    );
  }
  console.log(`cuentas_supabase_ignoradas: ${ignoradas.length}`);

  const metricas = sqlite.prepare("select * from metricas_semanales").all() as Record<string, unknown>[];
  if (metricas.length > 0) {
    await db.insert(schema.metricasSemanales).values(
      metricas.map((m) => ({
        id: m.id as string,
        semana: m.semana as number,
        fecha_desde: m.fecha_desde as string,
        fecha_hasta: m.fecha_hasta as string,
        alcance_perfil_objetivo: m.alcance_perfil_objetivo as number | null,
        visitas_perfil: m.visitas_perfil as number | null,
        inversion_publicitaria_usd: m.inversion_publicitaria_usd as number,
        created_at: ts(m.created_at as number)!,
        updated_at: ts(m.updated_at as number)!,
      })),
    );
  }
  console.log(`metricas_semanales: ${metricas.length}`);

  const tareas = sqlite.prepare("select * from tareas_plan").all() as Record<string, unknown>[];
  if (tareas.length > 0) {
    await db.insert(schema.tareasPlan).values(
      tareas.map((t) => ({
        id: t.id as string,
        semana: t.semana as number,
        fase: t.fase as schema.FasePlan,
        tarea: t.tarea as string,
        categoria: t.categoria as string | null,
        tiempo_estimado: t.tiempo_estimado as string | null,
        entregable: t.entregable as string | null,
        estado: t.estado as schema.EstadoTarea,
        es_condicion_salida: bool(t.es_condicion_salida as number),
        fecha_completada: t.fecha_completada as string | null,
        created_at: ts(t.created_at as number)!,
        updated_at: ts(t.updated_at as number)!,
      })),
    );
  }
  console.log(`tareas_plan: ${tareas.length}`);

  const cuentas = sqlite.prepare("select * from cliente_cuentas_supabase").all() as Record<string, unknown>[];
  if (cuentas.length > 0) {
    await db.insert(schema.clienteCuentasSupabase).values(
      cuentas.map((c) => ({
        id: c.id as string,
        cliente_id: c.cliente_id as string,
        broker: c.broker as string,
        account_code: c.account_code as string,
        supabase_client_account_id: c.supabase_client_account_id as string | null,
        created_at: ts(c.created_at as number)!,
      })),
    );
  }
  console.log(`cliente_cuentas_supabase: ${cuentas.length}`);

  const snapshots = sqlite.prepare("select * from aum_snapshots").all() as Record<string, unknown>[];
  if (snapshots.length > 0) {
    await db.insert(schema.aumSnapshots).values(
      snapshots.map((s) => ({
        id: s.id as string,
        cliente_id: s.cliente_id as string,
        fecha: s.fecha as string,
        aum_usd: s.aum_usd as number,
        composicion: json(s.composicion as string | null) as never,
        fuente: s.fuente as schema.FuenteAum,
        created_at: ts(s.created_at as number)!,
        updated_at: ts(s.updated_at as number)!,
      })),
    );
  }
  console.log(`aum_snapshots: ${snapshots.length}`);

  const contactos = sqlite.prepare("select * from contactos").all() as Record<string, unknown>[];
  if (contactos.length > 0) {
    await db.insert(schema.contactos).values(
      contactos.map((c) => ({
        id: c.id as string,
        cliente_id: c.cliente_id as string,
        fecha: ts(c.fecha as number)!,
        tipo: c.tipo as schema.TipoContacto,
        direccion: c.direccion as schema.DireccionContacto,
        resumen: c.resumen as string,
        disparador_id: c.disparador_id as string | null,
        created_at: ts(c.created_at as number)!,
        updated_at: ts(c.updated_at as number)!,
      })),
    );
  }
  console.log(`contactos: ${contactos.length}`);

  const segHist = sqlite.prepare("select * from segmento_historial").all() as Record<string, unknown>[];
  if (segHist.length > 0) {
    await db.insert(schema.segmentoHistorial).values(
      segHist.map((s) => ({
        id: s.id as string,
        cliente_id: s.cliente_id as string,
        segmento_anterior: s.segmento_anterior as schema.Segmento | null,
        segmento_nuevo: s.segmento_nuevo as schema.Segmento,
        fecha: ts(s.fecha as number)!,
        motivo: s.motivo as string | null,
        created_at: ts(s.created_at as number)!,
      })),
    );
  }
  console.log(`segmento_historial: ${segHist.length}`);

  const prospectos = sqlite.prepare("select * from prospectos").all() as Record<string, unknown>[];
  if (prospectos.length > 0) {
    await db.insert(schema.prospectos).values(
      prospectos.map((p) => ({
        id: p.id as string,
        nombre: p.nombre as string,
        email: p.email as string | null,
        telefono: p.telefono as string | null,
        etapa: p.etapa as schema.EtapaProspecto,
        origen: p.origen as schema.OrigenProspecto,
        origen_detalle: p.origen_detalle as string | null,
        utm_source: p.utm_source as string | null,
        utm_campaign: p.utm_campaign as string | null,
        patrimonio_declarado: p.patrimonio_declarado as schema.PatrimonioDeclarado | null,
        antiguedad_invirtiendo: p.antiguedad_invirtiendo as string | null,
        objetivo: p.objetivo as string | null,
        calificado: bool(p.calificado as number),
        motivo_descalificacion: p.motivo_descalificacion as string | null,
        fecha_ingreso: p.fecha_ingreso as string,
        fecha_cierre: p.fecha_cierre as string | null,
        motivo_perdida: p.motivo_perdida as string | null,
        cliente_id: p.cliente_id as string | null,
        notas: p.notas as string,
        created_at: ts(p.created_at as number)!,
        updated_at: ts(p.updated_at as number)!,
      })),
    );
  }
  console.log(`prospectos: ${prospectos.length}`);

  const disparadores = sqlite.prepare("select * from disparadores").all() as Record<string, unknown>[];
  if (disparadores.length > 0) {
    await db.insert(schema.disparadores).values(
      disparadores.map((d) => ({
        id: d.id as string,
        cliente_id: d.cliente_id as string | null,
        tipo: d.tipo as schema.TipoDisparador,
        periodo: d.periodo as string,
        severidad: d.severidad as schema.SeveridadDisparador,
        titulo: d.titulo as string,
        detalle: d.detalle as string,
        accion_sugerida: d.accion_sugerida as string,
        estado: d.estado as schema.EstadoDisparador,
        fecha_generado: ts(d.fecha_generado as number)!,
        fecha_atendido: ts(d.fecha_atendido as number | null),
        vence_at: ts(d.vence_at as number | null),
        created_at: ts(d.created_at as number)!,
        updated_at: ts(d.updated_at as number)!,
      })),
    );
  }
  console.log(`disparadores: ${disparadores.length}`);

  const ideas = sqlite.prepare("select * from ideas_contenido").all() as Record<string, unknown>[];
  if (ideas.length > 0) {
    await db.insert(schema.ideasContenido).values(
      ideas.map((i) => ({
        id: i.id as string,
        pilar: i.pilar as schema.PilarContenido,
        idea: i.idea as string,
        canal_sugerido: i.canal_sugerido as string | null,
        estado: i.estado as schema.EstadoContenido,
        fecha_publicacion: i.fecha_publicacion as string | null,
        rendimiento: i.rendimiento as schema.RendimientoContenido | null,
        origen_idea: i.origen_idea as string | null,
        cliente_origen_id: i.cliente_origen_id as string | null,
        created_at: ts(i.created_at as number)!,
        updated_at: ts(i.updated_at as number)!,
      })),
    );
  }
  console.log(`ideas_contenido: ${ideas.length}`);

  const historialEtapa = sqlite.prepare("select * from prospecto_etapa_historial").all() as Record<string, unknown>[];
  if (historialEtapa.length > 0) {
    await db.insert(schema.prospectoEtapaHistorial).values(
      historialEtapa.map((h) => ({
        id: h.id as string,
        prospecto_id: h.prospecto_id as string,
        etapa: h.etapa as schema.EtapaProspecto,
        fecha: ts(h.fecha as number)!,
      })),
    );
  }
  console.log(`prospecto_etapa_historial: ${historialEtapa.length}`);

  const pedidos = sqlite.prepare("select * from pedidos_referido").all() as Record<string, unknown>[];
  if (pedidos.length > 0) {
    await db.insert(schema.pedidosReferido).values(
      pedidos.map((p) => ({
        id: p.id as string,
        cliente_id: p.cliente_id as string,
        fecha: p.fecha as string,
        disparador_usado: p.disparador_usado as schema.DisparadorUsadoReferido,
        canal: p.canal as schema.CanalReferido,
        dio_nombre: p.dio_nombre as schema.DioNombre,
        prospecto_id: p.prospecto_id as string | null,
        resultado: p.resultado as schema.ResultadoReferido,
        created_at: ts(p.created_at as number)!,
        updated_at: ts(p.updated_at as number)!,
      })),
    );
  }
  console.log(`pedidos_referido: ${pedidos.length}`);

  const diagnosticos = sqlite.prepare("select * from diagnosticos").all() as Record<string, unknown>[];
  if (diagnosticos.length > 0) {
    await db.insert(schema.diagnosticos).values(
      diagnosticos.map((d) => ({
        id: d.id as string,
        prospecto_id: d.prospecto_id as string,
        fecha_solicitud: d.fecha_solicitud as string,
        fecha_entrega: d.fecha_entrega as string | null,
        minutos_produccion: d.minutos_produccion as number | null,
        bloque_foto_actual: d.bloque_foto_actual as string,
        bloque_riesgo_real: d.bloque_riesgo_real as string,
        bloque_rendimiento: d.bloque_rendimiento as string,
        bloque_huecos: d.bloque_huecos as string,
        bloque_proximo_paso: d.bloque_proximo_paso as string,
        enviado: bool(d.enviado as number),
        created_at: ts(d.created_at as number)!,
        updated_at: ts(d.updated_at as number)!,
      })),
    );
  }
  console.log(`diagnosticos: ${diagnosticos.length}`);

  console.log("Listo.");
  sqlite.close();
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
