CREATE TYPE "public"."app_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" "app_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT ON TABLE "public"."user_roles" TO "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."words" TO "anon", "authenticated";--> statement-breakpoint
DROP INDEX "words_user_word_part_unique";--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
WITH "duplicate_words" AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY lower("word"), lower("part_of_speech")
			ORDER BY "created_at", "id"
		) AS "duplicate_number"
	FROM "words"
)
UPDATE "words"
SET "part_of_speech" = concat(
	left("words"."part_of_speech", 60),
	CASE WHEN "words"."part_of_speech" = '' THEN 'legacy ' ELSE ' ' END,
	'#',
	"words"."id"
)
FROM "duplicate_words"
WHERE "words"."id" = "duplicate_words"."id"
	AND "duplicate_words"."duplicate_number" > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "words_word_part_unique" ON "words" USING btree (lower("word"),lower("part_of_speech"));--> statement-breakpoint
CREATE POLICY "Users can view their own role" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_roles"."user_id");--> statement-breakpoint
ALTER POLICY "Users can manage their own words" ON "words" RENAME TO "Admins can manage words";--> statement-breakpoint
ALTER POLICY "Admins can manage words" ON "words" TO authenticated USING (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)) WITH CHECK (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role));--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role")
SELECT "id", 'member'::"app_role"
FROM "auth"."users"
ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role")
SELECT "id", 'admin'::"app_role"
FROM "auth"."users"
WHERE "id" = 'd18fac51-3dc7-4438-8092-9a554556a469'::uuid
ON CONFLICT ("user_id") DO UPDATE SET "role" = EXCLUDED."role";
