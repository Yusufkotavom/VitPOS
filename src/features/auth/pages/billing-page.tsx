import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { subscriptionService, type SubscriptionPlan } from '@/services/api/subscription.service'
import type { LocalTenant } from '@/services/local-db/schema'
import { localDb } from '@/services/local-db/client'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatPeriod(period: 'monthly' | 'yearly') {
  return period === 'yearly' ? 'Tahunan' : 'Bulanan'
}

export function BillingPage() {
  const navigate = useNavigate()
  const { activeTenant, setActiveTenant } = useAuthStore()

  const plansQuery = useQuery({
    queryKey: ['subscription-plans', 'billing-onboarding'],
    queryFn: () => subscriptionService.listPlans(),
  })

  async function handleSelectPlan(plan: SubscriptionPlan) {
    if (activeTenant) {
      const { role, ...tenantBase } = activeTenant
      const subscriptionStatus: NonNullable<LocalTenant['subscriptionStatus']> = plan.trialDays > 0 ? 'trial' : 'active'
      const updated: LocalTenant = {
        ...tenantBase,
        planCode: plan.code,
        billingPeriod: plan.billingPeriod,
        subscriptionStatus,
        storageLimitMb: plan.storageLimitMb,
        maxBranches: plan.maxBranches,
      }
      await localDb.tenants.put(updated)
      setActiveTenant(updated, role)
    }
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pilih Paket Langganan</h1>
          <p className="text-muted-foreground">Pilih paket dari katalog langganan yang sama dengan halaman billing di dalam aplikasi.</p>
        </div>
        {plansQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-background px-4 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Memuat daftar paket...
          </div>
        ) : plansQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            Gagal memuat daftar paket. Coba lagi beberapa saat lagi.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(plansQuery.data ?? []).map((plan: SubscriptionPlan) => {
              const price = plan.billingPeriod === 'yearly' && plan.yearlyPrice ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice)
              const isCurrent = activeTenant?.planCode === plan.code

              return (
                <Card key={plan.id} className={isCurrent ? 'border-2 border-primary bg-primary/5' : ''}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {formatPeriod(plan.billingPeriod)} • {plan.trialDays > 0 ? `Trial ${plan.trialDays} hari` : 'Langsung aktif'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      {formatRupiah(price)}
                      <span className="text-sm font-normal text-muted-foreground">/{plan.billingPeriod === 'yearly' ? 'tahun' : 'bulan'}</span>
                    </div>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Storage {Math.round((plan.storageLimitMb / 1024) * 10) / 10} GB</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Hingga {plan.maxBranches} cabang</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Hingga {plan.maxUsers} pengguna</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={isCurrent ? 'outline' : 'default'} onClick={() => handleSelectPlan(plan)}>
                      {isCurrent ? 'Paket Terpilih' : 'Pilih Paket'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
