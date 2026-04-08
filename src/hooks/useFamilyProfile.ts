import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { resolveAndSaveCoords } from '@/lib/geocode'
import { uploadAvatar } from '@/lib/upload-avatar'
import type { FamilyProfile, ElderlyMedication } from '@/types/database'

export type FamilyProfileFull = FamilyProfile & {
  profiles: {
    full_name: string | null
    phone: string | null
  }
}

export function useFamilyProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.familyProfile(user?.id ?? ''),
    queryFn: async (): Promise<FamilyProfileFull | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('family_profiles')
        .select('*, profiles!inner(full_name, phone)')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as FamilyProfileFull
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// ─── Mutation: upload de foto do responsável ─────────────────────────────────

export function useUploadFamilyPhoto() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      return uploadAvatar(file, user!.id, 'family_profiles', { cacheBust: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Foto atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar foto.')
    },
  })
}

// ─── Mutation: remover foto do responsável ───────────────────────────────────

export function useRemoveFamilyPhoto() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('family_profiles')
        .update({ photo_url: null })
        .eq('id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Foto removida.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao remover foto.')
    },
  })
}

// ─── Payload para atualização de endereço da família ─────────────────────────

export interface UpdateFamilyAddressPayload {
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}

// ─── Mutation: atualizar endereço e geocodificar ─────────────────────────────

export function useUpdateFamilyAddress() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateFamilyAddressPayload) => {
      const { data, error } = await supabase
        .from('family_profiles')
        .update({
          cep: payload.cep,
          street: payload.street,
          number: payload.number,
          neighborhood: payload.neighborhood,
          city: payload.city,
          state: payload.state,
        })
        .eq('id', user!.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS ou se a linha existe.')

      await resolveAndSaveCoords('family_profiles', user!.id, {
        cep: payload.cep, city: payload.city, state: payload.state,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Endereço salvo com sucesso.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar endereço. Tente novamente.')
    },
  })
}

// ─── Payload completo para salvar todo o perfil da família ───────────────────

export interface UpdateFamilyProfilePayload {
  // Responsável
  full_name: string
  phone: string
  relationship: string
  // Endereço
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  // Idoso
  elderly_name: string
  elderly_age: number | null
  elderly_conditions: string[]
  blood_type: string
  pre_existing_conditions: string
  allergies: string
  continuous_medications: string
  responsible_doctor: string
  health_insurance: string
  care_needs: string
  // Medicamentos do idoso
  elderly_medications: ElderlyMedication[]
  // Preferências
  service_formats: string[]
  hourly_range_min: number | null
  hourly_range_max: number | null
  daily_range_min: number | null
  daily_range_max: number | null
  distance_preference: string
}

// ─── Mutation: salvar perfil completo ────────────────────────────────────────

export function useUpdateFamilyProfileFull() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateFamilyProfilePayload) => {
      // Ambas as tabelas são independentes — paralelizar para reduzir latência
      const [
        { data: profileData, error: profileError },
        { data: familyData, error: familyError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .update({ full_name: payload.full_name, phone: payload.phone })
          .eq('id', user!.id)
          .select('id'),
        supabase
          .from('family_profiles')
          .update({
            relationship: payload.relationship,
            cep: payload.cep,
            street: payload.street,
            number: payload.number,
            neighborhood: payload.neighborhood,
            city: payload.city,
            state: payload.state,
            elderly_name: payload.elderly_name,
            elderly_age: payload.elderly_age,
            elderly_conditions: payload.elderly_conditions,
            blood_type: payload.blood_type,
            pre_existing_conditions: payload.pre_existing_conditions || null,
            allergies: payload.allergies || null,
            continuous_medications: payload.continuous_medications || null,
            responsible_doctor: payload.responsible_doctor || null,
            health_insurance: payload.health_insurance || null,
            care_needs: payload.care_needs || null,
            elderly_medications: payload.elderly_medications ?? [],
            service_formats: payload.service_formats,
            hourly_range_min: payload.hourly_range_min,
            hourly_range_max: payload.hourly_range_max,
            daily_range_min: payload.daily_range_min,
            daily_range_max: payload.daily_range_max,
            distance_preference: payload.distance_preference || null,
          })
          .eq('id', user!.id)
          .select('id'),
      ])

      if (profileError) throw profileError
      if (!profileData || profileData.length === 0) throw new Error('0 linhas atualizadas em profiles.')
      if (familyError) throw familyError
      if (!familyData || familyData.length === 0) throw new Error('0 linhas atualizadas em family_profiles.')

      // Geocodificar endereço (best-effort)
      await resolveAndSaveCoords('family_profiles', user!.id, {
        cep: payload.cep, city: payload.city, state: payload.state,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Perfil atualizado com sucesso.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar perfil. Tente novamente.')
    },
  })
}
