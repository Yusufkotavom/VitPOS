import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'
import { CompanySettingsForm } from '@/features/settings/components/company-settings-form'

export function CompanySettingsPage() {
  return (
    <PageShell title="Profil Usaha" description="Ikon, logo, nama, alamat, dan legalitas usaha." backTo="/settings">
      <SettingsNav className="mb-6 hidden md:flex" />
      <CompanySettingsForm />
    </PageShell>
  )
}
