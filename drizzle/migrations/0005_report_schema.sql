ALTER TABLE "payments" ADD COLUMN "service_order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "source" varchar(80);--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "paid_total" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_service_order_id_idx" ON "payments" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "payments_purchase_id_idx" ON "payments" USING btree ("purchase_id");
