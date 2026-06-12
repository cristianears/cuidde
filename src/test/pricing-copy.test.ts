import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('pricing copy', () => {
  it('shows monthly equivalent, savings and total on the landing page plans', () => {
    const source = read('src/components/Pricing.tsx')

    expect(source).toContain('price: "99"')
    expect(source).toContain('priceLabel: "/mês"')
    expect(source).toContain('priceDiscount: "22% de desconto"')
    expect(source).toContain('priceTotal: "total R$ 297"')
    expect(source).toContain('price: "83"')
    expect(source).toContain('priceDiscount: "35% de desconto"')
    expect(source).toContain('priceTotal: "total R$ 997"')
    expect(source).toContain('whitespace-nowrap')
  })

  it('shows monthly equivalent, savings and total on family billing plans', () => {
    const source = read('src/pages/family/FamilyBilling.tsx')

    expect(source).toContain('price: "R$ 99"')
    expect(source).toContain('priceDescription: "/mês"')
    expect(source).toContain('priceDiscount: "22% de desconto"')
    expect(source).toContain('priceTotal: "total R$ 297"')
    expect(source).toContain('price: "R$ 83"')
    expect(source).toContain('priceDiscount: "35% de desconto"')
    expect(source).toContain('priceTotal: "total R$ 997"')
    expect(source).toContain('whitespace-nowrap')
  })
})
