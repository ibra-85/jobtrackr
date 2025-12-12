CREATE TYPE "public"."company_size" AS ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('startup', 'pme', 'scale_up', 'grand_groupe', 'autre');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('remote', 'hybrid', 'on_site');--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "priority" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "size" "company_size";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "type" "company_type";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "work_mode" "work_mode";--> statement-breakpoint
CREATE INDEX "idx_applications_priority" ON "applications" USING btree ("priority");