import { Button } from '@/components/ui/button'
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
    <PageShell title="Pembayaran" description="Record payment, refund, metode bayar, dan status transaksi." actions={<Button>Record Payment</Button>}>
      <ContentCard title="Daftar Pembayaran" description="Pantau sumber pembayaran dan status refund.">
        <DataTable
          data={payments}
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'source', header: 'Sumber' },
            { key: 'method', header: 'Metode' },
            { key: 'amount', header: 'Nominal' },
            { key: 'date', header: 'Tanggal' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.ref}</p>
              <p className="text-sm text-muted-foreground">{row.source} · {row.method}</p>
              <div className="flex items-center justify-between text-sm"><span>{row.amount}</span><span>{row.date}</span></div>
              <StatusBadge label={row.status} tone={tone(row.status)} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
