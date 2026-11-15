import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getVerifiedPurchase } from './purchase.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const allowedOrigins = ['https://icuide.com.br', 'https://www.icuide.com.br', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173']

serve(async (req) => {
  const origin = req.headers.get('origin')
  const headers = {
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  }
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405)
  if (origin && !allowedOrigins.includes(origin)) return respond({ error: 'Forbidden' }, 403)
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Unauthorized' }, 401)
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return respond({ error: 'Unauthorized' }, 401)
  let sessionId: unknown
  try {
    sessionId = (await req.json()).session_id
  } catch {
    return respond({ error: 'Invalid JSON' }, 400)
  }
  if (typeof sessionId !== 'string' || !/^cs_(?:live|test)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
    return respond({ error: 'Invalid session' }, 400)
  }
  const { data: family, error: profileError } = await supabase.from('family_profiles')
    .select('stripe_customer_id').eq('id', user.id).single()
  if (profileError || !family?.stripe_customer_id) return respond({ error: 'Forbidden' }, 403)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] })
    const purchase = getVerifiedPurchase(session, user.id, family.stripe_customer_id)
    return respond({ purchase })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') return respond({ error: 'Forbidden' }, 403)
    return respond({ error: 'Purchase verification unavailable' }, 400)
  }
})
