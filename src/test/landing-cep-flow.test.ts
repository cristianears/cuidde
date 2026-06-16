import { describe, expect, it } from 'vitest'
import { getLandingCepTarget, getLoginRegisterTarget } from '@/lib/landing-cep-flow'

describe('landing CEP flow', () => {
  it('sends anonymous visitors to login with a search redirect instead of onboarding', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: false,
        role: null,
      }),
    ).toBe('/login?redirect=%2Ffamily%2Fsearch&type=family&cep=12236063')
  })

  it('sends authenticated families directly to caregiver search with the landing CEP', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: true,
        role: 'family',
      }),
    ).toBe('/family/search?cep=12236063')
  })

  it('sends authenticated visitors without a loaded role to family search with the landing CEP', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: true,
        role: null,
      }),
    ).toBe('/family/search?cep=12236063')
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
