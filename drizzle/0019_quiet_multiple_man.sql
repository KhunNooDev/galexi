ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_lesson_key_check" CHECK (length(btrim("learning_sessions"."lesson_key")) > 0);--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_state_type_check" CHECK (jsonb_typeof("learning_sessions"."state") = 'object');--> statement-breakpoint
ALTER POLICY "Users can view their own word progress" ON "user_word_progress" TO authenticated USING ((select auth.uid()) = "user_word_progress"."user_id" and exists (
  select 1
  from "words"
  where "words"."id" = "user_word_progress"."word_id"
    and (
      "words"."is_public" = true
      or exists (
        select 1
        from "user_roles"
        where "user_roles"."user_id" = (select auth.uid())
          and "user_roles"."role" = 'admin'::app_role
      )
    )
));--> statement-breakpoint
ALTER POLICY "Users can create their own word progress" ON "user_word_progress" TO authenticated WITH CHECK ((select auth.uid()) = "user_word_progress"."user_id" and exists (
  select 1
  from "words"
  where "words"."id" = "user_word_progress"."word_id"
    and (
      "words"."is_public" = true
      or exists (
        select 1
        from "user_roles"
        where "user_roles"."user_id" = (select auth.uid())
          and "user_roles"."role" = 'admin'::app_role
      )
    )
));--> statement-breakpoint
ALTER POLICY "Users can update their own word progress" ON "user_word_progress" TO authenticated USING ((select auth.uid()) = "user_word_progress"."user_id" and exists (
  select 1
  from "words"
  where "words"."id" = "user_word_progress"."word_id"
    and (
      "words"."is_public" = true
      or exists (
        select 1
        from "user_roles"
        where "user_roles"."user_id" = (select auth.uid())
          and "user_roles"."role" = 'admin'::app_role
      )
    )
)) WITH CHECK ((select auth.uid()) = "user_word_progress"."user_id" and exists (
  select 1
  from "words"
  where "words"."id" = "user_word_progress"."word_id"
    and (
      "words"."is_public" = true
      or exists (
        select 1
        from "user_roles"
        where "user_roles"."user_id" = (select auth.uid())
          and "user_roles"."role" = 'admin'::app_role
      )
    )
));