ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_completion_check" CHECK (("learning_sessions"."status" = 'completed' and "learning_sessions"."completed_at" is not null) or ("learning_sessions"."status" <> 'completed' and "learning_sessions"."completed_at" is null));--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_state_size_check" CHECK (pg_column_size("learning_sessions"."state") <= 32768);
--> statement-breakpoint
REVOKE UPDATE ("lesson_key") ON TABLE "public"."learning_sessions" FROM "authenticated";
