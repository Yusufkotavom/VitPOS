# Panduan Fitur Operasional & Bisnis

Panduan ini mendokumentasikan fitur-fitur baru dan alur operasional di **VitPOS / KOTACOM Business Suite**, khususnya modul Servis & Reparasi (*Service Orders*), Manajemen Barcode & Label Thermal, dan Sistem Notifikasi WhatsApp.

---

## 1. Modul Service Order (Jasa & Reparasi)

Modul Service Order dirancang untuk bisnis servis laptop, komputer, printer, smartphone, elektronik, dan bengkel.

### 1.1 Alur Status Servis Baku
Alur pengerjaan unit servis disusun secara terstruktur:
1. **Diterima:** Unit fisik diterima dari pelanggan. Kasir/teknisi mencatat keluhan, spesifikasi perangkat, kelengkapan, dan estimasi biaya awal.
2. **Menunggu Persetujuan:** Jika ditemukan kerusakan tambahan atau penggantian sparepart dengan biaya lebih tinggi, sistem dapat mengirim WhatsApp konfirmasi persetujuan biaya ke pelanggan.
3. **Dikerjakan:** Teknisi sedang melakukan perbaikan atau penggantian komponen.
4. **Selesai:** Pengerjaan tuntas dan unit lulus uji kendali mutu (*quality check*). Unit **siap diambil** di toko, dan form input masa garansi toko aktif di tahap ini.
5. **Diambil:** Unit fisik telah diserahkan kembali kepada pelanggan, pembayaran lunas diterima, dan tanda terima penyerahan diberikan.
6. **Garansi:** Digunakan jika pelanggan mengajukan klaim garansi dalam masa proteksi yang telah ditentukan.
7. **Batal:** Digunakan jika perbaikan dibatalkan atas kesepakatan bersama.

### 1.2 Integrasi WhatsApp Otomatis
Setiap perubahan status dapat langsung mengirim pesan WhatsApp ke pelanggan:
- Menggunakan nomor HP pelanggan yang tersimpan atau nomor yang dimasukkan saat itu.
- Template otomatis sesuai status (*Tanda Terima Masuk*, *Konfirmasi Biaya*, *Proses Pengerjaan*, *Unit Selesai & Siap Diambil*, *Penyerahan Unit*, *Garansi*, dan *Pembatalan*).
- Opsi simpan nomor baru ke master data pelanggan dengan sekali centang.

---

## 2. Cetak Stiker Label Barcode Unit Servis (Thermal)

### 2.1 Tujuan & Kegunaan
Menempelkan stiker barcode fisik langsung pada bodi perangkat pelanggan (casing laptop, printer, smartphone) agar unit tidak tertukar di meja kerja teknisi.

### 2.2 Cara Menggunakan
1. Buka halaman detail servis (`/service-orders/:id`).
2. Klik tombol **"Cetak Label"** pada bilah tindakan di bagian atas.
   *(Atau pilih opsi **"Stiker Label Unit (Thermal)"** langsung setelah membuat pesanan servis baru).*
3. Pilih ukuran kertas thermal yang sesuai:
   - **50 × 30 mm:** Ukuran stiker standar label printer (sangat direkomendasikan).
   - **40 × 30 mm:** Ukuran stiker mini untuk perangkat ringkas.
   - **58 mm:** Format struk roll stiker continuous.
4. Klik tombol **"Cetak Label Stiker"**. Sistem akan membuka jendela cetak dengan layout siap pakai untuk printer thermal seperti *Xprinter, Blueprint, Panda, TSC, atau Zebra*.

### 2.3 Informasi pada Label
- Nama Toko & Tanggal Penerimaan
- Barcode `CODE128` (dapat dipindai langsung dengan barcode scanner)
- Kode Nota Servis (misal `SRV-0007`)
- Nama Pelanggan & Nomor WhatsApp
- Tipe Unit & Ringkasan Keluhan Fisik

---

## 3. Cetak Stiker Label Barcode Produk (Rak & Etalase)

### 3.1 Tujuan & Kegunaan
Mencetak barcode harga pada rak toko atau kemasan produk fisik untuk mempercepat transaksi kasir di POS menggunakan scanner.

### 3.2 Cara Menggunakan
1. Buka menu **Produk** (`/products`).
2. Pada tabel atau kartu produk, klik tombol **"Label"**.
3. Atur preferensi pencetakan:
   - **Ukuran Label:** `40x30 mm` (standar rak), `50x30 mm` (lebar), atau `33x15 mm` (mini aksesoris).
   - **Jumlah Cetak:** Masukkan jumlah lembar yang ingin dicetak, atau klik tombol **"Stok (N)"** untuk otomatis mencetak sesuai sisa stok fisik.
   - **Tampilkan Opsi:** Centang apakah ingin menampilkan *Harga Jual*, *Nama Toko*, dan *Kode SKU*.
4. Klik **"Cetak Label"**.

---

## 4. Fitur Cek Garansi Cepat (Quick Warranty Lookup)

### 4.1 Tujuan & Kegunaan
Mempermudah kasir dan teknisi mengecek masa berlaku garansi unit yang dibawa kembali oleh pelanggan tanpa harus mencari manual di ratusan riwayat nota.

### 4.2 Cara Menggunakan
1. Buka menu **Service Order** (`/service-orders`).
2. Klik tombol hijau **"Cek Garansi"** di samping tombol Filter.
3. Cukup **scan barcode pada stiker unit** dengan barcode scanner, atau ketik nomor nota (misal `SRV-0001`) / nama pelanggan.
4. Sistem secara instan menampilkan:
   - **Garansi Aktif:** Menampilkan sisa hari aktif dan tanggal jatuh tempo garansi.
   - **Garansi Habis:** Menampilkan tanggal berakhirnya garansi.
   - **Tanpa Garansi:** Menandakan nota dibuat tanpa fasilitas garansi.
5. Tersedia tombol cepat:
   - **Buka Detail:** Membuka riwayat lengkap pekerjaan servis.
   - **Kirim WA:** Mengirimkan kartu konfirmasi status garansi ke nomor WhatsApp pelanggan.

---

## 5. Pengaturan Dokumen Cetak PDF (Opsional 1 Halaman vs 2 Halaman)

### 5.1 Tujuan & Kegunaan
Mencegah pemborosan kertas saat mencetak nota servis, invoice penjualan, surat jalan, dan kuitansi.

### 5.2 Cara Mengatur Bahasa & Halaman
1. Buka menu **Pengaturan** ➔ **Nota & Invoice** (`/settings/invoice`).
2. Pada kartu pengaturan **"Bahasa Dokumen Cetak (PDF / Print)"**, pilih opsi yang diinginkan:
   - **Bahasa Indonesia Saja (1 Halaman - Standar):** Dokumen dicetak rapi 1 lembar dalam Bahasa Indonesia (paling hemat kertas).
   - **English Only (1 Page):** Dokumen dicetak 1 lembar dalam Bahasa Inggris.
   - **Bilingual (Hal. 1 Indonesia, Hal. 2 English):** Dokumen mencetak 2 halaman rangkap untuk kebutuhan pelanggan korporat/eksternal.
3. Klik **"Simpan Pengaturan"**.
