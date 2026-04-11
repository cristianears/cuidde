import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import type { Invoice } from '@/types/database'

export function useInvoices() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.invoices(user?.id ?? ''),
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('family_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

export function useInvoice(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: async (): Promise<Invoice | null> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('family_id', user!.id)
        .single()
      if (error) return null
      return data
    },
    enabled: !!user && !!id,
    staleTime: 60_000,
  })
}
