# Desain: Laporan Ringan dan Onboarding Siap Pakai untuk UMKM Indonesia

Tanggal: 2026-06-12

## Ringkasan

Fase ini meningkatkan laporan dan onboarding agar terasa siap pakai untuk UMKM Indonesia, bukan sekadar demo. Fokus vertikal awal adalah ATK & printing. Onboarding memakai pendekatan gabungan ringan: pilih jenis usaha, isi data wajib, aktifkan template bisnis realistis, review cepat, lalu masuk dashboard yang sudah relevan.

Laporan disusun sebagai owner dashboard + detail drill-down. User melihat ringkasan penting dulu, lalu membuka detail hanya saat perlu. Tujuan utama: membantu owner tahu omzet, laba kotor, stok hampir habis, kas, piutang, serta produk/jasa terlaris tanpa membebani input atau tampilan.

## Tujuan

- Membuat onboarding terasa seperti setup bisnis nyata.
- Mengganti sample generik dengan template usaha realistis.
- Menyediakan laporan terstruktur namun ringan.
- Menghubungkan hasil onboarding ke dashboard dan laporan adaptif.
- Menjaga struktur feature-based modular.
- Mendukung local-first/offline-first workflow.

## Non-Goals Fase 1

- Multi-vertical penuh untuk semua jenis usaha.
- Accounting lengkap.
- Purchase workflow penuh.
- Job order printing kompleks.
- Export akuntansi detail.
- Integrasi printer/hardware.
- Pajak kompleks.

## Vertikal Awal

### ATK & Printing

Mode usaha:

- `atk_only`: fokus barang dan stok.
- `printing_only`: fokus jasa dan bahan habis pakai.
- `atk_printing_combo`: gabungan barang dan jasa.

Mode usaha menentukan:

- Produk/jasa awal.
- Dashboard cards.
- Laporan prioritas.
- Quick actions.
- Empty states.
- Insight rules.

## Arsitektur Fitur

### Auth / Onboarding

Onboarding menjadi business playbook selector. Flow tetap pendek dan tidak menjadi form panjang.

Direkomendasikan struktur:

```txt
src/features/auth/components/onboarding/
  vertical-selector.tsx
  business-mode-selector.tsx
  business-identity-form.tsx
  template-preview-card.tsx
  setup-review-panel.tsx

src/features/auth/data/
  business-playbooks.ts
```

### Reports

Reports memakai preset per vertikal agar menu dan ringkasan tidak generik.

```txt
src/features/reports/config/
  report-presets.ts
```

Reports tetap berisi halaman laporan yang sudah ada, tetapi menu dan summary cards diprioritaskan berdasarkan `businessVertical` dan `businessMode`.

### Dashboard

Dashboard memakai preset owner view per vertikal.

```txt
src/features/dashboard/config/
  dashboard-presets.ts
```

Dashboard tampil sebagai landing page pasca-onboarding, bukan halaman kosong.

### Local DB / Seed

Seed data dibuat dari playbook, bukan dummy statis.

Area terkait:

```txt
src/services/local-db/seeds.ts
src/services/local-db/schema.ts
src/services/local-db/repository.ts
```

Data seed perlu punya tag bisnis untuk laporan, misalnya `product`, `service`, `stationery`, `printing`, `cash`, `receivable`.

## Alur Onboarding

### Step 1: Pilih Jenis Usaha

Fase 1 menampilkan ATK & Printing sebagai pilihan utama.

Label UI:

- `ATK & Printing`

### Step 2: Pilih Model Usaha

Pilihan:

- `ATK saja`
- `Printing saja`
- `Gabungan ATK + Printing`

### Step 3: Isi Data Inti

Field wajib:

- Nama usaha.
- Nama pemilik.
- Nomor WhatsApp.
- Alamat.
- Jam buka.
- Kas awal.
- Pakai stok barang: ya/tidak.

Field optional dipindah ke settings:

- NPWP.
- NIB.
- Detail supplier.
- User/staf banyak.
- Pajak lanjutan.
- Device/printer config.

### Step 4: Aktifkan Template Bisnis

Sistem menampilkan preview:

- Kategori barang.
- Layanan aktif.
- Metode bayar.
- Stok minimum.
- Laporan utama.
- Quick actions.

### Step 5: Review Cepat

User dapat koreksi:

- Harga umum.
- Stok awal utama.
- Layanan yang dipakai.
- Item yang ingin disembunyikan.

### Step 6: Selesai

CTA akhir:

- `Masuk dan mulai transaksi`

Setelah klik, user masuk ke owner dashboard sesuai mode usaha.

## Data Awal ATK & Printing

### Kategori Default

- Kertas
- Alat Tulis
- Map & Arsip
- Perlengkapan Sekolah
- Printer & Tinta
- Jasa Dokumen
- Laminating & Jilid
- Aksesoris Kantor

### Produk Default

- Kertas A4 70gsm
- Kertas F4
- Kertas foto
- Pulpen Faster
- Pensil 2B
- Penghapus
- Spidol boardmarker
- Map snelhecter
- Ordner
- Stapler mini
- Isi staples
- Amplop coklat
- Lakban bening
- Tinta hitam
- Tinta warna
- Buku tulis
- HVS warna
- Plastik laminating

### Jasa Default

- Print hitam putih per lembar
- Print warna per lembar
- Fotokopi per lembar
- Scan dokumen
- Laminating
- Jilid spiral
- Pengetikan ringan
- Cetak foto

### Atribut Item

Tiap item wajib punya:

- Nama.
- Tipe: `product` atau `service`.
- Kategori.
- Satuan.
- Harga modal.
- Harga jual.
- Stok awal.
- Stok minimum.
- Status aktif/nonaktif.
- Tag laporan.

### Metode Bayar Default

- Tunai.
- QRIS.
- Transfer.
- Piutang.

### Quick Actions Default

- Transaksi baru.
- Tambah stok.
- Catat pengeluaran.
- Input piutang.
- Lihat barang hampir habis.

## Struktur Laporan

### Prinsip Menu

Menu laporan utama hanya lima:

- Ringkasan.
- Penjualan.
- Stok.
- Kas.
- Piutang.

Laporan lain menjadi detail atau drill-down, bukan menu utama.

### Dashboard Owner

Cards inti:

- Omzet hari ini.
- Laba kotor hari ini.
- Transaksi hari ini.
- Barang terlaris.
- Jasa terlaris.
- Barang hampir habis.
- Uang masuk.
- Uang keluar.
- Tagihan belum lunas.

Insight singkat:

- `Print warna naik dibanding kemarin.`
- `3 barang perlu restok.`
- `Piutang belum lunas Rp x.`

### Laporan Ringkasan

Tujuan: owner cepat paham kondisi usaha.

Isi:

- Omzet.
- Laba kotor.
- Transaksi.
- Kas masuk/keluar.
- Piutang.
- Stok hampir habis.
- Produk/jasa terlaris.

### Laporan Penjualan

Tujuan: tahu uang datang dari mana.

Filter default:

- Hari ini.
- 7 hari.
- Bulan ini.
- Custom.

Isi:

- Total omzet.
- Total transaksi.
- Rata-rata transaksi.
- Top barang.
- Top jasa.
- Penjualan per jam/per hari.
- Penjualan per metode bayar.

### Laporan Laba Kotor

Tujuan: owner tidak hanya melihat omzet.

Isi:

- Omzet.
- HPP.
- Laba kotor.
- Margin %.
- Margin per kategori.
- Margin per item top.

Untuk jasa printing, cost awal boleh sederhana:

- Kertas.
- Tinta estimasi.
- Biaya jasa opsional belakangan.

### Laporan Stok

Tujuan: bantu keputusan restok.

Default focus:

- Barang hampir habis.

Isi:

- Barang hampir habis.
- Barang tidak bergerak.
- Mutasi stok.
- Pembelian terakhir.
- Penjualan per item.

### Laporan Kas

Tujuan: owner memahami uang masuk dan keluar.

Isi:

- Kas masuk.
- Kas keluar.
- Saldo berjalan.
- Pengeluaran terbesar.
- Kategori pengeluaran.

### Laporan Piutang

Tujuan: mendukung langganan sekolah, kantor, pelanggan tetap.

Isi:

- Total belum lunas.
- Jatuh tempo dekat.
- Daftar pelanggan berutang.
- Histori pembayaran piutang.

## Aturan Supaya Tidak Memberatkan

### Untuk User

- Default periode pendek.
- Summary cards dulu.
- Detail dimuat saat dibuka.
- Chart hanya untuk tren utama.
- Hindari banyak filter di atas tabel.
- Pakai istilah bisnis Indonesia.

### Untuk Local DB

- Hitung summary dari local DB lebih dulu.
- Cache agregat harian per tenant bila diperlukan.
- Detail rows pakai pagination atau incremental loading.
- Laporan berat dibuka on demand.

### Untuk UX

Satu halaman laporan menjawab satu pertanyaan bisnis:

- Penjualan: apa yang paling laku?
- Stok: apa yang harus direstok?
- Kas: uang masuk keluar berapa?
- Piutang: siapa belum bayar?

## Hubungan Onboarding ke Laporan

### ATK Only

Dashboard menonjolkan:

- Stok.
- Barang laris.
- Restok.
- Margin barang.

### Printing Only

Dashboard menonjolkan:

- Jasa laris.
- Omzet per layanan.
- Bahan habis pakai.
- Kas.

### ATK + Printing Combo

Dashboard punya dua blok:

- Barang.
- Layanan.

Ringkasan tetap satu layar.

## Empty States Adaptif

Jangan tampilkan chart kosong banyak. Tampilkan ajakan kerja:

- `Tambah stok awal.`
- `Catat transaksi pertama.`
- `Aktifkan jasa print warna.`
- `Cek harga jual produk utama.`

## Checklist Pasca-Onboarding

Setelah user masuk dashboard, tampilkan checklist:

- Tambah 5 produk utama.
- Cek harga jasa.
- Catat transaksi pertama.
- Cek stok minimum.
- Lihat ringkasan hari ini.

Checklist boleh hilang setelah selesai atau user dismiss.

## Scope Implementasi Fase 1

### Onboarding

- Tambah pilihan vertikal dan mode usaha.
- Tambah playbook data ATK & printing.
- Tambah preview dan review step.
- Seed data realistis.
- Arahkan ke dashboard preset.

### Dashboard

- Tambah preset owner dashboard ATK & printing.
- Summary cards sesuai vertikal.
- Insight sederhana otomatis.
- Quick actions relevan.

### Reports

- Rapikan information architecture laporan.
- Fokus lima laporan utama: ringkasan, penjualan, stok, kas, piutang.
- Drill-down dari card ke detail.

### Data Layer

- Tambah mapping `businessVertical` dan `businessMode`.
- Tambah seed generator sesuai preset.
- Tambah tag item untuk grouping laporan.
- Tambah agregasi summary dasar.

## Urutan Build Aman

1. Business playbook schema + data.
2. Seed generator ATK & printing.
3. Onboarding flow baru.
4. Adaptive dashboard preset.
5. Report preset + menu simplification.
6. Summary aggregation.
7. Empty states + checklist awal.
8. Copy polish Indonesia UMKM.

## Testing dan Verifikasi

Minimum verifikasi setelah implementasi:

- Onboarding test untuk mode `atk_only`, `printing_only`, `atk_printing_combo`.
- Seed data test untuk produk, jasa, metode bayar, dan tags.
- Report preset test untuk daftar laporan per mode usaha.
- Dashboard summary test dengan data lokal.
- Empty state test saat belum ada transaksi.
- Project verification: lint, typecheck, tests, build/check sesuai script repo.

## Keputusan Desain

Pilih pendekatan vertical playbook karena:

- Onboarding terasa nyata tanpa form berat.
- Data awal relevan dengan usaha Indonesia.
- Dashboard dan laporan langsung menjawab kebutuhan owner.
- Pola bisa diperluas nanti ke counter HP, pulsa/BRILink, barbershop, dan usaha jasa lain.

## Risiko dan Mitigasi

### Risiko: Seed terasa terlalu banyak

Mitigasi: tampilkan review cepat dan opsi nonaktifkan item.

### Risiko: Laporan terasa kompleks

Mitigasi: menu utama hanya lima, detail on demand.

### Risiko: Mode usaha salah dipilih

Mitigasi: mode bisa diedit di settings, dashboard/report preset ikut berubah.

### Risiko: Data cost jasa printing belum presisi

Mitigasi: fase 1 pakai estimasi sederhana, detail cost printing masuk fase berikutnya.
