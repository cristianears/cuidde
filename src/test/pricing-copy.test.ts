import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('pricing copy', () => {
  it('shows monthly equivalent, savings and total on the landing page plans', () => {
    const source = read('src/components/Pricing.tsx')

    expect(source).toContain('price: "99/mês"')
    expect(source).toContain('priceLabel: " (Economize 22% • total R$ 297)"')
    expect(source).toContain('price: "83/mês"')
    expect(source).toContain('priceLabel: " (Economize 35% • total R$ 997)"')
  })

  it('shows monthly equivalent, savings and total on family billing plans', () => {
    const source = read('src/pages/family/FamilyBilling.tsx')

    expect(source).toContain('price: "R$ 99/mês"')
    expect(source).toContain('priceDescription: "(Economize 22% • total R$ 297)"')
    expect(source).toContain('price: "R$ 83/mês"')
    expect(source).toContain('priceDescription: "(Economize 35% • total R$ 997)"')
  })
})
