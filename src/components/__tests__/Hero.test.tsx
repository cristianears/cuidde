import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Hero from '../Hero'
import { COOKIE_CONSENT_KEY } from '@/lib/cookie-consent'

const mockNavigate = vi.fn()
const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: null as 'family' | 'caregiver' | 'admin' | null,
  isLoading: false,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  )
}

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    window.dataLayer = []
    mockAuthState.user = null
    mockAuthState.role = null
    mockAuthState.isLoading = false
  })

  it('submits the CEP search when pressing Enter in the CEP field', () => {
    renderHero()

    const cepInput = screen.getByLabelText('CEP')
    fireEvent.change(cepInput, { target: { value: '12236-063' } })
    fireEvent.keyDown(cepInput, { key: 'Enter', code: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith('/buscar-cuidadores?cep=12236063')
  })

  it('tracks begin_lead after a valid CEP search when analytics consent is accepted', () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    renderHero()

    const cepInput = screen.getByLabelText('CEP')
    fireEvent.change(cepInput, { target: { value: '12236-063' } })
    fireEvent.keyDown(cepInput, { key: 'Enter', code: 'Enter' })

    expect(window.dataLayer).toContainEqual({
      event: 'begin_lead',
      cep_prefix: '12236',
      destination: '/buscar-cuidadores?cep=12236063',
      lead_step: 'cep_search',
      user_role: 'anonymous',
      is_authenticated: false,
    })
    expect(window.dataLayer).toContainEqual({
      event: 'search_by_cep',
      cep_prefix: '12236',
      destination: '/buscar-cuidadores?cep=12236063',
      user_role: 'anonymous',
      is_authenticated: false,
    })
  })
})
