import type { SubscriptionPlan } from '@/types/database'

const planNames: Record<SubscriptionPlan, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
}

const planByFullAmount: Record<string, SubscriptionPlan> = {
  '127.00': 'monthly',
  '297.00': 'quarterly',
  '997.00': 'annual',
}

export function inferInvoicePlanFromAmount(amount: number): SubscriptionPlan | null {
  return planByFullAmount[amount.toFixed(2)] ?? null
}

export function getInvoicePlanLabel(plan: SubscriptionPlan | string | null, amount: number): string {
  const resolvedPlan = plan ?? inferInvoicePlanFromAmount(amount)
  if (!resolvedPlan) return '—'
  return planNames[resolvedPlan as SubscriptionPlan] ?? resolvedPlan
}
