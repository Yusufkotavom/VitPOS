import { describe, expect, it } from 'vitest'

import { customerFormSchema, customerInitialValues, mapCustomerFormToRecord } from '@/features/customers/schemas/customer-form-schema'

describe('customerFormSchema', () => {
  it('rejects blank customer name', () => {
    const result = customerFormSchema.safeParse({
      ...customerInitialValues,
      name: ' ',
    })

    expect(result.success).toBe(false)
  })

  it('maps form values to local customer record', () => {
    const result = mapCustomerFormToRecord(
      {
        name: 'Toko Maju',
        phone: '08123456789',
        city: 'Bandung',
        receivable: '120000',
        orders: '8',
        status: 'Piutang',
      },
      'customer-1',
    )

    expect(result).toEqual({
      id: 'customer-1',
      name: 'Toko Maju',
      phone: '08123456789',
      city: 'Bandung',
      receivable: 'Rp 120.000',
      orders: '8 order',
      status: 'Piutang',
    })
  })
})
