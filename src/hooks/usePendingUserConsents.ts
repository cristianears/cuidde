import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  PENDING_USER_CONSENTS_KEY,
  recordUserConsents,
  type PendingUserConsent,
} from '@/lib/user-consents'

export function usePendingUserConsents() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const raw = localStorage.getItem(PENDING_USER_CONSENTS_KEY)
    if (!raw) return

    let pending: PendingUserConsent
    try {
      pending = JSON.parse(raw)
    } catch {
      localStorage.removeItem(PENDING_USER_CONSENTS_KEY)
      return
    }

    if (pending.userId !== user.id) {
      localStorage.removeItem(PENDING_USER_CONSENTS_KEY)
      return
    }

    ;(async () => {
      try {
        await recordUserConsents(pending)
        localStorage.removeItem(PENDING_USER_CONSENTS_KEY)
      } catch {
        // Mantem o registro pendente para tentar novamente no proximo login.
      }
    })()
  }, [user])
}
