ALTER TABLE "job_runs" DROP CONSTRAINT "job_runs_trigger_schedule_valid";--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_trigger_schedule_valid" CHECK (
    (
      "job_runs"."trigger_type" = 'schedule'
      AND "job_runs"."schedule_id" IS NOT NULL
    )
    OR
    (
      "job_runs"."trigger_type" <> 'schedule'
      AND "job_runs"."schedule_id" IS NULL
    )
  );