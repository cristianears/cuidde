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
  it('wraps long file names without splitting the file extension', () => {
    render(
      <DocumentUpload
        document={documentBase}
        label="Antecedentes Criminais"
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('.pdf')).toHaveClass('whitespace-nowrap')
  })

  it('shows a view action for uploaded documents', () => {
    render(
      <DocumentUpload
        document={documentBase}
        label="Antecedentes Criminais"
        onView={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /visualizar/i })).toBeVisible()
  })

  it('keeps approved caregiver documents labeled as sent', () => {
    render(
      <DocumentUpload
        document={{ ...documentBase, status: 'approved' }}
        label="Antecedentes Criminais"
      />,
    )

    expect(screen.getByText('Enviado')).toBeVisible()
    expect(screen.queryByText('Aprovado')).not.toBeInTheDocument()
  })
})
