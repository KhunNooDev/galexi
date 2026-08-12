REVOKE ALL PRIVILEGES ON TABLE "public"."learning_profiles" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."learning_sessions" FROM "anon", "authenticated";
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE "public"."user_word_progress" FROM "anon", "authenticated";
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
GRANT UPDATE ("status", "current_step", "state", "score", "completed_at") ON TABLE "public"."learning_sessions" TO "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."user_word_progress" TO "authenticated";
--> statement-breakpoint
GRANT INSERT ("user_id", "word_id", "seen_count", "correct_count", "incorrect_count", "mastery", "last_seen_at") ON TABLE "public"."user_word_progress" TO "authenticated";
--> statement-breakpoint
GRANT UPDATE ("seen_count", "correct_count", "incorrect_count", "mastery", "last_seen_at") ON TABLE "public"."user_word_progress" TO "authenticated";
