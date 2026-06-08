import { formatCurrency } from '@/lib/format-currency'
import { ReturnCrudActions } from '@/features/returns/components/return-crud-actions'
import { useReturns } from '@/features/returns/hooks/use-returns'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Selesai') return 'success'
  if (status === 'Diproses') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

export function ReturnsPage() {
  const returnRows = useReturns()

  return (
    <PageShell title="Retur" description="Retur penjualan dan pembelian beserta dampak refund dan stok." actions={<ReturnCrudActions />}>
      <ContentCard title="Daftar Retur" description="Retur tersimpan lokal dulu, lalu masuk antrean sinkron.">
        <DataTable
          data={returnRows}
          emptyTitle="Belum ada retur"
          columns={[
            { key: 'code', header: 'No Retur' },
            { key: 'type', header: 'Tipe' },
            { key: 'referenceCode', header: 'Referensi' },
            { key: 'date', header: 'Tanggal' },
            { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <ReturnCrudActions ret={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.code}</p>
                  <p className="text-sm text-muted-foreground">{row.type} · Ref: {row.referenceCode}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <div className="flex items-center justify-between text-sm"><span>{row.date}</span><span>{formatCurrency(row.total)}</span></div>
              <ReturnCrudActions ret={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
