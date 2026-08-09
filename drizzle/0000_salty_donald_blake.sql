CREATE TABLE `aum_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`fecha` text NOT NULL,
	`aum_usd` real NOT NULL,
	`composicion` text,
	`fuente` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aum_snapshots_cliente_fecha_unique` ON `aum_snapshots` (`cliente_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `aum_snapshots_cliente_idx` ON `aum_snapshots` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `cliente_cuentas_supabase` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`broker` text NOT NULL,
	`account_code` text NOT NULL,
	`supabase_client_account_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cliente_cuentas_supabase_broker_account_unique` ON `cliente_cuentas_supabase` (`broker`,`account_code`);--> statement-breakpoint
CREATE INDEX `cliente_cuentas_supabase_cliente_idx` ON `cliente_cuentas_supabase` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`apellido` text NOT NULL,
	`email` text,
	`telefono` text,
	`fecha_alta` text NOT NULL,
	`nivel_servicio` text DEFAULT 'base' NOT NULL,
	`segmento` text DEFAULT 'C' NOT NULL,
	`segmento_manual` text,
	`segmento_manual_motivo` text,
	`aum_actual_usd` real DEFAULT 0 NOT NULL,
	`aum_actualizado_at` integer,
	`perfil_riesgo` text,
	`estado` text DEFAULT 'activo' NOT NULL,
	`fecha_baja` text,
	`motivo_baja` text,
	`origen` text,
	`referido_por_cliente_id` text,
	`notas` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_email_unique` ON `clientes` (`email`);--> statement-breakpoint
CREATE INDEX `clientes_segmento_idx` ON `clientes` (`segmento`);--> statement-breakpoint
CREATE INDEX `clientes_estado_idx` ON `clientes` (`estado`);--> statement-breakpoint
CREATE INDEX `clientes_referido_por_idx` ON `clientes` (`referido_por_cliente_id`);--> statement-breakpoint
CREATE TABLE `configuracion` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`descripcion` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contactos` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`fecha` integer DEFAULT (unixepoch()) NOT NULL,
	`tipo` text NOT NULL,
	`direccion` text NOT NULL,
	`resumen` text DEFAULT '' NOT NULL,
	`disparador_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contactos_cliente_idx` ON `contactos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `contactos_fecha_idx` ON `contactos` (`fecha`);--> statement-breakpoint
CREATE TABLE `segmento_historial` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`segmento_anterior` text,
	`segmento_nuevo` text NOT NULL,
	`fecha` integer DEFAULT (unixepoch()) NOT NULL,
	`motivo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `segmento_historial_cliente_idx` ON `segmento_historial` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `tipo_cambio_historial` (
	`id` text PRIMARY KEY NOT NULL,
	`fecha` text NOT NULL,
	`mep_ars_usd` real NOT NULL,
	`fuente` text DEFAULT 'data912.com/live/mep (AL30)' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tipo_cambio_historial_fecha_unique` ON `tipo_cambio_historial` (`fecha`);