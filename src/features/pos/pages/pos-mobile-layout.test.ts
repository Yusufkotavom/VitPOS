import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../../..')

function read(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

describe('POS mobile bottom actions', () => {
  it('anchors mobile footer as fixed bottom action bar', () => {
    const source = read('src/features/pos/pages/pos-page.tsx')

    expect(source).toContain('fixed inset-x-0 bottom-0 z-30')
    expect(source).toContain('pb-[calc(5.5rem+env(safe-area-inset-bottom))]')
  })
})
