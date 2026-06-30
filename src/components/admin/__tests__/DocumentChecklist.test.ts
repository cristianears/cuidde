import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../DocumentChecklist.tsx'), 'utf8')

describe('DocumentChecklist', () => {
  it('lists every caregiver document type for admin review', () => {
    expect(source).toContain('rg_cnh')
    expect(source).toContain('curriculo')
    expect(source).toContain('certificacao')
    expect(source).toContain('antecedentes')
  })

  it('uses ilegivel copy instead of rejected copy in admin document status', () => {
    expect(source).toContain('Ilegível')
    expect(source).not.toContain('Reprovado')
  })
})
