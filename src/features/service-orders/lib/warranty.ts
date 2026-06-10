import { addDays, addMonths, addYears, isBefore } from 'date-fns'

import type { WarrantyUnit } from '@/services/local-db/schema'

export function addWarrantyDuration(startDateIso: string, value: number, unit: WarrantyUnit) {
  const startDate = new Date(startDateIso)
  const nextDate = unit === 'hari'
    ? addDays(startDate, value)
    : unit === 'bulan'
      ? addMonths(startDate, value)
      : addYears(startDate, value)

  return nextDate.toISOString()
}

export function buildWarrantyTimelineNote(input: { value: number; unit: WarrantyUnit; mode: 'created' | 'activated' | 'updated' | 'removed'; endDate?: string }) {
  if (input.mode === 'removed') {
    return 'Garansi dihapus'
  }

  if (input.mode === 'created') {
    return `Garansi diatur ${input.value} ${input.unit}`
  }

  if (input.mode === 'updated') {
    return `Garansi diubah menjadi ${input.value} ${input.unit}`
  }

  return `Garansi aktif sampai ${new Date(input.endDate ?? '').toLocaleDateString('id-ID', { dateStyle: 'long' })}`
}

export function isWarrantyExpired(endDateIso?: string, now: Date = new Date()) {
  if (!endDateIso) {
    return false
  }

  return isBefore(new Date(endDateIso), now)
}
