import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../CaregiverProfile.tsx'), 'utf8')

describe('CaregiverProfile contact field', () => {
  it('renders one WhatsApp / Telefone field instead of separate phone and WhatsApp fields', () => {
    expect(source).toContain('WhatsApp / Telefone')
    expect(source).not.toContain('Label htmlFor="phone"')
    expect(source).not.toContain('Label htmlFor="whatsapp"')
  })

  it('opens the requested profile step from onboarding tour links', () => {
    expect(source).toContain('useSearchParams')
    expect(source).toContain('PROFILE_STEP_BY_QUERY')
    expect(source).toContain('bio: 2')
    expect(source).toContain('specialties: 3')
    expect(source).toContain('references: 4')
    expect(source).toContain('setCurrentStep(requestedStep)')
  })

  it('scrolls to the form content when a profile guide step is selected', () => {
    expect(source).toContain('profileFormRef')
    expect(source).toContain('handleProfileStepChange')
    expect(source).toContain('scrollIntoView')
  })
})
