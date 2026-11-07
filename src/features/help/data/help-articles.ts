export type HelpCategory =
  | 'mulai'
  | 'servis_hp_komputer'
  | 'percetakan_atk'
  | 'kasir_pos'
  | 'stok_sparepart'
  | 'keuangan_kas'
  | 'lacak_pesanan'
  | 'offline_sinkron'

export type HelpArticle = {
  id: string
  title: string
  category: HelpCategory
  summary: string
  tags: string[]
  readingTime: string
  content: string
}

export const HELP_CATEGORIES: Array<{ id: HelpCategory; label: string; description: string; iconName: string }> = [
  {
    id: 'mulai',
    label: 'Panduan Memulai',
    description: 'Pendaftaran, pemilihan paket usaha, pengaturan profil & printer toko.',
    iconName: 'Rocket',
  },
  {
    id: 'servis_hp_komputer',
    label: 'Servis HP & Komputer',
    description: 'Penerimaan unit, tiket ber-QR, diagnosa, sparepart, garansi & notifikasi WhatsApp.',
    iconName: 'Wrench',
  },
  {
    id: 'percetakan_atk',
    label: 'Percetakan & ATK',
    description: 'Kalkulasi spanduk/banner per meter, order custom dengan DP, & kasir ATK.',
    iconName: 'Printer',
  },
  {
    id: 'kasir_pos',
    label: 'Kasir POS & Struk',
    description: 'Transaksi 3 detik, barcode scanner, multi-payment, split bill & kas bon.',
    iconName: 'ShoppingCart',
  },
  {
    id: 'stok_sparepart',
    label: 'Stok & Sparepart',
    description: 'Kartu riwayat stok, stok opname, peringatan barang menipis, dan supplier.',
    iconName: 'Boxes',
  },
  {
    id: 'keuangan_kas',
    label: 'Kas, Bank & Biaya Rutin',
    description: 'Setor modal, bayar tagihan bulanan (listrik, internet, sewa, gaji), & laba rugi.',
    iconName: 'Wallet',
  },
  {
    id: 'lacak_pesanan',
    label: 'Lacak Servis Mandiri',
    description: 'Cara pelanggan mengecek progres servis & cetak lewat link web tanpa download aplikasi.',
    iconName: 'Search',
  },
  {
    id: 'offline_sinkron',
    label: 'Offline-First & Cloud',
    description: 'Cara kerja toko tanpa internet, penyimpanan lokal Dexie, dan sinkronisasi otomatis.',
    iconName: 'CloudOff',
  },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'onboarding-panduan-setup',
    title: 'Cara Cepat Setup Toko Baru di KOTACOM Business Suite',
    category: 'mulai',
    summary: 'Langkah mudah memulai dari memilih bidang usaha (Servis HP, PC, Percetakan) sampai siap jualan dalam 3 menit.',
    tags: ['setup', 'pemula', 'onboarding', 'toko'],
    readingTime: '3 menit',
    content: `
### Memulai Setup Toko Anda

KOTACOM Business Suite dirancang untuk langsung siap pakai tanpa perlu instalasi rumit ataupun setup server.

#### Langkah 1: Pilih Jenis Usaha
Saat pertama kali mendaftar atau membuat tenant baru, sistem menyediakan preset siap pakai:
- **Servis HP & Gadget**: Langsung menyediakan kategori LCD, Baterai, Jasa Servis, dan Aksesoris.
- **Servis Komputer, Laptop & Printer**: Langsung terisi jasa instalasi OS, pembersihan pasta, SSD, RAM, dan servis cartridge printer.
- **Percetakan & ATK**: Siap dengan produk kertas, pulpen, jasa fotokopi, laminating, dan cetak.
- **Usaha Umum**: Template bersih minimalis untuk segala jenis ritel.

#### Langkah 2: Lengkapi Data Identitas Toko
Masuk ke menu **Pengaturan > Info Perusahaan** (\`/settings/company\`):
1. Masukkan **Nama Toko / Bengkel / Percetakan**.
2. Unggah **Logo Toko** (akan otomatis tercetak di struk nota dan halaman lacak pelanggan).
3. Masukkan **Alamat Lengkap** dan **Nomor WhatsApp Toko**.
4. Simpan perubahan.

#### Langkah 3: Setting Printer Struk Thermal
KOTACOM mendukung printer thermal Bluetooth dan USB ukuran 58mm maupun 80mm:
- Buka menu **Pengaturan > Struk & Invoice** (\`/settings/invoice\`).
- Pilih lebar kertas (58mm untuk printer mini / portable, 80mm untuk printer kasir desktop).
- Masukkan catatan kaki nota (misal: S&K Garansi Servis atau ucapan terima kasih).
    `,
  },
  {
    id: 'alur-tiket-servis-hp-komputer',
    title: 'Alur Lengkap Penerimaan & Tiket Servis (HP, Laptop, PC)',
    category: 'servis_hp_komputer',
    summary: 'Panduan step-by-step: terima unit masuk, cetak tanda terima QR, diagnosa teknisi, potong stok sparepart, hingga penyerahan.',
    tags: ['servis', 'tiket', 'qr code', 'hp', 'laptop', 'teknisi'],
    readingTime: '5 menit',
    content: `
### Alur Standar Servis Profesional

Dengan sistem tiket servis di KOTACOM (\`/service-orders\`), toko servis Anda beroperasi setara dengan Service Center Resmi.

#### 1. Menerima Unit Masuk (Check-in)
Buka menu **Service Order > Buat Order Baru** (\`/service-orders/create\`):
1. **Pilih / Tambah Pelanggan**: Masukkan nama dan nomor WhatsApp aktif.
2. **Keterangan Barang & Kerusakan**:
   - Tipe unit: misal *iPhone 11 128GB Black* atau *Asus Vivobook A412FA*.
   - Nomor Seri / IMEI.
   - Pola kunci / PIN layar (bila diperlukan untuk pengujian teknisi).
   - Kelengkapan yang dibawa: unit saja, charger bawaan, tas laptop, dus.
   - Keluhan pelanggan: misal *LCD blank sentuh tidak bisa, minta ganti original*.
3. **Estimasi Biaya & Uang Muka (DP)**:
   - Jika pelanggan menitipkan uang muka untuk beli part, catat nominal DP di bagian pembayaran.

#### 2. Cetak Tanda Terima Ber-QR Code
- Klik **Simpan & Cetak**. Tanda terima ringkas akan tercetak di printer thermal atau format A4.
- Struk memuat **QR Code khusus**. Tempelkan stiker/struk ini pada unit servis agar tidak tertukar di meja teknisi.

#### 3. Update Pengerjaan Teknisi
- Buka detail tiket servis (\`/service-orders/:id\`).
- Ubah status pengerjaan sesuai progres nyata:
  - **Menunggu Diagnosa** ➔ **Sedang Dikerjakan** ➔ **Menunggu Sparepart** ➔ **Selesai Siap Diambil**.
- Masukkan suku cadang yang digunakan: misal *LCD iPhone 11 (1 pcs)*. Stok sparepart di gudang toko otomatis berkurang secara akurat.

#### 4. Kirim Notifikasi WhatsApp Otomatis
- Saat status diubah ke **Selesai**, klik tombol **"Kirim WhatsApp"**.
- Sistem otomatis membuka WhatsApp dengan template pesan rapi: mengabarkan bahwa unit telah selesai, total tagihan sisa, dan link pelacakan online.

#### 5. Pengambilan Unit & Garansi
- Saat pelanggan datang mengambil barang, klik **Serah Terima / Selesai**.
- Terima pelunasan sisa tagihan (Tunai, QRIS, atau Transfer).
- Masa garansi servis (misal: 14 hari atau 30 hari) otomatis mulai dihitung sejak tanggal pengambilan.
    `,
  },
  {
    id: 'lacak-servis-mandiri-pelanggan',
    title: 'Fitur Lacak Pesanan / Servis Mandiri untuk Pelanggan',
    category: 'lacak_pesanan',
    summary: 'Bagaimana pelanggan toko dapat memeriksa status servis tanpa perlu repot chat tanya-tanya ke teknisi.',
    tags: ['tracking', 'lacak', 'portal', 'pelanggan', 'whatsapp'],
    readingTime: '3 menit',
    content: `
### Solusi Anti Diteror Chat WhatsApp

Masalah terbesar pemilik toko servis dan percetakan adalah seringnya pelanggan chat berulang kali menanyakan: *"Kak barang saya sudah jadi belum?"*.

KOTACOM menyelesaikan ini dengan **Portal Lacak Publik**:

#### Cara Kerja Lacak Mandiri:
1. Setiap toko memiliki URL publik resmi:
   \`https://vitpos.devk.my.id/store/[slug-toko]/track\`
2. Pelanggan cukup:
   - Memindai QR Code di struk nota yang diberikan kasir, ATAU
   - Membuka link dan memasukkan nomor HP mereka / kode nota servis.
3. Halaman tracking akan menampilkan:
   - Status pengerjaan terkini dengan badge visual yang jelas.
   - Rincian kerusakan dan suku cadang yang diganti.
   - Status pembayaran (Total Biaya, DP yang sudah dibayar, dan Sisa Tagihan).
   - Masa garansi yang berlaku.

#### Keuntungan untuk Bisnis Anda:
- Menghemat 80% waktu teknisi yang biasanya habis untuk melayani chat pertanyaan status.
- Memberikan impresi modern dan transparan, membangun kepercayaan pelanggan loyal.
- Pelanggan tidak perlu mengunduh aplikasi apa pun — cukup buka lewat browser smartphone mereka.
    `,
  },
  {
    id: 'alur-percetakan-custom-dp',
    title: 'Panduan Toko Percetakan & Digital Printing (Spanduk, Banner, ATK)',
    category: 'percetakan_atk',
    summary: 'Mengelola kombinasi kasir cepat ATK dan pesanan cetak custom dengan sistem uang muka (DP).',
    tags: ['percetakan', 'digital printing', 'banner', 'dp', 'atk'],
    readingTime: '4 menit',
    content: `
### Dua Mode Kerja Toko Percetakan

Toko percetakan umumnya memiliki 2 alur transaksi yang berbeda:

#### 1. Transaksi Langsung (Kasir POS / \`/pos\`)
Digunakan untuk penjualan barang retail dan jasa kilat:
- Fotokopi, print dokumen tugas skripsi / kantor per lembar.
- Pembelian kertas rim, map, pulpen, amplop.
- Transaksi selesai dalam hitungan detik dengan cetak struk langsung.

#### 2. Pesanan Cetak Custom & Antrean Mesin
Untuk pesanan spanduk, banner, x-banner, baliho, kartu nama, atau jilid buku tebal:
- Masuk ke menu **Service Order / Jasa** atau **Sales Orders**.
- Masukkan spesifikasi ukuran: contoh *Banner Flexi 280gr Ukuran 3x1 meter (3 m²)*.
- **Terima Uang Muka (DP)**: Catat DP 50% yang dibayarkan konsumen saat memasukkan file desain.
- Masukkan catatan pengerjaan: misal *Finishing mata ayam 4 sudut*.
- Saat mesin selesai mencetak dan pesanan siap diambil, beri tahu pelanggan via WhatsApp dan terima pelunasan saat serah terima spanduk.
    `,
  },
  {
    id: 'kasir-offline-first-anti-lemot',
    title: 'Teknologi Offline-First: Jualan Tetap Nyala Tanpa Internet',
    category: 'offline_sinkron',
    summary: 'Memahami bagaimana data Anda tetap aman dan kasir tetap berfungsi saat WiFi toko mati atau sinyal drop.',
    tags: ['offline', 'sync', 'dexie', 'internet', 'toko'],
    readingTime: '4 menit',
    content: `
### Mengapa Offline-First Begitu Penting untuk UMKM?

Banyak aplikasi kasir berbasis web murni yang langsung macet total, layar putih, atau gagal cetak struk ketika koneksi internet di toko terganggu.

KOTACOM dibangun dengan arsitektur **Offline-First Hybrid**:

#### 1. Database Lokal Cepat di Perangkat (IndexedDB / Dexie)
- Semua data produk, harga, pelanggan, dan riwayat transaksi tersimpan langsung di browser/perangkat Anda.
- Respon kasir instan 0 milidetik tanpa menunggu loading server luar.

#### 2. Transaksi Tetap Berjalan Saat Offline
- Saat internet mati, lampu indikator di pojok kanan atas akan berubah menjadi **Mode Offline**.
- Kasir tetap bisa mencari produk, menambah barang, memilih pembayaran tunai/piutang, dan mencetak struk thermal.
- Transaksi disimpan ke dalam antrean offline (*outbox queue*).

#### 3. Sinkronisasi Otomatis Saat Online Kembali
- Begitu koneksi internet kembali tersambung, sistem secara otomatis mengirimkan semua data transaksi ke cloud tanpa perlu Anda klik apa pun.
- Status data akan berubah menjadi: *"Data sudah aman di cloud"*.
    `,
  },
  {
    id: 'kas-bank-setor-modal-biaya-rutin',
    title: 'Buku Kas & Bank: Setor Modal, Biaya Bulanan, dan Laba Rugi',
    category: 'keuangan_kas',
    summary: 'Cara mencatat suntikan modal pemilik, tagihan rutin listrik/WiFi/gaji, dan melihat laba bersih toko yang sesungguhnya.',
    tags: ['kas', 'bank', 'setor modal', 'biaya rutin', 'laba rugi', 'akuntansi'],
    readingTime: '4 menit',
    content: `
### Memisahkan Keuangan Usaha dan Pribadi

Jangan sampai toko Anda tampak ramai pembeli tetapi kas sebenarnya kosong karena biaya operasional tidak tercatat.

#### 1. Cara Mencatat Setoran Modal Pemilik
- Buka menu **Kas & Bank** (\`/cash\`) ➔ **Tambah Transaksi**.
- Pilih tipe: **Pemasukan (Kas Masuk)**.
- Kategori: **Setor Modal**.
- Akun: Pilih *Kas Tunai Toko* atau *Rekening Bank BCA/Mandiri*.
- *Dampak Akuntansi:* Sistem mencatat Debit Kas dan Kredit Modal Pemilik. Transaksi ini **tidak dimasukkan sebagai omset penjualan** di Laba Rugi, sehingga laba operasional toko tetap bersih dan akurat.

#### 2. Transaksi Rutin Bulanan (1-Klik)
- Di bagian atas halaman Kas & Bank, klik tombol **"Transaksi Rutin"**.
- KOTACOM telah menyediakan template default untuk UMKM:
  - Listrik & Air PLN/PDAM
  - Internet & WiFi Toko
  - Gaji Karyawan / Teknisi
  - Biaya Sewa Kios / Ruko
- Cukup klik **"Catat Sekarang"** atau **"Catat Semua yang Belum"** setiap awal bulan. Anda tidak perlu mengetik ulang setiap bulan.

#### 3. Melihat Laporan Laba Rugi Bersih
- Buka menu **Laporan > Laba Rugi** (\`/reports/profit-loss\`).
- Pendapatan (Penjualan barang + Jasa Servis/Cetak) dikurangi Harga Pokok Penjualan (HPP sparepart/kertas) dan dikurangi Biaya Operasional (listrik, gaji, sewa) menghasilkan **Laba Bersih Nyata**.
    `,
  },
  {
    id: 'garansi-servis-dan-spesifikasi',
    title: 'Manajemen Garansi Servis & Proteksi Komplain Pelanggan',
    category: 'servis_hp_komputer',
    summary: 'Mencegah kerugian toko dari komplain yang tidak wajar dengan masa garansi otomatis dan syarat nota.',
    tags: ['garansi', 'komplain', 'kebijakan', 'teknisi', 'nota'],
    readingTime: '3 menit',
    content: `
### Menjaga Reputasi Toko Servis Anda

Seringkali pelanggan kembali 2 bulan kemudian mengklaim bahwa HP atau laptop mereka rusak lagi dan meminta servis gratis.

#### Solusi Garansi Otomatis KOTACOM:
1. **Atur Durasi Garansi**: Saat membuat tiket servis, tentukan masa garansi (contoh: 7 hari, 14 hari, atau 30 hari).
2. **Kalkulasi Otomatis**: Sistem secara otomatis menghitung tanggal kedaluwarsa garansi terhitung sejak tanggal unit diserahkan/diambil.
3. **Pemeriksaan Cepat**: Jika pelanggan datang kembali, cukup ketik nomor HP atau nomor nota di daftar servis. Status garansi akan langsung menampilkan badge hijau *(Garansi Aktif)* atau badge merah *(Garansi Telah Berakhir)*.
4. **Syarat & Ketentuan di Nota**: Di bagian bawah struk nota otomatis tertera catatan: *"Garansi tidak berlaku bila segel rusak, terkena cairan, atau jatuh"*.
    `,
  },
]
