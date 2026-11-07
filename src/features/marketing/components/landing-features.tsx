import { useState } from 'react'
import {
  WifiOff,
  Search,
  Boxes,
  Wallet,
  Printer,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Monitor,
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
    desktopImage: '/images/landing/pos-desktop.png',
    mobileImage: '/images/landing/pos-mobile.png',
    image: '/images/landing/pos-desktop.png',
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
    desktopImage: '/images/landing/service-orders-desktop.png',
    mobileImage: '/images/landing/service-orders-mobile.png',
    image: '/images/landing/service-orders-desktop.png',
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
        desc: 'Cetak tanda terima servis ber-QR untuk dilacak mandiri oleh pelanggan, lengkap dengan pencantuman masa garansi toko (7–90 hari).',
      },
    ],
  },
  {
    tag: 'Modul Laporan & Analisis',
    badge: 'Laporan Penjualan & Service',
    title: 'Laporan Penjualan & Service Terpadu Realtime',
    subtitle:
      'Konsolidasikan seluruh omzet kasir POS dan pendapatan jasa servis dalam satu laporan komprehensif tanpa ada data yang tercecer.',
    desktopImage: '/images/landing/sales-reports-desktop.png',
    mobileImage: '/images/landing/sales-reports-mobile.png',
    image: '/images/landing/sales-reports-desktop.png',
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
    desktopImage: '/images/landing/products-inventory-desktop.png',
    mobileImage: '/images/landing/products-inventory-mobile.png',
    image: '/images/landing/products-inventory-desktop.png',
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
        title: 'Kartu Stok & Multi-Gudang',
        desc: 'Lacak riwayat mutasi setiap kali barang terjual, dipakai teknisi, dibeli dari supplier, atau dipindahkan antar etalase dan gudang belakang.',
      },
    ],
  },
  {
    tag: 'Modul Akuntansi & Keuangan',
    badge: 'Laba Rugi Otomatis',
    title: 'Laporan Laba Rugi Akurat Tanpa Perlu Akuntan Khusus',
    subtitle:
      'Ketahui persis berapa keuntungan bersih usaha Anda setelah dikurangi harga modal sparepart dan biaya operasional toko.',
    desktopImage: '/images/landing/profit-loss-desktop.png',
    mobileImage: '/images/landing/profit-loss-mobile.png',
    image: '/images/landing/profit-loss-desktop.png',
    alt: 'Tampilan Nyata Laporan Laba Rugi VitPOS',
    reverse: false,
    points: [
      {
        title: 'Kalkulasi HPP Nyata',
        desc: 'Sistem otomatis mengalkulasi Harga Pokok Penjualan untuk setiap sparepart dan bahan cetak yang digunakan dalam pengerjaan order.',
      },
      {
        title: 'Biaya Operasional Rutin & Buku Kas',
        desc: 'Catat beban listrik PLN, internet, sewa tempat, hingga konsumsi dengan pembagian kategori pengeluaran rapi.',
      },
      {
        title: 'Grafik Tren Keuntungan Bulanan',
        desc: 'Visualisasikan pertumbuhan omzet dan laba bersih dari bulan ke bulan agar strategi bisnis dapat dievaluasi secara terukur.',
      },
    ],
  },
  {
    tag: 'Modul Toko Online & Publik',
    badge: 'Storefront Mandiri',
    title: 'Toko Online Publik & Portal Lacak Status Servis Mandiri',
    subtitle:
      'Tingkatkan kepuasan pelanggan dengan etalase digital tanpa biaya komisi marketplace dan fasilitas lacak servis live.',
    desktopImage: '/images/landing/storefront-desktop.png',
    mobileImage: '/images/landing/storefront-mobile.png',
    image: '/images/landing/storefront-desktop.png',
    alt: 'Tampilan Nyata Storefront Publik VitPOS',
    reverse: true,
    points: [
      {
        title: 'Katalog Produk & Sparepart Publik',
        desc: 'Bagikan tautan etalase toko Anda ke media sosial atau Google Maps agar pelanggan bisa melihat ketersediaan barang dan estimasi biaya perbaikan.',
      },
      {
        title: 'Lacak Servis Mandiri (Tanpa Perlu Akun)',
        desc: 'Pelanggan cukup mengetikkan nomor nota servis atau memindai QR code di tanda terima untuk melihat status unit mereka secara realtime.',
      },
      {
        title: 'Terintegrasi Pesan via WhatsApp',
        desc: 'Pelanggan dapat melakukan order produk atau mengajukan konsultasi servis yang langsung terhubung ke nomor WhatsApp admin toko.',
      },
    ],
  },
]

function DeepDiveCard({ mod }: { mod: typeof DEEP_DIVE_MODULES[number] }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div
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

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button asChild size="sm" className="gap-2 text-xs">
            <Link to="/register">
              Coba Fitur Ini Gratis
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs border-primary/20 text-primary">
            <Link to="/login">
              Akses Demo
            </Link>
          </Button>
        </div>
      </div>

      {/* Real Screenshot Column with Desktop / Mobile Toggle */}
      <div className={`lg:col-span-7 ${mod.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="group relative rounded-2xl border bg-card p-2.5 sm:p-4 shadow-xl transition-all hover:shadow-2xl hover:border-primary/40">
          {/* Header bar with Desktop / Mobile device switch */}
          <div className="flex items-center justify-between border-b pb-2.5 mb-2.5 px-2">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="size-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] font-medium text-muted-foreground hidden sm:inline">
                https://vitpos.devk.my.id — {mod.badge}
              </span>
            </div>

            {/* Toggle Desktop vs Mobile */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
              <button
                onClick={() => setDevice('desktop')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  device === 'desktop'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="size-3" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  device === 'mobile'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="size-3" />
                <span>HP / Mobile</span>
              </button>
            </div>
          </div>

          {/* Screenshot Container */}
          {device === 'desktop' ? (
            <div className="overflow-hidden rounded-xl border bg-muted/30 aspect-[16/10]">
              <img
                src={mod.desktopImage}
                alt={`${mod.alt} (Desktop)`}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="py-4 flex justify-center bg-muted/20 rounded-xl overflow-hidden">
              <div className="relative w-[240px] sm:w-[260px] aspect-[9/19] rounded-[2rem] border-4 border-slate-800 bg-slate-900 p-1 shadow-xl overflow-hidden ring-1 ring-border">
                <div className="w-full h-full rounded-[1.7rem] overflow-hidden bg-background">
                  <img
                    src={mod.mobileImage}
                    alt={`${mod.alt} (Mobile)`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LandingFeatures() {
  return (
    <section className="py-20 lg:py-28 bg-muted/20 space-y-24">
      {/* 1. Foundational Pillars / Keunggulan Fundamental */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Fondasi Bisnis Tangguh
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Semua yang Dibutuhkan Usaha Jasa & Ritel dalam Satu Ekosistem
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Tak perlu lagi langganan banyak aplikasi terpisah. VitPOS menyatukan kasir POS, tiket servis ber-QR,
            buku kas, inventori sparepart, hingga katalog online secara harmonis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon
            return (
              <Card
                key={index}
                className="border-muted/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className={`size-12 rounded-xl flex items-center justify-center ${feat.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold leading-snug">
                    {feat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 2. Deep-Dive Section dengan Screenshot Nyata dari Aplikasi (Desktop & HP) */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
        <div className="text-center space-y-3 max-w-3xl mx-auto border-t pt-16">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Eksplorasi Screenshot Langsung (Desktop & HP)
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tampilan Asli Aplikasi yang Siap Mengakselerasi Bisnis Anda
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bukan sekadar mockup fiktif atau kosongan. Berikut adalah tangkapan layar langsung dengan simulasi data operasional nyata
            dari modul-modul sistem VitPOS yang telah siap pakai.
          </p>
        </div>

        {DEEP_DIVE_MODULES.map((mod, idx) => (
          <DeepDiveCard key={idx} mod={mod} />
        ))}
      </div>
    </section>
  )
}
