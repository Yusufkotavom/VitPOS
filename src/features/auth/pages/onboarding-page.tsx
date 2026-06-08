import { CheckCircle2, ChevronRight, PackagePlus, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import { onboardingSteps } from '@/features/auth/mocks/auth.mock'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function OnboardingPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progress Setup</CardTitle>
            <CardDescription>Lengkapi data awal sebelum mulai jualan.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {onboardingSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-xl border px-3 py-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 />
            <span>Data awal siap disimpan sebagai profil usaha.</span>
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Store />
                </div>
                <div>
                  <CardTitle>Profil Usaha</CardTitle>
                  <CardDescription>Data dasar untuk dashboard, struk, dan cabang pertama.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label htmlFor="business-name" className="text-sm font-medium">Nama usaha</label>
                  <Input id="business-name" placeholder="Contoh: Toko Sumber Rejeki" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-type" className="text-sm font-medium">Jenis usaha</label>
                  <Input id="business-type" placeholder="Retail, F&B, Service" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-phone" className="text-sm font-medium">Nomor WhatsApp</label>
                  <Input id="business-phone" placeholder="08xxxxxxxxxx" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="first-branch" className="text-sm font-medium">Cabang pertama</label>
                  <Input id="first-branch" placeholder="Cabang Utama" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="first-warehouse" className="text-sm font-medium">Gudang pertama</label>
                  <Input id="first-warehouse" placeholder="Gudang Pusat" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <PackagePlus />
                </div>
                <div>
                  <CardTitle>Operasional Awal</CardTitle>
                  <CardDescription>Pilih setting awal pembayaran dan data produk.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Metode pembayaran utama
                  <Input placeholder="Tunai, QRIS, transfer" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Sumber import produk
                  <Input placeholder="CSV, Excel, input manual" />
                </label>
              </div>
            </CardContent>
            <CardFooter className="sticky bottom-0 flex flex-col items-stretch gap-3 bg-background sm:flex-row sm:justify-between">
              <Button variant="outline" asChild>
                <Link to="/login">Kembali ke login</Link>
              </Button>
              <Button asChild>
                <Link to="/tenants">
                  Simpan dan lanjut
                  <ChevronRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
