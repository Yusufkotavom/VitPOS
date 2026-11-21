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

export function isJobOverdue(estimatedCompletion?: string, status?: string, now: Date = new Date()) {
  if (!estimatedCompletion) return false
  if (status === 'Selesai' || status === 'Diambil' || status === 'Batal') return false
  return isBefore(new Date(estimatedCompletion), now)
}

export interface ResolvedWarranty {
  hasWarranty: boolean
  warrantyValue?: number
  warrantyUnit?: WarrantyUnit
  warrantyStartDate?: string
  warrantyEndDate?: string
}

export function resolveServiceWarranty(order?: {
  hasWarranty?: boolean
  warrantyValue?: number
  warrantyUnit?: WarrantyUnit
  warrantyStartDate?: string
  warrantyEndDate?: string
  status?: string
  date?: string
  timeline?: {
    id?: string
    status?: string
    type?: string
    note?: string
    date?: string
    hasWarranty?: boolean
    warrantyValue?: number
    warrantyUnit?: WarrantyUnit
    warrantyStartDate?: string
    warrantyEndDate?: string
  }[]
}): ResolvedWarranty {
  if (!order) {
    return { hasWarranty: false }
  }

  let hasWarranty = Boolean(order.hasWarranty)
  let warrantyValue = order.warrantyValue
  let warrantyUnit = order.warrantyUnit ?? 'hari'
  let warrantyStartDate = order.warrantyStartDate
  let warrantyEndDate = order.warrantyEndDate

  // 1. If hasWarranty is false/undefined, check if warrantyValue > 0 or warrantyEndDate exists
  if (!hasWarranty && (Boolean(warrantyEndDate) || Boolean(warrantyValue && warrantyValue > 0))) {
    hasWarranty = true
  }

  // 2. Inspect timeline events for warranty information (especially recovered from server sync)
  if (Array.isArray(order.timeline) && order.timeline.length > 0) {
    const warrantyEvents = order.timeline.filter(
      (evt) => evt && (evt.type === 'warranty' || (typeof evt.note === 'string' && evt.note.toLowerCase().includes('garansi'))),
    )
    if (warrantyEvents.length > 0) {
      const latest = warrantyEvents[warrantyEvents.length - 1]
      const note = latest.note?.toLowerCase() ?? ''

      if (latest.hasWarranty === false || note.includes('dihapus') || note.includes('removed')) {
        hasWarranty = false
        warrantyEndDate = undefined
      } else {
        hasWarranty = true
        if (latest.warrantyValue && !warrantyValue) {
          warrantyValue = latest.warrantyValue
        }
        if (latest.warrantyUnit && !warrantyUnit) {
          warrantyUnit = latest.warrantyUnit
        }
        if (latest.warrantyStartDate && !warrantyStartDate) {
          warrantyStartDate = latest.warrantyStartDate
        }
        if (latest.warrantyEndDate && !warrantyEndDate) {
          warrantyEndDate = latest.warrantyEndDate
        }

        // Parse from note if still missing, e.g. "Garansi diatur 30 hari" or "Garansi diubah menjadi 30 hari"
        if (!warrantyValue) {
          const match = note.match(/(\d+)\s*(hari|bulan|tahun)/i)
          if (match) {
            warrantyValue = parseInt(match[1], 10)
            warrantyUnit = match[2].toLowerCase() as WarrantyUnit
          }
        }
      }
    }
  }

  // 3. Fallback: If hasWarranty is true, ensure default value and calculate endDate if status is Selesai / Diambil
  if (hasWarranty) {
    if (!warrantyValue || warrantyValue <= 0) {
      warrantyValue = 30
    }
    if (!warrantyUnit) {
      warrantyUnit = 'hari'
    }
    if (!warrantyStartDate) {
      warrantyStartDate = order.date || new Date().toISOString()
    }
    if (!warrantyEndDate && (order.status === 'Selesai' || order.status === 'Diambil')) {
      warrantyEndDate = addWarrantyDuration(warrantyStartDate, warrantyValue, warrantyUnit)
    }
  }

  return {
    hasWarranty,
    warrantyValue,
    warrantyUnit,
    warrantyStartDate,
    warrantyEndDate,
  }
}
