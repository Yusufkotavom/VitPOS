import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SubscriptionInvoice } from '@/services/api/subscription.service'

function formatRupiah(value: string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID')
}

export function BillingInvoiceTable({ invoices }: { invoices: SubscriptionInvoice[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Tagihan</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada tagihan.</p> : null}
        {invoices.map((invoice) => (
          <div key={invoice.id} className="grid gap-2 rounded-xl border p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
            <div>
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">Tenant {invoice.tenantId}</p>
            </div>
            <div className="text-sm">
              <p>{invoice.planCode}</p>
              <p className="text-muted-foreground">{invoice.billingPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'}</p>
            </div>
            <div className="text-sm">
              <p>{formatRupiah(invoice.amount)}</p>
              <p className="text-muted-foreground">Jatuh tempo {formatDate(invoice.dueAt)}</p>
            </div>
            <Badge variant="outline">{invoice.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
