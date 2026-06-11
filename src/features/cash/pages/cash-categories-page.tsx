import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CashCategoryCrudActions } from '@/features/cash/components/cash-category-crud-actions'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

export function CashCategoriesPage() {
  const categories = useCashCategories()
  const [search, setSearch] = useState('')

  const filtered = categories.filter(row =>
    !search || [row.name, row.type].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell
      title="Kategori Kas"
      description="Kelola kategori pemasukan dan pengeluaran."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/cash">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
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
            placeholder="Cari kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <DataTable
          data={filtered}
          columns={[
            { key: 'name', header: 'Nama', sortable: true },
            { key: 'type', header: 'Tipe', render: (row) => (
              <StatusBadge label={row.type} tone={row.type === 'Pemasukan' ? 'success' : 'danger'} />
            )},
            { key: 'status', header: 'Status', render: (row) => (
              <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'neutral'} />
            )},
            { key: 'actions', header: 'Aksi', render: (row) => <CashCategoryCrudActions category={row} /> },
          ]}
          emptyTitle="Belum ada kategori"
        />
      </ContentCard>
    </PageShell>
  )
}
