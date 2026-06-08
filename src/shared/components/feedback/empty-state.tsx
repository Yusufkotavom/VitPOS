import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  actionLabel,
}: {
  title: string
  description: string
  actionLabel?: string
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel ? (
        <Button className="mt-4" variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
