import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const migrationPath = resolve(root, 'supabase/sql/profile_complete_refresh_references_optional.sql')
const specPath = resolve(root, 'SPEC.md')

describe('caregiver profile completeness refresh', () => {
  it('keeps references optional when triggers refresh computed caregiver fields', () => {
    expect(existsSync(migrationPath)).toBe(true)

    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toContain('create or replace function public.refresh_caregiver_computed')
    expect(sql).toContain('profile_complete = public.compute_profile_complete(cp_id)')
    expect(sql).toContain('update public.caregiver_profiles')
    expect(sql).toContain('profile_complete = public.compute_profile_complete(id)')
    expect(sql).not.toMatch(/profile_complete\s*=\s*\([\s\S]*v_has_ref\s+and\s+v_has_rg/i)
  })

  it('documents references as optional for searchable profile completeness', () => {
    const spec = readFileSync(specPath, 'utf8')
    expect(spec).toContain('referencias profissionais sao opcionais')
    expect(spec).not.toContain('referência + rg_cnh')
  })
})
