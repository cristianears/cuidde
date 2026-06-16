import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('subscription contact filter cleanup', () => {
  it('removes the paid subscription seven-day contact lock from client code', () => {
    expect(read('src/lib/subscription-access.ts')).not.toContain('CONTACT_LOCK_DAYS')
    expect(read('src/lib/subscription-access.ts')).not.toContain('isSubscriptionContactLocked')
    expect(read('src/hooks/useAppointments.ts')).not.toContain('subscription_started_at')
    expect(read('src/pages/chat/AppointmentChat.tsx')).toContain('shouldFilterAppointmentContact(status)')
  })

  it('removes subscription_started_at from schema, SQL and Stripe webhook code', () => {
    const sources = [
      'src/types/database.ts',
      'supabase/functions/stripe-webhook/index.ts',
      'supabase/sql/protect_family_stripe_fields.sql',
      'supabase/sql/production_readiness_indexes_rls.sql',
      'SPEC.md',
    ].map(read).join('\n')

    expect(sources).not.toContain('subscription_started_at')
    expect(read('supabase/sql/chat_contact_filter_trigger.sql')).not.toContain("interval '7 days'")
    expect(read('supabase/sql/drop_family_subscription_started_at.sql')).toContain('drop column if exists subscription_started_at')
    expect(read('supabase/sql/drop_appointment_cancel_reason_filter.sql')).toContain('drop trigger if exists appointments_cancel_reason_contact_filter')
  })
})
