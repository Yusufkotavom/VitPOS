ALTER TABLE "products" ADD COLUMN "wholesale_tiers" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manage_stock" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "icon" varchar(80);