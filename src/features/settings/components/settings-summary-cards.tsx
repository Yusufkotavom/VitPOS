import { settingRows } from '@/features/settings/mocks/settings.mock'

export function SettingsSummaryCards() {
  const completeCount = settingRows.filter((setting) => setting.status === 'Lengkap').length
  const incompleteCount = settingRows.filter((setting) => setting.status !== 'Lengkap').length

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Section setting</p>
        <p className="mt-2 text-2xl font-semibold">{settingRows.length}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Lengkap</p>
        <p className="mt-2 text-2xl font-semibold">{completeCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Perlu dilengkapi</p>
        <p className="mt-2 text-2xl font-semibold">{incompleteCount}</p>
      </article>
    </section>
  )
}
