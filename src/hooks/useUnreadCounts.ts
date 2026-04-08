import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'

// ─── Query key ──────────────────────────────────────────────────────────────

function unreadKey(userId: string, role: string) {
  return ['unread_counts', userId, role] as const
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface UnreadCounts {
  /** Total de mensagens não lidas (todos os atendimentos) */
  totalUnreadMessages: number
  /** Mensagens não lidas por appointment_id */
  unreadByAppointment: Record<string, number>
  /** Solicitações pendentes não vistas (cuidador) */
  newSolicitations: number
  /** Solicitações com status alterado (família) */
  updatedSolicitations: number
}

const EMPTY: UnreadCounts = {
  totalUnreadMessages: 0,
  unreadByAppointment: {},
  newSolicitations: 0,
  updatedSolicitations: 0,
}

// ─── Timestamp helpers (localStorage) ───────────────────────────────────────

function solicitationsSeenKey(userId: string) {
  return `cuidde_solicitations_seen_at_${userId}`
}

function matchesSeenKey(userId: string) {
  return `cuidde_matches_seen_at_${userId}`
}

export function markSolicitationsSeen(userId: string) {
  localStorage.setItem(solicitationsSeenKey(userId), new Date().toISOString())
}

export function markMatchesSeen(userId: string) {
  localStorage.setItem(matchesSeenKey(userId), new Date().toISOString())
}

// ─── Hook principal ─────────────────────────────────────────────────────────

export function useUnreadCounts(role?: 'caregiver' | 'family') {
  const { user } = useAuth()

  return useQuery({
    queryKey: user && role ? unreadKey(user.id, role) : ['unread_counts_disabled'],
    queryFn: async (): Promise<UnreadCounts> => {
      if (!user) return EMPTY

      const counts: UnreadCounts = { ...EMPTY, unreadByAppointment: {} }

      // 1) Mensagens não lidas — apenas em atendimentos onde o usuário é participante
      const participantColumn = role === 'caregiver' ? 'caregiver_id' : 'family_id'
      const { data: myAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq(participantColumn, user.id)

      const myAppointmentIds = (myAppointments ?? []).map((a) => a.id)

      const { data: unreadMessages } = myAppointmentIds.length > 0
        ? await supabase
            .from('messages')
            .select('appointment_id')
            .neq('sender_id', user.id)
            .is('read_at', null)
            .in('appointment_id', myAppointmentIds)
        : { data: [] }

      if (unreadMessages) {
        counts.totalUnreadMessages = unreadMessages.length
        for (const msg of unreadMessages) {
          counts.unreadByAppointment[msg.appointment_id] =
            (counts.unreadByAppointment[msg.appointment_id] || 0) + 1
        }
      }

      // 2) Solicitações novas (cuidador) — pendentes criadas após último acesso
      if (role === 'caregiver') {
        const seenAt = localStorage.getItem(solicitationsSeenKey(user.id))
        let query = supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('caregiver_id', user.id)
          .eq('status', 'pendente')

        if (seenAt) {
          query = query.gt('created_at', seenAt)
        }

        const { count } = await query
        counts.newSolicitations = count ?? 0
      }

      // 3) Solicitações com status alterado (família) — aceitas/recusadas após último acesso
      if (role === 'family') {
        const seenAt = localStorage.getItem(matchesSeenKey(user.id))
        if (seenAt) {
          const { count } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', user.id)
            .in('status', ['ativo', 'cancelado'])
            .gt('updated_at', seenAt)

          counts.updatedSolicitations = count ?? 0
        }
      }

      return counts
    },
    enabled: !!user && !!role,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

// ─── Realtime: escuta novas mensagens para invalidar contagens ──────────────

export function useUnreadRealtime() {
  const qc = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('unread-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as { sender_id?: string }
          // Só invalidar se a mensagem NÃO é minha
          if (msg.sender_id !== user.id) {
            qc.invalidateQueries({ queryKey: ['unread_counts', user.id] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${user.id}`,
        },
        () => {
          // Quando read_at é preenchido, recompute
          qc.invalidateQueries({ queryKey: ['unread_counts', user.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          // Nova solicitação ou mudança de status
          qc.invalidateQueries({ queryKey: ['unread_counts', user.id] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, qc])
}
