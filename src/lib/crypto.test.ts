import { describe, expect, it } from 'vitest'

import { hashPassword } from '@/lib/crypto'

describe('crypto utilities', () => {
  it('hashes passwords consistently using SHA-256', async () => {
    const hash1 = await hashPassword('password123')
    const hash2 = await hashPassword('password123')
    const hash3 = await hashPassword('different')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/)
  })
})
