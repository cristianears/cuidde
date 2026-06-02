import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../CaregiverDocuments.tsx'), 'utf8')

describe('CaregiverDocuments copy and progress', () => {
  it('keeps the approval tip concise', () => {
    expect(source).not.toContain('Dica para aprovação rápida')
    expect(source).toContain('Envie documentos claros')
  })

  it('does not render the green all-documents-sent card below progress', () => {
    expect(source).not.toContain('Todos os documentos foram enviados! Nossa equipe')
  })
})
