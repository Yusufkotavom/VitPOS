export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
