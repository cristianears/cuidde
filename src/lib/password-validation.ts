// ─── Validação de senha centralizada ─────────────────────────────────────────
// Mesmas regras usadas em Onboarding e ResetPassword.
// ─────────────────────────────────────────────────────────────────────────────

export interface PasswordStrength {
  hasMinLength: boolean
  hasUpperCase: boolean
  hasSpecialChar: boolean
  isStrong: boolean
}

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>]/

export function checkPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH
  const hasUpperCase = /[A-Z]/.test(password)
  const hasSpecialChar = PASSWORD_SPECIAL_CHARS.test(password)

  return {
    hasMinLength,
    hasUpperCase,
    hasSpecialChar,
    isStrong: hasMinLength && hasUpperCase && hasSpecialChar,
  }
}

export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength' as const, label: 'Mínimo 8 caracteres', check: (s: PasswordStrength) => s.hasMinLength },
  { key: 'upperCase' as const, label: 'Pelo menos 1 letra maiúscula', check: (s: PasswordStrength) => s.hasUpperCase },
  { key: 'specialChar' as const, label: 'Pelo menos 1 caractere especial (!@#$%...)', check: (s: PasswordStrength) => s.hasSpecialChar },
]
