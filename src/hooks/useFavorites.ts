import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaregiverPublic } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface FavoriteWithCaregiver {
  favorite_id: string
  caregiver: CaregiverPublic
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

type RawCaregiver = {
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

function mapCaregiver(row: RawCaregiver): CaregiverPublic {
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lista os favoritos da família logada com dados completos do cuidador.
 */
export function useFavorites() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async (): Promise<FavoriteWithCaregiver[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          caregiver_id,
          caregiver_profiles!inner (
            ${CAREGIVER_SELECT}
          )
        `)
        .eq('family_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row: any) => ({
        favorite_id: row.id,
        caregiver: mapCaregiver(row.caregiver_profiles),
      }))
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

/**
 * Retorna um Set de caregiver_ids que a família favoritou.
 * Útil para checar rapidamente se um card está favoritado.
 */
export function useFavoriteIds() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorite_ids', user?.id],
    queryFn: async (): Promise<Set<string>> => {
      if (!user) return new Set()

      const { data, error } = await supabase
        .from('favorites')
        .select('caregiver_id')
        .eq('family_id', user.id)

      if (error) throw error

      return new Set((data ?? []).map((r: { caregiver_id: string }) => r.caregiver_id))
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

/**
 * Adiciona um cuidador aos favoritos da família logada.
 */
export function useAddFavorite() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (caregiverId: string) => {
      if (!user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('favorites')
        .insert({ family_id: user.id, caregiver_id: caregiverId })

      if (error) {
        if (error.code === '23505') return // já favoritado — ignora duplicata silenciosamente
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', user?.id] })
      qc.invalidateQueries({ queryKey: ['favorite_ids', user?.id] })
    },
    onError: () => {
      toast.error('Erro ao adicionar favorito.')
    },
  })
}

/**
 * Remove um cuidador dos favoritos da família logada.
 */
export function useRemoveFavorite() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (caregiverId: string) => {
      if (!user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('family_id', user.id)
        .eq('caregiver_id', caregiverId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', user?.id] })
      qc.invalidateQueries({ queryKey: ['favorite_ids', user?.id] })
    },
    onError: () => {
      toast.error('Erro ao remover favorito.')
    },
  })
}
