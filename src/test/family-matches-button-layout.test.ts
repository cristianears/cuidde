import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../pages/family/FamilyMatches.tsx'), 'utf8')

describe('FamilyMatches button layout', () => {
  it('mantem o botao acessar atendimento compacto no desktop', () => {
    expect(source).toContain('sm:flex-row sm:items-center')
    expect(source).toContain('sm:w-auto')
    expect(source).not.toContain('grid grid-cols-[1fr_auto] gap-2 pt-1')
  })
})
