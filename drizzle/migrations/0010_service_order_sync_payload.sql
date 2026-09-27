ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "timeline" jsonb DEFAULT '[]'::jsonb NOT NULL;
