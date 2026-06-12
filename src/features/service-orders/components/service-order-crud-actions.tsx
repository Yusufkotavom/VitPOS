import { useTranslation } from 'react-i18next'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ServiceOrderForm } from '@/features/service-orders/components/service-order-form'
import { mapServiceOrderFormToRecord, mapServiceOrderRecordToFormValues, type ServiceOrderFormValues } from '@/features/service-orders/schemas/service-order-form-schema'
import { localDb } from '@/services/local-db/client'
import { serviceOrderRepository } from '@/services/local-db/repository'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export function ServiceOrderCrudActions({ order }: { order?: LocalServiceOrder }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleSubmit(values: ServiceOrderFormValues) {
    if (!order) return // Only used for editing now
    try {
      const tenantId = requireActiveTenantId()
      const customerName = values.customerName.trim()
      const customer = customerName
        ? await localDb.customers.where('[tenantId+name]').equals([tenantId, customerName]).first()
        : undefined
      await serviceOrderRepository.upsert({
        ...mapServiceOrderFormToRecord(values, order.id, order),
        customerId: customer?.id,
      })
      toast.success(t('service_orders.updated'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!order) return
    try {
      await serviceOrderRepository.remove(order.id)
      toast.success(t('service_orders.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  if (!order) {
    return (
      <Button asChild>
        <Link to="/service-orders/create">
          <PlusIcon data-icon="inline-start" className="mr-2 h-4 w-4" /> {t('service_orders.create')}
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" className="mr-2 h-4 w-4" />{t('common.edit')}</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t('service_orders.edit_title')}</SheetTitle>
            <SheetDescription>{t('service_orders.save_local_description')}</SheetDescription>
          </SheetHeader>
          <ServiceOrderForm defaultValues={mapServiceOrderRecordToFormValues(order)} submitLabel={t('common.save_changes')} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" className="mr-2 h-4 w-4" />{t('common.delete')}</Button>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('service_orders.delete_title')}</DialogTitle>
            <DialogDescription>{t('service_orders.delete_description', { code: order.code })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('service_orders.delete_confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
