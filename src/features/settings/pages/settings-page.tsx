import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { CompanySettingsForm } from '@/features/settings/components/company-settings-form'

export function SettingsPage() {
  return (
    <PageShell title="Pengaturan Usaha" description="Profil usaha, legal, struk, invoice, cabang, gudang, role, dan template.">
      <SettingsNav className="mb-6" />
      <CompanySettingsForm />
    </PageShell>
  )
}
