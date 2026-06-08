import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'

export function PurchasesPage() {
  return (
    <PageShell title="Pembelian" description="Purchase order, penerimaan barang, dan hutang supplier.">
      <ContentCard title="Phase 2" description="Fondasi pembelian akan dibangun setelah MVP inti stabil.">
        <div className="text-sm text-muted-foreground">Screen placeholder pembelian.</div>
      </ContentCard>
    </PageShell>
  )
}
