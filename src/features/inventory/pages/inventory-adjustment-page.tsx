import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { useProducts } from '@/features/products/hooks/use-products'
import { inventoryAdjustmentService } from '@/features/inventory/services/inventory-adjustment.service'
import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'
import type { LocalStockMovement, StockMovementType } from '@/services/local-db/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AdjustmentItem = {
  id: string // temporary random id for list
  productId: string
  productName: string
  qty: string
}

export function InventoryAdjustmentPage() {
  const navigate = useNavigate()
  const products = useProducts()
  
  const [type, setType] = useState<LocalStockMovement['type']>('adjustment')
  const [warehouseName, setWarehouseName] = useState('Gudang Utama')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<AdjustmentItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleAddProduct() {
    if (!selectedProductId) return
    const product = products.find(p => p.id === selectedProductId)
    if (!product) return

    // Prevent duplicate product in list
    if (items.some(item => item.productId === selectedProductId)) {
      toast.error('Produk sudah ada di daftar')
      return
    }

    setItems([...items, { id: crypto.randomUUID(), productId: product.id, productName: product.name, qty: '' }])
    setSelectedProductId('')
  }

  function handleRemoveItem(id: string) {
    setItems(items.filter(item => item.id !== id))
  }

  function handleUpdateQty(id: string, qty: string) {
    setItems(items.map(item => item.id === id ? { ...item, qty } : item))
  }

  function handlePreSubmit() {
    if (items.length === 0) {
      toast.error('Tambahkan minimal 1 produk')
      return
    }
    if (!warehouseName.trim()) {
      toast.error('Gudang wajib diisi')
      return
    }
    const hasInvalidQty = items.some(item => {
      const qtyNumber = Number(item.qty.replace(/[^0-9-]/g, ''))
      return Number.isNaN(qtyNumber) || qtyNumber === 0
    })
    if (hasInvalidQty) {
      toast.error('Pastikan semua jumlah pergerakan diisi dengan benar (tidak boleh 0)')
      return
    }
    setConfirmOpen(true)
  }

  async function executeSubmit() {
    setConfirmOpen(false)
    setIsSubmitting(true)
    try {
      let successCount = 0
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue

        const qtyNumber = Number(item.qty.replace(/[^0-9-]/g, ''))
        if (Number.isNaN(qtyNumber) || qtyNumber === 0) continue

        await inventoryAdjustmentService.adjustStock(
          product,
          qtyNumber,
          type,
          warehouseName,
          notes
        )
        successCount++
      }

      toast.success(`${successCount} produk berhasil disesuaikan stoknya`)
      navigate('/inventory')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate preview data for confirmation
  const previewData = items.map(item => {
    const product = products.find(p => p.id === item.productId)
    const oldStock = product?.stock ?? 0
    const qtyNumber = Number(item.qty.replace(/[^0-9-]/g, '')) || 0
    return {
      ...item,
      oldStock,
      qtyNumber,
      newStock: Math.max(0, oldStock + qtyNumber)
    }
  })

  return (
    <PageShell 
      title="Penyesuaian Stok" 
      description="Catat pergerakan stok (adjustment, penerimaan, dll) untuk banyak barang sekaligus."
      actions={<Button variant="outline" onClick={() => navigate('/inventory')}><ArrowLeft className="mr-2 size-4" /> Kembali</Button>}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <ContentCard title="Informasi Pergerakan" description="Tentukan tipe dan lokasi.">
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Tipe Pergerakan
                <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih..." />
      </SelectTrigger>
      <SelectContent>
        
                  <SelectItem value="adjustment">Adjustment (Penyesuaian)</SelectItem>
                  <SelectItem value="purchase">Purchase (Pembelian / Masuk)</SelectItem>
                  <SelectItem value="return">Return (Retur / Masuk)</SelectItem>
                  <SelectItem value="transfer_in">Transfer In (Masuk)</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out (Keluar)</SelectItem>
                  <SelectItem value="damage_lost">Rusak / Hilang (Keluar)</SelectItem>
                
      </SelectContent>
    </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Gudang Tujuan / Asal
                <Input value={warehouseName} onChange={e => setWarehouseName(e.target.value)} placeholder="Misal: Gudang Utama" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Catatan
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional" />
              </label>
            </div>
          </ContentCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <ContentCard title="Daftar Barang" description="Pilih barang yang akan disesuaikan stoknya.">
            <div className="flex gap-2 mb-6">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih..." />
      </SelectTrigger>
      <SelectContent>
        
                <SelectItem value="">-- Cari atau pilih produk --</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (Sisa: {p.stock})</SelectItem>
                ))}
              
      </SelectContent>
    </Select>
              <Button onClick={handleAddProduct} variant="secondary" className="shrink-0"><Plus className="mr-2 size-4" /> Tambah</Button>
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed text-muted-foreground text-sm">
                Belum ada produk yang dipilih.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-7">Produk</div>
                  <div className="col-span-4">Jumlah (+/-)</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-lg border">
                    <div className="col-span-7 font-medium text-sm truncate pr-2">
                      {item.productName}
                    </div>
                    <div className="col-span-4">
                      <Input 
                        type="number" 
                        value={item.qty} 
                        onChange={e => handleUpdateQty(item.id, e.target.value)} 
                        className="h-8"
                        placeholder="Contoh: 10 atau -5"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button onClick={handlePreSubmit} disabled={isSubmitting || items.length === 0}>
                <Save className="mr-2 size-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
              </Button>
            </div>
          </ContentCard>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penyesuaian Stok</DialogTitle>
            <DialogDescription>
              Mohon periksa kembali perubahan stok sebelum menyimpan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto mt-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
              <div className="col-span-5">Produk</div>
              <div className="col-span-2 text-right">Awal</div>
              <div className="col-span-3 text-right">Perubahan</div>
              <div className="col-span-2 text-right">Akhir</div>
            </div>
            <div className="divide-y">
              {previewData.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 py-3 text-sm items-center">
                  <div className="col-span-5 font-medium truncate">{item.productName}</div>
                  <div className="col-span-2 text-right">{item.oldStock}</div>
                  <div className={`col-span-3 text-right font-semibold ${item.qtyNumber > 0 ? 'text-emerald-600' : item.qtyNumber < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                    {item.qtyNumber > 0 ? '+' : ''}{item.qtyNumber}
                  </div>
                  <div className="col-span-2 text-right font-bold">{item.newStock}</div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Batal, Edit Lagi</Button>
            </DialogClose>
            <Button onClick={executeSubmit} disabled={isSubmitting}>Konfirmasi & Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
