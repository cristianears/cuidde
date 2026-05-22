import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing auth module
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockResend = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      resend: (...args: unknown[]) => mockResend(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}))

import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  getSession,
  resendConfirmationEmail,
  resetPasswordForEmail,
} from '../auth'

describe('Auth functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUpWithEmail', () => {
    it('calls supabase.auth.signUp with correct params', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      await signUpWithEmail('test@email.com', 'password123', {
        role: 'caregiver',
        full_name: 'João Silva',
        phone: '(11) 99999-9999',
      })

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'password123',
        options: {
          data: {
            role: 'caregiver',
            full_name: 'João Silva',
            phone: '(11) 99999-9999',
          },
          emailRedirectTo: expect.stringContaining('/login'),
        },
      })
    })

    it('passes family role correctly', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { user: { id: '456' } }, error: null })

      await signUpWithEmail('family@email.com', 'pass123', {
        role: 'family',
        full_name: 'Maria',
        phone: '(21) 98888-7777',
      })

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({ role: 'family' }),
          }),
        })
      )
    })
  })

  describe('signInWithEmail', () => {
    it('calls signInWithPassword with email and password', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ data: { session: {} }, error: null })

      await signInWithEmail('test@email.com', 'pass')

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'pass',
      })
    })
  })

  describe('signInWithGoogle', () => {
    it('calls signInWithOAuth with google provider', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://google.com' }, error: null })

      await signInWithGoogle()

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: { prompt: 'select_account' },
        },
      })
    })
  })

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null })
      await signOut()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('getSession', () => {
    it('calls supabase getSession', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null })
      await getSession()
      expect(mockGetSession).toHaveBeenCalled()
    })
  })

  describe('resendConfirmationEmail', () => {
    it('calls resend with signup type', async () => {
      mockResend.mockResolvedValueOnce({ data: {}, error: null })

      await resendConfirmationEmail('test@email.com')

      expect(mockResend).toHaveBeenCalledWith({ type: 'signup', email: 'test@email.com' })
    })
  })

  describe('resetPasswordForEmail', () => {
    it('calls resetPasswordForEmail with redirectTo /reset-password', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

      await resetPasswordForEmail('test@email.com')

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@email.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      })
    })

    it('redirectTo should NOT point to /login', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null })

      await resetPasswordForEmail('test@email.com')

      const call = mockResetPasswordForEmail.mock.calls[0]
      expect(call[1].redirectTo).not.toContain('/login')
      expect(call[1].redirectTo).toContain('/reset-password')
    })
  })
})
