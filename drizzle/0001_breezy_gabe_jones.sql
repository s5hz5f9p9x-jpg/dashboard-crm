CREATE TABLE `disparadores` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text,
	`tipo` text NOT NULL,
	`periodo` text NOT NULL,
	`severidad` text NOT NULL,
	`titulo` text NOT NULL,
	`detalle` text DEFAULT '' NOT NULL,
	`accion_sugerida` text DEFAULT '' NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`fecha_generado` integer DEFAULT (unixepoch()) NOT NULL,
	`fecha_atendido` integer,
	`vence_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disparadores_cliente_tipo_periodo_unique` ON `disparadores` (`cliente_id`,`tipo`,`periodo`);--> statement-breakpoint
CREATE INDEX `disparadores_estado_idx` ON `disparadores` (`estado`);--> statement-breakpoint
CREATE INDEX `disparadores_cliente_idx` ON `disparadores` (`cliente_id`);