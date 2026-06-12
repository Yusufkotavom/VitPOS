import { AlertTriangle, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { subscriptionService } from '@/services/api/subscription.service'

type Props = {
  open: boolean
  status: string
  planName: string
  planValidUntil: string | null
  warningKind?: 'expiring' | 'expired' | null
  tenantId?: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return '-'
  }
}

function dismissalKey(tenantId?: string | null) {
  return `subscription-warning-dismissed-${tenantId ?? 'unknown'}-${new Date().toISOString().slice(0, 10)}`
}

function buildWhatsappUrl(value?: string | null) {
  if (!value) return null
  if (value.startsWith('http')) return value
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned ? `https://wa.me/${cleaned}` : null
}

export function SubscriptionExpiredDialog({ open, planName, planValidUntil, warningKind = 'expired', tenantId }: Props) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem(dismissalKey(tenantId)) === '1'
    } catch {
      return false
    }
  })

  const billingSettingsQuery = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => subscriptionService.getBillingSettings(),
  })

  const supportHref = useMemo(() => {
    const settings = billingSettingsQuery.data
    return buildWhatsappUrl(settings?.supportWhatsapp) ?? settings?.supportUrl ?? null
  }, [billingSettingsQuery.data])

  if (!open || dismissed) return null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        try {
          window.localStorage.setItem(dismissalKey(tenantId), '1')
        } catch {
          // localStorage may be unavailable in private mode or tests.
        }
        setDismissed(true)
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
            <AlertTriangle className="size-6" />
          </div>
          <DialogTitle className="text-center">
            {warningKind === 'expiring' ? 'Paket Anda akan segera berakhir' : 'Paket Anda sudah berakhir'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {warningKind === 'expiring'
              ? 'Silakan perpanjang paket agar layanan tetap aman dipakai tanpa gangguan.'
              : 'Silakan perpanjang paket Anda. Data tetap aman dan Anda masih bisa membuka aplikasi.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Paket</p>
            <p className="font-medium">{planName}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Berlaku sampai</p>
            <p className="font-medium">{formatDate(planValidUntil)}</p>
          </div>
          <div className="col-span-2 rounded-lg border p-3">
            <p className="text-muted-foreground">Cara perpanjang</p>
            <p className="whitespace-pre-line font-medium">{billingSettingsQuery.data?.paymentInstructions ?? 'Buka halaman billing lalu kirim bukti pembayaran untuk diperiksa admin.'}</p>
          </div>
        </div>
        <DialogFooter className="sm:justify-stretch sm:gap-2">
          {supportHref ? (
            <Button variant="outline" asChild className="sm:w-full">
              <a href={supportHref} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 size-4" /> Hubungi Support
              </a>
            </Button>
          ) : null}
          <Button onClick={() => navigate('/settings/billing')} className="sm:w-full">Ke Billing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
