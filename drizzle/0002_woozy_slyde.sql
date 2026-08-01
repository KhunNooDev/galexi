-- Anonymous tasks cannot be assigned safely after authentication is enabled.
DELETE FROM "tasks" WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;
