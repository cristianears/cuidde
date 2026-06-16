import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const caregiverSolicitationsSource = readFileSync(
  resolve(__dirname, '../pages/caregiver/CaregiverSolicitations.tsx'),
  'utf8',
)
const familyMatchesSource = readFileSync(resolve(__dirname, '../pages/family/FamilyMatches.tsx'), 'utf8')

describe('exibicao de motivo de recusa', () => {
  it('exibe e edita motivo de recusa sem filtrar contato externo', () => {
    expect(caregiverSolicitationsSource).not.toContain('filterContactInfo(appointment.cancel_reason)')
    expect(caregiverSolicitationsSource).not.toContain('setReason(filterContactInfo(e.target.value))')
    expect(familyMatchesSource).not.toContain('filterContactInfo(appointment.cancel_reason)')
    expect(caregiverSolicitationsSource).toContain('{appointment.cancel_reason}')
    expect(familyMatchesSource).toContain('Motivo: {appointment.cancel_reason}')
  })
})
