import { SettingCrudActions } from '@/features/settings/components/setting-crud-actions'
import { SettingsSummaryCards } from '@/features/settings/components/settings-summary-cards'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Lengkap') return 'success'
  if (status === 'Belum Lengkap') return 'warning'
  return 'neutral'
}

export function SettingsPage() {
  const settingRows = useSettings()

  return (
    <PageShell title="Pengaturan Usaha" description="Profil usaha, legal, struk, invoice, cabang, gudang, role, dan template." actions={<SettingCrudActions />}>
      <SettingsSummaryCards />
      <ContentCard title="Section Pengaturan" description="Form panjang dipecah per section agar admin tidak lelah.">
        <DataTable
          data={settingRows}
          columns={[
            { key: 'area', header: 'Area' },
            { key: 'setting', header: 'Pengaturan' },
            { key: 'value', header: 'Nilai Saat Ini' },
            { key: 'updatedAt', header: 'Update Terakhir' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <SettingCrudActions setting={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.area}</p>
                  <p className="text-sm text-muted-foreground">{row.setting}</p>
                </div>
                <StatusBadge label={row.status} tone={tone(row.status)} />
              </div>
              <p className="text-sm">{row.value}</p>
              <SettingCrudActions setting={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
