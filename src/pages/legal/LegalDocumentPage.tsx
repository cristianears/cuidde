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
    'A icuide conecta famílias e cuidadores, oferecendo ferramentas para cadastro, busca, solicitações e acompanhamento.',
    'A contratação do serviço de cuidado ocorre diretamente entre família e cuidador, conforme as informações combinadas entre as partes.',
    'A assinatura remunera o acesso à plataforma, pode ser cancelada a qualquer momento e mantém o acesso até o fim do período já pago.',
    'Ao cancelar, a família deve exportar relatórios e histórico de rotina de cuidados antes do fim do período pago, se desejar guardar essas informações.',
    'O direito de arrependimento pode ser exercido no prazo legal de 7 dias pelos canais de atendimento da icuide; pedidos de reembolso ou contestação são analisados pelos canais adequados.',
    'O uso da plataforma exige informações verdadeiras, respeito aos demais usuários e cumprimento das regras publicadas.',
  ],
  privacy: [
    'A icuide trata dados pessoais para criar contas, autenticar usuários, operar perfis, facilitar buscas e manter a segurança da plataforma.',
    'Quando o login com Google é utilizado, recebemos dados básicos de autenticação, como nome, e-mail e identificador da conta, conforme autorizado pelo usuário.',
    'Dados de atendimento, rotina de cuidados, assinatura, cobrança e motivo de cancelamento podem ser tratados para suporte, segurança, reembolso, contestação e cumprimento de obrigações legais.',
    'O cancelamento da assinatura não apaga automaticamente os dados, mas o titular pode solicitar acesso, cópia, correção ou exclusão conforme a LGPD.',
  ],
  cookies: [
    'Usamos cookies necessários para manter a sessão, lembrar preferências e garantir o funcionamento da plataforma.',
    'Cookies não essenciais podem apoiar melhorias de experiência, métricas e comunicações, conforme a escolha do usuário.',
    'Você pode aceitar ou rejeitar cookies não essenciais no banner de consentimento da plataforma.',
  ],
  thirdPartyConsent: [
    'Este termo trata do envio de dados, documentos e informações de terceiros, como idosos, referências profissionais e documentos de suporte.',
    'Ao aceitar, o usuário declara possuir autorização para fornecer essas informações na plataforma.',
    'O tratamento desses dados ocorre para operar o serviço, validar informações, apoiar a contratação e cumprir obrigações legais.',
  ],
}

const LegalDocumentPage = ({ documentKey }: LegalDocumentPageProps) => {
  const document = LEGAL_DOCUMENTS[documentKey]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <a href="/" aria-label="Voltar para a página inicial">
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
                Esta página resume os principais pontos do documento para facilitar a leitura em celulares,
                tablets e computadores. O PDF completo permanece disponível no botão acima e faz parte da
                versão oficial indicada na plataforma.
              </p>

              <ul className="space-y-3">
                {legalHighlights[documentKey].map((item) => (
                  <li key={item} className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-foreground">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="rounded-lg bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                Versão do documento: <span className="font-medium text-foreground">{document.version}</span>.
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
