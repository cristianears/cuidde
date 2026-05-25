import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppSidebar from '../AppSidebar'

const mockNavigate = vi.fn()
const mockUnreadCounts = vi.hoisted(() => ({
  data: undefined as
    | {
        totalUnreadMessages: number
        pendingUnreadMessages: number
        appointmentUnreadMessages: number
        unreadByAppointment: Record<string, number>
        newSolicitations: number
        updatedSolicitations: number
      }
    | undefined,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: () => ({
      on: function () { return this },
      subscribe: () => ({ unsubscribe: vi.fn() }),
      unsubscribe: vi.fn(),
    }),
  },
}))

vi.mock('@/hooks/useUnreadCounts', () => ({
  useUnreadCounts: () => ({ data: mockUnreadCounts.data }),
  useUnreadRealtime: vi.fn(),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

function renderSidebar(props?: Partial<Parameters<typeof AppSidebar>[0]>, initialRoute = '/caregiver') {
  const qc = createTestQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppSidebar role="caregiver" userName="Maria Silva" {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnreadCounts.data = undefined
  })

  it('renderiza o logo ditti', () => {
    renderSidebar()
    expect(screen.getByText('ditti')).toBeInTheDocument()
  })

  it('exibe apenas o primeiro nome do usuário', () => {
    renderSidebar({ userName: 'João Costa' })
    expect(screen.getByText('João')).toBeInTheDocument()
    expect(screen.queryByText('João Costa')).not.toBeInTheDocument()
  })

  it('exibe nome padrão "Usuário" quando userName não é fornecido', () => {
    renderSidebar({ userName: undefined })
    expect(screen.getByText('Usuário')).toBeInTheDocument()
  })

  it('renderiza itens de menu do cuidador', () => {
    renderSidebar({ role: 'caregiver' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('Documentos')).toBeInTheDocument()
    expect(screen.getByText('Disponibilidade')).toBeInTheDocument()
    expect(screen.getByText('Valores')).toBeInTheDocument()
    expect(screen.getByText('Atendimentos')).toBeInTheDocument()
    expect(screen.getByText('Avaliações')).toBeInTheDocument()
    expect(screen.getByText('Suporte')).toBeInTheDocument()
  })

  it('renderiza itens de menu da família', () => {
    renderSidebar({ role: 'family' }, '/family')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Buscar Cuidadores')).toBeInTheDocument()
    expect(screen.getByText('Favoritos')).toBeInTheDocument()
    expect(screen.getByText('Solicitações')).toBeInTheDocument()
    expect(screen.getByText('Plano & Assinatura')).toBeInTheDocument()
    expect(screen.getByText('Meu Perfil')).toBeInTheDocument()
  })

  it('renderiza itens de menu do admin', () => {
    renderSidebar({ role: 'admin' }, '/admin')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Revisões')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
  })

  it('colapsa sidebar ao clicar no botão de toggle', () => {
    renderSidebar()
    const toggleButton = screen.getByLabelText('Recolher menu')
    fireEvent.click(toggleButton)

    // Após colapsar, nome do usuário e wordmark devem sumir
    expect(screen.queryByText('Maria')).not.toBeInTheDocument()
    expect(screen.queryByText('ditti')).not.toBeInTheDocument()
  })

  it('expande sidebar ao clicar no botão de toggle quando colapsada', () => {
    renderSidebar()
    const toggleButton = screen.getByLabelText('Recolher menu')
    fireEvent.click(toggleButton) // colapsa

    const expandButton = screen.getByLabelText('Expandir menu')
    fireEvent.click(expandButton) // expande

    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('ditti')).toBeInTheDocument()
  })

  it('chama signOut e navega para /login ao clicar em Sair', async () => {
    const { signOut } = await import('@/lib/auth')
    renderSidebar()

    const logoutButton = screen.getByText('Sair')
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('exibe foto do usuário quando userPhoto é fornecido', () => {
    renderSidebar({ userPhoto: 'https://example.com/photo.jpg' })
    const img = screen.getByAltText('Maria Silva')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('exibe ícone placeholder quando userPhoto não é fornecido', () => {
    renderSidebar({ userPhoto: undefined })
    // Sem foto, não deve haver img com alt igual ao nome do usuário (só o logo existe)
    expect(screen.queryByAltText('Maria Silva')).not.toBeInTheDocument()
  })

  it('mostra mensagens de solicitacoes pendentes da familia em Solicitacoes, nao em Atendimentos', () => {
    mockUnreadCounts.data = {
      totalUnreadMessages: 2,
      pendingUnreadMessages: 2,
      appointmentUnreadMessages: 0,
      unreadByAppointment: { 'appointment-pendente': 2 },
      newSolicitations: 0,
      updatedSolicitations: 0,
    }

    const { container } = renderSidebar({ role: 'family' }, '/family')

    const solicitacoes = container.querySelector('a[href="/family/matches"]')
    const atendimentos = container.querySelector('a[href="/family/appointments"]')

    expect(solicitacoes).toHaveTextContent('2')
    expect(atendimentos).not.toHaveTextContent('2')
  })
})
