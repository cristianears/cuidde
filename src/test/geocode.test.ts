import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globalmente
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock ViaCEP
vi.mock('@/lib/viacep', () => ({
  fetchAddressByCep: vi.fn(),
}))

// Forçar Google Maps API key vazia para testes isolarem o Nominatim
vi.mock('@/lib/geocode', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/geocode')>()
  return mod
})

import { geocodeAddress, geocodeByCity } from '@/lib/geocode'
import { fetchAddressByCep } from '@/lib/viacep'
const mockViaCep = vi.mocked(fetchAddressByCep)

// Helper: mock Google Maps retornando REQUEST_DENIED (simula key com restrição)
function mockGoogleDenied() {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ status: 'REQUEST_DENIED', results: [] }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── geocodeAddress ──────────────────────────────────────────────────────────

describe('geocodeAddress', () => {
  it('retorna null quando não recebe cep nem address', async () => {
    const result = await geocodeAddress({})
    expect(result).toBeNull()
  })

  it('resolve CEP via ViaCEP + Nominatim structured query (rua+cidade)', async () => {
    // Google Maps falha
    mockGoogleDenied()

    mockViaCep.mockResolvedValue({
      street: 'Rua Ângelo Bravini',
      neighborhood: 'Jardim Terras do Sul',
      city: 'São José dos Campos',
      state: 'SP',
    })

    // Nominatim structured query retorna resultado
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{
        lat: '-23.2465',
        lon: '-45.8954',
        display_name: 'Rua Ângelo Bravini, São José dos Campos',
      }]),
    })

    const result = await geocodeAddress({ cep: '12236-063' })

    expect(mockViaCep).toHaveBeenCalledWith('12236-063')
    expect(result).toEqual({
      lat: -23.2465,
      lng: -45.8954,
      formatted_address: 'Rua Ângelo Bravini, São José dos Campos',
    })
  })

  it('fallback para free-text quando structured query falha', async () => {
    mockGoogleDenied()

    mockViaCep.mockResolvedValue({
      street: 'Rua Inexistente',
      neighborhood: 'Bairro X',
      city: 'São Paulo',
      state: 'SP',
    })

    // Structured query: vazio
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    })
    // Free-text: retorna resultado
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{
        lat: '-23.55',
        lon: '-46.63',
        display_name: 'São Paulo, SP, Brasil',
      }]),
    })

    const result = await geocodeAddress({ cep: '01310-100' })

    expect(result).toEqual({
      lat: -23.55,
      lng: -46.63,
      formatted_address: 'São Paulo, SP, Brasil',
    })
  })

  it('fallback para geocodeByCity quando free-text também falha', async () => {
    mockGoogleDenied()

    mockViaCep.mockResolvedValue({
      street: '',
      neighborhood: '',
      city: 'Campinas',
      state: 'SP',
    })

    // Free-text: vazio (sem street → pula structured)
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    })
    // geocodeByCity → Google Maps falha
    mockGoogleDenied()
    // geocodeByCity → Nominatim city: retorna resultado
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{
        lat: '-22.90',
        lon: '-47.06',
        display_name: 'Campinas, SP',
      }]),
    })

    const result = await geocodeAddress({ cep: '13000-000' })

    expect(result).toEqual({
      lat: -22.90,
      lng: -47.06,
      formatted_address: 'Campinas, SP',
    })
  })

  it('retorna null quando ViaCEP não resolve o CEP', async () => {
    mockGoogleDenied()
    mockViaCep.mockResolvedValue(null)

    const result = await geocodeAddress({ cep: '00000-000' })
    expect(result).toBeNull()
  })

  it('geocodifica address diretamente via Nominatim free-text', async () => {
    mockGoogleDenied()

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{
        lat: '-23.56',
        lon: '-46.65',
        display_name: 'Av Paulista, São Paulo',
      }]),
    })

    const result = await geocodeAddress({ address: 'Av Paulista, São Paulo, SP' })

    expect(result).toEqual({
      lat: -23.56,
      lng: -46.65,
      formatted_address: 'Av Paulista, São Paulo',
    })
    expect(mockViaCep).not.toHaveBeenCalled()
  })

  it('NÃO envia CEP brasileiro diretamente para Nominatim free-text', async () => {
    mockGoogleDenied()

    mockViaCep.mockResolvedValue({
      street: 'Rua Teste',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    })

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve([{
        lat: '-23.55',
        lon: '-46.63',
        display_name: 'São Paulo',
      }]),
    })

    await geocodeAddress({ cep: '01310-100' })

    // Verifica que nenhuma chamada Nominatim contém o CEP bruto
    for (const call of mockFetch.mock.calls) {
      const url = call[0] as string
      if (url.includes('nominatim')) {
        expect(url).not.toContain('01310-100')
        expect(url).not.toContain('01310100')
      }
    }
  })
})

// ─── geocodeByCity ───────────────────────────────────────────────────────────

describe('geocodeByCity', () => {
  it('retorna coordenadas via Nominatim structured query', async () => {
    mockGoogleDenied()

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{
        lat: '-23.1867',
        lon: '-45.8854',
        display_name: 'São José dos Campos, SP, Brasil',
      }]),
    })

    const result = await geocodeByCity('São José dos Campos', 'SP')

    expect(result).toEqual({
      lat: -23.1867,
      lng: -45.8854,
      formatted_address: 'São José dos Campos, SP, Brasil',
    })

    // Verifica que a segunda chamada (Nominatim) usa structured query
    const nominatimCall = mockFetch.mock.calls.find(
      (c) => (c[0] as string).includes('nominatim')
    )
    expect(nominatimCall).toBeTruthy()
    const url = nominatimCall![0] as string
    expect(url).toContain('city=')
    expect(url).toContain('state=')
    expect(url).toContain('country=Brazil')
  })

  it('retorna null quando Nominatim não encontra a cidade', async () => {
    mockGoogleDenied()

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    })

    const result = await geocodeByCity('Cidade Inexistente', 'XX')
    expect(result).toBeNull()
  })

  it('retorna null quando fetch falha', async () => {
    mockGoogleDenied()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await geocodeByCity('São Paulo', 'SP')
    expect(result).toBeNull()
  })
})
