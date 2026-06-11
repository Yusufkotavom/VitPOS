import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useProducts } from '@/features/products/hooks/use-products'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { recipeRepository } from '@/services/local-db/repository'
import type { LocalRecipe } from '@/services/local-db/schema'

type FormItem = { id: string; productId: string; productName: string; qty: string; unit: string }

function initialItems(recipe?: LocalRecipe): FormItem[] {
  return recipe?.items.map((item) => ({ id: item.id, productId: item.productId, productName: item.productName, qty: String(item.qty), unit: item.unit }))
    ?? [{ id: crypto.randomUUID(), productId: '', productName: '', qty: '1', unit: 'pcs' }]
}

export function RecipeCrudActions({ recipe }: { recipe?: LocalRecipe }) {
  const products = useProducts()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(recipe?.name ?? '')
  const [productId, setProductId] = useState(recipe?.productId ?? '')
  const [batchYield, setBatchYield] = useState(String(recipe?.batchYield ?? 1))
  const [status, setStatus] = useState<LocalRecipe['status']>(recipe?.status ?? 'Draft')
  const [items, setItems] = useState<FormItem[]>(initialItems(recipe))

  function resetFormState(nextRecipe?: LocalRecipe) {
    setName(nextRecipe?.name ?? '')
    setProductId(nextRecipe?.productId ?? '')
    setBatchYield(String(nextRecipe?.batchYield ?? 1))
    setStatus(nextRecipe?.status ?? 'Draft')
    setItems(initialItems(nextRecipe))
  }

  async function handleSubmit() {
    const tenantId = resolveTenantId(recipe?.tenantId)
    const selectedProduct = products.find((product) => product.id === productId)
    if (!selectedProduct) return

    const nextRecipe: LocalRecipe = {
      id: recipe?.id ?? crypto.randomUUID(),
      tenantId,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      name: name.trim() || `Resep ${selectedProduct.name}`,
      batchYield: Number(batchYield) || 1,
      items: items
        .filter((item) => item.productId && item.productName)
        .map((item) => ({
          id: item.id,
          tenantId,
          recipeId: recipe?.id ?? 'pending',
          productId: item.productId,
          productName: item.productName,
          qty: Number(item.qty) || 0,
          unit: item.unit.trim() || 'pcs',
        })),
      status,
      updatedAt: new Date().toISOString(),
    }

    nextRecipe.items = nextRecipe.items.map((item) => ({ ...item, recipeId: nextRecipe.id }))
    try {
      await recipeRepository.upsert(nextRecipe)
      setFormOpen(false)
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!recipe) return
    try {
      await recipeRepository.remove(recipe.id)
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={(open) => {
        setFormOpen(open)
        if (open) {
          resetFormState(recipe)
        }
      }}>
        <SheetTrigger asChild>
          {recipe ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat Resep</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{recipe ? 'Ubah resep' : 'Buat resep baru'}</SheetTitle>
            <SheetDescription>Resep/BOM untuk produk jadi dan bahan baku.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Produk jadi
              <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}>
                <option value="">Pilih produk</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nama resep
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Resep Es Kopi Susu" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Hasil batch
              <Input inputMode="numeric" value={batchYield} onChange={(event) => setBatchYield(event.target.value)} placeholder="1" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Status
              <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={status} onChange={(event) => setStatus(event.target.value as LocalRecipe['status'])}>
                <option value="Draft">Draft</option>
                <option value="Aktif">Aktif</option>
              </select>
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Bahan</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { id: crypto.randomUUID(), productId: '', productName: '', qty: '1', unit: 'pcs' }])}>+ Tambah bahan</Button>
              </div>
              {items.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_90px_90px_auto]">
                  <select
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    value={item.productId}
                    onChange={(event) => {
                      const product = products.find((candidate) => candidate.id === event.target.value)
                      setItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, productId: event.target.value, productName: product?.name ?? '' } : row))
                    }}
                  >
                    <option value="">Pilih bahan</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                  <Input inputMode="numeric" value={item.qty} onChange={(event) => setItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, qty: event.target.value } : row))} placeholder="Qty" />
                  <Input value={item.unit} onChange={(event) => setItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, unit: event.target.value } : row))} placeholder="Unit" />
                  {items.length > 1 ? <Button type="button" variant="ghost" size="sm" onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2Icon /></Button> : null}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="button" onClick={handleSubmit}>Simpan Resep</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {recipe ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus resep</DialogTitle>
              <DialogDescription>Resep {recipe.name} akan dihapus dari database lokal.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleDelete}>Hapus resep</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
