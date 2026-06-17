import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CONTACT_WARNING_MESSAGE } from '@/lib/contact-filter'

const appointmentChatSource = readFileSync(
  resolve(__dirname, '../pages/chat/AppointmentChat.tsx'),
  'utf8',
)

describe('chat contact warning copy', () => {
  it('does not mention a subscription-day contact lock', () => {
    expect(CONTACT_WARNING_MESSAGE).toContain('atendimento est')
    expect(CONTACT_WARNING_MESSAGE).toContain('pendente')
    expect(CONTACT_WARNING_MESSAGE).not.toContain('7')
    expect(CONTACT_WARNING_MESSAGE).not.toContain('8')
    expect(CONTACT_WARNING_MESSAGE).not.toContain('assinatura')

    expect(appointmentChatSource).not.toContain('7 primeiros dias')
    expect(appointmentChatSource).not.toContain('8Âº dia')
    expect(appointmentChatSource).not.toContain('bloqueio de seguran')
  })
})
