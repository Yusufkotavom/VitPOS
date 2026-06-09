import { Link } from "react-router-dom"
import { Button } from '@/components/ui/button'
import { useStockMovements } from '@/features/inventory/hooks/use-stock-movements'

export function InventoryAdjustmentActions() {
  return (
    <Button asChild>
      <Link to="/inventory/adjust">Adjustment Stok</Link>
    </Button>
  )
}

export function InventoryMovementHistory() {
  const movements = useStockMovements()

  return (
    <div className="space-y-2">
      {movements.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada pergerakan stok.</p>
      ) : (
        movements.map((movement) => (
          <div key={movement.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
            <div>
              <p className="font-medium">{movement.productName}</p>
              <p className="text-xs text-muted-foreground">{movement.type} · {movement.warehouseName}</p>
              {movement.notes ? <p className="text-xs text-muted-foreground">{movement.notes}</p> : null}
            </div>
            <div className="text-right">
              <p className={movement.qty >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{movement.qty >= 0 ? '+' : ''}{movement.qty}</p>
              <p className="text-xs text-muted-foreground">{new Date(movement.updatedAt).toLocaleString('id-ID')}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
