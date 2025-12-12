CREATE TYPE "public"."import_source" AS ENUM('url', 'text', 'manual');--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "import_source" "import_source";