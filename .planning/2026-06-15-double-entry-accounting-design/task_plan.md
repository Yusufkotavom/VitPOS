# Task Plan: Double Entry Accounting + Guardrails

## Goal
Implement double-entry accounting engine (3 tables, 7 services, integrated journal entries) and operator guardrails (cannot delete payment methods/categories/products with transactions).

## Current Phase
Phase 7 (complete) — all 7 phases complete.

## Phases

...

### Phase 7: Testing & Verification
- [x] Verify guardrails: cannot delete payment method with transactions (delete-guard.test.ts: 3 tests)
- [x] Verify guardrails: cannot delete cash category with transactions (delete-guard.test.ts: 2 tests)
- [x] Verify guardrails: cannot delete product with transactions (delete-guard.test.ts: 2 tests)
- [x] Verify guardrails: accounts not visible to operator (no route/UI for accounts — verified by audit)
- [x] Verify journal balance: total debit = total credit (journal.service.test.ts: 4 tests)
- [x] Verify trial balance report (trial-balance.test.ts: 6 tests)
- [x] Verify PL and BS reports (profit-loss.test.ts: 3 tests, balance-sheet.test.ts: 4 tests)
- [x] Verify COA auto-create (chart-of-accounts.test.ts: 8 tests)
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Double-entry penuh (B) | User confirmed, prioritas Neraca+Laba Rugi+Buku Besar |
| Auto-create accounts from payment methods & cash categories | User insists "jangan buat user menambah atau merubah akun" |
| Penyesuaian Persediaan (6-2000) sebagai akun expense | Adjustment persediaan dicatat sebagai penyesuaian operasional |
| Pakai costPrice saat adjustment untuk journal entry | Sederhana, cocok untuk adjustment stok opname |
| Guard: cek transaksi sebelum delete | Operator tidak bisa hapus data yang sudah direferensi |
| Guard: edit hanya field nama (front) | Operator tidak boleh ubah data sensitif |
| Soft-disable delete button (bukan hapus data) | Data tetap di DB, hanya UI yang diblokir |

## Errors Encountered
| Error | Resolution |
|-------|------------|
