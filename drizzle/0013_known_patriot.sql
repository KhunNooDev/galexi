CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "word_categories" (
	"word_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "word_categories_word_id_category_id_pk" PRIMARY KEY("word_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "word_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "word_categories" ADD CONSTRAINT "word_categories_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_categories" ADD CONSTRAINT "word_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "categories_sort_order_idx" ON "categories" USING btree ("sort_order","name");--> statement-breakpoint
CREATE INDEX "word_categories_category_id_idx" ON "word_categories" USING btree ("category_id","word_id");--> statement-breakpoint
CREATE POLICY "Admins can manage categories" ON "categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)) WITH CHECK (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role));--> statement-breakpoint
CREATE POLICY "Public can view categories for published words" ON "categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from word_categories wc join words w on w.id = wc.word_id where wc.category_id = "categories"."id" and w.is_public = true));--> statement-breakpoint
CREATE POLICY "Admins can manage word categories" ON "word_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role)) WITH CHECK (exists (select 1 from "user_roles" where "user_roles"."user_id" = (select auth.uid()) and "user_roles"."role" = 'admin'::app_role));--> statement-breakpoint
CREATE POLICY "Public can view categories for published words" ON "word_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (select 1 from "words" where "words"."id" = "word_categories"."word_id" and "words"."is_public" = true));
--> statement-breakpoint
GRANT SELECT ON TABLE "categories" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "categories" TO "authenticated";
--> statement-breakpoint
GRANT USAGE, SELECT ON SEQUENCE "categories_id_seq" TO "authenticated";
--> statement-breakpoint
GRANT SELECT ON TABLE "word_categories" TO "anon", "authenticated";
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "word_categories" TO "authenticated";
--> statement-breakpoint
INSERT INTO "categories" ("name", "slug", "sort_order") VALUES
  ('Colors', 'colors', 0),
  ('Numbers', 'numbers', 1),
  ('Food', 'food', 2),
  ('Rooms', 'rooms', 3),
  ('Clothes', 'clothes', 4),
  ('Family', 'family', 5),
  ('Animals', 'animals', 6),
  ('Transportation', 'transportation', 7),
  ('Weather', 'weather', 8),
  ('Days', 'days', 9),
  ('Months', 'months', 10),
  ('Body', 'body', 11)
ON CONFLICT DO NOTHING;
