import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  resolve(__dirname, '../../supabase/sql/allow_cancelled_appointment_profile_reads.sql'),
  'utf8',
)

describe('appointment RLS', () => {
  it('mantem dados de perfil visiveis aos participantes quando a solicitacao e recusada', () => {
    expect(sql).toContain('family_profiles: leitura consolidada')
    expect(sql).toContain('profiles: leitura consolidada')
    expect(sql).toContain("'cancelado'::text")
  })
})
