import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const ALLOWED_ORIGINS = [
  'https://ditti.app.br',
  'https://www.ditti.app.br',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

serve(async (req) => {
  const reqOrigin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(reqOrigin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ─── Verificar JWT do caller ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Client com anon key para validar o JWT do usuário
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Client com service_role para operações privilegiadas
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { action?: string; family_id: string; price_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { action = 'create_checkout', family_id, price_id } = body

  if (!family_id) {
    return new Response(JSON.stringify({ error: 'family_id é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Garantir que o caller só opera sobre seu próprio family_id ───────────
  if (caller.id !== family_id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Cancelar assinatura (no fim do período) ──────────────────────────────
  if (action === 'cancel_subscription') {
    const { data: profile, error: profileError } = await supabase
      .from('family_profiles')
      .select('stripe_subscription_id')
      .eq('id', family_id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'Assinatura ativa não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Atualiza Supabase imediatamente — não espera o webhook chegar
    await supabase
      .from('family_profiles')
      .update({ cancel_at_period_end: true })
      .eq('id', family_id)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Reativar assinatura (desfaz cancelamento agendado) ───────────────────
  if (action === 'reactivate_subscription') {
    const { data: profile, error: profileError } = await supabase
      .from('family_profiles')
      .select('stripe_subscription_id')
      .eq('id', family_id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'Assinatura não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // Atualiza Supabase imediatamente — não espera o webhook chegar
    await supabase
      .from('family_profiles')
      .update({ cancel_at_period_end: false })
      .eq('id', family_id)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Criar checkout / trocar plano ────────────────────────────────────────
  if (!price_id) {
    return new Response(JSON.stringify({ error: 'price_id é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('family_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', family_id)
    .single()

  if (profileError) {
    return new Response(JSON.stringify({ error: 'Perfil não encontrado', detail: profileError.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Helper: rank do plano (maior = melhor custo-benefício) ────────────────
  function planRank(interval: string, count: number): number {
    if (interval === 'year') return 3
    if (interval === 'month' && count === 3) return 2
    return 1
  }

  function derivePlan(interval: string, count: number): 'monthly' | 'quarterly' | 'annual' {
    if (interval === 'year') return 'annual'
    if (count === 3) return 'quarterly'
    return 'monthly'
  }

  function getImmediatePaymentState(sub: Stripe.Subscription) {
    const latestInvoice = sub.latest_invoice
    const invoice = latestInvoice && typeof latestInvoice !== 'string'
      ? latestInvoice as Stripe.Invoice
      : null
    const paymentIntent = invoice?.payment_intent
    const expandedPaymentIntent = paymentIntent && typeof paymentIntent !== 'string'
      ? paymentIntent as Stripe.PaymentIntent
      : null
    const invoiceStatus = invoice?.status ?? null
    const paymentIntentStatus = expandedPaymentIntent?.status ?? null
    const paymentFailed =
      sub.status === 'past_due' ||
      invoiceStatus === 'open' ||
      invoiceStatus === 'uncollectible' ||
      paymentIntentStatus === 'requires_payment_method' ||
      paymentIntentStatus === 'requires_action'

    return {
      payment_failed: paymentFailed,
      invoice_id: invoice?.id ?? null,
      invoice_status: invoiceStatus,
      payment_intent_status: paymentIntentStatus,
    }
  }

  // Se já existe assinatura ativa → troca de plano
  if (
    profile?.stripe_subscription_id &&
    (profile.subscription_status === 'active' || profile.subscription_status === 'past_due')
  ) {
    const existing = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const currentItem = existing.items.data[0]

    // Se a assinatura é gerida por um schedule, libera antes de qualquer alteração
    if (existing.schedule) {
      await stripe.subscriptionSchedules.release(existing.schedule as string)
    }

    // Mesmo plano → cancela downgrade pendente e/ou reativa
    if (currentItem.price.id === price_id) {
      if (existing.cancel_at_period_end) {
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          cancel_at_period_end: false,
        })
      }
      await supabase
        .from('family_profiles')
        .update({ cancel_at_period_end: false, pending_plan: null })
        .eq('id', family_id)
      return new Response(JSON.stringify({ updated: true, same_plan: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Detectar upgrade vs downgrade
    const currentRank = planRank(
      currentItem.price.recurring!.interval,
      currentItem.price.recurring!.interval_count,
    )
    const newPrice = await stripe.prices.retrieve(price_id)
    const newRank = planRank(
      newPrice.recurring!.interval,
      newPrice.recurring!.interval_count,
    )
    const newPlan = derivePlan(newPrice.recurring!.interval, newPrice.recurring!.interval_count)
    const isDowngrade = newRank < currentRank

    if (isDowngrade) {
      // ── Downgrade: agendar troca para o fim do período via Subscription Schedule
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: profile.stripe_subscription_id,
      })

      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: [{ price: currentItem.price.id, quantity: 1 }],
            start_date: schedule.phases[0].start_date,
            end_date: schedule.phases[0].end_date,
          },
          {
            items: [{ price: price_id, quantity: 1 }],
          },
        ],
      })

      const effectiveAt = existing.current_period_end
        ? new Date(existing.current_period_end * 1000).toISOString()
        : null

      await supabase
        .from('family_profiles')
        .update({ pending_plan: newPlan })
        .eq('id', family_id)

      return new Response(JSON.stringify({
        scheduled: true,
        pending_plan: newPlan,
        effective_at: effectiveAt,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Upgrade: troca imediata com cobrança proporcional
    const updatedSub = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: currentItem.id, price: price_id }],
      proration_behavior: 'always_invoice',
      cancel_at_period_end: false,
      expand: ['latest_invoice.payment_intent'],
    })
    const paymentState = getImmediatePaymentState(updatedSub)

    const newPeriodEnd = updatedSub.current_period_end
      ? new Date(updatedSub.current_period_end * 1000).toISOString()
      : null

    await supabase
      .from('family_profiles')
      .update({
        plan: newPlan,
        cancel_at_period_end: false,
        current_period_end: newPeriodEnd,
        pending_plan: null,
      })
      .eq('id', family_id)

    return new Response(JSON.stringify({
      updated: true,
      plan: newPlan,
      current_period_end: newPeriodEnd,
      ...paymentState,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fluxo normal: primeira assinatura (ou vinda de canceled/free/incomplete)
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const { data: authUser } = await supabase.auth.admin.getUserById(family_id)
    const customer = await stripe.customers.create({
      email: authUser?.user?.email,
      metadata: { supabase_user_id: family_id },
    })
    customerId = customer.id
    await supabase
      .from('family_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', family_id)
  }

  const rawOrigin = req.headers.get('origin') ?? ''
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://ditti.app.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: price_id, quantity: 1 }],
    success_url: `${origin}/family/billing?success=true`,
    cancel_url: `${origin}/family/billing?canceled=true`,
    metadata: { family_id },
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
