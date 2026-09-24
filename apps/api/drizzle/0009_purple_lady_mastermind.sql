CREATE TYPE "public"."job_owner_type" AS ENUM('platform', 'workspace', 'domain', 'module-instance');--> statement-breakpoint
CREATE TYPE "public"."job_run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out');--> statement-breakpoint
CREATE TYPE "public"."job_trigger_type" AS ENUM('manual', 'schedule', 'event', 'system');--> statement-breakpoint
CREATE TYPE "public"."job_schedule_type" AS ENUM('once', 'interval', 'cron');--> statement-breakpoint
CREATE TABLE "job_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"owner_type" "job_owner_type" NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"handler" text NOT NULL,
	"default_timeout_seconds" integer DEFAULT 300 NOT NULL,
	"max_retries" integer DEFAULT 0 NOT NULL,
	"retry_delay_seconds" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_definitions_timeout_positive" CHECK ("job_definitions"."default_timeout_seconds" > 0),
	CONSTRAINT "job_definitions_max_retries_non_negative" CHECK ("job_definitions"."max_retries" >= 0),
	CONSTRAINT "job_definitions_retry_delay_non_negative" CHECK ("job_definitions"."retry_delay_seconds" >= 0),
	CONSTRAINT "job_definitions_owner_scope_valid" CHECK (
        (
          "job_definitions"."owner_type" = 'platform'
          AND "job_definitions"."owner_id" IS NULL
        )
        OR
        (
          "job_definitions"."owner_type" <> 'platform'
          AND "job_definitions"."owner_id" IS NOT NULL
        )
      ),
	CONSTRAINT "job_definitions_key_not_empty" CHECK (length(trim("job_definitions"."key")) > 0),
	CONSTRAINT "job_definitions_name_not_empty" CHECK (length(trim("job_definitions"."name")) > 0),
	CONSTRAINT "job_definitions_handler_not_empty" CHECK (length(trim("job_definitions"."handler")) > 0)
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_definition_id" uuid NOT NULL,
	"schedule_id" uuid,
	"status" "job_run_status" DEFAULT 'queued' NOT NULL,
	"trigger_type" "job_trigger_type" NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"requested_by_type" text,
	"requested_by_id" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"timeout_at" timestamp with time zone,
	"error_code" text,
	"error_message" text,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_definition_id" uuid NOT NULL,
	"schedule_type" "job_schedule_type" NOT NULL,
	"run_at" timestamp with time zone,
	"interval_seconds" integer,
	"cron_expression" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_schedules_configuration_valid" CHECK (
        (
          "job_schedules"."schedule_type" = 'once'
          AND "job_schedules"."run_at" IS NOT NULL
          AND "job_schedules"."interval_seconds" IS NULL
          AND "job_schedules"."cron_expression" IS NULL
        )
        OR
        (
          "job_schedules"."schedule_type" = 'interval'
          AND "job_schedules"."run_at" IS NULL
          AND "job_schedules"."interval_seconds" IS NOT NULL
          AND "job_schedules"."interval_seconds" > 0
          AND "job_schedules"."cron_expression" IS NULL
        )
        OR
        (
          "job_schedules"."schedule_type" = 'cron'
          AND "job_schedules"."run_at" IS NULL
          AND "job_schedules"."interval_seconds" IS NULL
          AND "job_schedules"."cron_expression" IS NOT NULL
          AND length(trim("job_schedules"."cron_expression")) > 0
        )
      ),
	CONSTRAINT "job_schedules_timezone_not_empty" CHECK (length(trim("job_schedules"."timezone")) > 0)
);
--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_job_definition_id_job_definitions_id_fk" FOREIGN KEY ("job_definition_id") REFERENCES "public"."job_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_schedule_id_job_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."job_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_schedules" ADD CONSTRAINT "job_schedules_job_definition_id_job_definitions_id_fk" FOREIGN KEY ("job_definition_id") REFERENCES "public"."job_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_definitions_platform_key_unique" ON "job_definitions" USING btree ("key") WHERE "job_definitions"."owner_type" = 'platform';--> statement-breakpoint
CREATE UNIQUE INDEX "job_definitions_scoped_owner_key_unique" ON "job_definitions" USING btree ("owner_type","owner_id","key") WHERE "job_definitions"."owner_type" <> 'platform';