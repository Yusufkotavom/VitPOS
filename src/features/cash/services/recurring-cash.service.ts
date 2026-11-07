import { dexieDb } from '@/services/local-db/dexie-instance'
import { recordCashJournal } from '@/services/accounting/accounting-integration'
import type { LocalCash } from '@/services/local-db/schema'

export interface RecurringCashTemplate {
  id: string
  tenantId: string
  name: string
  type: 'Pengeluaran' | 'Pemasukan'
  category: string
  account: string
  amount: number
  dueDay: number // 1 - 31 (day of month)
  notes?: string
  isActive: boolean
  lastExecutedMonth?: string // e.g. "2026-11"
  lastExecutedDate?: string // e.g. "2026-11-05"
  lastExecutedCashRef?: string // e.g. "KAS-012"
}

const SETTING_KEY = 'recurring-cash-templates'

export function getCurrentMonthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function isExecutedThisMonth(template: RecurringCashTemplate, targetMonth = getCurrentMonthKey()): boolean {
  return template.lastExecutedMonth === targetMonth
}

export function getDefaultRecurringPresets(tenantId: string): RecurringCashTemplate[] {
  return [
    {
      id: `rec-util-${tenantId}-1`,
      tenantId,
      name: 'Listrik & Air (PLN / PDAM)',
      type: 'Pengeluaran',
      category: 'Utilitas & Operasional',
      account: 'Kas Toko',
      amount: 450000,
      dueDay: 10,
      notes: 'Tagihan bulanan listrik toko dan air',
      isActive: true,
    },
    {
      id: `rec-net-${tenantId}-2`,
      tenantId,
      name: 'Internet & WiFi Toko',
      type: 'Pengeluaran',
      category: 'Biaya Komunikasi & WiFi',
      account: 'Bank BCA',
      amount: 375000,
      dueDay: 15,
      notes: 'Langganan internet / WiFi operasional kasir & POS',
      isActive: true,
    },
    {
      id: `rec-sal-${tenantId}-3`,
      tenantId,
      name: 'Gaji & Upah Karyawan Toko',
      type: 'Pengeluaran',
      category: 'Gaji & Upah',
      account: 'Bank BCA',
      amount: 2800000,
      dueDay: 25,
      notes: 'Gaji bulanan kasir dan staf toko',
      isActive: true,
    },
    {
      id: `rec-rent-${tenantId}-4`,
      tenantId,
      name: 'Biaya Sewa Kios / Tempat',
      type: 'Pengeluaran',
      category: 'Sewa Tempat',
      account: 'Bank BCA',
      amount: 1500000,
      dueDay: 1,
      notes: 'Iuran sewa bulanan tempat usaha',
      isActive: true,
    },
    {
      id: `rec-inc-${tenantId}-5`,
      tenantId,
      name: 'Pendapatan Sewa Rak / Titip Display',
      type: 'Pemasukan',
      category: 'Pendapatan Sewa Rak',
      account: 'Kas Toko',
      amount: 250000,
      dueDay: 5,
      notes: 'Pemasukan rutin sewa rak / slot display produk titipan',
      isActive: true,
    },
  ]
}

export async function getRecurringTemplates(tenantId: string): Promise<RecurringCashTemplate[]> {
  const setting = await dexieDb.settings
    .where('[tenantId+setting]')
    .equals([tenantId, SETTING_KEY])
    .first()

  if (!setting) {
    const defaults = getDefaultRecurringPresets(tenantId)
    await saveRecurringTemplates(tenantId, defaults)
    return defaults
  }

  try {
    const list = JSON.parse(setting.value) as RecurringCashTemplate[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function saveRecurringTemplates(
  tenantId: string,
  templates: RecurringCashTemplate[],
): Promise<void> {
  const now = new Date().toISOString()
  await dexieDb.settings.put({
    id: `setting-${tenantId}-${SETTING_KEY}`,
    tenantId,
    area: 'cash',
    setting: SETTING_KEY,
    value: JSON.stringify(templates),
    updatedAt: now,
    status: 'active',
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vitpos:db-mutate'))
  }
}

export async function addOrUpdateRecurringTemplate(
  tenantId: string,
  template: RecurringCashTemplate,
): Promise<void> {
  const current = await getRecurringTemplates(tenantId)
  const index = current.findIndex((t) => t.id === template.id)
  let updated: RecurringCashTemplate[]

  if (index >= 0) {
    updated = current.map((t, i) => (i === index ? template : t))
  } else {
    updated = [...current, template]
  }

  await saveRecurringTemplates(tenantId, updated)
}

export async function deleteRecurringTemplate(
  tenantId: string,
  templateId: string,
): Promise<void> {
  const current = await getRecurringTemplates(tenantId)
  const updated = current.filter((t) => t.id !== templateId)
  await saveRecurringTemplates(tenantId, updated)
}

export async function executeRecurringTransaction(
  tenantId: string,
  templateId: string,
  options?: {
    executionDate?: string
    amount?: number
    account?: string
    notes?: string
  },
): Promise<{ success: boolean; ref: string }> {
  const templates = await getRecurringTemplates(tenantId)
  const target = templates.find((t) => t.id === templateId)
  if (!target) throw new Error('Template transaksi rutin tidak ditemukan')

  const date = options?.executionDate || new Date().toISOString().slice(0, 10)
  const amount = options?.amount !== undefined ? options.amount : target.amount
  const account = options?.account || target.account
  const currentMonth = date.slice(0, 7) // YYYY-MM

  // Generate reference number: RUTIN-YYYYMM-XXX
  const allCash = await dexieDb.cash.where('tenantId').equals(tenantId).toArray()
  const monthTag = date.replace(/-/g, '').slice(0, 6) // YYYYMM
  const prefix = `RUT-${monthTag}-`
  const existingRefs = allCash.map((c) => c.ref).filter((r) => r.startsWith(prefix))
  const maxNum = existingRefs.reduce((max, r) => {
    const num = parseInt(r.replace(prefix, ''), 10)
    return !isNaN(num) && num > max ? num : max
  }, 0)
  const ref = `${prefix}${String(maxNum + 1).padStart(3, '0')}`

  const txId = `cash-rutin-${crypto.randomUUID()}`
  const cashRecord: LocalCash = {
    id: txId,
    tenantId,
    ref,
    date,
    account,
    category: target.category,
    income: target.type === 'Pemasukan' ? amount : 0,
    expense: target.type === 'Pengeluaran' ? amount : 0,
    status: 'Tercatat',
  }

  await dexieDb.cash.put(cashRecord)

  // Accounting double entry
  try {
    await recordCashJournal(
      tenantId,
      txId,
      amount,
      target.category,
      target.type,
      date,
    )
  } catch (jErr) {
    console.warn('[RecurringCash] recordCashJournal non-critical:', jErr)
  }

  // Update last execution metadata on template
  const updatedTemplates = templates.map((t) => {
    if (t.id === templateId) {
      return {
        ...t,
        lastExecutedMonth: currentMonth,
        lastExecutedDate: date,
        lastExecutedCashRef: ref,
      }
    }
    return t
  })

  await saveRecurringTemplates(tenantId, updatedTemplates)

  return { success: true, ref }
}

export async function executeAllPendingRecurring(
  tenantId: string,
  executionDate?: string,
): Promise<{ executedCount: number }> {
  const templates = await getRecurringTemplates(tenantId)
  const date = executionDate || new Date().toISOString().slice(0, 10)
  const currentMonth = date.slice(0, 7)

  const pending = templates.filter((t) => t.isActive && !isExecutedThisMonth(t, currentMonth))
  let executedCount = 0

  for (const t of pending) {
    try {
      await executeRecurringTransaction(tenantId, t.id, { executionDate: date })
      executedCount++
    } catch (err) {
      console.error(`Failed to execute recurring template ${t.name}:`, err)
    }
  }

  return { executedCount }
}
