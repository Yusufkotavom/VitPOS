import { Building2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

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

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 />
            </div>
            <div>
              <p className="text-lg font-semibold">KOTACOM Business Suite</p>
              <p className="text-sm text-muted-foreground">Operasional toko siap jalan offline-first.</p>
            </div>
          </div>
          <div className="rounded-3xl border bg-background p-8 shadow-sm">
            <p className="text-3xl font-semibold tracking-tight">Masuk, pilih usaha, mulai transaksi tanpa ribet.</p>
            <p className="mt-4 text-muted-foreground">
              UI mock aman untuk validasi alur auth. Belum terhubung backend, sesi, atau penyimpanan kredensial.
            </p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Masuk Akun</CardTitle>
            <CardDescription>Gunakan email dan kata sandi terdaftar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Email
                <Input type="email" placeholder="owner@usaha.co.id" autoComplete="email" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Kata sandi
                <Input type="password" placeholder="Masukkan kata sandi" autoComplete="current-password" />
              </label>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Belum punya usaha?</span>
                <Link className="font-medium text-primary" to="/onboarding">
                  Setup awal
                </Link>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button asChild>
              <Link to="/tenants">Masuk</Link>
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck />
              <span>Mock UI saja, belum memproses login.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
