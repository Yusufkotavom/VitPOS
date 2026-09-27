import { useTranslation } from 'react-i18next'
import { PencilIcon, PlusIcon, Trash2Icon, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PurchaseForm } from '@/features/purchases/components/purchase-form'
import { receivePurchaseOrder, syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import { recordPurchasePayment } from '@/features/purchases/services/purchase-payment.service'
import { generatePurchaseCode, mapPurchaseFormToRecord, mapPurchaseRecordToFormValues, type PurchaseFormValues } from '@/features/purchases/schemas/purchase-form-schema'
import { localDb } from '@/services/local-db/client'
import { purchaseRepository } from '@/services/local-db/repository'
import { formatCurrency } from '@/lib/format-currency'
import type { LocalPurchase } from '@/services/local-db/schema'

export function PurchaseCrudActions({ purchase }: { purchase?: LocalPurchase }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('transfer')
  const isEdit = Boolean(purchase)

  async function handleSubmit(values: PurchaseFormValues) {
    try {
      const id = purchase?.id ?? crypto.randomUUID()
      const tenantId = requireActiveTenantId()
      let code = values.code?.trim()
      if (!code) {
        code = await generatePurchaseCode()
      }
      const valuesWithCode = { ...values, code }
      const supplierName = valuesWithCode.supplierName.trim()
      const supplier = supplierName
        ? await localDb.suppliers.where('[tenantId+name]').equals([tenantId, supplierName]).first()
        : undefined
      const tenantProducts = await localDb.products.where('tenantId').equals(tenantId).toArray()
      const mappedPurchase = mapPurchaseFormToRecord(valuesWithCode, id, purchase)
      const nextPurchase = {
        ...mappedPurchase,
        supplierId: supplier?.id,
        items: mappedPurchase.items.map((item) => ({
          ...item,
          productId: item.productId || tenantProducts.find((product) => product.name.toLowerCase() === item.name.toLowerCase())?.id || '',
        })),
      }
      await purchaseRepository.upsert(nextPurchase)
      await syncSupplierPurchaseMetrics(purchase?.supplierId)
      await syncSupplierPurchaseMetrics(nextPurchase.supplierId)
      toast.success(isEdit ? t('purchases.updated') : t('purchases.created'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!purchase) return
    try {
      const supplierId = purchase.supplierId
      await purchaseRepository.remove(purchase.id)
      await syncSupplierPurchaseMetrics(supplierId)
      toast.success(t('purchases.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleReceive() {
    if (!purchase) return
    try {
      await receivePurchaseOrder(purchase)
      toast.success(t('purchases.received_and_stock_updated'))
    } catch (error) {
      toast.error(t('purchases.receive_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handlePay() {
    if (!purchase || payAmount <= 0) return
    try {
      await recordPurchasePayment(purchase.id, payAmount, payMethod, 'Pembelian')
      toast.success(t('purchases.payment_recorded'))
      setPayOpen(false)
      setPayAmount(0)
    } catch (error) {
      toast.error(t('common.payment_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  const remainingPay = purchase ? Math.max(0, purchase.grandTotal - (purchase.paidTotal ?? 0)) : 0

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {purchase ? (
            <Button variant="outline" size="sm">
              <PencilIcon data-icon="inline-start" />
              {t('common.edit')}
            </Button>
          ) : (
            <Button>
              <PlusIcon data-icon="inline-start" />
              {t('purchases.create')}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
          <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background/95 backdrop-blur-xs z-10">
            <DialogTitle className="text-xl font-bold">
              {isEdit ? t('purchases.edit_title') : t('purchases.create_title')}
            </DialogTitle>
            <DialogDescription>{t('purchases.form_sheet_description')}</DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            <PurchaseForm
              defaultValues={purchase ? mapPurchaseRecordToFormValues(purchase) : undefined}
              submitLabel={isEdit ? t('common.save_changes') : t('purchases.create')}
              onCancel={() => setFormOpen(false)}
              onSubmit={handleSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>
      {purchase ? (
        <>
          {purchase.status !== 'Diterima' && purchase.status !== 'Batal' ? <Button size="sm" onClick={handleReceive}>{t('purchases.receive_goods')}</Button> : null}
          {remainingPay > 0 && purchase.status === 'Diterima' ? <Button size="sm" onClick={() => { setPayAmount(remainingPay); setPayOpen(true) }}><CreditCard data-icon="inline-start" />{t('common.pay')}</Button> : null}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('purchases.delete_title')}</DialogTitle>
                <DialogDescription>{t('purchases.delete_description', { code: purchase.code })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('purchases.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{t('purchases.pay_supplier_title')}</DialogTitle>
                <DialogDescription>{t('purchases.pay_supplier_description', { code: purchase?.code, amount: formatCurrency(remainingPay) })}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium">{t('common.method')}</label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder={t('common.select_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tunai">{t('payment.method_cash')}</SelectItem>
                      <SelectItem value="transfer">{t('payment.method_transfer')}</SelectItem>
                      <SelectItem value="kartu">{t('payment.method_card')}</SelectItem>
                      <SelectItem value="qris">{t('payment.method_qris')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('common.amount')}</label>
                  <Input
                    type="number"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                    className="mt-1 text-lg font-bold"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handlePay} disabled={payAmount <= 0}>{t('common.pay')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
