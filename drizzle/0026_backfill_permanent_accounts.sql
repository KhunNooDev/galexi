INSERT INTO "user_roles" ("user_id", "role")
SELECT "id", 'member'::"app_role"
FROM "auth"."users"
WHERE "is_anonymous" IS NOT TRUE
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "profiles" ("user_id")
SELECT "id"
FROM "auth"."users"
WHERE "is_anonymous" IS NOT TRUE
ON CONFLICT ("user_id") DO NOTHING;
