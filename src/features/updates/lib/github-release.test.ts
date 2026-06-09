import { describe, expect, it } from 'vitest'

import { isVersionNewer } from '@/features/updates/lib/github-release'

describe('github release update helpers', () => {
  it('detects newer semver versions', () => {
    expect(isVersionNewer('1.0.0', '1.0.1')).toBe(true)
    expect(isVersionNewer('1.2.0', '1.1.9')).toBe(false)
    expect(isVersionNewer('1.2.0', '1.2.0')).toBe(false)
  })
})
