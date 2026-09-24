ALTER TABLE "job_runs" ADD COLUMN "scheduled_for" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_schedule_fire_unique" ON "job_runs" USING btree ("schedule_id","scheduled_for");--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_scheduled_for_valid" CHECK (
        (
          "job_runs"."trigger_type" = 'schedule'
          AND "job_runs"."scheduled_for" IS NOT NULL
        )
        OR
        (
          "job_runs"."trigger_type" <> 'schedule'
          AND "job_runs"."scheduled_for" IS NULL
        )
      );