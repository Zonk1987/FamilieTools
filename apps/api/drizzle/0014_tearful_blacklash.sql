DROP INDEX "job_runs_claimable_idx";--> statement-breakpoint
DROP INDEX "job_runs_schedule_fire_unique";--> statement-breakpoint
ALTER TABLE "job_runs" ADD COLUMN "available_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "job_runs_claimable_idx" ON "job_runs" USING btree ("status","available_at","lease_expires_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_schedule_fire_unique" ON "job_runs" USING btree ("schedule_id","scheduled_for","attempt");