import { describe, expect, it } from 'vitest'
import {
  canCreatePaidAppointment,
  canSendAppointmentChat,
  hasFullPaidAccess,
  isPastDueWithinGrace,
  isSubscriptionContactLocked,
  shouldFilterAppointmentContact,
} from '@/lib/subscription-access'

const now = new Date('2026-05-19T12:00:00.000Z')

describe('subscription access policy', () => {
  it('grants full paid access only to active subscriptions', () => {
    expect(hasFullPaidAccess({ subscription_status: 'active' })).toBe(true)
    expect(hasFullPaidAccess({ subscription_status: 'past_due', payment_failed_at: now.toISOString() })).toBe(false)
    expect(hasFullPaidAccess({ subscription_status: 'free' })).toBe(false)
  })

  it('keeps past_due subscriptions in grace for seven days after payment failure', () => {
    expect(isPastDueWithinGrace({
      subscription_status: 'past_due',
      payment_failed_at: '2026-05-13T12:00:00.000Z',
    }, now)).toBe(true)

    expect(isPastDueWithinGrace({
      subscription_status: 'past_due',
      payment_failed_at: '2026-05-11T11:59:59.000Z',
    }, now)).toBe(false)
  })

  it('fails closed when past_due does not have a payment failure timestamp', () => {
    expect(isPastDueWithinGrace({ subscription_status: 'past_due', payment_failed_at: null }, now)).toBe(false)
  })

  it('allows family chat only when active or within past_due grace', () => {
    expect(canSendAppointmentChat('family', { subscription_status: 'active' }, now)).toBe(true)
    expect(canSendAppointmentChat('family', {
      subscription_status: 'past_due',
      payment_failed_at: '2026-05-18T12:00:00.000Z',
    }, now)).toBe(true)
    expect(canSendAppointmentChat('family', {
      subscription_status: 'past_due',
      payment_failed_at: '2026-05-01T12:00:00.000Z',
    }, now)).toBe(false)
  })

  it('does not block caregivers from chat because of family billing state', () => {
    expect(canSendAppointmentChat('caregiver', { subscription_status: 'canceled' }, now)).toBe(true)
  })

  it('allows creating new paid appointment requests only for active subscriptions', () => {
    expect(canCreatePaidAppointment({ subscription_status: 'active' })).toBe(true)
    expect(canCreatePaidAppointment({
      subscription_status: 'past_due',
      payment_failed_at: '2026-05-18T12:00:00.000Z',
    })).toBe(false)
  })

  it('locks external contact during the first seven days of the paid subscription', () => {
    expect(isSubscriptionContactLocked({
      subscription_status: 'active',
      subscription_started_at: '2026-05-13T12:00:00.000Z',
    }, now)).toBe(true)

    expect(isSubscriptionContactLocked({
      subscription_status: 'active',
      subscription_started_at: '2026-05-12T12:00:00.000Z',
    }, now)).toBe(false)
  })

  it('keeps contact filtering for pending appointments and paid subscriptions in the safety window', () => {
    expect(shouldFilterAppointmentContact('pendente', {
      subscription_status: 'active',
      subscription_started_at: '2026-05-01T12:00:00.000Z',
    }, now)).toBe(true)

    expect(shouldFilterAppointmentContact('ativo', {
      subscription_status: 'active',
      subscription_started_at: '2026-05-13T12:00:00.000Z',
    }, now)).toBe(true)

    expect(shouldFilterAppointmentContact('ativo', {
      subscription_status: 'active',
      subscription_started_at: '2026-05-12T12:00:00.000Z',
    }, now)).toBe(false)
  })
})
