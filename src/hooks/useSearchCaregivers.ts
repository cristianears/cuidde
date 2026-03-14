import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string           // busca por nome, bairro ou cidade
  city?: string            // filtro de cidade
  neighborhood?: string    // filtro de bairro
  modalities?: string[]    // formatos de atendimento — must match at least one
  idiomas?: string[]       // idiomas — must match at least one
  zona?: string            // zona/região de atuação
  withReferences?: boolean // apenas cuidadores com referências
  minPrice?: number
  maxPrice?: number
  minRating?: number
  emergencyOnly?: boolean
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSearchCaregivers(filters: SearchFilters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['caregivers', 'search', filters],
    queryFn: async (): Promise<CaregiverPublic[]> => {
      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('profile_complete', true)

      if (filters.city && filters.city.trim()) {
        q = q.ilike('city', `%${filters.city.trim()}%`)
      }
      if (filters.neighborhood && filters.neighborhood.trim()) {
        q = q.ilike('neighborhood', `%${filters.neighborhood.trim()}%`)
      }
      if (filters.modalities && filters.modalities.length > 0) {
        q = q.contains('modalities', filters.modalities)
      }
      if (filters.idiomas && filters.idiomas.length > 0) {
        q = q.contains('idiomas', filters.idiomas)
      }
      if (filters.zona) {
        q = q.eq('zona', filters.zona)
      }
      if (filters.withReferences) {
        q = q.eq('has_references', true)
      }
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        q = q.gte('price_per_hour', filters.minPrice)
      }
      if (filters.maxPrice !== undefined && filters.maxPrice < 200) {
        q = q.lte('price_per_hour', filters.maxPrice)
      }
      if (filters.minRating && filters.minRating > 0) {
        q = q.gte('average_rating', filters.minRating)
      }
      if (filters.emergencyOnly) {
        q = q.eq('emergency_available', true)
      }

      q = q.order('average_rating', { ascending: false })

      const { data, error } = await q
      if (error) throw error

      let rows = (data ?? []).map(mapCaregiverRow)

      if (filters.query && filters.query.trim()) {
        const term = filters.query.trim().toLowerCase()
        rows = rows.filter(
          (c) =>
            c.full_name?.toLowerCase().includes(term) ||
            c.neighborhood?.toLowerCase().includes(term) ||
            c.city?.toLowerCase().includes(term)
        )
      }

      return rows
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}
