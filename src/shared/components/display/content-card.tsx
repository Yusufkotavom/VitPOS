import { type PropsWithChildren, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card className={cn('shadow-sm overflow-hidden', className)}>
      {(title || description || action) && (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="flex flex-wrap gap-2">{action}</div>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
