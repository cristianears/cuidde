import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAddressByCep } from '@/lib/viacep'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchAddressByCep', () => {
  it('retorna endereço para CEP válido', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        cep: '12236-063',
        logradouro: 'Rua Ângelo Bravini',
        bairro: 'Jardim Terras do Sul',
        localidade: 'São José dos Campos',
        uf: 'SP',
      }),
    })

    const result = await fetchAddressByCep('12236-063')

    expect(result).toEqual({
      street: 'Rua Ângelo Bravini',
      neighborhood: 'Jardim Terras do Sul',
      city: 'São José dos Campos',
      state: 'SP',
    })
  })

  it('limpa caracteres não-numéricos do CEP', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        cep: '12236-063',
        logradouro: 'Rua X',
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    })

    await fetchAddressByCep('12.236-063')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('/12236063/')
  })

  it('retorna null para CEP com menos de 8 dígitos', async () => {
    const result = await fetchAddressByCep('1234')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('retorna null para CEP inválido (erro da API)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ erro: true }),
    })

    const result = await fetchAddressByCep('00000-000')
    expect(result).toBeNull()
  })

  it('retorna null quando fetch falha', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const result = await fetchAddressByCep('12236-063')
    expect(result).toBeNull()
  })
})
