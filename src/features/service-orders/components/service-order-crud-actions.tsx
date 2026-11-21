import { useTranslation } from 'react-i18next'
import { ExternalLink, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { serviceOrderRepository } from '@/services/local-db/repository'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export function ServiceOrderCrudActions({ order }: { order?: LocalServiceOrder }) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)

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
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="outline" size="sm" asChild>
        <Link to={`/service-orders/${order.id}`}>
          <ExternalLink data-icon="inline-start" className="mr-1.5 h-3.5 w-3.5" />
          {t('service_orders.open_order')}
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
        <Trash2Icon data-icon="inline-start" className="mr-1.5 h-3.5 w-3.5" />
        {t('common.delete')}
      </Button>
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
