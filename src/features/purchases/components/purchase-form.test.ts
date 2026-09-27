import { describe, expect, it } from 'vitest'
import { generatePurchaseCode, purchaseFormSchema } from '@/features/purchases/schemas/purchase-form-schema'

describe('Purchase form validation and auto code generation', () => {
  it('validates schema with empty code (auto-generate allowed)', () => {
    const validData = {
      code: '',
      supplierName: 'PT Maju Terus',
      date: '2026-09-27',
      status: 'Draft' as const,
      items: [{ productId: 'p1', name: 'Barang A', qty: '10', unitPrice: '5000' }],
    }
    const result = purchaseFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('generates a formatted PO code with date prefix', async () => {
    const code = await generatePurchaseCode()
    expect(code).toMatch(/^PO-\d{8}-\d{3}$/)
  })
})
