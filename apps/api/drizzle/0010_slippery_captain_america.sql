ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_attempt_positive" CHECK ("job_runs"."attempt" >= 1);--> statement-breakpoint
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
      );--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_status_timestamps_valid" CHECK (
        (
          "job_runs"."status" = 'queued'
          AND "job_runs"."started_at" IS NULL
          AND "job_runs"."finished_at" IS NULL
        )
        OR
        (
          "job_runs"."status" = 'running'
          AND "job_runs"."started_at" IS NOT NULL
          AND "job_runs"."finished_at" IS NULL
        )
        OR
        (
          "job_runs"."status" IN (
            'succeeded',
            'failed',
            'cancelled',
            'timed_out'
          )
          AND "job_runs"."started_at" IS NOT NULL
          AND "job_runs"."finished_at" IS NOT NULL
          AND "job_runs"."finished_at" >= "job_runs"."started_at"
        )
      );--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_failure_details_valid" CHECK (
        (
          "job_runs"."status" = 'failed'
          AND "job_runs"."error_message" IS NOT NULL
          AND length(trim("job_runs"."error_message")) > 0
        )
        OR
        (
          "job_runs"."status" <> 'failed'
          AND "job_runs"."error_code" IS NULL
          AND "job_runs"."error_message" IS NULL
        )
      );--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_timeout_valid" CHECK (
        "job_runs"."status" <> 'timed_out'
        OR "job_runs"."timeout_at" IS NOT NULL
      );