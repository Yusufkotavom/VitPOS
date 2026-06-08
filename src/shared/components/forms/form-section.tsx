import { type PropsWithChildren, type ReactNode } from 'react'

import { ContentCard } from '@/shared/components/display/content-card'

export function FormSection({
  title,
  description,
  children,
  action,
}: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  return (
    <ContentCard title={title} description={description} action={action}>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </ContentCard>
  )
}
