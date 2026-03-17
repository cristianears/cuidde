import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppSidebar from '../AppSidebar'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}))

function renderSidebar(props?: Partial<Parameters<typeof AppSidebar>[0]>, initialRoute = '/caregiver') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppSidebar role="caregiver" userName="Maria Silva" {...props} />
    </MemoryRouter>
  )
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o logo CuidaBem', () => {
    renderSidebar()
    expect(screen.getByText('CuidaBem')).toBeInTheDocument()
  })

  it('exibe o nome do usuário', () => {
    renderSidebar({ userName: 'João Costa' })
    expect(screen.getByText('João Costa')).toBeInTheDocument()
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
    expect(screen.getByText('Aprovações')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Log do sistema')).toBeInTheDocument()
  })

  it('colapsa sidebar ao clicar no botão de toggle', () => {
    renderSidebar()
    const toggleButton = screen.getByLabelText('Recolher menu')
    fireEvent.click(toggleButton)

    // Após colapsar, nome do usuário e labels devem sumir
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
    expect(screen.queryByText('CuidaBem')).not.toBeInTheDocument()
  })

  it('expande sidebar ao clicar no botão de toggle quando colapsada', () => {
    renderSidebar()
    const toggleButton = screen.getByLabelText('Recolher menu')
    fireEvent.click(toggleButton) // colapsa

    const expandButton = screen.getByLabelText('Expandir menu')
    fireEvent.click(expandButton) // expande

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('CuidaBem')).toBeInTheDocument()
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
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
