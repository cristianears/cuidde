import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { geocodeAddress } from '@/lib/geocode'
import { queryKeys } from '@/lib/query-keys'

const STORAGE_KEY = 'cuidde_pending_address'

interface PendingAddress {
  userId: string
  profileType: 'caregiver' | 'family'
  table: 'caregiver_profiles' | 'family_profiles'
  address: {
    cep: string
    street: string
    number: string
    complement: string | null
    neighborhood: string
    city: string
    state: string
  }
}

/**
 * Verifica se há endereço pendente no localStorage (salvo durante o onboarding
 * com email/senha, quando o RLS bloqueia o upsert antes da verificação de email).
 * Se houver, grava no banco assim que a sessão autenticada estiver disponível.
 */
export function usePendingAddress() {
  const { user } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user) return

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    let pending: PendingAddress
    try {
      pending = JSON.parse(raw)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    // Only apply if the stored payload belongs to the currently authenticated user.
    // Prevents replay into a different account on a shared device or after account switch.
    if (pending.userId !== user.id) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    // Validate table name against the allowed set — never trust localStorage blindly.
    const ALLOWED_TABLES: PendingAddress['table'][] = ['caregiver_profiles', 'family_profiles']
    if (!ALLOWED_TABLES.includes(pending.table)) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    ;(async () => {
      const { error } = await supabase
        .from(pending.table)
        .update(pending.address)
        .eq('id', user.id)

      if (!error) {
        localStorage.removeItem(STORAGE_KEY)

        // Geocodificar se tiver CEP
        if (pending.address.cep) {
          try {
            const geo = await geocodeAddress({ cep: pending.address.cep })
            if (geo) {
              await supabase
                .from(pending.table)
                .update({ lat: geo.lat, lng: geo.lng })
                .eq('id', user.id)
            }
          } catch {
            // best-effort
          }
        }

        // Invalidar cache para refletir os novos dados no perfil
        if (pending.table === 'caregiver_profiles') {
          qc.invalidateQueries({ queryKey: queryKeys.caregiverProfile(user.id) })
        } else {
          qc.invalidateQueries({ queryKey: queryKeys.familyProfile(user.id) })
        }
      }
    })()
  }, [user, qc])
}
