import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../CaregiverProfile.tsx'), 'utf8')
const hookSource = readFileSync(resolve(__dirname, '../../../hooks/useCaregiverProfile.ts'), 'utf8')

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

  it('shows and persists CPF in the basic caregiver profile data', () => {
    expect(source).toContain('Label htmlFor="cpf"')
    expect(source).toContain('formatCpf')
    expect(source).toContain('isValidCpf')
    expect(source).toContain('cpf: formatCpf(profileData.profiles.cpf ?? "")')
    expect(source).toContain('cpf: formData.cpf')
    expect(hookSource).not.toContain('profiles!inner(full_name, phone, cpf)')
    expect(hookSource).toContain("supabase.rpc('get_own_caregiver_cpf')")
    expect(hookSource).toContain('cpf: normalizeCpf(payload.cpf)')
    expect(hookSource).toContain('caregiver_cpf_already_registered')
  })
})
