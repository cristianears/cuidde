import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(path: string) {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('translation guard', () => {
  it('declares the app language as Brazilian Portuguese', () => {
    expect(read('index.html')).toContain('<html lang="pt-BR">')
  })

  it('marks the icuide wordmark as not translatable', () => {
    expect(read('src/components/shared/BrandMark.tsx')).toContain('translate="no"')
  })
})
