import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CaregiverPublicProfile from '../CaregiverPublicProfile'

const navigateMock = vi.fn()
const downloadMock = vi.fn()

const publicCaregiver = {
  id: 'caregiver-1',
  full_name: 'Rafael Henrique',
  photo_url: null,
  bio: null,
  experience_years: 3,
  profissao_formacao: 'cuidador',
  formacao_complementar: null,
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  price_per_hour: null,
  price_per_day: null,
  pricing_note: null,
  average_rating: 0,
  review_count: 0,
  specialties: [],
  modalities: [],
  idiomas: [],
  possui_cnh: false,
  has_insurance: false,
  professional_reg_number: null,
  emergency_available: false,
  has_rg_cnh: true,
  has_antecedentes: true,
  has_certificado: true,
  has_references: false,
  zona: null,
  cep: null,
  is_available_for_new: true,
  availability_notes: null,
  journey_types: [],
  area_type: null,
  area_radius: null,
  professional_reg_type: null,
  professional_reg_uf: null,
  professional_reg_other_desc: null,
  show_refs_to_subscribers: false,
  mask_reference_phones: true,
  show_reference_full_names: false,
  isSubscriber: true,
  references: [],
  reference_count: 0,
  documents: [
    {
      id: 'doc-pdf',
      type: 'curriculo',
      file_name: 'Curriculo Rafael 2026.PDF',
      file_url: 'caregiver-1/curriculo.pdf',
      status: 'sent',
    },
  ],
  reviews: [],
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'caregiver-1' }),
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/components/shared/AppSidebar', () => ({
  default: () => <aside data-testid="sidebar" />,
}))

vi.mock('@/components/shared/StarRating', () => ({
  default: () => <span data-testid="star-rating" />,
}))

vi.mock('@/components/shared/RequestAppointmentDialog', () => ({
  default: () => <div data-testid="request-dialog" />,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'family-1', user_metadata: {} } }),
}))

vi.mock('@/hooks/useFamilyProfile', () => ({
  useFamilyProfile: () => ({
    data: {
      id: 'family-1',
      subscription_status: 'active',
      profiles: { full_name: 'Familia Teste' },
    },
  }),
}))

vi.mock('@/hooks/usePublicCaregiverProfile', () => ({
  usePublicCaregiverProfile: () => ({ data: publicCaregiver, isLoading: false }),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: () => ({ data: [] }),
  useAddFavorite: () => ({ mutate: vi.fn() }),
  useRemoveFavorite: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/useTrackCaregiverEvent', () => ({
  trackCaregiverView: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        download: downloadMock,
      }),
    },
  },
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <CaregiverPublicProfile />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CaregiverPublicProfile document viewer', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    downloadMock.mockReset()
    URL.createObjectURL = vi.fn()
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('offers an external fallback when previewing a PDF document', async () => {
    downloadMock.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      error: null,
    })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /visualizar/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Se o PDF não aparecer abaixo, abra em uma nova aba.')).toBeInTheDocument()
    expect(screen.getByTitle('Curriculo Rafael 2026.PDF')).toHaveAttribute(
      'src',
      'blob:pdf-preview#toolbar=0&navpanes=0&scrollbar=1',
    )
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /abrir pdf em nova aba/i })).toHaveAttribute(
        'href',
        'blob:pdf-preview',
      )
    })
  })
})
