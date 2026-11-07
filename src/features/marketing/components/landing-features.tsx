import { WifiOff, Search, Boxes, Wallet, Printer, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  {
    icon: WifiOff,
    title: 'Offline-First Hybrid (Anti Internet Mogok)',
    description: 'Internet toko mati atau mati lampu mendadak? Kasir dan pencatatan tiket servis tetap berfungsi 100%. Data tersimpan aman di perangkat dan otomatis sinkron ke cloud saat online.',
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    icon: Search,
    title: 'Portal Lacak Servis Mandiri Pelanggan',
    description: 'Pelanggan cukup memindai QR Code di struk nota untuk mengecek status pengerjaan secara langsung lewat browser HP tanpa perlu instal aplikasi atau repot chat WhatsApp toko.',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Boxes,
    title: 'Manajemen Sparepart & Stok Terpadu',
    description: 'Peringatan otomatis saat stok LCD, baterai, SSD, RAM, atau kertas menipis. Kartu riwayat stok mencatat keluar-masuk barang secara transparan untuk mencegah kehilangan.',
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    icon: Wallet,
    title: 'Buku Kas, Bank & Biaya Rutin Bulanan',
    description: 'Pencatatan setor modal, ambil prive, dan 1-klik catat tagihan bulanan (listrik PLN, WiFi, sewa ruko, gaji karyawan). Laporan laba rugi menghitung keuntungan bersih nyata.',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    icon: Printer,
    title: 'Cetak Struk Thermal 58/80mm & Invoice A4',
    description: 'Kompatibel dengan semua jenis printer thermal Bluetooth dan USB kasir. Cetak tanda terima ber-QR, struk belanja ritel, hingga invoice tagihan resmi ukuran A4/PDF.',
    color: 'text-pink-500 bg-pink-500/10',
  },
  {
    icon: Smartphone,
    title: 'Responsif di Komputer, Tablet, & Smartphone',
    description: 'Bisa dibuka di laptop teknisi meja servis, monitor kasir depan, maupun dari HP pemilik toko saat sedang berada di luar untuk memantau omzet harian.',
    color: 'text-indigo-500 bg-indigo-500/10',
  },
]

export function LandingFeatures() {
  return (
    <section id="fitur" className="py-20">
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
              <Card key={idx} className="border-border/70 hover:border-primary/40 hover:shadow-sm transition-all">
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
    </section>
  )
}
