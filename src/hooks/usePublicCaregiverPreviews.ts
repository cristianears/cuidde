import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { CaregiverPublic } from '@/types/database'

export type PublicCaregiverPreview = CaregiverPublic & {
  distance_km?: number
}

type PublicCaregiverPreviewRow = {
  id: string
  display_name: string | null
  photo_url: string | null
  bio_preview: string | null
  experience_years: number | null
  profissao_formacao: CaregiverPublic['profissao_formacao']
  city: string | null
  state: string | null
  price_per_hour: number | null
  price_per_day: number | null
  average_rating: number | null
  review_count: number | null
  specialties: string[] | null
  modalities: string[] | null
  idiomas: string[] | null
  possui_cnh: boolean | null
  has_insurance: boolean | null
  emergency_available: boolean | null
  has_rg_cnh: boolean | null
  has_antecedentes: boolean | null
  has_certificado: boolean | null
  has_references: boolean | null
  distance_km: number | null
}

type UsePublicCaregiverPreviewsParams = {
  lat?: number | null
  lng?: number | null
  radiusKm?: number
  limit?: number
}

function mapPreviewRow(row: PublicCaregiverPreviewRow): PublicCaregiverPreview {
  return {
    id: row.id,
    full_name: row.display_name,
    photo_url: row.photo_url,
    bio: row.bio_preview,
    experience_years: row.experience_years ?? 0,
    profissao_formacao: row.profissao_formacao,
    neighborhood: null,
    city: row.city,
    state: row.state,
    zona: null,
    cep: null,
    price_per_hour: row.price_per_hour,
    price_per_day: row.price_per_day,
    average_rating: row.average_rating ?? 0,
    review_count: row.review_count ?? 0,
    specialties: row.specialties ?? [],
    possui_cnh: row.possui_cnh ?? false,
    has_insurance: row.has_insurance ?? false,
    professional_reg_number: null,
    emergency_available: row.emergency_available ?? false,
    whatsapp: null,
    modalities: row.modalities ?? [],
    idiomas: row.idiomas ?? [],
    has_rg_cnh: row.has_rg_cnh ?? false,
    has_antecedentes: row.has_antecedentes ?? false,
    has_certificado: row.has_certificado ?? false,
    has_references: row.has_references ?? false,
    is_available_for_new: true,
    distance_km: row.distance_km != null ? Math.round(row.distance_km * 10) / 10 : undefined,
  }
}

export function usePublicCaregiverPreviews({
  lat,
  lng,
  radiusKm = DEFAULT_RADIUS_KM,
  limit = 5,
}: UsePublicCaregiverPreviewsParams) {
  return useQuery({
    queryKey: ['caregivers', 'public-preview', lat, lng, radiusKm, limit] as const,
    queryFn: async (): Promise<PublicCaregiverPreview[]> => {
      const { data, error } = await supabase.rpc('public_search_caregiver_previews', {
        p_lat: lat!,
        p_lng: lng!,
        p_radius_km: radiusKm,
        p_limit: limit,
      })

      if (error) throw error

      return ((data ?? []) as PublicCaregiverPreviewRow[]).map(mapPreviewRow)
    },
    enabled: lat != null && lng != null,
    staleTime: 60_000,
  })
}
