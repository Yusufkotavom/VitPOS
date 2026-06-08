import { Badge } from '@/components/ui/badge'

const toneMap = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
} as const

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof toneMap }) {
  return (
    <Badge variant="outline" className={toneMap[tone]}>
      {label}
    </Badge>
  )
}
