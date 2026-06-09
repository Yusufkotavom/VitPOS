## Goal

Finish the subscription and billing work already underway in the VitPOS repo so the user-facing flow, gating behavior, settings experience, onboarding path, and platform admin controls all work together against the current schema and API surface.

## Current Baseline

The repository already contains major subscription and platform-admin foundations:

- `src/db/schema/core.ts` already defines `userRoleEnum`, `users.role`, `subscriptionPlans`, and `platformAuditLogs`.
- `apps/api/src/features/platform/` already contains platform middleware, routes, audit helper, and tests.
- `src/services/api/platform-admin.service.ts` already exposes tenant, plan, user, membership, and audit endpoints.
- `src/features/settings/pages/subscription-page.tsx` already exists and uses `useSubscription` plus subscription API mutations.
- `src/features/billing/components/subscription-gate.tsx` is already mounted in `src/shared/components/layout/app-layout.tsx`.

Because the baseline is partially implemented, the remaining work should focus on finishing integration gaps, route consistency, and verification instead of recreating platform admin or subscription foundations from scratch.

## Scope

In scope:

- Canonicalize the subscription settings route and update stale links.
- Finish the runtime subscription enforcement flow.
- Complete onboarding and billing plan-selection flow against the existing subscription API.
- Make profile and settings subscription surfaces reflect live tenant data.
- Complete any missing platform-admin plan fields or columns needed by the new subscription model.
- Add or update tests around changed behavior.
- Run `lint`, `typecheck`, `test`, and `build` before completion.

Out of scope:

- Re-architecting auth or the platform admin module.
- Replacing the existing subscription schema or API contracts.
- Unrelated UI redesign outside touched billing/settings/admin screens.

## Canonical Navigation and Routing

The canonical authenticated subscription management route is `/settings/billing`.

Requirements:

- All in-app links that currently point to legacy or inconsistent paths such as `/settings/subscription` must be updated to `/settings/billing`.
- Any expired-subscription recovery action must route the user to `/settings/billing`.
- The route declaration in `src/app/router.tsx` remains the source of truth for the settings billing page.

Rationale:

- The router already defines `settings/billing`.
- `SubscriptionGate` already whitelists `/settings/billing`.
- Keeping one canonical route prevents broken navigation and avoids users being blocked from their recovery path.

## Subscription State and Enforcement

`useSubscription` remains the single UI-facing source of truth for subscription presentation and enforcement. UI code should read normalized state from this hook instead of recalculating status independently across pages and dialogs.

Required behavior:

- `SubscriptionGate` must only block when enforcement is active.
- The gate must allow access to recovery-safe routes such as `/settings/billing`, `/settings/profile`, and platform-admin routes that are intentionally exempt.
- `SubscriptionExpiredDialog` must present clear Indonesian messaging and a working CTA into the billing recovery flow.
- Changes from subscribe/cancel mutations must update the active tenant state so downstream UI reacts immediately without requiring a full reload.

## Onboarding and Billing Flow

The plan-selection experience must use the existing subscription API as the single plan source.

Required behavior:

- Onboarding step 5 plan picker reads available plans from the same subscription endpoint used by settings billing.
- The `/billing` onboarding route also reads from the same plan source and honors selected `planCode` and `billingPeriod`.
- Registration/onboarding state passes plan selection forward without introducing a second local plan catalog.
- Failure states show plain-language Indonesian feedback and preserve the user’s ability to retry.

This keeps onboarding, billing, and settings aligned and prevents configuration drift between public and authenticated flows.

## Settings and Profile Surfaces

The main management surface for subscriptions is `src/features/settings/pages/subscription-page.tsx`.

Requirements:

- The page shows current plan, billing period, status, validity date, and remaining days from `useSubscription`.
- The plan list continues to use the current API but must remain consistent with active-tenant updates after subscribe or cancel.
- The profile page shows a dynamic subscription summary card derived from active tenant state and links users to `/settings/billing` for management.
- Settings navigation must expose the billing page using the same route name used by the router.

## Platform Admin Completion

Platform admin is not greenfield work. The existing service and component structure should be extended only where the subscription model needs additional surfaced fields.

Expected completion items:

- `PlanFormDialog` supports the billing/subscription fields required by the current schema and API, including values like pricing, duration, limits, and status flags as applicable to the existing backend contract.
- Platform-admin plan listings/columns surface the subscription information needed to manage plans confidently.
- Tenant and user management flows remain compatible with the role and membership model already present in the repo.

The preferred approach is to make the smallest set of UI/data-shape changes necessary to match the current backend, not to introduce a larger new admin IA.

## Testing Strategy

Behavior changes must be covered with focused tests before or alongside implementation, following the repo’s existing test style.

Minimum expected coverage for touched logic:

- `useSubscription` normalization and enforcement behavior.
- Route or component behavior tied to canonical billing navigation where practical.
- Any extracted helper logic added for platform-admin summaries or plan shaping.

After implementation, run the project verification suite:

- `lint`
- `typecheck`
- `test`
- `build`

## Implementation Order

Recommended order:

1. Fix route/link mismatches and confirm the canonical billing path.
2. Finish subscription gate and expired-dialog wiring.
3. Complete onboarding and `/billing` plan-selection flow against the shared subscription API.
4. Finalize settings/profile subscription UI consistency.
5. Complete platform-admin plan-management gaps.
6. Run full verification and fix regressions.

## Risks and Constraints

- The worktree is already active and may contain unrelated user changes; implementation must avoid reverting any existing work.
- Following older Qoder planning documents literally would risk duplicating work because much of the foundation is already present.
- The main technical risk is inconsistency between route names, active-tenant state updates, and page-specific assumptions about billing data.

## Success Criteria

This work is complete when:

- Subscription navigation consistently uses `/settings/billing`.
- Expired subscriptions are blocked everywhere they should be, while recovery-safe routes remain accessible.
- Onboarding, `/billing`, and settings subscription flows all consume the same plan source and selected plan metadata.
- Profile/settings/admin surfaces reflect the current subscription model without stale or mismatched fields.
- Tests and verification commands pass.
