import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from '../Login'

// Mock auth functions
const mockSignInWithEmail = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/auth', () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
}))

// Mock AuthContext
const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: null as { id: string, role: 'family' | 'caregiver' | 'admin' | null } | null,
  role: null as 'family' | 'caregiver' | 'admin' | null,
  isLoading: false,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

// Mock sonner
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<div>Complete seu cadastro</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.user = null
    mockAuthState.profile = null
    mockAuthState.role = null
    mockAuthState.isLoading = false
  })

  it('renders initial email view', () => {
    renderLogin()

    expect(screen.getByText('Entrar na icuide')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByText('Avançar')).toBeInTheDocument()
    expect(screen.getByText('Cadastrar-se')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('sends authenticated users without a role back to onboarding', async () => {
    mockAuthState.user = { id: 'google-user' }
    mockAuthState.profile = { id: 'google-user', role: null }

    renderLogin('/login?redirect=%2Ffamily%2Fbilling&type=family')

    expect(await screen.findByText('Complete seu cadastro')).toBeInTheDocument()
  })

  it('disables Avançar button when email is invalid', () => {
    renderLogin()

    const advanceBtn = screen.getByText('Avançar')
    expect(advanceBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'invalid' } })
    expect(advanceBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@email.com' } })
    expect(advanceBtn).not.toBeDisabled()
  })

  it('shows password view after clicking Avançar', () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@email.com' } })
    fireEvent.click(screen.getByText('Avançar'))

    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
    expect(screen.getByText('Voltar')).toBeInTheDocument()
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
  })

  it('shows error on failed login', async () => {
    mockSignInWithEmail.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })

    renderLogin()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@email.com' } })
    fireEvent.click(screen.getByText('Avançar'))
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByText('Entrar'))

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@email.com', 'wrongpass')
      expect(mockToastError).toHaveBeenCalledWith('E-mail ou senha incorretos.')
    })
  })

  it('calls signInWithGoogle when Google button clicked', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({ data: { url: 'https://google.com' }, error: null })

    renderLogin()
    fireEvent.click(screen.getByText('Google'))

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })
  })

  it('goes back to email view when Voltar clicked', () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@email.com' } })
    fireEvent.click(screen.getByText('Avançar'))

    expect(screen.getByLabelText('Senha')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Voltar'))

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('sends reset password email', async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

    renderLogin()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@email.com' } })
    fireEvent.click(screen.getByText('Avançar'))
    fireEvent.click(screen.getByText('Esqueceu sua senha?'))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@email.com')
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'E-mail de recuperação enviado! Verifique sua caixa de entrada.'
      )
    })
  })
})
