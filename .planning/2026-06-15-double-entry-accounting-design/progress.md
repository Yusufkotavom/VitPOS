# Progress Log

## Session: 2026-06-15

### Current Status
- **Phase:** 3 - Guardrail Implementation
- **Started:** 2026-06-15
- **Status:** complete

### Actions Taken
1. Created `task_plan.md` — 7 phases for accounting engine + guardrails
2. Created `findings.md` — full stock adjustment design, transaction→journal mapping, guardrail design, COA structure, auto-create rules
3. Audited existing code: inventory-adjustment.service, product-crud-actions, payment-method-crud-actions, cash-category-crud-actions, repository pattern
4. Created `src/shared/lib/delete-guard.ts` — shared utility with canDeletePaymentMethod, canDeleteCashCategory, canDeleteProduct
5. Updated `PaymentMethodCrudActions` — delete disabled + tooltip if has transactions, passes isEdit to form
6. Updated `PaymentMethodForm` — accepts isEdit prop, disables all fields except name when editing
7. Updated `CashCategoryCrudActions` — delete disabled + tooltip if has transactions, type/status disabled when editing (name only editable)
8. Updated `ProductCrudActions` — delete disabled + tooltip if has transactions
9. Updated `FormSelect` — added `disabled` prop support
10. Ran typecheck — passed clean

### Files Created
| File | Purpose |
|------|---------|
| `src/shared/lib/delete-guard.ts` | Guard functions for delete protection |

### Files Modified
| File | Change |
|------|--------|
| `src/features/settings/components/payment-method-crud-actions.tsx` | Delete guard + tooltip, pass isEdit to form |
| `src/features/settings/components/payment-method-form.tsx` | isEdit prop: disable all fields except name |
| `src/features/cash/components/cash-category-crud-actions.tsx` | Delete guard + tooltip, disable type/status on edit |
| `src/features/products/components/product-crud-actions.tsx` | Delete guard + tooltip |
| `src/shared/components/form/form-select.tsx` | Add disabled prop support |

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| TypeScript typecheck | Pass | Pass | ✅ |

### Errors
| Error | Resolution |
|-------|------------|

---

## Session: 2026-06-15 (Part 2)

### Current Status
- **Phase:** 4 - Accounting Engine Implementation
- **Started:** 2026-06-15
- **Status:** complete

### Actions Taken
1. Added `LocalAccount`, `LocalJournalEntry`, `LocalJournalLine` types to `schema.ts` + `AccountType` type
2. Added `'account' | 'journal_entry' | 'journal_line'` to `SyncEntityType` in shared-contracts/enums.ts
3. Bumped Dexie v16 with 3 new tables: `accounts`, `journalEntries`, `journalLines`
4. Registered new tables in `adapters/index.ts` and `sqlite.adapter.ts`
5. Added `accountRepository`, `journalEntryRepository`, `journalLineRepository` to `repository.ts`
6. Added Drizzle tables + relations for `accounts`, `journal_entries`, `journal_lines` in `core.ts`
7. Created `src/services/accounting/chart-of-accounts.ts` — 11 system accounts + auto-create for payment methods and cash categories
8. Created `src/services/accounting/journal.service.ts` — validated journal entry creation with debit=credit check, code generation, Dexie persistence
9. Created `src/services/accounting/trial-balance.ts` — grouped trial balance from journalLines
10. Created `src/services/accounting/profit-loss.ts` — PL from revenue/cogs/expense accounts
11. Created `src/services/accounting/balance-sheet.ts` — BS from asset/liability/equity accounts
12. Created `src/services/accounting/general-ledger.ts` — buku besar per account with running balance
13. Created `src/services/accounting/period-close.ts` — closing laba berjalan → laba ditahan
14. Ran typecheck — passed clean

### Files Created
| File | Purpose |
|------|---------|
| `src/services/accounting/chart-of-accounts.ts` | Fixed system accounts + auto-create for payment methods & cash categories |
| `src/services/accounting/journal.service.ts` | Validated journal entry creation engine |
| `src/services/accounting/trial-balance.ts` | Trial balance from journalLines grouped by account |
| `src/services/accounting/profit-loss.ts` | Profit & loss report (revenue - cogs - expense) |
| `src/services/accounting/balance-sheet.ts` | Balance sheet (assets = liabilities + equity) |
| `src/services/accounting/general-ledger.ts` | General ledger per account with running balance |
| `src/services/accounting/period-close.ts` | Period closing (laba berjalan → laba ditahan) |

### Files Modified
| File | Change |
|------|--------|
| `src/services/local-db/schema.ts` | Added LocalAccount, LocalJournalEntry, LocalJournalLine, AccountType |
| `packages/shared-contracts/src/sync/enums.ts` | Added account, journal_entry, journal_line to SyncEntityType |
| `src/services/local-db/dexie-instance.ts` | Bumped to v16 with 3 new tables + EntityTable declarations |
| `src/services/local-db/adapters/index.ts` | Added accounts, journalEntries, journalLines to LOCAL_DB_TABLES |
| `src/services/local-db/adapters/sqlite.adapter.ts` | Added 3 table schemas |
| `src/services/local-db/repository.ts` | Added 3 repository exports |
| `src/db/schema/core.ts` | Added accountTypeEnum, journalEntryStatusEnum, 3 tables + relations |

---

## Session: 2026-06-15 (Part 3) — Transaction Integration

### Current Status
- **Phase:** 5 — Transaction Integration
- **Started:** 2026-06-15
- **Status:** complete

### Actions Taken
1. Created `src/services/accounting/accounting-integration.ts` — 9 helper functions for journal entries:
   - `recordPosSaleJournal` — POS sale (Dr Kas/HPP, Cr Pendapatan/Persediaan)
   - `recordServiceOrderJournal` — Service order (Dr Kas, Cr Pendapatan Jasa)
   - `recordStockAdjustmentJournal` — Stock +/- adjustment (Dr/Cr Persediaan ↔ Penyesuaian)
   - `recordProductionJournal` — Production batch (Dr/Cr Persediaan intra-account)
   - `recordPurchaseJournal` — PO receiving (Dr Persediaan, Cr Hutang)
   - `recordPurchasePaymentJournal` — PO payment (Dr Hutang, Cr Kas)
   - `recordCashJournal` — Cash in/out (Pemasukan/Pengeluaran via kategori)
   - `recordPaymentReceivableJournal` — Payment receivable (Dr Kas, Cr Piutang)
   - `recordReturnJournal` — Return penjualan (Dr Pendapatan/Persediaan, Cr Kas/HPP)
2. Edited 10 transaction files to call journal helpers (all non-blocking, wrapped in try/catch):
   - `pos-transaction.service.ts` — HPP dari cartProductMap.costPrice × qty
   - `soc-transaction.service.ts` — Service order checkout
   - `inventory-adjustment.service.ts` — Manual stock adjustment
   - `production.service.ts` — Ingredient cost dari costPrice × consumeQty
   - `purchase-receiving.service.ts` — PO receiving
   - `purchase-payment.service.ts` — PO payment
   - `cash-crud-actions.tsx` — Cash in/out form
   - `payment-crud-actions.tsx` — Payment receivable (skip jika linked ke PO)
   - `return-crud-actions.tsx` — Return form (skip jika Pembelian)
   - `product-crud-actions.tsx` — Product edit stock change
3. Ran typecheck — passed clean (exit 0)

### Files Created
| File | Purpose |
|------|---------|
| `src/services/accounting/accounting-integration.ts` | 9 non-blocking journal helper functions |

### Files Modified
| File | Change |
|------|--------|
| `src/features/pos/services/pos-transaction.service.ts` | Added recordPosSaleJournal after checkout |
| `src/features/service-orders/services/soc-transaction.service.ts` | Added recordServiceOrderJournal after checkout |
| `src/features/inventory/services/inventory-adjustment.service.ts` | Added recordStockAdjustmentJournal after adjustStock |
| `src/features/production/services/production.service.ts` | Added cost calc + recordProductionJournal |
| `src/features/purchases/services/purchase-receiving.service.ts` | Added recordPurchaseJournal after receive |
| `src/features/purchases/services/purchase-payment.service.ts` | Added recordPurchasePaymentJournal after payment |
| `src/features/cash/components/cash-crud-actions.tsx` | Added recordCashJournal after upsert |
| `src/features/payments/components/payment-crud-actions.tsx` | Added recordPaymentReceivableJournal after sync |
| `src/features/returns/components/return-crud-actions.tsx` | Added recordReturnJournal after upsert |
| `src/features/products/components/product-crud-actions.tsx` | Added recordStockAdjustmentJournal on stock change |

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| TypeScript typecheck | Pass | Pass | ✅ |

---

## Session: 2026-06-15 (Part 4) — Report Migration

### Current Status
- **Phase:** 6 — Report Migration
- **Started:** 2026-06-15
- **Status:** complete

### Actions Taken
1. Added `startDate`/`endDate` params to `getTrialBalance()`, `getProfitLoss()`, `getBalanceSheet()` — date range filtering via journal entry dates
2. Rewrote `useProfitLoss` hook — calls `getProfitLoss(tenantId, from, to)` from local Dexie instead of fetch API
3. Rewrote `useBalanceSheet` hook — calls `getBalanceSheet(tenantId, from, to)` from local Dexie instead of fetch API
4. Redesigned `profit-loss-page.tsx` — now shows per-account breakdown from accounting trial balance (revenues[], cogs[], expenses[] arrays grouped by account type)
5. Redesigned `balance-sheet-page.tsx` — now shows per-account breakdown from accounting trial balance (assets[], liabilities[], equities[] arrays grouped by account type)
6. Created `useGeneralLedger` hook — loads accounts list + ledger data per selected account
7. Created `general-ledger-page.tsx` — account picker dropdown, date range filter, transaction table with running balance, export CSV
8. Added route `/reports/general-ledger` in `router.tsx`
9. Added "Buku Besar" card to `report-presets.ts`
10. Ran typecheck — passed clean
11. Ran build — succeeded

### Files Created
| File | Purpose |
|------|---------|
| `src/features/reports/hooks/use-general-ledger.ts` | Hook for GL: loads accounts list + ledger data per account |
| `src/features/reports/pages/general-ledger-page.tsx` | Buku Besar page with account picker, date filter, transaction table |

### Files Modified
| File | Change |
|------|--------|
| `src/services/accounting/trial-balance.ts` | Added `startDate`/`endDate` optional params for date range filtering |
| `src/services/accounting/profit-loss.ts` | Added `startDate`/`endDate` params, pass through to getTrialBalance |
| `src/services/accounting/balance-sheet.ts` | Added `startDate`/`endDate` params, pass through to getTrialBalance |
| `src/features/reports/hooks/use-profit-loss.ts` | Rewrote: uses local `getProfitLoss()` instead of `fetchProfitLoss()` |
| `src/features/reports/hooks/use-balance-sheet.ts` | Rewrote: uses local `getBalanceSheet()` instead of `fetchBalanceSheet()` |
| `src/features/reports/pages/profit-loss-page.tsx` | Simplified: per-account breakdown from trial balance |
| `src/features/reports/pages/balance-sheet-page.tsx` | Simplified: per-account breakdown from trial balance |
| `src/app/router.tsx` | Added lazy import + route for `/reports/general-ledger` |
| `src/features/reports/config/report-presets.ts` | Added "Buku Besar" card |

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| TypeScript typecheck | Pass | Pass | ✅ |
| Build | Success | Success | ✅ |

---

## Session: 2026-06-15 (Part 5) — Testing & Verification

### Current Status
- **Phase:** 7 — Testing & Verification
- **Started:** 2026-06-15
- **Status:** complete

### Actions Taken
1. Created `delete-guard.test.ts` — 7 tests for `canDeletePaymentMethod`, `canDeleteCashCategory`, `canDeleteProduct` (allowed when no refs, blocked when refs exist)
2. Created `chart-of-accounts.test.ts` — 8 tests for `ensureSystemAccounts` (creates all 11 system accounts, idempotent), `ensurePaymentMethodAccount` (QRIS/ewallet/tunai/piutang, reuse), `ensureCashCategoryAccount` (Pemasukan/Pengeluaran)
3. Created `journal.service.test.ts` — 4 tests for `createJournalEntry` (balanced entry OK, unbalanced throws, empty lines throws, complex multi-line)
4. Created `trial-balance.test.ts` — 6 tests (empty, normal debit asset, normal credit revenue, grouping multiple lines, sort by code, date range filter)
5. Created `profit-loss.test.ts` — 3 tests (zero values, gross profit = revenue - cogs, net profit = gross - expenses)
6. Created `balance-sheet.test.ts` — 4 tests (zero values, categorize by type, assets = liabilities + equity, includes metadata)
7. Ran full test suite — 214 tests, 76 files, all passing
8. Updated `task_plan.md` — all phases marked complete

### Files Created
| File | Tests | Purpose |
|------|-------|---------|
| `src/shared/lib/delete-guard.test.ts` | 7 | Guardrail verification (payment method, cash category, product) |
| `src/services/accounting/chart-of-accounts.test.ts` | 8 | COA auto-create: system accounts, payment methods, cash categories |
| `src/services/accounting/journal.service.test.ts` | 4 | Journal entry creation: balanced, unbalanced, multi-line |
| `src/services/accounting/trial-balance.test.ts` | 6 | Trial balance: grouping, normal balance, sorting, date filter |
| `src/services/accounting/profit-loss.test.ts` | 3 | Profit & Loss: revenue - cogs - expense = net profit |
| `src/services/accounting/balance-sheet.test.ts` | 4 | Balance Sheet: assets = liabilities + equity, categorization |

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| All tests (76 files, 214 tests) | Pass | Pass | ✅ |
| TypeScript typecheck | Pass | Pass | ✅ |
| Build | Success | Success | ✅ |
