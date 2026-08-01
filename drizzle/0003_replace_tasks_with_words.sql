ALTER TABLE "tasks" RENAME TO "words";--> statement-breakpoint
ALTER SEQUENCE "tasks_id_seq" RENAME TO "words_id_seq";--> statement-breakpoint
ALTER TABLE "words" RENAME COLUMN "title" TO "word";--> statement-breakpoint
ALTER TABLE "words" RENAME COLUMN "description" TO "example_sentence";--> statement-breakpoint
ALTER TABLE "words" ALTER COLUMN "word" TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "pronunciation_ipa" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "pronunciation_thai" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "part_of_speech" varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "meanings_th" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "example_sentence_meaning_th" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "image_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER INDEX "tasks_user_created_idx" RENAME TO "words_user_created_idx";--> statement-breakpoint
ALTER POLICY "Users can manage their own tasks" ON "words" RENAME TO "Users can manage their own words";
