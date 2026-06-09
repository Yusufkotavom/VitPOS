# Subscription Billing Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the in-flight subscription and billing feature so routing, gating, onboarding, settings/profile UI, and platform admin plan management all work against the current repo state.

**Architecture:** Keep the current schema and API surface intact, then complete the missing integrations around them. Reuse `useSubscription` as the UI-facing source of truth, treat `/settings/billing` as the canonical authenticated route, and extend the existing platform-admin plan form instead of introducing new billing abstractions.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, TanStack Query, React Router, Vitest, Testing Library, Drizzle/Hono backend contracts.

---

## File Map

- Modify: `src/shared/components/nav/user-menu.tsx`
  Purpose: point the user menu subscription entry to the canonical billing settings route.
- Modify: `src/features/settings/components/settings-nav.tsx`
  Purpose: expose the billing tab inside settings navigation.
- Modify: `src/features/settings/pages/user-profile-page.tsx`
  Purpose: replace the static subscription card with live data from `useSubscription` and link to billing management.
- Modify: `src/features/auth/pages/billing-page.tsx`
  Purpose: replace the hard-coded plan list with subscription API data and keep selected tenant state in sync.
- Modify: `src/services/api/platform-admin.service.ts`
  Purpose: align plan input/output types with backend-supported billing fields.
- Modify: `src/features/platform-admin/components/plan-form-dialog.tsx`
  Purpose: expose billing period, duration, trial, and yearly price fields already supported by backend routes.
- Modify: `src/features/platform-admin/pages/platform-admin-page.tsx`
  Purpose: surface the added plan fields in plan listings.
- Create or modify tests under `src/features/settings`, `src/features/auth`, and `src/features/platform-admin`
  Purpose: cover route canonicalization, billing-page API rendering, profile card dynamics, and plan form payload shaping where practical.

## Task 1: Canonical Billing Navigation

**Files:**
- Modify: `src/shared/components/nav/user-menu.tsx`
- Modify: `src/features/settings/components/settings-nav.tsx`
- Test: `src/features/settings/components/settings-nav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/settings/components/settings-nav.test.tsx` asserting that the settings navigation contains a `Langganan` tab linked to `/settings/billing`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/components/settings-nav.test.tsx`
Expected: FAIL because the billing tab is not rendered yet.

- [ ] **Step 3: Write minimal implementation**

Add the billing tab to `settingTabs` in `src/features/settings/components/settings-nav.tsx` and update the stale user-menu subscription link in `src/shared/components/nav/user-menu.tsx` from `/settings/subscription` to `/settings/billing`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/components/settings-nav.test.tsx`
Expected: PASS.

## Task 2: Dynamic Profile Subscription Summary

**Files:**
- Modify: `src/features/settings/pages/user-profile-page.tsx`
- Test: `src/features/settings/pages/user-profile-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/settings/pages/user-profile-page.test.tsx` asserting that the card reads active-tenant subscription data and that the CTA links to `/settings/billing`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/settings/pages/user-profile-page.test.tsx`
Expected: FAIL because the page still shows hard-coded trial content.

- [ ] **Step 3: Write minimal implementation**

Use `useSubscription` and `useAuthStore().activeTenant` in `src/features/settings/pages/user-profile-page.tsx` to render live plan name, status, billing period, valid-until date, and a billing management CTA.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/settings/pages/user-profile-page.test.tsx`
Expected: PASS.

## Task 3: Billing Page Uses Subscription API

**Files:**
- Modify: `src/features/auth/pages/billing-page.tsx`
- Test: `src/features/auth/pages/billing-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/auth/pages/billing-page.test.tsx` mocking `subscriptionService.listPlans` and asserting that the billing page renders returned plans and updates the active tenant when a plan is chosen.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/auth/pages/billing-page.test.tsx`
Expected: FAIL because the page still renders a hard-coded trial/pro pair.

- [ ] **Step 3: Write minimal implementation**

Replace the static cards in `src/features/auth/pages/billing-page.tsx` with a TanStack Query fetch from `subscriptionService.listPlans()`, reuse the current display pattern from `subscription-page.tsx`, and keep local/auth tenant state synchronized after plan selection.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/auth/pages/billing-page.test.tsx`
Expected: PASS.

## Task 4: Platform Admin Plan Fields Match Backend

**Files:**
- Modify: `src/services/api/platform-admin.service.ts`
- Modify: `src/features/platform-admin/components/plan-form-dialog.tsx`
- Modify: `src/features/platform-admin/pages/platform-admin-page.tsx`
- Test: `src/features/platform-admin/components/plan-form-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/platform-admin/components/plan-form-dialog.test.tsx` asserting that submitting the form sends backend-supported fields such as `billingPeriod`, `durationDays`, `trialDays`, and `yearlyPrice`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/platform-admin/components/plan-form-dialog.test.tsx`
Expected: FAIL because those fields are not currently editable or submitted.

- [ ] **Step 3: Write minimal implementation**

Expand `PlatformPlan`/`PlanInput` in `src/services/api/platform-admin.service.ts`, add the missing inputs to `src/features/platform-admin/components/plan-form-dialog.tsx`, and surface the new plan metadata in the plans tab table of `src/features/platform-admin/pages/platform-admin-page.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/platform-admin/components/plan-form-dialog.test.tsx`
Expected: PASS.

## Task 5: Full Verification

**Files:**
- No source changes expected unless verification reveals regressions.

- [ ] **Step 1: Run targeted frontend tests**

Run:
- `npm test -- src/features/settings/components/settings-nav.test.tsx`
- `npm test -- src/features/settings/pages/user-profile-page.test.tsx`
- `npm test -- src/features/auth/pages/billing-page.test.tsx`
- `npm test -- src/features/platform-admin/components/plan-form-dialog.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run full project verification**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Expected: all commands PASS.

## Self-Review

- Spec coverage: canonical route, profile/settings UI, billing page API sourcing, admin plan field completion, and verification are each mapped to a task.
- Placeholder scan: no TBD/TODO markers remain in the plan.
- Type consistency: plan field names match backend route contracts in `apps/api/src/features/platform/routes.ts`.
