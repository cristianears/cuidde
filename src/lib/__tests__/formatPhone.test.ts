import { describe, it, expect } from 'vitest'
import { formatPhone } from '../formatters'

describe('formatPhone', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('')
  })

  it('returns digits only for 1-2 digits', () => {
    expect(formatPhone('1')).toBe('1')
    expect(formatPhone('11')).toBe('11')
  })

  it('adds DDD parentheses for 3+ digits', () => {
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('11999')).toBe('(11) 999')
  })

  it('formats partial numbers correctly', () => {
    expect(formatPhone('1199999')).toBe('(11) 99999')
  })

  it('formats full 11-digit phone with mask', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })

  it('strips non-digit characters', () => {
    expect(formatPhone('(11) 99999-8888')).toBe('(11) 99999-8888')
  })

  it('limits to 11 digits', () => {
    expect(formatPhone('119999988889999')).toBe('(11) 99999-8888')
  })

  it('handles 10-digit landline numbers', () => {
    expect(formatPhone('1133334444')).toBe('(11) 33334-444')
  })

  it('strips letters and special chars', () => {
    expect(formatPhone('abc11def99999ghi8888')).toBe('(11) 99999-8888')
  })
})
