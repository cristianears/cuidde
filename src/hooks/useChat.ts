import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { MAX_MESSAGE_LENGTH } from '@/lib/contact-filter'
import type { Message } from '@/types/database'

function isValidMessage(obj: unknown): obj is Message {
  if (!obj || typeof obj !== 'object') return false
  const m = obj as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.appointment_id === 'string' &&
    typeof m.sender_id === 'string' &&
    typeof m.content === 'string' &&
    typeof m.created_at === 'string'
  )
}

// ─── Query: histórico de mensagens ──────────────────────────────────────────

export function useChatMessages(appointmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(appointmentId ?? ''),
    queryFn: async (): Promise<Message[]> => {
      if (!appointmentId) return []

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!appointmentId,
    staleTime: 10_000,
  })
}

// ─── Mutation: enviar mensagem ──────────────────────────────────────────────

export function useSendMessage(appointmentId: string | undefined) {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Não autenticado')
      if (!appointmentId) throw new Error('Agendamento não encontrado')

      const trimmed = content.trim().slice(0, MAX_MESSAGE_LENGTH)
      if (!trimmed) throw new Error('Mensagem vazia')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          appointment_id: appointmentId,
          sender_id: user.id,
          content: trimmed,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(appointmentId ?? '') })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mensagem.')
    },
  })
}

// ─── Mutation: marcar mensagens como lidas ──────────────────────────────────

export function useMarkMessagesAsRead(appointmentId: string | undefined) {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!user || !appointmentId) return

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('appointment_id', appointmentId)
        .neq('sender_id', user.id)
        .is('read_at', null)

      if (error) throw error
    },
    onError: () => {
      toast.error('Erro ao marcar mensagens como lidas.')
    },
  })
}

// ─── Realtime: escutar novas mensagens ──────────────────────────────────────

export function useChatRealtime(appointmentId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!appointmentId) return

    const channel = supabase
      .channel(`messages:${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload) => {
          if (!isValidMessage(payload.new)) return

          const newMsg = payload.new

          qc.setQueryData<Message[]>(
            queryKeys.messages(appointmentId),
            (old) => {
              if (!old) return [newMsg]
              if (old.some((m) => m.id === newMsg.id)) return old
              return [...old, newMsg]
            }
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [appointmentId, qc])
}
