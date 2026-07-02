import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../components/Hero.tsx'), 'utf8')

describe('hero copy', () => {
  it('names cuidadores de idosos in the main searchable headline', () => {
    expect(source).toContain('Encontre cuidadores de idosos')
    expect(source).toContain('perto de você')
  })

  it('keeps the desktop hero headline split into balanced intentional lines', () => {
    expect(source).toContain('<span className="hidden sm:block">Encontre cuidadores de idosos</span>')
    expect(source).toContain('<span className="hidden sm:block">perto de você</span>')
    expect(source).toContain('<span className="hidden sm:block text-primary-foreground/90">com transparência e calma</span>')
  })

  it('keeps the mobile hero headline from isolating a single word', () => {
    expect(source).toContain('<span className="block sm:hidden">Encontre cuidadores</span>')
    expect(source).toContain('<span className="block sm:hidden">de idosos perto de você</span>')
    expect(source).toContain('<span className="block sm:hidden text-primary-foreground/90">com transparência e calma</span>')
  })

  it('does not show the removed profile exploration subtitle', () => {
    expect(source).not.toContain('Explore perfis, avaliações e informações enviadas pelos profissionais.')
    expect(source).not.toContain('Quando quiser avançar, você libera o contato e os documentos completos.')
  })
})
