# SaaS Billing Super Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build manual-transfer SaaS billing with invoices, payment proof, super-admin approval, plan changes, expiry warning popup, and configurable support/payment settings.

**Architecture:** Server is source of truth for billing. Tenant UI creates invoices, payment submissions, and plan-change requests through `/api/v1/subscription`; super admin reviews payments and settings through `/api/v1/platform/billing`. Local DB keeps tenant subscription summary; invoice/payment/change history stays cloud-authoritative.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, Hono API, Drizzle ORM, PostgreSQL schema, Vitest.

---

## File Structure Map

### Backend
- Modify: `src/db/schema/core.ts` — add billing enums/tables.
- Verify: `src/db/schema/index.ts` — ensure schema exports.
- Create: `apps/api/src/features/subscription/billing.ts` — tenant billing routes.
- Modify: `apps/api/src/features/subscription/routes.ts` — mount tenant billing routes.
- Create: `apps/api/src/features/platform/billing-routes.ts` — super admin billing routes.
- Modify: `apps/api/src/app.ts` — mount platform billing routes.
- Test: `apps/api/src/features/subscription/billing.test.ts`.
- Test: `apps/api/src/features/platform/billing-routes.test.ts`.

### Frontend API
- Modify: `src/services/api/subscription.service.ts` — add billing types and tenant methods.
- Modify: `src/services/api/platform-admin.service.ts` — add platform billing methods.

### Tenant UI
- Modify: `src/features/settings/pages/subscription-page.tsx`.
- Create: `src/features/settings/components/payment-proof-form.tsx`.
- Create: `src/features/settings/components/billing-invoice-list.tsx`.
- Create: `src/features/settings/components/billing-support-card.tsx`.
- Modify: `src/features/billing/components/subscription-expired-dialog.tsx`.
- Modify: `src/features/billing/components/subscription-gate.tsx`.
- Modify: `src/features/settings/hooks/use-subscription.ts`.
- Test: `src/features/settings/pages/subscription-page.test.tsx`.
- Test: `src/features/billing/components/subscription-expired-dialog.test.tsx`.

### Super Admin UI
- Modify: `src/features/platform-admin/pages/platform-admin-page.tsx`.
- Create: `src/features/platform-admin/components/billing-payment-queue.tsx`.
- Create: `src/features/platform-admin/components/billing-settings-form.tsx`.
- Create: `src/features/platform-admin/components/billing-invoice-table.tsx`.
- Test: `src/features/platform-admin/components/billing-payment-queue.test.tsx`.
- Test: `src/features/platform-admin/components/billing-settings-form.test.tsx`.

---

## Task 1: Billing Schema

**Files:**
- Modify: `src/db/schema/core.ts`
- Verify: `src/db/schema/index.ts`

- [ ] **Step 1: Add enum definitions near existing subscription enums**

Add:

```ts
export const subscriptionInvoiceTypeEnum = pgEnum('subscription_invoice_type', ['new_subscription', 'renewal', 'upgrade', 'downgrade', 'manual_adjustment'])
export const subscriptionInvoiceStatusEnum = pgEnum('subscription_invoice_status', ['draft', 'pending_payment', 'submitted', 'paid', 'cancelled', 'expired'])
export const subscriptionPaymentMethodEnum = pgEnum('subscription_payment_method', ['manual_transfer'])
export const subscriptionPaymentStatusEnum = pgEnum('subscription_payment_status', ['submitted', 'approved', 'rejected'])
export const planChangeTypeEnum = pgEnum('plan_change_type', ['upgrade', 'downgrade', 'renewal'])
export const planChangeStatusEnum = pgEnum('plan_change_status', ['pending_payment', 'waiting_approval', 'approved', 'rejected', 'scheduled', 'applied', 'cancelled'])
```

Update `subscriptionStatusEnum`:

```ts
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trial', 'active', 'pending_payment', 'pending_approval', 'expired', 'past_due', 'suspended', 'cancelled'])
```

- [ ] **Step 2: Add billing tables after `subscriptionPlans`**

Add tables:
- `subscriptionInvoices`
- `subscriptionPayments`
- `planChangeRequests`
- `subscriptionEvents`
- `platformBillingSettings`

Use fields from spec file `docs/superpowers/specs/2026-06-12-saas-billing-super-admin-design.md`, section 5. Use `uuid`, `varchar`, `numeric`, `timestamp`, `jsonb`, `text`, `index`, and existing `timestamps` helper.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: schema compiles. If exports missing, update `src/db/schema/index.ts` using existing export pattern.

---

## Task 2: Tenant Billing API

**Files:**
- Create: `apps/api/src/features/subscription/billing.ts`
- Modify: `apps/api/src/features/subscription/routes.ts`
- Test: `apps/api/src/features/subscription/billing.test.ts`

- [ ] **Step 1: Write failing tests**

Use `apps/api/src/app.test.ts` patterns. Cover:
- `GET /api/v1/subscription/billing-settings`
- `POST /api/v1/subscription/tenants/:tenantId/invoices` creates pending invoice and sets tenant `pending_payment`.
- `POST /api/v1/subscription/tenants/:tenantId/payments` creates submitted payment and sets tenant `pending_approval`.
- `POST /api/v1/subscription/tenants/:tenantId/change-plan` creates upgrade invoice or scheduled downgrade.

Run: `npm test -- apps/api/src/features/subscription/billing.test.ts`
Expected: fail with 404 or missing route.

- [ ] **Step 2: Implement route helpers**

Create `subscriptionBillingRoutes` Hono router. Include:
- `requireTenantOwnerOrAdmin(userId, tenantId)` copied from current subscription route.
- `addDays(date, days)`.
- `invoiceNumber()` using `INV-YYYYMMDD-RANDOM`.
- `writeSubscriptionEvent({ tenantId, actorUserId, eventType, metadata })`.

- [ ] **Step 3: Implement tenant endpoints**

Add:
- `GET /billing-settings`
- `GET /tenants/:tenantId/invoices`
- `GET /tenants/:tenantId/events`
- `POST /tenants/:tenantId/invoices`
- `POST /tenants/:tenantId/payments`
- `POST /tenants/:tenantId/change-plan`

Validation:
- invoice body: `type`, `planCode`, `billingPeriod`.
- payment body: `invoiceId`, `amount`, optional `bankName`, `accountName`, `referenceNumber`, `proofImageUrl`, `proofText`; require `proofImageUrl` or `proofText`.
- change plan body: `toPlanCode`, `changeType`, `billingPeriod`.

Side effects:
- invoice creation writes `subscriptionInvoices`, tenant status `pending_payment`, subscription event, audit log.
- payment submission writes `subscriptionPayments`, invoice status `submitted`, tenant status `pending_approval`, subscription event, audit log.
- upgrade/renewal creates invoice + plan change request.
- downgrade creates scheduled plan change request, no payment.

- [ ] **Step 4: Mount routes**

In `apps/api/src/features/subscription/routes.ts`:

```ts
import { subscriptionBillingRoutes } from './billing.js'
subscriptionRoutes.route('/', subscriptionBillingRoutes)
```

Place after auth middleware.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- apps/api/src/features/subscription/billing.test.ts
npm run typecheck
```

Expected: tests pass, typecheck clean.

---

## Task 3: Super Admin Billing API

**Files:**
- Create: `apps/api/src/features/platform/billing-routes.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/features/platform/billing-routes.test.ts`

- [ ] **Step 1: Write failing tests**

Use `apps/api/src/app.test.ts` patterns. Cover:
- platform admin can list payments.
- non-platform admin receives 403.
- approve payment marks payment approved, invoice paid, tenant active, plan applied.
- reject payment marks payment rejected and invoice pending_payment.
- update billing settings stores support/payment config.

Run: `npm test -- apps/api/src/features/platform/billing-routes.test.ts`
Expected: fail before routes exist.

- [ ] **Step 2: Implement platform router**

Create `platformBillingRoutes` with:
- `requirePlatformAdmin(userId)` checks `users.role === 'platform_admin'`.
- list endpoints for payments, invoices, events.
- `PATCH /settings` upserts `platformBillingSettings` and writes audit.
- `PATCH /payments/:paymentId/approve` applies billing lifecycle.
- `PATCH /payments/:paymentId/reject` requires `reviewNote`.

Approval behavior:
- payment `approved`
- invoice `paid`
- tenant `active`
- tenant plan/period/limits updated from invoice plan
- `planValidUntil` extends from current future validity or approval date
- matching plan change request becomes `applied`
- subscription event and audit log written

Reject behavior:
- payment `rejected`
- invoice back to `pending_payment`
- subscription event and audit log written

- [ ] **Step 3: Mount routes**

In `apps/api/src/app.ts` or platform route mount file:

```ts
app.route('/api/v1/platform/billing', platformBillingRoutes)
```

Use existing auth middleware pattern.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- apps/api/src/features/platform/billing-routes.test.ts
npm run typecheck
```

Expected: tests pass, typecheck clean.

---

## Task 4: Frontend API Clients

**Files:**
- Modify: `src/services/api/subscription.service.ts`
- Modify: `src/services/api/platform-admin.service.ts`

- [ ] **Step 1: Add tenant billing types**

Add exported types:
- `BillingSettings`
- `SubscriptionInvoice`
- `SubscriptionPayment`
- `PlanChangeRequest`
- `SubscriptionEvent`

Use exact statuses from spec sections 5 and 6.

- [ ] **Step 2: Add tenant service methods**

Add to `subscriptionService`:
- `getBillingSettings()`
- `listInvoices(tenantId)`
- `createInvoice(input)`
- `submitPayment(input)`
- `changePlan(input)`
- `listEvents(tenantId)`

- [ ] **Step 3: Add platform billing service methods**

Add to `platform-admin.service.ts`:
- `listBillingPayments()`
- `approveBillingPayment(paymentId)`
- `rejectBillingPayment(paymentId, reviewNote)`
- `listBillingInvoices()`
- `listBillingEvents()`
- `getBillingSettings()` if needed by admin page
- `updateBillingSettings(input)`

Use existing `apiGet`, `apiPost`, `apiPatch`, `apiDelete` import style.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: API clients compile.

---

## Task 5: Tenant Billing UX

**Files:**
- Modify: `src/features/settings/pages/subscription-page.tsx`
- Create: `src/features/settings/components/payment-proof-form.tsx`
- Create: `src/features/settings/components/billing-invoice-list.tsx`
- Create: `src/features/settings/components/billing-support-card.tsx`
- Test: `src/features/settings/pages/subscription-page.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Cover:
- payment instructions and support actions render.
- invoice list renders pending invoice.
- payment proof submission calls service.
- selecting paid plan creates plan-change request, not direct activation.

Run: `npm test -- src/features/settings/pages/subscription-page.test.tsx`
Expected: fail before implementation.

- [ ] **Step 2: Create `billing-support-card.tsx`**

Implement card with Indonesian labels:
- title `Bantuan & Pembayaran`
- payment instructions
- bank account list
- `Hubungi Support` WhatsApp button
- fallback support URL button

Export helper `makeWhatsappUrl(value?: string | null)`.

- [ ] **Step 3: Create `billing-invoice-list.tsx`**

Render:
- empty state `Belum ada tagihan.`
- invoice number
- plan code
- formatted Rupiah amount
- status badge
- `Upload Bukti` action for `pending_payment` and `submitted`.

- [ ] **Step 4: Create `payment-proof-form.tsx`**

Fields:
- nominal transfer
- bank pengirim
- nama pemilik rekening
- nomor referensi
- catatan bukti transfer

Submit disabled until `proofText.trim()` exists.

- [ ] **Step 5: Wire subscription page**

Add queries:
- plans
- billing settings
- invoices

Add mutations:
- `changePlan`
- `submitPayment`

UI behavior:
- `Perpanjang Paket` creates renewal/change request.
- `Pilih Paket` for non-current paid plan creates upgrade/downgrade request based on price/plan ordering.
- `Upload Bukti Bayar` opens form for selected invoice.
- success invalidates invoices and tenant query/cache where available.

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- src/features/settings/pages/subscription-page.test.tsx
npm run typecheck
```

Expected: tests pass, typecheck clean.

---

## Task 6: Non-blocking Expiry Popup

**Files:**
- Modify: `src/features/settings/hooks/use-subscription.ts`
- Modify: `src/features/billing/components/subscription-expired-dialog.tsx`
- Modify: `src/features/billing/components/subscription-gate.tsx`
- Test: `src/features/settings/hooks/use-subscription.test.ts`
- Test: `src/features/billing/components/subscription-expired-dialog.test.tsx`

- [ ] **Step 1: Write failing tests**

Cover:
- H-3 sets `isExpiringSoon` true.
- expired subscription does not set hard enforcement.
- dialog closable.
- dialog buttons link to billing and support.

Run relevant tests. Expected fail before implementation.

- [ ] **Step 2: Update hook**

Return:
- `isExpiringSoon`
- `warningKind: 'expiring' | 'expired' | null`
- `isEnforced: false` for expired/cancelled/past_due unless future config says otherwise.

- [ ] **Step 3: Update dialog**

Dialog behavior:
- title `Paket Anda akan segera berakhir` for warning.
- title `Paket Anda sudah berakhir` for expired.
- closable.
- stores daily dismissal in localStorage key `subscription-warning-dismissed-${tenantId}-${YYYY-MM-DD}`.
- `Ke Billing` links `/settings/billing`.
- `Hubungi Support` uses billing settings WhatsApp/support URL.

- [ ] **Step 4: Update gate**

`SubscriptionGate` must always render children. Warning dialog overlays without blocking app.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- src/features/settings/hooks/use-subscription.test.ts src/features/billing/components/subscription-expired-dialog.test.tsx
npm run typecheck
```

Expected: tests pass, typecheck clean.

---

## Task 7: Super Admin Billing UI

**Files:**
- Modify: `src/features/platform-admin/pages/platform-admin-page.tsx`
- Create: `src/features/platform-admin/components/billing-payment-queue.tsx`
- Create: `src/features/platform-admin/components/billing-settings-form.tsx`
- Create: `src/features/platform-admin/components/billing-invoice-table.tsx`
- Test: `src/features/platform-admin/components/billing-payment-queue.test.tsx`
- Test: `src/features/platform-admin/components/billing-settings-form.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Cover:
- payment queue renders submitted payment.
- approve button calls approve service.
- reject button requires review note.
- settings form saves WhatsApp, instructions, bank accounts.

- [ ] **Step 2: Create payment queue**

Render table/card list with:
- tenant id/name if available
- invoice id/number
- amount
- proof text/image
- status
- submitted date
- approve/reject buttons

Use Indonesian labels: `Pembayaran Masuk`, `Setujui`, `Tolak`, `Catatan Penolakan`.

- [ ] **Step 3: Create billing settings form**

Fields:
- WhatsApp support
- support URL
- support text
- instruksi pembayaran
- bank accounts as JSON textarea or repeated simple rows

Submit calls `platformAdminService.updateBillingSettings`.

- [ ] **Step 4: Create invoice table**

Render invoice number, tenant, plan, amount, status, due date.

- [ ] **Step 5: Wire platform admin page**

Add billing section/tabs:
- `Pembayaran`
- `Tagihan`
- `Pengaturan Billing`

Queries:
- billing payments
- billing invoices
- billing settings

Mutations:
- approve payment
- reject payment
- update settings

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- src/features/platform-admin/components/billing-payment-queue.test.tsx src/features/platform-admin/components/billing-settings-form.test.tsx
npm run typecheck
```

Expected: tests pass, typecheck clean.

---

## Task 8: Local Cache Adjustments

**Files:**
- Modify if needed: `src/services/local-db/schema.ts`
- Modify if needed: `src/services/local-db/dexie-instance.ts`
- Modify if needed: `src/services/local-db/adapters/sqlite.adapter.ts`
- Modify if needed: `src/services/local-db/adapters/tauri-sql.adapter.ts`

- [ ] **Step 1: Decide cache location**

If support/payment settings are fetched live by React Query only, skip local schema changes.

If popup needs offline support contact, add optional fields to local tenant cache:
- `supportWhatsapp?: string | null`
- `supportText?: string | null`
- `supportUrl?: string | null`
- `paymentInstructions?: string | null`

- [ ] **Step 2: Mirror schema only if fields added**

Update Dexie and SQLite adapters consistently. Do not add full billing lifecycle tables locally in this phase.

- [ ] **Step 3: Verify**

Run:

```bash
npm run typecheck
npm test -- src/services/local-db
```

Expected: local DB tests pass or command reports no matching tests without breaking.

---

## Task 9: Seed Defaults and Final Verification

**Files:**
- Modify: `scripts/seed-platform-admin.mjs`
- Modify docs if needed: `docs/agent-changelog.md`

- [ ] **Step 1: Seed default billing settings**

Add default `platform_billing_settings` row:
- support WhatsApp placeholder from env if available
- payment instruction text
- one sample bank account for local/dev only

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:
- typecheck passes
- tests pass
- build passes
- lint either passes or only known pre-existing lint issue remains documented in progress

- [ ] **Step 3: Manual smoke checklist**

Verify in app:
- tenant can see billing page
- tenant can create invoice/change plan
- tenant can submit payment proof
- super admin can approve payment
- tenant status becomes active after approval
- expiry popup appears H-3/expired and is closable
- support button opens configured contact

---

## Self-Review Notes

Spec coverage:
- Trial auto handled by existing tenant creation and unchanged subscribe flow.
- Manual transfer handled by invoice/payment proof tasks.
- Super admin approval handled by platform billing API/UI.
- Change plan handled by plan change requests.
- Expiry warning non-blocking handled by Task 6.
- Support settings handled by schema/API/UI tasks.
- Payment gateway, proration, hard lock, and read-only mode remain out of scope.

Placeholder scan:
- No TBD/TODO placeholders.
- Tasks reference exact files and verification commands.
- Implementation details point to spec where field list is already exact.

Type consistency:
- Status names match spec.
- API paths match spec.
- Component names match file map.
