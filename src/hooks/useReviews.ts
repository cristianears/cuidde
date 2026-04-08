import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type { Review } from '@/types/database'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ReviewCriteria {
  rating_pontualidade: number
  rating_competencia: number
  rating_comunicacao: number
  rating_trato: number
  rating_confianca: number
}

export interface SubmitReviewPayload extends ReviewCriteria {
  appointment_id: string
  comment: string
}

// ─── Query: listar reviews de um cuidador ────────────────────────────────────

export function useReviews(caregiverId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews(caregiverId ?? ''),
    queryFn: async (): Promise<Review[]> => {
      if (!caregiverId) return []

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!caregiverId,
    staleTime: 60_000,
  })
}

// ─── Query: verificar se este atendimento já foi avaliado ────────────────────
// (UNIQUE constraint é appointment_id — uma review por atendimento)

export function useExistingReview(appointmentId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.appointmentReview(appointmentId ?? ''),
    queryFn: async (): Promise<Review | null> => {
      if (!user || !appointmentId) return null

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .eq('family_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data ?? null
    },
    enabled: !!user && !!appointmentId,
    staleTime: 60_000,
  })
}

// ─── Query: verificar se existe review para este atendimento (qualquer autor) ─
// Usado pelo cuidador para saber se a família já avaliou

export function useAppointmentHasReview(appointmentId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.appointmentReview(appointmentId ?? ''), 'any'],
    queryFn: async (): Promise<boolean> => {
      if (!appointmentId) return false

      const { count, error } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('appointment_id', appointmentId)

      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!appointmentId,
    staleTime: 60_000,
  })
}

// ─── Query: todos os appointment_ids já avaliados pela família ────────────────
// Usado para mostrar banner "Avalie" na listagem sem precisar de um hook por card

export function useFamilyReviewedAppointments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.familyReviewedAppointments(user?.id ?? ''),
    queryFn: async (): Promise<Set<string>> => {
      if (!user) return new Set()

      const { data, error } = await supabase
        .from('reviews')
        .select('appointment_id')
        .eq('family_id', user.id)

      if (error) throw error
      return new Set((data ?? []).map((r) => r.appointment_id as string))
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// ─── Mutation: família submete review ────────────────────────────────────────

export function useSubmitReview() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SubmitReviewPayload): Promise<{ caregiverId: string; appointmentId: string }> => {
      if (!user) throw new Error('Não autenticado')

      // Derive caregiver_id server-side from the appointment — never trust the client.
      // This also validates that the family_id on the appointment matches the caller.
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('caregiver_id, family_id')
        .eq('id', payload.appointment_id)
        .single()

      if (apptError || !appt) throw new Error('Atendimento não encontrado.')
      if (appt.family_id !== user.id) throw new Error('Não autorizado.')

      const caregiverId: string = appt.caregiver_id

      // Buscar nome e foto da família para desnormalizar no review
      const [{ data: profile }, { data: familyProfile }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('family_profiles').select('photo_url').eq('id', user.id).single(),
      ])

      // Calcular nota geral como média dos 5 critérios (arredonda para 1 casa decimal)
      const avg =
        (payload.rating_pontualidade +
          payload.rating_competencia +
          payload.rating_comunicacao +
          payload.rating_trato +
          payload.rating_confianca) /
        5
      const rating = Math.round(avg * 2) / 2 // arredonda para múltiplo de 0.5

      const { error } = await supabase.from('reviews').insert({
        appointment_id: payload.appointment_id,
        family_id: user.id,
        caregiver_id: caregiverId,
        family_name: profile?.full_name ?? null,
        family_photo: familyProfile?.photo_url ?? null,
        rating,
        rating_pontualidade: payload.rating_pontualidade,
        rating_competencia: payload.rating_competencia,
        rating_comunicacao: payload.rating_comunicacao,
        rating_trato: payload.rating_trato,
        rating_confianca: payload.rating_confianca,
        comment: payload.comment || null,
      })

      if (error) throw error
      return { caregiverId, appointmentId: payload.appointment_id }
    },
    onSuccess: ({ caregiverId, appointmentId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews(caregiverId) })
      qc.invalidateQueries({ queryKey: queryKeys.appointmentReview(appointmentId) })
      qc.invalidateQueries({ queryKey: queryKeys.publicCaregiverProfile(caregiverId) })
      qc.invalidateQueries({ queryKey: queryKeys.familyReviewedAppointments(user?.id ?? '') })
      toast.success('Avaliação enviada! Obrigado pelo feedback.')
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('Este atendimento já foi avaliado.')
      } else {
        toast.error(error.message || 'Erro ao enviar avaliação.')
      }
    },
  })
}
