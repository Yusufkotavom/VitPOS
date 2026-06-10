import { InvoiceSettingsForm } from '@/features/settings/components/invoice-settings-form'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SettingsNav } from '@/features/settings/components/settings-nav'

export function InvoiceSettingsPage() {
  return (
    <PageShell title="Invoice & Struk" description="Atur prefix nomor invoice, term, serta header dan footer struk POS." backTo="/settings">
      <SettingsNav className="mb-6 hidden md:flex" />
      <InvoiceSettingsForm />
    </PageShell>
  )
}
