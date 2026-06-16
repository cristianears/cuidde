import { describe, expect, it } from 'vitest'
import { getLandingCepTarget, getLoginRegisterTarget } from '@/lib/landing-cep-flow'

describe('landing CEP flow', () => {
  it('sends anonymous visitors to login instead of onboarding', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: false,
        role: null,
      }),
    ).toBe('/login?type=family&cep=12236063')
  })

  it('sends authenticated families to their dashboard', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: true,
        role: 'family',
      }),
    ).toBe('/family')
  })

  it('sends authenticated caregivers to their dashboard', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: true,
        role: 'caregiver',
      }),
    ).toBe('/caregiver')
  })

  it('preserves the landing CEP when the visitor chooses to register from login', () => {
    expect(
      getLoginRegisterTarget({
        email: 'maria@example.com',
        cep: '12236063',
        type: 'family',
      }),
    ).toBe('/onboarding?type=family&cep=12236063&email=maria%40example.com')
  })
})
