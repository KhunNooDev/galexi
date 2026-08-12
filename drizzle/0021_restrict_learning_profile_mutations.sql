-- Custom SQL migration file, put your code below! --
REVOKE INSERT ("user_id", "goal", "level") ON TABLE "public"."learning_profiles" FROM "authenticated";
--> statement-breakpoint
REVOKE UPDATE ("goal", "level") ON TABLE "public"."learning_profiles" FROM "authenticated";
