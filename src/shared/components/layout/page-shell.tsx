import { type PropsWithChildren, type ReactNode } from 'react'

export function PageShell({ children, title, description, actions }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
