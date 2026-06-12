import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { formatCurrency } from '@/lib/format-currency'
import { PageShell } from '@/shared/components/layout/page-shell'
import { useShifts } from '@/features/shift/hooks/use-shifts'
import { shiftRepository } from '@/services/local-db/repository'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { localDb } from '@/services/local-db/client'
import type { LocalPayment } from '@/services/local-db/schema'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ShiftPage() {
  const shifts = useShifts()
  const currentShift = shifts.find((shift) => shift.status === 'open')
  const closedShifts = shifts.filter((shift) => shift.status === 'closed')
  const queryClient = useQueryClient()

  const [isOpenerOpen, setOpenerOpen] = useState(false)
  const [isCloserOpen, setCloserOpen] = useState(false)
  const [startCash, setStartCash] = useState('')
  const [actualCash, setActualCash] = useState('')

  // Calculate expected cash dynamically
  const { data: expectedCash = currentShift?.startCash ?? 0 } = useQuery({
    queryKey: ['expectedCash', currentShift?.id, currentShift?.startCash],
    queryFn: async () => {
      if (!currentShift) return 0
      const payments = await localDb.payments.where('shiftId').equals(currentShift.id).toArray()
      // For now, assume all Tunai payments add to cash
      const cashPayments = payments.filter((p: LocalPayment) => p.method === 'tunai' && p.status !== 'Gagal' && p.status !== 'Pending')
      const totalCashIncome = cashPayments.reduce((sum: number, p: LocalPayment) => sum + p.amount, 0)
      
      // Phase 2 will deduct expenses here
      return currentShift.startCash + totalCashIncome
    },
    enabled: !!currentShift,
  })

  async function openShift() {
    if (!startCash) return toast.error('Modal awal harus diisi')
    try {
      await shiftRepository.upsert({
        id: crypto.randomUUID(),
        tenantId: resolveTenantId(),
        cashierName: 'Kasir Aktif',
        startTime: new Date().toISOString(),
        startCash: parseFloat(startCash),
        status: 'open',
      })
      toast.success('Shift berhasil dibuka')
      setOpenerOpen(false)
      setStartCash('')
      await queryClient.invalidateQueries({ queryKey: ['shifts'] })
      await queryClient.invalidateQueries({ queryKey: ['active-shift'] })
    } catch (error) {
      toast.error(`Gagal buka shift: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function closeShift() {
    if (!currentShift) return
    if (!actualCash) return toast.error('Uang riil di laci harus diisi')
    try {
      const actual = parseFloat(actualCash)
      await shiftRepository.upsert({
        ...currentShift,
        endTime: new Date().toISOString(),
        expectedCash,
        actualCash: actual,
        difference: actual - expectedCash,
        status: 'closed',
      })
      toast.success('Shift berhasil ditutup')
      setCloserOpen(false)
      setActualCash('')
      await queryClient.invalidateQueries({ queryKey: ['shifts'] })
      await queryClient.invalidateQueries({ queryKey: ['active-shift'] })
    } catch (error) {
      toast.error(`Gagal tutup shift: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  const totalExpected = closedShifts.reduce((sum, shift) => sum + (shift.expectedCash ?? 0), 0)
  const totalActual = closedShifts.reduce((sum, shift) => sum + (shift.actualCash ?? 0), 0)
  const totalDifference = totalActual - totalExpected
  const balancedCount = closedShifts.filter((shift) => (shift.difference ?? 0) === 0).length

  return (
    <PageShell
      title="Shift Kasir"
      description="Buka shift, pantau kas berjalan, cocokkan expected cash, lalu tutup shift."
      actions={
        currentShift
          ? <Button variant="destructive" onClick={() => setCloserOpen(true)}>Tutup Shift</Button>
          : <Button onClick={() => setOpenerOpen(true)}>Buka Shift</Button>
      }
    >
      <section className="grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Shift terbuka</p>
          <p className="mt-2 text-2xl font-semibold">{currentShift ? 1 : 0}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Shift ditutup</p>
          <p className="mt-2 text-2xl font-semibold">{closedShifts.length}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Selisih total</p>
          <p className={`mt-2 text-2xl font-semibold ${totalDifference === 0 ? '' : 'text-rose-600'}`}>{formatCurrency(totalDifference)}</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Shift balance</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{balancedCount}/{closedShifts.length || 1}</p>
        </article>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Status Shift Saat Ini</h2>
          {currentShift ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Waktu Buka</span>
                <span className="font-medium">{new Date(currentShift.startTime).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Kas Awal</span>
                <span className="font-medium">{formatCurrency(currentShift.startCash)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Kasir Aktif</span>
                <span className="font-medium">{currentShift.cashierName}</span>
              </div>
              <StatusBadge label="Shift Terbuka" tone="success" />
            </div>
          ) : (
            <EmptyState title="Tidak Ada Shift Aktif" description="Klik Buka Shift untuk memulai transaksi." />
          )}
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Riwayat Shift</h2>
          {closedShifts.length === 0 ? (
            <EmptyState title="Belum Ada Riwayat" description="Riwayat shift yang ditutup akan muncul di sini." />
          ) : (
            <div className="space-y-3">
              {closedShifts.map((shift) => {
                const diff = shift.difference ?? 0
                return (
                  <div key={shift.id} className="rounded-xl border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{new Date(shift.startTime).toLocaleString('id-ID')}</p>
                      <StatusBadge label="Ditutup" tone={diff === 0 ? 'success' : 'warning'} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p>Expected</p>
                        <p className="font-medium text-foreground">{formatCurrency(shift.expectedCash ?? 0)}</p>
                      </div>
                      <div>
                        <p>Actual</p>
                        <p className="font-medium text-foreground">{formatCurrency(shift.actualCash ?? 0)}</p>
                      </div>
                      <div>
                        <p>Selisih</p>
                        <p className={`font-semibold ${diff === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(diff)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOpenerOpen} onOpenChange={setOpenerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Shift Kasir</DialogTitle>
            <DialogDescription>Masukkan modal uang kasir (Start Cash) sebelum mulai transaksi.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Modal Awal Kasir (Rp)</Label>
              <Input
                type="number"
                value={startCash}
                onChange={(e) => setStartCash(e.target.value)}
                placeholder="Contoh: 500000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenerOpen(false)}>Batal</Button>
            <Button onClick={openShift}>Buka Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloserOpen} onOpenChange={setCloserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift Kasir</DialogTitle>
            <DialogDescription>Masukkan uang fisik yang ada di laci (Actual Cash).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Estimasi Kas Sistem (Expected)</Label>
              <Input
                type="text"
                disabled
                value={formatCurrency(expectedCash)}
              />
            </div>
            <div className="space-y-2">
              <Label>Uang Fisik di Laci (Actual) (Rp)</Label>
              <Input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Masukkan jumlah riil"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloserOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={closeShift}>Konfirmasi Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
