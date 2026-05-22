import { describe, expect, it } from 'vitest'
import { getSubscriptionCheckoutOutcome } from '@/lib/subscription-result'

describe('subscription checkout result', () => {
  it('treats failed upgrade payment as payment_failed even when the subscription was updated', () => {
    expect(getSubscriptionCheckoutOutcome({
      updated: true,
      payment_failed: true,
      plan: 'annual',
      current_period_end: '2027-05-19T22:53:31.000Z',
    })).toEqual({
      kind: 'payment_failed',
      plan: 'annual',
      current_period_end: '2027-05-19T22:53:31.000Z',
    })
  })

  it('keeps successful immediate updates as updated', () => {
    expect(getSubscriptionCheckoutOutcome({
      updated: true,
      plan: 'quarterly',
      current_period_end: '2026-08-19T22:53:31.000Z',
    })).toEqual({
      kind: 'updated',
      same_plan: false,
      plan: 'quarterly',
      current_period_end: '2026-08-19T22:53:31.000Z',
    })
  })
})
