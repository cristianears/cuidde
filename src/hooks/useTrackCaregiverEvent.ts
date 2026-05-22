import { supabase } from '@/lib/supabase'

// Helpers para registrar eventos de insights do cuidador.
// As RPCs no banco aplicam dedup por (cuidador, famÃ­lia, tipo, dia) e
// recomputam as colunas *_30d em caregiver_profiles.
// Tudo Ã© best-effort: nunca propaga erro para o usuÃ¡rio.

export async function trackCaregiverView(caregiverId: string): Promise<void> {
  try {
    await supabase.rpc('track_caregiver_view', { p_caregiver_id: caregiverId })
  } catch (error) {
    // best-effort: silently ignore tracking errors
  }
}

export async function trackSearchAppearances(caregiverIds: string[]): Promise<void> {
  if (caregiverIds.length === 0) return
  try {
    await supabase.rpc('track_search_appearances', { p_caregiver_ids: caregiverIds })
  } catch (error) {
    // best-effort: silently ignore tracking errors
  }
}

export async function trackCaregiverInterest(caregiverId: string): Promise<void> {
  try {
    await supabase.rpc('track_caregiver_interest', { p_caregiver_id: caregiverId })
  } catch (error) {
    // best-effort: silently ignore tracking errors
  }
}
