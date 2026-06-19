import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(resolve(__dirname, '../../../App.tsx'), 'utf8')
const sidebarSource = readFileSync(resolve(__dirname, '../../../components/shared/AppSidebar.tsx'), 'utf8')
const adminHookSource = readFileSync(resolve(__dirname, '../../../hooks/useAdmin.ts'), 'utf8')
const adminActionsSource = readFileSync(resolve(__dirname, '../../../../supabase/functions/admin-actions/index.ts'), 'utf8')
const reviewSource = readFileSync(resolve(__dirname, '../CaregiverProfilesReview.tsx'), 'utf8')

describe('Admin caregiver profile review', () => {
  it('exposes an admin route and sidebar entry for reviewing caregiver profiles', () => {
    expect(appSource).toContain("import CaregiverProfilesReview from './pages/admin/CaregiverProfilesReview'")
    expect(appSource).toContain('path="/admin/caregivers"')
    expect(sidebarSource).toContain("label: 'Cuidadores'")
    expect(sidebarSource).toContain("href: '/admin/caregivers'")
  })

  it('loads all caregiver statuses through the admin hook without inline query keys', () => {
    expect(adminHookSource).toContain("export type AdminCaregiverStatusFilter = CaregiverStatus | 'all'")
    expect(adminHookSource).toContain("useAdminCaregivers(status: AdminCaregiverStatusFilter)")
    expect(adminHookSource).toContain("queryKeys.adminCaregivers(status)")
    expect(adminHookSource).toContain("callAdminAction<AdminCaregiverRow[]>('list_caregivers', { status })")
  })

  it('lets the admin edge function list all caregiver profiles and return review fields', () => {
    expect(adminActionsSource).toContain("if (status && status !== 'all')")
    expect(adminActionsSource).toContain('profile_complete')
    expect(adminActionsSource).toContain('is_visible')
    expect(adminActionsSource).toContain('neighborhood')
  })

  it('does not expose manual profile approval or improvement request buttons', () => {
    expect(reviewSource).not.toContain('useAdminApprove')
    expect(reviewSource).not.toContain('useAdminReject')
    expect(reviewSource).not.toContain('RejectionDialog')
    expect(reviewSource).not.toContain('Aprovar')
    expect(reviewSource).not.toContain('Pedir melhoria')
  })

  it('keeps status filters readable inside the narrow admin sidebar column', () => {
    expect(reviewSource).not.toContain('md:grid-cols-5')
    expect(reviewSource).toContain('overflow-x-auto')
    expect(reviewSource).toContain('whitespace-nowrap')
  })
})
