CREATE TYPE "public"."learning_goal" AS ENUM('daily_conversation', 'travel', 'work', 'school_exam');--> statement-breakpoint
CREATE TYPE "public"."learning_level" AS ENUM('starter', 'beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."learning_session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "learning_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"goal" "learning_goal",
	"level" "learning_level",
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_key" varchar(120) NOT NULL,
	"status" "learning_session_status" DEFAULT 'in_progress' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "learning_sessions_current_step_check" CHECK ("learning_sessions"."current_step" >= 0),
	CONSTRAINT "learning_sessions_score_check" CHECK ("learning_sessions"."score" is null or ("learning_sessions"."score" >= 0 and "learning_sessions"."score" <= 100))
);
--> statement-breakpoint
ALTER TABLE "learning_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_word_progress" (
	"user_id" uuid NOT NULL,
	"word_id" integer NOT NULL,
	"seen_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"mastery" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_word_progress_user_id_word_id_pk" PRIMARY KEY("user_id","word_id"),
	CONSTRAINT "user_word_progress_seen_count_check" CHECK ("user_word_progress"."seen_count" >= 0),
	CONSTRAINT "user_word_progress_correct_count_check" CHECK ("user_word_progress"."correct_count" >= 0),
	CONSTRAINT "user_word_progress_incorrect_count_check" CHECK ("user_word_progress"."incorrect_count" >= 0),
	CONSTRAINT "user_word_progress_mastery_check" CHECK ("user_word_progress"."mastery" >= 0 and "user_word_progress"."mastery" <= 100)
);
--> statement-breakpoint
ALTER TABLE "user_word_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "learning_profiles" ADD CONSTRAINT "learning_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_sessions_user_status_updated_idx" ON "learning_sessions" USING btree ("user_id","status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "learning_sessions_user_started_idx" ON "learning_sessions" USING btree ("user_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_word_progress_word_id_idx" ON "user_word_progress" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "user_word_progress_user_last_seen_idx" ON "user_word_progress" USING btree ("user_id","last_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "Users can view their own learning profile" ON "learning_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "learning_profiles"."user_id");--> statement-breakpoint
CREATE POLICY "Users can create their own learning profile" ON "learning_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "learning_profiles"."user_id");--> statement-breakpoint
CREATE POLICY "Users can update their own learning profile" ON "learning_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "learning_profiles"."user_id") WITH CHECK ((select auth.uid()) = "learning_profiles"."user_id");--> statement-breakpoint
CREATE POLICY "Users can view their own learning sessions" ON "learning_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "learning_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "Users can create their own learning sessions" ON "learning_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "learning_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "Users can update their own learning sessions" ON "learning_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "learning_sessions"."user_id") WITH CHECK ((select auth.uid()) = "learning_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "Users can view their own word progress" ON "user_word_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_word_progress"."user_id");--> statement-breakpoint
CREATE POLICY "Users can create their own word progress" ON "user_word_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "user_word_progress"."user_id");--> statement-breakpoint
CREATE POLICY "Users can update their own word progress" ON "user_word_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "user_word_progress"."user_id") WITH CHECK ((select auth.uid()) = "user_word_progress"."user_id");
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."learning_profiles" TO "authenticated";
--> statement-breakpoint
GRANT INSERT ("user_id", "goal", "level", "onboarding_completed_at") ON TABLE "public"."learning_profiles" TO "authenticated";
--> statement-breakpoint
GRANT UPDATE ("goal", "level", "onboarding_completed_at") ON TABLE "public"."learning_profiles" TO "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."learning_sessions" TO "authenticated";
--> statement-breakpoint
GRANT INSERT ("user_id", "lesson_key", "status", "current_step", "state", "score", "completed_at") ON TABLE "public"."learning_sessions" TO "authenticated";
--> statement-breakpoint
GRANT UPDATE ("lesson_key", "status", "current_step", "state", "score", "completed_at") ON TABLE "public"."learning_sessions" TO "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."user_word_progress" TO "authenticated";
--> statement-breakpoint
GRANT INSERT ("user_id", "word_id", "seen_count", "correct_count", "incorrect_count", "mastery", "last_seen_at") ON TABLE "public"."user_word_progress" TO "authenticated";
--> statement-breakpoint
GRANT UPDATE ("seen_count", "correct_count", "incorrect_count", "mastery", "last_seen_at") ON TABLE "public"."user_word_progress" TO "authenticated";
