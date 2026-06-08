import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../../..')

function read(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

describe('POS mobile bottom actions', () => {
  it('does not anchor POS payment action at same bottom edge as mobile navigation', () => {
    const source = read('src/features/pos/pages/pos-page.tsx')

    expect(source).not.toContain('fixed inset-x-0 bottom-0 z-30')
  })
})
