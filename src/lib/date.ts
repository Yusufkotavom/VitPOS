export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

export const APP_TIME_ZONE = 'Asia/Jakarta'

export function toWibDateInput(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: APP_TIME_ZONE,
  }).format(d)
}

export function wibDateToIso(date: string): string {
  if (!date) return new Date().toISOString()
  return `${date.slice(0, 10)}T05:00:00.000Z`
}

export function formatDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  }).format(d)
}

export function formatDateTime(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : ''
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  }).format(d)
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(d).replace(/\./g, ':')
  return `${datePart}, ${timePart}`
}
