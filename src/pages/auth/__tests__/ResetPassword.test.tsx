import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ResetPassword from '../ResetPassword'

// Mock supabase
const mockUpdateUser = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}))

// Mock sonner toast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderComponent() {
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  )
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the reset password form', () => {
    renderComponent()

    expect(screen.getByText('Redefinir Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /atualizar senha/i })).toBeInTheDocument()
  })

  it('shows error when password does not meet strength requirements', async () => {
    renderComponent()

    const passwordInput = screen.getByLabelText('Nova senha')
    const confirmInput = screen.getByLabelText('Confirmar nova senha')
    const submitBtn = screen.getByRole('button', { name: /atualizar senha/i })

    // Senha fraca: sem maiúscula, sem especial, curta
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmInput, { target: { value: '123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial.'
      )
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    renderComponent()

    const passwordInput = screen.getByLabelText('Nova senha')
    const confirmInput = screen.getByLabelText('Confirmar nova senha')
    const submitBtn = screen.getByRole('button', { name: /atualizar senha/i })

    // Senhas fortes mas diferentes
    fireEvent.change(passwordInput, { target: { value: 'Abc@1234' } })
    fireEvent.change(confirmInput, { target: { value: 'Abc@5678' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('As senhas não coincidem.')
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('calls updateUser and navigates on success', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: {}, error: null })
    renderComponent()

    const passwordInput = screen.getByLabelText('Nova senha')
    const confirmInput = screen.getByLabelText('Confirmar nova senha')
    const submitBtn = screen.getByRole('button', { name: /atualizar senha/i })

    // Senha forte: 8+ chars, maiúscula, especial
    fireEvent.change(passwordInput, { target: { value: 'NewPass@123' } })
    fireEvent.change(confirmInput, { target: { value: 'NewPass@123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass@123' })
      expect(mockToastSuccess).toHaveBeenCalledWith('Senha atualizada com sucesso!')
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('shows error toast when updateUser fails', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: null, error: { message: 'Token expired' } })
    renderComponent()

    const passwordInput = screen.getByLabelText('Nova senha')
    const confirmInput = screen.getByLabelText('Confirmar nova senha')
    const submitBtn = screen.getByRole('button', { name: /atualizar senha/i })

    fireEvent.change(passwordInput, { target: { value: 'NewPass@123' } })
    fireEvent.change(confirmInput, { target: { value: 'NewPass@123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Token expired')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('toggles password visibility', () => {
    renderComponent()

    const passwordInput = screen.getByLabelText('Nova senha')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByLabelText('Mostrar senha')
    fireEvent.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
