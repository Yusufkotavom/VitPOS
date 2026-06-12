import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AppErrorDialog({ open, error, isRetrying, onOpenChange, onRetry }: { open: boolean; error: Error | null; isRetrying: boolean; onOpenChange: (open: boolean) => void; onRetry: () => void | Promise<void> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="size-5" /></div>
          <DialogTitle>Ada kendala memuat data</DialogTitle>
          <DialogDescription>Periksa koneksi, lalu coba muat ulang.{error?.message ? ` Detail: ${error.message}` : ''}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>Muat Ulang Aplikasi</Button>
          <Button type="button" onClick={() => void onRetry()} disabled={isRetrying}><RotateCcw className={`mr-2 size-4 ${isRetrying ? 'animate-spin' : ''}`} />{isRetrying ? 'Memuat ulang...' : 'Coba Lagi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
