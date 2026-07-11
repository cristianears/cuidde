import { supabase } from '@/lib/supabase'
import { normalizeCpf } from '@/lib/formatters'
import { getPersonNameError, normalizePersonName } from '@/lib/person-name'
import type { UserRole } from '@/types/database'

export interface SignUpMetadata {
  role: UserRole
  full_name: string
  phone: string
  cpf?: string
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: SignUpMetadata
) {
  const nameError = getPersonNameError(metadata.full_name)
  if (nameError) throw new Error(nameError)

  const cpf = metadata.cpf ? normalizeCpf(metadata.cpf) : undefined
  const fullName = normalizePersonName(metadata.full_name)

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: metadata.role,
        full_name: fullName,
        phone: metadata.phone,
        ...(cpf ? { cpf } : {}),
      },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { prompt: 'select_account' },
    },
  })
}


export async function signOut() {
  return supabase.auth.signOut({ scope: 'global' })
}

export async function getSession() {
  return supabase.auth.getSession()
}

export async function resendConfirmationEmail(email: string) {
  return supabase.auth.resend({ type: 'signup', email })
}

export async function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}
