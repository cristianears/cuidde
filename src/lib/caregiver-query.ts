import type { CaregiverPublic } from '@/types/database'

// ─── SELECT compartilhado para queries de cuidadores ────────────────────────

// SEGURANÇA: whatsapp, professional_reg_number, lat e lng removidos da query pública.
// lat/lng são usados apenas server-side pela RPC search_caregivers_by_proximity.
// Expor coordenadas permitiria localizar a residência exata do cuidador.
export const CAREGIVER_SELECT = `
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
  emergency_available,
  has_rg_cnh,
  has_antecedentes,
  has_certificado,
  has_references,
  zona,
  cep,
  profiles!inner ( full_name )
` as const

// ─── Tipo bruto retornado pelo Supabase ─────────────────────────────────────

export type RawCaregiverRow = {
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
  emergency_available: boolean
  has_rg_cnh: boolean
  has_antecedentes: boolean
  has_certificado: boolean
  has_references: boolean
  zona: string | null
  cep: string | null
  profiles: { full_name: string | null } | null
}

// ─── Mapper de RawRow → CaregiverPublic ─────────────────────────────────────

export function mapCaregiverRow(row: RawCaregiverRow): CaregiverPublic {
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
    professional_reg_number: null, // Protegido: não exposto na busca pública
    emergency_available: row.emergency_available,
    whatsapp: null, // Protegido: não exposto na busca pública
    has_rg_cnh: row.has_rg_cnh,
    has_antecedentes: row.has_antecedentes,
    has_certificado: row.has_certificado,
    has_references: row.has_references,
    zona: row.zona as CaregiverPublic['zona'],
    cep: row.cep,
  }
}
