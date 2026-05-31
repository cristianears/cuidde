import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DocumentUpload from '../DocumentUpload'
import type { CaregiverDocument } from '@/types/database'

const documentBase: CaregiverDocument = {
  id: 'doc-1',
  caregiver_id: 'caregiver-1',
  type: 'antecedentes',
  file_url: 'documents/file.pdf',
  file_name: 'certidao-de-antecedentes-criminais-com-nome-muito-muito-longo-para-celular.pdf',
  status: 'sent',
  is_visible: true,
  required: false,
  rejection_reason: null,
  reviewed_at: null,
  uploaded_at: null,
  created_at: '2026-05-31',
}

describe('DocumentUpload', () => {
  it('wraps long file names inside the document card', () => {
    render(
      <DocumentUpload
        document={documentBase}
        label="Antecedentes Criminais"
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText(documentBase.file_name!)).toHaveClass('break-all')
  })
})
