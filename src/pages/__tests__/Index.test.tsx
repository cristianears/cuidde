import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Index from '../Index'

const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: null as 'family' | 'caregiver' | 'admin' | null,
  isLoading: false,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/components/Header', () => ({ default: () => <div>Landing Header</div> }))
vi.mock('@/components/Hero', () => ({ default: () => <div>Landing Hero</div> }))
vi.mock('@/components/TwoPaths', () => ({ default: () => <div /> }))
vi.mock('@/components/Benefits', () => ({ default: () => <div /> }))
vi.mock('@/components/Trust', () => ({ default: () => <div /> }))
vi.mock('@/components/HiringFlexibility', () => ({ default: () => <div /> }))
vi.mock('@/components/HowItWorks', () => ({ default: () => <div /> }))
vi.mock('@/components/CareRoutinePreview', () => ({ default: () => <div /> }))
vi.mock('@/components/Pricing', () => ({ default: () => <div /> }))
vi.mock('@/components/WhyItMatters', () => ({ default: () => <div /> }))
vi.mock('@/components/LatestBlogPosts', () => ({ default: () => <div /> }))
vi.mock('@/components/CaregiverCTA', () => ({ default: () => <div /> }))
vi.mock('@/components/FinalCTA', () => ({ default: () => <div /> }))
vi.mock('@/components/FAQ', () => ({ default: () => <div /> }))
vi.mock('@/components/Footer', () => ({ default: () => <div /> }))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderIndex() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<><Index /><LocationProbe /></>} />
        <Route path="/family" element={<><div>Family Dashboard</div><LocationProbe /></>} />
        <Route path="/caregiver" element={<><div>Caregiver Dashboard</div><LocationProbe /></>} />
        <Route path="/admin" element={<><div>Admin Dashboard</div><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Index', () => {
  beforeEach(() => {
    mockAuthState.user = null
    mockAuthState.role = null
    mockAuthState.isLoading = false
  })

  it('mantem a landing para visitantes sem sessao', () => {
    renderIndex()

    expect(screen.getByText('Landing Header')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('redireciona usuario logado para o dashboard do perfil', () => {
    mockAuthState.user = { id: 'user-1' }
    mockAuthState.role = 'family'

    renderIndex()

    expect(screen.getByText('Family Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/family')
  })
})
