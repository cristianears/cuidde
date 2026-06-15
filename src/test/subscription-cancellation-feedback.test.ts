import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('subscription cancellation feedback persistence', () => {
  const sqlSource = read('supabase/sql/create_subscription_cancellation_feedback.sql')
  const typesSource = read('src/types/database.ts')
  const familyBillingSource = read('src/pages/family/FamilyBilling.tsx')

  it('creates a protected table for family cancellation reasons', () => {
    expect(sqlSource).toContain('create table if not exists public.subscription_cancellation_feedback')
    expect(sqlSource).toContain('reason_code text not null check')
    expect(sqlSource).toContain('alter table public.subscription_cancellation_feedback enable row level security')
    expect(sqlSource).toContain('Families can insert own cancellation feedback')
    expect(sqlSource).toContain('with check ((select auth.uid()) = family_id)')
    expect(sqlSource).toContain('grant select, insert on public.subscription_cancellation_feedback to authenticated')
  })

  it('keeps database types and family billing insert in sync', () => {
    expect(typesSource).toContain('SubscriptionCancellationReason')
    expect(typesSource).toContain('SubscriptionCancellationFeedback')
    expect(typesSource).toContain('subscription_cancellation_feedback: {')
    expect(familyBillingSource).toContain('.from("subscription_cancellation_feedback")')
    expect(familyBillingSource).toContain('reason_label: selectedReason.label')
    expect(familyBillingSource).toContain('current_period_end: currentPeriodEnd')
  })
})
