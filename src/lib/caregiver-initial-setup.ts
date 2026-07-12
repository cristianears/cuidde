import { supabase } from "@/lib/supabase"

export const CAREGIVER_INITIAL_SETUP_PATH = "/caregiver/profile?setup=1&step=bio"

export function getCaregiverInitialSetupPath(step = 2) {
  if (step <= 1) return "/caregiver/profile?setup=1&step=basic"
  if (step === 2) return CAREGIVER_INITIAL_SETUP_PATH
  if (step === 3) return "/caregiver/profile?setup=1&step=specialties"
  if (step === 4) return "/caregiver/profile?setup=1&step=references"
  if (step === 5) return "/caregiver/availability?setup=1"
  return "/caregiver/documents?setup=1"
}

export async function getCaregiverPostLoginTarget(userId: string) {
  const { data, error } = await supabase
    .from("caregiver_profiles")
    .select("initial_setup_completed_at, initial_setup_step")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  return data?.initial_setup_completed_at ? "/caregiver" : getCaregiverInitialSetupPath(data?.initial_setup_step ?? 2)
}

export async function setCaregiverInitialSetupStep(userId: string, step: number) {
  const { error } = await supabase
    .from("caregiver_profiles")
    .update({ initial_setup_step: Math.min(6, Math.max(1, step)) })
    .eq("id", userId)

  if (error) throw error
}

export async function completeCaregiverInitialSetup(userId: string) {
  const { error } = await supabase
    .from("caregiver_profiles")
    .update({ initial_setup_completed_at: new Date().toISOString(), initial_setup_step: 6 })
    .eq("id", userId)

  if (error) throw error
}
