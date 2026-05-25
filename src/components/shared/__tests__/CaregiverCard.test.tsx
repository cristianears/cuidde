import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CaregiverCard from '../CaregiverCard'
import type { CaregiverPublic } from '@/types/database'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const caregiver: CaregiverPublic = {
  id: 'caregiver-1',
  full_name: 'Maria S.',
  photo_url: null,
  bio: 'Cuidadora experiente.',
  experience_years: 5,
  profissao_formacao: 'cuidador',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  price_per_hour: 40,
  price_per_day: null,
  average_rating: 0,
  review_count: 0,
  specialties: [],
  modalities: [],
  idiomas: [],
  possui_cnh: false,
  has_insurance: false,
  professional_reg_number: null,
  emergency_available: false,
  whatsapp: null,
  has_rg_cnh: false,
  has_antecedentes: false,
  has_certificado: false,
  has_references: false,
  zona: null,
  cep: null,
  is_available_for_new: true,
}

describe('CaregiverCard', () => {
  it('renders the rating with five star icons when the caregiver has reviews', () => {
    render(
      <CaregiverCard
        caregiver={{ ...caregiver, average_rating: 4.2, review_count: 3 }}
      />,
    )

    const ratingCount = screen.getByText('(3)')
    const ratingContainer = ratingCount.parentElement

    expect(ratingContainer?.querySelectorAll('svg')).toHaveLength(5)
    expect(screen.getByText('4.2')).toBeInTheDocument()
  })

  it('keeps long bio text contained without splitting normal words letter by letter', () => {
    const longBio = 'Experiencia'.repeat(40)

    render(<CaregiverCard caregiver={{ ...caregiver, bio: longBio }} />)

    const bio = screen.getByText(longBio)

    expect(bio).toHaveClass(
      'line-clamp-2',
      'overflow-hidden',
      'break-words',
      'max-w-full',
    )
    expect(bio).not.toHaveClass('break-all')
  })

  it('falls back to the first-name initial when the profile photo fails to load', () => {
    render(
      <CaregiverCard
        caregiver={{ ...caregiver, full_name: 'Maria Silva', photo_url: 'https://example.invalid/avatar.jpg' }}
      />,
    )

    fireEvent.error(screen.getByAltText('Maria Silva'))

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('shows the subscription message without favoriting when favorites are disabled', () => {
    const onFavorite = vi.fn()

    render(
      <CaregiverCard
        caregiver={caregiver}
        onFavorite={onFavorite}
        canFavorite={false}
      />,
    )

    const button = screen.getByLabelText('Assine um plano para favoritar perfis.')
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(onFavorite).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Assine um plano para favoritar perfis.')
  })
})
