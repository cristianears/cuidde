import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type { Appointment, AppointmentStatus } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AppointmentWithNames extends Appointment {
  family_name: string | null
  caregiver_name: string | null
}

interface CreateAppointmentPayload {
  caregiver_id: string
  type: Appointment['type']
  start_date: string
  end_date?: string
  description?: string
  family_notes?: string
  modality?: string
}

interface UpdateStatusPayload {
  id: string
  status: AppointmentStatus
  cancel_reason?: string
}

// ─── Query: listar agendamentos ──────────────────────────────────────────────

export function useAppointments(role: 'caregiver' | 'family') {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.appointments(user?.id ?? '', role),
    queryFn: async (): Promise<AppointmentWithNames[]> => {
      if (!user) return []

      const column = role === 'caregiver' ? 'caregiver_id' : 'family_id'

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          family_profiles:family_id ( profiles:id ( full_name ) ),
          caregiver_profiles:caregiver_id ( profiles:id ( full_name ) )
        `)
        .eq(column, user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row: any) => ({
        ...row,
        family_name: row.family_profiles?.profiles?.full_name ?? null,
        caregiver_name: row.caregiver_profiles?.profiles?.full_name ?? null,
        family_profiles: undefined,
        caregiver_profiles: undefined,
      }))
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ─── Query: detalhe de um agendamento ────────────────────────────────────────

export function useAppointmentDetail(appointmentId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.appointmentDetail(appointmentId ?? ''),
    queryFn: async (): Promise<AppointmentWithNames | null> => {
      if (!user || !appointmentId) return null

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          family_profiles:family_id ( profiles:id ( full_name ) ),
          caregiver_profiles:caregiver_id ( profiles:id ( full_name ) )
        `)
        .eq('id', appointmentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        ...data,
        family_name: (data as any).family_profiles?.profiles?.full_name ?? null,
        caregiver_name: (data as any).caregiver_profiles?.profiles?.full_name ?? null,
        family_profiles: undefined,
        caregiver_profiles: undefined,
      } as AppointmentWithNames
    },
    enabled: !!user && !!appointmentId,
    staleTime: 30_000,
  })
}

// ─── Mutation: família cria agendamento ──────────────────────────────────────

export function useCreateAppointment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      if (!user) throw new Error('Não autenticado')

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          family_id: user.id,
          caregiver_id: payload.caregiver_id,
          type: payload.type,
          status: 'pendente',
          start_date: payload.start_date,
          end_date: payload.end_date || null,
          description: payload.description || null,
          family_notes: payload.family_notes || null,
          modality: payload.modality || null,
        })
        .select('id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Solicitação de atendimento enviada!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar agendamento.')
    },
  })
}

// ─── Mutation: atualizar status ──────────────────────────────────────────────

export function useUpdateAppointmentStatus() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateStatusPayload) => {
      if (!user) throw new Error('Não autenticado')

      const updateData: Record<string, unknown> = {
        status: payload.status,
        updated_at: new Date().toISOString(),
      }

      if (payload.status === 'cancelado') {
        updateData.cancelled_by = user.id
        updateData.cancel_reason = payload.cancel_reason || null
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', payload.id)

      if (error) throw error
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: queryKeys.appointmentDetail(payload.id) })

      const messages: Record<AppointmentStatus, string> = {
        ativo: 'Agendamento aceito!',
        cancelado: 'Agendamento cancelado.',
        finalizado: 'Agendamento finalizado.',
        pendente: 'Status atualizado.',
      }
      toast.success(messages[payload.status])
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status.')
    },
  })
}
