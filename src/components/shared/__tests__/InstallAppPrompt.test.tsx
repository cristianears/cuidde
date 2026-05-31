import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InstallAppPrompt from '../InstallAppPrompt'

const installApp = vi.fn()
const mockUseInstallApp = vi.hoisted(() => ({
  canShowInstallAction: true,
  installApp: vi.fn(),
}))

vi.mock('@/hooks/useInstallApp', () => ({
  useInstallApp: () => mockUseInstallApp,
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}))

describe('InstallAppPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    installApp.mockReset()
    mockUseInstallApp.canShowInstallAction = true
    mockUseInstallApp.installApp = installApp.mockResolvedValue('prompted')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an install prompt without requiring the browser menu', async () => {
    render(<InstallAppPrompt />)

    act(() => {
      vi.advanceTimersByTime(1600)
    })

    expect(screen.getByText('Instale o app icuide')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Instalar' })).toBeInTheDocument()
  })

  it('dismisses the prompt for the current session', async () => {
    render(<InstallAppPrompt />)

    act(() => {
      vi.advanceTimersByTime(1600)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }))

    expect(screen.queryByText('Instale o app icuide')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('cuidde_install_prompt_dismissed')).toBe('true')
  })
})
