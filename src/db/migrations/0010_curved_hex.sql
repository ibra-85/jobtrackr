CREATE TYPE "public"."document_format" AS ENUM('markdown', 'plain_text', 'html');--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "document_type" NOT NULL,
	"format" "document_format" DEFAULT 'markdown' NOT NULL,
	"content" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"user_id" text,
	"thumbnail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"format" "document_format" NOT NULL,
	"changelog" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "format" "document_format" DEFAULT 'plain_text' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_document_templates_type" ON "document_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_document_templates_is_public" ON "document_templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_document_versions_document_id" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("type");