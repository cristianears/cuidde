// ─── Funções de formatação compartilhadas ────────────────────────────────────
// Centralizadas aqui para evitar duplicação entre componentes.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formata telefone no padrão brasileiro (XX) XXXXX-XXXX
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/**
 * Remove caracteres nao numericos de um CPF e limita a 11 digitos.
 */
export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/**
 * Formata CPF como XXX.XXX.XXX-XX, preservando valores parciais.
 */
export function formatCpf(value: string): string {
  const digits = normalizeCpf(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Valida CPF pelos dois digitos verificadores oficiais.
 */
export function isValidCpf(value: string): boolean {
  const digits = normalizeCpf(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const numbers = digits.split('').map(Number)
  const calculateDigit = (length: number) => {
    const sum = numbers
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculateDigit(9) === numbers[9] && calculateDigit(10) === numbers[10]
}

/**
 * Remove caracteres não-numéricos de um CEP e valida o comprimento (8 dígitos)
 */
export function cleanCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.slice(0, 8)
}

/**
 * Formata dígitos de CEP como XXXXX-XXX
 */
export function formatCep(digits: string): string {
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Formata valor em Real brasileiro (R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data no padrão brasileiro (DD/MM/AAAA)
 */
export function formatDateBR(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(
    typeof date === 'string' ? new Date(date) : date
  )
}

/**
 * Formata data e hora no padrão brasileiro
 */
export function formatDateTimeBR(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(typeof date === 'string' ? new Date(date) : date)
}
