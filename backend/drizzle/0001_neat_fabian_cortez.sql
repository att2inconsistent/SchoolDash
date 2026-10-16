ALTER TYPE "public"."order_status" ADD VALUE 'Dibatalkan';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "gateway" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "gateway_ref" text;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_gateway_ref_uq" ON "transactions" USING btree ("gateway_ref");