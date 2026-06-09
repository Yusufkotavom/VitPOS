CREATE TYPE "public"."billing_period" AS ENUM('monthly', 'yearly');--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "billing_period" "billing_period" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "duration_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "trial_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "yearly_price" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_period" "billing_period" DEFAULT 'monthly' NOT NULL;