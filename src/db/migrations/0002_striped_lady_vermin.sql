CREATE TYPE "public"."application_source" AS ENUM('linkedin', 'indeed', 'welcome_to_the_jungle', 'site_carriere', 'cooptation', 'email', 'autre');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('cdi', 'cdd', 'stage', 'alternance', 'freelance', 'autre');--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'application_deleted' BEFORE 'interview_scheduled';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "applied_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "contract_type" "contract_type";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "salary_range" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "source" "application_source";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "job_url" text;