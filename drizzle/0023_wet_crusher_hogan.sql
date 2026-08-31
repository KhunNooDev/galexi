CREATE TYPE "public"."learning_account_transfer_status" AS ENUM('pending', 'consumed', 'expired');--> statement-breakpoint
CREATE TABLE "learning_account_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"source_user_id" uuid NOT NULL,
	"destination_user_id" uuid,
	"status" "learning_account_transfer_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "learning_account_transfers_expiry_check" CHECK ("learning_account_transfers"."expires_at" > "learning_account_transfers"."created_at"),
	CONSTRAINT "learning_account_transfers_consumption_check" CHECK (("learning_account_transfers"."status" = 'consumed'::"learning_account_transfer_status" and "learning_account_transfers"."consumed_at" is not null and "learning_account_transfers"."destination_user_id" is not null) or ("learning_account_transfers"."status" <> 'consumed'::"learning_account_transfer_status" and "learning_account_transfers"."consumed_at" is null))
);
--> statement-breakpoint
ALTER TABLE "learning_account_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "learning_account_transfers" FROM "anon";--> statement-breakpoint
REVOKE ALL ON TABLE "learning_account_transfers" FROM "authenticated";--> statement-breakpoint
ALTER TABLE "learning_account_transfers" ADD CONSTRAINT "learning_account_transfers_source_user_id_users_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_account_transfers" ADD CONSTRAINT "learning_account_transfers_destination_user_id_users_id_fk" FOREIGN KEY ("destination_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_account_transfers_token_hash_uidx" ON "learning_account_transfers" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "learning_account_transfers_source_status_idx" ON "learning_account_transfers" USING btree ("source_user_id","status");--> statement-breakpoint
CREATE INDEX "learning_account_transfers_status_expires_idx" ON "learning_account_transfers" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "learning_account_transfers_destination_idx" ON "learning_account_transfers" USING btree ("destination_user_id");
