import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RoleOnboardingGuide, { ONBOARDING_GUIDE_OPEN_EVENT } from '../RoleOnboardingGuide'

const mockAuth = vi.hoisted(() => ({
  role: 'caregiver' as 'caregiver' | 'family',
}))

const mockCaregiverProfile = vi.hoisted(() => ({
  data: undefined as unknown,
}))

const mockDocuments = vi.hoisted(() => ({
  data: [] as unknown[],
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ role: mockAuth.role }),
}))

vi.mock('@/hooks/useCaregiverProfile', () => ({
  useCaregiverProfile: () => ({ data: mockCaregiverProfile.data }),
}))

vi.mock('@/hooks/useCaregiverDocuments', () => ({
  useDocuments: () => ({ data: mockDocuments.data }),
}))

vi.mock('@/hooks/useFamilyProfile', () => ({
  useFamilyProfile: () => ({ data: undefined }),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: () => ({ data: [] }),
}))

function renderGuide(route = '/caregiver') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <RoleOnboardingGuide />
    </MemoryRouter>,
  )
}

describe('RoleOnboardingGuide behavior', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockAuth.role = 'caregiver'
    mockCaregiverProfile.data = {
      bio: 'Experiencia longa em cuidados domiciliares, acompanhamento de idosos, rotinas, medicacao, banho, companhia e comunicacao com familiares. Trabalho com cuidado humanizado, organizacao da rotina e contato claro com a familia.',
      profissao_formacao: 'Tecnico em enfermagem',
      formacao_complementar: '',
      experience_years: 5,
      specialties: ['idosos'],
      is_available_for_new: true,
      journey_types: [],
      availability_notes: '',
      has_references: true,
    }
    mockDocuments.data = [
      {
        type: 'rg_cnh',
        status: 'approved',
      },
    ]
  })

  it('opens a completed guide summary when the sidebar event is dispatched and every step is done', async () => {
    renderGuide()

    fireEvent(window, new CustomEvent(ONBOARDING_GUIDE_OPEN_EVENT))

    expect(await screen.findByText('Guia completo')).toBeInTheDocument()
    expect(screen.getByText('Tudo certo por agora')).toBeInTheDocument()
  })
})
