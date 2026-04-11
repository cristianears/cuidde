import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type { Appointment, AppointmentStatus } from '@/types/database'
import { trackCaregiverInterest } from '@/hooks/useTrackCaregiverEvent'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AppointmentWithNames extends Appointment {
  family_name: string | null
  caregiver_name: string | null
  elderly_name: string | null
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

// ─── Helper: buscar nomes de profiles por IDs ──────────────────────────────

async function fetchProfileNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

// ─── Helper: buscar dados da família (elderly_name + nome do responsável) ────

interface FamilyInfo {
  elderly_name: string | null
  responsible_name: string | null
}

async function fetchFamilyInfo(familyIds: string[]): Promise<Record<string, FamilyInfo>> {
  if (familyIds.length === 0) return {}

  // Buscar elderly_name e full_name em queries separadas (evita PGRST201)
  const [{ data: familyData }, { data: profileData }] = await Promise.all([
    supabase
      .from('family_profiles')
      .select('id, elderly_name')
      .in('id', familyIds),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', familyIds),
  ])

  const profileNames = Object.fromEntries(
    (profileData ?? []).map((p) => [p.id, p.full_name])
  )

  return Object.fromEntries(
    (familyData ?? []).map((p) => [p.id, {
      elderly_name: p.elderly_name ?? null,
      responsible_name: profileNames[p.id] ?? null,
    }])
  )
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
        .select('*')
        .eq(column, user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return []

      const uniqueIds = [...new Set(data.flatMap((a) => [a.family_id, a.caregiver_id]))]
      const familyIds = [...new Set(data.map((a) => a.family_id))]
      const [names, familyInfo] = await Promise.all([
        fetchProfileNames(uniqueIds),
        fetchFamilyInfo(familyIds),
      ])

      return data.map((row) => {
        const info = familyInfo[row.family_id]
        return {
          ...row,
          family_name: info?.responsible_name ?? names[row.family_id] ?? null,
          caregiver_name: names[row.caregiver_id] ?? null,
          elderly_name: info?.elderly_name ?? null,
        }
      })
    },
    enabled: !!user,
    staleTime: 30_000,
  })
}

// ─── Query: detalhe de um agendamento ────────────────────────────────────────

export function useAppointmentDetail(
  appointmentId: string | undefined,
  options?: { refetchInterval?: number },
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.appointmentDetail(appointmentId ?? ''),
    refetchInterval: options?.refetchInterval,
    queryFn: async (): Promise<AppointmentWithNames | null> => {
      if (!user || !appointmentId) return null

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      // Validação client-side: verificar que o usuário é participante
      if (data.family_id !== user!.id && data.caregiver_id !== user!.id) {
        return null
      }

      const [names, familyInfo] = await Promise.all([
        fetchProfileNames([data.family_id, data.caregiver_id]),
        fetchFamilyInfo([data.family_id]),
      ])

      const info = familyInfo[data.family_id]
      return {
        ...data,
        family_name: info?.responsible_name ?? names[data.family_id] ?? null,
        caregiver_name: names[data.caregiver_id] ?? null,
        elderly_name: info?.elderly_name ?? null,
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

      // Tracking de interesse (best-effort)
      trackCaregiverInterest(payload.caregiver_id)

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.appointmentsAll })
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
        // updated_at é gerenciado por trigger do banco — não usar relógio do cliente
      }

      if (payload.status === 'finalizado') {
        // Garante que end_date seja preenchido na finalização (data local, não UTC)
        const d = new Date()
        const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        updateData.end_date = localDate
      }

      if (payload.status === 'cancelado') {
        updateData.cancelled_by = user.id
        updateData.cancel_reason = payload.cancel_reason || null
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', payload.id)
        .or(`family_id.eq.${user.id},caregiver_id.eq.${user.id}`)

      if (error) throw error
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.appointmentsAll })
      qc.invalidateQueries({ queryKey: queryKeys.appointmentDetail(payload.id) })

      const messages: Record<AppointmentStatus, string> = {
        ativo: 'Atendimento aceito!',
        cancelado: 'Atendimento cancelado.',
        finalizado: 'Atendimento finalizado.',
        pendente: 'Status atualizado.',
      }
      toast.success(messages[payload.status])
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status.')
    },
  })
}
