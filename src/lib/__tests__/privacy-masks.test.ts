import { describe, expect, it } from 'vitest'
import { formatReferencePhoneForFamily, maskPhoneBrazilian } from '@/lib/privacy-masks'

describe('privacy masks', () => {
  it('shows only the last four phone digits for professional references', () => {
    expect(maskPhoneBrazilian('(11) 98888-7766')).toBe('*****-7766')
  })

  it('respects the caregiver reference phone masking preference', () => {
    expect(formatReferencePhoneForFamily('(11) 98888-7766', true)).toBe('*****-7766')
    expect(formatReferencePhoneForFamily('(11) 98888-7766', false)).toBe('(11) 98888-7766')
  })
})
