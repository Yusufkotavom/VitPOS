import type { ReactNode } from 'react'

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  )
}

export function ReportMetricCard({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }) {
  const color = tone === 'positive' ? 'text-green-600' : tone === 'negative' ? 'text-red-600' : ''
  return (
    <article className="rounded-xl border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </article>
  )
}
