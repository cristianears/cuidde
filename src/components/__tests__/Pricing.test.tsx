import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Pricing from '../Pricing'

const mockNavigate = vi.fn()
const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: null as 'family' | 'caregiver' | 'admin' | null,
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

function renderPricing() {
  return render(
    <MemoryRouter>
      <Pricing />
    </MemoryRouter>,
  )
}

describe('Pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.user = null
    mockAuthState.role = null
  })

  it('sends anonymous visitors from paid plan CTAs to login with a billing redirect', () => {
    renderPricing()

    fireEvent.click(screen.getByRole('button', { name: /Assinar mensal/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Ffamily%2Fbilling&type=family')
  })

  it('sends authenticated families from paid plan CTAs directly to billing', () => {
    mockAuthState.user = { id: 'family-user' }
    mockAuthState.role = 'family'

    renderPricing()

    fireEvent.click(screen.getByRole('button', { name: /Assinar anual/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/family/billing')
  })
})
