import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const removedFilterSql = resolve(root, 'supabase/sql/filter_appointment_cancel_reason.sql')
const dropSql = readFileSync(resolve(root, 'supabase/sql/drop_appointment_cancel_reason_filter.sql'), 'utf8')

describe('cancel_reason database filter cleanup', () => {
  it('remove a regra de filtro de contato externo no motivo da recusa', () => {
    expect(existsSync(removedFilterSql)).toBe(false)
    expect(dropSql).toContain('drop trigger if exists appointments_cancel_reason_contact_filter')
    expect(dropSql).toContain('drop function if exists public.filter_appointment_cancel_reason')
  })
})
