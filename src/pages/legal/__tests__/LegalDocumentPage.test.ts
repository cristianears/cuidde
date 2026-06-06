import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(resolve(__dirname, '../LegalDocumentPage.tsx'), 'utf8')

describe('LegalDocumentPage', () => {
  it('renders a responsive HTML legal page with a direct PDF action', () => {
    expect(pageSource).toContain('Abrir PDF')
    expect(pageSource).toContain('href={document.path}')
    expect(pageSource).not.toContain('<object')
    expect(pageSource).not.toContain('window.location.replace')
    expect(pageSource).not.toContain('Seu navegador nao exibiu o PDF nesta tela')
  })
})
