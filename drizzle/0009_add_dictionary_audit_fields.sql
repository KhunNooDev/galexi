ALTER TABLE "words" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
UPDATE "words"
SET
	"created_by" = "user_id",
	"updated_by" = "user_id";--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "words_created_at_idx" ON "words" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "words_created_by_idx" ON "words" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "words_updated_by_idx" ON "words" USING btree ("updated_by");
