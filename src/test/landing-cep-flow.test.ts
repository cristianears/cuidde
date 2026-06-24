import { describe, expect, it } from 'vitest'
import {
  getFamilyOnboardingCompleteTarget,
  getIncompleteOnboardingTarget,
  getLandingCepTarget,
  getLandingPlanTarget,
  getLoginRegisterTarget,
} from '@/lib/landing-cep-flow'

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

  it('sends authenticated visitors without a completed role back to onboarding with the landing CEP', () => {
    expect(
      getLandingCepTarget({
        cepDigits: '12236063',
        isAuthenticated: true,
        role: null,
      }),
    ).toBe('/onboarding?from=google&type=family&cep=12236063&redirect=%2Ffamily%2Fsearch%3Fcep%3D12236063')
  })

  it('sends authenticated visitors without a completed role back to onboarding for paid plans', () => {
    expect(
      getLandingPlanTarget({
        isAuthenticated: true,
        role: null,
        isPaidPlan: true,
      }),
    ).toBe('/onboarding?from=google&type=family&redirect=%2Ffamily%2Fbilling')
  })

  it('builds a safe onboarding target for incomplete authenticated profiles', () => {
    expect(getIncompleteOnboardingTarget({
      type: 'caregiver',
      cep: '01001-000',
      redirect: 'https://example.com/phishing',
    })).toBe('/onboarding?from=google&type=caregiver&cep=01001-000')
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

  it('sends anonymous visitors from paid plans to login with a billing redirect', () => {
    expect(
      getLandingPlanTarget({
        isAuthenticated: false,
        role: null,
        isPaidPlan: true,
      }),
    ).toBe('/login?redirect=%2Ffamily%2Fbilling&type=family')
  })

  it('sends authenticated families from paid plans directly to billing', () => {
    expect(
      getLandingPlanTarget({
        isAuthenticated: true,
        role: 'family',
        isPaidPlan: true,
      }),
    ).toBe('/family/billing')
  })

  it('preserves the billing redirect when the visitor chooses to register from login', () => {
    expect(
      getLoginRegisterTarget({
        email: 'maria@example.com',
        type: 'family',
        redirect: '/family/billing',
      }),
    ).toBe('/onboarding?type=family&email=maria%40example.com&redirect=%2Ffamily%2Fbilling')
  })

  it('sends family onboarding completion to a safe billing redirect', () => {
    expect(getFamilyOnboardingCompleteTarget({
      redirect: '/family/billing',
      cep: null,
    })).toBe('/family/billing')
  })

  it('ignores unsafe onboarding completion redirects', () => {
    expect(getFamilyOnboardingCompleteTarget({
      redirect: 'https://example.com/phishing',
      cep: null,
    })).toBe('/family')
  })
})
