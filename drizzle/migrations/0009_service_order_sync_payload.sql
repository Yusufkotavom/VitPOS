ALTER TABLE "service_orders" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN "timeline" jsonb DEFAULT '[]'::jsonb NOT NULL;
