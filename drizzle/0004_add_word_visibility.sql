ALTER TABLE "words" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
WITH "duplicate_words" AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY "user_id", lower("word"), lower("part_of_speech")
			ORDER BY "created_at", "id"
		) AS "duplicate_number"
	FROM "words"
)
UPDATE "words"
SET "part_of_speech" = concat('legacy #', "words"."id")
FROM "duplicate_words"
WHERE "words"."id" = "duplicate_words"."id"
	AND "duplicate_words"."duplicate_number" > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "words_user_word_part_unique" ON "words" USING btree ("user_id",lower("word"),lower("part_of_speech"));--> statement-breakpoint
CREATE POLICY "Public can view published words" ON "words" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("words"."is_public" = true);
