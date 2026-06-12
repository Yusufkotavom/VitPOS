import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function SetupReviewPanel({ title, items, onEdit }: { title: string; items: Array<{ label: string; value: string }>; onEdit?: () => void }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-medium">{title}</h4>
        {onEdit ? <Button type="button" variant="outline" size="sm" onClick={onEdit}>Ubah</Button> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item.label} variant="secondary" className="gap-2">
            <span>{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </Badge>
        ))}
      </div>
    </div>
  )
}
