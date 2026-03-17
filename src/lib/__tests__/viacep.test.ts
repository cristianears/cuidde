import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAddressByCep } from '../viacep'

describe('fetchAddressByCep', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null for CEP with less than 8 digits', async () => {
    const result = await fetchAddressByCep('0100')
    expect(result).toBeNull()
  })

  it('returns null for empty string', async () => {
    const result = await fetchAddressByCep('')
    expect(result).toBeNull()
  })

  it('strips non-digit characters and validates length', async () => {
    const result = await fetchAddressByCep('010-00')
    expect(result).toBeNull()
  })

  it('returns address data for valid CEP', async () => {
    const mockResponse = {
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: 'lado ímpar',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await fetchAddressByCep('01001000')

    expect(result).toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
    expect(fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/')
  })

  it('returns null when ViaCEP returns error flag', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true }),
    } as Response)

    const result = await fetchAddressByCep('99999999')
    expect(result).toBeNull()
  })

  it('returns null when fetch fails (network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await fetchAddressByCep('01001000')
    expect(result).toBeNull()
  })

  it('handles CEP with mask (dashes/dots)', async () => {
    const mockResponse = {
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: '',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await fetchAddressByCep('01001-000')
    expect(result).not.toBeNull()
    expect(result?.city).toBe('São Paulo')
  })
})
