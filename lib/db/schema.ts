import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

export const crmSchema = pgSchema("crm");

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
};

export type NivelServicio = "base" | "plus" | "privado";
export type Segmento = "A" | "B" | "C";
export type PerfilRiesgo = "conservador" | "moderado" | "agresivo";
export type EstadoCliente = "activo" | "pausado" | "baja";

export const clientes = crmSchema.table(
  "clientes",
  {
    id: id(),
    nombre: text("nombre").notNull(),
    apellido: text("apellido").notNull(),
    email: text("email"),
    telefono: text("telefono"),
    fecha_alta: text("fecha_alta").notNull(),
    nivel_servicio: text("nivel_servicio").$type<NivelServicio>().notNull().default("base"),
    segmento: text("segmento").$type<Segmento>().notNull().default("C"),
    segmento_manual: text("segmento_manual").$type<Segmento>(),
    segmento_manual_motivo: text("segmento_manual_motivo"),
    aum_actual_usd: doublePrecision("aum_actual_usd").notNull().default(0),
    aum_actualizado_at: timestamp("aum_actualizado_at", { withTimezone: true, mode: "date" }),
    perfil_riesgo: text("perfil_riesgo").$type<PerfilRiesgo>(),
    estado: text("estado").$type<EstadoCliente>().notNull().default("activo"),
    fecha_baja: text("fecha_baja"),
    motivo_baja: text("motivo_baja"),
    origen: text("origen"),
    referido_por_cliente_id: text("referido_por_cliente_id"),
    notas: text("notas").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("clientes_email_unique").on(t.email),
    index("clientes_segmento_idx").on(t.segmento),
    index("clientes_estado_idx").on(t.estado),
    index("clientes_referido_por_idx").on(t.referido_por_cliente_id),
  ],
);

// Vínculo cliente -> cuenta de broker en Supabase. 1 cliente puede tener N cuentas
// (ver ETAPA_0_MAPEO.md sección 2: un mismo cliente puede operar en IEB y BALANZ a la vez).
export const clienteCuentasSupabase = crmSchema.table(
  "cliente_cuentas_supabase",
  {
    id: id(),
    cliente_id: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    broker: text("broker").notNull(),
    account_code: text("account_code").notNull(),
    supabase_client_account_id: text("supabase_client_account_id"),
    created_at: timestamps.created_at,
  },
  (t) => [
    uniqueIndex("cliente_cuentas_supabase_broker_account_unique").on(t.broker, t.account_code),
    index("cliente_cuentas_supabase_cliente_idx").on(t.cliente_id),
  ],
);

export type FuenteAum = "supabase" | "manual" | "importacion";

export const aumSnapshots = crmSchema.table(
  "aum_snapshots",
  {
    id: id(),
    cliente_id: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    fecha: text("fecha").notNull(),
    aum_usd: doublePrecision("aum_usd").notNull(),
    composicion: jsonb("composicion").$type<
      { clase: string; instrumento: string; monto_usd: number; moneda: string }[]
    >(),
    fuente: text("fuente").$type<FuenteAum>().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("aum_snapshots_cliente_fecha_unique").on(t.cliente_id, t.fecha),
    index("aum_snapshots_cliente_idx").on(t.cliente_id),
  ],
);

export type TipoContacto = "whatsapp" | "email" | "llamada" | "reunion" | "reporte_enviado";
export type DireccionContacto = "saliente" | "entrante";

export const contactos = crmSchema.table(
  "contactos",
  {
    id: id(),
    cliente_id: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    fecha: timestamp("fecha", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    tipo: text("tipo").$type<TipoContacto>().notNull(),
    direccion: text("direccion").$type<DireccionContacto>().notNull(),
    resumen: text("resumen").notNull().default(""),
    disparador_id: text("disparador_id"),
    ...timestamps,
  },
  (t) => [
    index("contactos_cliente_idx").on(t.cliente_id),
    index("contactos_fecha_idx").on(t.fecha),
  ],
);

export const segmentoHistorial = crmSchema.table(
  "segmento_historial",
  {
    id: id(),
    cliente_id: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    segmento_anterior: text("segmento_anterior").$type<Segmento>(),
    segmento_nuevo: text("segmento_nuevo").$type<Segmento>().notNull(),
    fecha: timestamp("fecha", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    motivo: text("motivo"),
    created_at: timestamps.created_at,
  },
  (t) => [index("segmento_historial_cliente_idx").on(t.cliente_id)],
);

export const configuracion = crmSchema.table("configuracion", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
  descripcion: text("descripcion"),
  updated_at: timestamps.updated_at,
});

export const tipoCambioHistorial = crmSchema.table(
  "tipo_cambio_historial",
  {
    id: id(),
    fecha: text("fecha").notNull(),
    mep_ars_usd: doublePrecision("mep_ars_usd").notNull(),
    fuente: text("fuente").notNull().default("data912.com/live/mep (AL30)"),
    created_at: timestamps.created_at,
  },
  (t) => [uniqueIndex("tipo_cambio_historial_fecha_unique").on(t.fecha)],
);

export type TipoDisparador =
  | "variacion_aum"
  | "vencimiento_proximo"
  | "contacto_vencido"
  | "inactividad_prolongada"
  | "aniversario"
  | "pedir_referido"
  | "cambio_segmento"
  | "evento_macro"
  | "revision_cuenta";
export type SeveridadDisparador = "alta" | "media" | "baja";
export type EstadoDisparador = "pendiente" | "atendido" | "descartado";

export const disparadores = crmSchema.table(
  "disparadores",
  {
    id: id(),
    cliente_id: text("cliente_id").references(() => clientes.id, { onDelete: "cascade" }),
    tipo: text("tipo").$type<TipoDisparador>().notNull(),
    // Clave lógica de idempotencia junto a (cliente_id, tipo): SPEC.md 4.4.
    // YYYY-MM para los recurrentes; para vencimiento_proximo el ticker, para
    // pedir_referido el id del contacto que lo originó.
    periodo: text("periodo").notNull(),
    severidad: text("severidad").$type<SeveridadDisparador>().notNull(),
    titulo: text("titulo").notNull(),
    detalle: text("detalle").notNull().default(""),
    accion_sugerida: text("accion_sugerida").notNull().default(""),
    estado: text("estado").$type<EstadoDisparador>().notNull().default("pendiente"),
    fecha_generado: timestamp("fecha_generado", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    fecha_atendido: timestamp("fecha_atendido", { withTimezone: true, mode: "date" }),
    vence_at: timestamp("vence_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("disparadores_cliente_tipo_periodo_unique").on(t.cliente_id, t.tipo, t.periodo),
    index("disparadores_estado_idx").on(t.estado),
    index("disparadores_cliente_idx").on(t.cliente_id),
  ],
);

// Cuentas de Supabase que el usuario decidió no vincular a ningún cliente
// (ej: cuentas de gente que ya no es cliente). Sin esto, /vinculacion las
// vuelve a mostrar como "sin vincular" cada vez que se abre la pantalla.
export const cuentasSupabaseIgnoradas = crmSchema.table(
  "cuentas_supabase_ignoradas",
  {
    id: id(),
    broker: text("broker").notNull(),
    account_code: text("account_code").notNull(),
    motivo: text("motivo"),
    created_at: timestamps.created_at,
  },
  (t) => [uniqueIndex("cuentas_supabase_ignoradas_broker_account_unique").on(t.broker, t.account_code)],
);

export type EtapaProspecto =
  | "lead"
  | "calificado"
  | "diagnostico_enviado"
  | "llamada_agendada"
  | "llamada_realizada"
  | "propuesta"
  | "ganado"
  | "perdido";

export type OrigenProspecto =
  | "referido"
  | "linkedin_organico"
  | "instagram_organico"
  | "publicidad_instagram"
  | "publicidad_linkedin"
  | "newsletter"
  | "landing_directo"
  | "otro";

export type PatrimonioDeclarado = "menos_20k" | "20k_50k" | "50k_150k" | "mas_150k";

export const prospectos = crmSchema.table(
  "prospectos",
  {
    id: id(),
    nombre: text("nombre").notNull(),
    email: text("email"),
    telefono: text("telefono"),
    etapa: text("etapa").$type<EtapaProspecto>().notNull().default("lead"),
    origen: text("origen").$type<OrigenProspecto>().notNull(),
    origen_detalle: text("origen_detalle"),
    utm_source: text("utm_source"),
    utm_campaign: text("utm_campaign"),
    patrimonio_declarado: text("patrimonio_declarado").$type<PatrimonioDeclarado>(),
    antiguedad_invirtiendo: text("antiguedad_invirtiendo"),
    objetivo: text("objetivo"),
    calificado: boolean("calificado").notNull().default(false),
    motivo_descalificacion: text("motivo_descalificacion"),
    fecha_ingreso: text("fecha_ingreso").notNull(),
    fecha_cierre: text("fecha_cierre"),
    motivo_perdida: text("motivo_perdida"),
    cliente_id: text("cliente_id").references(() => clientes.id),
    notas: text("notas").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("prospectos_etapa_idx").on(t.etapa),
    index("prospectos_origen_idx").on(t.origen),
    index("prospectos_calificado_idx").on(t.calificado),
  ],
);

export const prospectoEtapaHistorial = crmSchema.table(
  "prospecto_etapa_historial",
  {
    id: id(),
    prospecto_id: text("prospecto_id")
      .notNull()
      .references(() => prospectos.id, { onDelete: "cascade" }),
    etapa: text("etapa").$type<EtapaProspecto>().notNull(),
    fecha: timestamp("fecha", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("prospecto_etapa_historial_prospecto_idx").on(t.prospecto_id)],
);

export type DisparadorUsadoReferido =
  | "reporte_buen_resultado"
  | "agradecimiento_espontaneo"
  | "aniversario"
  | "consulta_resuelta"
  | "evento_mercado";
export type CanalReferido = "whatsapp" | "email" | "llamada" | "presencial";
export type DioNombre = "si" | "no" | "pendiente";
export type ResultadoReferido = "sin_contacto" | "contactado" | "llamada_agendada" | "diagnostico_enviado" | "cliente" | "no_avanzo";

export const pedidosReferido = crmSchema.table(
  "pedidos_referido",
  {
    id: id(),
    cliente_id: text("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    fecha: text("fecha").notNull(),
    disparador_usado: text("disparador_usado").$type<DisparadorUsadoReferido>().notNull(),
    canal: text("canal").$type<CanalReferido>().notNull(),
    dio_nombre: text("dio_nombre").$type<DioNombre>().notNull().default("pendiente"),
    prospecto_id: text("prospecto_id").references(() => prospectos.id),
    resultado: text("resultado").$type<ResultadoReferido>().notNull().default("sin_contacto"),
    ...timestamps,
  },
  (t) => [index("pedidos_referido_cliente_idx").on(t.cliente_id)],
);

// Las 8 métricas del tablero semanal (SPEC.md 4.9). Solo se guardan acá los
// campos manuales y de identidad de la semana — los calculados (leads,
// llamadas, clientes nuevos) se computan al vuelo desde prospectos/clientes
// para que nunca queden desactualizados.
export const metricasSemanales = crmSchema.table(
  "metricas_semanales",
  {
    id: id(),
    semana: integer("semana").notNull(),
    fecha_desde: text("fecha_desde").notNull(),
    fecha_hasta: text("fecha_hasta").notNull(),
    alcance_perfil_objetivo: integer("alcance_perfil_objetivo"),
    visitas_perfil: integer("visitas_perfil"),
    inversion_publicitaria_usd: doublePrecision("inversion_publicitaria_usd").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("metricas_semanales_semana_unique").on(t.semana)],
);

export type PilarContenido = "traduccion" | "termometro" | "prueba";
export type EstadoContenido = "pendiente" | "escrita" | "publicada" | "promocionada";
export type RendimientoContenido = "alto" | "medio" | "bajo";

export const ideasContenido = crmSchema.table(
  "ideas_contenido",
  {
    id: id(),
    pilar: text("pilar").$type<PilarContenido>().notNull(),
    idea: text("idea").notNull(),
    canal_sugerido: text("canal_sugerido"),
    estado: text("estado").$type<EstadoContenido>().notNull().default("pendiente"),
    fecha_publicacion: text("fecha_publicacion"),
    rendimiento: text("rendimiento").$type<RendimientoContenido>(),
    origen_idea: text("origen_idea"),
    cliente_origen_id: text("cliente_origen_id").references(() => clientes.id),
    ...timestamps,
  },
  (t) => [index("ideas_contenido_pilar_idx").on(t.pilar), index("ideas_contenido_estado_idx").on(t.estado)],
);

export const diagnosticos = crmSchema.table(
  "diagnosticos",
  {
    id: id(),
    prospecto_id: text("prospecto_id")
      .notNull()
      .references(() => prospectos.id, { onDelete: "cascade" }),
    fecha_solicitud: text("fecha_solicitud").notNull(),
    fecha_entrega: text("fecha_entrega"),
    minutos_produccion: integer("minutos_produccion"),
    bloque_foto_actual: text("bloque_foto_actual").notNull().default(""),
    bloque_riesgo_real: text("bloque_riesgo_real").notNull().default(""),
    bloque_rendimiento: text("bloque_rendimiento").notNull().default(""),
    bloque_huecos: text("bloque_huecos").notNull().default(""),
    bloque_proximo_paso: text("bloque_proximo_paso").notNull().default(""),
    enviado: boolean("enviado").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("diagnosticos_prospecto_idx").on(t.prospecto_id)],
);

export type FasePlan = "fase_0" | "fase_1" | "fase_2" | "fase_3";
export type EstadoTarea = "pendiente" | "en_curso" | "hecho" | "no_aplica";

export const tareasPlan = crmSchema.table(
  "tareas_plan",
  {
    id: id(),
    semana: integer("semana").notNull(),
    fase: text("fase").$type<FasePlan>().notNull(),
    tarea: text("tarea").notNull(),
    categoria: text("categoria"),
    tiempo_estimado: text("tiempo_estimado"),
    entregable: text("entregable"),
    estado: text("estado").$type<EstadoTarea>().notNull().default("pendiente"),
    es_condicion_salida: boolean("es_condicion_salida").notNull().default(false),
    fecha_completada: text("fecha_completada"),
    ...timestamps,
  },
  (t) => [index("tareas_plan_fase_idx").on(t.fase), index("tareas_plan_semana_idx").on(t.semana)],
);
