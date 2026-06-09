import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'
import { PageShell } from '@/shared/components/layout/page-shell'
import { RecipeCrudActions } from '@/features/recipes/components/recipe-crud-actions'
import { useRecipes } from '@/features/recipes/hooks/use-recipes'

export function RecipesPage() {
  const recipes = useRecipes()

  return (
    <PageShell title="Resep / BOM" description="Bill of material untuk produk jadi dan kebutuhan bahan baku." actions={<RecipeCrudActions />}>
      <ContentCard title="Daftar Resep" description="Setiap resep terikat ke tenant aktif dan produk jadi.">
        <DataTable
          data={recipes}
          emptyTitle="Belum ada resep"
          columns={[
            { key: 'name', header: 'Resep' },
            { key: 'productName', header: 'Produk Jadi' },
            { key: 'batchYield', header: 'Yield' },
            { key: 'items', header: 'Jumlah Bahan', render: (row) => row.items.length },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'warning'} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <RecipeCrudActions recipe={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.productName} · Yield {row.batchYield}</p>
                </div>
                <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'warning'} />
              </div>
              <p className="text-sm text-muted-foreground">{row.items.length} bahan</p>
              <RecipeCrudActions recipe={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
