import { formatCurrency } from '@/lib/format-currency'
import { PurchaseCrudActions } from '@/features/purchases/components/purchase-crud-actions'
import { usePurchases } from '@/features/purchases/hooks/use-purchases'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Diterima') return 'success'
  if (status === 'Dikirim') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

export function PurchasesPage() {
  const purchaseRows = usePurchases()

  return (
    <PageShell title="Pembelian" description="Purchase order, penerimaan barang, dan hutang supplier." actions={<PurchaseCrudActions />}>
      <ContentCard title="Daftar Purchase Order" description="PO tersimpan lokal dulu, lalu masuk antrean sinkron.">
        <DataTable
          data={purchaseRows}
          emptyTitle="Belum ada purchase order"
          columns={[
            { key: 'code', header: 'PO' },
            { key: 'supplierName', header: 'Supplier' },
            { key: 'date', header: 'Tanggal' },
            { key: 'grandTotal', header: 'Total', render: (row) => formatCurrency(row.grandTotal) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <PurchaseCrudActions purchase={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.code}</p>
                  <p className="text-sm text-muted-foreground">{row.supplierName} · {row.date}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <p className="text-sm font-semibold">{formatCurrency(row.grandTotal)}</p>
              <PurchaseCrudActions purchase={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
