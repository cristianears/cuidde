/**
 * Mascaramento de dados pessoais para exibição pública.
 * Usado no perfil público do cuidador (referências profissionais).
 */

/** Mascara telefone brasileiro: (11)99999-1234 -> *****-1234 */
export function maskPhoneBrazilian(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const lastFour = digits.slice(-4)
  return lastFour ? `*****-${lastFour}` : '*****'
}

export function formatReferencePhoneForFamily(phone: string, shouldMask: boolean): string {
  return shouldMask ? maskPhoneBrazilian(phone) : phone
}

/** Abrevia nome: "Maria Aparecida Santos" → "Maria A. S." */
export function abbreviateName(fullName: string): string {
  const parts = fullName.split(' ')
  if (parts.length <= 1) return fullName
  return parts[0] + ' ' + parts.slice(1).map((n) => n[0] + '.').join(' ')
}
