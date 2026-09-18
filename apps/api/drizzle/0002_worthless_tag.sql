CREATE TYPE "public"."platform_initialization_state" AS ENUM('uninitialized', 'initializing', 'ready', 'maintenance');--> statement-breakpoint
CREATE TABLE "platform_state" (
	"key" text PRIMARY KEY NOT NULL,
	"initialization_state" "platform_initialization_state" DEFAULT 'uninitialized' NOT NULL,
	"initialized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
