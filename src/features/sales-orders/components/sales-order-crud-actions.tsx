import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SalesOrderForm } from '@/features/sales-orders/components/sales-order-form'
import { deleteSalesOrder, syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import { mapSalesOrderFormToRecord, mapSalesOrderRecordToFormValues, type SalesOrderFormValues } from '@/features/sales-orders/schemas/sales-order-form-schema'
import { localDb } from '@/services/local-db/client'
import { salesOrderRepository } from '@/services/local-db/repository'
import type { LocalSalesOrder } from '@/services/local-db/schema'

export function SalesOrderCrudActions({ order }: { order?: LocalSalesOrder }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(order)

  async function handleSubmit(values: SalesOrderFormValues) {
    try {
      const id = order?.id ?? crypto.randomUUID()
      const tenantId = requireActiveTenantId()
      const customerName = values.customerName.trim()
      const existingCustomer = customerName
        ? await localDb.customers.where('[tenantId+name]').equals([tenantId, customerName]).first()
        : undefined
      const nextOrder = {
        ...mapSalesOrderFormToRecord(values, id, order),
        customerId: existingCustomer?.id,
      }
      await salesOrderRepository.upsert(nextOrder)
      await syncCustomerSalesMetrics(order?.customerId)
      await syncCustomerSalesMetrics(nextOrder.customerId)
      toast.success(t(isEdit ? 'sales_orders.updated' : 'sales_orders.created'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!order) return
    try {
      await deleteSalesOrder(order.id)
      toast.success(t('sales_orders.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {order
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button>
            : <Button><PlusIcon data-icon="inline-start" />{t('sales_orders.create')}</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t(isEdit ? 'sales_orders.edit_title' : 'sales_orders.create_title')}</SheetTitle>
            <SheetDescription>{t('sales_orders.form_sheet_description')}</SheetDescription>
          </SheetHeader>
          <SalesOrderForm
            defaultValues={order ? mapSalesOrderRecordToFormValues(order) : undefined}
            submitLabel={t(isEdit ? 'common.save_changes' : 'sales_orders.create')}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
      {order ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('sales_orders.delete_title')}</DialogTitle>
                <DialogDescription>{t('sales_orders.delete_description', { code: order.code })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('sales_orders.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
