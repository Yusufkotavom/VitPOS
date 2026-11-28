# Changelog

Semua perubahan penting pada proyek **VitPOS / KOTACOM Business Suite** didokumentasikan dalam file ini.
Format penulisan mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mematuhi [Semantic Versioning](https://semver.org/).

---

## [2.2.0] - 2026-11-27

### Ditambahkan (Added)
- **Catatan per item pada nota (Nota/Struk/Invoice):**
  - Kolom `note` pada item penjualan (`sales_order_items`) — server schema, Drizzle migration `0011`, Dexie `LocalSalesOrderItem`, serta adapter SQLite & Tauri-SQL (auto `ALTER TABLE`).
  - Input **catatan per item** di form Sales Order dan di dialog edit keranjang **POS** (catatan ikut tersimpan pada checkout maupun draft).
  - `PdfLineItem.note` dicetak di **Invoice**, **Surat Pesanan (sales-order)**, **Service Order**, dan **struk** (format `• catatan`).
  - Service Order: catatan baris pekerjaan (`LocalJobLine.note`) kini tercetak di PDF nota servis.
- **Field tambahan bebas pada Service Order (bisa edit/tambah):**
  - Di halaman detail servis (mode edit) tersedia blok **"Field tambahan"** — tambah field (nama + nilai), hapus, dan tampil otomatis di mode lihat; tersimpan pada `details` (JSONB).

## [2.1.0] - 2026-11-21

### Ditambahkan (Added)
- **Cetak Stiker Label Barcode Unit Servis (Thermal Printer):**
  - Komponen `ServiceOrderLabelDialog` untuk mencetak stiker barcode fisik unit servis.
  - Mendukung ukuran kertas thermal standar: `50x30 mm`, `40x30 mm`, dan `58 mm` continuous roll.
  - Integrasi barcode murni vector `CODE128` (JsBarcode) yang tajam untuk barcode scanner.
  - Berisi kode servis, tanggal terima, nama toko dinamis, nama & no. HP pelanggan, tipe perangkat, dan keluhan fisik.
  - Tombol cepat **"Cetak Label"** pada bilah tindakan detail servis (`service-order-detail-page.tsx`).
  - Opsi dropdown **"Stiker Label Unit (Thermal)"** langsung pada dialog sukses penerimaan servis baru (`service-success-flow.tsx`).
- **Cetak Label Barcode Rak Produk (Etalase & Kemasan):**
  - Komponen `ProductBarcodeLabelDialog` untuk pencetakan barcode produk fisik di toko.
  - Mendukung ukuran label `40x30 mm` (standar rak), `50x30 mm`, `33x15 mm` (mini aksesoris/sparepart), dan `58 mm`.
  - Pilihan jumlah cetak dinamis dengan tombol instan **"Stok (N)"** untuk menyesuaikan jumlah lembar dengan sisa stok produk.
  - Pengaturan fleksibel: tampilkan nama toko, harga jual, dan kode SKU.
  - Tombol **"Label"** di setiap baris dan kartu produk pada `products-page.tsx`.
- **Cek Garansi Cepat (Quick Warranty Lookup):**
  - Dialog `ServiceWarrantyLookupDialog` dengan input pemindai otomatis (*autofocus*) dan tombol hapus (*Clear* `X`).
  - Pemindaian barcode nota servis atau pengetikan nomor nota / nama pelanggan.
  - Kalkulasi real-time sisa hari garansi aktif, deteksi garansi kedaluwarsa, atau tanpa garansi.
  - Tombol langsung navigasi detail servis dan pengiriman ringkasan garansi via WhatsApp pelanggan.
  - Tombol **"Cek Garansi"** pada daftar servis di samping filter pencarian (`service-orders-page.tsx`).
- **Pesan WhatsApp Pengingat Pengambilan Unit (Follow-up Selesai):**
  - Template baru `service_order_pengingat` di `message-template.service.ts` dan halaman pengaturan pesan `message-templates-page.tsx`.
  - Tombol **"Pengingat Ambil (WA)"** di bilah status servis ketika pesanan berstatus *Selesai*, otomatis mengisi nama, perangkat, sisa tagihan, dan garansi.
- **Pengaturan Bahasa Dokumen Cetak PDF (Opsional 1 Halaman vs 2 Halaman):**
  - Opsi konfigurasi bahasa pada `invoice-settings-form.tsx`:
    - `id`: Bahasa Indonesia Saja (1 Halaman - Standar Toko, hemat kertas)
    - `en`: English Only (1 Page)
    - `both`: Bilingual (Hal. 1 Indonesia, Hal. 2 English)
  - Refactoring seluruh 6 template PDF (`service-pdf`, `invoice-pdf`, `sales-order-pdf`, `delivery-note-pdf`, `payment-pdf`, `receipt-pdf`) untuk mematuhi pengaturan bahasa yang dipilih.
- **Suite Pengujian Unit (Unit Tests):**
  - `src/features/service-orders/components/service-order-label-dialog.test.tsx`
  - `src/features/service-orders/components/service-warranty-lookup-dialog.test.tsx`
  - `src/features/products/components/product-barcode-label-dialog.test.tsx`
  - `src/services/message-template.service.test.ts`

### Diubah (Changed)
- **Alur Status Servis:**
  - Status servis distandarisasi menjadi alur bisnis yang jelas: `Diterima` ➔ `Menunggu Persetujuan` ➔ `Dikerjakan` ➔ `Selesai` (siap diambil di toko) ➔ `Diambil` (diserahkan ke pelanggan) ➔ `Garansi` (klaim garansi).
  - Dialog perubahan status (`service-order-status-dialog.tsx`) otomatis memicu pratinjau WhatsApp sesuai status tujuan dan memungkinkan perubahan template langsung.
  - Form garansi hanya muncul secara kontekstual ketika servis mencapai status *Selesai* atau *Diambil*.
  - Aksi tabel daftar servis diubah menjadi tombol navigasi **"Buka Order"** agar seluruh pengeditan terpusat rapi di halaman detail servis.
- **Eksposur Kolom SKU & Barcode Produk:**
  - Field SKU dan Barcode ditampilkan jelas pada kartu produk, tabel data produk, dan form pengeditan produk.
- **Branding Toko Dinamis:**
  - Dialog stiker label dan PDF cetak secara otomatis membaca nama toko resmi tenant dari database pengaturan lokal (`localDb.settings`).

### Diperbaiki (Fixed)
- Memperbaiki bug status garansi yang sebelumnya menampilkan "Tanpa Garansi" pada daftar pesanan servis meskipun garansi telah ditambahkan (lewat `resolveServiceWarranty`).
- Menghilangkan bug cetak dokumen PDF yang sebelumnya selalu mencetak 2 halaman (Bahasa Indonesia & Bahasa Inggris) secara berlebihan.
- Memperbaiki penanganan nomor WhatsApp pada dialog cek garansi agar otomatis membaca nomor pelanggan dari basis data lokal.

---

## [2.0.0] - 2026-11-20

### Ditambahkan
- Universal Service & Job Orders module: antrean servis, status alur pengerjaan, katalog jasa teknisi, dan penerimaan servis terintegrasi.
- Standard POS UX: dukungan split payment, partial payment (DP), nominal uang pas (*quick cash*), dan layout tablet/desktop yang responsif.
- Dukungan multi-platform: Web PWA, Android Capacitor dengan SQLite native, dan Desktop Tauri dengan plugin SQL.
- Outbox sync engine offline-first dengan deteksi konflik dan sinkronisasi otomatis ke cloud PostgreSQL.
