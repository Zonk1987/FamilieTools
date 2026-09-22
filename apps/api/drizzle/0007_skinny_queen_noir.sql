CREATE TABLE "auth_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint

ALTER TABLE "users"
ADD COLUMN "login_name" text;
--> statement-breakpoint

ALTER TABLE "users"
ADD COLUMN "password_hash" text;
--> statement-breakpoint

UPDATE "users"
SET
    "login_name" = 'legacy-' || "id"::text,
    "password_hash" = 'disabled-legacy-account'
WHERE
    "login_name" IS NULL
    OR "password_hash" IS NULL;
--> statement-breakpoint

ALTER TABLE "users"
ALTER COLUMN "login_name" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "users"
ALTER COLUMN "password_hash" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "auth_sessions"
ADD CONSTRAINT "auth_sessions_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "auth_sessions_user_id_idx"
ON "auth_sessions" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX "auth_sessions_expires_at_idx"
ON "auth_sessions" USING btree ("expires_at");
--> statement-breakpoint

CREATE UNIQUE INDEX "users_login_name_unique"
ON "users" USING btree ("login_name");
