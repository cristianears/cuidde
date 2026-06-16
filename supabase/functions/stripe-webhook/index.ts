import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// ─── Helpers puros — definidos no nível do módulo, não dentro de serve() ─────

function getPlan(interval: string, intervalCount: number): 'monthly' | 'quarterly' | 'annual' {
  if (interval === 'year') return 'annual'
  if (intervalCount === 3) return 'quarterly'
  return 'monthly'
}

function mapSubStatus(status: Stripe.Subscription.Status): string {
  if (status === 'active') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled') return 'canceled'
  return 'incomplete'
}

async function getPlanFromPriceId(priceId: string): Promise<'monthly' | 'quarterly' | 'annual'> {
  const price = await stripe.prices.retrieve(priceId)
  return getPlan(
    price.recurring!.interval,
    price.recurring!.interval_count,
  )
}

async function getPendingPlanFromSchedule(
  scheduleId: string | Stripe.SubscriptionSchedule | null,
): Promise<'monthly' | 'quarterly' | 'annual' | null> {
  if (!scheduleId) return null

  const id = typeof scheduleId === 'string' ? scheduleId : scheduleId.id
  const schedule = await stripe.subscriptionSchedules.retrieve(id)
  const now = Math.floor(Date.now() / 1000)
  const futurePhase = schedule.phases.find((phase) => phase.start_date > now)

  const price = futurePhase?.items?.[0]?.price
  if (!price) return null

  return typeof price === 'string'
    ? await getPlanFromPriceId(price)
    : getPlan(price.recurring!.interval, price.recurring!.interval_count)
}

/** Formata timestamp Unix (segundos) para data legível pt-BR: DD/MM/AAAA */
function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Converte timestamp Unix (segundos) para string ISO date: YYYY-MM-DD */
function toISODate(ts: number): string {
  const d = new Date(ts * 1000)
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function getPaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null): string | null {
  return typeof paymentIntent === 'string'
    ? paymentIntent
    : paymentIntent?.id ?? null
}

function getPlanFromInvoiceLine(
  line: Stripe.InvoiceLineItem | undefined,
): 'monthly' | 'quarterly' | 'annual' | null {
  const recurring = line?.price?.recurring
  if (!recurring) return null
  return getPlan(recurring.interval, recurring.interval_count)
}

// ─── Helper com dependência do cliente Supabase ───────────────────────────────

async function getFamilyId(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  return data?.id ?? null
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function syncSubscriptionToFamily(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  fallbackFamilyId?: string | null,
): Promise<string | null> {
  const customerId = sub.customer as string
  const familyId = fallbackFamilyId ?? await getFamilyId(supabase, customerId)
  if (!familyId) return null

  const item = sub.items.data[0]
  const plan = getPlan(
    item.price.recurring!.interval,
    item.price.recurring!.interval_count,
  )

  const periodEndTs =
    (item as unknown as { current_period_end?: number }).current_period_end
    ?? (sub as unknown as { current_period_end?: number }).current_period_end
    ?? null

  const { error } = await supabase
    .from('family_profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      subscription_status: mapSubStatus(sub.status),
      plan,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      current_period_end: periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : null,
      payment_failed_at: sub.status === 'past_due' ? new Date().toISOString() : null,
      pending_plan: null,
    })
    .eq('id', familyId)

  if (error) throw error
  return familyId
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const familyId = session.metadata?.family_id ?? null
      const subscriptionId = session.subscription as string | null

      if (familyId && session.customer) {
        const { error } = await supabase
          .from('family_profiles')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', familyId)

        if (error) throw error
      }

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await syncSubscriptionToFamily(supabase, sub, familyId)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const familyId = await getFamilyId(supabase, sub.customer as string)
      if (!familyId) break

      const item = sub.items.data[0]
      const plan = getPlan(
        item.price.recurring!.interval,
        item.price.recurring!.interval_count,
      )

      // Stripe moveu current_period_end de Subscription para Subscription Item
      // em versões recentes da API. Ler do item primeiro com fallback.
      const periodEndTs =
        (item as unknown as { current_period_end?: number }).current_period_end
        ?? (sub as unknown as { current_period_end?: number }).current_period_end
        ?? null
      const pendingPlan = await getPendingPlanFromSchedule(sub.schedule ?? null)

      const updateData: Record<string, unknown> = {
        stripe_subscription_id: sub.id,
        subscription_status: mapSubStatus(sub.status),
        plan,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        current_period_end: periodEndTs
          ? new Date(periodEndTs * 1000).toISOString()
          : null,
        payment_failed_at: sub.status === 'past_due' ? new Date().toISOString() : null,
        pending_plan: pendingPlan,
      }

      await supabase
        .from('family_profiles')
        .update(updateData)
        .eq('id', familyId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const familyId = await getFamilyId(supabase, sub.customer as string)
      if (familyId) {
        await supabase
          .from('family_profiles')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            plan: null,
            cancel_at_period_end: false,
            current_period_end: null,
            payment_failed_at: null,
            pending_plan: null,
          })
          .eq('id', familyId)
      }
      break
    }

    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice
      const familyId = await getFamilyId(supabase, inv.customer as string)
      if (!familyId) break

      // Proration invoices têm múltiplas linhas: crédito (negativo) do plano
      // antigo + cobrança (positivo) do plano novo. Pegar a linha do plano novo.
      const line = inv.lines.data.find(l => l.amount > 0)
        ?? inv.lines.data[inv.lines.data.length - 1]
      const periodStart = line?.period?.start
      const periodEnd = line?.period?.end
      const periodLabel = periodStart && periodEnd
        ? `${fmtDate(periodStart)} a ${fmtDate(periodEnd)}`
        : null

      // Cobranças automáticas não têm due_date — usar period_end da assinatura
      const dueDate = periodEnd ? toISODate(periodEnd) : null
      const linePlan = getPlanFromInvoiceLine(line)
      const paidAt = inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString()

      // Busca plano já salvo em family_profiles (definido pelo subscription.created)
      const { data: fp } = await supabase
        .from('family_profiles')
        .select('plan')
        .eq('id', familyId)
        .single()
      const plan = linePlan ?? fp?.plan ?? null

      await supabase.from('invoices').upsert(
        {
          family_id: familyId,
          stripe_invoice_id: inv.id,
          stripe_payment_intent_id: getPaymentIntentId(inv.payment_intent),
          amount: inv.amount_paid / 100,
          status: 'paid',
          plan,
          paid_at: paidAt,
          due_date: dueDate,
          invoice_ref: inv.number ?? null,
          period: periodLabel,
        },
        { onConflict: 'stripe_invoice_id' },
      )

      const familyUpdate: Record<string, unknown> = {
        subscription_status: 'active',
        payment_failed_at: null,
      }
      await supabase
        .from('family_profiles')
        .update(familyUpdate)
        .eq('id', familyId)
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      const familyId = await getFamilyId(supabase, inv.customer as string)
      if (!familyId) break

      const line = inv.lines.data.find(l => l.amount > 0)
        ?? inv.lines.data[inv.lines.data.length - 1]
      const plan = getPlanFromInvoiceLine(line)

      await supabase.from('invoices').upsert(
        {
          family_id: familyId,
          stripe_invoice_id: inv.id,
          stripe_payment_intent_id: getPaymentIntentId(inv.payment_intent),
          amount: inv.amount_due / 100,
          status: 'overdue',
          plan,
          due_date: inv.due_date
            ? new Date(inv.due_date * 1000).toISOString().split('T')[0]
            : null,
          invoice_ref: inv.number ?? null,
        },
        { onConflict: 'stripe_invoice_id' },
      )

      await supabase
        .from('family_profiles')
        .update({ subscription_status: 'past_due', payment_failed_at: new Date().toISOString() })
        .eq('id', familyId)
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const familyId = session.metadata?.family_id
      if (familyId) {
        await supabase
          .from('family_profiles')
          .update({ subscription_status: 'incomplete', payment_failed_at: null })
          .eq('id', familyId)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
