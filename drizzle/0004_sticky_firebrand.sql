CREATE TABLE `metricas_semanales` (
	`id` text PRIMARY KEY NOT NULL,
	`semana` integer NOT NULL,
	`fecha_desde` text NOT NULL,
	`fecha_hasta` text NOT NULL,
	`alcance_perfil_objetivo` integer,
	`visitas_perfil` integer,
	`inversion_publicitaria_usd` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `metricas_semanales_semana_unique` ON `metricas_semanales` (`semana`);