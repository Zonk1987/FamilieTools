ALTER TABLE "job_runs" DROP CONSTRAINT "job_runs_trigger_schedule_valid";--> statement-breakpoint
ALTER TABLE "job_runs" ADD COLUMN "claimed_by" text;--> statement-breakpoint
ALTER TABLE "job_runs" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_runs" ADD COLUMN "lease_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "job_runs_claimable_idx" ON "job_runs" USING btree ("status","lease_expires_at","created_at");--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_lease_consistency" CHECK (
        (
          "job_runs"."claimed_by" IS NULL
          AND "job_runs"."claimed_at" IS NULL
          AND "job_runs"."lease_expires_at" IS NULL
        )
        OR
        (
          "job_runs"."claimed_by" IS NOT NULL
          AND "job_runs"."claimed_at" IS NOT NULL
          AND "job_runs"."lease_expires_at" IS NOT NULL
          AND "job_runs"."lease_expires_at" > "job_runs"."claimed_at"
        )
      );--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_trigger_schedule_valid" CHECK (
        "job_runs"."trigger_type" = 'schedule'
        OR "job_runs"."schedule_id" IS NULL
      );