-- Preserve source cardinalities before changing any relationship.
CREATE TEMP TABLE "word_sense_migration_counts" ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM "words")::bigint AS "old_sense_count",
  (SELECT count(DISTINCT lower("word")) FROM "words")::bigint AS "canonical_word_count",
  (SELECT count(*) FROM "user_word_progress")::bigint AS "progress_count",
  (SELECT count(*) FROM "word_categories")::bigint AS "category_mapping_count";
--> statement-breakpoint

-- Drop policies that depend on sense-specific columns before those columns move.
DROP POLICY "Public can view published words" ON "words";
--> statement-breakpoint
DROP POLICY "Public can view categories for published words" ON "categories";
--> statement-breakpoint
DROP POLICY "Admins can manage word categories" ON "word_categories";
--> statement-breakpoint
DROP POLICY "Public can view categories for published words" ON "word_categories";
--> statement-breakpoint
DROP POLICY "Users can view their own word progress" ON "user_word_progress";
--> statement-breakpoint
DROP POLICY "Users can create their own word progress" ON "user_word_progress";
--> statement-breakpoint
DROP POLICY "Users can update their own word progress" ON "user_word_progress";
--> statement-breakpoint
DROP POLICY "Public can view published word images" ON "storage"."objects";
--> statement-breakpoint

CREATE TABLE "word_senses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "word_senses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"word_id" integer NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"pronunciation_ipa" varchar(160) DEFAULT '' NOT NULL,
	"pronunciation_thai" varchar(160) DEFAULT '' NOT NULL,
	"part_of_speech" varchar(80) DEFAULT '' NOT NULL,
	"sense_order" integer DEFAULT 1 NOT NULL,
	"meanings_th" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"example_sentence" text DEFAULT '' NOT NULL,
	"example_sentence_meaning_th" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "word_senses_sense_order_check" CHECK ("word_senses"."sense_order" > 0)
);
--> statement-breakpoint
ALTER TABLE "word_senses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Each old vocabulary row becomes one sense. Its ID is preserved so existing
-- learning session JSON and hard-coded lesson IDs remain valid.
INSERT INTO "word_senses" (
  "id",
  "word_id",
  "created_by",
  "updated_by",
  "pronunciation_ipa",
  "pronunciation_thai",
  "part_of_speech",
  "sense_order",
  "meanings_th",
  "example_sentence",
  "example_sentence_meaning_th",
  "image_url",
  "is_public",
  "created_at",
  "updated_at"
)
OVERRIDING SYSTEM VALUE
SELECT
  source."id",
  min(source."id") OVER (PARTITION BY lower(source."word")),
  source."created_by",
  source."updated_by",
  source."pronunciation_ipa",
  source."pronunciation_thai",
  source."part_of_speech",
  row_number() OVER (
    PARTITION BY lower(source."word"), lower(source."part_of_speech")
    ORDER BY source."id"
  )::integer,
  source."meanings_th",
  source."example_sentence",
  source."example_sentence_meaning_th",
  source."image_url",
  source."is_public",
  source."created_at",
  source."updated_at"
FROM "words" source
ORDER BY source."id";
--> statement-breakpoint

SELECT setval(
  pg_get_serial_sequence('public.word_senses', 'id'),
  coalesce((SELECT max("id") FROM "word_senses"), 1),
  EXISTS (SELECT 1 FROM "word_senses")
);
--> statement-breakpoint

ALTER TABLE "word_categories" RENAME TO "word_sense_categories";
--> statement-breakpoint
ALTER TABLE "user_word_progress" RENAME COLUMN "word_id" TO "word_sense_id";
--> statement-breakpoint
ALTER TABLE "word_sense_categories" RENAME COLUMN "word_id" TO "word_sense_id";
--> statement-breakpoint

ALTER TABLE "user_word_progress" DROP CONSTRAINT "user_word_progress_word_id_words_id_fk";
--> statement-breakpoint
ALTER TABLE "word_sense_categories" DROP CONSTRAINT "word_categories_word_id_words_id_fk";
--> statement-breakpoint
ALTER TABLE "word_sense_categories" DROP CONSTRAINT "word_categories_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "user_word_progress_word_id_idx";
--> statement-breakpoint
DROP INDEX "word_categories_category_id_idx";
--> statement-breakpoint
DROP INDEX "words_public_word_idx";
--> statement-breakpoint
DROP INDEX "words_word_part_unique";
--> statement-breakpoint
ALTER TABLE "user_word_progress" DROP CONSTRAINT "user_word_progress_user_id_word_id_pk";
--> statement-breakpoint
ALTER TABLE "word_sense_categories" DROP CONSTRAINT "word_categories_word_id_category_id_pk";
--> statement-breakpoint

-- Keep the lowest old ID as the canonical spelling row and remove duplicates
-- only after every old row has been copied to word_senses.
DELETE FROM "words" duplicate
USING "words" canonical
WHERE lower(duplicate."word") = lower(canonical."word")
  AND duplicate."id" > canonical."id";
--> statement-breakpoint

ALTER TABLE "words" DROP COLUMN "pronunciation_ipa";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "pronunciation_thai";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "part_of_speech";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "meanings_th";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "example_sentence";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "example_sentence_meaning_th";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "image_url";
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "is_public";
--> statement-breakpoint

ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_user_id_word_sense_id_pk" PRIMARY KEY("user_id","word_sense_id");
--> statement-breakpoint
ALTER TABLE "word_sense_categories" ADD CONSTRAINT "word_sense_categories_word_sense_id_category_id_pk" PRIMARY KEY("word_sense_id","category_id");
--> statement-breakpoint
ALTER TABLE "word_senses" ADD CONSTRAINT "word_senses_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "word_senses" ADD CONSTRAINT "word_senses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "word_senses" ADD CONSTRAINT "word_senses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_word_progress" ADD CONSTRAINT "user_word_progress_word_sense_id_word_senses_id_fk" FOREIGN KEY ("word_sense_id") REFERENCES "public"."word_senses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "word_sense_categories" ADD CONSTRAINT "word_sense_categories_word_sense_id_word_senses_id_fk" FOREIGN KEY ("word_sense_id") REFERENCES "public"."word_senses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "word_sense_categories" ADD CONSTRAINT "word_sense_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "word_senses_word_id_idx" ON "word_senses" USING btree ("word_id");
--> statement-breakpoint
CREATE INDEX "word_senses_created_at_idx" ON "word_senses" USING btree ("created_at","id");
--> statement-breakpoint
CREATE INDEX "word_senses_created_by_idx" ON "word_senses" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "word_senses_updated_by_idx" ON "word_senses" USING btree ("updated_by");
--> statement-breakpoint
CREATE INDEX "word_senses_public_word_idx" ON "word_senses" USING btree ("word_id","part_of_speech","sense_order","id") WHERE "word_senses"."is_public" = true;
--> statement-breakpoint
CREATE UNIQUE INDEX "word_senses_word_part_order_unique" ON "word_senses" USING btree ("word_id",lower("part_of_speech"),"sense_order");
--> statement-breakpoint
CREATE INDEX "user_word_progress_word_sense_id_idx" ON "user_word_progress" USING btree ("word_sense_id");
--> statement-breakpoint
CREATE INDEX "word_sense_categories_category_id_idx" ON "word_sense_categories" USING btree ("category_id","word_sense_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "words_word_unique" ON "words" USING btree (lower("word"));
--> statement-breakpoint

CREATE POLICY "Public can view words with published senses" ON "words" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
  exists (
    select 1 from "word_senses"
    where "word_senses"."word_id" = "words"."id"
      and "word_senses"."is_public" = true
  )
);
--> statement-breakpoint
CREATE POLICY "Admins can manage word senses" ON "word_senses" AS PERMISSIVE FOR ALL TO "authenticated" USING (
  exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
) WITH CHECK (
  exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
);
--> statement-breakpoint
CREATE POLICY "Public can view published word senses" ON "word_senses" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("word_senses"."is_public" = true);
--> statement-breakpoint
CREATE POLICY "Public can view published word images" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
  "bucket_id" = 'word-images'
  and exists (
    select 1 from "public"."word_senses"
    where "word_senses"."is_public" = true
      and "word_senses"."image_url" = "storage"."objects"."name"
  )
);
--> statement-breakpoint
CREATE POLICY "Admins can manage word sense categories" ON "word_sense_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (
  exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
) WITH CHECK (
  exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
);
--> statement-breakpoint
CREATE POLICY "Public can view categories for published word senses" ON "word_sense_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
  exists (select 1 from "word_senses" where "word_senses"."id" = "word_sense_categories"."word_sense_id" and "word_senses"."is_public" = true)
);
--> statement-breakpoint
CREATE POLICY "Public can view categories for published words" ON "categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
  exists (
    select 1
    from "word_sense_categories" relationship
    join "word_senses" sense on sense."id" = relationship."word_sense_id"
    where relationship."category_id" = "categories"."id"
      and sense."is_public" = true
  )
);
--> statement-breakpoint
CREATE POLICY "Users can view their own word progress" ON "user_word_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
  (select auth.uid()) = "user_word_progress"."user_id"
  and exists (
    select 1 from "word_senses"
    where "word_senses"."id" = "user_word_progress"."word_sense_id"
      and (
        "word_senses"."is_public" = true
        or exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
      )
  )
);
--> statement-breakpoint
CREATE POLICY "Users can create their own word progress" ON "user_word_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  (select auth.uid()) = "user_word_progress"."user_id"
  and exists (
    select 1 from "word_senses"
    where "word_senses"."id" = "user_word_progress"."word_sense_id"
      and (
        "word_senses"."is_public" = true
        or exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
      )
  )
);
--> statement-breakpoint
CREATE POLICY "Users can update their own word progress" ON "user_word_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
  (select auth.uid()) = "user_word_progress"."user_id"
  and exists (
    select 1 from "word_senses"
    where "word_senses"."id" = "user_word_progress"."word_sense_id"
      and (
        "word_senses"."is_public" = true
        or exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
      )
  )
) WITH CHECK (
  (select auth.uid()) = "user_word_progress"."user_id"
  and exists (
    select 1 from "word_senses"
    where "word_senses"."id" = "user_word_progress"."word_sense_id"
      and (
        "word_senses"."is_public" = true
        or exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)
      )
  )
);
--> statement-breakpoint

-- Explicit grants keep Data API exposure intentional after Supabase's 2026
-- default-privilege change. RLS remains authoritative for row access.
REVOKE ALL PRIVILEGES ON TABLE "public"."words", "public"."word_senses", "public"."word_sense_categories" FROM "anon", "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "public"."words", "public"."word_senses", "public"."word_sense_categories" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "public"."words", "public"."word_senses", "public"."word_sense_categories" TO "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "public"."words_id_seq", "public"."word_senses_id_seq" TO "authenticated";
--> statement-breakpoint

-- Abort the migration if any source row or relationship was lost.
DO $$
DECLARE
  expected "word_sense_migration_counts"%ROWTYPE;
BEGIN
  SELECT * INTO expected FROM "word_sense_migration_counts";

  IF (SELECT count(*) FROM "word_senses") <> expected."old_sense_count" THEN
    RAISE EXCEPTION 'word_senses migration count mismatch';
  END IF;

  IF (SELECT count(*) FROM "words") <> expected."canonical_word_count" THEN
    RAISE EXCEPTION 'canonical words migration count mismatch';
  END IF;

  IF (SELECT count(*) FROM "user_word_progress") <> expected."progress_count" THEN
    RAISE EXCEPTION 'user_word_progress migration count mismatch';
  END IF;

  IF (SELECT count(*) FROM "word_sense_categories") <> expected."category_mapping_count" THEN
    RAISE EXCEPTION 'word_sense_categories migration count mismatch';
  END IF;
END
$$;
