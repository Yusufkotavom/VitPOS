import { describe, expect, it } from 'vitest'

import { createCustomerId, createProductId } from '@/features/catalog/lib/entity-id'

describe('entity ids', () => {
  it('creates product ids with product prefix', () => {
    expect(createProductId()).toMatch(/^product-[0-9a-f-]{36}$/)
  })

  it('creates customer ids with customer prefix', () => {
    expect(createCustomerId()).toMatch(/^customer-[0-9a-f-]{36}$/)
  })
})
