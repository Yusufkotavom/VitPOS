import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HardDrive,
  HelpCircle,
  Loader2,
  Receipt,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { BillingInvoiceList } from '@/features/settings/components/billing-invoice-list'
import { BillingSupportCard } from '@/features/settings/components/billing-support-card'
import { PlanChangeDialog } from '@/features/settings/components/plan-change-dialog'
import { PaymentProofModal } from '@/features/settings/components/payment-proof-modal'
import { useSubscription } from '@/features/settings/hooks/use-subscription'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import {
  subscriptionService,
  type SubscriptionInvoice,
  type SubscriptionPlan,
} from '@/services/api/subscription.service'
import type { LocalTenant } from '@/services/local-db/schema'

function formatRupiah(n: number | string) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function formatPeriod(period: 'monthly' | 'yearly') {
  return period === 'yearly' ? 'Tahunan' : 'Bulanan'
}

function statusLabel(status: string) {
  switch (status) {
    case 'trial': return 'Masa Percobaan'
    case 'active': return 'Aktif'
    case 'pending_payment': return 'Menunggu Pembayaran'
    case 'pending_approval': return 'Menunggu Approval Admin'
    case 'expired': return 'Kedaluwarsa'
    case 'past_due': return 'Tertunggak'
    case 'suspended': return 'Ditangguhkan'
    case 'cancelled': return 'Dibatalkan'
    case 'free': return 'Free Aktif'
    default: return status
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'active':
    case 'free':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'trial':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'pending_payment':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'pending_approval':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    case 'past_due':
    case 'expired':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'suspended':
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function SubscriptionPage() {
  const queryClient = useQueryClient()
  const { activeTenant, setActiveTenant } = useAuthStore()
  const subscription = useSubscription()

  const [activeTab, setActiveTab] = useState('plans')
  const [targetPlanForChange, setTargetPlanForChange] = useState<SubscriptionPlan | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null)
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info' | 'error'
    title: string
    message: string
  } | null>(null)

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

  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data])
  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data])

  const pendingInvoicesCount = useMemo(
    () => invoices.filter((i) => i.status === 'pending_payment').length,
    [invoices],
  )

  const currentPlan = useMemo(
    () => plans.find((p) => p.code === subscription.planCode) ?? null,
    [plans, subscription.planCode],
  )

  const changePlanMutation = useMutation({
    mutationFn: ({
      planCode,
      billingPeriod,
      changeType,
    }: {
      planCode: string
      billingPeriod: 'monthly' | 'yearly'
      changeType: 'upgrade' | 'downgrade' | 'renewal'
    }) =>
      subscriptionService.changePlan({
        tenantId: activeTenant!.id,
        toPlanCode: planCode,
        billingPeriod,
        changeType,
      }),
    onSuccess: async (response, variables) => {
      setTargetPlanForChange(null)
      await queryClient.invalidateQueries({ queryKey: ['subscription-invoices', activeTenant?.id] })

      if (variables.planCode === 'free' || variables.planCode.startsWith('free')) {
        if (activeTenant) {
          const { role, ...tenantBase } = activeTenant
          const updated: LocalTenant = {
            ...tenantBase,
            planCode: 'free-monthly',
            subscriptionStatus: 'active',
            planValidUntil: undefined,
          }
          setActiveTenant(updated, role)
        }
        setFeedbackBanner({
          type: 'success',
          title: 'Paket Berhasil Diubah',
          message: 'Paket usaha Anda telah beralih ke paket Free seketika.',
        })
      } else {
        const updatedInvoices = await subscriptionService.listInvoices(activeTenant!.id)
        queryClient.setQueryData(['subscription-invoices', activeTenant?.id], updatedInvoices)

        const createdInvoiceId = (response as { invoiceId?: string | null })?.invoiceId
        const newInvoice = createdInvoiceId
          ? updatedInvoices.find((i) => i.id === createdInvoiceId)
          : updatedInvoices.find((i) => i.status === 'pending_payment')

        if (newInvoice) {
          setSelectedInvoice(newInvoice)
          setActiveTab('invoices')
          setFeedbackBanner({
            type: 'info',
            title: 'Tagihan Berhasil Dibuat',
            message: `Tagihan ${newInvoice.invoiceNumber} siap dibayar. Silakan lakukan transfer dan unggah bukti transfer.`,
          })
        } else {
          setActiveTab('invoices')
        }
      }
    },
    onError: (error: Error) => {
      setFeedbackBanner({
        type: 'error',
        title: 'Gagal Memproses Perubahan Paket',
        message: error.message || 'Terjadi kesalahan saat memproses paket.',
      })
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
      setFeedbackBanner({
        type: 'info',
        title: 'Langganan Dibatalkan',
        message: 'Langganan berhasil dibatalkan. Akses tetap aktif sampai akhir periode berjalan.',
      })
    },
  })

  async function handlePaymentSubmit(input: {
    invoiceId: string
    amount: string
    bankName?: string
    accountName?: string
    referenceNumber?: string
    proofImageUrl?: string
    proofText?: string
  }) {
    if (!activeTenant) return

    await subscriptionService.submitPayment({ tenantId: activeTenant.id, ...input })
    await queryClient.invalidateQueries({ queryKey: ['subscription-invoices', activeTenant.id] })

    const { role, ...tenantBase } = activeTenant
    const updated: LocalTenant = {
      ...tenantBase,
      subscriptionStatus: 'pending_approval',
    }
    setActiveTenant(updated, role)

    setFeedbackBanner({
      type: 'success',
      title: 'Bukti Pembayaran Diterima',
      message: 'Bukti transfer berhasil dikirim. Admin akan memverifikasi pembayaran Anda (maks. 1x24 jam kerja).',
    })
  }

  function handleOpenChangeModal(targetPlan: SubscriptionPlan) {
    if (!activeTenant) return
    setTargetPlanForChange(targetPlan)
  }

  function handleConfirmPlanChange(plan: SubscriptionPlan, billingPeriod: 'monthly' | 'yearly') {
    if (!activeTenant) return
    const currentPrice = currentPlan ? Number(currentPlan.yearlyPrice ?? currentPlan.monthlyPrice) : 0
    const targetPrice = billingPeriod === 'yearly' && plan.yearlyPrice ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice)
    const changeType = targetPrice < currentPrice ? 'downgrade' : plan.code === subscription.planCode ? 'renewal' : 'upgrade'

    changePlanMutation.mutate({ planCode: plan.code, billingPeriod, changeType })
  }

  return (
    <PageShell
      title="Langganan & Tagihan"
      description="Kelola paket langganan, kuota kapasitas, dan riwayat faktur pembayaran."
      backTo="/settings"
    >
      <SettingsNav className="mb-6 hidden md:flex" />

      {/* Global Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            feedbackBanner.type === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : feedbackBanner.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-primary/30 bg-primary/5 text-primary'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : feedbackBanner.type === 'error' ? (
              <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
            ) : (
              <Clock className="size-5 shrink-0 text-primary mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedbackBanner.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{feedbackBanner.message}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            onClick={() => setFeedbackBanner(null)}
          >
            Tutup
          </Button>
        </div>
      )}

      {/* Structured Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-11 p-1 bg-muted/70">
          <TabsTrigger value="plans" className="gap-2 text-xs sm:text-sm">
            <Sparkles className="size-4" />
            <span>Paket & Kuota</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 text-xs sm:text-sm relative">
            <Receipt className="size-4" />
            <span>Tagihan</span>
            {pendingInvoicesCount > 0 && (
              <Badge variant="default" className="size-4.5 rounded-full p-0 flex items-center justify-center text-[10px] bg-amber-500 text-white shrink-0">
                {pendingInvoicesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="instructions" className="gap-2 text-xs sm:text-sm">
            <HelpCircle className="size-4" />
            <span>Rekening & Bantuan</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PAKET & KUOTA */}
        <TabsContent value="plans" className="space-y-6">
          {/* Active Plan Overview Card */}
          <Card className="border-primary/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Status Paket Aktif</CardTitle>
                  <CardDescription>Detail paket langganan dan kapasitas yang sedang digunakan.</CardDescription>
                </div>
                <Badge variant="outline" className={`w-fit py-1 px-3 text-xs font-semibold ${statusTone(subscription.status)}`}>
                  {statusLabel(subscription.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <p className="text-xs text-muted-foreground">Paket Saat Ini</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{subscription.planName}</p>
                  <p className="text-xs text-muted-foreground">Periode: {formatPeriod(subscription.billingPeriod)}</p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3.5" /> Masa Berlaku
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {subscription.planValidUntil
                      ? new Date(subscription.planValidUntil).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Aktif Selamanya'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subscription.daysLeft === null ? 'Tidak ada batas waktu' : `${Math.max(0, subscription.daysLeft)} hari tersisa`}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="size-3.5" /> Kuota Cabang & User
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {activeTenant?.maxBranches ?? currentPlan?.maxBranches ?? 1} Cabang
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hingga {currentPlan?.maxUsers ?? 1} Pengguna Kasir / Admin
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HardDrive className="size-3.5" /> Kuota Cloud Storage
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {Math.round(((activeTenant?.storageLimitMb ?? currentPlan?.storageLimitMb ?? 512) / 1024) * 10) / 10} GB
                  </p>
                  <p className="text-xs text-muted-foreground">Penyimpanan katalog & gambar</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                {currentPlan && (
                  <Button
                    onClick={() => handleOpenChangeModal(currentPlan)}
                    disabled={!activeTenant || changePlanMutation.isPending}
                    className="gap-1.5"
                  >
                    <Sparkles className="size-4" /> Perpanjang Paket Aktif
                  </Button>
                )}
                {subscription.status !== 'cancelled' && subscription.status !== 'free' && activeTenant && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('Batalkan langganan? Akses tetap aktif sampai akhir periode berjalan.')) {
                        cancelMutation.mutate()
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Langganan'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans Grid */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Pilihan Paket Langganan</h3>
              <p className="text-sm text-muted-foreground">
                Pilih paket yang sesuai untuk meningkatkan kuota cabang, pengguna kasir, dan fitur toko online Anda.
              </p>
            </div>

            {plansQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Memuat daftar paket langganan...</span>
              </div>
            ) : plansQuery.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Gagal memuat daftar paket. Periksa koneksi internet Anda dan coba lagi.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan: SubscriptionPlan) => {
                  const price =
                    plan.billingPeriod === 'yearly' && plan.yearlyPrice
                      ? Number(plan.yearlyPrice)
                      : Number(plan.monthlyPrice)
                  const isCurrent = plan.code === subscription.planCode
                  const isFree = plan.code === 'free' || price === 0

                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-2 border-primary shadow-md bg-card ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-0.5 shadow-xs">
                            Paket Anda Saat Ini
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pt-6">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                          <Badge variant="outline" className="text-[11px]">
                            {formatPeriod(plan.billingPeriod)}
                          </Badge>
                        </div>
                        <CardDescription>
                          {plan.trialDays > 0 ? `Trial ${plan.trialDays} hari gratis` : 'Langsung aktif'}
                        </CardDescription>

                        <div className="mt-3">
                          <span className="text-3xl font-extrabold text-foreground">
                            {isFree ? 'Gratis' : formatRupiah(price)}
                          </span>
                          {!isFree && (
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              /{plan.billingPeriod === 'yearly' ? 'tahun' : 'bulan'}
                            </span>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Fitur & Kapasitas
                        </p>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-foreground/90">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>Hingga <strong>{plan.maxBranches} Cabang</strong></span>
                          </li>
                          <li className="flex items-center gap-2 text-foreground/90">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>Hingga <strong>{plan.maxUsers} Pengguna</strong></span>
                          </li>
                          <li className="flex items-center gap-2 text-foreground/90">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>Penyimpanan <strong>{Math.round(plan.storageLimitMb / 1024 * 10) / 10} GB</strong></span>
                          </li>
                          <li className="flex items-center gap-2 text-foreground/90">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>Katalog & Storefront Publik WhatsApp</span>
                          </li>
                          <li className="flex items-center gap-2 text-foreground/90">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>Lacak Pesanan Pelanggan Online</span>
                          </li>
                        </ul>
                      </CardContent>

                      <CardFooter className="pt-2">
                        <Button
                          className="w-full"
                          variant={isCurrent ? 'outline' : 'default'}
                          disabled={!activeTenant || changePlanMutation.isPending}
                          onClick={() => handleOpenChangeModal(plan)}
                        >
                          {isCurrent ? 'Perpanjang / Kelola' : 'Pilih Paket Ini'}
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: RIWAYAT TAGIHAN */}
        <TabsContent value="invoices" className="space-y-6">
          <BillingInvoiceList
            invoices={invoices}
            onPay={(invoice) => setSelectedInvoice(invoice)}
          />
        </TabsContent>

        {/* TAB 3: REKENING & BANTUAN */}
        <TabsContent value="instructions" className="space-y-6">
          <BillingSupportCard settings={billingSettingsQuery.data} />
        </TabsContent>
      </Tabs>

      {/* POPUP MODAL 1: PINDAH / PERPANJANG PAKET */}
      <PlanChangeDialog
        isOpen={Boolean(targetPlanForChange)}
        onClose={() => setTargetPlanForChange(null)}
        targetPlan={targetPlanForChange}
        currentPlanCode={subscription.planCode}
        currentPlanName={subscription.planName}
        isSubmitting={changePlanMutation.isPending}
        onConfirm={handleConfirmPlanChange}
      />

      {/* POPUP MODAL 2: UPLOAD BUKTI PEMBAYARAN */}
      <PaymentProofModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        billingSettings={billingSettingsQuery.data}
        onSubmitPayment={handlePaymentSubmit}
      />
    </PageShell>
  )
}
