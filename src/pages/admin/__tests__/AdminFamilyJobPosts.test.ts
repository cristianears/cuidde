import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(resolve(__dirname, '../../../App.tsx'), 'utf8')
const sidebarSource = readFileSync(resolve(__dirname, '../../../components/shared/AppSidebar.tsx'), 'utf8')
const pageSource = readFileSync(resolve(__dirname, '../AdminFamilyJobPosts.tsx'), 'utf8')
const adminHookSource = readFileSync(resolve(__dirname, '../../../hooks/useAdmin.ts'), 'utf8')
const migrationSource = readFileSync(
  resolve(__dirname, '../../../../supabase/sql/add_family_job_post_admin_posted_status.sql'),
  'utf8',
)

describe('AdminFamilyJobPosts', () => {
  it('exposes a separate admin route and sidebar entry for vagas', () => {
    expect(appSource).toContain("import AdminFamilyJobPosts from './pages/admin/AdminFamilyJobPosts'")
    expect(appSource).toContain('path="/admin/vagas"')
    expect(sidebarSource).toContain("label: 'Vagas'")
    expect(sidebarSource).toContain("href: '/admin/vagas'")
  })

  it('lets admin copy outreach text and mark a vaga as posted', () => {
    expect(pageSource).toContain('Texto de divulgação editável')
    expect(pageSource).toContain('Postado')
    expect(pageSource).toContain('useAdminMarkFamilyJobPostPosted')
    expect(adminHookSource).toContain('admin_mark_family_job_post_posted')
  })

  it('persists posted status in the family job post table', () => {
    expect(migrationSource).toContain('admin_posted_at')
    expect(migrationSource).toContain('admin_posted_by')
    expect(migrationSource).toContain('admin_mark_family_job_post_posted')
  })
})
