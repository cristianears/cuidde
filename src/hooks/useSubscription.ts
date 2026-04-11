import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyProfile } from '@/hooks/useFamilyProfile'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { FamilyProfile } from '@/types/database'

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
      const result = data as { url?: string; updated?: boolean; same_plan?: boolean; error?: string }
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url
        return
      }
      if (result.updated) {
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
      // Update otimista — assinatura continua ativa até o fim do período
      queryClient.setQueryData(queryKeys.familyProfile(user!.id), (old: FamilyProfileWithRelations | undefined) => {
        if (!old) return old
        return { ...old, cancel_at_period_end: true }
      })
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
        return { ...old, cancel_at_period_end: false }
      })
      toast.success('Assinatura reativada. A renovação automática voltou a valer.')
    },
    onError: () => {
      toast.error('Erro ao reativar assinatura. Tente novamente.')
    },
  })

  return {
    plan: familyProfile?.plan ?? null,
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
