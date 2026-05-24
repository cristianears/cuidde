import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CaregiverCard from '../CaregiverCard'
import type { CaregiverPublic } from '@/types/database'

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
  it('does not allow favoriting when favorites are disabled', () => {
    const onFavorite = vi.fn()

    render(
      <CaregiverCard
        caregiver={caregiver}
        onFavorite={onFavorite}
        canFavorite={false}
      />,
    )

    const button = screen.getByLabelText('Assine um plano para favoritar perfis.')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onFavorite).not.toHaveBeenCalled()
  })
})
