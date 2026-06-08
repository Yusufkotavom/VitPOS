export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-sm text-muted-foreground">
      {label}
    </div>
  )
}
