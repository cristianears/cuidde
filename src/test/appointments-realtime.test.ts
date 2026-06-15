import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../hooks/useAppointments.ts'), 'utf8')

describe('useAppointments realtime', () => {
  it('invalida a lista de solicitacoes quando appointments muda no banco', () => {
    expect(source).toContain('.on(')
    expect(source).toContain("'postgres_changes'")
    expect(source).toContain("table: 'appointments'")
    expect(source).toContain("queryKeys.appointments(user.id, role)")
    expect(source).toContain('queryKeys.appointmentDetail(appointmentId)')
  })
})
