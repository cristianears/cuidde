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
    expect(hookSource).toContain('profiles!caregiver_profiles_id_fkey(full_name, phone)')
    expect(hookSource).not.toContain('profiles!inner(full_name, phone, cpf)')
    expect(hookSource).toContain("supabase.rpc('get_own_caregiver_cpf')")
    expect(hookSource).toContain('cpf: normalizeCpf(payload.cpf)')
    expect(hookSource).toContain('caregiver_cpf_already_registered')
  })

  it('offers pause and account closure actions with required caregiver feedback', () => {
    expect(source).toContain('Encerrar conta')
    expect(source).toContain('Pausar conta')
    expect(source).toContain('caregiverAccountClosureReasons')
    expect(source).toContain('useUpdateCaregiverAccountStatus')
    expect(source).toContain('openAccountDialog("closed")')
    expect(source).toContain('openAccountDialog("paused")')
    expect(source).toContain('account_status: accountAction')
    expect(source).toContain('Conte em poucas palavras')
    expect(source).toContain('selectedAccountReason.value === "other"')
    expect(hookSource).toContain('UpdateCaregiverAccountStatusPayload')
    expect(hookSource).toContain("supabase.from('caregiver_account_feedback')")
    expect(hookSource).toContain("account_status: payload.account_status")
    expect(hookSource).toContain("is_visible: false")
    expect(hookSource).toContain("is_available_for_new: false")
  })

  it('keeps compact neutral account actions inside basic data', () => {
    const basicStepStart = source.indexOf('{currentStep === 1 && (')
    const actionsStart = source.indexOf('Ações da conta')
    const biographyStepStart = source.indexOf('{currentStep === 2 && (')

    expect(actionsStart).toBeGreaterThan(basicStepStart)
    expect(actionsStart).toBeLessThan(biographyStepStart)
    expect(source).not.toContain('Acoes da conta')
    expect(source).toContain('className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"')
  })
})
