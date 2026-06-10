import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { CompanySettingsForm } from '@/features/settings/components/company-settings-form'

export function SettingsPage() {
  return (
    <PageShell title="Profil Usaha" description="Ikon, logo, nama, alamat, dan legalitas usaha.">
      <SettingsNav className="mb-6" />
      <CompanySettingsForm />
    </PageShell>
  )
}
