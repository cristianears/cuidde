import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const guideSource = readFileSync(resolve(__dirname, '../RoleOnboardingGuide.tsx'), 'utf8')
const videosSource = readFileSync(resolve(__dirname, '../../../config/onboardingVideos.ts'), 'utf8')
const appSource = readFileSync(resolve(__dirname, '../../../App.tsx'), 'utf8')

describe('RoleOnboardingGuide', () => {
  it('keeps YouTube links editable from a project config file', () => {
    expect(videosSource).toContain('onboardingVideoLinks')
    expect(videosSource).toContain('caregiver: ""')
    expect(videosSource).toContain('family: ""')
  })

  it('mounts one global guide inside the authenticated app shell', () => {
    expect(appSource).toContain('RoleOnboardingGuide')
    expect(appSource).toContain('<RoleOnboardingGuide />')
  })

  it('shows caregiver and family guidance from every protected role route', () => {
    expect(guideSource).toContain("location.pathname.startsWith('/caregiver')")
    expect(guideSource).toContain("location.pathname.startsWith('/family')")
    expect(guideSource).toContain('CaregiverRouteOnboardingGuide')
    expect(guideSource).toContain('FamilyRouteOnboardingGuide')
  })

  it('supports video links without hardcoding YouTube URLs into the component', () => {
    expect(guideSource).toContain('onboardingVideoLinks[role]')
    expect(guideSource).toContain('Ver vídeo')
    expect(guideSource).toContain('disabled={!videoUrl}')
    expect(guideSource).toContain('window.open(videoUrl')
  })

  it('keeps onboarding dialog action buttons inside the modal width', () => {
    expect(guideSource).toContain('DialogFooter className="flex-col gap-2 sm:flex-col"')
    expect(guideSource).toContain('className="w-full justify-center"')
    expect(guideSource).toContain('grid w-full grid-cols-1 gap-2 sm:grid-cols-2')
    expect(guideSource).toContain('className="w-full whitespace-normal"')
  })

  it('opens from the sidebar event instead of rendering a floating button', () => {
    expect(guideSource).toContain('ONBOARDING_GUIDE_OPEN_EVENT')
    expect(guideSource).toContain('window.addEventListener(ONBOARDING_GUIDE_OPEN_EVENT')
    expect(guideSource).toContain('window.removeEventListener(ONBOARDING_GUIDE_OPEN_EVENT')
    expect(guideSource).not.toContain('fixed top-3 right-3')
    expect(guideSource).not.toContain('fixed bottom-')
  })

  it('covers the expected caregiver and family onboarding steps', () => {
    expect(guideSource).toContain('Formação')
    expect(guideSource).toContain('Experiência')
    expect(guideSource).toContain('Biografia')
    expect(guideSource).toContain('Especialidades')
    expect(guideSource).toContain('Disponibilidade')
    expect(guideSource).toContain('Documentos')
    expect(guideSource).toContain('Referências')
    expect(guideSource).toContain('Dados do responsável')
    expect(guideSource).toContain('Endereço')
    expect(guideSource).toContain('Perfil do idoso')
    expect(guideSource).toContain('Necessidades de cuidado')
    expect(guideSource).toContain('Buscar cuidadores')
  })
})
