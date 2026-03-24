import { describe, it, expect } from 'vitest'
import { mapCaregiverRow, type RawCaregiverRow } from '@/lib/caregiver-query'

// ─── Factory helper ──────────────────────────────────────────────────────────

function makeRow(overrides: Partial<RawCaregiverRow> = {}): RawCaregiverRow {
  return {
    id: 'test-id-123',
    photo_url: 'https://example.com/photo.jpg',
    bio: 'Bio de teste',
    experience_years: 5,
    profissao_formacao: 'cuidador',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    price_per_hour: 50,
    price_per_day: 350,
    average_rating: 4.5,
    review_count: 10,
    specialties: ['alzheimer', 'parkinson'],
    modalities: ['presencial'],
    idiomas: ['Português'],
    possui_cnh: true,
    has_insurance: false,
    emergency_available: true,
    has_rg_cnh: true,
    has_antecedentes: false,
    has_certificado: true,
    has_references: true,
    zona: 'zona_sul',
    cep: '01310-100',
    profiles: { full_name: 'Maria Silva' },
    ...overrides,
  }
}

// ─── mapCaregiverRow ─────────────────────────────────────────────────────────

describe('mapCaregiverRow', () => {
  it('mapeia todos os campos corretamente', () => {
    const row = makeRow()
    const result = mapCaregiverRow(row)

    expect(result.id).toBe('test-id-123')
    expect(result.full_name).toBe('Maria Silva')
    expect(result.photo_url).toBe('https://example.com/photo.jpg')
    expect(result.bio).toBe('Bio de teste')
    expect(result.experience_years).toBe(5)
    expect(result.city).toBe('São Paulo')
    expect(result.state).toBe('SP')
    expect(result.specialties).toEqual(['alzheimer', 'parkinson'])
    expect(result.modalities).toEqual(['presencial'])
    expect(result.idiomas).toEqual(['Português'])
    expect(result.average_rating).toBe(4.5)
    expect(result.review_count).toBe(10)
    expect(result.price_per_hour).toBe(50)
    expect(result.zona).toBe('zona_sul')
    expect(result.emergency_available).toBe(true)
  })

  it('NÃO expõe lat/lng na busca pública (proteção de privacidade)', () => {
    const result = mapCaregiverRow(makeRow())

    // lat/lng foram removidos do CAREGIVER_SELECT por segurança
    // coordenadas são usadas apenas server-side pela RPC de proximidade
    expect((result as Record<string, unknown>).lat).toBeUndefined()
    expect((result as Record<string, unknown>).lng).toBeUndefined()
  })

  it('mapeia cep corretamente', () => {
    const row = makeRow({ cep: '12236-063' })
    const result = mapCaregiverRow(row)

    expect(result.cep).toBe('12236-063')
  })

  it('protege whatsapp e professional_reg_number (sempre null)', () => {
    const result = mapCaregiverRow(makeRow())

    expect(result.whatsapp).toBeNull()
    expect(result.professional_reg_number).toBeNull()
  })

  it('extrai full_name de profiles (JOIN)', () => {
    const row = makeRow({ profiles: { full_name: 'João Souza' } })
    expect(mapCaregiverRow(row).full_name).toBe('João Souza')
  })

  it('retorna full_name null quando profiles é null', () => {
    const row = makeRow({ profiles: null })
    expect(mapCaregiverRow(row).full_name).toBeNull()
  })

  it('retorna arrays vazios para specialties/modalities/idiomas quando null', () => {
    const row = makeRow({
      specialties: null as unknown as string[],
      modalities: null as unknown as string[],
      idiomas: null as unknown as string[],
    })
    const result = mapCaregiverRow(row)

    expect(result.specialties).toEqual([])
    expect(result.modalities).toEqual([])
    expect(result.idiomas).toEqual([])
  })

  it('mapeia todas as flags de documentos', () => {
    const row = makeRow({
      has_rg_cnh: true,
      has_antecedentes: true,
      has_certificado: false,
      has_references: true,
    })
    const result = mapCaregiverRow(row)

    expect(result.has_rg_cnh).toBe(true)
    expect(result.has_antecedentes).toBe(true)
    expect(result.has_certificado).toBe(false)
    expect(result.has_references).toBe(true)
  })
})
