import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const hookSource = readFileSync(resolve(__dirname, '../hooks/useAppointments.ts'), 'utf8')

describe('motivo de recusa', () => {
  it('salva cancel_reason sem remover contato externo', () => {
    expect(hookSource).not.toContain("import { filterContactInfo } from '@/lib/contact-filter'")
    expect(hookSource).not.toContain('filterContactInfo(payload.cancel_reason)')
    expect(hookSource).toContain('updateData.cancel_reason = payload.cancel_reason?.trim() || null')
  })
})
