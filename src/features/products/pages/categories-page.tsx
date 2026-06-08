import { useState } from 'react'
import { LayoutGrid, List, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  const categoryRows = useCategories()
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')

  const filtered = categoryRows.filter(row =>
    !search || [row.name, row.description || ''].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell title="Kategori" description="Kelola kategori barang dan jasa." actions={<CategoryCrudActions />}>
      <ContentCard title="Daftar Kategori" description="Tampilkan kategori dalam bentuk table atau card.">
        <div className="mb-4 flex flex-row items-center gap-2 border-b pb-4">
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="relative flex items-center group shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col gap-2 rounded-md border bg-popover p-2 shadow-md z-10 w-48">
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <select className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="20">20 / halaman</option>
                <option value="50">50 / halaman</option>
                <option value="100">100 / halaman</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
              className="h-7 w-7"
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('card')}
              className="h-7 w-7"
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {view === 'list' ? (
          <DataTable
            data={filtered}
            columns={[
              { key: 'name', header: 'Nama', sortable: true },
              { key: 'description', header: 'Deskripsi', render: (row) => row.description || '-' },
              { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
              { key: 'actions', header: 'Aksi', render: (row) => <CategoryCrudActions category={row} /> },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 col-span-full">Belum ada kategori</p>
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
