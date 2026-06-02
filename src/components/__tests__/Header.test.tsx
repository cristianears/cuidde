import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Header from '../Header'

const mockNavigate = vi.fn()
const mockAuthState = vi.hoisted(() => ({
  user: {
    email: 'jose@example.com',
    user_metadata: { full_name: 'Jose da Silva' },
  },
  profile: { full_name: 'Jose da Silva' },
  role: 'family' as const,
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

vi.mock('@/hooks/useInstallApp', () => ({
  useInstallApp: () => ({
    canShowInstallAction: false,
    installApp: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}))

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the signed-in mobile menu account action as a full-width row', () => {
    renderHeader()

    fireEvent.click(screen.getByLabelText('Abrir menu'))

    expect(screen.getByText('Area da familia')).toBeInTheDocument()

    const accountButton = screen.getByText('Area da familia').closest('button')
    expect(within(accountButton!).getByText('Jose')).toBeInTheDocument()
    expect(accountButton).toHaveClass('w-full')

    fireEvent.click(accountButton!)
    expect(mockNavigate).toHaveBeenCalledWith('/family')
  })
})
