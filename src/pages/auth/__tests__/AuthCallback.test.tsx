import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthCallback from '../AuthCallback'

const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isLoading: false,
}))

const mockSingle = vi.hoisted(() => vi.fn())
const mockMaybeSingle = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  },
}))

function renderCallback() {
  return render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/caregiver" element={<div>Dashboard cuidador</div>} />
        <Route path="/caregiver/profile" element={<div>Cadastro profissional do cuidador</div>} />
        <Route path="/family" element={<div>Dashboard familia</div>} />
        <Route path="/onboarding" element={<div>Complete seu cadastro</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAuthState.user = null
    mockAuthState.isLoading = false
  })

  it('sends an existing Google signup attempt to the dashboard instead of onboarding', async () => {
    mockAuthState.user = { id: 'existing-caregiver' }
    localStorage.setItem('cuidde_pending_signup', 'true')
    localStorage.setItem('cuidde_onboarding_data', JSON.stringify({ type: 'caregiver' }))
    mockSingle.mockResolvedValueOnce({ data: { role: 'caregiver' }, error: null })
    mockMaybeSingle.mockResolvedValueOnce({ data: { initial_setup_completed_at: '2026-01-01T00:00:00Z', initial_setup_step: 6 }, error: null })

    renderCallback()

    expect(await screen.findByText('Dashboard cuidador')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Complete seu cadastro')).not.toBeInTheDocument()
      expect(localStorage.getItem('cuidde_pending_signup')).toBeNull()
    })
  })

  it('sends a new caregiver to the professional setup after authentication', async () => {
    mockAuthState.user = { id: 'new-caregiver' }
    mockSingle.mockResolvedValueOnce({ data: { role: 'caregiver' }, error: null })
    mockMaybeSingle.mockResolvedValueOnce({ data: { initial_setup_completed_at: null, initial_setup_step: 2 }, error: null })

    renderCallback()

    expect(await screen.findByText('Cadastro profissional do cuidador')).toBeInTheDocument()
  })
})
