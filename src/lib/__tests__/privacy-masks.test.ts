import { describe, expect, it } from 'vitest'
import { maskPhoneBrazilian } from '@/lib/privacy-masks'

describe('privacy masks', () => {
  it('shows only the last four phone digits for professional references', () => {
    expect(maskPhoneBrazilian('(11) 98888-7766')).toBe('*****-7766')
  })
})
