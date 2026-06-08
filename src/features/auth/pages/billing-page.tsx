import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function BillingPage() {
  const navigate = useNavigate()
  const { activeTenant, setActiveTenant } = useAuthStore()

  async function handleSelectPlan(planCode: string) {
    if (activeTenant) {
      const updated = { ...activeTenant, planCode }
      await localDb.tenants.put(updated)
      setActiveTenant(updated, activeTenant.role)
    }
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pilih Paket Langganan</h1>
          <p className="text-muted-foreground">Mulai dengan free trial atau upgrade sekarang.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-primary relative overflow-hidden bg-primary/5">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">REKOMENDASI</div>
            <CardHeader>
              <CardTitle className="text-2xl">Free Trial</CardTitle>
              <CardDescription>Coba 14 Hari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">Rp0<span className="text-sm font-normal text-muted-foreground">/bulan</span></div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Kasir POS lengkap</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Manajemen stok</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Laporan real-time</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleSelectPlan('trial')}>Mulai Trial Sekarang</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>Untuk bisnis berkembang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">Rp149rb<span className="text-sm font-normal text-muted-foreground">/bulan</span></div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Semua fitur Trial</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Multi cabang</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Sinkron cloud tanpa batas</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => handleSelectPlan('pro')}>Pilih Pro</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
