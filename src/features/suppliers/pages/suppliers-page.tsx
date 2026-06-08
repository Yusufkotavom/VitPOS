import { formatCurrency } from '@/lib/format-currency'
import { SupplierCrudActions } from '@/features/suppliers/components/supplier-crud-actions'
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Aktif') return 'success'
  if (status === 'Hutang') return 'warning'
  return 'neutral'
}

export function SuppliersPage() {
  const supplierRows = useSuppliers()

  return (
    <PageShell title="Supplier" description="Kontak supplier, hutang berjalan, payment history, dan aging list." actions={<SupplierCrudActions />}>
      <ContentCard title="Daftar Supplier" description="Supplier lokal tersimpan dulu, lalu masuk antrean sinkron.">
        <DataTable
          data={supplierRows}
          emptyTitle="Belum ada supplier"
          columns={[
            { key: 'name', header: 'Supplier' },
            { key: 'phone', header: 'Telepon' },
            { key: 'city', header: 'Kota' },
            { key: 'payable', header: 'Hutang', render: (row) => formatCurrency(row.payable) },
            { key: 'orders', header: 'Total Order', render: (row) => String(row.orders) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <SupplierCrudActions supplier={row} /> },
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
              <div className="flex items-center justify-between text-sm"><span>Hutang {formatCurrency(row.payable)}</span><span>{row.orders} order</span></div>
              <SupplierCrudActions supplier={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
