import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Hero from '../Hero'

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
    mockAuthState.user = null
    mockAuthState.role = null
    mockAuthState.isLoading = false
  })

  it('submits the CEP search when pressing Enter in the CEP field', () => {
    renderHero()

    const cepInput = screen.getByLabelText('CEP')
    fireEvent.change(cepInput, { target: { value: '12236-063' } })
    fireEvent.keyDown(cepInput, { key: 'Enter', code: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Ffamily%2Fsearch&type=family&cep=12236063')
  })
})
