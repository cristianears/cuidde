/**
 * Mascaramento de dados pessoais para exibição pública.
 * Usado no perfil público do cuidador (referências profissionais).
 */

/** Mascara telefone brasileiro: (11)99999-1234 → (11)*****1234 */
export function maskPhoneBrazilian(phone: string): string {
  return phone.replace(/(\d{2})\d{4,5}(\d{4})/, '$1*****$2')
}

/** Abrevia nome: "Maria Aparecida Santos" → "Maria A. S." */
export function abbreviateName(fullName: string): string {
  const parts = fullName.split(' ')
  if (parts.length <= 1) return fullName
  return parts[0] + ' ' + parts.slice(1).map((n) => n[0] + '.').join(' ')
}
