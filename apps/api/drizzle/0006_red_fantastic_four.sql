ALTER TABLE "modules" DROP CONSTRAINT "modules_key_unique";--> statement-breakpoint

DELETE FROM "modules";--> statement-breakpoint

ALTER TABLE "modules" ADD COLUMN "module_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "version" text NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "publisher" text NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "installation_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "package_sha256" text NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "install_source" text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "manifest" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "installed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "modules_module_id_version_unique"
ON "modules" USING btree ("module_id", "version");--> statement-breakpoint

ALTER TABLE "modules" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "is_system";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "is_required";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "default_enabled_for_families";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "created_at";
