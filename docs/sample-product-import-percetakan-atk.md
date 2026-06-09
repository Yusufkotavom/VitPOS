# Sample Product Import: Percetakan + ATK

File sample CSV:

- `public/samples/products-import-percetakan-atk-umkm.csv`

Format mengikuti header import produk saat ini:

- `ID`
- `Nama Produk`
- `Kategori`
- `Jenis`
- `HPP`
- `Harga Jual`
- `Harga Grosir`
- `Stok`
- `Kelola Stok`
- `SKU`
- `Barcode`
- `Status`

Dasar harga yang dipakai:

- `Pandawa24Jam` untuk print BW dan print warna HVS.
- `Snapy` untuk print warna art paper / art carton dan spanduk.
- `Maxipro` untuk laminating.
- `PrimaGraphia` untuk X banner dan berbagai produk sticker.
- `PrintHUB` dan `Dexprint` untuk kartu nama.
- `BigGo`, `Indotrading`, dan listing marketplace yang teragregasi untuk produk Yasin dan ATK Joyko.

Catatan:

- Baris `Jasa` diset `Kelola Stok=false` dan `Stok=0`.
- Baris `Produk Fisik` diset `Kelola Stok=true`.
- Semua `ID` dikosongkan agar saat diimport dibuat sebagai produk baru.
- Harga ATK sekolah disusun dari snapshot listing publik Indonesia yang bisa dibaca saat sesi ini. Marketplace publik sering memberi harga per pcs dan per pack sekaligus, jadi beberapa item memakai harga retail satuan dan `Harga Grosir` pack yang paling dekat.

Ringkasan referensi harga yang dipakai:

- Print BW A4 HVS 70: `Rp250`
- Print BW A4 HVS 80: `Rp300`
- Print warna A4 HVS 80: `Rp2.000`
- Print warna A3 HVS 80: `Rp3.500`
- Print warna A4 art paper / art carton 1 muka: `Rp5.000`
- Laminating KTP: `Rp2.000`
- Laminating A4 / F4: `Rp5.000`
- Laminating A3: `Rp10.000`
- Spanduk: `mulai Rp17.000 / m2`
- X banner 60 x 160: `mulai Rp61.500`
- Kartu nama: `mulai Rp25.000 - Rp30.000 / box`
- Sticker vinyl A3: `Rp8.625`
- Sticker kromo A3: `Rp5.000`
- Sticker HVS A3: `Rp4.500`
- Sticker transparan A3: `Rp6.250`
- Sticker hologram A3: `Rp9.750`
- Sticker vinyl meteran latex: `Rp60.000`
- Sticker vinyl meteran UV: `Rp65.000`
- Cetak Yasin softcover 64 halaman: `Rp6.100`
- Cetak Yasin softcover 128 halaman HVS: `Rp22.000`
- Cetak Yasin softcover 128 halaman art paper: `Rp9.700`
- Cetak Yasin hardcover 128 halaman: `Rp25.000`
- Cetak Yasin hardcover 176 halaman: `Rp27.000`
- Pensil 2B Joyko P-88: `Rp1.500 / pcs`
- Pensil 2B Joyko P-92: `Rp13.700 / lusin`
- Pulpen Joyko BP-56PTL: `Rp2.600 / pcs`
- Gel Pen Joyko GP-371: `Rp4.000 / pcs`
- Penghapus Joyko kecil: `Rp1.999 / pcs`
- Penghapus Joyko besar ER-20BL: `Rp2.800 / pcs`
- Penggaris Joyko RL-P30 30 cm: `Rp4.000 / pcs`
- Penggaris Joyko RL-AC30 30 cm: `Rp6.000 / pcs`
- Notebook Joyko NB-718 A5: `Rp6.600 / pcs`
- Notebook Joyko NB-707 A5: `Rp8.300 / pcs`
- Correction Fluid Joyko JK-01: `Rp4.700 / pcs`
