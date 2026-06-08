import { describe, expect, it } from 'vitest'

import { createCustomerId, createProductId } from '@/features/catalog/lib/entity-id'

describe('entity ids', () => {
  it('creates product ids as sync-safe uuids', () => {
    expect(createProductId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('creates customer ids as sync-safe uuids', () => {
    expect(createCustomerId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })
})
