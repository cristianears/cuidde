import { useEffect } from 'react'
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/lib/legal-documents'

interface LegalDocumentPageProps {
  documentKey: LegalDocumentKey
}

const LegalDocumentPage = ({ documentKey }: LegalDocumentPageProps) => {
  const document = LEGAL_DOCUMENTS[documentKey]

  useEffect(() => {
    window.location.replace(document.path)
  }, [document.path])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={document.path}>
        Abrindo {document.title}
      </a>
    </div>
  )
}

export default LegalDocumentPage
