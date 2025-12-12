ALTER TYPE "public"."activity_type" ADD VALUE 'contact_added';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'contact_updated';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'contact_deleted';--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration" text,
	"location" text,
	"type" text,
	"interviewer_name" text,
	"interviewer_email" text,
	"notes" text,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_interviews_application_id" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_user_id" ON "interviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_scheduled_at" ON "interviews" USING btree ("scheduled_at");