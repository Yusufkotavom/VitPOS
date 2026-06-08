import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'

export function ServiceOrdersPage() {
  return (
    <PageShell title="Service Order" description="Kanban, timeline kerja, biaya, garansi, dan update WhatsApp.">
      <ContentCard title="Phase 2" description="Fondasi service order akan dibangun setelah MVP inti stabil.">
        <div className="text-sm text-muted-foreground">Screen placeholder service order.</div>
      </ContentCard>
    </PageShell>
  )
}
