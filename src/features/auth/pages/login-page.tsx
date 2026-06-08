import { useState, type FormEvent } from 'react'
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim().toLowerCase()
    
    if (!email) return

    let user = await localDb.users.where('email').equals(email).first()

    if (!user && email === 'owner@usaha.co.id') {
      const mockUser = {
        id: crypto.randomUUID(),
        name: 'Owner',
        email: 'owner@usaha.co.id',
        passwordHash: 'mock-hash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await localDb.users.add(mockUser)
      user = mockUser
    }

    if (!user) {
      setError('Email tidak terdaftar atau kata sandi salah')
      return
    }

    setAuth(user)
    navigate('/tenants')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-6 sm:py-8">
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">KOTACOM Business Suite</p>
              <p className="text-sm text-muted-foreground">Operasional toko siap jalan offline-first.</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="gap-4 p-8">
              <Badge className="w-fit" variant="secondary">Data Aman Offline</Badge>
              <div className="flex flex-col gap-3">
                <CardTitle className="text-3xl tracking-tight text-balance">Masuk, pilih usaha, mulai transaksi cepat.</CardTitle>
                <CardDescription className="text-base leading-7">
                  Akses POS, invoice, stok, dan sync status dari satu dashboard bisnis.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 px-8 pb-8 text-sm">
              {['POS siap 3–5 tap', 'Data lokal tetap jalan saat offline', 'Sinkron cloud terlihat jelas'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 aria-hidden="true" className="text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Masuk ke Dashboard</CardTitle>
                <CardDescription>Gunakan akun owner atau kasir terdaftar.</CardDescription>
              </div>
              <ShieldCheck aria-hidden="true" className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <form id="login-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
                Email
                <Input id="email" name="email" type="email" placeholder="owner@usaha.co.id" autoComplete="email" spellCheck={false} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
                Kata sandi
                <Input id="password" name="password" type="password" placeholder="Masukkan kata sandi" autoComplete="current-password" />
              </label>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Belum punya usaha?</span>
                <Link className="font-medium text-primary hover:underline" to="/onboarding">
                  Setup awal
                </Link>
              </div>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" form="login-form">Masuk</Button>
            <p className="text-center text-xs text-muted-foreground">Mode demo auth. Validasi backend menyusul.</p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
