import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { useProducts } from '@/features/products/hooks/use-products'
import { localDb } from '@/services/local-db/client'
import { inventoryAdjustmentService } from '@/features/inventory/services/inventory-adjustment.service'
import { FormSection } from '@/shared/components/forms/form-section'

const movementTypeOptions = ['adjustment', 'purchase', 'return', 'damage_lost', 'transfer_in', 'transfer_out'] as const

const adjustmentSchema = z.object({
  productId: z.string().trim().min(1, 'Pilih produk'),
  type: z.enum(movementTypeOptions),
  qty: z.string().trim().min(1, 'Jumlah wajib diisi'),
  warehouseName: z.string().trim().min(1, 'Nama gudang wajib diisi'),
  notes: z.string().trim().optional(),
})

type AdjustmentValues = z.infer<typeof adjustmentSchema>

const initialValues: AdjustmentValues = {
  productId: '',
  type: 'adjustment',
  qty: '0',
  warehouseName: 'Gudang Toko',
  notes: '',
}

export function useStockMovements() {
  return useLiveQuery(() => localDb.stockMovements.orderBy('updatedAt').reverse().limit(50).toArray(), [], [])
}

function AdjustmentForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (values: AdjustmentValues) => Promise<void>
}) {
  const products = useProducts()
  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    form.reset(initialValues)
  }, [form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Detail pergerakan" description="Pilih produk, tipe pergerakan, dan jumlah.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Produk
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('productId')}>
            <option value="">-- Pilih produk --</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          {errors.productId ? <span className="text-xs text-destructive">{errors.productId.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipe pergerakan
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('type')}>
            <option value="adjustment">Adjustment</option>
            <option value="purchase">Purchase (masuk)</option>
            <option value="return">Return (masuk)</option>
            <option value="transfer_in">Transfer in</option>
            <option value="transfer_out">Transfer out</option>
            <option value="damage_lost">Rusak / hilang</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Jumlah (positif = masuk, negatif = keluar)
          <Input inputMode="numeric" aria-invalid={Boolean(errors.qty)} {...form.register('qty')} placeholder="0" />
          {errors.qty ? <span className="text-xs text-destructive">{errors.qty.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Gudang
          <Input aria-invalid={Boolean(errors.warehouseName)} {...form.register('warehouseName')} placeholder="Gudang Toko" />
          {errors.warehouseName ? <span className="text-xs text-destructive">{errors.warehouseName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Catatan
          <Input {...form.register('notes')} placeholder="Opsional" />
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>Simpan pergerakan</Button>
      </div>
    </form>
  )
}

export function InventoryAdjustmentActions() {
  const [open, setOpen] = useState(false)
  const products = useProducts()

  async function handleSubmit(values: AdjustmentValues) {
    const product = products.find((candidate) => candidate.id === values.productId)
    if (!product) {
      toast.error('Produk tidak ditemukan')
      return
    }

    const qtyNumber = (() => {
      const parsed = Number(values.qty.replace(/[^0-9-]/g, ''))
      if (Number.isNaN(parsed)) return parseDigits(values.qty)
      return parsed
    })()

    try {
      const nextStock = await inventoryAdjustmentService.adjustStock(
        product,
        qtyNumber,
        values.type,
        values.warehouseName,
        values.notes
      )
      toast.success(`Stok ${product.name} diperbarui menjadi ${nextStock}`)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pergerakan')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Adjustment Stok</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Adjustment Stok</SheetTitle>
          <SheetDescription>Catat pergerakan stok (adjustment, purchase, return, transfer). Stok produk ikut diperbarui.</SheetDescription>
        </SheetHeader>
        <AdjustmentForm onCancel={() => setOpen(false)} onSubmit={handleSubmit} />
      </SheetContent>
    </Sheet>
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
