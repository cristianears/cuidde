import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { hasAcceptedUserConsent } from '@/lib/user-consents'
import type { LegalDocumentKey } from '@/lib/legal-documents'

export function useHasAcceptedUserConsent(userId: string | undefined, documentKey: LegalDocumentKey) {
  return useQuery({
    queryKey: queryKeys.userConsent(userId ?? 'anonymous', documentKey),
    enabled: Boolean(userId),
    queryFn: () => hasAcceptedUserConsent({ userId: userId!, documentKey }),
  })
}
