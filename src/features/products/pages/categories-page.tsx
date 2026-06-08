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

  return (
    <PageShell title="Kategori Produk" description="Kelola daftar kategori untuk mengelompokkan produk Anda." actions={<CategoryCrudActions />}>
      <ContentCard>
        <DataTable
          columns={[
            { key: 'name', header: 'Nama Kategori' },
            { key: 'description', header: 'Deskripsi', render: (row) => row.description || '-' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <CategoryCrudActions category={row} /> },
          ]}
          data={categoryRows}
          emptyTitle="Belum ada kategori"
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.description || '-'}</p>
                </div>
                <StatusBadge label={row.status} tone={statusTone(row.status)} />
              </div>
              <CategoryCrudActions category={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
