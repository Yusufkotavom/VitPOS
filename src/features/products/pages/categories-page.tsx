import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryCrudActions } from '@/features/products/components/category-crud-actions'
import { useCategories } from '@/features/products/hooks/use-categories'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function statusTone(status: string) {
  if (status === 'Aktif') return 'success'
  return 'neutral'
}

export function CategoriesPage() {
  const { t } = useTranslation()
  const categoryRows = useCategories()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = categoryRows.filter(row =>
    !search || [row.name, row.description || ''].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title={t('categories.title')} description={t('categories.description')} actions={<CategoryCrudActions />}>
      <ContentCard title={t('categories.list')} description={t('categories.list_description')}>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder={t('categories.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">{t('common.active')}</SelectItem>
                  <SelectItem value="Nonaktif">{t('common.inactive')}</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.per_page', { count: 20 })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">{t('common.per_page', { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t('common.per_page', { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t('common.per_page', { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title={t('common.list_view')}
              aria-label={t('common.list_view')}
              aria-pressed={view === 'list'}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title={t('common.card_view')}
              aria-label={t('common.card_view')}
              aria-pressed={view === 'card'}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {view === 'list' ? (
          <DataTable
            data={filtered}
            columns={[
              { key: 'name', header: t('common.name'), sortable: true },
              { key: 'description', header: t('common.description'), render: (row) => row.description || '-' },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
              { key: 'actions', header: t('common.actions'), render: (row) => <CategoryCrudActions category={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">{t('categories.empty')}</p>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-muted-foreground">{row.description || '-'}</p>
                    </div>
                    <StatusBadge label={row.status} tone={statusTone(row.status)} />
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <CategoryCrudActions category={row} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
