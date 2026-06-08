import { formatCurrency } from '@/lib/format-currency'
import { ServiceOrderCrudActions } from '@/features/service-orders/components/service-order-crud-actions'
import { useServiceOrders } from '@/features/service-orders/hooks/use-service-orders'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

export function ServiceOrdersPage() {
  const serviceRows = useServiceOrders()

  return (
    <PageShell title="Service Order" description="Kanban, timeline kerja, biaya, garansi, dan update WhatsApp." actions={<ServiceOrderCrudActions />}>
      <ContentCard title="Daftar Service Order" description="Service order tersimpan lokal dulu, lalu masuk antrean sinkron.">
        <DataTable
          data={serviceRows}
          emptyTitle="Belum ada service order"
          columns={[
            { key: 'code', header: 'No Service' },
            { key: 'customerName', header: 'Pelanggan' },
            { key: 'description', header: 'Pekerjaan' },
            { key: 'date', header: 'Tanggal' },
            { key: 'cost', header: 'Biaya', render: (row) => formatCurrency(row.cost) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <ServiceOrderCrudActions order={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.code}</p>
                  <p className="text-sm text-muted-foreground">{row.customerName} · {row.date}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <p className="text-sm">{row.description}</p>
              <div className="flex items-center justify-between text-sm"><span>{formatCurrency(row.cost)}</span></div>
              <ServiceOrderCrudActions order={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
