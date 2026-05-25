import { describe, expect, it } from 'vitest'
import { getInvoicePlanLabel, inferInvoicePlanFromAmount } from '@/lib/invoice-plan'

describe('invoice plan labels', () => {
  it('uses the stored plan when it exists', () => {
    expect(getInvoicePlanLabel('quarterly', 170.14)).toBe('Trimestral')
  })

  it('infers the monthly plan for legacy invoices saved without plan', () => {
    expect(inferInvoicePlanFromAmount(127)).toBe('monthly')
    expect(getInvoicePlanLabel(null, 127)).toBe('Mensal')
  })

  it('keeps unknown prorated invoices without a guessed plan', () => {
    expect(inferInvoicePlanFromAmount(170.14)).toBeNull()
    expect(getInvoicePlanLabel(null, 170.14)).toBe('—')
  })
})
