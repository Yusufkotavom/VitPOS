import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format-currency'
import { PageShell } from '@/shared/components/layout/page-shell'
import { useShifts } from '@/features/shift/hooks/use-shifts'
import { shiftRepository } from '@/services/local-db/repository'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'

export function ShiftPage() {
  const shifts = useShifts()
  const currentShift = shifts.find((shift) => shift.status === 'open')
  const closedShifts = shifts.filter((shift) => shift.status === 'closed')

  async function openShift() {
    await shiftRepository.upsert({
      id: crypto.randomUUID(),
      cashierName: 'Kasir Aktif',
      startTime: new Date().toISOString(),
      startCash: 500000,
      status: 'open',
    })
  }

  async function closeShift() {
    if (!currentShift) return
    const expectedCash = currentShift.startCash
    const actualCash = currentShift.startCash
    await shiftRepository.upsert({
      ...currentShift,
      endTime: new Date().toISOString(),
      expectedCash,
      actualCash,
      difference: actualCash - expectedCash,
      status: 'closed',
    })
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
          ? <Button variant="destructive" onClick={closeShift}>Tutup Shift</Button>
          : <Button onClick={openShift}>Buka Shift</Button>
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
    </PageShell>
  )
}
