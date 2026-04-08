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

// ─── Score de ranking composto (0–100) ───────────────────────────────────────
// Calculado client-side após o fetch para evitar SQL complexo.
// Pesos ajustáveis sem migração.

const GLOBAL_MEAN_RATING = 4.0  // média global assumida para Bayesian
const BAYESIAN_K = 5            // peso da média global (equivale a 5 avaliações "fantasma")

// Score composto máximo teórico: qualidade (~114 pts) + distância (10 pts) = ~124 pts
// A distância vale no máximo ~8% do score total — qualidade domina.
function computeRankScore(c: CaregiverPublicWithDistance, radiusKm: number): number {
  // 1. Qualidade da avaliação — Bayesian average escalado para 0–20
  const bayesian =
    (BAYESIAN_K * GLOBAL_MEAN_RATING + c.review_count * c.average_rating) /
    (BAYESIAN_K + c.review_count)
  const ratingScore = (bayesian / 5) * 20

  // 2. Completude do perfil — 0–46 pts
  let completeness = 0
  if (c.photo_url)                         completeness += 15
  if (c.bio && c.bio.length >= 100)        completeness += 10
  if (c.specialties.length >= 2)           completeness += 8
  if (c.profissao_formacao)                completeness += 5
  if (c.modalities.length >= 1)            completeness += 4
  if (c.price_per_hour != null)            completeness += 4

  // 3. Confiança / documentação — 0–45 pts
  let trust = 0
  if (c.has_references)   trust += 20
  if (c.has_antecedentes) trust += 10
  if (c.has_certificado)  trust += 7
  if (c.has_insurance)    trust += 5
  if (c.has_rg_cnh)       trust += 3

  // 4. Disponibilidade — 0–3 pts
  const availability = c.emergency_available ? 3 : 0

  // 5. Proximidade — 0–10 pts (contínuo, não bucket)
  // Cuidador a 0km = +10 pts; a 20km (raio) = +0 pts; sem coordenada = +0 pts
  const distanceBonus = c.distance_km != null
    ? Math.max(0, (1 - c.distance_km / radiusKm) * 10)
    : 0

  return ratingScore + completeness + trust + availability + distanceBonus
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

  const query = useQuery({
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

        // Se nenhum cuidador dentro do raio, retornar lista vazia
        // (respeitar o filtro de proximidade — não fazer fallback)
        if (proximityMap.size === 0) {
          return []
        }
      }

      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('profile_complete', true)
        .eq('is_available_for_new', true)

      // Se usando proximidade, filtrar pelos IDs retornados pela RPC
      if (proximityMap) {
        const ids = Array.from(proximityMap.keys())
        q = q.in('id', ids)
      }

      // Filtros de cidade/bairro: usados quando não há proximidade OU como fallback
      if (!proximityMap) {
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

      // Ordenação por score composto DESC.
      // Distância já está embutida no score como bônus contínuo (0–10 pts),
      // sem buckets — qualidade (0–114 pts) domina.
      const radius = filters.radiusKm ?? DEFAULT_RADIUS_KM
      rows.sort((a, b) => computeRankScore(b, radius) - computeRankScore(a, radius))

      return rows
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  return query
}
