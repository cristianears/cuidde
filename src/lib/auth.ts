import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

export interface SignUpMetadata {
  role: UserRole
  full_name: string
  phone: string
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: SignUpMetadata
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: metadata.role,
        full_name: metadata.full_name,
        phone: metadata.phone,
      },
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
    },
  })
}

/** Usado no cadastro: salva o role no localStorage antes do redirect OAuth */
export async function signInWithGoogleForSignup(role: string) {
  localStorage.setItem('cuidde_pending_role', role)
  return signInWithGoogle()
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

export async function resendConfirmationEmail(email: string) {
  return supabase.auth.resend({ type: 'signup', email })
}
