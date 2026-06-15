import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('legal document links', () => {
  it('exposes crawlable legal links on the homepage shell and footer', () => {
    expect(read('index.html')).toContain('href="/privacy/"')

    const footer = read('src/components/Footer.tsx')
    expect(footer).toContain('href="/privacy/"')
    expect(footer).toContain('href="/terms/"')
    expect(footer).toContain('href="/cookies/"')
    expect(footer).not.toContain('navigate("/privacy")')
  })

  it('keeps consent links opening the official PDFs directly', () => {
    expect(read('src/pages/onboarding/Onboarding.tsx')).toContain('LEGAL_DOCUMENTS.privacy.path')
    expect(read('src/pages/caregiver/CaregiverProfile.tsx')).toContain('LEGAL_DOCUMENTS.thirdPartyConsent.path')
    expect(read('src/pages/caregiver/CaregiverDocuments.tsx')).toContain('LEGAL_DOCUMENTS.thirdPartyConsent.path')
    expect(read('src/pages/family/FamilyProfile.tsx')).toContain('LEGAL_DOCUMENTS.thirdPartyConsent.path')
  })

  it('publishes static responsive pages for Google Auth verification', () => {
    expect(read('public/privacy/index.html')).toContain('Política de Privacidade')
    expect(read('public/privacy/index.html')).toContain('usuários')
    expect(read('public/privacy/index.html')).not.toContain('Politica de Privacidade')
    expect(read('public/privacy/index.html')).not.toContain('usuario')
    expect(read('public/terms/index.html')).toContain('informações verdadeiras')
    expect(read('public/terms/index.html')).toContain('cancelada a qualquer momento')
    expect(read('public/terms/index.html')).toContain('exportar relatórios e histórico de rotina de cuidados')
    expect(read('public/terms/index.html')).toContain('direito de arrependimento')
    expect(read('public/terms/index.html')).toContain('contatos externos podem ficar ocultos')
    expect(read('public/privacy/index.html')).toContain('motivos de cancelamento')
    expect(read('public/privacy/index.html')).toContain('filtragem técnica proporcional')
    expect(read('public/privacy/index.html')).toContain('não apaga automaticamente os dados')
    expect(read('public/cookies/index.html')).toContain('Política de Cookies')
    expect(read('public/cookies/index.html')).toContain('Cookies necessários')
    expect(read('public/privacy/index.html')).toContain('/legal/politica_privacidade_icuide.pdf')
    expect(read('public/terms/index.html')).toContain('/legal/termos_uso_icuide.pdf')
    expect(read('public/cookies/index.html')).toContain('/legal/politica_cookies_icuide.pdf')
    expect(read('public/privacy/index.html')).toContain('brand-logo')
    expect(read('public/privacy/index.html')).not.toContain('<img src="/logo.png"')
    expect(read('public/_redirects')).toContain('/privacy /privacy/index.html 200')
  })

  it('uses accented Portuguese in SPA legal summaries and consent labels', () => {
    expect(read('src/lib/legal-documents.ts')).toContain('Política de Privacidade')
    expect(read('src/lib/legal-documents.ts')).toContain('Informações de Terceiros')
    expect(read('src/pages/legal/LegalDocumentPage.tsx')).toContain('Esta página resume')
    expect(read('src/pages/legal/LegalDocumentPage.tsx')).toContain('usuários')
    expect(read('src/pages/legal/LegalDocumentPage.tsx')).toContain('Reembolso integral')
    expect(read('src/pages/legal/LegalDocumentPage.tsx')).toContain('histórico de rotina de cuidados')
    expect(read('src/pages/legal/LegalDocumentPage.tsx')).toContain('contatos externos podem ficar ocultos')
    expect(read('src/pages/onboarding/Onboarding.tsx')).toContain('Política de Privacidade')
    expect(read('src/pages/family/FamilyProfile.tsx')).toContain('Termo já aceito')
  })

  it('documents subscription cancellation and refund rules in the official legal sources', () => {
    const terms = read('docs/legal/termos-de-uso.md')
    const privacy = read('docs/legal/politica-de-privacidade-lgpd.md')
    const pdfScript = read('scripts/generate-legal-pdfs.mjs')

    expect(terms).toContain('Cancelamento, renovação e reembolso de assinaturas')
    expect(terms).toContain('Histórico da rotina de cuidados após cancelamento')
    expect(terms).toContain('exporte ou salve, antes do fim do período pago')
    expect(terms).toContain('direito de arrependimento no prazo legal de 7 dias')
    expect(terms).toContain('primeiros 7 dias da primeira assinatura paga')
    expect(terms).toContain('contatos externos')
    expect(terms).toContain('não serão reembolsados de forma proporcional')
    expect(terms).toContain('contato@icuide.com.br')
    expect(privacy).toContain('motivo informado em caso de cancelamento de assinatura')
    expect(privacy).toContain('Cancelamento e reembolso')
    expect(privacy).toContain('não gera exclusão automática dos dados da conta')
    expect(privacy).toContain('rotina de cuidados')
    expect(privacy).toContain('filtragem técnica')
    expect(terms).not.toContain('revisado periodicamente por advogado')
    expect(privacy).not.toContain('revisado periodicamente por advogado')
    expect(pdfScript).toContain('termos_uso_icuide.pdf')
    expect(pdfScript).toContain('politica_cookies_icuide.pdf')
    expect(pdfScript).toContain('data:image/png;base64')
    expect(pdfScript).toContain("public/logo.png")
    expect(pdfScript).not.toContain('<img src="file:///')
  })
})
