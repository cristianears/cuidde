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
  HydrationLevel,
  MoodStatus,
  VitalSignsData,
} from '@/types/database'

// ─── Query: listar rotinas de cuidado por agendamento ───────────────────────

export function useCareRoutines(appointmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.careRoutines(appointmentId ?? ''),
    queryFn: async (): Promise<CareRoutine[]> => {
      if (!appointmentId) return []

      const { data, error } = await supabase
        .from('care_routines')
        .select('id, appointment_id, date, shift, care_types, observations, has_occurrence, occurrence_description, medication_items, feeding_status, hygiene_done, mood, items_running_low, recorded_at')
        .eq('appointment_id', appointmentId)
        .order('date', { ascending: false })
        .order('recorded_at', { ascending: false })

      if (error) throw error

      // Buscar colunas opcionais separadamente (podem não existir ainda no banco)
      let extraMap: Record<string, { vital_signs: VitalSignsData | null; hydration: HydrationLevel | null }> = {}
      try {
        const { data: extraData } = await supabase
          .from('care_routines')
          .select('id, vital_signs, hydration')
          .eq('appointment_id', appointmentId)
        if (extraData) {
          for (const row of extraData) {
            extraMap[row.id] = {
              vital_signs: (row.vital_signs as VitalSignsData | null) ?? null,
              hydration: (row.hydration as HydrationLevel | null) ?? null,
            }
          }
        }
      } catch {
        // colunas não existem — ignorar
      }

      return (data ?? []).map((row) => ({
        ...row,
        medication_items: (row.medication_items as MedicationItem[] | null) ?? [],
        items_running_low: (row.items_running_low as string[] | null) ?? [],
        vital_signs: extraMap[row.id]?.vital_signs ?? null,
        hydration: extraMap[row.id]?.hydration ?? null,
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
  hydration: HydrationLevel | null
  hygiene_done: boolean | null
  mood: MoodStatus | null
  vital_signs: VitalSignsData | null
  items_running_low: string[]
}

// ─── Mutation: adicionar rotina de cuidado ──────────────────────────────────

export function useCreateCareRoutine() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCareRoutinePayload) => {
      if (!user) throw new Error('Não autenticado')

      const insertData: Record<string, unknown> = {
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
      }
      if (payload.vital_signs) insertData.vital_signs = payload.vital_signs
      if (payload.hydration) insertData.hydration = payload.hydration

      const { data, error } = await supabase
        .from('care_routines')
        .insert(insertData)
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

      const { id, appointment_id, vital_signs, hydration, ...baseFields } = payload

      // Include new columns whenever the caller explicitly set them (undefined = not touched,
      // null = intentional clear). This lets caregivers remove mistaken vital-sign entries.
      // If supabase_vital_signs.sql has not been applied the update will fail only when the
      // user actually interacts with those fields — not on every routine save.
      const fields: Record<string, unknown> = { ...baseFields }
      if (vital_signs !== undefined) fields.vital_signs = vital_signs ?? null
      if (hydration !== undefined) fields.hydration = hydration ?? null

      // Verificar que o usuário é participante do agendamento
      const { data: apt, error: aptError } = await supabase
        .from('appointments')
        .select('id, family_id, caregiver_id')
        .eq('id', appointment_id)
        .single()

      if (aptError || !apt) throw new Error('Agendamento não encontrado ou acesso negado.')
      if (apt.family_id !== user!.id && apt.caregiver_id !== user!.id) {
        throw new Error('Acesso negado: você não é participante deste agendamento.')
      }

      const { data, error } = await supabase
        .from('care_routines')
        .update(fields)
        .eq('id', id)
        .eq('appointment_id', appointment_id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Nenhuma linha atualizada — verifique se o registro existe.')
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
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, appointmentId }: { id: string; appointmentId: string }) => {
      if (!user) throw new Error('Não autenticado')
      // Verificar que o usuário é participante do agendamento
      const { data: apt, error: aptError } = await supabase
        .from('appointments')
        .select('id, family_id, caregiver_id')
        .eq('id', appointmentId)
        .single()

      if (aptError || !apt) throw new Error('Agendamento não encontrado ou acesso negado.')
      if (apt.family_id !== user!.id && apt.caregiver_id !== user!.id) {
        throw new Error('Acesso negado: você não é participante deste agendamento.')
      }

      const { error } = await supabase
        .from('care_routines')
        .delete()
        .eq('id', id)
        .eq('appointment_id', appointmentId)

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
