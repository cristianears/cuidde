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
})
