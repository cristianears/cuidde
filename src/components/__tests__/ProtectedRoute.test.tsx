import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../ProtectedRoute'

const mockAuthState = vi.hoisted(() => ({
  user: { id: 'google-user', email_confirmed_at: '2026-06-19T13:56:45Z' } as {
    id: string
    email_confirmed_at: string | null
  } | null,
  profile: { id: 'google-user', role: null },
  isLoading: false,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

function renderProtectedRoute(initialEntry = '/family/search?cep=12236063') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/family/search"
          element={(
            <ProtectedRoute role="family">
              <div>Family search</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/onboarding" element={<div>Complete seu cadastro</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthState.user = { id: 'google-user', email_confirmed_at: '2026-06-19T13:56:45Z' }
    mockAuthState.profile = { id: 'google-user', role: null }
    mockAuthState.isLoading = false
  })

  it('sends authenticated users without a role back to onboarding', async () => {
    renderProtectedRoute()

    expect(await screen.findByText('Complete seu cadastro')).toBeInTheDocument()
    expect(screen.queryByText('Family search')).not.toBeInTheDocument()
  })
})
