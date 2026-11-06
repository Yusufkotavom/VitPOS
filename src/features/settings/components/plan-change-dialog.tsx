import { CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SubscriptionPlan } from '@/services/api/subscription.service'

function formatRupiah(value: number | string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

interface PlanChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  targetPlan: SubscriptionPlan | null
  currentPlanCode?: string
  currentPlanName?: string
  isSubmitting?: boolean
  onConfirm: (targetPlan: SubscriptionPlan, billingPeriod: 'monthly' | 'yearly') => void
}

export function PlanChangeDialog({
  isOpen,
  onClose,
  targetPlan,
  currentPlanCode,
  currentPlanName,
  isSubmitting = false,
  onConfirm,
}: PlanChangeDialogProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly')

  if (!targetPlan) return null

  const isFree = targetPlan.code === 'free' || Number(targetPlan.monthlyPrice) === 0
  const monthlyPrice = Number(targetPlan.monthlyPrice)
  const yearlyPrice = targetPlan.yearlyPrice ? Number(targetPlan.yearlyPrice) : null

  const effectivePrice = selectedPeriod === 'yearly' && yearlyPrice !== null ? yearlyPrice : monthlyPrice
  const isSamePlan = targetPlan.code === currentPlanCode

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isSamePlan ? 'Perpanjang Paket Langganan' : 'Konfirmasi Pindah Paket'}
              </DialogTitle>
              <DialogDescription>
                {isSamePlan
                  ? 'Perpanjang masa aktif paket Anda saat ini.'
                  : 'Pilih periode dan konfirmasi perpindahan paket usaha Anda.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan Transition Preview */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Paket Saat Ini</p>
              <p className="font-semibold text-foreground">{currentPlanName || currentPlanCode || 'Free'}</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Paket Baru</p>
              <p className="font-semibold text-primary">{targetPlan.name}</p>
            </div>
          </div>

          {/* Billing Period Toggle (if yearly is available and not free) */}
          {!isFree && yearlyPrice !== null && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pilih Periode Penagihan</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                    selectedPeriod === 'monthly'
                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <span className="text-xs font-semibold">Bulanan</span>
                  <span className="mt-1 text-sm font-bold">{formatRupiah(monthlyPrice)}</span>
                  <span className="text-[11px] text-muted-foreground">/bulan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`relative flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                    selectedPeriod === 'yearly'
                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <Badge variant="default" className="absolute top-2 right-2 px-1.5 py-0 text-[10px]">
                    Hemat
                  </Badge>
                  <span className="text-xs font-semibold">Tahunan</span>
                  <span className="mt-1 text-sm font-bold">{formatRupiah(yearlyPrice)}</span>
                  <span className="text-[11px] text-muted-foreground">/tahun</span>
                </button>
              </div>
            </div>
          )}

          {/* Plan Highlights */}
          <div className="rounded-lg border bg-card p-3.5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fitur & Kapasitas Paket {targetPlan.name}
            </p>
            <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>Hingga <strong>{targetPlan.maxBranches} Cabang</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>Hingga <strong>{targetPlan.maxUsers} Pengguna</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>Penyimpanan <strong>{Math.round(targetPlan.storageLimitMb / 1024 * 10) / 10} GB</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>Masa aktif <strong>{selectedPeriod === 'yearly' ? '365 hari' : `${targetPlan.durationDays} hari`}</strong></span>
              </li>
            </ul>
          </div>

          {/* Price Summary */}
          <div className="rounded-lg border bg-muted/20 p-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Tagihan:</span>
              <span className="text-lg font-bold text-foreground">
                {isFree ? 'Gratis (Rp 0)' : `${formatRupiah(effectivePrice)} / ${selectedPeriod === 'yearly' ? 'tahun' : 'bulan'}`}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isFree
                ? 'Paket Free akan diaktifkan seketika. Tidak ada biaya yang dikenakan.'
                : 'Setelah konfirmasi, tagihan invoice akan dibuat dan Anda dapat langsung mengunggah bukti transfer.'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={() => onConfirm(targetPlan, selectedPeriod)}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isFree ? 'Aktifkan Paket Sekarang' : 'Konfirmasi Pindah Paket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
