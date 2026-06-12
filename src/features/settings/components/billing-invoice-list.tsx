import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SubscriptionInvoice } from '@/services/api/subscription.service'

function formatRupiah(value: string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

function statusLabel(status: SubscriptionInvoice['status']) {
  switch (status) {
    case 'pending_payment': return 'Menunggu Pembayaran'
    case 'submitted': return 'Menunggu Approval'
    case 'paid': return 'Lunas'
    case 'cancelled': return 'Dibatalkan'
    case 'expired': return 'Kedaluwarsa'
    default: return status
  }
}

export function BillingInvoiceList({ invoices, onPay }: { invoices: SubscriptionInvoice[]; onPay: (invoice: SubscriptionInvoice) => void }) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Tagihan</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Belum ada tagihan.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Tagihan</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">{invoice.planCode} • {formatRupiah(invoice.amount)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusLabel(invoice.status)}</Badge>
              {(invoice.status === 'pending_payment' || invoice.status === 'submitted') ? (
                <Button size="sm" variant="outline" onClick={() => onPay(invoice)}>Upload Bukti</Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
