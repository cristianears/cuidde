import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('caregiver account status persistence', () => {
  const sqlSource = read('supabase/sql/add_caregiver_account_status.sql')
  const typesSource = read('src/types/database.ts')
  const caregiverQuerySource = read('src/lib/caregiver-query.ts')
  const searchSource = read('src/hooks/useSearchCaregivers.ts')
  const matchesSource = read('src/hooks/useFamilyMatches.ts')
  const publicDetailSql = read('supabase/sql/get_caregiver_public_detail.sql')
  const proximitySql = read('supabase/sql/search_caregivers_identity_optional.sql')

  it('adds protected account status fields and feedback records', () => {
    expect(sqlSource).toContain('account_status text not null default')
    expect(sqlSource).toContain("account_status in ('active', 'paused', 'closed', 'suspended')")
    expect(sqlSource).toContain('account_status_reason_code text null')
    expect(sqlSource).toContain('account_status_reason_label text null')
    expect(sqlSource).toContain('account_status_reason_details text null')
    expect(sqlSource).toContain('closed_at timestamptz null')
    expect(sqlSource).toContain('create table if not exists public.caregiver_account_feedback')
    expect(sqlSource).toContain('alter table public.caregiver_account_feedback enable row level security')
    expect(sqlSource).toContain('Caregivers can insert own account feedback')
    expect(sqlSource).toContain('grant select, insert on public.caregiver_account_feedback to authenticated')
  })

  it('keeps TypeScript types in sync with database fields', () => {
    expect(typesSource).toContain("export type CaregiverAccountStatus = 'active' | 'paused' | 'closed' | 'suspended'")
    expect(typesSource).toContain('CaregiverAccountFeedbackReason')
    expect(typesSource).toContain('CaregiverAccountFeedback')
    expect(typesSource).toContain('account_status: CaregiverAccountStatus')
    expect(typesSource).toContain('caregiver_account_feedback: {')
  })

  it('hides paused, closed, and suspended caregivers from public discovery', () => {
    expect(caregiverQuerySource).toContain('account_status,')
    expect(searchSource).toContain(".eq('account_status', 'active')")
    expect(searchSource).toContain(".eq('is_visible', true)")
    expect(matchesSource).toContain(".eq('account_status', 'active')")
    expect(publicDetailSql).toContain("cp.account_status = 'active'")
    expect(proximitySql).toContain("cp.account_status = 'active'")
  })
})
