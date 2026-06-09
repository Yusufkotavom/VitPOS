import { formatCurrency } from '@/lib/format-currency'
import { InventoryAdjustmentActions, InventoryMovementHistory } from '@/features/inventory/components/inventory-adjustment-actions'
import { useInventory } from '@/features/inventory/hooks/use-inventory'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Aman') return 'success'
  if (status === 'Stok Rendah') return 'warning'
  return 'danger'
}

export function InventoryPage() {
  const inventory = useInventory()

  const totalItems = inventory.length
  const lowStockCount = inventory.filter((row) => row.status === 'Stok Rendah' || row.status === 'Habis').length

  return (
    <PageShell title="Stok & Gudang" description="Multi gudang, movement history, transfer, adjustment, dan stok kritis." actions={<InventoryAdjustmentActions />}>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total SKU tercatat</p>
          <p className="mt-2 text-2xl font-semibold">{totalItems}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Stok kritis</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{lowStockCount}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Nilai stok</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(inventory.reduce((sum, row) => sum + row.stockSystem * 1000, 0))}</p>
        </article>
      </section>
      <ContentCard title="Stok per Gudang" description="Pantau kuantitas stok barang di setiap gudang atau cabang secara aktual.">
        <DataTable
          data={inventory}
          columns={[
            { key: 'product', header: 'Produk' },
            { key: 'warehouse', header: 'Gudang' },
            { key: 'stockSystem', header: 'Stok Sistem', render: (row) => String(row.stockSystem) },
            { key: 'stockSafe', header: 'Stok Aman', render: (row) => String(row.stockSafe) },
            { key: 'movement', header: 'Movement Terakhir' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.product}</p>
              <p className="text-sm text-muted-foreground">{row.warehouse}</p>
              <div className="text-sm text-muted-foreground">{row.movement}</div>
              <div className="flex items-center justify-between text-sm"><span>{row.stockSystem}</span><span>{row.stockSafe}</span></div>
              <StatusBadge label={row.status} tone={tone(row.status)} />
            </div>
          )}
        />
      </ContentCard>
      <ContentCard title="Riwayat Pergerakan Stok" description="50 pergerakan terakhir dari semua tipe (sale, purchase, adjustment, transfer).">
        <InventoryMovementHistory />
      </ContentCard>
    </PageShell>
  )
}
