import { type PropsWithChildren, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PageShell({ children, title, description, actions, backTo }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode; backTo?: string }>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {backTo && (
              <Link to={backTo} className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted active:bg-muted text-muted-foreground transition-colors lg:hidden">
                <ArrowLeft className="size-5" />
              </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          <p className={backTo ? "text-sm text-muted-foreground pl-10 lg:pl-0" : "text-sm text-muted-foreground"}>
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
