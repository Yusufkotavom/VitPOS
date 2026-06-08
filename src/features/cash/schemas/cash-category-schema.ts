import { z } from 'zod'

export const cashCategoryTypeOptions = ['Pemasukan', 'Pengeluaran'] as const

export const cashCategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi'),
  type: z.enum(cashCategoryTypeOptions),
  status: z.enum(['Aktif', 'Nonaktif']),
})

export type CashCategoryFormValues = z.infer<typeof cashCategoryFormSchema>

export const cashCategoryInitialValues: CashCategoryFormValues = {
  name: '',
  type: 'Pemasukan',
  status: 'Aktif',
}
