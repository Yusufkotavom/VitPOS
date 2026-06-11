ALTER TABLE "outbox_logs" DROP CONSTRAINT "outbox_logs_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "outbox_logs" DROP CONSTRAINT "outbox_logs_branch_id_branches_id_fk";
