ALTER TABLE "learning_account_transfers" DROP CONSTRAINT "learning_account_transfers_destination_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_account_transfers" ADD CONSTRAINT "learning_account_transfers_destination_user_id_users_id_fk" FOREIGN KEY ("destination_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;