ALTER TABLE "tasks" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_user_created_idx" ON "tasks" USING btree ("user_id","created_at","id");--> statement-breakpoint
CREATE POLICY "Users can manage their own tasks" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "tasks"."user_id") WITH CHECK ((select auth.uid()) = "tasks"."user_id");