import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VerifyEmail from '../VerifyEmail'

const mockAuthState = vi.hoisted(() => ({
  user: null as { email?: string; email_confirmed_at?: string | null } | null,
}))

const mockResendConfirmationEmail = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/lib/auth', () => ({
  resendConfirmationEmail: (...args: unknown[]) => mockResendConfirmationEmail(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

function renderVerifyEmail() {
  return render(
    <MemoryRouter>
      <VerifyEmail />
    </MemoryRouter>,
  )
}

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAuthState.user = null
  })

  it('uses the pending signup email when there is no active session', async () => {
    localStorage.setItem('cuidde_pending_signup_email', 'cuidadora@example.com')
    mockResendConfirmationEmail.mockResolvedValueOnce({ error: null })

    renderVerifyEmail()

    expect(screen.getByText('cuidadora@example.com')).toBeInTheDocument()

    const resendButton = screen.getByRole('button', { name: /reenviar email/i })
    expect(resendButton).not.toBeDisabled()

    fireEvent.click(resendButton)

    await waitFor(() => {
      expect(mockResendConfirmationEmail).toHaveBeenCalledWith('cuidadora@example.com')
    })
  })

  it('clears the pending signup email after the user is confirmed', () => {
    localStorage.setItem('cuidde_pending_signup_email', 'cuidadora@example.com')
    mockAuthState.user = {
      email: 'cuidadora@example.com',
      email_confirmed_at: '2026-07-17T12:34:00Z',
    }

    renderVerifyEmail()

    expect(localStorage.getItem('cuidde_pending_signup_email')).toBeNull()
  })
})
