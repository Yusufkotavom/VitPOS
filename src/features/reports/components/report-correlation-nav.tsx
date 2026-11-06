import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Link2 } from 'lucide-react'

export interface CorrelationLinkItem {
  to: string
  label: string
  hint?: string
}

export function ReportCorrelationNav({
  title = 'Korelasi Laporan',
  links,
}: {
  title?: string
  links: CorrelationLinkItem[]
}) {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  function getTargetUrl(targetPath: string) {
    const [path, queryString] = targetPath.split('?')
    const params = new URLSearchParams(queryString || '')

    // Keep active date range
    if (from && !params.has('from')) params.set('from', from)
    if (to && !params.has('to')) params.set('to', to)

    const search = params.toString()
    return search ? `${path}?${search}` : path
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link2 className="h-4 w-4 shrink-0 text-primary" />
        <span>{title}:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={getTargetUrl(link.to)}
            title={link.hint}
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary shadow-xs transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <span>{link.label}</span>
            {link.hint && (
              <span className="hidden text-[10px] text-muted-foreground group-hover:text-primary-foreground/80 md:inline">
                ({link.hint})
              </span>
            )}
            <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  )
}
