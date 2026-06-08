import { useState, type FormEvent } from 'react'
import { CheckCircle2, ChevronRight, PackagePlus, Store } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser, setAuth, setActiveTenant } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    
    const ownerName = formData.get('ownerName')?.toString().trim()
    const ownerEmail = formData.get('ownerEmail')?.toString().trim().toLowerCase()
    const ownerPass = formData.get('ownerPassword')?.toString().trim()

    if (!currentUser && (!ownerName || !ownerEmail || !ownerPass)) {
      setError('Data owner wajib diisi lengkap')
      return
    }

    const name = formData.get('businessName')?.toString().trim()
    const type = formData.get('businessType')?.toString().trim() || 'Retail'
    const phone = formData.get('businessPhone')?.toString().trim() || ''

    if (!name) {
      setError('Nama usaha wajib diisi')
      return
    }

    const now = new Date().toISOString()
    let userId = currentUser?.id

    if (!currentUser) {
      const existingUser = await localDb.users.where('email').equals(ownerEmail!).first()
      if (existingUser) {
        setError('Email sudah terdaftar. Silakan login dulu.')
        return
      }

      userId = crypto.randomUUID()
      const newUser = {
        id: userId,
        name: ownerName!,
        email: ownerEmail!,
        passwordHash: ownerPass!,
        createdAt: now,
        updatedAt: now,
      }
      await localDb.users.add(newUser)
      setAuth(newUser)
    }

    const tenantId = crypto.randomUUID()

    const newTenant = {
      id: tenantId,
      name,
      type,
      phone,
      planCode: 'trial',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    const newMember = {
      id: crypto.randomUUID(),
      tenantId,
      userId: userId!,
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await localDb.tenants.add(newTenant)
    await localDb.tenantMembers.add(newMember)

    setActiveTenant(newTenant, 'owner')
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
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
                {!currentUser ? (
                  <>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label htmlFor="owner-name" className="text-sm font-medium">Nama owner</label>
                      <Input id="owner-name" name="ownerName" placeholder="Nama lengkap" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="owner-email" className="text-sm font-medium">Email owner</label>
                      <Input id="owner-email" name="ownerEmail" type="email" placeholder="owner@usaha.co.id" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="owner-password" className="text-sm font-medium">Kata sandi owner</label>
                      <Input id="owner-password" name="ownerPassword" type="password" placeholder="Minimal 8 karakter" required />
                    </div>
                  </>
                ) : null}
                <div className="flex flex-col gap-2 md:col-span-2 mt-2 border-t pt-4">
                  <label htmlFor="business-name" className="text-sm font-medium">Nama usaha</label>
                  <Input id="business-name" name="businessName" placeholder="Contoh: Toko Sumber Rejeki" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-type" className="text-sm font-medium">Jenis usaha</label>
                  <Input id="business-type" name="businessType" placeholder="Retail, F&B, Service" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-phone" className="text-sm font-medium">Nomor WhatsApp</label>
                  <Input id="business-phone" name="businessPhone" placeholder="08xxxxxxxxxx" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="first-branch" className="text-sm font-medium">Cabang pertama</label>
                  <Input id="first-branch" name="firstBranch" placeholder="Cabang Utama" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="first-warehouse" className="text-sm font-medium">Gudang pertama</label>
                  <Input id="first-warehouse" name="firstWarehouse" placeholder="Gudang Pusat" />
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
                  <Input name="paymentMethods" placeholder="Tunai, QRIS, transfer" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Sumber import produk
                  <Input name="productImportSource" placeholder="CSV, Excel, input manual" />
                </label>
              </div>
              {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
            </CardContent>
            <CardFooter className="sticky bottom-0 flex flex-col items-stretch gap-3 bg-background sm:flex-row sm:justify-between">
              <Button variant="outline" asChild>
                <Link to="/login">Kembali ke login</Link>
              </Button>
              <Button type="submit">
                Simpan dan lanjut
                <ChevronRight data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </main>
  )
}
