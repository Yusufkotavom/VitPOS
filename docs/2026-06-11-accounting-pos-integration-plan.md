# Plan: Penyatuan Engine POS & Shift serta Pengembangan Modul Akuntansi Terpadu (Buku Besar & Laba Rugi)

Dokumen ini berisi rancangan pengembangan untuk mengatasi masalah inkonsistensi antara modul Kasir (POS) dan Sesi (Shift), serta memperluas kapabilitas pelaporan keuangan menjadi sistem akuntansi *double-entry* yang berkesinambungan (Buku Besar, Laba/Rugi, dan Neraca).

## 1. Integrasi POS dan Shift (Sesi Kasir)

Saat ini, POS dan Shift berjalan sendiri-sendiri, bahkan menggunakan data *mock* pada layarnya. Sistem ini harus dikunci dan digabungkan.

### Alur Baru:
1. **Pengecekan Sesi Aktif (Guard):**
   - Saat *user* masuk ke halaman `/pos`, sistem akan mengecek apakah ada `shift` yang berstatus `active` untuk *user* (kasir) yang sedang login pada hari tersebut.
   - Jika **tidak ada**, *user* akan dilempar secara otomatis ke halaman `/shift/open` (Buka Sesi).
2. **Buka Sesi (Open Shift):**
   - Kasir harus memasukkan **Modal Awal (Start Cash)** secara nyata. Data disimpan di tabel `shifts` (SQLite/Dexie) dan langsung disinkronkan ke server.
   - `posStore` (Zustand) menyimpan state `activeShiftId`.
3. **Pencatatan Transaksi:**
   - Semua transaksi (Sales Order) yang terjadi lewat layar POS wajib memiliki relasi `shiftId`.
   - Jika ada pembayaran/pengeluaran uang dari laci (Kas), hal tersebut juga dicatat di tabel `cash` dengan relasi `shiftId`.
4. **Tutup Sesi (Close Shift):**
   - Sistem akan menghitung otomatis: `Modal Awal + Total Penjualan Tunai - Pengeluaran Shift = Expected Cash`.
   - Kasir akan memasukkan `Actual Cash` (Uang riil di laci). Selisih (*Difference*) akan langsung dicatat.

## 2. Pembangunan Engine Akuntansi Berkesinambungan

Laporan Laba/Rugi dan Neraca yang akurat tidak dapat hanya mengandalkan perhitungan agregasi mentah dari tabel `payments` atau `cash`. Diperlukan layer **Buku Besar (General Ledger)**.

### Perombakan / Ekstensi Skema Database:
Kita perlu memperkenalkan tabel **Jurnal Umum (Journal Entries)** dan **Detail Jurnal (Journal Lines)** atau secara konseptual mengubah *service* pelaporan untuk memetakan setiap mutasi ke model debit/kredit standar.

**Chart of Accounts (Bagan Akun) Dasar:**
*   **Aset (1000):** Kas & Bank, Piutang Usaha, Persediaan Barang (Inventory).
*   **Kewajiban (2000):** Hutang Usaha (Payable).
*   **Ekuitas (3000):** Modal, Laba Ditahan.
*   **Pendapatan (4000):** Pendapatan Penjualan (Sales Revenue).
*   **Beban (5000):** Harga Pokok Penjualan (COGS / HPP), Beban Operasional (Expenses), Retur Penjualan.

### Triggers Jurnal (Event Keuangan):

Setiap aksi pengguna akan memicu pembentukan mutasi berkesinambungan:

1. **POS Sale (Penjualan Tunai):**
   - **Debit:** Kas (Total Bayar)
   - **Kredit:** Pendapatan Penjualan (Subtotal)
   - *(Jika menggunakan metode perpetual untuk stok)*
   - **Debit:** HPP / COGS (Nilai modal barang)
   - **Kredit:** Persediaan Barang
2. **Credit Sale (Piutang):**
   - **Debit:** Piutang Usaha (Sisa Belum Dibayar)
   - **Kredit:** Pendapatan Penjualan
3. **Pembelian Barang (Purchase):**
   - **Debit:** Persediaan Barang (Total Nilai Barang)
   - **Kredit:** Kas (Jika lunas) / Hutang Usaha (Jika tempo)
4. **Pembayaran Hutang/Piutang:**
   - (Bayar Hutang) **Debit:** Hutang Usaha, **Kredit:** Kas
   - (Terima Piutang) **Debit:** Kas, **Kredit:** Piutang Usaha
5. **Retur:** Membalik jurnal penjualan atau pembelian terkait.

## 3. Tahapan Eksekusi (Roadmap)

**Fase 1: Kunci Akses POS dengan Shift (Sesi) - Estimasi: Cepat**
*   Hapus *mock data* di modul Shift.
*   Buat `useActiveShift` hook untuk membaca dari `shiftRepository`.
*   Buat *Guard Component* di atas rute `/pos` yang me-*redirect* ke halaman form `Open Shift`.
*   Tautkan `shiftId` ke dalam skema tabel `salesOrders` atau `payments` sebagai ref tambahan.
*   Gubah halaman *Close Shift* untuk membaca total transaksi berdasarkan `shiftId` dari repositori.

**Fase 2: Arsitektur Buku Besar (Ledger Engine) Dasar - Estimasi: Menengah**
*   Bangun fungsi utilitas *ledger-engine* yang berjalan setiap kali transaksi berhasil di-*upsert*.
*   Buat repositori virtual atau tabel `journalEntries` dan `journalLines` (tergantung apakah kita akan materialisasikan ini ke tabel SQLite khusus atau menghitung *on-the-fly* dari referensi pembayaran). Sangat direkomendasikan membuat tabel agar Neraca/Laba Rugi mudah ditarik cepat.

**Fase 3: Pembuatan Laporan Keuangan (Reports) - Estimasi: Menengah**
*   Gubah halaman laporan `/reports` saat ini.
*   Buat tab / halaman khusus: **Buku Besar**, **Laba Rugi (Income Statement)**, dan **Neraca (Balance Sheet)**.
*   Laporan ini membaca langsung dari Ledger hasil rekap (Fase 2).
*   Pastikan tabel pergerakan (*movements*) baik stok maupun uang kas semuanya memiliki satu bahasa yang sama (*referenceId*, *date*, *amount*).

---
*Rencana ini siap untuk dieksekusi secara berurutan. Prioritas pertama yang sebaiknya dilakukan adalah menyelesaikan Fase 1 agar modul kasir berfungsi murni sebagai mesin produksi riil.*
