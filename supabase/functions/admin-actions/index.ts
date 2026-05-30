import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://icuide.com.br',
  'https://www.icuide.com.br',
  'http://localhost:5173',
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

function json(data: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // ─── Verificar JWT ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401, cors)

  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user: caller }, error: authErr } = await supabaseAuth.auth.getUser()
  if (authErr || !caller) return json({ error: 'Unauthorized' }, 401, cors)

  // ─── Client service_role (bypass RLS) ────────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ─── Verificar role admin ─────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403, cors)

  const body = await req.json().catch(() => ({}))
  const { action } = body

  // ─── list_caregivers ──────────────────────────────────────────────────────
  if (action === 'list_caregivers') {
    const { status } = body
    const { data: cps, error } = await supabase
      .from('caregiver_profiles')
      .select('id, photo_url, city, state, status, created_at, profissao_formacao, professional_reg_type, professional_reg_number, professional_reg_uf, rejection_reason')
      .eq('status', status)
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500, cors)
    if (!cps?.length) return json({ data: [] }, 200, cors)

    const ids = cps.map((r: any) => r.id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ids)
    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    const data = cps.map((r: any) => ({
      ...r,
      full_name: profileMap[r.id]?.full_name ?? null,
      phone: profileMap[r.id]?.phone ?? null,
    }))
    return json({ data }, 200, cors)
  }

  // ─── get_caregiver_detail ─────────────────────────────────────────────────
  if (action === 'get_caregiver_detail') {
    const { caregiver_id } = body
    const { data: cp, error } = await supabase
      .from('caregiver_profiles')
      .select('*')
      .eq('id', caregiver_id)
      .single()
    if (error) return json({ error: error.message }, 500, cors)

    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', caregiver_id)
      .single()

    const { data: { user } } = await supabase.auth.admin.getUserById(caregiver_id)

    return json({
      data: {
        ...cp,
        full_name: p?.full_name ?? null,
        phone: p?.phone ?? null,
        email: user?.email ?? null,
      },
    }, 200, cors)
  }

  // ─── get_documents ────────────────────────────────────────────────────────
  if (action === 'get_documents') {
    const { caregiver_id } = body
    const { data, error } = await supabase
      .from('caregiver_documents')
      .select('*')
      .eq('caregiver_id', caregiver_id)
      .order('type')
    if (error) return json({ error: error.message }, 500, cors)
    return json({ data: data ?? [] }, 200, cors)
  }

  // ─── approve ──────────────────────────────────────────────────────────────
  if (action === 'approve') {
    const { caregiver_id } = body
    const { error } = await supabase
      .from('caregiver_profiles')
      .update({ status: 'verified', is_visible: true, rejection_reason: null })
      .eq('id', caregiver_id)
    if (error) return json({ error: error.message }, 500, cors)
    return json({ ok: true }, 200, cors)
  }

  // ─── reject ───────────────────────────────────────────────────────────────
  if (action === 'reject') {
    const { caregiver_id, reason } = body
    const { error } = await supabase
      .from('caregiver_profiles')
      .update({ status: 'rejected', rejection_reason: reason, is_visible: false })
      .eq('id', caregiver_id)
    if (error) return json({ error: error.message }, 500, cors)
    return json({ ok: true }, 200, cors)
  }

  // ─── get_caregiver_counts ─────────────────────────────────────────────────
  if (action === 'get_caregiver_counts') {
    const statuses = ['pending', 'analyzing', 'verified', 'rejected']
    const results = await Promise.all(
      statuses.map((s) =>
        supabase.from('caregiver_profiles').select('id', { count: 'exact', head: true }).eq('status', s)
      ),
    )
    const counts: Record<string, number> = {}
    statuses.forEach((s, i) => { counts[s] = results[i].count ?? 0 })
    return json({ data: counts }, 200, cors)
  }

  // ─── get_metrics ──────────────────────────────────────────────────────────
  if (action === 'get_metrics') {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [totalRes, verifiedRes, pendingRes, familiesRes, subsRes] = await Promise.all([
      supabase.from('caregiver_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('caregiver_profiles').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('caregiver_profiles').select('id', { count: 'exact', head: true }).in('status', ['pending', 'analyzing']),
      supabase.from('family_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('family_profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    ])

    const { data: revenueData } = await supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', monthStart)

    const monthlyRevenue = (revenueData ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

    const { data: subPlans } = await supabase
      .from('family_profiles')
      .select('plan')
      .eq('subscription_status', 'active')
      .not('plan', 'is', null)

    const subscriptions = { monthly: 0, quarterly: 0, annual: 0 }
    for (const row of subPlans ?? []) {
      if (row.plan === 'monthly') subscriptions.monthly++
      else if (row.plan === 'quarterly') subscriptions.quarterly++
      else if (row.plan === 'annual') subscriptions.annual++
    }

    const { data: ratingData } = await supabase
      .from('caregiver_profiles')
      .select('average_rating, review_count')
      .eq('status', 'verified')
      .gt('review_count', 0)

    const totalReviews = (ratingData ?? []).reduce((s: number, r: any) => s + (r.review_count ?? 0), 0)
    const weightedSum = (ratingData ?? []).reduce((s: number, r: any) => s + (r.average_rating ?? 0) * (r.review_count ?? 0), 0)
    const averageRating = totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 10) / 10 : 0

    const activeSubscriptions = subsRes.count ?? 0

    // MRR = receita recorrente mensal normalizada por plano
    const mrr =
      subscriptions.monthly * 127 +
      subscriptions.quarterly * (297 / 3) +
      subscriptions.annual * (997 / 12)

    // Ticket Médio (ARPU) = MRR / assinantes ativos
    const averageTicket = activeSubscriptions > 0
      ? Math.round((mrr / activeSubscriptions) * 100) / 100
      : 0

    return json({
      data: {
        totalCaregivers: totalRes.count ?? 0,
        verifiedCaregivers: verifiedRes.count ?? 0,
        pendingApproval: pendingRes.count ?? 0,
        totalFamilies: familiesRes.count ?? 0,
        activeSubscriptions,
        monthlyRevenue,
        averageTicket,
        subscriptions,
        averageRating,
      },
    }, 200, cors)
  }

  // ─── list_subscriptions ───────────────────────────────────────────────────
  if (action === 'list_subscriptions') {
    const { data: fps, error } = await supabase
      .from('family_profiles')
      .select('id, plan, subscription_status, current_period_end, created_at')
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500, cors)
    if (!fps?.length) return json({ data: [] }, 200, cors)

    const ids = fps.map((r: any) => r.id)
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
    const profileMap: Record<string, string | null> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p.full_name

    const data = fps.map((r: any) => ({ ...r, full_name: profileMap[r.id] ?? null }))
    return json({ data }, 200, cors)
  }

  // ─── list_invoices ────────────────────────────────────────────────────────
  if (action === 'list_invoices') {
    const { data: invs, error } = await supabase
      .from('invoices')
      .select('id, family_id, invoice_ref, period, plan, amount, status, due_date, paid_at, created_at')
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500, cors)
    if (!invs?.length) return json({ data: [] }, 200, cors)

    const ids = [...new Set((invs ?? []).map((r: any) => r.family_id))] as string[]
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
    const profileMap: Record<string, string | null> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p.full_name

    const data = invs.map((r: any) => ({ ...r, family_name: profileMap[r.family_id] ?? null }))
    return json({ data }, 200, cors)
  }

  // ─── approve_document ────────────────────────────────────────────────────
  if (action === 'approve_document') {
    const { document_id, caregiver_id } = body
    if (!document_id || !caregiver_id) return json({ error: 'document_id and caregiver_id required' }, 400, cors)

    const { data: doc, error: docErr } = await supabase
      .from('caregiver_documents')
      .update({ status: 'approved', rejection_reason: null, reviewed_at: new Date().toISOString() })
      .eq('id', document_id)
      .eq('caregiver_id', caregiver_id)
      .select('type')
      .single()
    if (docErr) return json({ error: docErr.message }, 500, cors)

    // Se é o RG/CNH, marcar cuidador como verificado e visível
    if (doc?.type === 'rg_cnh') {
      const { error: cpErr } = await supabase
        .from('caregiver_profiles')
        .update({ status: 'verified', has_rg_cnh: true, is_visible: true, rejection_reason: null })
        .eq('id', caregiver_id)
      if (cpErr) return json({ error: cpErr.message }, 500, cors)
    }

    return json({ ok: true }, 200, cors)
  }

  // ─── mark_document_illegible ──────────────────────────────────────────────
  if (action === 'mark_document_illegible') {
    const { document_id, caregiver_id } = body
    if (!document_id || !caregiver_id) return json({ error: 'document_id and caregiver_id required' }, 400, cors)

    const { error: docErr } = await supabase
      .from('caregiver_documents')
      .update({
        status: 'rejected',
        rejection_reason: 'Documento não legível. Envie novamente com boa iluminação e sem cortes.',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', document_id)
      .eq('caregiver_id', caregiver_id)
    if (docErr) return json({ error: docErr.message }, 500, cors)

    // Mover cuidador para "em análise" — sai dos Pendentes, aguarda reenvio
    const { error: cpErr } = await supabase
      .from('caregiver_profiles')
      .update({ status: 'analyzing', has_rg_cnh: false, is_visible: false })
      .eq('id', caregiver_id)
    if (cpErr) return json({ error: cpErr.message }, 500, cors)

    return json({ ok: true }, 200, cors)
  }

  // ─── get_document_signed_url ─────────────────────────────────────────────
  if (action === 'get_document_signed_url') {
    const { file_url } = body
    if (!file_url) return json({ error: 'file_url required' }, 400, cors)

    // Validar formato: {uuid}/{tipo}.{ext} — rejeita path traversal e buckets arbitrários
    const PATH_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z_]+\.(pdf|jpg|jpeg|png|webp)$/i
    if (!PATH_PATTERN.test(file_url)) {
      return json({ error: 'Caminho de arquivo inválido' }, 400, cors)
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(file_url, 120)
    if (error) return json({ error: error.message }, 500, cors)
    return json({ url: data.signedUrl }, 200, cors)
  }

  return json({ error: 'Unknown action' }, 400, cors)
})
