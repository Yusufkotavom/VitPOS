import { useState, type FormEvent } from 'react'
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { hashPassword } from '@/lib/crypto'
import { apiPost } from '@/services/api/client'
import { localDb } from '@/services/local-db/client'

type AuthApiMembership = {
  tenantId: string
  role: string
  tenantName: string
  tenantPlan: string
}

type AuthApiResponse = {
  ok: boolean
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    avatarUrl?: string
  }
  memberships: AuthApiMembership[]
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'password'>('email')
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()

    if (!email || !password) return

    try {
      const response = await apiPost<AuthApiResponse>('/auth/login', { email, password })
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(password)
      const user = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatarUrl: response.user.avatarUrl,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      }

      await localDb.users.put(user)
      for (const membership of response.memberships) {
        await localDb.tenants.put({
          id: membership.tenantId,
          name: membership.tenantName,
          type: 'Usaha',
          phone: '',
          planCode: membership.tenantPlan,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })

        await localDb.tenantMembers.put({
          id: `${response.user.id}:${membership.tenantId}`,
          tenantId: membership.tenantId,
          userId: response.user.id,
          role: membership.role,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      }

      setAuth(user)
      navigate('/tenants')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal masuk ke akun')
      return
    }
  }

  function openReset() {
    setResetEmail('')
    setNewPassword('')
    setResetStep('email')
    setResetOpen(true)
  }

  async function handleResetEmail() {
    const email = resetEmail.trim().toLowerCase()
    if (!email) return
    setResetStep('password')
  }

  async function handleResetPassword() {
    if (!newPassword) return
    setResetLoading(true)
    const email = resetEmail.trim().toLowerCase()
    try {
      await apiPost('/auth/reset-password', { email, newPassword })
      const user = await localDb.users.where('email').equals(email).first()
      if (user) {
        await localDb.users.update(user.id, {
          passwordHash: await hashPassword(newPassword),
          updatedAt: new Date().toISOString(),
        })
      }
      setResetLoading(false)
      toast.success('Kata sandi berhasil direset')
      setResetOpen(false)
    } catch (error) {
      setResetLoading(false)
      toast.error(error instanceof Error ? error.message : 'Gagal reset password')
      setResetStep('email')
    }
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
                <button type="button" onClick={openReset} className="text-sm font-medium text-primary hover:underline">
                  Lupa password?
                </button>
                <Link className="font-medium text-primary hover:underline" to="/register">
                  Daftar di sini
                </Link>
              </div>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" form="login-form">Masuk</Button>
            <p className="text-center text-xs text-muted-foreground">Login dan reset password tersimpan di cloud.</p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Ulang Kata Sandi</DialogTitle>
            <DialogDescription>
              {resetStep === 'email'
                ? 'Masukkan email untuk verifikasi akun.'
                : 'Masukkan kata sandi baru.'}
            </DialogDescription>
          </DialogHeader>
          {resetStep === 'email' ? (
            <div className="space-y-4">
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="reset-email">
                Email
                <Input id="reset-email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="owner@usaha.co.id" />
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetOpen(false)}>Batal</Button>
                <Button onClick={handleResetEmail} disabled={resetLoading || !resetEmail.trim()}>
                  {resetLoading ? 'Memeriksa...' : 'Lanjutkan'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Akun <span className="font-medium text-foreground">{resetEmail}</span> ditemukan.</p>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="new-password">
                Kata sandi baru
                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" />
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetStep('email')}>Kembali</Button>
                <Button onClick={handleResetPassword} disabled={resetLoading || !newPassword}>
                  {resetLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
