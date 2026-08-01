UPDATE "storage"."buckets"
SET "public" = false
WHERE "id" = 'word-images';--> statement-breakpoint

GRANT SELECT ON TABLE "public"."user_roles" TO "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "public"."words" TO "anon", "authenticated";--> statement-breakpoint

UPDATE "public"."words"
SET "image_url" = split_part(
  "image_url",
  '/storage/v1/object/public/word-images/',
  2
)
WHERE "image_url" LIKE '%/storage/v1/object/public/word-images/%';--> statement-breakpoint

DROP POLICY IF EXISTS "Public can view published word images"
ON "storage"."objects";--> statement-breakpoint

CREATE POLICY "Public can view published word images"
ON "storage"."objects"
AS PERMISSIVE
FOR SELECT
TO "anon", "authenticated"
USING (
  "bucket_id" = 'word-images'
  AND EXISTS (
    SELECT 1
    FROM "public"."words"
    WHERE "is_public" = true
      AND "image_url" = "storage"."objects"."name"
  )
);
