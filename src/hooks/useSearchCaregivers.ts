import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { DEFAULT_RADIUS_KM, MAX_PRICE_PER_HOUR } from '@/lib/constants'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic } from '@/types/database'

// Escapa caracteres especiais do operador LIKE para evitar wildcard injection
function escapeLike(s: string): string {
  return s.replace(/%/g, '\\%').replace(/_/g, '\\_')
}

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
  // Proximidade
  radiusKm?: number        // raio em km (default: DEFAULT_RADIUS_KM)
  familyLat?: number       // lat da família (preenchido automaticamente)
  familyLng?: number       // lng da família (preenchido automaticamente)
}

export type CaregiverPublicWithDistance = CaregiverPublic & {
  distance_km?: number
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSearchCaregivers(filters: SearchFilters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.searchCaregivers(filters as Record<string, unknown>),
    queryFn: async (): Promise<CaregiverPublicWithDistance[]> => {
      const useProximity = filters.familyLat != null && filters.familyLng != null

      // Se tem lat/lng da família, buscar IDs por proximidade primeiro
      let proximityMap: Map<string, number> | null = null

      if (useProximity) {
        const { data: nearbyIds, error: rpcError } = await supabase
          .rpc('search_caregivers_by_proximity', {
            p_lat: filters.familyLat!,
            p_lng: filters.familyLng!,
            p_radius_km: filters.radiusKm ?? DEFAULT_RADIUS_KM,
          })

        if (rpcError) throw rpcError

        proximityMap = new Map(
          (nearbyIds ?? []).map((r: { id: string; distance_km: number }) => [r.id, r.distance_km])
        )

        // Se nenhum cuidador dentro do raio, retornar vazio
        if (proximityMap.size === 0) return []
      }

      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('profile_complete', true)

      // Se usando proximidade, filtrar pelos IDs retornados pela RPC
      if (proximityMap) {
        const ids = Array.from(proximityMap.keys())
        q = q.in('id', ids)
      }

      // Filtros tradicionais (cidade/bairro como fallback quando sem proximidade)
      if (!useProximity) {
        if (filters.city && filters.city.trim()) {
          q = q.ilike('city', `%${escapeLike(filters.city.trim())}%`)
        }
        if (filters.neighborhood && filters.neighborhood.trim()) {
          q = q.ilike('neighborhood', `%${escapeLike(filters.neighborhood.trim())}%`)
        }
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
      if (filters.maxPrice !== undefined && filters.maxPrice < MAX_PRICE_PER_HOUR) {
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

      let rows: CaregiverPublicWithDistance[] = (data ?? []).map((row) => {
        const mapped = mapCaregiverRow(row)
        const distance = proximityMap?.get(mapped.id)
        return {
          ...mapped,
          distance_km: distance != null ? Math.round(distance * 10) / 10 : undefined,
        }
      })

      // Busca textual client-side
      if (filters.query && filters.query.trim()) {
        const term = filters.query.trim().toLowerCase()
        rows = rows.filter(
          (c) =>
            c.full_name?.toLowerCase().includes(term) ||
            c.neighborhood?.toLowerCase().includes(term) ||
            c.city?.toLowerCase().includes(term)
        )
      }

      // Se usando proximidade, ordenar por distância
      if (proximityMap) {
        rows.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
      }

      return rows
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}
