import { PaymentCrudActions } from '@/features/payments/components/payment-crud-actions'
import { formatCurrency } from '@/lib/format-currency'
import { usePayments } from '@/features/payments/hooks/use-payments'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Berhasil') return 'success'
  if (status === 'Pending') return 'info'
  if (status === 'Refund') return 'warning'
  return 'danger'
}

export function PaymentsPage() {
  const payments = usePayments()

  return (
    <PageShell title="Pembayaran" description="Record payment, refund, metode bayar, dan status transaksi." actions={<PaymentCrudActions />}>
      <ContentCard title="Daftar Pembayaran" description="Pantau sumber pembayaran dan status refund.">
        <DataTable
          data={payments}
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'source', header: 'Sumber' },
            { key: 'method', header: 'Metode' },
            { key: 'amount', header: 'Nominal', render: (row) => formatCurrency(row.amount) },
            { key: 'date', header: 'Tanggal' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <PaymentCrudActions payment={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.ref}</p>
                  <p className="text-sm text-muted-foreground">{row.source} · {row.method}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <div className="flex items-center justify-between text-sm"><span>{formatCurrency(row.amount)}</span><span>{row.date}</span></div>
              <PaymentCrudActions payment={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
