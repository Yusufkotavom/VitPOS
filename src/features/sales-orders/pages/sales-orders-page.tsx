import { Button } from '@/components/ui/button'
import { useSalesOrders } from '@/features/sales-orders/hooks/use-sales-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

export function SalesOrdersPage() {
  const orderRows = useSalesOrders()

  return (
    <PageShell title="Pesanan Penjualan" description="Invoice, pembayaran, piutang, print, PDF, dan WhatsApp." actions={<Button>Buat Invoice</Button>}>
      <ContentCard title="Daftar Invoice" description="Filter status, side detail invoice, dan action cepat pembayaran.">
        <DataTable
          data={orderRows}
          columns={[
            { key: 'code', header: 'Invoice' },
            { key: 'customer', header: 'Pelanggan' },
            { key: 'date', header: 'Tanggal' },
            { key: 'total', header: 'Total' },
            { key: 'paid', header: 'Dibayar' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.code}</p>
              <p className="text-sm text-muted-foreground">{row.customer} · {row.date}</p>
              <div className="flex items-center justify-between text-sm"><span>{row.total}</span><span>{row.paid}</span></div>
              <StatusBadge label={row.status} tone={tone(row.status)} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
