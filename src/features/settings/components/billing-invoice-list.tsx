import { Calendar, CheckCircle2, Clock, FileText, Receipt, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SubscriptionInvoice } from '@/services/api/subscription.service'

function formatRupiah(value: string | number) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

function formatDate(isoString?: string | null) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusBadge(status: SubscriptionInvoice['status']) {
  switch (status) {
    case 'pending_payment':
      return {
        label: 'Menunggu Pembayaran',
        className: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: Clock,
      }
    case 'submitted':
      return {
        label: 'Menunggu Verifikasi Admin',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Clock,
      }
    case 'paid':
      return {
        label: 'Lunas & Aktif',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
      }
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: FileText,
      }
    case 'expired':
      return {
        label: 'Kedaluwarsa',
        className: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: Clock,
      }
    default:
      return {
        label: status,
        className: 'bg-muted text-muted-foreground',
        icon: FileText,
      }
  }
}

export function BillingInvoiceList({
  invoices,
  onPay,
}: {
  invoices: SubscriptionInvoice[]
  onPay: (invoice: SubscriptionInvoice) => void
}) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Tagihan & Pembayaran</CardTitle>
          <CardDescription>Semua riwayat faktur langganan toko Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Belum ada riwayat tagihan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tagihan baru akan muncul otomatis saat Anda memilih atau memperpanjang paket langganan berbayar.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Riwayat Tagihan & Pembayaran</CardTitle>
            <CardDescription>Daftar invoice langganan dan status konfirmasi pembayaran.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            {invoices.length} Tagihan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.map((invoice) => {
          const badge = statusBadge(invoice.status)
          const BadgeIcon = badge.icon
          const canUpload = invoice.status === 'pending_payment' || invoice.status === 'submitted'

          return (
            <div
              key={invoice.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/10 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground tracking-tight">{invoice.invoiceNumber}</span>
                  <Badge variant="outline" className={`gap-1 py-0.5 text-xs ${badge.className}`}>
                    <BadgeIcon className="size-3" />
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="capitalize font-medium text-foreground/80">Paket: {invoice.planCode}</span>
                  <span>•</span>
                  <span>Periode: {invoice.billingPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" /> {formatDate(invoice.periodStart)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 md:justify-end">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Nominal Tagihan</span>
                  <span className="text-base font-bold text-foreground">{formatRupiah(invoice.amount)}</span>
                </div>

                {canUpload && (
                  <Button
                    size="sm"
                    variant={invoice.status === 'pending_payment' ? 'default' : 'outline'}
                    className="gap-1.5 shrink-0"
                    onClick={() => onPay(invoice)}
                  >
                    <Upload className="size-3.5" />
                    {invoice.status === 'pending_payment' ? 'Bayar / Upload' : 'Ganti Bukti'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
