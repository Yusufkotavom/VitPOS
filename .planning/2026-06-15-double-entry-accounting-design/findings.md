# Findings & Decisions

## Requirements
1. **Double-entry accounting system** — setiap transaksi auto-create jurnal debit/kredit
2. **User TIDAK boleh kelola akun** — semua akun auto-create
3. **Report offline dari Dexie** (bukan API)
4. **Prioritas laporan:** Neraca, Laba Rugi, Buku Besar
5. **Operator guardrails:** tidak bisa hapus data yg sudah dipakai transaksi
6. **Operator guardrails:** edit hanya field nama (front-end label)
7. **Stock adjustment** dari 2 entry point: manual (halaman adjustment) dan edit produk

## Stock Adjustment Design

### Akun Baru
| Kode | Nama | Tipe | System Account |
|------|------|------|----------------|
| **6-2000** | **Penyesuaian Persediaan** | Expense | Ya, auto-created saat onboarding |

### Journal Entry untuk Adjustment

**Jika stok BERTAMBAH (+qty):**
```
Dr. 1-2000 Persediaan              Rp X (qty × costPrice)
    Cr. 6-2000 Penyesuaian Persediaan   Rp X
```

**Jika stok BERKURANG (-qty):**
```
Dr. 6-2000 Penyesuaian Persediaan      Rp X (qty × costPrice)
    Cr. 1-2000 Persediaan              Rp X
```

### Entry Points
1. **Manual adjustment** — `inventory-adjustment.service.ts:adjustStock()` → perlu tambah panggil `journal.service.createStockAdjustment()`
2. **Edit produk** — `product-crud-actions.tsx:handleSubmit()` → perlu tambah panggil `journal.service.createStockAdjustment()`

### Valuasi
Pakai `product.costPrice` saat adjustment terjadi. Untuk edit produk, pakai costPrice dari form (yang baru).

## Guardrail Design

### Prinsip
1. **Cek referensi transaksi** sebelum mengizinkan delete
2. **Blokir di UI** (tombol disabled dengan tooltip), bukan backend-level
3. **Edit terbatas** — hanya field nama yang bisa diubah, field lain read-only

### Payment Methods
| Entity | Cek ke Tabel | Kondisi Blokir |
|--------|-------------|----------------|
| Payment Method | `payments` | Ada payment dengan method = paymentMethod.id |
| Payment Method | `cash` | Ada cash dengan account = paymentMethod.name |
| Bisa edit | `name` field only | Provider, type, dll tidak bisa diubah |

### Cash Categories
| Entity | Cek ke Tabel | Kondisi Blokir |
|--------|-------------|----------------|
| Cash Category | `cash` | Ada cash dengan category = cashCategory.id |
| Bisa edit | `name` field only | Type income/expense tidak bisa diubah |

### Products
| Entity | Cek ke Tabel | Kondisi Blokir |
|--------|-------------|----------------|
| Product | `salesOrderItems` | Ada SO item dengan productId = product.id |
| Product | `purchaseItems` | Ada PO item dengan productId = product.id |
| Product | `returnItems` | Ada return item dengan productId = product.id |
| Product | `stockMovements` | Ada stock movement dengan productId = product.id |
| Product | `productionBatches` | Ada production batch dengan productId = product.id |

### Accounts
- **Hidden from operator UI entirely** — tidak ada menu/navigasi ke akun
- Hanya sistem yang bisa create/edit akun (via auto-create)

### Shared Guard Function Pattern
```
canDeleteEntity(entityType, entityId) → { allowed: boolean, reason?: string }
- Cek ke tabel referensi via Dexie count()
- Return reason untuk tooltip
- Dipanggil sebelum render tombol delete
```

## Complete Transaction → Journal Mapping

### POS Sale (Tunai)
```
Dr. 1-1100 Kas Tunai            Rp total
Dr. 5-1000 HPP                  Rp total_cost
    Cr. 4-1000 Pendapatan Penjualan   Rp total
    Cr. 1-2000 Persediaan             Rp total_cost
```

### POS Sale (QRIS/Transfer/Kartu/E-Wallet)
```
Dr. 1-1201 Kas QRIS (dll)       Rp total
Dr. 5-1000 HPP                  Rp total_cost
    Cr. 4-1000 Pendapatan Penjualan   Rp total
    Cr. 1-2000 Persediaan             Rp total_cost
```

### POS Sale (Piutang)
```
Dr. 1-3000 Piutang Usaha        Rp total
Dr. 5-1000 HPP                  Rp total_cost
    Cr. 4-1000 Pendapatan Penjualan   Rp total
    Cr. 1-2000 Persediaan             Rp total_cost
```

### Service Order
```
Dr. 1-1100 Kas Tunai / 1-1201 Kas QRIS  Rp total
    Cr. 4-2000 Pendapatan Jasa           Rp total
```

### Pembelian
```
Dr. 1-2000 Persediaan          Rp total
    Cr. 1-1100 Kas Tunai / 2-1000 Hutang Usaha  Rp total
```

### Payment Piutang
```
Dr. 1-1100 Kas Tunai / 1-1201 Kas QRIS  Rp total
    Cr. 1-3000 Piutang Usaha            Rp total
```

### Cash In (Pemasukan)
```
Dr. 1-1100 Kas Tunai            Rp amount
    Cr. 4-9001 Pendapatan Lain [kategori]  Rp amount
```

### Cash Out (Pengeluaran)
```
Dr. 6-9001 Biaya [kategori]     Rp amount
    Cr. 1-1100 Kas Tunai        Rp amount
```

### Retur (kebalikan transaksi asal)
```
Dr. 4-1000 Pendapatan Penjualan  Rp total
Dr. 1-2000 Persediaan            Rp total_cost
    Cr. 1-1100 Kas Tunai         Rp total
    Cr. 5-1000 HPP               Rp total_cost
```

### Produksi
```
Dr. 1-2000 Persediaan (produk jadi)     Rp total_cost
    Cr. 1-2000 Persediaan (bahan baku)   Rp total_cost
```

## COA Structure (4-digit)
| Range | Tipe | Contoh |
|-------|------|--------|
| 1xxx | Asset | 1-1100 Kas Tunai, 1-2000 Persediaan, 1-3000 Piutang |
| 2xxx | Liability | 2-1000 Hutang Usaha |
| 3xxx | Equity | 3-1000 Modal, 3-2000 Laba Ditahan |
| 4xxx | Revenue | 4-1000 Pendapatan Penjualan, 4-2000 Pendapatan Jasa |
| 5xxx | COGS | 5-1000 HPP, 5-2000 Penyesuaian Persediaan |
| 6xxx | Expense | 6-1000 Biaya Operasional, 6-9001+ Biaya dari kategori |

## Auto-Create Rules
| Trigger | Account Created |
|---------|----------------|
| Payment method type `tunai` | 1-1100 Kas Tunai |
| Payment method type `qris` | 1-1201+ QRIS [provider] |
| Payment method type `transfer` | 1-1301+ Transfer [bank] |
| Payment method type `kartu` | 1-1301+ Kartu [bank] |
| Payment method type `ewallet` | 1-1401+ E-Wallet [provider] |
| Cash category type `income` | 4-9001+ Pendapatan [nama kategori] |
| Cash category type `expense` | 6-9001+ Biaya [nama kategori] |

## Engine Services (src/services/accounting/)
| File | Responsibility |
|------|---------------|
| chart-of-accounts.ts | Fixed accounts, auto-create, account lookup |
| journal.service.ts | Create validated journal entries (debit=credit) |
| trial-balance.ts | Neraca saldo dari journalLines |
| profit-loss.ts | Laba rugi dari revenue/expense accounts |
| balance-sheet.ts | Neraca dari asset/liability/equity accounts |
| general-ledger.ts | Buku besar per akun |
| period-close.ts | Tutup laba berjalan → laba ditahan |

## Tabel Baru

### Local Dexie (v16)
```typescript
LocalAccount: id, tenantId, code, name, type, isSystem, isActive, syncStatus, version, updatedAt
LocalJournalEntry: id, tenantId, code, description, referenceType, referenceId, date, syncStatus, version, updatedAt
LocalJournalLine: id, tenantId, journalEntryId, accountId, accountCode, debit, credit, syncStatus, updatedAt
```

### Drizzle Postgres
```typescript
accounts, journal_entries, journal_lines (mirror local)
```

### Indices Dexie
```
accounts: 'id, tenantId, [tenantId+code], [tenantId+type], syncStatus'
journalEntries: 'id, tenantId, [tenantId+code], [tenantId+referenceType+referenceId], [tenantId+date], syncStatus'
journalLines: 'id, tenantId, journalEntryId, accountId, accountCode, syncStatus'
```

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Double-entry penuh (B) | User confirmed |
| Auto-create accounts | User insists no manual account management |
| Penyesuaian Persediaan 6-2000 | Single account for all stock adjustments |
| Guard: UI-level block + tooltip | Operator not backend, no need for API-level guard |
| Guard: check count from Dexie before render | Offline-first, Dexie is source of truth |
| Accounts hidden from nav | Operators shouldn't see accounts at all |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
