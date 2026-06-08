import { Button } from '@/components/ui/button'
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

  return (
    <PageShell title="Stok & Gudang" description="Multi gudang, movement history, transfer, adjustment, dan stok kritis." actions={<Button>Adjustment Stok</Button>}>
      <ContentCard title="Stok per Gudang" description="Gunakan movement history, bukan angka stok mati saja.">
        <DataTable
          data={inventory}
          columns={[
            { key: 'product', header: 'Produk' },
            { key: 'warehouse', header: 'Gudang' },
            { key: 'stockSystem', header: 'Stok Sistem' },
            { key: 'stockSafe', header: 'Stok Aman' },
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
    </PageShell>
  )
}
