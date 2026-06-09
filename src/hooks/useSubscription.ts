import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyProfile } from '@/hooks/useFamilyProfile'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { FamilyProfile } from '@/types/database'
import {
  getSubscriptionCheckoutOutcome,
  type SubscriptionCheckoutResult,
} from '@/lib/subscription-result'

type FamilyProfileWithRelations = FamilyProfile & {
  profiles?: { full_name: string | null }
}

export function useSubscription() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: familyProfile, isLoading } = useFamilyProfile()

  const startCheckout = useMutation({
    mutationFn: async (priceId: string) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          action: 'create_checkout',
          family_id: user!.id,
          price_id: priceId,
        },
      })
      if (error) throw error
      const result = data as SubscriptionCheckoutResult
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      const outcome = getSubscriptionCheckoutOutcome(result)

      if (result.url) {
        window.location.href = result.url
        return
      }

      if (outcome.kind === 'payment_failed') {
        queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices(user!.id) })
        toast.error('Não conseguimos cobrar o novo plano. Atualize o pagamento para regularizar.')
        return
      }

      // Downgrade agendado via Subscription Schedule
      if (result.scheduled) {
        queryClient.setQueryData(queryKeys.familyProfile(user!.id), (old: FamilyProfileWithRelations | undefined) => {
          if (!old) return old
          return { ...old, pending_plan: result.pending_plan ?? null }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
        toast.success('Plano alterado. Você mantém o acesso atual até o fim do período já pago.')
        return
      }

      // Upgrade imediato ou reativação de mesmo plano
      if (result.updated) {
        queryClient.setQueryData(queryKeys.familyProfile(user!.id), (old: FamilyProfileWithRelations | undefined) => {
          if (!old) return old
          const patch: Record<string, unknown> = { cancel_at_period_end: false, pending_plan: null }
          if (result.plan) patch.plan = result.plan
          if (result.current_period_end) patch.current_period_end = result.current_period_end
          return { ...old, ...patch }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices(user!.id) })
        toast.success(
          result.same_plan
            ? 'Assinatura reativada com sucesso.'
            : 'Plano alterado com sucesso. Cobrança proporcional aplicada.',
        )
      }
    },
    onError: () => {
      toast.error('Erro ao iniciar checkout. Tente novamente.')
    },
  })

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          action: 'cancel_subscription',
          family_id: user!.id,
        },
      })
      if (error) throw error
      const result = data as { ok?: boolean; error?: string }
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.familyProfile(user!.id), (old: FamilyProfileWithRelations | undefined) => {
        if (!old) return old
        return { ...old, cancel_at_period_end: true, pending_plan: null }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Cancelamento agendado para o fim do período atual.')
    },
    onError: () => {
      toast.error('Erro ao cancelar assinatura. Tente novamente.')
    },
  })

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          action: 'reactivate_subscription',
          family_id: user!.id,
        },
      })
      if (error) throw error
      const result = data as { ok?: boolean; error?: string }
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.familyProfile(user!.id), (old: FamilyProfileWithRelations | undefined) => {
        if (!old) return old
        return { ...old, cancel_at_period_end: false, pending_plan: null }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user!.id) })
      toast.success('Assinatura reativada. A renovação automática voltou a valer.')
    },
    onError: () => {
      toast.error('Erro ao reativar assinatura. Tente novamente.')
    },
  })

  return {
    plan: familyProfile?.plan ?? null,
    pendingPlan: familyProfile?.pending_plan ?? null,
    subscriptionStatus: familyProfile?.subscription_status ?? 'free',
    cancelAtPeriodEnd: familyProfile?.cancel_at_period_end ?? false,
    currentPeriodEnd: familyProfile?.current_period_end ?? null,
    stripeSubscriptionId: familyProfile?.stripe_subscription_id ?? null,
    isLoading,
    startCheckout,
    cancelSubscription,
    reactivateSubscription,
  }
}
