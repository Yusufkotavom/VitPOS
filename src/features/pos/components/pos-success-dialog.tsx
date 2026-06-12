import { Printer, MessageCircle, Plus, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatCurrency } from '@/lib/format-currency'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'
import { Link } from 'react-router-dom'

export type PosSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PosOrderSummary | null
  detailRoute?: string
  onPrint: () => void
  onPrintSalesOrder?: () => void
  onWhatsApp: () => void
  onNewSale: () => void
}

export function PosSuccessDialog({
  open,
  onOpenChange,
  order,
  detailRoute,
  onPrint,
  onPrintSalesOrder,
  onWhatsApp,
  onNewSale,
}: PosSuccessDialogProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  if (!order) return null

  const Content = (
    <>
      <div className="my-6 space-y-4 rounded-xl border bg-muted/30 p-4 mx-4 md:mx-0">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('pos.order_id')}</span>
          <span className="font-mono font-medium">{order.code}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('pos.payment_method_label')}</span>
          <span className="capitalize">{order.paymentMethod}</span>
        </div>
        <div className="flex justify-between border-t pt-4">
          <span className="font-medium text-muted-foreground">{t('pos.total_paid')}</span>
          <span className="font-bold">{formatCurrency(order.total)}</span>
        </div>
        {order.change > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('pos.change_due')}</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(order.change)}</span>
          </div>
        )}
      </div>

      <div className="flex-col gap-2 flex w-full px-4 md:px-0 pb-4 md:pb-0">
        <div className="grid grid-cols-2 gap-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <Printer data-icon="inline-start" className="mr-2 h-4 w-4" />
                {t('pos.print_receipt')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={onPrint}>
                <Printer className="mr-2 h-4 w-4" />
                {t('pos.receipt_thermal')}
              </DropdownMenuItem>
              {onPrintSalesOrder && (
                <DropdownMenuItem onClick={onPrintSalesOrder}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('pos.sales_order_a4')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={onWhatsApp} className="w-full text-emerald-600 hover:text-emerald-700">
            <MessageCircle data-icon="inline-start" className="mr-2 h-4 w-4" />
            {t('pos.wa_share')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full mt-2">
          <Button variant="secondary" asChild className="w-full">
            <Link to={`${detailRoute || '/sales-orders'}/${order.id}`}>
              <FileText data-icon="inline-start" className="mr-2" />
              {t('pos.open_detail')}
            </Link>
          </Button>
          <Button variant="default" onClick={onNewSale} className="w-full">
            <Plus data-icon="inline-start" />
            {t('pos.new_sale')}
          </Button>
        </div>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('pos.payment_success_title')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('pos.payment_success_desc')}
            </DialogDescription>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center text-xl">{t('pos.payment_success_title')}</DrawerTitle>
          <DrawerDescription className="text-center">
            {t('pos.payment_success_desc')}
          </DrawerDescription>
        </DrawerHeader>
        {Content}
      </DrawerContent>
    </Drawer>
  )
}
