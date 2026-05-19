export type SubscriptionCheckoutResult = {
  url?: string
  updated?: boolean
  same_plan?: boolean
  scheduled?: boolean
  payment_failed?: boolean
  pending_plan?: string
  effective_at?: string | null
  plan?: string
  current_period_end?: string | null
  error?: string
}

export type SubscriptionCheckoutOutcome =
  | { kind: 'redirect'; url: string }
  | { kind: 'payment_failed'; plan?: string; current_period_end?: string | null }
  | { kind: 'scheduled'; pending_plan?: string; effective_at?: string | null }
  | { kind: 'updated'; same_plan: boolean; plan?: string; current_period_end?: string | null }
  | { kind: 'idle' }

export function getSubscriptionCheckoutOutcome(
  result: SubscriptionCheckoutResult,
): SubscriptionCheckoutOutcome {
  if (result.url) {
    return { kind: 'redirect', url: result.url }
  }

  if (result.payment_failed) {
    return {
      kind: 'payment_failed',
      plan: result.plan,
      current_period_end: result.current_period_end,
    }
  }

  if (result.scheduled) {
    return {
      kind: 'scheduled',
      pending_plan: result.pending_plan,
      effective_at: result.effective_at,
    }
  }

  if (result.updated) {
    return {
      kind: 'updated',
      same_plan: result.same_plan ?? false,
      plan: result.plan,
      current_period_end: result.current_period_end,
    }
  }

  return { kind: 'idle' }
}
