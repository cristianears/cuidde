import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const hookSource = readFileSync(resolve(__dirname, '../hooks/useAppointments.ts'), 'utf8')

describe('motivo de recusa', () => {
  it('remove contato externo antes de salvar cancel_reason', () => {
    expect(hookSource).toContain("import { filterContactInfo } from '@/lib/contact-filter'")
    expect(hookSource).toContain('filterContactInfo(payload.cancel_reason)')
  })
})
