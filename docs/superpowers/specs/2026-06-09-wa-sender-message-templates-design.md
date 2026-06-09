# WA Sender & Message Templates — Design Spec

## Problem

1. WhatsApp sender di POS checkout menggunakan nomor **hardcoded** (`0800000000`), bukan nomor pelanggan yang dipilih saat transaksi
2. Tombol WhatsApp di halaman detail sales order dan service order dalam keadaan **disabled**
3. Belum ada sistem message template — pesan yang diketik manual di kode

## Solusi

### 1. Fix WA Sender — Gunakan Nomor Pelanggan

**File yang diubah:**
- `src/features/pos/components/payment-summary.tsx` — ganti `'0800000000'` dengan `customer.phone` dari transaksi
- `src/features/pos/components/pos-success-dialog.tsx` — pastikan `onWhatsApp` menerima nomor yang benar
- `src/features/sales-orders/pages/sales-order-detail-page.tsx` — aktifkan tombol WA, ambil nomor dari `salesOrder.customerId` → lookup `LocalCustomer`
- `src/features/service-orders/pages/service-order-detail-page.tsx` — aktifkan tombol WA, ambil nomor dari `serviceOrder.customerId` → lookup `LocalCustomer`

**Alur:**
1. POS checkout: `successOrder.customerId` → lookup `LocalCustomer` → ambil `phone`
2. Detail sales order: `salesOrder.customerId` → lookup `LocalCustomer` → ambil `phone`
3. Detail service order: `serviceOrder.customerId` → lookup `LocalCustomer` → ambil `phone`
4. `buildWhatsAppLink(phone, renderedTemplate)` → `window.open(url, '_blank')`

### 2. Message Template System

**Lokasi service baru:** `src/services/message-template.service.ts`

**Template default (sebagai konstanta):**

```typescript
export const DEFAULT_TEMPLATES: Record<MessageTemplateType, string> = {
  invoice: `🛒 *NOTA PEMBELIAN*
─────────────────
*No Nota:* {{code}}
*Tanggal:* {{date}}
*Pelanggan:* {{customer_name}}
─────────────────
{{items}}
─────────────────
*Total:* {{total}}
*Bayar:* {{paid}}
*Kembali:* {{change}}
*Metode:* {{payment_method}}
─────────────────
Terima kasih telah berbelanja!`,

  shortage: `⚠️ *PEMBERITAHUAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Terbayar:* {{paid}}
*Sisa:* {{remaining}}
─────────────────
Mohon segera dilunasi. Terima kasih.`,

  paid: `✅ *PEMBAYARAN LUNAS*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Pembayaran:* {{paid}}
*Status:* LUNAS
─────────────────
Terima kasih!`,

  status: `📋 *UPDATE STATUS PESANAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Status:* {{status}}
─────────────────
Terima kasih.`,

  product_info: `📦 *INFO PRODUK*
─────────────────
*Produk:* {{product_name}}
*Harga:* {{price}}
*Stok:* {{stock}}
*Kategori:* {{category}}
─────────────────`,

  service_order: `🔧 *SERVICE ORDER*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Device:* {{device}}
*Masalah:* {{problem}}
*Status:* {{status}}
*Biaya:* {{cost}}
─────────────────
Terima kasih.`,
};
```

**Variable substitution:**
- Regex: `/\{\{(\w+)\}\}/g`
- Fungsi: `renderTemplate(template: string, variables: Record<string, string>): string`
- Variable yang tidak ditemukan dibiarkan sebagai `{{variable}}`

**Penyimpanan override:**
- Key: `msg_template_<type>` di tabel `LocalSetting` (Dexie)
- Service method: `getTemplate(type)`, `setOverride(type, content)`, `resetToDefault(type)`
- `getTemplate` logic: cek override di Dexie → jika ada pakai override → jika tidak pakai default

**Tipe template (enum):**
```typescript
export type MessageTemplateType =
  | 'invoice'
  | 'shortage'
  | 'paid'
  | 'status'
  | 'product_info'
  | 'service_order'
```

### 3. Settings UI — Template Pesan

**Lokasi:** Halaman Settings → section "Template Pesan"

**Layout:**
- Daftar template sebagai card/list, masing-masing dengan:
  - Nama template (read-only)
  - Tombol "Edit" → opens dialog dengan textarea untuk konten template
  - Tombol "Reset ke Default"
- Dialog edit: textarea full-width, tombol Simpan & Batal
- Tampilkan daftar variable yang tersedia di bawah textarea

### 4. Integrasi dengan WA Sender

**POS checkout flow (`payment-summary.tsx`):**
```
handleWhatsApp():
  customer = await db.customers.get(successOrder.customerId)
  phone = customer?.phone
  template = await messageTemplateService.render('invoice', {
    code, date, customer_name, items, total, paid, change, payment_method, store_name
  })
  window.open(buildWhatsAppLink(phone, template), '_blank')
```

**Sales order detail (`sales-order-detail-page.tsx`):**
```
handleWhatsApp():
  customer = await db.customers.get(salesOrder.customerId)
  phone = customer?.phone
  if salesOrder.status === 'Lunas' → template = 'paid'
  else if salesOrder.paidTotal < salesOrder.grandTotal → template = 'shortage'
  else → template = 'status'
  window.open(buildWhatsAppLink(phone, rendered), '_blank')
```

**Service order detail (`service-order-detail-page.tsx`):**
```
handleWhatsApp():
  customer = await db.customers.get(serviceOrder.customerId)
  phone = customer?.phone
  template = 'service_order'
  window.open(buildWhatsAppLink(phone, rendered), '_blank')
```

### Files yang Diubah

| File | Perubahan |
|------|-----------|
| `src/services/message-template.service.ts` | NEW — template service |
| `src/features/pos/components/payment-summary.tsx` | Fix nomor WA hardcoded |
| `src/features/pos/components/pos-success-dialog.tsx` | Pass customer phone |
| `src/features/sales-orders/pages/sales-order-detail-page.tsx` | Aktifkan WA button |
| `src/features/service-orders/pages/service-order-detail-page.tsx` | Aktifkan WA button |
| `src/features/settings/pages/settings-page.tsx` | Tambah section template |
| Atau `src/features/settings/pages/message-templates-page.tsx` | NEW — halaman pengaturan template |

### Yang TIDAK Termasuk (MVP)

- Kirim WA via API (masih pakai `wa.me` link → buka browser)
- History pengiriman WA
- Template kondisional (if/else)
- Multi-bahasa
- Scheduled/send later

## Dependencies

- `src/lib/whatsapp.ts` — sudah ada (`buildWhatsAppLink`)
- `LocalCustomer.phone` — sudah ada
- `LocalSetting` — sudah ada di Dexie schema
- `src/services/local-db/client.ts` — sudah ada

## Testing

1. POS checkout → lihat WA link menggunakan nomor pelanggan
2. Detail sales order → klik WA → link dengan template sesuai status
3. Settings → edit template → simpan → kirim ulang → pakai template baru
4. Reset template → kembali ke default
