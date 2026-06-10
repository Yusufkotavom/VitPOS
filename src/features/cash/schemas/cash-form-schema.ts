import { z } from 'zod'

import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import type { LocalCash } from '@/services/local-db/schema'

export const cashTypeOptions = ['Pemasukan', 'Pengeluaran'] as const
export const cashStatusOptions = ['Tercatat', 'Pending Sinkron', 'Butuh Review'] as const
export const cashAccountOptions = ['Kas Toko', 'Bank BCA', 'Bank Mandiri', 'Bank BRI'] as const

export const cashFormSchema = z.object({
  ref: z.string().trim(),
  date: z.string().trim().min(1, 'Tanggal wajib diisi'),
  account: z.string().trim().min(1, 'Akun kas wajib diisi'),
  category: z.string().trim().min(1, 'Kategori wajib diisi'),
  type: z.enum(cashTypeOptions),
  amount: z.string().trim().min(1, 'Nominal wajib diisi'),
  status: z.enum(cashStatusOptions),
})

export type CashFormValues = z.infer<typeof cashFormSchema>

export const cashInitialValues: CashFormValues = {
  ref: '',
  date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
  account: '',
  category: '',
  type: 'Pemasukan',
  amount: '0',
  status: 'Tercatat',
}

export function mapCashFormToRecord(values: CashFormValues, id: string): LocalCash {
  const parsedAmount = parseDigits(values.amount)
  return {
    id,
    tenantId: resolveTenantId(),
    ref: values.ref.trim(),
    date: values.date.trim(),
    account: values.account.trim(),
    category: values.category.trim(),
    income: values.type === 'Pemasukan' ? parsedAmount : 0,
    expense: values.type === 'Pengeluaran' ? parsedAmount : 0,
    status: values.status,
  }
}

export function mapCashRecordToFormValues(cash: LocalCash): CashFormValues {
  const isIncome = cash.income > 0
  return {
    ref: cash.ref,
    date: cash.date,
    account: cash.account,
    category: cash.category,
    type: isIncome ? 'Pemasukan' : 'Pengeluaran',
    amount: String(isIncome ? cash.income : cash.expense),
    status: cash.status === 'Tercatat' || cash.status === 'Pending Sinkron' || cash.status === 'Butuh Review'
      ? cash.status
      : 'Tercatat',
  }
}
