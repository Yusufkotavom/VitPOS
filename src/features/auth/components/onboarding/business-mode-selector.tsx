import type { BusinessModeId, BusinessModePlaybook } from '@/features/auth/data/business-playbooks'

type Props = {
  modes: BusinessModePlaybook[]
  selectedMode: BusinessModeId
  onSelect: (value: BusinessModeId) => void
}

export function BusinessModeSelector({ modes, selectedMode, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={selectedMode === mode.id ? 'rounded-xl border border-primary bg-primary/5 p-4 text-left ring-1 ring-primary' : 'rounded-xl border p-4 text-left'}
          onClick={() => onSelect(mode.id)}
        >
          <div className="font-semibold">{mode.label}</div>
          <div className="mt-1 text-sm text-muted-foreground">{mode.description}</div>
        </button>
      ))}
    </div>
  )
}
