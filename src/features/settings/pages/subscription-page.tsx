import { CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { BillingInvoiceList } from '@/features/settings/components/billing-invoice-list'
import { BillingSupportCard } from '@/features/settings/components/billing-support-card'
import { PaymentProofForm } from '@/features/settings/components/payment-proof-form'
import { useSubscription } from '@/features/settings/hooks/use-subscription'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { subscriptionService, type SubscriptionInvoice, type SubscriptionPlan } from '@/services/api/subscription.service'
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
    case 'pending_payment': return 'Menunggu Pembayaran'
    case 'pending_approval': return 'Menunggu Approval'
    case 'expired': return 'Expired'
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
    case 'pending_payment':
    case 'pending_approval':
    case 'past_due':
    case 'expired': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'suspended':
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function SubscriptionPage() {
  const queryClient = useQueryClient()
  const { activeTenant, setActiveTenant } = useAuthStore()
  const subscription = useSubscription()
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null)

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.listPlans(),
  })

  const billingSettingsQuery = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => subscriptionService.getBillingSettings(),
  })

  const invoicesQuery = useQuery({
    queryKey: ['subscription-invoices', activeTenant?.id],
    queryFn: () => subscriptionService.listInvoices(activeTenant!.id),
    enabled: Boolean(activeTenant?.id),
  })

  const changePlanMutation = useMutation({
    mutationFn: ({ planCode, billingPeriod, changeType }: { planCode: string; billingPeriod: 'monthly' | 'yearly'; changeType: 'upgrade' | 'downgrade' | 'renewal' }) =>
      subscriptionService.changePlan({ tenantId: activeTenant!.id, toPlanCode: planCode, billingPeriod, changeType }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription-invoices', activeTenant?.id] })
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: ({ planCode, billingPeriod, type }: { planCode: string; billingPeriod: 'monthly' | 'yearly'; type: SubscriptionInvoice['type'] }) =>
      subscriptionService.createInvoice({ tenantId: activeTenant!.id, planCode, billingPeriod, type }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription-invoices', activeTenant?.id] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (input: { invoiceId: string; amount: string; bankName?: string; accountName?: string; referenceNumber?: string; proofText?: string }) =>
      subscriptionService.submitPayment({ tenantId: activeTenant!.id, ...input }),
    onSuccess: async () => {
      setSelectedInvoice(null)
      await queryClient.invalidateQueries({ queryKey: ['subscription-invoices', activeTenant?.id] })
      if (activeTenant) {
        const { role, ...tenantBase } = activeTenant
        const updated: LocalTenant = {
          ...tenantBase,
          subscriptionStatus: 'pending_approval',
        }
        setActiveTenant(updated, role)
      }
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
  const invoices = invoicesQuery.data ?? []
  const currentPlan = useMemo(
    () => (plansQuery.data ?? []).find((plan) => plan.code === subscription.planCode),
    [plansQuery.data, subscription.planCode],
  )

  function handlePlanAction(plan: SubscriptionPlan) {
    if (!activeTenant) return
    const currentPrice = currentPlan ? Number(currentPlan.yearlyPrice ?? currentPlan.monthlyPrice) : 0
    const targetPrice = Number(plan.yearlyPrice ?? plan.monthlyPrice)
    const changeType = targetPrice < currentPrice ? 'downgrade' : 'upgrade'
    changePlanMutation.mutate({ planCode: plan.code, billingPeriod: plan.billingPeriod, changeType })
  }

  return (
    <PageShell title="Langganan & Tagihan" description="Kelola paket, periode, dan status langganan usaha Anda." backTo="/settings">
      <SettingsNav className="mb-6 hidden md:flex" />

      <div className="space-y-6">
        <ContentCard title="Langganan Aktif" description="Status dan detail paket yang sedang berjalan.">
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
                  {subscription.planValidUntil ? new Date(subscription.planValidUntil).toLocaleDateString('id-ID') : 'Tidak terbatas'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Sisa hari</p>
                <p className="font-medium">{subscription.daysLeft === null ? '∞' : `${Math.max(0, subscription.daysLeft)} hari`}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled={!activeTenant || createInvoiceMutation.isPending} onClick={() => createInvoiceMutation.mutate({ planCode: subscription.planCode, billingPeriod: subscription.billingPeriod, type: 'renewal' })}>
              Perpanjang Paket
            </Button>
            {subscription.status !== 'cancelled' && subscription.status !== 'free' && activeTenant && (
              <Button variant="outline" onClick={() => {
                if (confirm('Batalkan langganan? Akses tetap aktif sampai akhir periode berjalan.')) cancelMutation.mutate()
              }} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Langganan'}
              </Button>
            )}
          </div>
        </ContentCard>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <BillingInvoiceList invoices={invoices} onPay={setSelectedInvoice} />
          <BillingSupportCard settings={billingSettingsQuery.data} />
        </div>

        {selectedInvoice ? (
          <ContentCard title="Upload Bukti Bayar" description={`Kirim bukti untuk invoice ${selectedInvoice.invoiceNumber}.`}>
            <PaymentProofForm
              invoice={selectedInvoice}
              isSubmitting={paymentMutation.isPending}
              onSubmit={(input) => paymentMutation.mutate({ invoiceId: selectedInvoice.id, ...input })}
            />
          </ContentCard>
        ) : null}

        <div>
          <h2 className="mb-1 text-lg font-semibold">Pilihan Paket</h2>
          <p className="mb-4 text-sm text-muted-foreground">Pilih upgrade atau ajukan downgrade. Paket berbayar aktif setelah bukti bayar disetujui admin.</p>

          {plansQuery.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat daftar paket...
            </div>
          ) : plansQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Gagal memuat daftar paket. Periksa koneksi Anda dan coba lagi.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan: SubscriptionPlan) => {
                const price = plan.billingPeriod === 'yearly' && plan.yearlyPrice ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice)
                const isCurrent = plan.code === subscription.planCode
                return (
                  <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{formatPeriod(plan.billingPeriod)} • {plan.trialDays > 0 ? `Trial ${plan.trialDays} hari` : 'Tanpa trial'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="text-2xl font-bold">
                        {formatRupiah(price)}
                        <span className="text-sm font-normal text-muted-foreground">/{plan.billingPeriod === 'yearly' ? 'tahun' : 'bulan'}</span>
                      </div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />Storage {Math.round(plan.storageLimitMb / 1024 * 10) / 10} GB</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />Hingga {plan.maxBranches} cabang</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />Hingga {plan.maxUsers} pengguna</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant={isCurrent ? 'outline' : 'default'} disabled={isCurrent || !activeTenant || changePlanMutation.isPending} onClick={() => handlePlanAction(plan)}>
                        {isCurrent ? 'Paket Aktif' : 'Ajukan Perubahan Paket'}
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
