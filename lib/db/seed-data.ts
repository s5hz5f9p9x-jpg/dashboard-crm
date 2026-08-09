// Datos semilla reales del Plan de Marketing de 90 días (SPEC.md sección 9).
// Extraídos de 'Driver Capital - Calendario 90 dias.xlsx'.
import type { FasePlan, PilarContenido } from "./schema";

export interface TareaPlanSeed {
  semana: number;
  fase: FasePlan;
  tarea: string;
  categoria: string | null;
  tiempo_estimado: string | null;
  entregable: string | null;
  es_condicion_salida: boolean;
}

export const TAREAS_PLAN_SEED: TareaPlanSeed[] = [
  { semana: 1, fase: "fase_0", tarea: "Segmentar los 150 clientes en niveles A, B y C con frecuencia de contacto definida", categoria: "Operaciones", tiempo_estimado: "2 h", entregable: "Planilla de segmentación", es_condicion_salida: false },
  { semana: 1, fase: "fase_0", tarea: "Cerrar ICP, propuesta de valor y arquitectura de mensajes", categoria: "Estrategia", tiempo_estimado: "2 h", entregable: "Parte 2 del plan validada", es_condicion_salida: false },
  { semana: 1, fase: "fase_0", tarea: "Definir los 3 niveles de servicio: alcance y honorarios", categoria: "Oferta", tiempo_estimado: "2 h", entregable: "Cuadro de niveles cerrado", es_condicion_salida: false },
  { semana: 1, fase: "fase_0", tarea: "Producir 5 Diagnósticos de Cartera para clientes actuales", categoria: "Oferta", tiempo_estimado: "3 h", entregable: "Plantilla de diagnóstico probada", es_condicion_salida: false },
  { semana: 1, fase: "fase_0", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 1, fase: "fase_0", tarea: "Calcular el modelo económico con datos reales", categoria: "Métricas", tiempo_estimado: "1 h", entregable: "Pestaña Modelo económico completa", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Publicar la landing de captación y conectar el formulario", categoria: "Activos", tiempo_estimado: "3 h", entregable: "Landing online", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Ordenar perfiles de LinkedIn e Instagram: bio, foto, destacados, enlace", categoria: "Activos", tiempo_estimado: "2 h", entregable: "Perfiles alineados a la marca", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Configurar CRM con campo de origen del lead", categoria: "Operaciones", tiempo_estimado: "1 h", entregable: "Campo origen activo", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Configurar agenda online para llamadas de diagnóstico", categoria: "Operaciones", tiempo_estimado: "30 min", entregable: "Link de agenda funcionando", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Escribir el banco de 30 ideas de contenido", categoria: "Contenido", tiempo_estimado: "2 h", entregable: "Pestaña Banco completa", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Producir el primer lote de 12 piezas", categoria: "Contenido", tiempo_estimado: "3 h", entregable: "12 piezas listas", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "Armar el Termómetro de Cartera como pieza publicable", categoria: "Contenido", tiempo_estimado: "1 h", entregable: "Carrusel + historias", es_condicion_salida: false },
  { semana: 2, fase: "fase_0", tarea: "CONDICIÓN DE SALIDA · Landing online + 12 piezas listas + cartera segmentada", categoria: "Control", tiempo_estimado: null, entregable: "Fase 0 cerrada", es_condicion_salida: true },
  { semana: 3, fase: "fase_1", tarea: "Publicar 3 posts en LinkedIn + 3 posts y 5 historias en Instagram", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 3, fase: "fase_1", tarea: "Lanzar el Termómetro de Cartera en ambos canales", categoria: "Contenido", tiempo_estimado: "30 min", entregable: "Lead magnet activo", es_condicion_salida: false },
  { semana: 3, fase: "fase_1", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 3, fase: "fase_1", tarea: "Responder todos los comentarios y DM dentro de 24 h", categoria: "Conversación", tiempo_estimado: "15 min/día", entregable: "Cero mensajes sin responder", es_condicion_salida: false },
  { semana: 3, fase: "fase_1", tarea: "Enviar el primer newsletter a toda la base", categoria: "Contenido", tiempo_estimado: "2 h", entregable: "Newsletter #1 enviado", es_condicion_salida: false },
  { semana: 3, fase: "fase_1", tarea: "Cargar el tablero semanal del viernes", categoria: "Métricas", tiempo_estimado: "20 min", entregable: "Semana 3 medida", es_condicion_salida: false },
  { semana: 4, fase: "fase_1", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 4, fase: "fase_1", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 4, fase: "fase_1", tarea: "Producir diagnósticos de los leads que entraron", categoria: "Ventas", tiempo_estimado: "1-2 h", entregable: "Diagnósticos enviados", es_condicion_salida: false },
  { semana: 4, fase: "fase_1", tarea: "Realizar las primeras llamadas de diagnóstico", categoria: "Ventas", tiempo_estimado: "30 min c/u", entregable: "Llamadas registradas en CRM", es_condicion_salida: false },
  { semana: 4, fase: "fase_1", tarea: "Cargar el tablero semanal del viernes", categoria: "Métricas", tiempo_estimado: "20 min", entregable: "Semana 4 medida", es_condicion_salida: false },
  { semana: 5, fase: "fase_1", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 5, fase: "fase_1", tarea: "Producir el lote de contenido del mes 2", categoria: "Contenido", tiempo_estimado: "2 h", entregable: "12-15 piezas listas", es_condicion_salida: false },
  { semana: 5, fase: "fase_1", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 5, fase: "fase_1", tarea: "Refinar la plantilla de diagnóstico con lo aprendido", categoria: "Oferta", tiempo_estimado: "1 h", entregable: "Plantilla v2", es_condicion_salida: false },
  { semana: 5, fase: "fase_1", tarea: "Cargar el tablero semanal del viernes", categoria: "Métricas", tiempo_estimado: "20 min", entregable: "Semana 5 medida", es_condicion_salida: false },
  { semana: 6, fase: "fase_1", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 6, fase: "fase_1", tarea: "Enviar el newsletter #2", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "Newsletter #2 enviado", es_condicion_salida: false },
  { semana: 6, fase: "fase_1", tarea: "Identificar las 3 piezas de mejor rendimiento con datos", categoria: "Métricas", tiempo_estimado: "30 min", entregable: "Top 3 definido", es_condicion_salida: false },
  { semana: 6, fase: "fase_1", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 6, fase: "fase_1", tarea: "CONDICIÓN DE SALIDA · 20+ piezas · 5+ leads · 3+ llamadas · top 3 identificado", categoria: "Control", tiempo_estimado: null, entregable: "Fase 1 cerrada", es_condicion_salida: true },
  { semana: 7, fase: "fase_2", tarea: "Promocionar las 3 piezas ganadoras desde Instagram", categoria: "Publicidad", tiempo_estimado: "1 h", entregable: "Campañas activas", es_condicion_salida: false },
  { semana: 7, fase: "fase_2", tarea: "Configurar 2 audiencias: intereses y lookalike sobre base de clientes", categoria: "Publicidad", tiempo_estimado: "1 h", entregable: "2 audiencias creadas", es_condicion_salida: false },
  { semana: 7, fase: "fase_2", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 7, fase: "fase_2", tarea: "Cargar el tablero semanal del viernes", categoria: "Métricas", tiempo_estimado: "20 min", entregable: "Semana 7 medida", es_condicion_salida: false },
  { semana: 8, fase: "fase_2", tarea: "Medir costo por lead y costo por lead calificado por separado", categoria: "Métricas", tiempo_estimado: "30 min", entregable: "CPL y CPLC medidos", es_condicion_salida: false },
  { semana: 8, fase: "fase_2", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 8, fase: "fase_2", tarea: "Contratar diseño y edición tercerizados", categoria: "Operaciones", tiempo_estimado: "2 h", entregable: "Proveedor activo", es_condicion_salida: false },
  { semana: 8, fase: "fase_2", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 9, fase: "fase_2", tarea: "Duplicar inversión en la audiencia de mejor rendimiento", categoria: "Publicidad", tiempo_estimado: "30 min", entregable: "Presupuesto reasignado", es_condicion_salida: false },
  { semana: 9, fase: "fase_2", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 9, fase: "fase_2", tarea: "Publicar el primer caso o testimonio con autorización escrita", categoria: "Contenido", tiempo_estimado: "2 h", entregable: "Caso publicado", es_condicion_salida: false },
  { semana: 9, fase: "fase_2", tarea: "Producir el lote de contenido del mes 3", categoria: "Contenido", tiempo_estimado: "2 h", entregable: "12-15 piezas listas", es_condicion_salida: false },
  { semana: 10, fase: "fase_2", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 10, fase: "fase_2", tarea: "Enviar el newsletter #4", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "Newsletter #4 enviado", es_condicion_salida: false },
  { semana: 10, fase: "fase_2", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 10, fase: "fase_2", tarea: "CONDICIÓN DE SALIDA · Costo por lead calificado < USD 100 · 1 cliente de origen trazable", categoria: "Control", tiempo_estimado: null, entregable: "Fase 2 cerrada", es_condicion_salida: true },
  { semana: 11, fase: "fase_3", tarea: "Escalar inversión a USD 250-400/mes sobre lo de mejor rendimiento", categoria: "Publicidad", tiempo_estimado: "30 min", entregable: "Presupuesto escalado", es_condicion_salida: false },
  { semana: 11, fase: "fase_3", tarea: "Documentar el proceso de producción de contenido", categoria: "Operaciones", tiempo_estimado: "1 h", entregable: "Proceso escrito", es_condicion_salida: false },
  { semana: 11, fase: "fase_3", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 12, fase: "fase_3", tarea: "Documentar diagnóstico, llamada, propuesta y alta", categoria: "Operaciones", tiempo_estimado: "2 h", entregable: "4 procesos escritos", es_condicion_salida: false },
  { semana: 12, fase: "fase_3", tarea: "Automatizar la secuencia de bienvenida de 3 mensajes", categoria: "Operaciones", tiempo_estimado: "2 h", entregable: "Secuencia activa", es_condicion_salida: false },
  { semana: 12, fase: "fase_3", tarea: "Publicar 6 piezas según cadencia", categoria: "Contenido", tiempo_estimado: "90 min", entregable: "6 piezas publicadas", es_condicion_salida: false },
  { semana: 12, fase: "fase_3", tarea: "Enviar 5 pedidos de referido con disparador", categoria: "Referidos", tiempo_estimado: "30 min", entregable: "5 pedidos registrados", es_condicion_salida: false },
  { semana: 13, fase: "fase_3", tarea: "Revisar el modelo económico con los datos reales de 90 días", categoria: "Métricas", tiempo_estimado: "1 h", entregable: "Modelo actualizado", es_condicion_salida: false },
  { semana: 13, fase: "fase_3", tarea: "Definir qué se delega en el mes 4 y a quién", categoria: "Estrategia", tiempo_estimado: "1 h", entregable: "Plan de delegación", es_condicion_salida: false },
  { semana: 13, fase: "fase_3", tarea: "Planificar el trimestre siguiente sobre datos", categoria: "Estrategia", tiempo_estimado: "2 h", entregable: "Plan Q siguiente", es_condicion_salida: false },
  { semana: 13, fase: "fase_3", tarea: "CONDICIÓN DE SALIDA · 10+ prospectos calificados/mes · procesos escritos · CAC medido", categoria: "Control", tiempo_estimado: null, entregable: "Fase 3 cerrada", es_condicion_salida: true },
];

export interface IdeaContenidoSeed {
  pilar: PilarContenido;
  idea: string;
  canal_sugerido: string | null;
}

export const IDEAS_CONTENIDO_SEED: IdeaContenidoSeed[] = [
  { pilar: "traduccion", idea: "Qué es la duration y por qué determina cuánto podés perder si suben las tasas", canal_sugerido: "LinkedIn + carrusel" },
  { pilar: "traduccion", idea: "CEDEAR explicado en tres minutos: qué comprás realmente y qué riesgo asumís", canal_sugerido: "Instagram carrusel" },
  { pilar: "traduccion", idea: "Bono soberano vs. obligación negociable: cuándo conviene cada uno", canal_sugerido: "LinkedIn" },
  { pilar: "traduccion", idea: "Cómo leer el riesgo país sin volverse loco", canal_sugerido: "Instagram + historias" },
  { pilar: "traduccion", idea: "FCI: los cuatro tipos que existen y para qué sirve cada uno", canal_sugerido: "LinkedIn + carrusel" },
  { pilar: "traduccion", idea: "Qué significa que un bono cotice bajo la par", canal_sugerido: "LinkedIn" },
  { pilar: "traduccion", idea: "Rendimiento nominal, real y en dólares: por qué el que importa es el tercero", canal_sugerido: "Instagram carrusel" },
  { pilar: "traduccion", idea: "Todas las comisiones que pagás sin darte cuenta", canal_sugerido: "LinkedIn + newsletter" },
  { pilar: "traduccion", idea: "Qué es el carry trade y por qué se volvió menos atractivo", canal_sugerido: "LinkedIn" },
  { pilar: "traduccion", idea: "Liquidez: la variable que nadie mira hasta que la necesita", canal_sugerido: "Instagram" },
  { pilar: "termometro", idea: "Qué hacer con los pesos ahora que la tasa apenas le empata a la inflación", canal_sugerido: "LinkedIn + historias" },
  { pilar: "termometro", idea: "Se te vence el plazo fijo: las tres opciones sobre la mesa", canal_sugerido: "Instagram carrusel" },
  { pilar: "termometro", idea: "Qué mirar en el próximo dato de inflación y por qué", canal_sugerido: "LinkedIn" },
  { pilar: "termometro", idea: "Movimiento del dólar: qué significa para una cartera en pesos", canal_sugerido: "Historias" },
  { pilar: "termometro", idea: "El calendario de vencimientos del trimestre y cómo prepararse", canal_sugerido: "Newsletter" },
  { pilar: "termometro", idea: "Qué cambió esta semana en el mercado local, en tres puntos", canal_sugerido: "LinkedIn" },
  { pilar: "termometro", idea: "Decisión del BCRA: qué implica para tus inversiones", canal_sugerido: "LinkedIn + historias" },
  { pilar: "termometro", idea: "Por qué esperar a ver qué pasa es también una decisión, con costo", canal_sugerido: "Instagram carrusel" },
  { pilar: "termometro", idea: "Estacionalidad: lo que suele pasar en esta época del año", canal_sugerido: "LinkedIn" },
  { pilar: "termometro", idea: "El dato macro que casi nadie mira y que conviene seguir", canal_sugerido: "Newsletter" },
  { pilar: "prueba", idea: "Cómo armamos una cartera desde cero: el proceso en cinco pasos", canal_sugerido: "LinkedIn + carrusel" },
  { pilar: "prueba", idea: "Los tres errores que más veo cuando reviso carteras", canal_sugerido: "Instagram carrusel" },
  { pilar: "prueba", idea: "Cómo se ve un reporte nuestro por dentro", canal_sugerido: "Historias + LinkedIn" },
  { pilar: "prueba", idea: "Las siete preguntas del Termómetro de Cartera", canal_sugerido: "Instagram + lead magnet" },
  { pilar: "prueba", idea: "Por qué no cobramos comisión por producto y qué cambia eso para vos", canal_sugerido: "LinkedIn" },
  { pilar: "prueba", idea: "Qué preguntarle a cualquier asesor antes de confiarle tu dinero", canal_sugerido: "Instagram carrusel" },
  { pilar: "prueba", idea: "Cómo definimos el perfil de riesgo de una persona", canal_sugerido: "LinkedIn" },
  { pilar: "prueba", idea: "Qué hacemos cuando el mercado se da vuelta", canal_sugerido: "LinkedIn" },
  { pilar: "prueba", idea: "Un día de trabajo en Driver Capital", canal_sugerido: "Historias" },
  { pilar: "prueba", idea: "Por qué existe Driver Capital: la historia detrás", canal_sugerido: "LinkedIn + Instagram" },
];
