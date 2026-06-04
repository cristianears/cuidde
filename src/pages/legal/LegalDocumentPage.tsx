import { ExternalLink } from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/lib/legal-documents'

interface LegalDocumentPageProps {
  documentKey: LegalDocumentKey
}

const LegalDocumentPage = ({ documentKey }: LegalDocumentPageProps) => {
  const document = LEGAL_DOCUMENTS[documentKey]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <a href="/" aria-label="Voltar para a pagina inicial">
            <BrandMark size={30} />
          </a>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={document.path} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir PDF
            </a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-5xl space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {document.title}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">{document.description}</p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <object
                data={document.path}
                type="application/pdf"
                className="h-[72vh] min-h-[520px] w-full bg-muted"
                aria-label={document.title}
              >
                <div className="p-6 text-sm text-muted-foreground">
                  Seu navegador nao exibiu o PDF nesta tela. Abra o documento pelo botao acima.
                </div>
              </object>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default LegalDocumentPage
