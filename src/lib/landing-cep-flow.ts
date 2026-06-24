import type { UserRole } from '@/types/database'

type LandingCepTargetParams = {
  cepDigits: string
  isAuthenticated: boolean
  role: UserRole | null
}

type LoginRegisterTargetParams = {
  email?: string | null
  cep?: string | null
  type?: string | null
  redirect?: string | null
}

type LandingPlanTargetParams = {
  isAuthenticated: boolean
  role: UserRole | null
  isPaidPlan: boolean
}

type FamilyOnboardingCompleteTargetParams = {
  redirect?: string | null
  cep?: string | null
}

type IncompleteOnboardingTargetParams = {
  type?: string | null
  cep?: string | null
  redirect?: string | null
}

const roleHomePath: Record<UserRole, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

function getFamilySearchPath(cepDigits: string): string {
  const params = new URLSearchParams()
  params.set('cep', cepDigits)
  return `/family/search?${params.toString()}`
}

function isSafeAppRedirect(redirect?: string | null): redirect is string {
  return !!redirect
    && redirect.startsWith('/')
    && !redirect.startsWith('//')
    && !redirect.includes('://')
}

function isValidProfileType(type?: string | null): type is 'caregiver' | 'family' {
  return type === 'caregiver' || type === 'family'
}

export function getIncompleteOnboardingTarget({
  type,
  cep,
  redirect,
}: IncompleteOnboardingTargetParams = {}): string {
  const params = new URLSearchParams()
  params.set('from', 'google')
  if (isValidProfileType(type)) params.set('type', type)
  if (cep) params.set('cep', cep)
  if (isSafeAppRedirect(redirect)) params.set('redirect', redirect)

  return `/onboarding?${params.toString()}`
}

export function getLandingCepTarget({
  cepDigits,
  isAuthenticated,
  role,
}: LandingCepTargetParams): string {
  if (isAuthenticated) {
    if (!role) {
      const familySearchPath = getFamilySearchPath(cepDigits)
      return getIncompleteOnboardingTarget({
        type: 'family',
        cep: cepDigits,
        redirect: familySearchPath,
      })
    }

    if (role === 'caregiver' || role === 'admin') {
      return roleHomePath[role]
    }

    return getFamilySearchPath(cepDigits)
  }

  const params = new URLSearchParams()
  params.set('redirect', '/family/search')
  params.set('type', 'family')
  params.set('cep', cepDigits)

  return `/login?${params.toString()}`
}

export function getLoginRegisterTarget({
  email,
  cep,
  type,
  redirect,
}: LoginRegisterTargetParams): string {
  const params = new URLSearchParams()
  const normalizedType = type || (cep ? 'family' : null)

  if (normalizedType) params.set('type', normalizedType)
  if (cep) params.set('cep', cep)
  if (email) params.set('email', email)
  if (isSafeAppRedirect(redirect)) params.set('redirect', redirect)

  const query = params.toString()
  return query ? `/onboarding?${query}` : '/onboarding'
}

export function getLandingPlanTarget({
  isAuthenticated,
  role,
  isPaidPlan,
}: LandingPlanTargetParams): string {
  if (isAuthenticated) {
    if (!role) {
      return getIncompleteOnboardingTarget({
        type: 'family',
        redirect: isPaidPlan ? '/family/billing' : '/family',
      })
    }

    if (role === 'caregiver' || role === 'admin') {
      return roleHomePath[role]
    }

    return isPaidPlan ? '/family/billing' : '/family'
  }

  if (!isPaidPlan) {
    return '/onboarding?type=family'
  }

  const params = new URLSearchParams()
  params.set('redirect', '/family/billing')
  params.set('type', 'family')
  return `/login?${params.toString()}`
}

export function getFamilyOnboardingCompleteTarget({
  redirect,
  cep,
}: FamilyOnboardingCompleteTargetParams): string {
  if (isSafeAppRedirect(redirect)) return redirect

  return cep ? '/family/search' : '/family'
}
