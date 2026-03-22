import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic, CaregiverProfile, ProfessionalReference, CaregiverDocument, Review, ProfessionalRegType } from '@/types/database'

// ─── Tipo estendido para página de detalhe ──────────────────────────────────

export interface CaregiverPublicDetail extends CaregiverPublic {
  formacao_complementar: string | null
  pricing_note: string | null
  availability_notes: string | null
  journey_types: string[]
  area_type: string | null
  area_radius: string | null
  is_available_for_new: boolean
  professional_reg_type: ProfessionalRegType | null
  professional_reg_uf: string | null
  professional_reg_other_desc: string | null
  // Visibilidade de referências (flags do cuidador)
  show_refs_to_subscribers: boolean
  mask_reference_phones: boolean
  show_reference_full_names: boolean
  // Dados relacionados
  references: ProfessionalReference[]
  documents: Pick<CaregiverDocument, 'id' | 'type' | 'file_name' | 'file_url' | 'status'>[]
  reviews: Review[]
}

// Tipo bruto retornado pelo Supabase para o DETAIL_SELECT
type RawDetailRow = {
  id: string
  photo_url: string | null
  bio: string | null
  experience_years: number
  profissao_formacao: string | null
  formacao_complementar: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  price_per_hour: number | null
  price_per_day: number | null
  pricing_note: string | null
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
  professional_reg_type: ProfessionalRegType | null
  professional_reg_number: string | null
  professional_reg_uf: string | null
  professional_reg_other_desc: string | null
  is_available_for_new: boolean
  journey_types: string[]
  area_type: string | null
  area_radius: string | null
  availability_notes: string | null
  show_refs_to_subscribers: boolean
  mask_reference_phones: boolean
  show_reference_full_names: boolean
  profiles: { full_name: string | null } | null
}

// Select estendido para página de detalhe (não altera CAREGIVER_SELECT da busca)
const DETAIL_SELECT = `
  id,
  photo_url,
  bio,
  experience_years,
  profissao_formacao,
  formacao_complementar,
  neighborhood,
  city,
  state,
  price_per_hour,
  price_per_day,
  pricing_note,
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
  professional_reg_type,
  professional_reg_number,
  professional_reg_uf,
  professional_reg_other_desc,
  is_available_for_new,
  journey_types,
  area_type,
  area_radius,
  availability_notes,
  show_refs_to_subscribers,
  mask_reference_phones,
  show_reference_full_names,
  profiles!inner ( full_name )
` as const

export function usePublicCaregiverProfile(caregiverId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.publicCaregiverProfile(caregiverId ?? ''),
    queryFn: async (): Promise<CaregiverPublicDetail | null> => {
      if (!caregiverId) return null

      // 1) Perfil principal com campos estendidos
      const { data: profileData, error: profileError } = await supabase
        .from('caregiver_profiles')
        .select(DETAIL_SELECT)
        .eq('id', caregiverId)
        .eq('profile_complete', true)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') return null
        throw profileError
      }

      const row = profileData as unknown as RawDetailRow
      const base = mapCaregiverRow(row)

      // Verificar se a família tem assinatura ativa para acessar dados restritos
      let isSubscriber = false
      if (user) {
        const { data: familyData } = await supabase
          .from('family_profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()
        isSubscriber = familyData?.subscription_status === 'active'
      }

      // 2) Referências profissionais — apenas para assinantes
      //    aplicando mascaramento conforme flags de privacidade do cuidador
      let references: ProfessionalReference[] = []
      if (row.has_references && isSubscriber) {
        const { data: refsData } = await supabase
          .from('professional_references')
          .select('*')
          .eq('caregiver_id', caregiverId)
          .order('created_at', { ascending: true })

        if (refsData) {
          references = (refsData as ProfessionalReference[]).map((ref) => ({
            ...ref,
            phone: row.mask_reference_phones
              ? ref.phone.replace(/(\d{2})\d{4,5}(\d{4})/, '$1*****$2')
              : ref.phone,
            name: row.show_reference_full_names
              ? ref.name
              : ref.name.split(' ')[0] + (ref.name.includes(' ') ? ' ' + ref.name.split(' ').slice(1).map((n: string) => n[0] + '.').join(' ') : ''),
          }))
        }
      }

      // 3) Documentos visíveis (excluindo rg_cnh por privacidade) — apenas para assinantes
      let documents: Pick<CaregiverDocument, 'id' | 'type' | 'file_name' | 'file_url' | 'status'>[] = []
      if (isSubscriber) {
        const { data: docsData } = await supabase
          .from('caregiver_documents')
          .select('id, type, file_name, file_url, status')
          .eq('caregiver_id', caregiverId)
          .eq('is_visible', true)
          .neq('type', 'rg_cnh')
          .order('created_at', { ascending: true })

        if (docsData) {
          documents = docsData as typeof documents
        }
      }

      // 4) Avaliações
      let reviews: Review[] = []
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .order('created_at', { ascending: false })

      if (reviewsData) {
        reviews = reviewsData as Review[]
      }

      return {
        ...base,
        // Expor reg number na página de detalhe (diferente da busca pública)
        professional_reg_number: row.professional_reg_number ?? null,
        formacao_complementar: row.formacao_complementar ?? null,
        pricing_note: row.pricing_note ?? null,
        availability_notes: row.availability_notes ?? null,
        journey_types: row.journey_types ?? [],
        area_type: row.area_type ?? null,
        area_radius: row.area_radius ?? null,
        is_available_for_new: row.is_available_for_new ?? true,
        professional_reg_type: row.professional_reg_type ?? null,
        professional_reg_uf: row.professional_reg_uf ?? null,
        professional_reg_other_desc: row.professional_reg_other_desc ?? null,
        show_refs_to_subscribers: row.show_refs_to_subscribers ?? false,
        mask_reference_phones: row.mask_reference_phones ?? false,
        show_reference_full_names: row.show_reference_full_names ?? true,
        references,
        documents,
        reviews,
      }
    },
    enabled: !!user && !!caregiverId,
    staleTime: 0,
  })
}
