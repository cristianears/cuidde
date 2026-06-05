import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dashboardSource = readFileSync(resolve(__dirname, '../AdminDashboard.tsx'), 'utf8')
const adminHookSource = readFileSync(resolve(__dirname, '../../../hooks/useAdmin.ts'), 'utf8')
const adminActionsSource = readFileSync(resolve(__dirname, '../../../../supabase/functions/admin-actions/index.ts'), 'utf8')

describe('AdminDashboard caregiver operational metrics', () => {
  it('shows caregiver profile and care routine adoption metrics', () => {
    expect(dashboardSource).toContain('Operação de cuidadores')
    expect(dashboardSource).toContain('Perfis completos')
    expect(dashboardSource).toContain('Rotina nos últimos 7 dias')
    expect(dashboardSource).toContain('Rotina nos últimos 30 dias')
    expect(dashboardSource).toContain('Rotina hoje')
  })

  it('types the caregiver operational metrics returned by admin metrics', () => {
    expect(adminHookSource).toContain('profileCompleteCaregivers: number')
    expect(adminHookSource).toContain('caregiversWithRoutineLast30Days: number')
    expect(adminHookSource).toContain('caregiversWithRoutineLast7Days: number')
    expect(adminHookSource).toContain('caregiversWithRoutineToday: number')
  })

  it('loads caregiver operational metrics through the admin edge function', () => {
    expect(adminActionsSource).toContain("rpc('get_admin_caregiver_operational_metrics')")
    expect(adminActionsSource).toContain('profileCompleteCaregivers')
    expect(adminActionsSource).toContain('caregiversWithRoutineLast7Days')
  })
})
