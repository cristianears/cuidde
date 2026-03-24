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
 * Remove caracteres não-numéricos de um CEP e valida o comprimento (8 dígitos)
 */
export function cleanCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.slice(0, 8)
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
