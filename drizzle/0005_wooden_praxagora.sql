CREATE TABLE `diagnosticos` (
	`id` text PRIMARY KEY NOT NULL,
	`prospecto_id` text NOT NULL,
	`fecha_solicitud` text NOT NULL,
	`fecha_entrega` text,
	`minutos_produccion` integer,
	`bloque_foto_actual` text DEFAULT '' NOT NULL,
	`bloque_riesgo_real` text DEFAULT '' NOT NULL,
	`bloque_rendimiento` text DEFAULT '' NOT NULL,
	`bloque_huecos` text DEFAULT '' NOT NULL,
	`bloque_proximo_paso` text DEFAULT '' NOT NULL,
	`enviado` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`prospecto_id`) REFERENCES `prospectos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diagnosticos_prospecto_idx` ON `diagnosticos` (`prospecto_id`);--> statement-breakpoint
CREATE TABLE `ideas_contenido` (
	`id` text PRIMARY KEY NOT NULL,
	`pilar` text NOT NULL,
	`idea` text NOT NULL,
	`canal_sugerido` text,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`fecha_publicacion` text,
	`rendimiento` text,
	`origen_idea` text,
	`cliente_origen_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_origen_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ideas_contenido_pilar_idx` ON `ideas_contenido` (`pilar`);--> statement-breakpoint
CREATE INDEX `ideas_contenido_estado_idx` ON `ideas_contenido` (`estado`);--> statement-breakpoint
CREATE TABLE `tareas_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`semana` integer NOT NULL,
	`fase` text NOT NULL,
	`tarea` text NOT NULL,
	`categoria` text,
	`tiempo_estimado` text,
	`entregable` text,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`es_condicion_salida` integer DEFAULT false NOT NULL,
	`fecha_completada` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tareas_plan_fase_idx` ON `tareas_plan` (`fase`);--> statement-breakpoint
CREATE INDEX `tareas_plan_semana_idx` ON `tareas_plan` (`semana`);