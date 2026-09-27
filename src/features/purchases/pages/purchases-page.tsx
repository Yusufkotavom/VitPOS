import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
  const { t } = useTranslation()
  const purchaseRows = usePurchases()

  return (
    <PageShell title={t('nav.pembelian')} description={t('purchases.page_description')} actions={<PurchaseCrudActions />}>
      <ContentCard title={t('purchases.list_title')} description={t('purchases.list_description')}>
        <DataTable
          data={purchaseRows}
          emptyTitle={t('purchases.empty')}
          columns={[
            { key: 'code', header: 'PO', sortable: true, render: (row) => <Link to={`/purchases/${row.id}`} className="font-medium text-primary hover:underline">{row.code}</Link> },
            { key: 'supplierName', header: t('common.supplier'), sortable: true },
            { key: 'date', header: t('common.date'), sortable: true },
            { key: 'grandTotal', header: t('common.total'), sortable: true, render: (row) => formatCurrency(row.grandTotal) },
            {
              key: 'paidTotal',
              header: 'Pembayaran',
              render: (row) => {
                const paid = row.paidTotal || 0
                const isLunas = paid >= row.grandTotal && row.grandTotal > 0
                const isPartial = paid > 0 && paid < row.grandTotal
                return (
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs font-medium">{formatCurrency(paid)}</span>
                    <StatusBadge
                      label={isLunas ? 'Lunas' : isPartial ? 'Sebagian' : 'Belum Bayar'}
                      tone={isLunas ? 'success' : isPartial ? 'warning' : 'neutral'}
                    />
                  </div>
                )
              },
            },
            { key: 'status', header: t('common.status'), sortable: true, render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            {
              key: 'actions',
              header: t('common.actions'),
              render: (row) => <PurchaseCrudActions purchase={row} />,
            },
          ]}
          mobileRender={(row) => {
            const paid = row.paidTotal || 0
            const isLunas = paid >= row.grandTotal && row.grandTotal > 0
            const isPartial = paid > 0 && paid < row.grandTotal
            return (
              <div className="flex flex-col gap-3">
                <Link to={`/purchases/${row.id}`} className="flex flex-col gap-2 group">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium group-hover:underline text-primary">{row.code}</p>
                      <p className="text-sm text-muted-foreground">{row.supplierName} · {row.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge label={row.status} tone={tone(row.status)} />
                      <StatusBadge
                        label={isLunas ? 'Lunas' : isPartial ? 'Sebagian' : 'Belum Bayar'}
                        tone={isLunas ? 'success' : isPartial ? 'warning' : 'neutral'}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{formatCurrency(row.grandTotal)}</span>
                  </div>
                </Link>
                <div className="pt-2 border-t flex justify-end">
                  <PurchaseCrudActions purchase={row} />
                </div>
              </div>
            )
          }}
        />
      </ContentCard>
    </PageShell>
  )
}
