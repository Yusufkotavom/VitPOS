import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/features/auth/stores/auth-store'

type Props = {
  open: boolean
  status: string
  planName: string
  planValidUntil: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return '-'
  }
}

function formatStatusLabel(status: string) {
  switch (status) {
    case 'trial': return 'Trial berakhir'
    case 'past_due': return 'Tagihan tertunggak'
    case 'suspended': return 'Ditangguhkan'
    case 'cancelled': return 'Dibatalkan'
    default: return status
  }
}

export function SubscriptionExpiredDialog({ open, status, planName, planValidUntil }: Props) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  function goToBilling() {
    navigate('/settings/billing')
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Dialog open={open} onOpenChange={() => { /* force button interaction */ }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <DialogTitle className="text-center">Langganan Anda telah berakhir</DialogTitle>
          <DialogDescription className="text-center">
            Akses ke fitur operasional diblokir hingga langganan diperpanjang. Data Anda tetap aman.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Paket</p>
            <p className="font-medium">{planName}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">{formatStatusLabel(status)}</p>
          </div>
          <div className="col-span-2 rounded-lg border p-3">
            <p className="text-muted-foreground">Berlaku sampai</p>
            <p className="font-medium">{formatDate(planValidUntil)}</p>
          </div>
        </div>
        <DialogFooter className="sm:justify-stretch sm:gap-2">
          <Button variant="outline" onClick={handleLogout} className="sm:w-full">Logout</Button>
          <Button onClick={goToBilling} className="sm:w-full">Kelola Langganan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
