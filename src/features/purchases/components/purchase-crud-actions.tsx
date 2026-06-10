import { PencilIcon, PlusIcon, Trash2Icon, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PurchaseForm } from '@/features/purchases/components/purchase-form'
import { receivePurchaseOrder, syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import { recordPurchasePayment } from '@/features/purchases/services/purchase-payment.service'
import { mapPurchaseFormToRecord, mapPurchaseRecordToFormValues, type PurchaseFormValues } from '@/features/purchases/schemas/purchase-form-schema'
import { localDb } from '@/services/local-db/client'
import { purchaseRepository } from '@/services/local-db/repository'
import { formatCurrency } from '@/lib/format-currency'
import type { LocalPurchase } from '@/services/local-db/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PurchaseCrudActions({ purchase }: { purchase?: LocalPurchase }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('transfer')
  const isEdit = Boolean(purchase)

  async function handleSubmit(values: PurchaseFormValues) {
    const id = purchase?.id ?? crypto.randomUUID()
    const tenantId = requireActiveTenantId()
    const supplierName = values.supplierName.trim()
    const supplier = supplierName
      ? await localDb.suppliers.where('[tenantId+name]').equals([tenantId, supplierName]).first()
      : undefined
    const tenantProducts = await localDb.products.where('tenantId').equals(tenantId).toArray()
    const mappedPurchase = mapPurchaseFormToRecord(values, id, purchase)
    const nextPurchase = {
      ...mappedPurchase,
      supplierId: supplier?.id,
      items: mappedPurchase.items.map((item) => ({
        ...item,
        productId: tenantProducts.find((product) => product.name.toLowerCase() === item.name.toLowerCase())?.id ?? item.productId,
      })),
    }
    await purchaseRepository.upsert(nextPurchase)
    await syncSupplierPurchaseMetrics(purchase?.supplierId)
    await syncSupplierPurchaseMetrics(nextPurchase.supplierId)
    toast.success(isEdit ? 'PO diperbarui' : 'PO dibuat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!purchase) return
    const supplierId = purchase.supplierId
    await purchaseRepository.remove(purchase.id)
    await syncSupplierPurchaseMetrics(supplierId)
    toast.success('PO dihapus')
    setDeleteOpen(false)
  }

  async function handleReceive() {
    if (!purchase) return
    await receivePurchaseOrder(purchase)
    toast.success('Barang diterima dan stok diperbarui')
  }

  async function handlePay() {
    if (!purchase || payAmount <= 0) return
    await recordPurchasePayment(purchase.id, payAmount, payMethod, 'Pembelian')
    toast.success('Pembayaran berhasil dicatat')
    setPayOpen(false)
    setPayAmount(0)
  }

  const remainingPay = purchase ? Math.max(0, purchase.grandTotal - (purchase.paidTotal ?? 0)) : 0

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {purchase ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat PO</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah purchase order' : 'Buat purchase order'}</SheetTitle>
            <SheetDescription>PO tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <PurchaseForm defaultValues={purchase ? mapPurchaseRecordToFormValues(purchase) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Buat PO'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {purchase ? (
        <>
          {purchase.status !== 'Diterima' && purchase.status !== 'Batal' ? <Button size="sm" onClick={handleReceive}>Terima Barang</Button> : null}
          {remainingPay > 0 && purchase.status === 'Diterima' ? <Button size="sm" onClick={() => { setPayAmount(remainingPay); setPayOpen(true) }}><CreditCard data-icon="inline-start" />Bayar</Button> : null}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus purchase order</DialogTitle>
                <DialogDescription>PO {purchase.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus PO</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Bayar ke Supplier</DialogTitle>
                <DialogDescription>PO {purchase?.code} - Sisa tagihan {formatCurrency(remainingPay)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium">Metode</label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih..." />
      </SelectTrigger>
      <SelectContent>
        
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="kartu">Kartu</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                  
      </SelectContent>
    </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nominal</label>
                  <Input
                    type="number"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                    className="mt-1 text-lg font-bold"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
                <Button onClick={handlePay} disabled={payAmount <= 0}>Bayar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
