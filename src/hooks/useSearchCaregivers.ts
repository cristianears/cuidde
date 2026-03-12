import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CaregiverPublic } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string           // busca por nome, bairro ou cidade
  city?: string            // filtro de cidade
  neighborhood?: string    // filtro de bairro
  specialties?: string[]   // must match at least one
  minPrice?: number
  maxPrice?: number
  minRating?: number
  emergencyOnly?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CAREGIVER_SELECT = `
  id,
  photo_url,
  bio,
  experience_years,
  profissao_formacao,
  neighborhood,
  city,
  state,
  price_per_hour,
  price_per_day,
  average_rating,
  review_count,
  specialties,
  possui_cnh,
  has_insurance,
  professional_reg_number,
  emergency_available,
  whatsapp,
  has_rg_cnh,
  has_antecedentes,
  has_certificado,
  has_references,
  profiles!inner ( full_name )
` as const

type RawRow = {
  id: string
  photo_url: string | null
  bio: string | null
  experience_years: number
  profissao_formacao: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  price_per_hour: number | null
  price_per_day: number | null
  average_rating: number
  review_count: number
  specialties: string[]
  possui_cnh: boolean
  has_insurance: boolean
  professional_reg_number: string | null
  emergency_available: boolean
  whatsapp: string | null
  has_rg_cnh: boolean
  has_antecedentes: boolean
  has_certificado: boolean
  has_references: boolean
  profiles: { full_name: string | null } | null
}

function mapRow(row: RawRow): CaregiverPublic {
  return {
    id: row.id,
    full_name: row.profiles?.full_name ?? null,
    photo_url: row.photo_url,
    bio: row.bio,
    experience_years: row.experience_years,
    profissao_formacao: row.profissao_formacao as CaregiverPublic['profissao_formacao'],
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    price_per_hour: row.price_per_hour,
    price_per_day: row.price_per_day,
    average_rating: row.average_rating,
    review_count: row.review_count,
    specialties: row.specialties ?? [],
    possui_cnh: row.possui_cnh,
    has_insurance: row.has_insurance,
    professional_reg_number: row.professional_reg_number,
    emergency_available: row.emergency_available,
    whatsapp: row.whatsapp,
    has_rg_cnh: row.has_rg_cnh,
    has_antecedentes: row.has_antecedentes,
    has_certificado: row.has_certificado,
    has_references: row.has_references,
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSearchCaregivers(filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['caregivers', 'search', filters],
    queryFn: async (): Promise<CaregiverPublic[]> => {
      // Aparece na busca apenas quem completou o perfil mínimo (calculado por trigger no banco)
      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('profile_complete', true)

      // Filtro por cidade (ilike = case-insensitive)
      if (filters.city && filters.city.trim()) {
        q = q.ilike('city', `%${filters.city.trim()}%`)
      }

      // Filtro por bairro
      if (filters.neighborhood && filters.neighborhood.trim()) {
        q = q.ilike('neighborhood', `%${filters.neighborhood.trim()}%`)
      }

      // Preço mínimo
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        q = q.gte('price_per_hour', filters.minPrice)
      }

      // Preço máximo
      if (filters.maxPrice !== undefined && filters.maxPrice < 9999) {
        q = q.lte('price_per_hour', filters.maxPrice)
      }

      // Avaliação mínima
      if (filters.minRating && filters.minRating > 0) {
        q = q.gte('average_rating', filters.minRating)
      }

      // Disponibilidade emergencial
      if (filters.emergencyOnly) {
        q = q.eq('emergency_available', true)
      }

      // Especialidades (array contains any)
      if (filters.specialties && filters.specialties.length > 0) {
        q = q.overlaps('specialties', filters.specialties)
      }

      // Ordenação: melhor avaliação primeiro
      q = q.order('average_rating', { ascending: false })

      const { data, error } = await q

      if (error) throw error

      let rows = (data ?? []).map(mapRow)

      // Filtro por nome/bairro/cidade via query text (client-side, para busca geral)
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
    staleTime: 30_000,
  })
}
