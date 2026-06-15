import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const caregiverSolicitationsSource = readFileSync(
  resolve(__dirname, '../pages/caregiver/CaregiverSolicitations.tsx'),
  'utf8',
)
const familyMatchesSource = readFileSync(resolve(__dirname, '../pages/family/FamilyMatches.tsx'), 'utf8')

describe('exibicao de motivo de recusa', () => {
  it('filtra contato externo nos motivos exibidos ao cuidador e a familia', () => {
    expect(caregiverSolicitationsSource).toContain('filterContactInfo(appointment.cancel_reason)')
    expect(caregiverSolicitationsSource).toContain('setReason(filterContactInfo(e.target.value))')
    expect(familyMatchesSource).toContain('filterContactInfo(appointment.cancel_reason)')
  })
})
