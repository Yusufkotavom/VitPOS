import {
  WifiOff,
  Search,
  Boxes,
  Wallet,
  Printer,
  Smartphone,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: WifiOff,
    title: 'Offline-First Hybrid (Anti Internet Mogok)',
    description:
      'Internet toko mati atau mati lampu mendadak? Kasir dan pencatatan tiket servis tetap berfungsi 100%. Data tersimpan aman di perangkat dan otomatis sinkron ke cloud saat online.',
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    icon: Search,
    title: 'Portal Lacak Servis Mandiri Pelanggan',
    description:
      'Pelanggan cukup memindai QR Code di struk nota untuk mengecek status pengerjaan secara langsung lewat browser HP tanpa perlu instal aplikasi atau repot chat WhatsApp toko.',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Boxes,
    title: 'Manajemen Sparepart & Stok Terpadu',
    description:
      'Peringatan otomatis saat stok LCD, baterai, SSD, RAM, atau kertas menipis. Kartu riwayat stok mencatat keluar-masuk barang secara transparan untuk mencegah kehilangan.',
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    icon: Wallet,
    title: 'Buku Kas, Bank & Biaya Rutin Bulanan',
    description:
      'Pencatatan setor modal, ambil prive, dan 1-klik catat tagihan bulanan (listrik PLN, WiFi, sewa ruko, gaji karyawan). Laporan laba rugi menghitung keuntungan bersih nyata.',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    icon: Printer,
    title: 'Cetak Struk Thermal 58/80mm & Invoice A4',
    description:
      'Kompatibel dengan semua jenis printer thermal Bluetooth dan USB kasir. Cetak tanda terima ber-QR, struk belanja ritel, hingga invoice tagihan resmi ukuran A4/PDF.',
    color: 'text-pink-500 bg-pink-500/10',
  },
  {
    icon: Smartphone,
    title: 'Responsif di Komputer, Tablet, & Smartphone',
    description:
      'Bisa dibuka di laptop teknisi meja servis, monitor kasir depan, maupun dari HP pemilik toko saat sedang berada di luar untuk memantau omzet harian.',
    color: 'text-indigo-500 bg-indigo-500/10',
  },
]

const DEEP_DIVE_MODULES = [
  {
    tag: 'Modul Kasir & Transaksi',
    badge: 'Kasir POS Kilat',
    title: 'Kasir POS Kilat dengan Fleksibilitas Multi-Pembayaran',
    subtitle:
      'Proses antrean cepat dengan alur checkout 3–5 sentuhan. Cocok untuk toko ritel, aksesoris, maupun pembayaran pesanan percetakan.',
    image: '/images/landing/pos-screen.png',
    alt: 'Tampilan Nyata Kasir POS VitPOS',
    reverse: false,
    points: [
      {
        title: 'Multi-Metode Pembayaran Lengkap',
        desc: 'Menerima Tunai (hitung kembalian cepat), QRIS dinamis/statis, Transfer Bank (BCA, Mandiri, BRI, BNI), E-Wallet, hingga Piutang pelanggan bertahap.',
      },
      {
        title: 'Cetak Struk Thermal 58/80mm & Nota WhatsApp',
        desc: 'Cetak struk nota kasir ke printer Bluetooth/USB secara instan atau kirim struk digital rapi via WhatsApp pelanggan dalam 1-klik.',
      },
      {
        title: 'Split Payment & Diskon Kustom',
        desc: 'Pelanggan bisa membayar dengan kombinasi tunai + transfer atau memberikan diskon nominal/persen per item secara transparan.',
      },
    ],
  },
  {
    tag: 'Modul Servis & Reparasi',
    badge: 'Service Order Pro',
    title: 'Pusat Kendali Service Order & Antrean Teknisi',
    subtitle:
      'Kelola penerimaan servis HP, laptop, komputer, dan order print dengan alur status terstruktur dan tiket ber-QR Code.',
    image: '/images/landing/service-orders.png',
    alt: 'Tampilan Nyata Manajemen Service Order VitPOS',
    reverse: true,
    points: [
      {
        title: 'Form Cek-in Detail & Lengkap',
        desc: 'Catat nomor seri/IMEI, tipe unit, pola kunci layar, kelengkapan bawaan (charger/tas), catatan keluhan pelanggan, dan estimasi waktu selesai.',
      },
      {
        title: 'Pemakaian Sparepart Otomatis Potong Stok',
        desc: 'Saat teknisi memasukkan LCD, baterai, RAM, atau kertas yang dipakai, stok gudang otomatis terpotong dan HPP modal jasa terhitung akurat.',
      },
      {
        title: 'Tiket Ber-QR Code & Garansi Resmi',
        desc: 'Cetak tanda terima servis ber-QR untuk dilacak mandiri oleh pelanggan, lengkap dengan pencantuman masa garansi toko (7–30 hari).',
      },
    ],
  },
  {
    tag: 'Modul Laporan & Analisis',
    badge: 'Laporan Penjualan & Service',
    title: 'Laporan Penjualan & Service Terpadu Realtime',
    subtitle:
      'Konsolidasikan seluruh omzet kasir POS dan pendapatan jasa servis dalam satu laporan komprehensif tanpa ada data yang tercecer.',
    image: '/images/landing/sales-reports.png',
    alt: 'Tampilan Nyata Laporan Penjualan dan Service VitPOS',
    reverse: false,
    points: [
      {
        title: 'Omzet Gabungan & Kartu Metrik Transparan',
        desc: 'Pantau Total Omzet, Porsi Pendapatan Jasa Service, Penjualan Produk POS, Total Uang Masuk, dan Sisa Piutang pelanggan.',
      },
      {
        title: 'Tab Navigasi Transaksi Khusus',
        desc: 'Pilah dengan mudah antara tab Semua Transaksi, Penjualan POS, dan Service Order, lengkap dengan filter status pembayaran dan tanggal.',
      },
      {
        title: 'Top Produk & Jasa Terlaris + Ekspor CSV',
        desc: 'Ketahui barang atau jasa apa yang paling banyak menghasilkan profit serta unduh laporan transaksi lengkap ke Excel/CSV.',
      },
    ],
  },
  {
    tag: 'Modul Inventori & Gudang',
    badge: 'Stok & Sparepart',
    title: 'Kontrol Stok Suku Cadang, Bahan Baku & Mutasi',
    subtitle:
      'Hindari kehabisan suku cadang penting atau kehilangan barang dengan kartu riwayat stok dan peringatan stok menipis.',
    image: '/images/landing/products-inventory.png',
    alt: 'Tampilan Nyata Manajemen Produk dan Inventori VitPOS',
    reverse: true,
    points: [
      {
        title: 'Klasifikasi Produk Fleksibel',
        desc: 'Pisahkan dengan jelas antara Produk Fisik (aksesoris, sparepart), Jasa Teknisi, dan Bahan Baku percetakan (kertas rim, tinta, toner).',
      },
      {
        title: 'Peringatan Stok Rendah Otomatis',
        desc: 'Sistem memberi sinyal visual saat stok berada di bawah batas aman agar Anda dapat segera melakukan reorder ke supplier.',
      },
      {
        title: 'Kartu Riwayat Mutasi Stok Transparan',
        desc: 'Setiap barang keluar atau masuk akibat penjualan kasir, pemakaian servis, retur, atau penyesuaian opname tercatat rapi.',
      },
    ],
  },
  {
    tag: 'Modul Keuangan & Arus Kas',
    badge: 'Laba Rugi Otomatis',
    title: 'Laba Rugi Realtime & Pencatatan Buku Kas Usaha',
    subtitle:
      'Jangan cuma melihat omzet kotor. Ketahui keuntungan bersih nyata toko Anda setelah dikurangi HPP dan beban operasional.',
    image: '/images/landing/profit-loss.png',
    alt: 'Tampilan Nyata Laporan Laba Rugi VitPOS',
    reverse: false,
    points: [
      {
        title: 'Perhitungan Laba Bersih Otomatis',
        desc: 'Sistem otomatis mengurangkan pendapatan penjualan dan jasa dengan HPP modal barang/jasa serta pengeluaran operasional.',
      },
      {
        title: 'Catat Biaya Rutin Toko 1-Klik',
        desc: 'Catat pengeluaran listrik PLN, paket internet WiFi, sewa ruko, gaji teknisi, biaya konsumsi, hingga perawatan mesin.',
      },
      {
        title: 'Pemisahan Kas Laci & Rekening Bank',
        desc: 'Pantau uang tunai fisik di laci kasir dan saldo di rekening bank transfer secara terpisah agar tidak rancu.',
      },
    ],
  },
  {
    tag: 'Modul Publik & Storefront',
    badge: 'Toko Online & Lacak Live',
    title: 'Katalog Online Publik & Lacak Servis Mandiri Pelanggan',
    subtitle:
      'Tingkatkan kepuasan pelanggan dengan link toko publik dan fitur cek progres servis mandiri langsung dari smartphone mereka.',
    image: '/images/landing/storefront.png',
    alt: 'Tampilan Nyata Toko Online Publik dan Pelacakan Servis VitPOS',
    reverse: true,
    points: [
      {
        title: 'Website Toko Publik Instan',
        desc: 'Setiap toko memiliki halaman katalog online sendiri (contoh: /store/namatoko) yang siap dipasang di profil media sosial atau WhatsApp Business.',
      },
      {
        title: 'Checkout Cepat Terhubung ke WhatsApp',
        desc: 'Pelanggan dapat memilih barang/jasa dan langsung checkout. Rincian pesanan otomatis terkirim ke WhatsApp toko dan tercatat di dashboard.',
      },
      {
        title: 'Pelanggan Lacak Servis Tanpa Harus Tanya',
        desc: 'Pelanggan cukup scan QR Code di nota fisik untuk melihat status apakah unit masih dicek, sedang dikerjakan, atau sudah siap diambil.',
      },
    ],
  },
]

export function LandingFeatures() {
  return (
    <section id="fitur" className="py-20 space-y-28">
      {/* 1. Header & 6 Pilar Fitur Utama */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Fitur Kelas Bisnis
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Semua yang Dibutuhkan untuk Mengelola Toko Lebih Rapi
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Meninggalkan cara manual, buku catatan robek, dan spreadsheet yang rumit. 
            Semua proses terintegrasi otomatis demi ketenangan pemilik bisnis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon
            return (
              <Card key={idx} className="border-border/70 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
                <CardHeader className="space-y-3 pb-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 2. Deep-Dive Section dengan Screenshot Nyata dari Aplikasi */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
        <div className="text-center space-y-3 max-w-3xl mx-auto border-t pt-16">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Eksplorasi Screenshot Langsung
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tampilan Asli Aplikasi yang Siap Mengakselerasi Bisnis Anda
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bukan sekadar mockup fiktif. Berikut adalah tangkapan layar langsung dari modul-modul sistem VitPOS yang telah dipakai operasional nyata.
          </p>
        </div>

        {DEEP_DIVE_MODULES.map((mod, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
              mod.reverse ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Text description column */}
            <div className={`space-y-6 lg:col-span-5 ${mod.reverse ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                    {mod.badge}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {mod.tag}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                  {mod.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mod.subtitle}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {mod.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-3">
                    <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <p className="font-semibold text-foreground">{pt.title}</p>
                      <p className="text-muted-foreground leading-relaxed">{pt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="gap-2 text-xs">
                  <Link to="/register">
                    Coba Fitur Ini Gratis
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Real Screenshot column */}
            <div className={`lg:col-span-7 ${mod.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="group relative rounded-2xl border bg-card p-2 sm:p-3 shadow-xl transition-all hover:shadow-2xl hover:border-primary/40">
                {/* Browser window header */}
                <div className="flex items-center justify-between border-b pb-2.5 mb-2.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-red-400" />
                    <div className="size-2.5 rounded-full bg-amber-400" />
                    <div className="size-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                      https://vitpos.devk.my.id — {mod.badge}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/5 text-primary border-primary/20">
                    Live UI
                  </Badge>
                </div>

                {/* Real screenshot container */}
                <div className="overflow-hidden rounded-xl border bg-muted/30 aspect-[16/10]">
                  <img
                    src={mod.image}
                    alt={mod.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
