import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'

export function ReturnsPage() {
  return (
    <PageShell title="Retur" description="Retur penjualan dan pembelian beserta dampak refund dan stok.">
      <ContentCard title="Phase 2" description="Fondasi retur akan dibangun setelah MVP inti stabil.">
        <div className="text-sm text-muted-foreground">Screen placeholder retur.</div>
      </ContentCard>
    </PageShell>
  )
}
