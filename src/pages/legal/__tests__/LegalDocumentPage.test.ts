import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(resolve(__dirname, '../LegalDocumentPage.tsx'), 'utf8')

describe('LegalDocumentPage', () => {
  it('redirects legal document routes directly to the PDF file', () => {
    expect(pageSource).toContain('window.location.replace(document.path)')
    expect(pageSource).not.toContain('<object')
    expect(pageSource).not.toContain('Seu navegador nao exibiu o PDF nesta tela')
  })
})
