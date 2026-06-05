import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../CaregiverDashboard.tsx'), 'utf8')

describe('CaregiverDashboard profile completeness labels', () => {
  it('only labels the profile as complete when progress is exactly 100 percent', () => {
    expect(source).toContain('const isProfileComplete = profileCompleteness.pct === 100')
    expect(source).toContain('isProfileComplete ? "Perfil Completo" : "Perfil Incompleto"')
    expect(source).toContain('isProfileComplete ? "Perfil completo" : "Perfil incompleto"')
    expect(source).not.toContain('profileCompleteness.pct >= 80')
  })

  it('does not require professional references to complete the searchable profile', () => {
    expect(source).toContain('Referências são diferencial')
    expect(source).not.toContain('useProfessionalReferences')
    expect(source).not.toContain('refs.length >= 1')
    expect(source).not.toContain('refs: ProfessionalReference[]')
    expect(source).not.toContain('getProfileCompleteness(profileData, documents, refs)')
  })

  it('surfaces the daily care routine reminder on the caregiver dashboard', () => {
    expect(source).toContain('useCareRoutineTodayStatus')
    expect(source).toContain('firstAppointmentMissingRoutineToday')
    expect(source).toContain('Já registrou a rotina de cuidados hoje?')
    expect(source).toContain('Registrar rotina')
    expect(source).toContain('/care-routine')
  })
})
