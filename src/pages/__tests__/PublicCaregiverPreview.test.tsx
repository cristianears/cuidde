import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicCaregiverPreview from '../PublicCaregiverPreview'
import { COOKIE_CONSENT_KEY } from '@/lib/cookie-consent'

const mockNavigate = vi.fn()
const mockGeocodeAddress = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/geocode', () => ({
  geocodeAddress: () => mockGeocodeAddress(),
}))

vi.mock('@/hooks/usePublicCaregiverPreviews', () => ({
  usePublicCaregiverPreviews: () => ({
    data: [],
    isLoading: false,
  }),
}))

function renderPreview() {
  return render(
    <MemoryRouter initialEntries={['/buscar-cuidadores']}>
      <PublicCaregiverPreview />
    </MemoryRouter>,
  )
}

describe('PublicCaregiverPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGeocodeAddress.mockResolvedValue(null)
    window.localStorage.clear()
    window.dataLayer = []
  })

  it('tracks begin_lead when a visitor searches by CEP from the preview landing page', async () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    renderPreview()

    fireEvent.change(screen.getByLabelText('Buscar por CEP'), { target: { value: '12236-063' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(mockNavigate).toHaveBeenCalledWith('/buscar-cuidadores?cep=12236063', { replace: true })
    expect(window.dataLayer).toContainEqual({
      event: 'begin_lead',
      cep_prefix: '12236',
      destination: '/buscar-cuidadores',
      lead_step: 'cep_search',
      user_role: 'anonymous',
      is_authenticated: false,
    })
    expect(window.dataLayer).toContainEqual({
      event: 'search_by_cep',
      cep_prefix: '12236',
      destination: '/buscar-cuidadores',
      user_role: 'anonymous',
      is_authenticated: false,
    })
    await waitFor(() => expect(mockGeocodeAddress).toHaveBeenCalled())
  })
})
