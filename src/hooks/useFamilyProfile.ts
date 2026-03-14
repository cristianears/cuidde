import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FamilyProfile } from '@/types/database'

export type FamilyProfileFull = FamilyProfile & {
  profiles: {
    full_name: string | null
    phone: string | null
  }
}

export function useFamilyProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['family_profile', user?.id],
    queryFn: async (): Promise<FamilyProfileFull | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('family_profiles')
        .select('*, profiles!inner(full_name, phone)')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as FamilyProfileFull
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
