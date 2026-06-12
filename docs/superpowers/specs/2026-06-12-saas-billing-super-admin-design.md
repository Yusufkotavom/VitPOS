# SaaS Billing, Subscription, and Super Admin Design

Date: 2026-06-12
Status: Approved for planning
Scope: Manual-transfer-first SaaS billing foundation with super-admin-controlled paid activation, renewal, and plan changes.

## 1. Goal

Build complete SaaS billing foundation for KOTACOM Business Suite with these rules:

- Trial activates automatically.
- Paid plan activates only after super admin approves payment.
- Payment method in first phase is manual transfer.
- Super admin controls paid activation, renewal, approval, change plan, support contact, and overrides.
- Expired subscription does not hard-lock app.
- Expiry warning uses closable popup starting 3 days before expiry and continuing after expiry.
- Popup includes renewal guidance, support button, and billing button.
- Support contact is configured by super admin.

## 2. Existing Context

Current implementation already includes:

- plan catalog and subscription fields on tenant
- onboarding billing page
- settings subscription page
- subscription derived state hook
- subscription gate and expired dialog
- platform admin page with tenant and plan management
- subscription API client and platform admin API client
- backend subscription routes under `/api/v1/subscription`

Current gaps:

- no invoice entity
- no payment proof and approval flow
- no plan change request workflow
- no billing settings for support/payment instructions
- no subscription event timeline
- no full renewal workflow
- no tenant-facing payment status lifecycle

## 3. Recommended Approach

Chosen approach: **Billing ledger + request layer**.

Reason:

- fits manual transfer now
- keeps clean history and audit trail
- easy to evolve to payment gateway later
- avoids overbuilding proration and automation too early
- keeps super admin in control of paid lifecycle

## 4. Business Rules

### 4.1 Subscription model

Tenant-facing status derives from tenant subscription fields plus invoice/payment state.

Primary tenant-facing states:

- `trial`
- `active`
- `pending_payment`
- `pending_approval`
- `expired`
- `cancelled`

### 4.2 Trial rules

- New tenant gets trial automatically.
- Trial duration comes from selected plan.
- Warning popup starts at H-3 before `planValidUntil`.
- If no paid approval exists when trial ends, tenant becomes `expired`.
- Trial can convert to paid through invoice + payment approval.

### 4.3 Renewal rules

- Tenant clicks `Perpanjang Paket`.
- System creates renewal invoice.
- Tenant submits payment proof.
- Super admin approves or rejects payment.
- Approval extends `planValidUntil`.
- If still active at approval time, extension starts from current `planValidUntil`.
- If already expired at approval time, extension starts from approval date.

### 4.4 Upgrade rules

- Tenant chooses higher plan.
- System creates `plan_change_request` of type `upgrade`.
- System creates invoice.
- Tenant submits payment proof.
- Super admin approval applies upgrade immediately.
- New limits apply immediately after approval.
- No proration engine in first phase.
- Invoice amount is fixed from selected plan and billing period.

### 4.5 Downgrade rules

- Tenant chooses lower plan.
- System creates `plan_change_request` of type `downgrade`.
- Default behavior: no payment required.
- Request status becomes `scheduled`.
- Downgrade applies when current subscription period ends.
- Super admin can manually override and apply earlier if needed.

### 4.6 Expiry rules

- No read-only mode.
- No hard lock.
- Popup warning starts 3 days before expiry.
- Popup remains available after expiry.
- Popup is closable.
- Popup reappears on later sessions/days while tenant remains unrenewed.
- Popup contains:
  - current expiry message
  - renewal guidance
  - `Hubungi Support` button
  - `Ke Billing` button

### 4.7 Support rules

Support contact is configured by super admin in billing settings.

Supported fields:

- WhatsApp number / link
- support text
- support URL
- payment instructions
- bank account list

If WhatsApp exists, `Hubungi Support` prefers WhatsApp deep link.
Fallback uses support URL or support text.

### 4.8 Audit rules

Every major billing action writes subscription event records and platform audit records.

Event examples:

- invoice created
- payment submitted
- payment approved
- payment rejected
- plan change requested
- plan upgrade applied
- downgrade scheduled
- renewal applied
- support settings changed
- manual admin override

## 5. Data Model Design

### 5.1 Existing tables reused

Keep using existing:

- `tenants`
- `subscription_plans`
- `users`
- `tenant_members`

Tenant retains summary fields such as:

- `planCode`
- `billingPeriod`
- `subscriptionStatus`
- `planValidUntil`
- `storageLimitMb`
- `maxBranches`
- `isActive`

### 5.2 New table: `subscription_invoices`

Purpose: represent billing obligation for new paid subscription, renewal, upgrade, downgrade adjustment, or manual adjustment.

Suggested fields:

- `id`
- `tenantId`
- `invoiceNumber`
- `type`: `new_subscription | renewal | upgrade | downgrade | manual_adjustment`
- `planCode`
- `billingPeriod`
- `amount`
- `status`: `draft | pending_payment | submitted | paid | cancelled | expired`
- `periodStart`
- `periodEnd`
- `dueAt`
- `notes`
- timestamps

### 5.3 New table: `subscription_payments`

Purpose: store payment proof submitted by tenant and reviewed by super admin.

Suggested fields:

- `id`
- `tenantId`
- `invoiceId`
- `amount`
- `method`: `manual_transfer`
- `bankName`
- `accountName`
- `referenceNumber`
- `proofImageUrl` optional
- `proofText` optional
- `status`: `submitted | approved | rejected`
- `submittedByUserId`
- `reviewedByUserId`
- `reviewedAt`
- `reviewNote`
- timestamps

### 5.4 New table: `plan_change_requests`

Purpose: manage safe plan transitions.

Suggested fields:

- `id`
- `tenantId`
- `fromPlanCode`
- `toPlanCode`
- `changeType`: `upgrade | downgrade | renewal`
- `status`: `pending_payment | waiting_approval | approved | rejected | scheduled | applied | cancelled`
- `effectiveAt`
- `invoiceId`
- `requestedByUserId`
- `reviewedByUserId`
- timestamps

### 5.5 New table: `subscription_events`

Purpose: tenant billing timeline and auditable lifecycle history.

Suggested fields:

- `id`
- `tenantId`
- `eventType`
- `actorUserId`
- `metadata` JSON
- `createdAt`

### 5.6 New table: `platform_billing_settings`

Purpose: super admin configurable billing and support information.

Suggested fields:

- `id`
- `supportWhatsapp`
- `supportText`
- `supportUrl`
- `paymentInstructions`
- `bankAccounts` JSON
- timestamps

## 6. API Contract Design

API style follows current `/api/v1` REST-ish convention with JSON envelope:

- `{ ok: boolean, item, message? }`
- `{ ok: boolean, items, message? }`

### 6.1 Tenant-facing endpoints

- `GET /api/v1/subscription/billing-settings`
- `GET /api/v1/subscription/tenants/:id/invoices`
- `POST /api/v1/subscription/tenants/:id/invoices`
- `POST /api/v1/subscription/tenants/:id/payments`
- `POST /api/v1/subscription/tenants/:id/change-plan`
- `GET /api/v1/subscription/tenants/:id/events`

Responsibilities:

- create renewal/upgrade invoice
- fetch invoice list and active invoice
- submit payment proof
- create downgrade request
- fetch billing timeline and support config

### 6.2 Super-admin endpoints

- `GET /api/v1/platform/billing/payments`
- `PATCH /api/v1/platform/billing/payments/:id/approve`
- `PATCH /api/v1/platform/billing/payments/:id/reject`
- `GET /api/v1/platform/billing/invoices`
- `PATCH /api/v1/platform/billing/settings`
- `PATCH /api/v1/platform/tenants/:id/subscription`
- `GET /api/v1/platform/billing/events`

Responsibilities:

- review submitted payments
- approve or reject proofs
- update billing/support settings
- manually override tenant subscription
- browse billing timeline/history

## 7. UX Design

### 7.1 Tenant billing page

Location: `Pengaturan > Billing`

Page shows:

- current plan
- current period and expiry date
- current status
- active invoice or next invoice
- payment instructions
- configured support contact
- billing timeline summary

Primary actions:

- `Perpanjang Paket`
- `Upgrade Paket`
- `Ajukan Downgrade`
- `Upload Bukti Bayar`
- `Hubungi Support`

### 7.2 Payment submit flow

Tenant selects invoice or request context, then fills:

- transfer amount
- sender bank
- account name
- reference number optional
- proof note text
- proof image optional if storage flow exists

After submit:

- payment status becomes `submitted`
- tenant-facing status can show `Menunggu Approval`
- system writes billing event

Success feedback:

`Bukti bayar diterima. Tim kami akan memeriksa pembayaran Anda.`

### 7.3 Expiry popup

Component target: `SubscriptionExpiryDialog` or equivalent replacement.

Trigger conditions:

- 3 days before `planValidUntil`
- on and after expiry while still not renewed

Behavior:

- closable
- non-blocking
- reappears later while unresolved

Content:

- `Paket Anda akan segera berakhir` or `Paket Anda sudah berakhir`
- expiry date / remaining time
- renewal guidance
- support button
- billing button

### 7.4 Super admin billing area

Add dedicated billing section or tabs in `/platform-admin`:

- `Pembayaran`
- `Tagihan`
- `Pengaturan Billing`

`Pembayaran` queue shows:

- tenant name
- invoice number
- plan
- amount
- submitted at
- proof text/image
- payment status
- approve/reject actions

Approve action effects:

- payment becomes `approved`
- invoice becomes `paid`
- related subscription change applies
- tenant summary fields update
- events and audit logs write

Reject action effects:

- payment becomes `rejected`
- review note required or recommended
- invoice stays actionable according to rule
- tenant may resubmit proof

`Pengaturan Billing` lets super admin manage:

- WhatsApp support
- support URL
- support text
- payment instructions
- bank accounts

## 8. Local-First and Sync Strategy

First phase billing does **not** become fully local-first.

Reason:

- payment approval is authoritative on server
- invoice and payment history are cloud authority
- manual transfer workflow is admin-controlled

First phase local behavior:

- continue caching tenant subscription summary locally
- add cached billing settings for popup/support
- fetch invoice/payment/event data from API on demand
- avoid local outbox for billing lifecycle in first phase

Required local additions:

- support WhatsApp
- support text
- support URL
- payment instructions
- optional cached bank account display data

## 9. Affected Areas

Likely backend files:

- `apps/api/src/features/subscription/routes.ts`
- new billing route module(s) under `apps/api/src/features/subscription/` or `apps/api/src/features/platform/`
- `apps/api/src/features/platform/audit.ts`
- `src/db/schema/core.ts`

Likely frontend files:

- `src/features/settings/pages/subscription-page.tsx`
- `src/features/auth/pages/billing-page.tsx`
- `src/features/billing/components/subscription-expired-dialog.tsx`
- `src/features/billing/components/subscription-gate.tsx`
- `src/services/api/subscription.service.ts`
- `src/services/api/platform-admin.service.ts`
- `src/features/platform-admin/pages/platform-admin-page.tsx`
- `src/features/platform-admin/components/tenant-action-dialog.tsx`

Likely local cache files:

- `src/services/local-db/schema.ts`
- `src/services/local-db/dexie-instance.ts`
- `src/services/local-db/adapters/sqlite.adapter.ts`
- `src/services/local-db/adapters/tauri-sql.adapter.ts`

## 10. Testing Strategy

Backend tests:

- invoice creation
- payment submit
- approve payment applies subscription update
- reject payment keeps tenant pending
- downgrade schedules future apply
- billing settings fetch/update
- event log creation

Frontend tests:

- billing page status rendering
- expiry popup timing and closable behavior
- payment submit form validation
- support button resolution
- platform admin payment approval UI
- plan change request flow

Verification target before completion:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## 11. Out of Scope for This Phase

Not included now:

- payment gateway integration
- webhook handling
- automatic reconciliation
- proration engine
- read-only expired mode
- hard-lock expired mode
- automatic dunning/reminders beyond popup
- seat-based dynamic pricing
- full offline billing outbox sync

## 12. Phase Recommendation

Implement in this order:

1. schema + backend billing endpoints
2. tenant billing UX + popup revision
3. super admin payment queue + billing settings
4. tests + verification
5. optional follow-up: receipts, exports, notifications, gateway abstraction
