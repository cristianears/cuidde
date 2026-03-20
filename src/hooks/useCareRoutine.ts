import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type {
  CareRoutine,
  CareShift,
  CareType,
  MedicationItem,
  FeedingStatus,
  MoodStatus,
} from '@/types/database'

// ─── Query: listar rotinas de cuidado por agendamento ───────────────────────

export function useCareRoutines(appointmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.careRoutines(appointmentId ?? ''),
    queryFn: async (): Promise<CareRoutine[]> => {
      if (!appointmentId) return []

      const { data, error } = await supabase
        .from('care_routines')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('date', { ascending: false })
        .order('recorded_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => ({
        ...row,
        medication_items: (row.medication_items as MedicationItem[] | null) ?? [],
        items_running_low: (row.items_running_low as string[] | null) ?? [],
      })) as CareRoutine[]
    },
    enabled: !!appointmentId,
    staleTime: 30_000,
  })
}

// ─── Payload para criar rotina de cuidado ───────────────────────────────────

export interface CreateCareRoutinePayload {
  appointment_id: string
  date: string // YYYY-MM-DD
  shift: CareShift
  care_types: CareType[]
  observations: string | null
  has_occurrence: boolean
  occurrence_description: string | null
  medication_items: MedicationItem[]
  feeding_status: FeedingStatus | null
  hygiene_done: boolean | null
  mood: MoodStatus | null
  items_running_low: string[]
}

// ─── Mutation: adicionar rotina de cuidado ──────────────────────────────────

export function useCreateCareRoutine() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCareRoutinePayload) => {
      if (!user) throw new Error('Não autenticado')

      const { data, error } = await supabase
        .from('care_routines')
        .insert({
          appointment_id: payload.appointment_id,
          date: payload.date,
          shift: payload.shift,
          care_types: payload.care_types,
          observations: payload.observations,
          has_occurrence: payload.has_occurrence,
          occurrence_description: payload.occurrence_description,
          medication_items: payload.medication_items,
          feeding_status: payload.feeding_status,
          hygiene_done: payload.hygiene_done,
          mood: payload.mood,
          items_running_low: payload.items_running_low,
        })
        .select('id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.careRoutines(payload.appointment_id) })
      toast.success('Registro de cuidado salvo com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar registro de cuidado.')
    },
  })
}

// ─── Mutation: atualizar rotina de cuidado ────────────────────────────────

export function useUpdateCareRoutine() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCareRoutinePayload & { id: string }) => {
      if (!user) throw new Error('Não autenticado')

      const { id, appointment_id, ...fields } = payload
      const { error } = await supabase
        .from('care_routines')
        .update(fields)
        .eq('id', id)

      if (error) throw error
      return { appointmentId: appointment_id }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.careRoutines(result.appointmentId) })
      toast.success('Registro atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar registro.')
    },
  })
}

// ─── Mutation: excluir rotina de cuidado ──────────────────────────────────

export function useDeleteCareRoutine() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, appointmentId }: { id: string; appointmentId: string }) => {
      const { error } = await supabase
        .from('care_routines')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { appointmentId }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.careRoutines(result.appointmentId) })
      toast.success('Registro excluído.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir registro.')
    },
  })
}
