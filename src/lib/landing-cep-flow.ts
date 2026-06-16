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
}

const roleHomePath: Record<UserRole, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

export function getLandingCepTarget({
  cepDigits,
  isAuthenticated,
  role,
}: LandingCepTargetParams): string {
  if (isAuthenticated) {
    return role ? roleHomePath[role] : '/family'
  }

  const params = new URLSearchParams()
  params.set('type', 'family')
  params.set('cep', cepDigits)

  return `/login?${params.toString()}`
}

export function getLoginRegisterTarget({
  email,
  cep,
  type,
}: LoginRegisterTargetParams): string {
  const params = new URLSearchParams()
  const normalizedType = type || (cep ? 'family' : null)

  if (normalizedType) params.set('type', normalizedType)
  if (cep) params.set('cep', cep)
  if (email) params.set('email', email)

  const query = params.toString()
  return query ? `/onboarding?${query}` : '/onboarding'
}
