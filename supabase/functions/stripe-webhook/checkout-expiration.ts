import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function markExpiredCheckout(supabase: SupabaseClient, familyId: string) {
  // Keep these guards in the UPDATE so a concurrent paid webhook cannot be overwritten.
  return await supabase
    .from('family_profiles')
    .update({ subscription_status: 'incomplete', payment_failed_at: null })
    .eq('id', familyId)
    .in('subscription_status', ['free', 'incomplete'])
    .is('stripe_subscription_id', null)
}
