import { ExternalLink } from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/lib/legal-documents'

interface LegalDocumentPageProps {
  documentKey: LegalDocumentKey
}

const legalHighlights: Record<LegalDocumentKey, string[]> = {
  terms: [
    'A icuide conecta familias e cuidadores, oferecendo ferramentas para cadastro, busca, solicitacoes e acompanhamento.',
    'A contratacao do servico de cuidado ocorre diretamente entre familia e cuidador, conforme as informacoes combinadas entre as partes.',
    'O uso da plataforma exige informacoes verdadeiras, respeito aos demais usuarios e cumprimento das regras publicadas.',
  ],
  privacy: [
    'A icuide trata dados pessoais para criar contas, autenticar usuarios, operar perfis, facilitar buscas e manter a seguranca da plataforma.',
    'Quando o login com Google e utilizado, recebemos dados basicos de autenticacao, como nome, e-mail e identificador da conta, conforme autorizado pelo usuario.',
    'Os dados podem ser usados para suporte, prevencao a fraudes, comunicacoes operacionais e cumprimento de obrigacoes legais.',
  ],
  cookies: [
    'Usamos cookies necessarios para manter a sessao, lembrar preferencias e garantir o funcionamento da plataforma.',
    'Cookies nao essenciais podem apoiar melhorias de experiencia, metricas e comunicacoes, conforme a escolha do usuario.',
    'Voce pode aceitar ou rejeitar cookies nao essenciais no banner de consentimento da plataforma.',
  ],
  thirdPartyConsent: [
    'Este termo trata do envio de dados, documentos e informacoes de terceiros, como idosos, referencias profissionais e documentos de suporte.',
    'Ao aceitar, o usuario declara possuir autorizacao para fornecer essas informacoes na plataforma.',
    'O tratamento desses dados ocorre para operar o servico, validar informacoes, apoiar a contratacao e cumprir obrigacoes legais.',
  ],
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

      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
        <article className="max-w-3xl space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Documento legal icuide</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {document.title}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">{document.description}</p>
          </div>

          <Card>
            <CardContent className="space-y-4 p-5 md:p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                Esta pagina resume os principais pontos do documento para facilitar a leitura em celulares,
                tablets e computadores. O PDF completo permanece disponivel no botao acima e faz parte da
                versao oficial indicada na plataforma.
              </p>

              <ul className="space-y-3">
                {legalHighlights[documentKey].map((item) => (
                  <li key={item} className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-foreground">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="rounded-lg bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                Versao do documento: <span className="font-medium text-foreground">{document.version}</span>.
                Para consultar o texto integral, acesse o PDF oficial.
              </div>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  )
}

export default LegalDocumentPage
