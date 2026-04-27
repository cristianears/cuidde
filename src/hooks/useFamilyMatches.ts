import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyProfile } from '@/hooks/useFamilyProfile'
import { queryKeys } from '@/lib/query-keys'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import { computeRankScore } from '@/lib/caregiver-rank'
import { abbreviateName } from '@/lib/privacy-masks'
import type { CaregiverPublic } from '@/types/database'

export type CaregiverMatchWithDistance = CaregiverPublic & {
  distance_km?: number
}

export function useFamilyMatches(limit = 3) {
  const { user } = useAuth()
  const { data: familyProfile } = useFamilyProfile()
  const isSubscriber = familyProfile?.subscription_status === 'active'

  return useQuery({
    queryKey: [...queryKeys.familyMatches(user?.id ?? '', limit), isSubscriber],
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

        if (attempt.useProximity && proximityMap) {
          q = q.in('id', Array.from(proximityMap.keys()))
        }
        if (attempt.useSpecialty && conditions.length > 0) {
          q = q.overlaps('specialties', conditions)
        }

        const { data, error } = await q
        if (error) throw error

        if (data && data.length > 0) {
          const results: CaregiverMatchWithDistance[] = data.map((row) => {
            const mapped = mapCaregiverRow(row)
            const distance = proximityMap?.get(mapped.id)
            return {
              ...mapped,
              distance_km: distance != null ? Math.round(distance * 10) / 10 : undefined,
            }
          })

          results.sort((a, b) => computeRankScore(b, DEFAULT_RADIUS_KM) - computeRankScore(a, DEFAULT_RADIUS_KM))

          const sliced = results.slice(0, limit)
          if (!isSubscriber) {
            return sliced.map((c) => ({
              ...c,
              full_name: c.full_name ? abbreviateName(c.full_name) : c.full_name,
            }))
          }
          return sliced
        }
      }

      return []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
