CREATE TYPE "public"."badge_type" AS ENUM('first_application', 'first_interview', 'first_acceptance', 'applications_10', 'applications_50', 'applications_100', 'streak_7', 'streak_30', 'streak_100', 'cv_created', 'letter_created', 'ai_used', 'profile_complete');--> statement-breakpoint
CREATE TYPE "public"."goal_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('applications_count', 'interviews_count', 'streak_days', 'points_earned');--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"badge_type" "badge_type" NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "goal_type" NOT NULL,
	"period" "goal_period" NOT NULL,
	"target" text NOT NULL,
	"current" text DEFAULT '0' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"points" text NOT NULL,
	"reason" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" text DEFAULT '0' NOT NULL,
	"longest_streak" text DEFAULT '0' NOT NULL,
	"last_activity_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_badges_user_id" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_badges_badge_type" ON "user_badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX "idx_user_badges_unique" ON "user_badges" USING btree ("user_id","badge_type");--> statement-breakpoint
CREATE INDEX "idx_user_goals_user_id" ON "user_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_goals_period" ON "user_goals" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_user_goals_completed" ON "user_goals" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "idx_user_points_user_id" ON "user_points" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_points_created_at" ON "user_points" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_streaks_user_id" ON "user_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_streaks_unique" ON "user_streaks" USING btree ("user_id");