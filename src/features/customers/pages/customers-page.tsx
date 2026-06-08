import { Button } from '@/components/ui/button'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Piutang') return 'warning'
  if (status === 'Aktif') return 'success'
  return 'neutral'
}

export function CustomersPage() {
  const customerRows = useCustomers()

  return (
    <PageShell title="Pelanggan" description="Daftar pelanggan, piutang, riwayat order, dan quick action WhatsApp." actions={<Button>Tambah Pelanggan</Button>}>
      <ContentCard title="Daftar Pelanggan" description="Search sticky, filter status, dan detail pelanggan via sheet.">
        <DataTable
          data={customerRows}
          columns={[
            { key: 'name', header: 'Pelanggan' },
            { key: 'phone', header: 'WhatsApp' },
            { key: 'city', header: 'Kota' },
            { key: 'receivable', header: 'Piutang' },
            { key: 'orders', header: 'Total Order' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.phone} · {row.city}</p>
              <div className="flex items-center justify-between text-sm"><span>Piutang {row.receivable}</span><span>{row.orders} order</span></div>
              <StatusBadge label={row.status} tone={tone(row.status)} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
