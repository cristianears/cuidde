import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic } from '@/types/database'

export function useFamilyMatches(limit = 3) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.familyMatches(user?.id ?? '', limit),
    queryFn: async (): Promise<CaregiverPublic[]> => {
      if (!user) return []

      const { data: familyData, error: familyError } = await supabase
        .from('family_profiles')
        .select('elderly_conditions')
        .eq('id', user.id)
        .single()

      if (familyError) throw familyError

      const conditions: string[] = familyData?.elderly_conditions ?? []

      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('profile_complete', true)
        .order('average_rating', { ascending: false })
        .limit(limit)

      if (conditions.length > 0) {
        q = q.overlaps('specialties', conditions)
      }

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map(mapCaregiverRow)
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
