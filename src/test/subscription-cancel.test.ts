import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const edgeFunctionSource = read('supabase/functions/create-checkout/index.ts')
const hookSource = read('src/hooks/useSubscription.ts')

describe('subscription cancellation regressions', () => {
  it('releases Stripe schedules before canceling or reactivating a subscription', () => {
    expect(edgeFunctionSource).toContain('releaseSubscriptionSchedule')
    expect(edgeFunctionSource).toContain('stripe.subscriptions.retrieve(profile.stripe_subscription_id)')
    expect(edgeFunctionSource).toContain('stripe.subscriptionSchedules.release(scheduleId)')
    expect(edgeFunctionSource).toContain("action === 'cancel_subscription'")
    expect(edgeFunctionSource).toContain("action === 'reactivate_subscription'")
  })

  it('clears pending plan state when cancellation state changes', () => {
    expect(edgeFunctionSource).toContain('cancel_at_period_end: true, pending_plan: null')
    expect(edgeFunctionSource).toContain('cancel_at_period_end: false, pending_plan: null')
    expect(hookSource).toContain('cancel_at_period_end: true, pending_plan: null')
    expect(hookSource).toContain('cancel_at_period_end: false, pending_plan: null')
  })

  it('returns JSON errors instead of leaving Stripe failures as opaque function crashes', () => {
    expect(edgeFunctionSource).toContain("console.error('cancel_subscription_error'")
    expect(edgeFunctionSource).toContain("console.error('reactivate_subscription_error'")
    expect(edgeFunctionSource).toContain('Nao foi possivel cancelar a assinatura')
    expect(edgeFunctionSource).toContain('Nao foi possivel reativar a assinatura')
  })
})
