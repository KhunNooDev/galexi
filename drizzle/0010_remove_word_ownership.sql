ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "words_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "tasks_user_id_users_id_fk";--> statement-breakpoint
DROP INDEX "words_user_created_idx";--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "user_id";
