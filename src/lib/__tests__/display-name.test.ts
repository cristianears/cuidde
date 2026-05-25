import { describe, expect, it } from 'vitest'
import { getFirstName, getInitials } from '@/lib/display-name'

describe('display-name helpers', () => {
  it('uses only the first name for compact authenticated UI', () => {
    expect(getFirstName('Cristiane Alves Rodrigues')).toBe('Cristiane')
    expect(getFirstName('  João   Costa  ')).toBe('João')
  })

  it('returns a fallback when the name is empty', () => {
    expect(getFirstName('', 'Usuário')).toBe('Usuário')
    expect(getFirstName(null, 'Meu painel')).toBe('Meu painel')
  })

  it('uses the first-name initial for avatar fallbacks', () => {
    expect(getInitials('Maria Silva')).toBe('M')
    expect(getInitials('')).toBe('')
  })
})
