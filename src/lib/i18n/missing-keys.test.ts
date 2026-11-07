import { describe, expect, it } from 'vitest'
import i18n from '@/lib/i18n/index'
import fs from 'node:fs'
import path from 'node:path'

describe('i18n translation coverage', () => {
  function flatten(obj: unknown, prefix = ''): Set<string> {
    const res = new Set<string>()
    if (!obj || typeof obj !== 'object') return res
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object') {
        for (const sub of flatten(v, full)) res.add(sub)
      } else {
        res.add(full)
      }
    }
    return res
  }

  const idTranslation = i18n.getResourceBundle('id', 'translation')
  const enTranslation = i18n.getResourceBundle('en', 'translation')
  const idKeys = flatten(idTranslation)
  const enKeys = flatten(enTranslation)

  function getAllFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
    let res: string[] = []
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name)
      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && item.name !== 'dist' && item.name !== '.git') {
          res = res.concat(getAllFiles(full, exts))
        }
      } else if (exts.some(ext => item.name.endsWith(ext))) {
        res.push(full)
      }
    }
    return res
  }

  it('verifies that both id and en have matching translation keys', () => {
    const inIdNotEn = [...idKeys].filter(k => !enKeys.has(k))
    const inEnNotId = [...enKeys].filter(k => !idKeys.has(k))
    expect(inIdNotEn).toEqual([])
    expect(inEnNotId).toEqual([])
  })

  it('verifies all t() calls across the codebase exist in both dictionaries', () => {
    const files = getAllFiles('src')
    const missingId = new Map<string, string[]>()
    const missingEn = new Map<string, string[]>()

    const tRegex = /\bt\(\s*[\x27\x22]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)[\x27\x22]/g

    for (const file of files) {
      if (file.includes('i18n/index.ts') || file.includes('.test.')) continue
      const src = fs.readFileSync(file, 'utf8')
      let match
      while ((match = tRegex.exec(src)) !== null) {
        const key = match[1]
        if (!idKeys.has(key)) {
          if (!missingId.has(key)) missingId.set(key, [])
          missingId.get(key)!.push(path.relative('src', file))
        }
        if (!enKeys.has(key)) {
          if (!missingEn.has(key)) missingEn.set(key, [])
          missingEn.get(key)!.push(path.relative('src', file))
        }
      }
    }

    expect(Array.from(missingId.keys())).toEqual([])
    expect(Array.from(missingEn.keys())).toEqual([])
  })
})
