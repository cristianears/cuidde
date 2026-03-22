import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic } from '@/types/database'

export type CaregiverMatchWithDistance = CaregiverPublic & {
  distance_km?: number
}

export function useFamilyMatches(limit = 3) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.familyMatches(user?.id ?? '', limit),
    queryFn: async (): Promise<CaregiverMatchWithDistance[]> => {
      if (!user) return []

      const { data: familyData, error: familyError } = await supabase
        .from('family_profiles')
        .select('elderly_conditions, lat, lng')
        .eq('id', user.id)
        .single()

      if (familyError) throw familyError

      const conditions: string[] = familyData?.elderly_conditions ?? []
      const hasLocation = familyData?.lat != null && familyData?.lng != null

      // Se tem coordenadas, buscar por proximidade primeiro
      let proximityMap: Map<string, number> | null = null

      if (hasLocation) {
        const { data: nearbyIds, error: rpcError } = await supabase
          .rpc('search_caregivers_by_proximity', {
            p_lat: familyData.lat!,
            p_lng: familyData.lng!,
            p_radius_km: DEFAULT_RADIUS_KM,
          })

        if (!rpcError && nearbyIds && nearbyIds.length > 0) {
          proximityMap = new Map(
            (nearbyIds as { id: string; distance_km: number }[]).map((r) => [r.id, r.distance_km])
          )
        }
      }

      // Estratégia com fallback progressivo:
      // 1) proximidade + especialidade
      // 2) só especialidade
      // 3) qualquer cuidador com perfil completo
      const attempts: Array<{ useProximity: boolean; useSpecialty: boolean }> = []

      if (proximityMap && conditions.length > 0) {
        attempts.push({ useProximity: true, useSpecialty: true })
      }
      if (proximityMap) {
        attempts.push({ useProximity: true, useSpecialty: false })
      }
      if (conditions.length > 0) {
        attempts.push({ useProximity: false, useSpecialty: true })
      }
      attempts.push({ useProximity: false, useSpecialty: false })

      for (const attempt of attempts) {
        let q = supabase
          .from('caregiver_profiles')
          .select(CAREGIVER_SELECT)
          .eq('profile_complete', true)
          .order('average_rating', { ascending: false })

        if (attempt.useProximity && proximityMap) {
          q = q.in('id', Array.from(proximityMap.keys()))
        }
        if (attempt.useSpecialty && conditions.length > 0) {
          q = q.overlaps('specialties', conditions)
        }

        q = q.limit(limit)

        const { data, error } = await q
        if (error) throw error

        if (data && data.length > 0) {
          let results: CaregiverMatchWithDistance[] = data.map((row) => {
            const mapped = mapCaregiverRow(row)
            const distance = proximityMap?.get(mapped.id)
            return {
              ...mapped,
              distance_km: distance != null ? Math.round(distance * 10) / 10 : undefined,
            }
          })

          if (attempt.useProximity && proximityMap) {
            results.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
          }

          return results
        }
      }

      return []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
