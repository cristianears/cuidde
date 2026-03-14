import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CAREGIVER_SELECT, mapCaregiverRow } from '@/lib/caregiver-query'
import type { CaregiverPublic } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface FavoriteWithCaregiver {
  favorite_id: string
  caregiver: CaregiverPublic
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
        caregiver: mapCaregiverRow(row.caregiver_profiles),
      }))
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

/**
 * Retorna um array de caregiver_ids que a família favoritou.
 * Útil para checar rapidamente se um card está favoritado.
 */
export function useFavoriteIds() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorite_ids', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('favorites')
        .select('caregiver_id')
        .eq('family_id', user.id)

      if (error) throw error

      return (data ?? []).map((r: { caregiver_id: string }) => r.caregiver_id)
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
        if (error.code === '23505') return // já favoritado — ignora duplicata
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites', user?.id] })
      qc.invalidateQueries({ queryKey: ['favorite_ids', user?.id] })
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar favorito.')
      console.error('[useAddFavorite]', error)
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
    onError: (error: Error) => {
      toast.error('Erro ao remover favorito.')
      console.error('[useRemoveFavorite]', error)
    },
  })
}
