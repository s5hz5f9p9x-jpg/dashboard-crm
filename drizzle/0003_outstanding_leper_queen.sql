CREATE TABLE `pedidos_referido` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`fecha` text NOT NULL,
	`disparador_usado` text NOT NULL,
	`canal` text NOT NULL,
	`dio_nombre` text DEFAULT 'pendiente' NOT NULL,
	`prospecto_id` text,
	`resultado` text DEFAULT 'sin_contacto' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prospecto_id`) REFERENCES `prospectos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pedidos_referido_cliente_idx` ON `pedidos_referido` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `prospecto_etapa_historial` (
	`id` text PRIMARY KEY NOT NULL,
	`prospecto_id` text NOT NULL,
	`etapa` text NOT NULL,
	`fecha` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`prospecto_id`) REFERENCES `prospectos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prospecto_etapa_historial_prospecto_idx` ON `prospecto_etapa_historial` (`prospecto_id`);--> statement-breakpoint
CREATE TABLE `prospectos` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text,
	`telefono` text,
	`etapa` text DEFAULT 'lead' NOT NULL,
	`origen` text NOT NULL,
	`origen_detalle` text,
	`utm_source` text,
	`utm_campaign` text,
	`patrimonio_declarado` text,
	`antiguedad_invirtiendo` text,
	`objetivo` text,
	`calificado` integer DEFAULT false NOT NULL,
	`motivo_descalificacion` text,
	`fecha_ingreso` text NOT NULL,
	`fecha_cierre` text,
	`motivo_perdida` text,
	`cliente_id` text,
	`notas` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `prospectos_etapa_idx` ON `prospectos` (`etapa`);--> statement-breakpoint
CREATE INDEX `prospectos_origen_idx` ON `prospectos` (`origen`);--> statement-breakpoint
CREATE INDEX `prospectos_calificado_idx` ON `prospectos` (`calificado`);