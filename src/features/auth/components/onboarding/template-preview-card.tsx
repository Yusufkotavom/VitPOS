import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TemplatePreviewCard({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{description}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className="font-medium text-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
