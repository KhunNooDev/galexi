INSERT INTO "storage"."buckets" (
  "id",
  "name",
  "public",
  "file_size_limit",
  "allowed_mime_types"
)
VALUES (
  'word-images',
  'word-images',
  false,
  5242880,
  ARRAY['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT ("id") DO UPDATE SET
  "public" = EXCLUDED."public",
  "file_size_limit" = EXCLUDED."file_size_limit",
  "allowed_mime_types" = EXCLUDED."allowed_mime_types";--> statement-breakpoint

CREATE POLICY "Admins can view word images"
ON "storage"."objects"
AS PERMISSIVE
FOR SELECT
TO "authenticated"
USING (
  "bucket_id" = 'word-images'
  AND EXISTS (
    SELECT 1
    FROM "public"."user_roles"
    WHERE "user_id" = (SELECT auth.uid())
      AND "role" = 'admin'::"public"."app_role"
  )
);--> statement-breakpoint

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
);--> statement-breakpoint

CREATE POLICY "Admins can upload word images"
ON "storage"."objects"
AS PERMISSIVE
FOR INSERT
TO "authenticated"
WITH CHECK (
  "bucket_id" = 'word-images'
  AND EXISTS (
    SELECT 1
    FROM "public"."user_roles"
    WHERE "user_id" = (SELECT auth.uid())
      AND "role" = 'admin'::"public"."app_role"
  )
);--> statement-breakpoint

CREATE POLICY "Admins can delete word images"
ON "storage"."objects"
AS PERMISSIVE
FOR DELETE
TO "authenticated"
USING (
  "bucket_id" = 'word-images'
  AND EXISTS (
    SELECT 1
    FROM "public"."user_roles"
    WHERE "user_id" = (SELECT auth.uid())
      AND "role" = 'admin'::"public"."app_role"
  )
);
