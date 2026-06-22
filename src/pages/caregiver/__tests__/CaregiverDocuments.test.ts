import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildDocumentSlots } from '../caregiverDocumentSlots'
import type { CaregiverDocument } from '@/types/database'

const source = readFileSync(resolve(__dirname, '../CaregiverDocuments.tsx'), 'utf8')

describe('CaregiverDocuments copy and progress', () => {
  it('keeps the approval tip concise', () => {
    expect(source).not.toContain('Dica para aprovação rápida')
    expect(source).toContain('Envie documentos claros')
  })

  it('does not render the green all-documents-sent card below progress', () => {
    expect(source).not.toContain('Todos os documentos foram enviados! Nossa equipe')
  })

  it('keeps RG/CNH required after an uploaded row is merged into the document slots', () => {
    const uploadedRgCnh = {
      id: 'doc-rg-cnh',
      caregiver_id: 'caregiver-id',
      type: 'rg_cnh',
      file_url: 'caregiver-id/rg-cnh.pdf',
      file_name: 'rg-cnh.pdf',
      status: 'sent',
      is_visible: true,
      required: false,
      rejection_reason: null,
      reviewed_at: null,
      uploaded_at: '2026-06-22T12:00:00.000Z',
      created_at: '2026-06-22T12:00:00.000Z',
    } satisfies CaregiverDocument

    const documents = buildDocumentSlots([uploadedRgCnh])

    expect(documents.find((doc) => doc.type === 'rg_cnh')?.required).toBe(true)
    expect(documents.find((doc) => doc.type === 'curriculo')?.required).toBe(false)
  })
})
