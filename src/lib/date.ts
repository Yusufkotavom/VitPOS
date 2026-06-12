export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

export function formatDate(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateTime(value: string) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(d).replace(/\./g, ':')
  return `${datePart}, ${timePart}`
}
