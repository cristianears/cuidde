export type LegalDocumentKey = 'terms' | 'privacy' | 'cookies' | 'thirdPartyConsent'

export type LegalConsentType =
  | 'terms_of_use'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'third_party_data'

export interface LegalDocument {
  key: LegalDocumentKey
  title: string
  description: string
  route: string
  path: string
  version: string
  consentType: LegalConsentType
}

export const LEGAL_DOCUMENT_VERSION = '2026-06-04'

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    key: 'terms',
    title: 'Termos de Uso',
    description: 'Regras gerais de uso da plataforma icuide.',
    route: '/terms',
    path: '/legal/termos_uso_icuide.pdf',
    version: LEGAL_DOCUMENT_VERSION,
    consentType: 'terms_of_use',
  },
  privacy: {
    key: 'privacy',
    title: 'Política de Privacidade',
    description: 'Como a icuide trata dados pessoais na plataforma.',
    route: '/privacy',
    path: '/legal/politica_privacidade_icuide.pdf',
    version: LEGAL_DOCUMENT_VERSION,
    consentType: 'privacy_policy',
  },
  cookies: {
    key: 'cookies',
    title: 'Política de Cookies',
    description: 'Como usamos cookies e tecnologias semelhantes.',
    route: '/cookies',
    path: '/legal/politica_cookies_icuide.pdf',
    version: LEGAL_DOCUMENT_VERSION,
    consentType: 'cookie_policy',
  },
  thirdPartyConsent: {
    key: 'thirdPartyConsent',
    title: 'Termo de Consentimento para Tratamento de Dados, Documentos e Informações de Terceiros',
    description: 'Autorização para envio e tratamento de documentos, referências e dados de terceiros.',
    route: '/third-party-data-consent',
    path: '/legal/termo_consentimento_icuide.pdf',
    version: LEGAL_DOCUMENT_VERSION,
    consentType: 'third_party_data',
  },
}
