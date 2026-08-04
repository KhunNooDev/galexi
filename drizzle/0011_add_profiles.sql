CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(80) DEFAULT '' NOT NULL,
	"avatar_url" varchar(2048) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can view their own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "profiles"."user_id");--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "profiles"."user_id") WITH CHECK ((select auth.uid()) = "profiles"."user_id");--> statement-breakpoint
REVOKE ALL ON TABLE "public"."profiles" FROM "anon";--> statement-breakpoint
REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";--> statement-breakpoint
GRANT UPDATE ("display_name", "avatar_url") ON TABLE "public"."profiles" TO "authenticated";--> statement-breakpoint
CREATE FUNCTION "public"."set_profiles_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "profiles_set_updated_at"
BEFORE UPDATE ON "public"."profiles"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_profiles_updated_at"();
