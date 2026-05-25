import { describe, it, expect } from 'vitest'
import type { SearchFilters } from '@/hooks/useSearchCaregivers'
import { hasFamilyCoordinates, hasLocationTextFilters } from '@/lib/search-filter-logic'

// Testes dos tipos e lógica de filtros de busca (sem Supabase/React)

describe('SearchFilters', () => {
  it('permite filtros vazios (busca sem filtros)', () => {
    const filters: SearchFilters = {}
    expect(filters.query).toBeUndefined()
    expect(filters.familyLat).toBeUndefined()
    expect(filters.familyLng).toBeUndefined()
  })

  it('detecta modo proximidade quando lat/lng presentes', () => {
    const filters: SearchFilters = {
      familyLat: -23.55,
      familyLng: -46.63,
      radiusKm: 20,
    }
    const useProximity = hasFamilyCoordinates(filters)
    expect(useProximity).toBe(true)
  })

  it('não usa proximidade quando lat/lng ausentes', () => {
    const filters: SearchFilters = {
      city: 'São Paulo',
      radiusKm: 20,
    }
    const useProximity = hasFamilyCoordinates(filters)
    expect(useProximity).toBe(false)
  })

  it('permite combinar raio por proximidade com filtros de cidade e bairro', () => {
    const filters: SearchFilters = {
      familyLat: -23.55,
      familyLng: -46.63,
      radiusKm: 20,
      city: 'Sao Jose dos Campos',
      neighborhood: 'Centro',
    }

    expect(hasFamilyCoordinates(filters)).toBe(true)
    expect(hasLocationTextFilters(filters)).toBe(true)
  })

  it('usa DEFAULT_RADIUS_KM quando radiusKm não informado', () => {
    const DEFAULT_RADIUS_KM = 20
    const filters: SearchFilters = {
      familyLat: -23.55,
      familyLng: -46.63,
    }
    const radius = filters.radiusKm ?? DEFAULT_RADIUS_KM
    expect(radius).toBe(20)
  })

  it('respeita radiusKm customizado', () => {
    const DEFAULT_RADIUS_KM = 20
    const filters: SearchFilters = {
      familyLat: -23.55,
      familyLng: -46.63,
      radiusKm: 5,
    }
    const radius = filters.radiusKm ?? DEFAULT_RADIUS_KM
    expect(radius).toBe(5)
  })

  it('suporta filtros de preço', () => {
    const filters: SearchFilters = {
      minPrice: 30,
      maxPrice: 100,
    }
    expect(filters.minPrice).toBe(30)
    expect(filters.maxPrice).toBe(100)
  })

  it('suporta filtros de modalidades e idiomas', () => {
    const filters: SearchFilters = {
      modalities: ['presencial', 'online'],
      idiomas: ['Português', 'Inglês'],
    }
    expect(filters.modalities).toHaveLength(2)
    expect(filters.idiomas).toHaveLength(2)
  })
})

// ─── Haversine distance (mesma fórmula do banco) ────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

describe('haversineDistance (client-side replica)', () => {
  it('retorna 0 para mesmo ponto', () => {
    const d = haversineDistance(-23.55, -46.63, -23.55, -46.63)
    expect(d).toBeCloseTo(0, 5)
  })

  it('calcula distância correta entre São Paulo e Rio de Janeiro (~357km)', () => {
    const d = haversineDistance(-23.5505, -46.6333, -22.9068, -43.1729)
    expect(d).toBeGreaterThan(350)
    expect(d).toBeLessThan(370)
  })

  it('calcula distância correta entre CEPs de teste (~7.5km)', () => {
    // CEP 12236-063 (Rua Ângelo Bravini, SJC)
    // CEP 12244-523 (Rua Eudócio de Paula, SJC)
    const d = haversineDistance(-23.2465461, -45.8953850, -23.1982923, -45.9474795)
    expect(d).toBeGreaterThan(7)
    expect(d).toBeLessThan(8)
  })

  it('filtro de raio 5km exclui cuidador a 7.5km', () => {
    const d = haversineDistance(-23.2465461, -45.8953850, -23.1982923, -45.9474795)
    expect(d <= 5).toBe(false)
  })

  it('filtro de raio 10km inclui cuidador a 7.5km', () => {
    const d = haversineDistance(-23.2465461, -45.8953850, -23.1982923, -45.9474795)
    expect(d <= 10).toBe(true)
  })
})
