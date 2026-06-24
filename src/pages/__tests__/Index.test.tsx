import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Index from '../Index'

const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: null as { id: string, role: 'family' | 'caregiver' | 'admin' | null } | null,
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
        <Route path="/onboarding" element={<><div>Complete seu cadastro</div><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Index', () => {
  beforeEach(() => {
    mockAuthState.user = null
    mockAuthState.profile = null
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
    mockAuthState.profile = { id: 'user-1', role: 'family' }
    mockAuthState.role = 'family'

    renderIndex()

    expect(screen.getByText('Family Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/family')
  })

  it('redireciona usuario logado sem role para concluir o onboarding', async () => {
    mockAuthState.user = { id: 'google-user' }
    mockAuthState.profile = { id: 'google-user', role: null }

    renderIndex()

    expect(await screen.findByText('Complete seu cadastro')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding')
  })

  it('mostra Guias da icuide depois do FAQ na landing', () => {
    const source = readFileSync(resolve(__dirname, '../Index.tsx'), 'utf8')

    expect(source.indexOf('<FAQ />')).toBeGreaterThan(-1)
    expect(source.indexOf('<LatestBlogPosts />')).toBeGreaterThan(source.indexOf('<FAQ />'))
  })
})
