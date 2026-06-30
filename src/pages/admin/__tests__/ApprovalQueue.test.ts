import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const queueSource = readFileSync(resolve(__dirname, '../ApprovalQueue.tsx'), 'utf8')
const adminHookSource = readFileSync(resolve(__dirname, '../../../hooks/useAdmin.ts'), 'utf8')
const adminActionsSource = readFileSync(resolve(__dirname, '../../../../supabase/functions/admin-actions/index.ts'), 'utf8')

describe('ApprovalQueue', () => {
  it('uses a review queue that can keep verified caregivers with pending document review', () => {
    expect(queueSource).toContain('useAdminReviewCaregivers')
    expect(queueSource).not.toContain('useAdminCaregivers("pending"')
    expect(adminHookSource).toContain('useAdminReviewCaregivers')
    expect(adminHookSource).toContain('list_review_caregivers')
  })

  it('lists caregivers with sent documents in the review queue', () => {
    expect(adminActionsSource).toContain("action === 'list_review_caregivers'")
    expect(adminActionsSource).toContain("from('caregiver_documents')")
    expect(adminActionsSource).toContain(".eq('status', 'sent')")
    expect(adminActionsSource).toContain("status.eq.pending")
  })
})
