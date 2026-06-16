import type { AppointmentStatus, SubscriptionStatus, UserRole } from '@/types/database'

export const PAST_DUE_GRACE_DAYS = 7

export interface SubscriptionAccessState {
  subscription_status: SubscriptionStatus
  payment_failed_at?: string | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function hasFullPaidAccess(subscription: SubscriptionAccessState | null | undefined): boolean {
  return subscription?.subscription_status === 'active'
}

export function isPastDueWithinGrace(
  subscription: SubscriptionAccessState | null | undefined,
  now = new Date(),
): boolean {
  if (subscription?.subscription_status !== 'past_due' || !subscription.payment_failed_at) {
    return false
  }

  const failedAt = new Date(subscription.payment_failed_at)
  if (Number.isNaN(failedAt.getTime())) return false

  const elapsedMs = now.getTime() - failedAt.getTime()
  return elapsedMs >= 0 && elapsedMs <= PAST_DUE_GRACE_DAYS * MS_PER_DAY
}

export function canSendAppointmentChat(
  userRole: UserRole,
  subscription: SubscriptionAccessState | null | undefined,
  now = new Date(),
): boolean {
  if (userRole === 'caregiver') return true
  return hasFullPaidAccess(subscription) || isPastDueWithinGrace(subscription, now)
}

export function canCreatePaidAppointment(subscription: SubscriptionAccessState | null | undefined): boolean {
  return hasFullPaidAccess(subscription)
}

export function shouldFilterAppointmentContact(status: AppointmentStatus | null | undefined): boolean {
  return status === 'pendente'
}
