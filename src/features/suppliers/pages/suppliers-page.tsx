import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'

export function SuppliersPage() {
  return (
    <PageShell title="Supplier" description="Kontak supplier, hutang berjalan, payment history, dan aging list.">
      <ContentCard title="Phase 2" description="Fondasi supplier akan dibangun setelah MVP inti stabil.">
        <div className="text-sm text-muted-foreground">Screen placeholder supplier.</div>
      </ContentCard>
    </PageShell>
  )
}
