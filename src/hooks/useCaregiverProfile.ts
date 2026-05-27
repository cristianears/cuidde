import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type { CaregiverProfile, ProfessionalReference } from '@/types/database'
import { resolveAndSaveCoords } from '@/lib/geocode'
import { uploadAvatar } from '@/lib/upload-avatar'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CaregiverProfileFull = CaregiverProfile & {
  profiles: {
    full_name: string | null
    phone: string | null
  }
}

export interface UpdateBasicPayload {
  full_name: string
  phone: string
  whatsapp: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zona: 'zona_norte' | 'zona_sul' | 'zona_leste' | 'zona_oeste' | 'centro' | null
  possui_cnh: boolean
  categoria_cnh: string | null
}

export interface UpdateBioPayload {
  bio: string
  profissao_formacao: string | null
  formacao_complementar: string
  idiomas: string[]
  has_insurance: boolean
}

export interface UpdateSpecialtiesPayload {
  specialties: string[]
  modalities: string[]
  experience_years: number
  emergency_available: boolean
}

export interface UpdateReferencesPayload {
  references: Omit<ProfessionalReference, 'id' | 'caregiver_id' | 'created_at'>[]
  show_refs_to_subscribers: boolean
  mask_reference_phones: boolean
  show_reference_full_names: boolean
}

export interface UpdateAvailabilityPayload {
  is_available_for_new: boolean
  journey_types: string[]
  availability_notes: string
}

export interface UpdatePricingPayload {
  price_per_hour: number | null
  price_per_day: number | null
  pricing_note: string
}

// ─── Query Keys (centralizadas em @/lib/query-keys) ─────────────────────────

const PROFILE_KEY = queryKeys.caregiverProfile
const REFS_KEY = queryKeys.professionalRefs

// ─── Query: perfil completo ───────────────────────────────────────────────────

export function useCaregiverProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: PROFILE_KEY(user?.id ?? ''),
    queryFn: async (): Promise<CaregiverProfileFull> => {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .select('*, profiles!inner(full_name, phone)')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      return data as CaregiverProfileFull
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

// ─── Auto-geocodificar perfil do cuidador (backfill lat/lng) ─────────────────

export function useAutoGeocodeCaregiver(profile: CaregiverProfileFull | undefined) {
  const { user } = useAuth()
  const qc = useQueryClient()

  const hasLocation = profile?.lat != null && profile?.lng != null
  const cep = profile?.cep ?? ''
  const city = profile?.city ?? ''
  const state = profile?.state ?? ''
  const userId = user?.id

  useEffect(() => {
    if (hasLocation || !userId || !profile) return
    if (!cep && !(city && state)) return

    let cancelled = false
    ;(async () => {
      await resolveAndSaveCoords('caregiver_profiles', userId, { cep, city, state })
      if (!cancelled) {
        qc.invalidateQueries({ queryKey: PROFILE_KEY(userId) })
      }
    })()
    return () => { cancelled = true }
  }, [hasLocation, cep, city, state, userId, profile, qc])
}

// ─── Query: referências profissionais ────────────────────────────────────────

export function useProfessionalReferences() {
  const { user } = useAuth()

  return useQuery({
    queryKey: REFS_KEY(user?.id ?? ''),
    queryFn: async (): Promise<ProfessionalReference[]> => {
      const { data, error } = await supabase
        .from('professional_references')
        .select('*')
        .eq('caregiver_id', user!.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

// ─── Mutation: dados básicos (step 1) ────────────────────────────────────────

export function useUpdateCaregiverBasic() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateBasicPayload) => {
      // Ambas as tabelas são independentes — paralelizar para reduzir latência
      const [{ data: profileData, error: profileError }, { error: caregiverError }] = await Promise.all([
        supabase
          .from('profiles')
          .update({ full_name: payload.full_name, phone: payload.phone })
          .eq('id', user!.id)
          .select('id'),
        supabase
          .from('caregiver_profiles')
          .upsert({
            id: user!.id,
            whatsapp: payload.whatsapp,
            cep: payload.cep,
            street: payload.street,
            number: payload.number,
            complement: payload.complement || null,
            neighborhood: payload.neighborhood,
            city: payload.city,
            state: payload.state,
            zona: payload.zona ?? null,
            possui_cnh: payload.possui_cnh,
            categoria_cnh: payload.possui_cnh ? payload.categoria_cnh : null,
          }, { onConflict: 'id' }),
      ])

      if (profileError) throw profileError
      if (!profileData || profileData.length === 0) throw new Error('0 linhas atualizadas em profiles.')
      if (caregiverError) throw caregiverError

      // Geocodificar endereço (best-effort — não bloqueia o save)
      await resolveAndSaveCoords('caregiver_profiles', user!.id, {
        cep: payload.cep, city: payload.city, state: payload.state,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Dados básicos salvos com sucesso.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: biografia (step 2) ────────────────────────────────────────────

export function useUpdateCaregiverBio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateBioPayload) => {
      const { error } = await supabase
        .from('caregiver_profiles')
        .upsert({
          id: user!.id,
          bio: payload.bio || null,
          profissao_formacao: payload.profissao_formacao || null,
          formacao_complementar: payload.formacao_complementar || null,
          idiomas: payload.idiomas,
          has_insurance: payload.has_insurance,
        }, { onConflict: 'id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Biografia salva com sucesso.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: especialidades (step 3) ───────────────────────────────────────

export function useUpdateCaregiverSpecialties() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateSpecialtiesPayload) => {
      const { error } = await supabase
        .from('caregiver_profiles')
        .upsert({
          id: user!.id,
          specialties: payload.specialties,
          modalities: payload.modalities,
          experience_years: payload.experience_years,
          emergency_available: payload.emergency_available,
        }, { onConflict: 'id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Especialidades salvas com sucesso.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: referências (step 4) ──────────────────────────────────────────

export function useUpdateCaregiverReferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateReferencesPayload) => {
      // RPC atômica: delete + insert + update de prefs em uma única transação
      // (evita perda de referências se o insert falhar após o delete)
      const { error } = await supabase.rpc('replace_professional_references', {
        p_caregiver_id: user!.id,
        p_refs: payload.references.map((ref) => ({
          name: ref.name,
          phone: ref.phone,
          workplace: ref.workplace,
          position: ref.position,
          work_duration: ref.work_duration,
          notes: ref.notes,
        })),
        p_show_refs_to_subscribers: payload.show_refs_to_subscribers,
        p_mask_reference_phones: payload.mask_reference_phones,
        p_show_reference_full_names: payload.show_reference_full_names,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REFS_KEY(user!.id) })
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Referências salvas com sucesso.')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao salvar. Tente novamente.'),
  })
}

// ─── Mutation: upload de foto ─────────────────────────────────────────────────

export function useUploadCaregiverPhoto() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      return uploadAvatar(file, user!.id, 'caregiver_profiles', { cacheBust: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Foto atualizada com sucesso.')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao enviar foto. Tente novamente.'),
  })
}

// ─── Mutation: disponibilidade ────────────────────────────────────────────────

export function useUpdateAvailability() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateAvailabilityPayload) => {
      const { error } = await supabase
        .from('caregiver_profiles')
        .upsert({
          id: user!.id,
          is_available_for_new: payload.is_available_for_new,
          journey_types: payload.journey_types,
          availability_notes: payload.availability_notes || null,
        }, { onConflict: 'id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Disponibilidade atualizada com sucesso.')
    },
    onError: () => toast.error('Erro ao salvar. Tente novamente.'),
  })
}

// ─── Mutation: preços ─────────────────────────────────────────────────────────

export function useUpdatePricing() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdatePricingPayload) => {
      const { error } = await supabase
        .from('caregiver_profiles')
        .upsert({
          id: user!.id,
          price_per_hour: payload.price_per_hour,
          price_per_day: payload.price_per_day,
          pricing_note: payload.pricing_note || null,
        }, { onConflict: 'id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Valores salvos com sucesso.')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao salvar. Tente novamente.'),
  })
}

// ─── Mutation: toggle de visibilidade ────────────────────────────────────────

export function useToggleVisibility() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isVisible: boolean) => {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .update({ is_visible: isVisible })
        .eq('id', user!.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS ou se a linha existe.')
    },
    onSuccess: (_, isVisible) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success(isVisible ? 'Perfil agora visível no marketplace.' : 'Perfil ocultado do marketplace.')
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao atualizar visibilidade.'),
  })
}
