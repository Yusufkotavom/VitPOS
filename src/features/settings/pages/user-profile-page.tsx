import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'

export function UserProfilePage() {
  const { currentUser, setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)

    if (currentUser) {
      setAuth({
        ...currentUser,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        updatedAt: new Date().toISOString(),
      })
      setLoading(false)
      alert('Profil diperbarui')
    }
  }

  if (!currentUser) return null

  return (
    <PageShell title="Profil Pengguna" description="Atur nama, email, password, dan langganan akun.">
      <SettingsNav className="mb-6" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ContentCard title="Informasi Akun" description="Perbarui detail login pengguna aktif.">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                <Input id="name" name="name" defaultValue={currentUser.name} required disabled={loading} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" defaultValue={currentUser.email} required disabled={loading} />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password Baru</FieldLabel>
                <Input id="password" name="password" type="password" placeholder="Kosongkan jika tidak diganti" disabled={loading} />
              </Field>
            </FieldGroup>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </div>
          </form>
        </ContentCard>

        <ContentCard title="Paket Langganan" description="Status akses dan billing usaha Anda.">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Paket aktif</p>
              <p className="mt-1 text-xl font-semibold">Free Trial</p>
              <p className="mt-2 text-sm text-muted-foreground">Coba gratis 14 hari untuk semua fitur utama.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">Aktif</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Tagihan</p>
                <p className="font-medium">Rp0</p>
              </div>
            </div>
            <Button variant="outline">Upgrade Paket</Button>
          </div>
        </ContentCard>
      </div>
    </PageShell>
  )
}
