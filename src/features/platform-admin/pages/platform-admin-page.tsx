import { PageShell } from '@/shared/components/layout/page-shell'
import { ContentCard } from '@/shared/components/display/content-card'

export function PlatformAdminPage() {
  return (
    <PageShell title="Platform Admin" description="Tenant, paket, langganan, billing, storage, dan sync health lintas bisnis.">
      <ContentCard title="Phase 2" description="Fondasi platform admin akan dibangun setelah MVP inti stabil.">
        <div className="text-sm text-muted-foreground">Screen placeholder platform admin.</div>
      </ContentCard>
    </PageShell>
  )
}
