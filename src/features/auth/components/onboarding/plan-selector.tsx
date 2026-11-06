import { CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { SubscriptionPlan } from '@/services/api/subscription.service'

function formatRupiah(value: number | string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

interface PlanSelectorProps {
  plans: SubscriptionPlan[]
  selectedPlanCode: string
  isLoading?: boolean
  onSelectPlan: (plan: SubscriptionPlan) => void
}

export function PlanSelector({
  plans,
  selectedPlanCode,
  isLoading = false,
  onSelectPlan,
}: PlanSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="mt-2 font-medium">Memuat pilihan paket yang tersedia...</span>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Belum ada paket yang aktif saat ini. Anda akan didaftarkan ke paket standar.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Pilih paket langganan yang aktif untuk memulai operasional toko Anda. Anda dapat mengubah atau upgrade paket kapan saja.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = plan.code === selectedPlanCode
          const price = Number(plan.monthlyPrice)
          const isTrial = plan.trialDays > 0

          return (
            <Card
              key={plan.id || plan.code}
              onClick={() => onSelectPlan(plan)}
              className={`relative cursor-pointer transition-all hover:border-primary/50 ${
                isSelected
                  ? 'border-2 border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                  : 'border-border bg-card'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                      {plan.name}
                      {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isTrial ? `Masa percobaan ${plan.trialDays} hari gratis` : 'Langsung aktif'}
                    </p>
                  </div>
                  {isTrial ? (
                    <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-[11px] gap-1">
                      <Clock className="size-3" /> Trial {plan.trialDays}h
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[11px] gap-1">
                      <Sparkles className="size-3" /> Berbayar
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="text-2xl font-extrabold text-foreground">
                    {price === 0 ? 'Gratis' : formatRupiah(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">/bulan</span>
                  )}
                </div>

                <ul className="space-y-1.5 text-xs text-muted-foreground border-t pt-2.5">
                  <li className="flex items-center gap-1.5 text-foreground/90">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Hingga <strong>{plan.maxBranches} Cabang</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground/90">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Hingga <strong>{plan.maxUsers} Kasir / Pengguna</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground/90">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Penyimpanan <strong>{Math.round(plan.storageLimitMb / 1024 * 10) / 10} GB</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground/90">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Katalog WhatsApp & Storefront Online</span>
                  </li>
                </ul>

                <div className="pt-1">
                  <div
                    className={`w-full py-1.5 px-3 rounded-lg text-center text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
