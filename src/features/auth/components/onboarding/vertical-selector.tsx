import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { BusinessVerticalId, BusinessVerticalPlaybook } from '@/features/auth/data/business-playbooks'

type Props = {
  verticals: BusinessVerticalPlaybook[]
  selectedVertical: BusinessVerticalId
  onSelect: (value: BusinessVerticalId) => void
}

export function VerticalSelector({ verticals, selectedVertical, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {verticals.map((vertical) => (
        <Card
          key={vertical.id}
          role="button"
          tabIndex={0}
          className={selectedVertical === vertical.id ? 'cursor-pointer border-primary ring-1 ring-primary' : 'cursor-pointer'}
          onClick={() => onSelect(vertical.id)}
        >
          <CardHeader>
            <CardTitle>{vertical.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{vertical.description}</p>
            <div className="flex flex-wrap gap-2">
              {vertical.modes.map((mode) => (
                <Badge key={mode.id} variant="secondary">{mode.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
