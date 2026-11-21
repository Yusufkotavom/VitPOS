import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smartphone,
  User,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { localDb } from '@/services/local-db/client'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import {
  isWarrantyExpired,
  resolveServiceWarranty,
} from '@/features/service-orders/lib/warranty'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export type ServiceWarrantyLookupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getDaysRemaining(endDateStr?: string): number {
  if (!endDateStr) return 0
  const end = new Date(endDateStr).getTime()
  const now = Date.now()
  const diff = end - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function ServiceWarrantyLookupDialog({
  open,
  onOpenChange,
}: ServiceWarrantyLookupDialogProps) {
  const [keyword, setKeyword] = useState('')
  const serviceOrders = useServiceOrders()

  const trimmed = keyword.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!trimmed) return []
    return serviceOrders
      .filter((order) => {
        const codeMatch = order.code.toLowerCase().includes(trimmed)
        const customerMatch = order.customerName.toLowerCase().includes(trimmed)
        const deviceMatch = [order.deviceBrand, order.deviceModel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(trimmed)
        const descMatch = (order.description || '').toLowerCase().includes(trimmed)
        return codeMatch || customerMatch || deviceMatch || descMatch
      })
      .slice(0, 10)
  }, [serviceOrders, trimmed])

  async function handleShareWa(order: LocalServiceOrder) {
    const customer = order.customerId ? await localDb.customers.get(order.customerId) : undefined
    const phone = customer?.phone || ''
    const resolved = resolveServiceWarranty(order)
    let statusText = 'Tanpa Garansi'
    if (resolved.hasWarranty && resolved.warrantyEndDate) {
      const expired = isWarrantyExpired(resolved.warrantyEndDate)
      const remainingDays = getDaysRemaining(resolved.warrantyEndDate)
      statusText = expired
        ? `Garansi Berakhir pada ${new Date(resolved.warrantyEndDate).toLocaleDateString('id-ID')}`
        : `Garansi AKTIF (${remainingDays} hari tersisa, s/d ${new Date(resolved.warrantyEndDate).toLocaleDateString('id-ID')})`
    }

    const device =
      [order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') ||
      order.jobCategory ||
      order.description
    const text = `🛡️ *INFO GARANSI SERVIS*\n─────────────────\n*No Servis:* ${order.code}\n*Pelanggan:* ${order.customerName}\n*Perangkat:* ${device}\n*Status Garansi:* ${statusText}\n─────────────────\nTerima kasih.`
    window.open(buildWhatsAppLink(phone, text), '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Cek Garansi Servis Cepat
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan barcode stiker unit atau ketik nomor nota / nama pelanggan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Scan barcode nota / ketik SRV-0001 / nama pelanggan..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 pr-8 text-sm"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Bersihkan pencarian"
              >
                <X className="size-4" />
              </button>
            )}
          </form>

          {!trimmed ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-muted-foreground">
              <ShieldCheck className="mb-2 size-10 opacity-30" />
              <p className="text-sm font-medium">Masukkan nomor nota atau scan barcode servis</p>
              <p className="text-xs">
                Masa garansi akan langsung terdeteksi beserta sisa hari dan status klaim.
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-muted-foreground">
              <ShieldAlert className="mb-2 size-10 text-amber-500 opacity-60" />
              <p className="text-sm font-medium">Data servis tidak ditemukan</p>
              <p className="text-xs">
                Tidak ada riwayat servis yang cocok dengan &quot;{keyword}&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ditemukan ({matches.length}) Servis:
              </p>
              {matches.map((order) => {
                const resolved = resolveServiceWarranty(order)
                const isFinished = order.status === 'Selesai' || order.status === 'Diambil'
                const expired = resolved.hasWarranty && resolved.warrantyEndDate
                  ? isWarrantyExpired(resolved.warrantyEndDate)
                  : false
                const remainingDays = resolved.warrantyEndDate
                  ? getDaysRemaining(resolved.warrantyEndDate)
                  : 0

                return (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all hover:border-primary/40 hover:bg-muted/10 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {order.code}
                        </span>
                        <StatusBadge
                          label={order.status}
                          tone={
                            order.status === 'Selesai' || order.status === 'Diambil'
                              ? 'success'
                              : 'info'
                          }
                        />

                        {resolved.hasWarranty ? (
                          !isFinished ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                              <ShieldAlert className="size-3.5" />
                              Menunggu Selesai ({resolved.warrantyValue} {resolved.warrantyUnit})
                            </span>
                          ) : expired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                              <ShieldX className="size-3.5" />
                              Garansi Habis (s/d{' '}
                              {new Date(resolved.warrantyEndDate!).toLocaleDateString('id-ID')})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="size-3.5" />
                              Garansi Aktif (sisa {remainingDays} hari · s/d{' '}
                              {new Date(resolved.warrantyEndDate!).toLocaleDateString('id-ID')})
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <ShieldX className="size-3.5 opacity-50" />
                            Tanpa Garansi
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          <span className="font-medium text-foreground">{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="size-3.5" />
                          <span>
                            {[order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') ||
                              order.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>Tanggal: {formatDateTime(order.date)}</span>
                        </div>
                        <div>
                          Biaya: <span className="font-medium text-foreground">{formatCurrency(order.cost)}</span>
                        </div>
                      </div>

                      {order.complaint && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Keluhan: {order.complaint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => onOpenChange(false)}
                      >
                        <Link to={`/service-orders/${order.id}`}>
                          <ExternalLink className="mr-1.5 size-3.5" />
                          Buka Detail
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => handleShareWa(order)}
                      >
                        <MessageSquare className="mr-1.5 size-3.5" />
                        Kirim WA
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
