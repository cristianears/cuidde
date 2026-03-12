import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FamilyProfile } from '@/types/database'

export function useFamilyProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['family_profile', user?.id],
    queryFn: async (): Promise<FamilyProfile | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // sem resultado
        throw error
      }

      return data
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
