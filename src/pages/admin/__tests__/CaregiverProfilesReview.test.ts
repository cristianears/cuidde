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
    expect(adminHookSource).toContain("export type AdminCaregiverStatusFilter = CaregiverStatus | CaregiverAccountStatus | 'all'")
    expect(adminHookSource).toContain("useAdminCaregivers(status: AdminCaregiverStatusFilter)")
    expect(adminHookSource).toContain("queryKeys.adminCaregivers(status)")
    expect(adminHookSource).toContain("supabase.rpc('admin_list_caregiver_accounts'")
    expect(adminHookSource).toContain('p_status: status')
  })

  it('lets the admin edge function list all caregiver profiles and return review fields', () => {
    expect(adminActionsSource).toContain("if (status && status !== 'all')")
    expect(adminActionsSource).toContain('profile_complete')
    expect(adminActionsSource).toContain('admin_contacted_at')
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

  it('labels caregivers that are hidden from family search', () => {
    expect(adminHookSource).toContain('is_available_for_new: boolean')
    expect(reviewSource).toContain('function isVisibleInSearch')
    expect(reviewSource).toContain('Oculto')
    expect(reviewSource).toContain('Oculto da busca')
  })

  it('uses operational admin filters instead of the unused rejected profile tab', () => {
    expect(reviewSource).toContain('Aguardando reenvio')
    expect(reviewSource).toContain('Perfis completos')
    expect(reviewSource).toContain('Contactados')
    expect(reviewSource).toContain('Nao contactados')
    expect(reviewSource).not.toContain('Rejeitados')
  })

  it('marks a caregiver as contacted when the admin opens WhatsApp', () => {
    expect(adminHookSource).toContain('admin_contacted_at: string | null')
    expect(adminHookSource).toContain('useAdminMarkContacted')
    expect(adminHookSource).toContain("callAdminAction<void>('mark_contacted'")
    expect(adminActionsSource).toContain("action === 'mark_contacted'")
    expect(adminActionsSource).toContain("admin_contacted_at: new Date().toISOString()")
    expect(reviewSource).toContain('markContacted.mutate')
  })

  it('lets admins filter closed, paused, and suspended caregiver accounts', () => {
    expect(adminHookSource).toContain('CaregiverAccountStatus')
    expect(adminHookSource).toContain('account_status: CaregiverAccountStatus')
    expect(adminHookSource).toContain("supabase.rpc('admin_list_caregiver_accounts'")
    expect(reviewSource).toContain('Contas encerradas')
    expect(reviewSource).toContain('Pausadas')
    expect(reviewSource).toContain('Suspensas')
    expect(reviewSource).toContain('caregiver.account_status === statusFilter')
    expect(reviewSource).toContain('closed_at')
    expect(reviewSource).toContain('account_status_reason_label')
  })

  it('keeps suspension as an admin-only action', () => {
    expect(adminHookSource).toContain('useAdminUpdateCaregiverAccountStatus')
    expect(adminHookSource).toContain("supabase.rpc('admin_update_caregiver_account_status'")
    expect(adminHookSource).toContain('p_account_status: accountStatus')
    expect(reviewSource).toContain('Suspender conta')
    expect(reviewSource).toContain('adminAccountStatus.mutate')
  })

  it('lets admins close caregiver accounts from support requests with compact neutral actions', () => {
    expect(reviewSource).toContain('Encerrar conta')
    expect(reviewSource).toContain('Solicitacao recebida pelo suporte')
    expect(reviewSource).toContain('accountStatus: "closed"')
    expect(reviewSource).toContain('className="h-8 px-2 text-xs"')
    expect(reviewSource).not.toContain('variant="destructive"')
  })
})
