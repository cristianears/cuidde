import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Pricing from '../Pricing'

const mockNavigate = vi.fn()
const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: null as 'family' | 'caregiver' | 'admin' | null,
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

function renderPricing() {
  return render(
    <MemoryRouter>
      <Pricing />
    </MemoryRouter>,
  )
}

describe('Pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.user = null
    mockAuthState.role = null
  })

  it('sends anonymous visitors from paid plan CTAs to login with a billing redirect', () => {
    renderPricing()

    fireEvent.click(screen.getByRole('button', { name: /Assinar mensal/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Ffamily%2Fbilling&type=family')
  })

  it('sends authenticated families from paid plan CTAs directly to billing', () => {
    mockAuthState.user = { id: 'family-user' }
    mockAuthState.role = 'family'

    renderPricing()

    fireEvent.click(screen.getByRole('button', { name: /Assinar anual/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/family/billing')
  })

  it('shows the approved plan copy, totals, and discount badges', () => {
    renderPricing()

    expect(screen.getByText('Planos para encontrar cuidadores de idosos')).toBeInTheDocument()
    expect(screen.getByText('Chat, documentos e perfis completos por 30 dias.')).toBeInTheDocument()
    expect(screen.getByText('Acesso a certificados, antecedentes e referências')).toBeInTheDocument()
    expect(screen.getAllByText('Acesso ao histórico de cuidados e registros de ocorrências')).toHaveLength(3)

    expect(screen.getByText('R$ 79,99')).toBeInTheDocument()
    expect(screen.getByText('total R$ 239,97')).toBeInTheDocument()
    expect(screen.getByText('Melhor custo-benefício')).toBeInTheDocument()
    expect(screen.getByText('37% off')).toHaveClass('text-sm')
    expect(screen.getByText('37% off').parentElement).toHaveClass('bg-[#22CF5C]', 'text-white', 'py-1')
    expect(screen.getByText('35% off')).toHaveClass('text-sm')
    expect(screen.getByText('35% off').parentElement).toHaveClass('py-1')

    expect(screen.queryByText(/Acesso a documentos enviados pelo profissional/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+% de desconto/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Rotina de Cuidados e registro de ocorrências/i)).not.toBeInTheDocument()
  })
})
