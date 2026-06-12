import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const { t } = useTranslation()
  const supplierRows = useSuppliers()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = supplierRows.filter(row =>
    !search || [row.name, row.phone, row.city].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title={t('suppliers.title')} description={t('suppliers.page_description')} actions={<SupplierCrudActions />}>
      <ContentCard title={t('suppliers.list_title')} description={t('suppliers.list_description')}>
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder={t('suppliers.search_placeholder')}
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
                  <SelectItem value="Hutang">{t('suppliers.payable')}</SelectItem>
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
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title={t('common.card_view')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {view === 'list' ? (
          <DataTable
            data={filtered}
            columns={[
              { key: 'name', header: t('suppliers.supplier'), sortable: true },
              { key: 'phone', header: t('common.phone') },
              { key: 'city', header: t('common.address'), sortable: true },
              { key: 'payable', header: t('suppliers.payable'), sortable: true, render: (row) => <span className={row.payable > 0 ? 'font-medium text-rose-600' : ''}>{formatCurrency(row.payable)}</span> },
              { key: 'orders', header: t('common.order'), sortable: true, render: (row) => String(row.orders) },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
              { key: 'actions', header: t('common.actions'), render: (row) => <SupplierCrudActions supplier={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">{t('suppliers.empty')}</p>
            ) : (
              filtered.map((row) => (
                <div key={row.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-muted-foreground">{row.phone}</p>
                      <p className="text-xs text-muted-foreground">{row.city}</p>
                    </div>
                    <StatusBadge label={row.status} tone={tone(row.status)} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>{t('suppliers.payable')} <span className={row.payable > 0 ? 'font-semibold text-rose-600' : ''}>{formatCurrency(row.payable)}</span></span>
                    <span>{t('common.order_count', { count: row.orders })}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <SupplierCrudActions supplier={row} />
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
