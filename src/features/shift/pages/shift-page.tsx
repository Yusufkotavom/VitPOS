import { Button } from '@/components/ui/button'
import { PageShell } from '@/shared/components/layout/page-shell'

export function ShiftPage() {
  return (
    <PageShell title="Shift Kasir" description="Buka shift, pantau kas berjalan, cocokkan expected cash, lalu tutup shift." actions={<Button>Buka Shift</Button>}>
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Shift open/close foundation</div>
      </div>
    </PageShell>
  )
}
