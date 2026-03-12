import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaregiverPublic } from '@/types/database'

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
  modalities,
  idiomas,
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
  modalities: string[]
  idiomas: string[]
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
    modalities: row.modalities ?? [],
    idiomas: row.idiomas ?? [],
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

export function useFamilyMatches(limit = 3) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['family_matches', user?.id, limit],
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

      return (data ?? []).map(mapRow)
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
