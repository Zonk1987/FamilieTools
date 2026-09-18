CREATE TABLE "platform_role_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"capability" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_role_capabilities" ADD CONSTRAINT "platform_role_capabilities_role_id_platform_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."platform_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_role_id_platform_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."platform_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_capabilities_role_capability_unique" ON "platform_role_capabilities" USING btree ("role_id","capability");--> statement-breakpoint
CREATE INDEX "platform_role_capabilities_role_id_idx" ON "platform_role_capabilities" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "platform_role_capabilities_capability_idx" ON "platform_role_capabilities" USING btree ("capability");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_roles_key_unique" ON "platform_roles" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_user_roles_user_role_unique" ON "platform_user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "platform_user_roles_user_id_idx" ON "platform_user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_user_roles_role_id_idx" ON "platform_user_roles" USING btree ("role_id");