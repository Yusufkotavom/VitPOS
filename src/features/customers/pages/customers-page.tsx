import { CustomerCrudActions } from '@/features/customers/components/customer-crud-actions'
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
    <PageShell title="Pelanggan" description="Daftar pelanggan, piutang, riwayat order, dan quick action WhatsApp." actions={<CustomerCrudActions />}>
      <ContentCard title="Daftar Pelanggan" description="Pelanggan lokal tersimpan dulu, lalu masuk antrean sinkron.">
        <DataTable
          data={customerRows}
          emptyTitle="Belum ada pelanggan"
          columns={[
            { key: 'name', header: 'Pelanggan' },
            { key: 'phone', header: 'WhatsApp' },
            { key: 'city', header: 'Kota' },
            { key: 'receivable', header: 'Piutang' },
            { key: 'orders', header: 'Total Order' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <CustomerCrudActions customer={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.phone} · {row.city}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <div className="flex items-center justify-between text-sm"><span>Piutang {row.receivable}</span><span>{row.orders}</span></div>
              <CustomerCrudActions customer={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
