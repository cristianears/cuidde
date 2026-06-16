import { describe, expect, it } from 'vitest'
import { filterContactInfo, hasContactInfo } from '@/lib/contact-filter'

describe('contact filter', () => {
  it('detects and removes email addresses', () => {
    const message = 'Pode me chamar no cuidador@example.com'

    expect(hasContactInfo(message)).toBe(true)
    expect(filterContactInfo(message)).toBe('Pode me chamar no [contato removido]')
  })

  it('keeps Brazilian postal codes visible', () => {
    const message = 'Meu CEP e 01310-100'

    expect(hasContactInfo(message)).toBe(false)
    expect(filterContactInfo(message)).toBe(message)
  })

  it('keeps street addresses with numbers visible', () => {
    const message = 'Encontro na Rua das Flores, 123 amanha'

    expect(hasContactInfo(message)).toBe(false)
    expect(filterContactInfo(message)).toBe(message)
  })
})
