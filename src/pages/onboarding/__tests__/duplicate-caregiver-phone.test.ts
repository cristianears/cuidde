import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../Onboarding.tsx'), 'utf8')
const migration = readFileSync(
  resolve(__dirname, '../../../../supabase/sql/prevent_duplicate_caregiver_phone.sql'),
  'utf8',
)

describe('duplicate caregiver phone prevention', () => {
  it('checks caregiver phone before creating a signup', () => {
    expect(source).toContain('checkDuplicateCaregiverPhone')
    expect(source).toContain('const nextStep = async ()')
    expect(source).toContain('currentStepId === 4')
    expect(source.indexOf('await checkDuplicateCaregiverPhone()')).toBeLessThan(
      source.indexOf('setCurrentStepId(steps[currentStepIndex + 1].id)'),
    )
    expect(source.lastIndexOf('await checkDuplicateCaregiverPhone()')).toBeLessThan(
      source.indexOf('signUpWithEmail('),
    )
    expect(source.lastIndexOf('await checkDuplicateCaregiverPhone()')).toBeLessThan(
      source.indexOf(".from('profiles')")
    )
  })

  it('offers login and password recovery actions when caregiver phone already exists', () => {
    expect(source).toContain('duplicateCaregiverPhoneDetected')
    expect(source).toContain('Entrar com Google')
    expect(source).toContain('Entrar com e-mail')
    expect(source).toContain('Recuperar senha')
    expect(source).toContain('handleExistingGoogleLogin')
    expect(source).toContain('handleExistingEmailLogin')
    expect(source).toContain('handleDuplicatePhonePasswordReset')
  })

  it('explains that the previous login may have been Google or email/password', () => {
    expect(source).toContain('Google')
    expect(source).toContain('e-mail e senha')
    expect(source).toContain('recuperar a senha')
  })

  it('adds a database guard for normalized caregiver phone numbers', () => {
    expect(migration).toContain('caregiver_phone_already_registered')
    expect(migration).toContain('prevent_duplicate_caregiver_phone')
    expect(migration).toContain('profiles_prevent_duplicate_caregiver_phone')
    expect(migration).toContain("errcode = '23505'")
    expect(migration).toContain("regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g')")
    expect(migration).toContain('public.normalize_phone_digits(phone)')
    expect(migration).toContain("role = 'caregiver'")
    expect(migration).not.toContain('b78ddc87-a209-4e0b-a932-8b2ed8b759e1')
    expect(migration).not.toContain('ff55f9ce-c9d7-416c-bab0-bedb0e253636')
  })
})
