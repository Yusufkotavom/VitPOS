import { Link } from 'react-router-dom'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PLANS = [
  {
    name: 'Free Trial',
    badge: 'Uji Coba 14 Hari',
    price: 'Rp 0',
    period: 'selama 14 hari',
    description: 'Cocok untuk mencoba seluruh fitur kasir, servis dan kontrol stok sebelum berlangganan.',
    features: [
      'Akses penuh semua fitur',
      'Kasir POS kilat (Offline & Online)',
      'Tiket servis HP / Komputer ber-QR',
      'Portal lacak mandiri pelanggan',
      'Manajemen stok & sparepart',
      'Cetak struk thermal 58/80mm',
      'Dukungan via panduan web',
    ],
    cta: 'Coba Gratis Sekarang',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro Business',
    badge: 'Paling Populer',
    price: 'Rp 25.000',
    period: 'per bulan',
    description: 'Solusi lengkap untuk toko servis, bengkel gadget, dan percetakan aktif yang ingin operasional rapi.',
    features: [
      'Semua fitur pada Free Trial',
      'Transaksi & tiket servis tanpa batas',
      'Notifikasi WhatsApp 1-klik ke pelanggan',
      'Buku Kas, Bank, & Biaya Rutin Bulanan',
      'Laporan laba rugi & kartu riwayat stok',
      'Katalog toko online publik',
      'Multi-akun staf kasir & teknisi',
      'Penyimpanan cloud otomatis',
    ],
    cta: 'Pilih Paket Pro',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Multi-Cabang',
    badge: 'Skala Menengah',
    price: 'Rp 99.000',
    period: 'per bulan',
    description: 'Untuk pemilik bisnis yang memiliki beberapa cabang ruko atau gudang sparepart terpisah.',
    features: [
      'Semua fitur pada Pro Business',
      'Dukungan multi-outlet / cabang toko',
      'Transfer stok antar cabang / gudang',
      'Laporan neraca & akuntansi terpadu',
      'Audit log aktivitas karyawan',
      'Prioritas konsultasi WhatsApp',
      'Bantuan migrasi data produk gratis',
    ],
    cta: 'Hubungi Sales Cabang',
    href: '/register',
    highlighted: false,
  },
]

export function LandingPricing() {
  return (
    <section id="harga" className="py-20 border-t bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Investasi Terjangkau
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Paket Berlangganan yang Ramah untuk UMKM
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Tanpa biaya tersembunyi. Tanpa kewajiban beli perangkat khusus. Bisa dijalankan di komputer atau smartphone yang sudah Anda miliki.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, idx) => (
            <Card
              key={idx}
              className={`flex flex-col justify-between transition-all ${
                plan.highlighted
                  ? 'border-primary shadow-lg ring-1 ring-primary bg-card relative'
                  : 'border-border/80 hover:border-primary/40'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs shadow-xs px-3">
                    <Sparkles className="size-3 mr-1 text-amber-300" /> {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                  {!plan.highlighted && (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                      {plan.badge}
                    </Badge>
                  )}
                </div>
                <div className="space-baseline">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{plan.period}</span>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="border-t pt-4 space-y-2.5 text-xs text-muted-foreground">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t">
                <Button
                  asChild
                  className={`w-full ${plan.highlighted ? 'shadow-md' : ''}`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  <Link to={plan.href} className="gap-2">
                    {plan.cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
