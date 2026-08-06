import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdsCaregiverLanding from '../AdsCaregiverLanding'
import { COOKIE_CONSENT_KEY } from '@/lib/cookie-consent'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, role: null }),
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer>Rodapé</footer>,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AdsCaregiverLanding />
    </MemoryRouter>,
  )
}

describe('AdsCaregiverLanding', () => {
  beforeEach(() => {
    navigate.mockReset()
    window.localStorage.clear()
    window.dataLayer = []
  })

  it('sends a valid CEP to the public caregiver preview and tracks the lead', () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    renderPage()

    fireEvent.change(screen.getByLabelText('Digite seu CEP para buscar cuidadores'), {
      target: { value: '12236063' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ver cuidadores próximos' }))

    expect(navigate).toHaveBeenCalledWith('/buscar-cuidadores?cep=12236063')
    expect(window.dataLayer).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: 'begin_lead', lead_step: 'cep_search' }),
      expect.objectContaining({ event: 'search_by_cep', cep_prefix: '12236' }),
    ]))
  })

  it('takes the final CTA back to the CEP field', () => {
    renderPage()
    const cepInput = screen.getByLabelText('Digite seu CEP para buscar cuidadores')
    const scrollIntoView = vi.fn()
    const focus = vi.fn()
    Object.assign(cepInput, { scrollIntoView, focus })

    fireEvent.click(screen.getByRole('button', { name: 'Buscar cuidadores pelo CEP' }))

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(navigate).not.toHaveBeenCalled()
  })
})
