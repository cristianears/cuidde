import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { maskPhoneBrazilian, abbreviateName } from '@/lib/privacy-masks'
import type { CaregiverPublic, ProfessionalReference, CaregiverDocument, Review, ProfessionalRegType } from '@/types/database'

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
  // Controle de acesso
  isSubscriber: boolean
  // Dados relacionados
  references: ProfessionalReference[]
  reference_count: number
  documents: Pick<CaregiverDocument, 'id' | 'type' | 'file_name' | 'file_url' | 'status'>[]
  reviews: Review[]
}

// Shape do retorno da RPC get_caregiver_public_detail (gating server-side).
// Campos sensíveis (full_name, professional_reg_number) vêm como null
// quando o caller não é assinante/admin — masking acontece no banco.
type GatedDetailPayload = {
  id: string
  full_name: string | null
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
  cep: string | null
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
  is_subscriber: boolean
  is_admin: boolean
}

export function usePublicCaregiverProfile(caregiverId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.publicCaregiverProfile(caregiverId ?? ''),
    queryFn: async (): Promise<CaregiverPublicDetail | null> => {
      if (!caregiverId) return null

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_caregiver_public_detail',
        { p_caregiver_id: caregiverId },
      )

      if (rpcError) throw rpcError
      if (!rpcData) return null

      const row = rpcData as GatedDetailPayload
      const isSubscriber = row.is_subscriber

      const base: CaregiverPublic = {
        id: row.id,
        full_name: row.full_name,
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
        whatsapp: null,
        has_rg_cnh: row.has_rg_cnh,
        has_antecedentes: row.has_antecedentes,
        has_certificado: row.has_certificado,
        has_references: row.has_references,
        zona: row.zona as CaregiverPublic['zona'],
        cep: row.cep,
        is_available_for_new: row.is_available_for_new,
      }

      // Reviews are independent of subscriber-gated data — run in parallel
      const reviewsQuery = supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .order('created_at', { ascending: false })

      let references: ProfessionalReference[] = []
      let referenceCount = 0
      let documents: Pick<CaregiverDocument, 'id' | 'type' | 'file_name' | 'file_url' | 'status'>[] = []
      let reviews: Review[] = []

      if (isSubscriber) {
        // Refs and docs hit different tables — fetch both in parallel with reviews
        const refsQuery = (row.has_references && row.show_refs_to_subscribers)
          ? supabase.from('professional_references').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: true })
          : Promise.resolve({ data: null as ProfessionalReference[] | null })

        const docsQuery = supabase
          .from('caregiver_documents')
          .select('id, type, file_name, file_url, status')
          .eq('caregiver_id', caregiverId)
          .eq('is_visible', true)
          .neq('type', 'rg_cnh')
          .order('created_at', { ascending: true })

        const [refsResult, docsResult, reviewsResult] = await Promise.all([refsQuery, docsQuery, reviewsQuery])

        if (refsResult.data) {
          references = refsResult.data.map((ref) => ({
            ...ref,
            phone: row.mask_reference_phones ? maskPhoneBrazilian(ref.phone) : ref.phone,
            name: row.show_reference_full_names ? ref.name : abbreviateName(ref.name),
          }))
          referenceCount = references.length
        }
        if (docsResult.data) documents = docsResult.data as typeof documents
        reviews = (reviewsResult.data as Review[]) ?? []
      } else {
        // Non-subscriber: gated preview via SECURITY DEFINER RPC (no file_url exposed)
        const [previewResult, reviewsResult] = await Promise.all([
          supabase.rpc('get_caregiver_gated_preview', { p_caregiver_id: caregiverId }),
          reviewsQuery,
        ])

        const preview = (previewResult.data ?? {}) as {
          documents?: Array<{ id: string; type: string; file_name: string | null; status: string }>
          reference_count?: number
        }
        documents = (preview.documents ?? []).map((d) => ({
          id: d.id,
          type: d.type as CaregiverDocument['type'],
          file_name: d.file_name,
          file_url: null,
          status: d.status as CaregiverDocument['status'],
        }))
        referenceCount = preview.reference_count ?? 0
        reviews = (reviewsResult.data as Review[]) ?? []
      }

      return {
        ...base,
        isSubscriber,
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
        reference_count: referenceCount,
        documents,
        reviews,
      }
    },
    enabled: !!user && !!caregiverId,
  })
}
