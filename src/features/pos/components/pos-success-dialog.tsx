import { Printer, MessageCircle, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'

export type PosSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PosOrderSummary | null
  onPrint: () => void
  onWhatsApp: () => void
  onNewSale: () => void
}

export function PosSuccessDialog({
  open,
  onOpenChange,
  order,
  onPrint,
  onWhatsApp,
  onNewSale,
}: PosSuccessDialogProps) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Pembayaran Berhasil</DialogTitle>
          <DialogDescription className="text-center">
            Transaksi selesai. Pesanan telah dicatat.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4 rounded-xl border bg-muted/30 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ID Pesanan</span>
            <span className="font-mono font-medium">{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Metode Bayar</span>
            <span className="capitalize">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between border-t pt-4">
            <span className="font-medium text-muted-foreground">Total Bayar</span>
            <span className="font-bold">{formatCurrency(order.total)}</span>
          </div>
          {order.change > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kembalian</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(order.change)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:justify-start">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" onClick={onPrint} className="w-full">
              <Printer data-icon="inline-start" />
              Cetak Struk
            </Button>
            <Button variant="outline" onClick={onWhatsApp} className="w-full text-emerald-600 hover:text-emerald-700">
              <MessageCircle data-icon="inline-start" />
              WhatsApp
            </Button>
          </div>
          <Button variant="default" onClick={onNewSale} className="w-full mt-2" size="lg">
            <Plus data-icon="inline-start" />
            Penjualan Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
