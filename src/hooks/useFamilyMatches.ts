import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaregiverPublic } from '@/types/database'

// Reutiliza o mesmo select e mapRow do useSearchCaregivers
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
  }
}

/**
 * Busca cuidadores cujas especialidades têm interseção com as condições
 * de saúde do idoso da família logada (family_profiles.elderly_conditions).
 * Usado no "Cuidadores recomendados" do FamilyDashboard.
 */
export function useFamilyMatches(limit = 3) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['family_matches', user?.id, limit],
    queryFn: async (): Promise<CaregiverPublic[]> => {
      if (!user) return []

      // 1. Buscar condições de saúde do idoso
      const { data: familyData, error: familyError } = await supabase
        .from('family_profiles')
        .select('elderly_conditions')
        .eq('id', user.id)
        .single()

      if (familyError) throw familyError

      const conditions: string[] = familyData?.elderly_conditions ?? []

      // 2. Montar query de cuidadores
      let q = supabase
        .from('caregiver_profiles')
        .select(CAREGIVER_SELECT)
        .eq('status', 'verified')
        .eq('is_visible', true)
        .order('average_rating', { ascending: false })
        .limit(limit)

      // Se há condições registradas, filtrar por sobreposição de especialidades
      if (conditions.length > 0) {
        q = q.overlaps('specialties', conditions)
      }

      const { data, error } = await q

      if (error) throw error

      return (data ?? []).map(mapRow)
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
