import { supabase } from "@/lib/supabase"

export async function getPrivateCaregiverIds() {
  const { data, error } = await supabase.rpc("family_private_caregiver_ids")
  if (error) throw error
  return (data ?? []).map((row: { caregiver_id: string }) => row.caregiver_id)
}

export function privateVisibilityFilter(privateIds: string[]) {
  if (privateIds.length === 0) return null
  return `is_visible.eq.true,id.in.(${privateIds.join(",")})`
}
