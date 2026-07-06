import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const suiteFiles = [
  'supabase/sql/db_impact_check_auth_profiles.sql',
  'supabase/sql/db_impact_check_subscriptions.sql',
  'supabase/sql/db_impact_check_appointments_chat.sql',
  'supabase/sql/db_impact_check_caregiver_search.sql',
  'supabase/sql/db_impact_check_storage_documents.sql',
]

describe('database impact check', () => {
  it('provides an MCP-friendly database contract check command', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts['db:impact-check']).toBe('node scripts/db-impact-check.mjs')
    expect(existsSync(resolve(root, 'scripts/db-impact-check.mjs'))).toBe(true)
    expect(existsSync(resolve(root, 'supabase/sql/db_impact_check.sql'))).toBe(true)
    for (const suiteFile of suiteFiles) {
      expect(existsSync(resolve(root, suiteFile))).toBe(true)
    }
  })

  it('covers the critical profiles, CPF and onboarding contracts', () => {
    const sql = read('supabase/sql/db_impact_check_auth_profiles.sql')
    const script = read('scripts/db-impact-check.mjs')

    expect(sql).toContain('public.profiles')
    expect(sql).toContain('profiles_cpf_not_selectable_by_authenticated')
    expect(sql).toContain('authenticated_user_can_update_own_profile')
    expect(sql).toContain('authenticated_profile_upsert_requires_table_select')
    expect(sql).toContain('handle_new_user_creates_caregiver_profile')
    expect(sql).toContain('user_consents_insert_own_signup_terms')
    expect(sql).toContain('rollback')

    expect(script).toContain('auth_profiles')
    expect(script).toContain('MCP Supabase')
    expect(script).toContain('mcp__mcp_supabase_ditti.execute_sql')
  })

  it('covers subscriptions, Stripe-owned fields and invoice visibility', () => {
    const sql = read('supabase/sql/db_impact_check_subscriptions.sql')
    const script = read('scripts/db-impact-check.mjs')

    expect(sql).toContain('public.family_profiles')
    expect(sql).toContain('family_profiles_stripe_fields_not_client_writable')
    expect(sql).toContain('family_can_update_own_non_billing_profile_fields')
    expect(sql).toContain('invoices_family_sees_own_invoice')
    expect(sql).toContain('invoices_other_family_cannot_read_invoice')
    expect(sql).toContain('rollback')

    expect(script).toContain('subscriptions')
  })

  it('covers appointments and chat participant isolation', () => {
    const sql = read('supabase/sql/db_impact_check_appointments_chat.sql')
    const script = read('scripts/db-impact-check.mjs')

    expect(sql).toContain('public.appointments')
    expect(sql).toContain('public.messages')
    expect(sql).toContain('family_can_create_appointment_with_caregiver')
    expect(sql).toContain('caregiver_can_read_participant_appointment')
    expect(sql).toContain('non_participant_cannot_read_messages')
    expect(sql).toContain('contact_filter_sanitizes_phone_in_pending_chat')
    expect(sql).toContain('rollback')

    expect(script).toContain('appointments_chat')
  })

  it('covers caregiver search and gated public profile contracts', () => {
    const sql = read('supabase/sql/db_impact_check_caregiver_search.sql')
    const script = read('scripts/db-impact-check.mjs')

    expect(sql).toContain('search_caregivers_by_proximity')
    expect(sql).toContain('get_caregiver_public_detail')
    expect(sql).toContain('only_families_can_search_by_proximity')
    expect(sql).toContain('profile_complete_caregiver_appears_in_radius_search')
    expect(sql).toContain('free_family_sees_masked_caregiver_detail')
    expect(sql).toContain('active_family_sees_sensitive_caregiver_detail')
    expect(sql).toContain('rollback')

    expect(script).toContain('caregiver_search')
  })

  it('covers caregiver document metadata and storage object isolation', () => {
    const sql = read('supabase/sql/db_impact_check_storage_documents.sql')
    const script = read('scripts/db-impact-check.mjs')

    expect(sql).toContain('public.caregiver_documents')
    expect(sql).toContain('storage.objects')
    expect(sql).toContain('documents_bucket_exists_private')
    expect(sql).toContain('caregiver_can_insert_own_document_metadata')
    expect(sql).toContain('other_caregiver_cannot_read_document_metadata')
    expect(sql).toContain('documents_storage_object_must_be_in_own_folder')
    expect(sql).toContain('rollback')

    expect(script).toContain('storage_documents')
  })

  it('lets maintainers list and print individual or combined suites', () => {
    const script = read('scripts/db-impact-check.mjs')

    expect(script).toContain('--list')
    expect(script).toContain('--print')
    expect(script).toContain('all')
    expect(script).toContain('db_impact_check_all.sql')
  })
})
