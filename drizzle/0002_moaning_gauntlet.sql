CREATE TABLE `cuentas_supabase_ignoradas` (
	`id` text PRIMARY KEY NOT NULL,
	`broker` text NOT NULL,
	`account_code` text NOT NULL,
	`motivo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cuentas_supabase_ignoradas_broker_account_unique` ON `cuentas_supabase_ignoradas` (`broker`,`account_code`);