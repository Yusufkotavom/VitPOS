ALTER TABLE "payments" ADD COLUMN "date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD COLUMN "date" timestamp with time zone;--> statement-breakpoint
