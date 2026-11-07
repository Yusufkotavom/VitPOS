import { Smartphone, Laptop, Printer, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function LandingServiceNiche() {
  return (
    <section id="solusi" className="py-20 border-t bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Disesuaikan untuk Karakter Bisnis Anda
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Solusi Nyata untuk 3 Bidang Usaha Jasa Terpopuler
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Tidak ada lagi aplikasi kasir umum yang dipaksa-paksakan untuk toko servis atau percetakan.
            Setiap alur telah disesuaikan dengan kebutuhan teknisi dan pemilik toko di lapangan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Niche 1: Servis HP & Gadget */}
          <Card className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between">
            <CardHeader className="space-y-3 pb-4">
              <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Smartphone className="size-6" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Toko Servis HP & Gadget
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Tingkatkan kepercayaan pelanggan dan kendalikan stok suku cadang LCD, baterai, serta aksesoris tanpa ada yang tercecer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2.5 border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Form Cek-in Lengkap:</strong> Catat IMEI, tipe HP, pola layar, dan keluhan awal.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Potong Stok Sparepart Otomatis:</strong> Saat LCD / Baterai dipakai teknisi, stok gudang langsung berkurang.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Notifikasi WhatsApp 1-Klik:</strong> Kirim kabar barang selesai ke pelanggan dalam 1 detik.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Kebijakan Garansi Jelas:</strong> Masa garansi 7–30 hari otomatis tertera di nota thermal.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niche 2: Servis Komputer, Laptop & Printer */}
          <Card className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between">
            <CardHeader className="space-y-3 pb-4">
              <div className="size-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Laptop className="size-6" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Servis Laptop, PC & Printer
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Manajemen antrean reparasi teratur, pencatatan kelengkapan (charger/tas), dan suku cadang SSD/RAM yang tertib.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2.5 border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Kelengkapan Unit Masuk:</strong> Catat apakah adaptor, tas, kabel bawaan disertakan agar tidak tertukar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Status Timeline Teknisi:</strong> Pengecekan ➔ Pengerjaan ➔ Pengujian ➔ Siap Diambil.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Servis Printer & Tinta:</strong> Hitung jasa kuras head printer, infus tinta, dan ganti cartridge.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Cetak Invoice A4 & Struk Kasir:</strong> Cocok untuk pelanggan perseorangan maupun instansi kantor.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niche 3: Percetakan & ATK */}
          <Card className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between">
            <CardHeader className="space-y-3 pb-4">
              <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Printer className="size-6" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Percetakan, Banner & ATK
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Kombinasi kasir cepat fotokopi/ATK dan pesanan spanduk atau banner custom dengan alur uang muka (DP).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2.5 border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Kasir POS Cepat 3 Detik:</strong> Jual pulpen, buku, kertas rim, dan fotokopi lembaran kilat.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Hitung Spanduk per Meter:</strong> Mudah hitung pesanan banner flexi P x L dan finishing mata ayam.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Uang Muka (DP) & Pelunasan:</strong> Terima DP di awal, sistem ingatkan sisa pembayaran saat barang diambil.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Antrean Cetak Terpantau:</strong> Tahu persis mana file yang sedang dicetak, di-laminating, atau selesai.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
