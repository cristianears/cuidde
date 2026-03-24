// ─── Filtro de contato para chat ──────────────────────────────────────────────
// Detecta telefones, emails e links em mensagens e substitui por placeholder.
// Usado quando o appointment está em status "pendente" (antes do aceite).
// ─────────────────────────────────────────────────────────────────────────────

// Patterns sem /g — usados em hasContactInfo (.test() é stateful com /g)
const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/
const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const URL_PATTERN =
  /https?:\/\/[^\s]+|www\.[^\s]+/i

// Patterns com /g — usados em filterContactInfo (.replace() precisa de /g)
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/g
const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const URL_REGEX =
  /https?:\/\/[^\s]+|www\.[^\s]+/gi

const CONTACT_PLACEHOLDER = '[contato removido]'

export const CONTACT_WARNING_MESSAGE =
  'Para sua segurança, informações de contato são compartilhadas após a confirmação do atendimento.'

const MAX_MESSAGE_LENGTH = 2000

/**
 * Remove informações de contato (telefone, email, links) de uma mensagem.
 * Retorna a mensagem sanitizada.
 */
export function filterContactInfo(text: string): string {
  return text
    .replace(URL_REGEX, CONTACT_PLACEHOLDER)
    .replace(EMAIL_REGEX, CONTACT_PLACEHOLDER)
    .replace(PHONE_REGEX, CONTACT_PLACEHOLDER)
}

/**
 * Verifica se uma mensagem contém informações de contato.
 * Usa patterns sem /g para evitar bug de lastIndex stateful.
 */
export function hasContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text) || URL_PATTERN.test(text)
}

/**
 * Trunca mensagem ao limite máximo permitido.
 */
export function truncateMessage(text: string): string {
  if (text.length <= MAX_MESSAGE_LENGTH) return text
  return text.slice(0, MAX_MESSAGE_LENGTH)
}

export { MAX_MESSAGE_LENGTH }
