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
    expect(read('public/privacy/index.html')).toContain('Politica de Privacidade')
    expect(read('public/privacy/index.html')).toContain('/legal/politica_privacidade_icuide.pdf')
    expect(read('public/terms/index.html')).toContain('/legal/termos_uso_icuide.pdf')
    expect(read('public/cookies/index.html')).toContain('/legal/politica_cookies_icuide.pdf')
    expect(read('public/_redirects')).toContain('/privacy /privacy/index.html 200')
  })
})
