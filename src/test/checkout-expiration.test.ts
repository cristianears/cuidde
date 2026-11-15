import { describe, expect, it } from 'vitest'
import { markExpiredCheckout } from '../../supabase/functions/stripe-webhook/checkout-expiration'

function expirationStore(record: { id: string; subscription_status: string; stripe_subscription_id: string | null }) {
  let patch: Record<string, unknown>
  const fields = record as unknown as Record<string, unknown>
  const matches: Array<() => boolean> = []
  const query = {
    eq(field: string, value: string) { matches.push(() => fields[field] === value); return query },
    in(field: string, values: string[]) { matches.push(() => values.includes(fields[field] as string)); return query },
    async is(field: string, value: null) {
      matches.push(() => fields[field] === value)
      if (matches.every((match) => match())) {
        Object.assign(record, patch)
      }
      return { error: null }
    },
  }
  return { from: () => ({ update: (value: Record<string, unknown>) => { patch = value; return query } }) } as unknown as Parameters<typeof markExpiredCheckout>[0]
}

describe('abandoned checkout expiration', () => {
  it.each(['active', 'past_due', 'canceled'])('preserves a %s account when an older checkout expires', async (status) => {
    const family = { id: 'family-1', subscription_status: status, stripe_subscription_id: null }
    await markExpiredCheckout(expirationStore(family), family.id)
    expect(family.subscription_status).toBe(status)
  })
  it('preserves a subscription linked by another Stripe event', async () => {
    const family = { id: 'family-1', subscription_status: 'incomplete', stripe_subscription_id: 'sub_existing' }
    await markExpiredCheckout(expirationStore(family), family.id)
    expect(family).not.toHaveProperty('payment_failed_at')
  })
  it('marks only an unsubscribed free account as incomplete', async () => {
    const family = { id: 'family-1', subscription_status: 'free', stripe_subscription_id: null }
    await markExpiredCheckout(expirationStore(family), family.id)
    expect(family).toMatchObject({ subscription_status: 'incomplete', payment_failed_at: null })
  })
})
