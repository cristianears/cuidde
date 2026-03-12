import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaregiverProfile, ProfessionalReference } from '@/types/database'

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
  area_type: string
  area_radius: string | null
  availability_notes: string
}

export interface UpdatePricingPayload {
  price_per_hour: number | null
  price_per_day: number | null
  pricing_note: string
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const PROFILE_KEY = (userId: string) => ['caregiverProfile', userId]
const REFS_KEY = (userId: string) => ['professionalReferences', userId]

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
  })
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: payload.full_name, phone: payload.phone })
        .eq('id', user!.id)

      if (profileError) throw profileError

      const { error } = await supabase
        .from('caregiver_profiles')
        .update({
          whatsapp: payload.whatsapp,
          cep: payload.cep,
          street: payload.street,
          number: payload.number,
          complement: payload.complement || null,
          neighborhood: payload.neighborhood,
          city: payload.city,
          state: payload.state,
          possui_cnh: payload.possui_cnh,
          categoria_cnh: payload.possui_cnh ? payload.categoria_cnh : null,
        })
        .eq('id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Dados básicos salvos com sucesso.')
    },
    onError: (error: unknown) => {
      console.error('[useUpdateCaregiverBasic]', error)
      const msg = (error as { message?: string })?.message
      toast.error(msg ? `Erro: ${msg}` : 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: biografia (step 2) ────────────────────────────────────────────

export function useUpdateCaregiverBio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateBioPayload) => {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .update({
          bio: payload.bio || null,
          profissao_formacao: payload.profissao_formacao || null,
          formacao_complementar: payload.formacao_complementar || null,
          idiomas: payload.idiomas,
          has_insurance: payload.has_insurance,
        })
        .eq('id', user!.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS ou se a linha existe.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Biografia salva com sucesso.')
    },
    onError: (error: unknown) => {
      console.error('[useUpdateCaregiverBio]', error)
      const msg = (error as { message?: string })?.message
      toast.error(msg ? `Erro: ${msg}` : 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: especialidades (step 3) ───────────────────────────────────────

export function useUpdateCaregiverSpecialties() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateSpecialtiesPayload) => {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .update({
          specialties: payload.specialties,
          modalities: payload.modalities,
          experience_years: payload.experience_years,
          emergency_available: payload.emergency_available,
        })
        .eq('id', user!.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS ou se a linha existe.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Especialidades salvas com sucesso.')
    },
    onError: (error: unknown) => {
      console.error('[useUpdateCaregiverSpecialties]', error)
      const msg = (error as { message?: string })?.message
      toast.error(msg ? `Erro: ${msg}` : 'Erro ao salvar. Tente novamente.')
    },
  })
}

// ─── Mutation: referências (step 4) ──────────────────────────────────────────

export function useUpdateCaregiverReferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateReferencesPayload) => {
      // Deleta todas as referências existentes e reinserindo as novas
      const { error: deleteError } = await supabase
        .from('professional_references')
        .delete()
        .eq('caregiver_id', user!.id)

      if (deleteError) throw deleteError

      if (payload.references.length > 0) {
        const { error: insertError } = await supabase
          .from('professional_references')
          .insert(
            payload.references.map((ref) => ({
              caregiver_id: user!.id,
              name: ref.name,
              phone: ref.phone,
              workplace: ref.workplace,
              position: ref.position,
              work_duration: ref.work_duration,
              notes: ref.notes,
            }))
          )

        if (insertError) throw insertError
      }

      const { error: prefError } = await supabase
        .from('caregiver_profiles')
        .update({
          show_refs_to_subscribers: payload.show_refs_to_subscribers,
          mask_reference_phones: payload.mask_reference_phones,
          show_reference_full_names: payload.show_reference_full_names,
        })
        .eq('id', user!.id)

      if (prefError) throw prefError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REFS_KEY(user!.id) })
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Referências salvas com sucesso.')
    },
    onError: () => toast.error('Erro ao salvar. Tente novamente.'),
  })
}

// ─── Mutation: upload de foto ─────────────────────────────────────────────────

export function useUploadCaregiverPhoto() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('caregiver_profiles')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', user!.id)

      if (updateError) throw updateError

      return urlData.publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Foto atualizada com sucesso.')
    },
    onError: () => toast.error('Erro ao enviar foto. Tente novamente.'),
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
        .update({
          is_available_for_new: payload.is_available_for_new,
          journey_types: payload.journey_types,
          area_type: payload.area_type,
          area_radius: payload.area_radius,
          availability_notes: payload.availability_notes || null,
        })
        .eq('id', user!.id)

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
        .update({
          price_per_hour: payload.price_per_hour,
          price_per_day: payload.price_per_day,
          pricing_note: payload.pricing_note || null,
        })
        .eq('id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success('Valores salvos com sucesso.')
    },
    onError: () => toast.error('Erro ao salvar. Tente novamente.'),
  })
}

// ─── Mutation: toggle de visibilidade ────────────────────────────────────────

export function useToggleVisibility() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isVisible: boolean) => {
      const { error } = await supabase
        .from('caregiver_profiles')
        .update({ is_visible: isVisible })
        .eq('id', user!.id)

      if (error) throw error
    },
    onSuccess: (_, isVisible) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(user!.id) })
      toast.success(isVisible ? 'Perfil agora visível no marketplace.' : 'Perfil ocultado do marketplace.')
    },
    onError: () => toast.error('Erro ao atualizar visibilidade.'),
  })
}
