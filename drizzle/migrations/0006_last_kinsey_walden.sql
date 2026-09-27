ALTER TABLE "outbox_logs" ALTER COLUMN "entity_id" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "service_order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "source" varchar(80);--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "paid_total" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_service_order_id_idx" ON "payments" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_purchase_id_idx" ON "payments" USING btree ("purchase_id");
