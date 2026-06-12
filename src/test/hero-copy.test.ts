import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../components/Hero.tsx'), 'utf8')

describe('hero copy', () => {
  it('does not show the removed profile exploration subtitle', () => {
    expect(source).not.toContain('Explore perfis, avaliações e informações enviadas pelos profissionais.')
    expect(source).not.toContain('Quando quiser avançar, você libera o contato e os documentos completos.')
  })
})
