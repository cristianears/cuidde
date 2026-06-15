import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(resolve(__dirname, '../../supabase/sql/filter_appointment_cancel_reason.sql'), 'utf8')

describe('cancel_reason database filter', () => {
  it('protege o banco contra contato externo no motivo da recusa', () => {
    expect(sql).toContain('filter_appointment_cancel_reason')
    expect(sql).toContain('sanitize_chat_contact_content')
    expect(sql).toContain('before insert or update of cancel_reason, status')
  })
})
