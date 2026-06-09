import { CheckCircle2, Loader2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { useSubscription } from '@/features/settings/hooks/use-subscription'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { subscriptionService, type SubscriptionPlan } from '@/services/api/subscription.service'
import type { LocalTenant } from '@/services/local-db/schema'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatPeriod(period: 'monthly' | 'yearly') {
  return period === 'yearly' ? 'Tahunan' : 'Bulanan'
}

function statusLabel(status: string) {
  switch (status) {
    case 'trial': return 'Trial'
    case 'active': return 'Aktif'
    case 'past_due': return 'Tertunggak'
    case 'suspended': return 'Ditangguhkan'
    case 'cancelled': return 'Dibatalkan'
    case 'free': return 'Free'
    default: return status
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'active':
    case 'free': return 'bg-green-100 text-green-700 border-green-200'
    case 'trial': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'past_due': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'suspended':
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function SubscriptionPage() {
  const queryClient = useQueryClient()
  const { activeTenant, setActiveTenant } = useAuthStore()
  const subscription = useSubscription()

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.listPlans(),
  })

  const subscribeMutation = useMutation({
    mutationFn: ({ planCode, billingPeriod }: { planCode: string; billingPeriod: 'monthly' | 'yearly' }) =>
      subscriptionService.subscribe({ tenantId: activeTenant!.id, planCode, billingPeriod }),
    onSuccess: (response) => {
      if (activeTenant && response?.item) {
        const { role, ...tenantBase } = activeTenant
        const updated: LocalTenant = {
          ...tenantBase,
          planCode: response.item.planCode,
          billingPeriod: response.item.billingPeriod ?? activeTenant.billingPeriod ?? 'monthly',
          subscriptionStatus: (response.item.subscriptionStatus as LocalTenant['subscriptionStatus']) ?? activeTenant.subscriptionStatus,
          planValidUntil: response.item.planValidUntil ? new Date(response.item.planValidUntil).toISOString() : activeTenant.planValidUntil,
          storageLimitMb: response.item.storageLimitMb ?? activeTenant.storageLimitMb,
          maxBranches: response.item.maxBranches ?? activeTenant.maxBranches,
        }
        setActiveTenant(updated, role)
      }
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionService.cancel(activeTenant!.id),
    onSuccess: (response) => {
      if (activeTenant && response?.item) {
        const { role, ...tenantBase } = activeTenant
        const updated: LocalTenant = {
          ...tenantBase,
          subscriptionStatus: (response.item.subscriptionStatus as LocalTenant['subscriptionStatus']) ?? 'cancelled',
        }
        setActiveTenant(updated, role)
      }
    },
  })

  const plans = plansQuery.data ?? []

  return (
    <PageShell title="Langganan & Tagihan" description="Kelola paket, periode, dan status langganan usaha Anda.">
      <SettingsNav className="mb-6" />

      <div className="space-y-6">
        <ContentCard
          title="Langganan Aktif"
          description="Status dan detail paket yang sedang berjalan."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Paket</p>
                <Badge variant="outline" className={statusTone(subscription.status)}>
                  {statusLabel(subscription.status)}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold">{subscription.planName}</p>
              <p className="mt-1 text-sm text-muted-foreground">Periode: {formatPeriod(subscription.billingPeriod)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Berlaku sampai</p>
                <p className="font-medium">
                  {subscription.planValidUntil
                    ? new Date(subscription.planValidUntil).toLocaleDateString('id-ID')
                    : 'Tidak terbatas'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Sisa hari</p>
                <p className="font-medium">
                  {subscription.daysLeft === null ? '∞' : `${Math.max(0, subscription.daysLeft)} hari`}
                </p>
              </div>
            </div>
          </div>
          {subscription.status !== 'cancelled' && subscription.status !== 'free' && activeTenant && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Batalkan langganan? Akses akan tetap aktif hingga akhir periode berjalan.')) {
                    cancelMutation.mutate()
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Langganan'}
              </Button>
            </div>
          )}
        </ContentCard>

        <div>
          <h2 className="mb-1 text-lg font-semibold">Pilihan Paket</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Pembayaran dilakukan manual via transfer bank. Tim kami akan memverifikasi dalam 1×24 jam setelah transfer diterima.
          </p>

          {plansQuery.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat daftar paket...
            </div>
          ) : plansQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Gagal memuat daftar paket. Periksa koneksi Anda dan coba lagi.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: SubscriptionPlan) => {
                const price = plan.billingPeriod === 'yearly' && plan.yearlyPrice
                  ? Number(plan.yearlyPrice)
                  : Number(plan.monthlyPrice)
                const isCurrent = plan.code === subscription.planCode
                return (
                  <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {formatPeriod(plan.billingPeriod)} • {plan.trialDays > 0 ? `Trial ${plan.trialDays} hari` : 'Tanpa trial'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="text-2xl font-bold">
                        {formatRupiah(price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.billingPeriod === 'yearly' ? 'tahun' : 'bulan'}
                        </span>
                      </div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-primary" />
                          Storage {Math.round(plan.storageLimitMb / 1024 * 10) / 10} GB
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-primary" />
                          Hingga {plan.maxBranches} cabang
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-primary" />
                          Hingga {plan.maxUsers} pengguna
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={isCurrent ? 'outline' : 'default'}
                        disabled={isCurrent || !activeTenant || subscribeMutation.isPending}
                        onClick={() => subscribeMutation.mutate({ planCode: plan.code, billingPeriod: plan.billingPeriod })}
                      >
                        {isCurrent ? 'Paket Aktif' : 'Pilih Paket'}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
