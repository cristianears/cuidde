// ─── Filtro de contato para chat ──────────────────────────────────────────────
// Detecta contatos externos em mensagens e substitui por placeholder.
// Usado quando a conversa esta em uma janela de bloqueio de seguranca.
// ─────────────────────────────────────────────────────────────────────────────

// Padrões base (sem flags) — usados para derivar versões com e sem /g
// Telefone: exige DDD de 2 dígitos (obrigatório), evitando falsos positivos em preços e datas
const PHONE_SRC = String.raw`\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}`
const EMAIL_SRC = String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
const URL_SRC = String.raw`https?:\/\/[^\s]+|www\.[^\s]+`

// Sem /g — para .test() (evita bug de lastIndex stateful)
const PHONE_PATTERN = new RegExp(PHONE_SRC)
const EMAIL_PATTERN = new RegExp(EMAIL_SRC)
const URL_PATTERN = new RegExp(URL_SRC, 'i')

const CONTACT_PLACEHOLDER = '[contato removido]'

export const CONTACT_WARNING_MESSAGE =
  'Para sua segurança, telefone, WhatsApp, e-mail e links ficam ocultos enquanto o atendimento está pendente e durante os 7 primeiros dias da assinatura. A liberação acontece a partir do 8º dia.'

export const MAX_MESSAGE_LENGTH = 2000

/**
 * Remove informacoes de contato externo de uma mensagem.
 * Retorna a mensagem sanitizada.
 */
export function filterContactInfo(text: string): string {
  return text
    .replace(new RegExp(URL_SRC, 'gi'), CONTACT_PLACEHOLDER)
    .replace(new RegExp(EMAIL_SRC, 'g'), CONTACT_PLACEHOLDER)
    .replace(new RegExp(PHONE_SRC, 'g'), CONTACT_PLACEHOLDER)
}

/**
 * Verifica se uma mensagem contém informações de contato.
 * Usa patterns sem /g para evitar bug de lastIndex stateful.
 */
export function hasContactInfo(text: string): boolean {
  return (
    PHONE_PATTERN.test(text) ||
    EMAIL_PATTERN.test(text) ||
    URL_PATTERN.test(text)
  )
}

/**
 * Trunca mensagem ao limite máximo permitido.
 */
export function truncateMessage(text: string): string {
  if (text.length <= MAX_MESSAGE_LENGTH) return text
  return text.slice(0, MAX_MESSAGE_LENGTH)
}
