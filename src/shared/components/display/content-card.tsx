import { type PropsWithChildren, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function ContentCard({
  title,
  description,
  action,
  children,
  className,
}: PropsWithChildren<{
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}>) {
  return (
    <section className={cn('rounded-2xl border bg-background p-5 shadow-sm', className)}>
      {title || description || action ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
