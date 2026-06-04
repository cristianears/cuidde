import { supabase } from '@/lib/supabase'
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/lib/legal-documents'

interface RecordUserConsentsPayload {
  userId: string
  documentKeys: readonly LegalDocumentKey[]
  context: string
  metadata?: Record<string, unknown>
}

export const PENDING_USER_CONSENTS_KEY = 'cuidde_pending_user_consents'

export type PendingUserConsent = RecordUserConsentsPayload

export async function recordUserConsents({
  userId,
  documentKeys,
  context,
  metadata = {},
}: RecordUserConsentsPayload) {
  const rows = documentKeys.map((documentKey) => {
    const document = LEGAL_DOCUMENTS[documentKey]

    return {
      user_id: userId,
      consent_type: document.consentType,
      document_version: document.version,
      document_url: document.path,
      accepted: true,
      context,
      metadata,
    }
  })

  const { error } = await supabase
    .from('user_consents')
    .upsert(rows, {
      onConflict: 'user_id,consent_type,document_version,context',
      ignoreDuplicates: true,
    })

  if (error) throw error
}

export function queuePendingUserConsents(payload: PendingUserConsent) {
  localStorage.setItem(PENDING_USER_CONSENTS_KEY, JSON.stringify(payload))
}
