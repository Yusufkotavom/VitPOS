# Sales POS Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify POS and manual sales invoice flows so payments, customer receivables, invoice history, and stock movement stay integrated.

**Architecture:** Add a shared sales finance service for invoice payment and customer metric recalculation. Update POS checkout to persist `customerId` and reuse the same customer synchronization rules. Replace mocked invoice payment history with real payment queries.

**Tech Stack:** React, TypeScript, Dexie, Zustand, Vitest.

---

### Task 1: Shared Finance Service
- [ ] Add service for invoice payment creation and customer receivable recalculation.

### Task 2: POS Integration
- [ ] Persist `customerId` in sales orders from POS checkout.
- [ ] Recalculate customer metrics after checkout.
- [ ] Use invoice WhatsApp template for POS success flow.

### Task 3: Sales Order Integration
- [ ] Replace invoice detail payment mutation with real payment row creation.
- [ ] Replace mocked payment history with live `payments` query.
- [ ] Preserve line item `productId` when editing invoice items.

### Task 4: Verification
- [ ] Update tests for POS checkout and invoice payment.
- [ ] Run `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`.
