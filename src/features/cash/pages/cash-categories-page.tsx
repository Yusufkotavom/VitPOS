import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CashCategoryCrudActions } from '@/features/cash/components/cash-category-crud-actions'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

export function CashCategoriesPage() {
  const { t } = useTranslation()
  const categories = useCashCategories()
  const [search, setSearch] = useState('')

  const filtered = categories.filter(row =>
    !search || [row.name, row.type].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell
      title={t('cash.categories_title')}
      description={t('cash.categories_description')}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/cash">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <CashCategoryCrudActions />
        </>
      }
    >
      <ContentCard>
        <div className="mb-4 border-b pb-4">
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <DataTable
          data={filtered}
          columns={[
            { key: 'name', header: t('common.name'), sortable: true },
            { key: 'type', header: t('common.type'), render: (row) => (
              <StatusBadge label={row.type} tone={row.type === 'Pemasukan' ? 'success' : 'danger'} />
            )},
            { key: 'status', header: t('common.status'), render: (row) => (
              <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'neutral'} />
            )},
            { key: 'actions', header: t('common.actions'), render: (row) => <CashCategoryCrudActions category={row} /> },
          ]}
          emptyTitle={t('cash.categories_empty')}
        />
      </ContentCard>
    </PageShell>
  )
}
