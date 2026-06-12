import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const returnRows = useReturns()

  return (
    <PageShell title={t('returns.title') || 'Retur'} description={t('returns.page_description')} actions={<ReturnCrudActions />}>
      <ContentCard title={t('returns.list_title')} description={t('returns.list_description')}>
        <DataTable
          data={returnRows}
          emptyTitle={t('returns.empty')}
          columns={[
            { key: 'code', header: t('returns.code_header') },
            { key: 'type', header: t('common.type') },
            { key: 'referenceCode', header: t('returns.reference_header') },
            { key: 'date', header: t('common.date') },
            { key: 'total', header: t('common.total'), render: (row) => formatCurrency(row.total) },
            { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: t('common.actions'), render: (row) => <ReturnCrudActions ret={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.code}</p>
                  <p className="text-sm text-muted-foreground">{row.type} · {t('returns.reference_header')}: {row.referenceCode}</p>
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
